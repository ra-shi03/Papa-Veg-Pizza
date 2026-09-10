import { mockIngredients, mockLowStockAlerts } from "../mockData";
import { initialStores, initialManagers } from "../../storeManagement/mockStoresData";

const ALERTS_STORAGE_KEY = "mock_db_low_stock_alerts";
const STOCKS_STORAGE_KEY = "mock_db_inventory_stock";
const TXNS_STORAGE_KEY = "mock_db_inventory_transactions";
const PURCHASE_REQS_STORAGE_KEY = "mock_db_purchase_requests";
const ALERT_TIMELINE_STORAGE_KEY = "mock_db_alert_timeline";

let alerts = [];
let timelineEvents = [];

// Initialize databases
try {
  const cachedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
  alerts = cachedAlerts ? JSON.parse(cachedAlerts) : [];
  if (alerts.length === 0) {
    alerts = [...mockLowStockAlerts];
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }

  const cachedTimeline = localStorage.getItem(ALERT_TIMELINE_STORAGE_KEY);
  timelineEvents = cachedTimeline ? JSON.parse(cachedTimeline) : [];
  if (timelineEvents.length === 0) {
    // Generate default timeline events for each alert
    alerts.forEach(alt => {
      timelineEvents.push({
        _id: `tme-${alt._id}-1`,
        alertId: alt._id,
        type: "CREATED",
        title: "Alert Created Automatically",
        description: `System detected stock (${alt.currentStock} units) fell below reorder level (${alt.reorderLevel} units).`,
        performedBy: alt.createdBy || "System",
        createdAt: alt.createdAt
      });
      if (alt.assignedTo) {
        const mgr = initialManagers.find(m => m.id === alt.assignedTo);
        timelineEvents.push({
          _id: `tme-${alt._id}-2`,
          alertId: alt._id,
          type: "ASSIGNED",
          title: "Responsibility Assigned",
          description: `Assigned responsibility to ${mgr ? mgr.name : alt.assignedTo}.`,
          performedBy: "System",
          createdAt: alt.createdAt
        });
      }
      if (alt.status === "RESOLVED") {
        timelineEvents.push({
          _id: `tme-${alt._id}-3`,
          alertId: alt._id,
          type: "RESOLVED",
          title: "Alert Resolved",
          description: alt.notes || "Low stock alert resolved successfully.",
          performedBy: alt.updatedBy || "Franchise Admin",
          createdAt: alt.resolvedAt || new Date().toISOString()
        });
      }
    });
    localStorage.setItem(ALERT_TIMELINE_STORAGE_KEY, JSON.stringify(timelineEvents));
  }
} catch (e) {
  alerts = [...mockLowStockAlerts];
}

const saveAlertsToStorage = () => {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    localStorage.setItem(ALERT_TIMELINE_STORAGE_KEY, JSON.stringify(timelineEvents));
  } catch (err) {
    console.error("Failed to persist low stock alerts database", err);
  }
};

const listeners = new Set();
export function subscribeToAlertChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function notifyListeners() {
  listeners.forEach((cb) => cb());
  // Dispatch custom event for real-time synchronization across windows
  window.dispatchEvent(new Event("low_stock_alerts_updated"));
}

