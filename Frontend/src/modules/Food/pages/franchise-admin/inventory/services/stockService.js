import {
  mockIngredients,
  mockInventoryStocks,
  mockInventoryTransactions
} from "../mockData";
import { initialStores } from "../../storeManagement/mockStoresData";

const STOCKS_STORAGE_KEY = "mock_db_inventory_stock";
const TXNS_STORAGE_KEY = "mock_db_inventory_transactions";

let stocks = [];
let transactions = [];

// Initialize databases
try {
  const cachedStocks = localStorage.getItem(STOCKS_STORAGE_KEY);
  stocks = cachedStocks ? JSON.parse(cachedStocks) : [];
  
  const cachedTxns = localStorage.getItem(TXNS_STORAGE_KEY);
  transactions = cachedTxns ? JSON.parse(cachedTxns) : [];

  // Seed default stocks if missing
  if (stocks.length === 0) {
    stocks = [...mockInventoryStocks];
    localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocks));
  }

  // Seed default transactions if missing
  if (transactions.length === 0) {
    transactions = [...mockInventoryTransactions];
    localStorage.setItem(TXNS_STORAGE_KEY, JSON.stringify(transactions));
  }
} catch (e) {
  stocks = [...mockInventoryStocks];
  transactions = [...mockInventoryTransactions];
}

const saveToStorage = () => {
  try {
    localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocks));
    localStorage.setItem(TXNS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error("Failed to persist stock levels databases", err);
  }
};

