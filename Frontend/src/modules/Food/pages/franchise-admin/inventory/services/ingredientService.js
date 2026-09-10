import {
  mockIngredients,
  mockSuppliers,
  mockStoreStocks,
  mockPurchaseOrders,
  mockConsumptionHistory,
  mockExpiryBatches,
  mockStockTransactions
} from "../mockData";

const INGREDIENTS_STORAGE_KEY = "mock_db_ingredients";
const SUPPLIERS_STORAGE_KEY = "mock_db_suppliers";
const STOCKS_STORAGE_KEY = "mock_db_store_stocks";
const POS_STORAGE_KEY = "mock_db_purchase_orders";
const CONSUMPTION_STORAGE_KEY = "mock_db_consumption_history";
const BATCHES_STORAGE_KEY = "mock_db_expiry_batches";
const TRANSACTIONS_STORAGE_KEY = "mock_db_stock_transactions";

let ingredients = [];
let suppliers = [];
let storeStocks = {};
let purchaseOrders = {};
let consumptionHistory = {};
let expiryBatches = {};
let stockTransactions = {};

// Initialize state
try {
  const cachedIngredients = localStorage.getItem(INGREDIENTS_STORAGE_KEY);
  ingredients = cachedIngredients ? JSON.parse(cachedIngredients) : [...mockIngredients];
  if (!cachedIngredients) localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(ingredients));

  const cachedSuppliers = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
  suppliers = cachedSuppliers ? JSON.parse(cachedSuppliers) : [...mockSuppliers];
  if (!cachedSuppliers) localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));

  const cachedStocks = localStorage.getItem(STOCKS_STORAGE_KEY);
  storeStocks = cachedStocks ? JSON.parse(cachedStocks) : { ...mockStoreStocks };
  if (!cachedStocks) localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(storeStocks));

  const cachedPOs = localStorage.getItem(POS_STORAGE_KEY);
  purchaseOrders = cachedPOs ? JSON.parse(cachedPOs) : { ...mockPurchaseOrders };
  if (!cachedPOs) localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(purchaseOrders));

  const cachedConsumption = localStorage.getItem(CONSUMPTION_STORAGE_KEY);
  consumptionHistory = cachedConsumption ? JSON.parse(cachedConsumption) : { ...mockConsumptionHistory };
  if (!cachedConsumption) localStorage.setItem(CONSUMPTION_STORAGE_KEY, JSON.stringify(consumptionHistory));

  const cachedBatches = localStorage.getItem(BATCHES_STORAGE_KEY);
  expiryBatches = cachedBatches ? JSON.parse(cachedBatches) : { ...mockExpiryBatches };
  if (!cachedBatches) localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(expiryBatches));

  const cachedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  stockTransactions = cachedTransactions ? JSON.parse(cachedTransactions) : {};
  
  // Merge or ensure all mock transactions from mockData are present
  let hasMergedNew = false;
  for (const [key, value] of Object.entries(mockStockTransactions)) {
    if (!stockTransactions[key] || stockTransactions[key].length === 0) {
      stockTransactions[key] = value;
      hasMergedNew = true;
    }
  }
  
  if (!cachedTransactions || hasMergedNew) {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(stockTransactions));
  }
} catch (e) {
  ingredients = [...mockIngredients];
  suppliers = [...mockSuppliers];
  storeStocks = { ...mockStoreStocks };
  purchaseOrders = { ...mockPurchaseOrders };
  consumptionHistory = { ...mockConsumptionHistory };
  expiryBatches = { ...mockExpiryBatches };
  stockTransactions = { ...mockStockTransactions };
}

const saveToStorage = () => {
  try {
    localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(ingredients));
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
    localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(storeStocks));
    localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(purchaseOrders));
    localStorage.setItem(CONSUMPTION_STORAGE_KEY, JSON.stringify(consumptionHistory));
    localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(expiryBatches));
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(stockTransactions));
  } catch (err) {
    console.error("Failed to persist ingredients database", err);
  }
};

