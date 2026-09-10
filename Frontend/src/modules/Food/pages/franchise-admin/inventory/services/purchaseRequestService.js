import { mockIngredients, mockPurchaseRequests, mockPurchaseRequestItems } from "../mockData";
import { initialStores, initialManagers } from "../../storeManagement/mockStoresData";

const PRS_STORAGE_KEY = "mock_db_purchase_requests";
const PR_ITEMS_STORAGE_KEY = "mock_db_purchase_request_items";
const PR_AUDIT_STORAGE_KEY = "mock_db_purchase_request_audit";
const STOCKS_STORAGE_KEY = "mock_db_inventory_stock";
const TXNS_STORAGE_KEY = "mock_db_inventory_transactions";
const ALERTS_STORAGE_KEY = "mock_db_low_stock_alerts";

let requests = [];
let requestItems = [];
let auditLogs = [];

// Initialize databases
try {
  const cachedPRs = localStorage.getItem(PRS_STORAGE_KEY);
  requests = cachedPRs ? JSON.parse(cachedPRs) : [];
  if (requests.length === 0) {
    requests = [...mockPurchaseRequests];
    localStorage.setItem(PRS_STORAGE_KEY, JSON.stringify(requests));
  }

  const cachedItems = localStorage.getItem(PR_ITEMS_STORAGE_KEY);
  requestItems = cachedItems ? JSON.parse(cachedItems) : [];
  if (requestItems.length === 0) {
    requestItems = [...mockPurchaseRequestItems];
    localStorage.setItem(PR_ITEMS_STORAGE_KEY, JSON.stringify(requestItems));
  }

  const cachedAudit = localStorage.getItem(PR_AUDIT_STORAGE_KEY);
  auditLogs = cachedAudit ? JSON.parse(cachedAudit) : [];
  if (auditLogs.length === 0) {
    // Generate initial audit logs based on seed requests
    requests.forEach(r => {
      auditLogs.push({
        _id: `aud-${r._id}-1`,
        requestId: r._id,
        type: "STATUS_CHANGE",
        title: "Request Created",
        description: `Purchase request created in ${r.status.toUpperCase()} status.`,
        performedBy: r.requestedBy === "mgr-1" ? "Subham Jamliya" : r.requestedBy === "mgr-2" ? "Rashid Khan" : "Aarav Sharma",
        createdAt: r.createdAt
      });
      if (r.status !== "Draft" && r.status !== "Pending") {
        auditLogs.push({
          _id: `aud-${r._id}-2`,
          requestId: r._id,
          type: "STATUS_CHANGE",
          title: "Request Approved",
          description: `Purchase request approved by franchise admin.`,
          performedBy: "Franchise Admin",
          createdAt: r.approvedAt
        });
      }
      if (r.status === "Received") {
        auditLogs.push({
          _id: `aud-${r._id}-3`,
          requestId: r._id,
          type: "STATUS_CHANGE",
          title: "Goods Received",
          description: `All approved inventory items physically received at store.`,
          performedBy: "Franchise Admin",
          createdAt: r.approvedAt // approx received date
        });
      }
    });
    localStorage.setItem(PR_AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
  }
} catch (e) {
  requests = [...mockPurchaseRequests];
  requestItems = [...mockPurchaseRequestItems];
}

const saveToStorage = () => {
  try {
    localStorage.setItem(PRS_STORAGE_KEY, JSON.stringify(requests));
    localStorage.setItem(PR_ITEMS_STORAGE_KEY, JSON.stringify(requestItems));
    localStorage.setItem(PR_AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
  } catch (err) {
    console.error("Failed to persist purchase requests database", err);
  }
};

const listeners = new Set();
export function subscribeToPRChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function notifyListeners() {
  listeners.forEach((cb) => cb());
  window.dispatchEvent(new Event("purchase_requests_updated"));
}

export const purchaseRequestService = {
  getRequests: async (params = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const {
      search = "",
      status = "", // Draft, Pending, Approved, Rejected, Ordered, Received
      storeId = "", // comma-separated stores
      priority = "", // Low, Medium, High, Urgent
      startDate = "",
      endDate = "",
      requestedBy = "",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = params;

    const cachedStores = localStorage.getItem("mock_db_stores");
    const storesList = cachedStores ? JSON.parse(cachedStores) : [...initialStores];

    const cachedIngredients = localStorage.getItem("mock_db_ingredients");
    const ingredientsList = cachedIngredients ? JSON.parse(cachedIngredients) : [...mockIngredients];

    // Join requests with store, requestedBy, items list
    let result = requests.map(r => {
      const storeObj = storesList.find(s => s._id === r.storeId) || {
        storeName: "Unknown Store",
        storeCode: "PVP-UNK"
      };

      const requester = initialManagers.find(m => m.id === r.requestedBy) || {
        name: r.requestedBy || "Store Manager",
        email: ""
      };

      const items = requestItems.filter(item => item.requestId === r._id).map(item => {
        const ing = ingredientsList.find(i => i._id === item.ingredientId) || {
          name: "Unknown Material",
          ingredientCode: "ING-UNK",
          unit: "Units"
        };
        return {
          ...item,
          ingredient: ing
        };
      });

      return {
        ...r,
        storeName: storeObj.storeName,
        storeCode: storeObj.storeCode,
        requesterName: requester.name,
        requesterEmail: requester.email,
        items
      };
    });

    // 1. Search (Request number, store name, ingredient name)
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(r => 
        r.requestNumber.toLowerCase().includes(q) ||
        r.storeName.toLowerCase().includes(q) ||
        r.items.some(item => item.ingredient.name.toLowerCase().includes(q))
      );
    }

    // 2. Status
    if (status && status !== "ALL" && status !== "all") {
      result = result.filter(r => r.status.toUpperCase() === status.toUpperCase());
    }

    // 3. Store multi-select
    if (storeId && storeId !== "all" && storeId !== "ALL") {
      const selectedStoreIds = Array.isArray(storeId)
        ? storeId
        : typeof storeId === "string"
          ? storeId.split(",").filter(Boolean)
          : [storeId];
      if (selectedStoreIds.length > 0) {
        result = result.filter(r => selectedStoreIds.includes(r.storeId));
      }
    }

    // 4. Priority
    if (priority && priority !== "ALL" && priority !== "all") {
      result = result.filter(r => r.priority.toUpperCase() === priority.toUpperCase());
    }

    // 5. Requested By
    if (requestedBy) {
      result = result.filter(r => r.requestedBy === requestedBy);
    }

    // 6. Created Date Range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.createdAt) <= end);
    }

    // Metrics based on overall matching requests
    const pendingRequestsCount = result.filter(r => r.status === "Pending").length;
    const approvedRequestsCount = result.filter(r => r.status === "Approved" || r.status === "Ordered").length;
    const receivedRequestsCount = result.filter(r => r.status === "Received").length;
    const totalPurchaseValue = result.reduce((sum, r) => sum + r.totalAmount, 0);

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Pagination
    const totalCount = result.length;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + Number(limit));

    return {
      success: true,
      data: paginated,
      totalCount,
      metrics: {
        pendingRequestsCount,
        approvedRequestsCount,
        receivedRequestsCount,
        totalPurchaseValue
      }
    };
  },

  getRequestById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const request = requests.find(r => r._id === id);
    if (!request) throw new Error("Purchase request not found");

    const cachedStores = localStorage.getItem("mock_db_stores");
    const storesList = cachedStores ? JSON.parse(cachedStores) : [...initialStores];

    const cachedIngredients = localStorage.getItem("mock_db_ingredients");
    const ingredientsList = cachedIngredients ? JSON.parse(cachedIngredients) : [...mockIngredients];

    const storeObj = storesList.find(s => s._id === request.storeId) || {
      storeName: "Unknown Store",
      storeCode: "PVP-UNK"
    };

    const requester = initialManagers.find(m => m.id === request.requestedBy) || {
      name: request.requestedBy || "Store Manager"
    };

    const items = requestItems.filter(item => item.requestId === id).map(item => {
      const ing = ingredientsList.find(i => i._id === item.ingredientId) || {
        name: "Unknown Material",
        ingredientCode: "ING-UNK",
        unit: "Units",
        costPerUnit: 0
      };
      return {
        ...item,
        ingredient: ing
      };
    });

    const requestAudit = auditLogs.filter(log => log.requestId === id);
    requestAudit.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      data: {
        ...request,
        storeName: storeObj.storeName,
        storeCode: storeObj.storeCode,
        requesterName: requester.name,
        items,
        timeline: requestAudit
      }
    };
  },

  createRequest: async (payload) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { storeId, priority, remarks, items, status = "Pending", requestedBy = "mgr-1" } = payload;

    const prId = `pr-${Date.now()}`;
    const prNumber = `PR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    let calculatedTotal = 0;
    const newItems = items.map((item, idx) => {
      const lineTotal = Number(item.requestedQty) * Number(item.unitPrice);
      calculatedTotal += lineTotal;

      return {
        _id: `pri-${Date.now()}-${idx}`,
        requestId: prId,
        ingredientId: item.ingredientId,
        requestedQty: Number(item.requestedQty),
        approvedQty: 0,
        unitPrice: Number(item.unitPrice),
        totalPrice: lineTotal
      };
    });

    const newRequest = {
      _id: prId,
      requestNumber: prNumber,
      storeId,
      requestedBy,
      status,
      priority,
      totalAmount: calculatedTotal,
      remarks,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString()
    };

    requests.unshift(newRequest);
    requestItems.push(...newItems);

    const requester = initialManagers.find(m => m.id === requestedBy);
    auditLogs.push({
      _id: `aud-${prId}-${Date.now()}`,
      requestId: prId,
      type: "STATUS_CHANGE",
      title: status === "Draft" ? "Draft Saved" : "Request Submitted",
      description: status === "Draft" ? "Purchase request draft saved." : "Purchase request submitted for franchise approval.",
      performedBy: requester ? requester.name : "Store Manager",
      createdAt: new Date().toISOString()
    });

    saveToStorage();
    notifyListeners();

    return { success: true, data: newRequest };
  },

  approveRequest: async (payload) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { requestId, approvedItems, vendorId, expectedDeliveryDate, remarks } = payload;

    const idx = requests.findIndex(r => r._id === requestId);
    if (idx === -1) throw new Error("Purchase request not found");

    const pr = requests[idx];
    let calculatedTotal = 0;

    // Update items approvedQty
    approvedItems.forEach(approvedItem => {
      const itemIdx = requestItems.findIndex(ri => ri.requestId === requestId && ri.ingredientId === approvedItem.ingredientId);
      if (itemIdx !== -1) {
        const item = requestItems[itemIdx];
        const approvedQty = Number(approvedItem.approvedQty);
        const totalPrice = approvedQty * item.unitPrice;
        calculatedTotal += totalPrice;

        requestItems[itemIdx] = {
          ...item,
          approvedQty,
          totalPrice
        };
      }
    });

    // Update request details
    requests[idx] = {
      ...pr,
      status: "Approved",
      totalAmount: calculatedTotal,
      approvedBy: "Franchise Admin",
      approvedAt: new Date().toISOString(),
      vendorId,
      expectedDeliveryDate,
      approvalRemarks: remarks
    };

    // Log audit trail
    auditLogs.push({
      _id: `aud-${requestId}-${Date.now()}`,
      requestId,
      type: "STATUS_CHANGE",
      title: "Request Approved",
      description: `Request approved. Expected delivery: ${new Date(expectedDeliveryDate).toLocaleDateString("en-IN")}. Remarks: "${remarks}"`,
      performedBy: "Franchise Admin",
      createdAt: new Date().toISOString()
    });

    saveToStorage();
    notifyListeners();

    // Trigger low stock alert check/update if status changes to Approved
    // We can also trigger notification event
    return { success: true, data: requests[idx] };
  },

  rejectRequest: async (payload) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { requestId, rejectionReason, comments } = payload;

    const idx = requests.findIndex(r => r._id === requestId);
    if (idx === -1) throw new Error("Purchase request not found");

    const pr = requests[idx];
    requests[idx] = {
      ...pr,
      status: "Rejected",
      approvedBy: "Franchise Admin",
      approvedAt: new Date().toISOString(),
      rejectionReason,
      rejectionComments: comments
    };

    auditLogs.push({
      _id: `aud-${requestId}-${Date.now()}`,
      requestId,
      type: "STATUS_CHANGE",
      title: "Request Rejected",
      description: `Request rejected. Reason: ${rejectionReason}. Comments: "${comments}"`,
      performedBy: "Franchise Admin",
      createdAt: new Date().toISOString()
    });

    saveToStorage();
    notifyListeners();

    return { success: true, data: requests[idx] };
  },

  markReceived: async (payload) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { requestId, deliveryDate, vendorId, invoiceNumber, receivedItems, remarks } = payload;

    const idx = requests.findIndex(r => r._id === requestId);
    if (idx === -1) throw new Error("Purchase request not found");

    const pr = requests[idx];
    
    // Update items to log received vs approved variance
    receivedItems.forEach(item => {
      const itemIdx = requestItems.findIndex(ri => ri.requestId === requestId && ri.ingredientId === item.ingredientId);
      if (itemIdx !== -1) {
        requestItems[itemIdx] = {
          ...requestItems[itemIdx],
          receivedQty: Number(item.receivedQty),
          variance: Number(item.receivedQty) - requestItems[itemIdx].approvedQty
        };
      }
    });

    requests[idx] = {
      ...pr,
      status: "Received",
      receivedAt: deliveryDate,
      invoiceNumber,
      receivingRemarks: remarks,
      updatedBy: "Franchise Admin"
    };

    // Audit logs
    auditLogs.push({
      _id: `aud-${requestId}-${Date.now()}`,
      requestId,
      type: "STATUS_CHANGE",
      title: "Goods Received & Stocks Replenished",
      description: `Goods physically received under Invoice: ${invoiceNumber}. Remarks: "${remarks}"`,
      performedBy: "Franchise Admin",
      createdAt: new Date().toISOString()
    });

    // CRITICAL STEPS:
    // 1. Replenish physical stock in mock_db_inventory_stock
    try {
      const cachedStocks = localStorage.getItem(STOCKS_STORAGE_KEY);
      const stocksList = cachedStocks ? JSON.parse(cachedStocks) : [];

      const cachedTxns = localStorage.getItem(TXNS_STORAGE_KEY);
      const txnsList = cachedTxns ? JSON.parse(cachedTxns) : [];

      receivedItems.forEach(item => {
        const qty = Number(item.receivedQty);
        if (qty <= 0) return;

        const stockIdx = stocksList.findIndex(s => s.ingredientId === item.ingredientId && s.storeId === pr.storeId);
        if (stockIdx !== -1) {
          const oldStock = stocksList[stockIdx];
          const newCurrent = oldStock.currentStock + qty;
          const newAvailable = newCurrent - oldStock.reservedStock;

          stocksList[stockIdx] = {
            ...oldStock,
            currentStock: newCurrent,
            availableStock: newAvailable,
            lastUpdated: new Date().toISOString(),
            updatedBy: "Franchise Admin"
          };

          // Append to stock ledger history
          txnsList.unshift({
            _id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            storeId: pr.storeId,
            ingredientId: item.ingredientId,
            type: "Purchase",
            quantity: qty,
            previousStock: oldStock.currentStock,
            newStock: newCurrent,
            reason: `Procurement replenishment - Invoice ${invoiceNumber}`,
            referenceId: invoiceNumber || pr.requestNumber,
            createdBy: "Franchise Admin",
            createdAt: new Date().toISOString()
          });
        }
      });

      localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocksList));
      localStorage.setItem(TXNS_STORAGE_KEY, JSON.stringify(txnsList));
      
      // Dispatch custom event for stocks reload
      window.dispatchEvent(new Event("stock_levels_updated"));
    } catch (err) {
      console.error("Failed to update stocks during goods receipt execution", err);
    }

    // 2. Automatically close low stock alerts for resolved items!
    try {
      const cachedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
      const alertsList = cachedAlerts ? JSON.parse(cachedAlerts) : [];

      let alertUpdated = false;
      receivedItems.forEach(item => {
        const alertIdx = alertsList.findIndex(alt => alt.ingredientId === item.ingredientId && alt.storeId === pr.storeId && alt.status === "OPEN");
        if (alertIdx !== -1) {
          alertsList[alertIdx] = {
            ...alertsList[alertIdx],
            status: "RESOLVED",
            resolvedAt: new Date().toISOString(),
            resolvedBy: "Franchise Admin",
            resolutionType: "Purchase Ordered",
            referenceNumber: invoiceNumber || pr.requestNumber,
            quantityAdded: Number(item.receivedQty),
            notes: `Alert auto-closed via receipt of purchase request ${pr.requestNumber}.`
          };
          alertUpdated = true;
        }
      });

      if (alertUpdated) {
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alertsList));
        window.dispatchEvent(new Event("low_stock_alerts_updated"));
      }
    } catch (err) {
      console.error("Failed to auto-close low stock alerts", err);
    }

    saveToStorage();
    notifyListeners();

    return { success: true, data: requests[idx] };
  }
};