const listeners = new Set();
export function subscribeToStockChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export const stockService = {
  getStores: async () => {
    const cachedStores = localStorage.getItem("mock_db_stores");
    const storesList = cachedStores ? JSON.parse(cachedStores) : [...initialStores];
    return { success: true, data: storesList.filter(s => s.status === "Active") };
  },

  getStocks: async (params = {}) => {
    // Artificial latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    const {
      search = "",
      storeId = "", // can be comma-separated list
      category = "",
      status = "",
      page = 1,
      limit = 10,
      sortBy = "lastUpdated",
      sortOrder = "desc"
    } = params;

    const cachedStores = localStorage.getItem("mock_db_stores");
    const storesList = cachedStores ? JSON.parse(cachedStores) : [...initialStores];

    const cachedIngredients = localStorage.getItem("mock_db_ingredients");
    const ingredientsList = cachedIngredients ? JSON.parse(cachedIngredients) : [...mockIngredients];

    // Helper to calculate status dynamically
    const calculateStatus = (available, reorder) => {
      if (available === 0) return "OUT_OF_STOCK";
      if (available < reorder * 0.5) return "CRITICAL";
      if (available < reorder) return "LOW";
      return "HEALTHY";
    };

    let result = stocks.map((stk) => {
      const ingredient = ingredientsList.find((i) => i._id === stk.ingredientId) || {
        name: "Unknown Material",
        ingredientCode: "ING-UNK",
        sku: "N/A",
        category: "Other",
        costPerUnit: 0,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80"
      };

      const storeObj = storesList.find((s) => s._id === stk.storeId) || {
        storeName: "Unknown Store",
        storeCode: "PVP-UNK"
      };

      const dynamicStatus = calculateStatus(stk.availableStock, stk.reorderLevel);

      return {
        ...stk,
        ingredient,
        storeName: storeObj.storeName,
        storeCode: storeObj.storeCode,
        status: dynamicStatus,
        stockValue: stk.availableStock * ingredient.costPerUnit
      };
    });

    // 1. Filter by search (ingredient name, code, sku)
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (stk) =>
          stk.ingredient.name.toLowerCase().includes(q) ||
          stk.ingredient.ingredientCode.toLowerCase().includes(q) ||
          (stk.ingredient.sku && stk.ingredient.sku.toLowerCase().includes(q))
      );
    }

    // 2. Filter by stores (supports multi-select)
    if (storeId && storeId !== "all" && storeId !== "ALL") {
      const selectedStoreIds = Array.isArray(storeId) 
        ? storeId 
        : typeof storeId === "string" 
          ? storeId.split(",").filter(Boolean) 
          : [storeId];
      if (selectedStoreIds.length > 0) {
        result = result.filter((stk) => selectedStoreIds.includes(stk.storeId));
      }
    }

    // 3. Filter by category
    if (category && category !== "all" && category !== "ALL_CATEGORIES") {
      result = result.filter((stk) => stk.ingredient.category.toUpperCase() === category.toUpperCase());
    }

    // 4. Filter by stock status
    if (status && status !== "all" && status !== "ALL") {
      result = result.filter((stk) => stk.status.toUpperCase() === status.toUpperCase());
    }

    // Compute global metrics of the filtered/overall set for cards
    // To make cards represent overall status or currently filtered subset:
    // Let's calculate based on the current search & filters (except pagination)
    const totalStockValue = result.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStockCount = result.filter((stk) => stk.status === "LOW" || stk.status === "CRITICAL").length;
    const outOfStockCount = result.filter((stk) => stk.status === "OUT_OF_STOCK").length;
    const healthyStockCount = result.filter((stk) => stk.status === "HEALTHY").length;

    // Sorting
    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === "ingredient") {
        valA = a.ingredient.name;
        valB = b.ingredient.name;
      } else if (sortBy === "store") {
        valA = a.storeName;
        valB = b.storeName;
      } else {
        valA = a[sortBy] ?? "";
        valB = b[sortBy] ?? "";
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
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        healthyStockCount
      }
    };
  },

  getHistory: async (params = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const {
      ingredientId = "",
      storeId = "",
      type = "",
      reason = "",
      createdBy = "",
      startDate = "",
      endDate = "",
      page = 1,
      limit = 10,
      search = ""
    } = params;

    const cachedStores = localStorage.getItem("mock_db_stores");
    const storesList = cachedStores ? JSON.parse(cachedStores) : [...initialStores];

    const cachedIngredients = localStorage.getItem("mock_db_ingredients");
    const ingredientsList = cachedIngredients ? JSON.parse(cachedIngredients) : [...mockIngredients];

    let result = transactions.map((txn) => {
      const ingredient = ingredientsList.find((i) => i._id === txn.ingredientId) || {
        name: "Unknown Material",
        ingredientCode: "ING-UNK",
        unit: "Units"
      };

      const storeObj = storesList.find((s) => s._id === txn.storeId) || {
        storeName: "Unknown Store"
      };

      return {
        ...txn,
        ingredientName: ingredient.name,
        ingredientCode: ingredient.ingredientCode,
        unit: ingredient.unit,
        storeName: storeObj.storeName
      };
    });

    // Filter rules
    if (ingredientId && ingredientId !== "all") {
      result = result.filter((t) => t.ingredientId === ingredientId);
    }
    if (storeId && storeId !== "all") {
      result = result.filter((t) => t.storeId === storeId);
    }
    if (type && type !== "all") {
      result = result.filter((t) => t.type.toLowerCase() === type.toLowerCase());
    }
    if (reason && reason !== "all") {
      result = result.filter((t) => t.reason.toLowerCase() === reason.toLowerCase());
    }
    if (createdBy) {
      result = result.filter((t) => t.createdBy.toLowerCase().includes(createdBy.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.ingredientName.toLowerCase().includes(q) ||
          t.ingredientCode.toLowerCase().includes(q) ||
          t.storeName.toLowerCase().includes(q) ||
          t.referenceId.toLowerCase().includes(q)
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((t) => new Date(t.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.createdAt) <= end);
    }

    // Sort by newest first
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const totalCount = result.length;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + Number(limit));

    return {
      success: true,
      data: paginated,
      totalCount
    };
  },

  adjustStock: async (payload) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { stockId, type, quantity, reason, remarks = "", referenceNumber = "" } = payload;
    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be a positive number.");
    }

    const index = stocks.findIndex((s) => s._id === stockId);
    if (index === -1) throw new Error("Inventory stock record not found");

    const stock = stocks[index];
    const prevStock = stock.currentStock;
    let newStock = prevStock;

    if (type === "INCREASE") {
      newStock = prevStock + qty;
    } else if (type === "DECREASE") {
      newStock = prevStock - qty;
      if (newStock < 0) {
        throw new Error("Insufficient stock. Available stock cannot be reduced below zero.");
      }
    } else {
      throw new Error("Invalid adjustment type. Must be INCREASE or DECREASE.");
    }

    // Update stock levels
    stocks[index] = {
      ...stock,
      currentStock: newStock,
      availableStock: newStock - stock.reservedStock,
      lastUpdated: new Date().toISOString(),
      updatedBy: "Franchise Admin"
    };

    // Log transaction
    const newTxn = {
      _id: `txn-${Date.now()}`,
      storeId: stock.storeId,
      ingredientId: stock.ingredientId,
      type: type === "INCREASE" ? "Adjustment" : "Adjustment", // standard transaction types
      quantity: type === "INCREASE" ? qty : -qty,
      previousStock: prevStock,
      newStock: newStock,
      reason: reason + (remarks ? ` (${remarks})` : ""),
      referenceId: referenceNumber || `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
      createdBy: "Franchise Admin",
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTxn);

    saveToStorage();
    notifyListeners();

    return { success: true, data: stocks[index] };
  },

  getConsumptionTrend: async (ingredientId, storeId) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Calculate a seed mock for daily consumption over 7 days
    const dailyTrend = [];
    const today = new Date();
    
    // Settle dynamic variables based on ingredientId hash to make it look stable and realistic
    const numericId = ingredientId ? parseInt(ingredientId.replace(/\D/g, "") || "5") : 5;
    const baseVal = Math.max(1, Math.min(20, numericId * 1.5));
    
    let totalQty = 0;
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      
      // Pseudo-random but consistent daily variation
      const variance = Math.sin(i + numericId) * (baseVal * 0.3);
      const consumed = Math.max(0.5, parseFloat((baseVal + variance).toFixed(1)));
      
      dailyTrend.push({
        date: formattedDate,
        quantity: consumed
      });
      totalQty += consumed;
    }

    const averageUsage = parseFloat((totalQty / 7).toFixed(1));
    // Calculate projected depletion based on stock level if we have it
    const stockRecord = stocks.find(s => s.ingredientId === ingredientId && s.storeId === storeId);
    const available = stockRecord ? stockRecord.availableStock : 15;
    const projectedDepletionDays = averageUsage > 0 ? Math.ceil(available / averageUsage) : 99;

    return {
      success: true,
      data: {
        trend: dailyTrend,
        metrics: {
          consumedQuantity: totalQty,
          averageUsage,
          projectedDepletion: projectedDepletionDays
        }
      }
    };
  }
};