export const alertService = {
  getUsers: async () => {
    // Return managers as users
    return { success: true, data: initialManagers };
  },

  getAlerts: async (params = {}) => {
    // Artificial latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    const {
      search = "",
      storeId = "", // comma-separated or array
      severity = "ALL", // ALL, Low, Critical
      status = "ALL", // ALL, Open, Resolved
      assignedTo = "",
      startDate = "",
      endDate = "",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = params;

    const cachedStores = localStorage.getItem("mock_db_stores");
    const storesList = cachedStores ? JSON.parse(cachedStores) : [...initialStores];

    const cachedIngredients = localStorage.getItem("mock_db_ingredients");
    const ingredientsList = cachedIngredients ? JSON.parse(cachedIngredients) : [...mockIngredients];

    // Join alert data with stores, ingredients, and assigned users
    let result = alerts.map((alt) => {
      const ingredient = ingredientsList.find((i) => i._id === alt.ingredientId) || {
        name: "Unknown Ingredient",
        ingredientCode: "ING-UNK",
        sku: "N/A",
        unit: "Units",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80"
      };

      const storeObj = storesList.find((s) => s._id === alt.storeId) || {
        storeName: "Unknown Store",
        storeCode: "PVP-UNK"
      };

      const userObj = initialManagers.find((m) => m.id === alt.assignedTo) || {
        name: alt.assignedTo || "Unassigned",
        email: ""
      };

      return {
        ...alt,
        ingredient,
        storeName: storeObj.storeName,
        storeCode: storeObj.storeCode,
        assignedUser: userObj
      };
    });

    // 1. Search filter (Ingredient name, code, sku)
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (alt) =>
          alt.ingredient.name.toLowerCase().includes(q) ||
          alt.ingredient.ingredientCode.toLowerCase().includes(q) ||
          (alt.ingredient.sku && alt.ingredient.sku.toLowerCase().includes(q))
      );
    }

    // 2. Store multi-select filter
    if (storeId && storeId !== "all" && storeId !== "ALL") {
      const selectedStoreIds = Array.isArray(storeId)
        ? storeId
        : typeof storeId === "string"
          ? storeId.split(",").filter(Boolean)
          : [storeId];
      if (selectedStoreIds.length > 0) {
        result = result.filter((alt) => selectedStoreIds.includes(alt.storeId));
      }
    }

    // 3. Severity filter
    if (severity && severity !== "ALL" && severity !== "all") {
      result = result.filter((alt) => alt.severity.toUpperCase() === severity.toUpperCase());
    }

    // 4. Status filter
    if (status && status !== "ALL" && status !== "all") {
      result = result.filter((alt) => alt.status.toUpperCase() === status.toUpperCase());
    }

    // 5. Assigned User filter
    if (assignedTo && assignedTo !== "all" && assignedTo !== "ALL") {
      result = result.filter((alt) => alt.assignedTo === assignedTo);
    }

    // 6. Created Date Range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((alt) => new Date(alt.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((alt) => new Date(alt.createdAt) <= end);
    }

    // Compute Bento KPI counts (based on overall alerts before pagination)
    const openAlerts = result.filter(alt => alt.status === "OPEN" || alt.status === "PURCHASE REQUEST CREATED" || alt.status === "IN PROGRESS");
    const openAlertsCount = openAlerts.length;
    const criticalAlertsCount = result.filter(alt => alt.severity === "CRITICAL").length;
    const resolvedAlertsCount = result.filter(alt => alt.status === "RESOLVED").length;
    
    const activeStoreIds = new Set(openAlerts.map(alt => alt.storeId));
    const storesAffectedCount = activeStoreIds.size;

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "ingredient") {
        valA = a.ingredient.name;
        valB = b.ingredient.name;
      } else if (sortBy === "store") {
        valA = a.storeName;
        valB = b.storeName;
      }

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
        openAlertsCount,
        criticalAlertsCount,
        resolvedAlertsCount,
        storesAffectedCount
      }
    };
  },

  getAlertById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const alert = alerts.find(a => a._id === id);
    if (!alert) throw new Error("Alert not found");

    const cachedStores = localStorage.getItem("mock_db_stores");
    const storesList = cachedStores ? JSON.parse(cachedStores) : [...initialStores];

    const cachedIngredients = localStorage.getItem("mock_db_ingredients");
    const ingredientsList = cachedIngredients ? JSON.parse(cachedIngredients) : [...mockIngredients];

    const ingredient = ingredientsList.find((i) => i._id === alert.ingredientId) || {
      name: "Unknown Ingredient",
      ingredientCode: "ING-UNK",
      sku: "N/A",
      unit: "Units",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80"
    };

    const storeObj = storesList.find((s) => s._id === alert.storeId) || {
      storeName: "Unknown Store",
      storeCode: "PVP-UNK"
    };

    const userObj = initialManagers.find((m) => m.id === alert.assignedTo) || {
      name: alert.assignedTo || "Unassigned"
    };

    const alertTimeline = timelineEvents.filter(t => t.alertId === id);
    alertTimeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      data: {
        ...alert,
        ingredient,
        storeName: storeObj.storeName,
        storeCode: storeObj.storeCode,
        assignedUser: userObj,
        timeline: alertTimeline
      }
    };
  },

  updateAlert: async (id, updates) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = alerts.findIndex((a) => a._id === id);
    if (index === -1) throw new Error("Alert not found");

    const oldAlert = alerts[index];
    const updated = {
      ...oldAlert,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    alerts[index] = updated;

    // Timeline event for update
    if (updates.assignedTo && updates.assignedTo !== oldAlert.assignedTo) {
      const mgr = initialManagers.find(m => m.id === updates.assignedTo);
      timelineEvents.push({
        _id: `tme-${id}-${Date.now()}`,
        alertId: id,
        type: "ASSIGNED",
        title: "Responsibility Reassigned",
        description: `Reassigned responsibility to ${mgr ? mgr.name : updates.assignedTo}.`,
        performedBy: "Franchise Admin",
        createdAt: new Date().toISOString()
      });
    }

    if (updates.notes !== undefined && updates.notes !== oldAlert.notes) {
      timelineEvents.push({
        _id: `tme-${id}-${Date.now()}`,
        alertId: id,
        type: "COMMENT",
        title: "Notes Updated",
        description: `Notes updated: "${updates.notes}"`,
        performedBy: "Franchise Admin",
        createdAt: new Date().toISOString()
      });
    }

    saveAlertsToStorage();
    notifyListeners();
    return { success: true, data: updated };
  },

  resolveAlert: async (payload) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const {
      alertId,
      resolutionType,
      referenceNumber = "",
      quantityAdded = 0,
      remarks,
      attachment = null,
      assignedTo
    } = payload;

    const index = alerts.findIndex((a) => a._id === alertId);
    if (index === -1) throw new Error("Alert not found");

    const alert = alerts[index];
    const qtyToAdd = Number(quantityAdded);

    // 1. Update alert
    alerts[index] = {
      ...alert,
      status: "RESOLVED",
      notes: remarks,
      assignedTo: assignedTo || alert.assignedTo,
      resolvedAt: new Date().toISOString(),
      updatedBy: "Franchise Admin",
      resolvedBy: "Franchise Admin",
      resolutionType,
      referenceNumber,
      quantityAdded: qtyToAdd
    };

    // 2. Add Timeline Event
    timelineEvents.push({
      _id: `tme-${alertId}-${Date.now()}`,
      alertId,
      type: "RESOLVED",
      title: `Alert Resolved via ${resolutionType}`,
      description: `Replenished ${qtyToAdd} units. Reference: ${referenceNumber || "N/A"}. Remarks: "${remarks}"`,
      performedBy: "Franchise Admin",
      createdAt: new Date().toISOString()
    });

    // 3. Update stock levels in localStorage if quantity was added
    if (qtyToAdd > 0) {
      try {
        const cachedStocks = localStorage.getItem(STOCKS_STORAGE_KEY);
        const stocksList = cachedStocks ? JSON.parse(cachedStocks) : [];
        const stockIndex = stocksList.findIndex(s => s.ingredientId === alert.ingredientId && s.storeId === alert.storeId);
        
        if (stockIndex !== -1) {
          const oldStock = stocksList[stockIndex];
          const newCurrent = oldStock.currentStock + qtyToAdd;
          const newAvailable = newCurrent - oldStock.reservedStock;

          stocksList[stockIndex] = {
            ...oldStock,
            currentStock: newCurrent,
            availableStock: newAvailable,
            lastUpdated: new Date().toISOString(),
            updatedBy: "Franchise Admin"
          };
          localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocksList));

          // Log transaction in stock ledger
          const cachedTxns = localStorage.getItem(TXNS_STORAGE_KEY);
          const txnsList = cachedTxns ? JSON.parse(cachedTxns) : [];
          txnsList.unshift({
            _id: `txn-${Date.now()}`,
            storeId: alert.storeId,
            ingredientId: alert.ingredientId,
            type: "Adjustment",
            quantity: qtyToAdd,
            previousStock: oldStock.currentStock,
            newStock: newCurrent,
            reason: `Alert Resolution - ${resolutionType}: ${remarks}`,
            referenceId: referenceNumber || `ALT-RES-${alertId.slice(-4)}`,
            createdBy: "Franchise Admin",
            createdAt: new Date().toISOString()
          });
          localStorage.setItem(TXNS_STORAGE_KEY, JSON.stringify(txnsList));
        }
      } catch (err) {
        console.error("Failed to update stock levels on alert resolution", err);
      }
    }

    saveAlertsToStorage();
    notifyListeners();
    
    // Dispatch custom event for stocks refresh
    window.dispatchEvent(new Event("stock_levels_updated"));

    return { success: true, data: alerts[index] };
  },

  createPurchaseRequest: async (payload) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const {
      alertId,
      ingredientId,
      storeId,
      suggestedQuantity,
      supplierId,
      estimatedCost
    } = payload;

    // Create purchase request record
    let prs = [];
    try {
      const cached = localStorage.getItem(PURCHASE_REQS_STORAGE_KEY);
      prs = cached ? JSON.parse(cached) : [];
    } catch (e) {}

    const newPR = {
      _id: `pr-${Date.now()}`,
      alertId,
      ingredientId,
      storeId,
      requestedQuantity: Number(suggestedQuantity),
      supplierId,
      estimatedCost: Number(estimatedCost),
      status: "PENDING",
      createdBy: "Franchise Admin",
      createdAt: new Date().toISOString()
    };
    prs.push(newPR);
    localStorage.setItem(PURCHASE_REQS_STORAGE_KEY, JSON.stringify(prs));

    // Update alert status
    const index = alerts.findIndex((a) => a._id === alertId);
    if (index !== -1) {
      alerts[index] = {
        ...alerts[index],
        status: "PURCHASE REQUEST CREATED",
        updatedAt: new Date().toISOString()
      };

      // Add timeline entry
      timelineEvents.push({
        _id: `tme-${alertId}-${Date.now()}`,
        alertId,
        type: "PURCHASE_ORDER",
        title: "Purchase Request Created",
        description: `Created purchase request for ${suggestedQuantity} units. Cost: ₹${estimatedCost}. Status: PENDING.`,
        performedBy: "Franchise Admin",
        createdAt: new Date().toISOString()
      });
    }

    saveAlertsToStorage();
    notifyListeners();
    return { success: true, data: newPR };
  },

  getConsumptionTrend: async (ingredientId, storeId) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    
    const numericId = ingredientId ? parseInt(ingredientId.replace(/\D/g, "") || "5") : 5;
    const baseVal = Math.max(1, Math.min(20, numericId * 1.5));
    
    const dailyTrend = [];
    const today = new Date();
    let totalQty = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const variance = Math.sin(i + numericId) * (baseVal * 0.3);
      const consumed = Math.max(0.5, parseFloat((baseVal + variance).toFixed(1)));
      
      dailyTrend.push({
        date: formattedDate,
        quantity: consumed
      });
      totalQty += consumed;
    }

    const averageUsage = parseFloat((totalQty / 7).toFixed(1));

    return {
      success: true,
      data: {
        trend: dailyTrend,
        metrics: {
          consumedQuantity: totalQty,
          averageUsage,
          projectedDepletion: Math.ceil(15 / (averageUsage || 1))
        }
      }
    };
  }
};