// Pub-sub for listeners
const listeners = new Set();
export function subscribeToIngredientChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export const ingredientService = {
  getSuppliers: async () => {
    return { success: true, data: suppliers };
  },

  getIngredients: async (params = {}) => {
    // Artificial latency for loading skeletal states
    await new Promise((resolve) => setTimeout(resolve, 350));

    const {
      search = "",
      category = "",
      supplierId = "",
      status = "",
      expiryTracking = "",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = params;

    let filtered = [...ingredients];

    // Filter by Search Query (supports name, ingredientCode, sku)
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.ingredientCode.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q))
      );
    }

    // Filter by Category
    if (category && category !== "ALL_CATEGORIES") {
      filtered = filtered.filter((i) => i.category.toUpperCase() === category.toUpperCase());
    }

    // Filter by Supplier
    if (supplierId && supplierId !== "all") {
      filtered = filtered.filter((i) => i.supplierId === supplierId);
    }

    // Filter by Status
    if (status && status !== "all") {
      filtered = filtered.filter((i) => i.status.toUpperCase() === status.toUpperCase());
    }

    // Filter by Expiry Tracking
    if (expiryTracking && expiryTracking !== "all") {
      const isTracking = expiryTracking === "enabled";
      filtered = filtered.filter((i) => i.expiryTracking === isTracking);
    }

    // Sort
    filtered.sort((a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Map relationships (Supplier Name, stock count helper details)
    const mapped = filtered.map((item) => {
      const supplierObj = suppliers.find((s) => s._id === item.supplierId);
      const supplierName = supplierObj ? supplierObj.name : "Unassigned Supplier";

      // Calculate stock status summaries based on store stocks
      const stocksList = storeStocks[item._id] || [];
      const totalStock = stocksList.reduce((sum, s) => sum + s.stock, 0);
      const belowReorderCount = stocksList.filter((s) => s.stock < s.reorder).length;
      
      // Calculate Expiry warnings
      const batchesList = expiryBatches[item._id] || [];
      const soonExpiringCount = batchesList.filter(
        (b) => b.daysRemaining > 0 && b.daysRemaining <= 7
      ).length;

      return {
        ...item,
        supplierName,
        totalStock,
        belowReorderCount,
        soonExpiringCount
      };
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginated = mapped.slice(startIndex, startIndex + Number(limit));

    return {
      success: true,
      ingredients: paginated,
      totalCount: filtered.length
    };
  },

  getIngredientDetails: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const item = ingredients.find((i) => i._id === id);
    if (!item) throw new Error("Ingredient catalog item not found");

    const supplierObj = suppliers.find((s) => s._id === item.supplierId);
    
    return {
      success: true,
      data: {
        ...item,
        supplierName: supplierObj ? supplierObj.name : "Unassigned"
      }
    };
  },

  createIngredient: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Duplicate code check
    const codeExists = ingredients.some(
      (i) => i.ingredientCode.toUpperCase() === data.ingredientCode.toUpperCase()
    );
    if (codeExists) {
      throw new Error(`Duplicate Ingredient Code: ${data.ingredientCode} already exists in catalog.`);
    }

    const _id = `ing-${Date.now()}`;
    const newIngredient = {
      _id,
      ingredientCode: data.ingredientCode || `ING-${Math.floor(Math.random() * 900) + 100}`,
      name: data.name,
      category: data.category,
      unit: data.unit,
      sku: data.sku || "",
      description: data.description || "",
      image: data.image || "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80&fm=webp",
      reorderLevel: Number(data.reorderLevel),
      idealStock: Number(data.idealStock || 0),
      supplierId: data.supplierId || "",
      costPerUnit: Number(data.costPerUnit),
      shelfLife: Number(data.shelfLife || 0),
      expiryTracking: Boolean(data.expiryTracking),
      status: "ACTIVE",
      createdBy: "Franchise Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ingredients.push(newIngredient);

    // Seed default store stocks for the new item
    storeStocks[_id] = [
      { store: "Indore Central", stock: 0, ideal: newIngredient.idealStock, reorder: newIngredient.reorderLevel, batch: "N/A", status: "Critical" },
      { store: "Bhopal Zone", stock: 0, ideal: newIngredient.idealStock, reorder: newIngredient.reorderLevel, batch: "N/A", status: "Critical" },
      { store: "Ujjain Branch", stock: 0, ideal: newIngredient.idealStock, reorder: newIngredient.reorderLevel, batch: "N/A", status: "Critical" }
    ];

    saveToStorage();
    notifyListeners();

    return { success: true, data: newIngredient };
  },

  updateIngredient: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = ingredients.findIndex((i) => i._id === id);
    if (index === -1) throw new Error("Ingredient not found");

    // Code exists check for duplicates if code changes
    if (data.ingredientCode && data.ingredientCode !== ingredients[index].ingredientCode) {
      const codeExists = ingredients.some(
        (i) => i.ingredientCode.toUpperCase() === data.ingredientCode.toUpperCase()
      );
      if (codeExists) {
        throw new Error(`Duplicate Ingredient Code: ${data.ingredientCode} is already mapped.`);
      }
    }

    ingredients[index] = {
      ...ingredients[index],
      ingredientCode: data.ingredientCode || ingredients[index].ingredientCode,
      name: data.name,
      category: data.category,
      unit: data.unit,
      sku: data.sku ?? ingredients[index].sku,
      description: data.description ?? ingredients[index].description,
      image: data.image || ingredients[index].image,
      reorderLevel: Number(data.reorderLevel),
      idealStock: Number(data.idealStock || 0),
      supplierId: data.supplierId,
      costPerUnit: Number(data.costPerUnit),
      shelfLife: Number(data.shelfLife || 0),
      expiryTracking: Boolean(data.expiryTracking),
      status: data.status || ingredients[index].status,
      updatedAt: new Date().toISOString()
    };

    saveToStorage();
    notifyListeners();

    return { success: true, data: ingredients[index] };
  },

  updateIngredientStatus: async (id, status) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = ingredients.findIndex((i) => i._id === id);
    if (index === -1) throw new Error("Ingredient not found");

    ingredients[index].status = status;
    ingredients[index].updatedAt = new Date().toISOString();

    saveToStorage();
    notifyListeners();

    return { success: true, data: ingredients[index] };
  },

  getStoreStocks: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: storeStocks[id] || [] };
  },

  getPurchaseOrders: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: purchaseOrders[id] || [] };
  },

  getConsumptionHistory: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: consumptionHistory[id] || [] };
  },

  getExpiryBatches: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: expiryBatches[id] || [] };
  },

  getStockTransactions: async (id, filters = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    let transactionsList = stockTransactions[id];

    if (!transactionsList || transactionsList.length === 0) {
      const item = ingredients.find((i) => i._id === id) || { name: "Raw Material", ingredientCode: "ING-TEMP", idealStock: 100, reorderLevel: 20, unit: "Kg" };
      transactionsList = [
        {
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          store: "Indore Central",
          type: "Purchase",
          reference: `PO-2026-${Math.floor(8000 + Math.random() * 2000)}`,
          quantity: item.idealStock || 100,
          openingStock: 0,
          closingStock: item.idealStock || 100,
          performedBy: "Rohan Malhotra (Store Manager)"
        },
        {
          date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          store: "Indore Central",
          type: "Consumption",
          reference: `ORD-${Math.floor(90000 + Math.random() * 10000)}`,
          quantity: -Math.max(1, Math.floor((item.reorderLevel || 15) * 0.4)),
          openingStock: item.idealStock || 100,
          closingStock: (item.idealStock || 100) - Math.max(1, Math.floor((item.reorderLevel || 15) * 0.4)),
          performedBy: "Isha Sharma (Kitchen)"
        },
        {
          date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          store: "Indore Central",
          type: "Adjustment",
          reference: "ADJ-0982",
          quantity: -Math.max(1, Math.floor((item.reorderLevel || 15) * 0.1)),
          openingStock: (item.idealStock || 100) - Math.max(1, Math.floor((item.reorderLevel || 15) * 0.4)),
          closingStock: (item.idealStock || 100) - Math.max(1, Math.floor((item.reorderLevel || 15) * 0.4)) - Math.max(1, Math.floor((item.reorderLevel || 15) * 0.1)),
          performedBy: "Rohan Malhotra (Store Manager)"
        }
      ];
      stockTransactions[id] = transactionsList;
      saveToStorage();
    }

    const { type = "all", store = "all", startDate = "", endDate = "" } = filters;
    let filtered = [...transactionsList];

    if (type && type !== "all") {
      filtered = filtered.filter((t) => t.type.toLowerCase() === type.toLowerCase());
    }

    if (store && store !== "all") {
      filtered = filtered.filter((t) => t.store.toLowerCase() === store.toLowerCase());
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.date) <= end);
    }

    return { success: true, data: filtered };
  }
};
