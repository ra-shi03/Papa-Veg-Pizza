// Mock Data and Local Storage Database for Pizza Store Inventory
// Prepopulated with premium Indian pizza store ingredients and suppliers

export const initialMockSuppliers = [
  { _id: "sup-001", name: "MMP Dairy Foods, Indore", contact: "+91 94250 12345" },
  { _id: "sup-002", name: "Vrindavan Fresh Farms, Bhopal", contact: "+91 88710 54321" },
  { _id: "sup-003", name: "Rajesh Flour Mills & Grains", contact: "+91 73124 98765" },
  { _id: "sup-004", name: "Global Packaging Solutions, Pithampur", contact: "+91 99887 76655" },
  { _id: "sup-005", name: "Spices of India Co.", contact: "+91 91112 23344" }
];

export const initialMockIngredients = [
  {
    _id: "ing-001",
    storeId: "st-indore-01",
    ingredientName: "Premium Mozzarella Cheese",
    category: "Cheese",
    unit: "KG",
    currentStock: 45.5,
    minimumStock: 15.0,
    reorderLevel: 25.0,
    costPerUnit: 420.00,
    supplierId: "sup-001",
    supplierName: "MMP Dairy Foods, Indore",
    status: "available",
    lastUpdatedBy: "Shubham Jamliya",
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    _id: "ing-002",
    storeId: "st-indore-01",
    ingredientName: "Dough Flour (Premium Maida)",
    category: "Flour & Dough",
    unit: "KG",
    currentStock: 120.0,
    minimumStock: 40.0,
    reorderLevel: 60.0,
    costPerUnit: 48.00,
    supplierId: "sup-003",
    supplierName: "Rajesh Flour Mills & Grains",
    status: "available",
    lastUpdatedBy: "Vijay Saxena",
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    _id: "ing-003",
    storeId: "st-indore-01",
    ingredientName: "Classic Tomato Pizza Sauce",
    category: "Sauce",
    unit: "Litre",
    currentStock: 12.0,
    minimumStock: 10.0,
    reorderLevel: 18.0,
    costPerUnit: 180.00,
    supplierId: "sup-001",
    supplierName: "MMP Dairy Foods, Indore",
    status: "low_stock",
    lastUpdatedBy: "Neha Joshi",
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    _id: "ing-004",
    storeId: "st-indore-01",
    ingredientName: "Fresh Paneer Cubes (Tikka Size)",
    category: "Veggie & Toppings",
    unit: "KG",
    currentStock: 8.5,
    minimumStock: 10.0,
    reorderLevel: 15.0,
    costPerUnit: 360.00,
    supplierId: "sup-002",
    supplierName: "Vrindavan Fresh Farms, Bhopal",
    status: "low_stock",
    lastUpdatedBy: "Ramesh Singh",
    updatedAt: new Date(Date.now() - 1800000).toISOString() // 30m ago
  },
  {
    _id: "ing-005",
    storeId: "st-indore-01",
    ingredientName: "Sliced Jalapenos (Pickled)",
    category: "Veggie & Toppings",
    unit: "KG",
    currentStock: 0.0,
    minimumStock: 5.0,
    reorderLevel: 8.0,
    costPerUnit: 240.00,
    supplierId: "sup-002",
    supplierName: "Vrindavan Fresh Farms, Bhopal",
    status: "out_of_stock",
    lastUpdatedBy: "Shubham Jamliya",
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    _id: "ing-006",
    storeId: "st-indore-01",
    ingredientName: "Sweet Corn Kernels",
    category: "Veggie & Toppings",
    unit: "KG",
    currentStock: 22.0,
    minimumStock: 8.0,
    reorderLevel: 12.0,
    costPerUnit: 120.00,
    supplierId: "sup-002",
    supplierName: "Vrindavan Fresh Farms, Bhopal",
    status: "available",
    lastUpdatedBy: "Vijay Saxena",
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    _id: "ing-007",
    storeId: "st-indore-01",
    ingredientName: "Fresh Red Onions (Diced)",
    category: "Veggie & Toppings",
    unit: "KG",
    currentStock: 35.0,
    minimumStock: 15.0,
    reorderLevel: 20.0,
    costPerUnit: 35.00,
    supplierId: "sup-002",
    supplierName: "Vrindavan Fresh Farms, Bhopal",
    status: "available",
    lastUpdatedBy: "Neha Joshi",
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    _id: "ing-008",
    storeId: "st-indore-01",
    ingredientName: "Green Capsicum (Tri-cut)",
    category: "Veggie & Toppings",
    unit: "KG",
    currentStock: 28.0,
    minimumStock: 12.0,
    reorderLevel: 18.0,
    costPerUnit: 60.00,
    supplierId: "sup-002",
    supplierName: "Vrindavan Fresh Farms, Bhopal",
    status: "available",
    lastUpdatedBy: "Ramesh Singh",
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    _id: "ing-009",
    storeId: "st-indore-01",
    ingredientName: "Tandoori Pizza Sauce",
    category: "Sauce",
    unit: "Litre",
    currentStock: 1.5,
    minimumStock: 6.0,
    reorderLevel: 10.0,
    costPerUnit: 210.00,
    supplierId: "sup-001",
    supplierName: "MMP Dairy Foods, Indore",
    status: "low_stock",
    lastUpdatedBy: "Shubham Jamliya",
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    _id: "ing-010",
    storeId: "st-indore-01",
    ingredientName: "Oregano Seasoning Sachets",
    category: "Packaging & Addons",
    unit: "Box (500 Pcs)",
    currentStock: 8.0,
    minimumStock: 3.0,
    reorderLevel: 5.0,
    costPerUnit: 450.00,
    supplierId: "sup-005",
    supplierName: "Spices of India Co.",
    status: "available",
    lastUpdatedBy: "Vijay Saxena",
    updatedAt: new Date(Date.now() - 3600000 * 15).toISOString()
  },
  {
    _id: "ing-011",
    storeId: "st-indore-01",
    ingredientName: "Chili Flakes Sachets",
    category: "Packaging & Addons",
    unit: "Box (500 Pcs)",
    currentStock: 2.0,
    minimumStock: 3.0,
    reorderLevel: 5.0,
    costPerUnit: 400.00,
    supplierId: "sup-005",
    supplierName: "Spices of India Co.",
    status: "low_stock",
    lastUpdatedBy: "Aman Verma",
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    _id: "ing-012",
    storeId: "st-indore-01",
    ingredientName: "Medium Pizza Box (Corrugated)",
    category: "Packaging & Addons",
    unit: "Pcs",
    currentStock: 450.0,
    minimumStock: 200.0,
    reorderLevel: 300.0,
    costPerUnit: 9.50,
    supplierId: "sup-004",
    supplierName: "Global Packaging Solutions, Pithampur",
    status: "available",
    lastUpdatedBy: "Vijay Saxena",
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    _id: "ing-013",
    storeId: "st-indore-01",
    ingredientName: "Large Pizza Box (Corrugated)",
    category: "Packaging & Addons",
    unit: "Pcs",
    currentStock: 0.0,
    minimumStock: 100.0,
    reorderLevel: 150.0,
    costPerUnit: 14.00,
    supplierId: "sup-004",
    supplierName: "Global Packaging Solutions, Pithampur",
    status: "out_of_stock",
    lastUpdatedBy: "Vijay Saxena",
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    _id: "ing-014",
    storeId: "st-indore-01",
    ingredientName: "Liquid Cheese Spread",
    category: "Cheese",
    unit: "KG",
    currentStock: 5.0,
    minimumStock: 8.0,
    reorderLevel: 12.0,
    costPerUnit: 320.00,
    supplierId: "sup-001",
    supplierName: "MMP Dairy Foods, Indore",
    status: "low_stock",
    lastUpdatedBy: "Aman Verma",
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    _id: "ing-015",
    storeId: "st-indore-01",
    ingredientName: "Fresh Mushrooms (Sliced)",
    category: "Veggie & Toppings",
    unit: "KG",
    currentStock: 15.0,
    minimumStock: 5.0,
    reorderLevel: 8.0,
    costPerUnit: 160.00,
    supplierId: "sup-002",
    supplierName: "Vrindavan Fresh Farms, Bhopal",
    status: "available",
    lastUpdatedBy: "Ramesh Singh",
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString()
  }
];

export const initialMockTransactions = [
  {
    _id: "txn-1001",
    ingredientId: "ing-001",
    storeId: "st-indore-01",
    type: "stock_in",
    quantity: 20.0,
    previousStock: 25.5,
    newStock: 45.5,
    reason: "Fresh morning delivery",
    createdBy: "Shubham Jamliya",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    _id: "txn-1002",
    ingredientId: "ing-004",
    storeId: "st-indore-01",
    type: "stock_out",
    quantity: 5.0,
    previousStock: 13.5,
    newStock: 8.5,
    reason: "Kitchen prep issues - Paneer Tikka",
    createdBy: "Ramesh Singh",
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    _id: "txn-1003",
    ingredientId: "ing-003",
    storeId: "st-indore-01",
    type: "adjustment",
    quantity: 12.0,
    previousStock: 15.0,
    newStock: 12.0,
    reason: "Spoilage write-off - expired batch",
    createdBy: "Neha Joshi",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    _id: "txn-1004",
    ingredientId: "ing-002",
    storeId: "st-indore-01",
    type: "stock_in",
    quantity: 50.0,
    previousStock: 70.0,
    newStock: 120.0,
    reason: "Warehouse replenishment batch #4",
    createdBy: "Vijay Saxena",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    _id: "txn-1005",
    ingredientId: "ing-005",
    storeId: "st-indore-01",
    type: "stock_out",
    quantity: 3.5,
    previousStock: 3.5,
    newStock: 0.0,
    reason: "Used in daily orders kitchen prep",
    createdBy: "Shubham Jamliya",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const mockConsumptionStats = {
  "ing-001": { today: 8.2, week: 56.4, month: 242.0, averageDaily: 8.0 },
  "ing-002": { today: 22.0, week: 145.0, month: 610.0, averageDaily: 20.3 },
  "ing-003": { today: 3.5, week: 24.1, month: 98.0, averageDaily: 3.2 },
  "ing-004": { today: 2.1, week: 18.2, month: 78.5, averageDaily: 2.6 },
  "ing-005": { today: 0.8, week: 6.4, month: 28.0, averageDaily: 0.9 },
  "ing-006": { today: 3.0, week: 21.0, month: 92.0, averageDaily: 3.1 },
  "ing-007": { today: 5.5, week: 38.0, month: 154.0, averageDaily: 5.1 },
  "ing-008": { today: 4.8, week: 33.2, month: 135.0, averageDaily: 4.5 },
  "ing-009": { today: 1.2, week: 8.5, month: 36.0, averageDaily: 1.2 },
  "ing-010": { today: 0.5, week: 3.2, month: 14.0, averageDaily: 0.4 },
  "ing-011": { today: 0.4, week: 2.8, month: 11.5, averageDaily: 0.3 },
  "ing-012": { today: 85, week: 520, month: 2100, averageDaily: 70 },
  "ing-013": { today: 42, week: 290, month: 1200, averageDaily: 40 },
  "ing-014": { today: 1.5, week: 11.2, month: 48.0, averageDaily: 1.6 },
  "ing-015": { today: 2.4, week: 16.5, month: 72.0, averageDaily: 2.4 }
};

const INGREDIENTS_KEY = "pvp_inventory_ingredients";
const TRANSACTIONS_KEY = "pvp_inventory_transactions";

export const getLocalIngredients = () => {
  try {
    let list = JSON.parse(localStorage.getItem(INGREDIENTS_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockIngredients;
      localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(initialMockIngredients));
    return initialMockIngredients;
  }
};

export const setLocalIngredients = (ingredients) => {
  localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
};

export const getLocalTransactions = () => {
  try {
    let list = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockTransactions;
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(initialMockTransactions));
    return initialMockTransactions;
  }
};

export const setLocalTransactions = (transactions) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

// ==========================================
// Stock Requests Mock Data & Local Storage DB
// ==========================================

export const initialMockStockRequests = [
  {
    _id: "req-001",
    requestNo: "SR-2026-001",
    storeId: "st-indore-01",
    ingredientId: "ing-003",
    ingredientName: "Classic Tomato Pizza Sauce",
    requestedQty: 12.0,
    approvedQty: 0.0,
    urgency: "high",
    reason: "Saturday night prep rush requires extra tomato sauce",
    requestedBy: "Aman Verma",
    approvedBy: "",
    status: "pending",
    remarks: "",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
  },
  {
    _id: "req-002",
    requestNo: "SR-2026-002",
    storeId: "st-indore-01",
    ingredientId: "ing-004",
    ingredientName: "Fresh Paneer Cubes (Tikka Size)",
    requestedQty: 15.0,
    approvedQty: 15.0,
    urgency: "critical",
    reason: "Bulk party order for 40 paneer tikka pizzas tomorrow morning",
    requestedBy: "Vijay Saxena",
    approvedBy: "Shubham Jamliya",
    status: "approved",
    remarks: "Approved full quantity for party order",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString() // 8 hours ago
  },
  {
    _id: "req-003",
    requestNo: "SR-2026-003",
    storeId: "st-indore-01",
    ingredientId: "ing-001",
    ingredientName: "Premium Mozzarella Cheese",
    requestedQty: 80.0,
    approvedQty: 0.0,
    urgency: "low",
    reason: "Requesting excess cheese buffer for upcoming holidays",
    requestedBy: "Aman Verma",
    approvedBy: "Shubham Jamliya",
    status: "rejected",
    remarks: "Rejected. Store has active cheese storage limits, cannot hold over 50kg.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    _id: "req-004",
    requestNo: "SR-2026-004",
    storeId: "st-indore-01",
    ingredientId: "ing-002",
    ingredientName: "Dough Flour (Premium Maida)",
    requestedQty: 50.0,
    approvedQty: 50.0,
    urgency: "medium",
    reason: "Regular weekly dough batch replenishment",
    requestedBy: "Vijay Saxena",
    approvedBy: "Shubham Jamliya",
    status: "fulfilled",
    remarks: "Delivered in full by supplier on-site",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
  }
];

export const mockStaffProfiles = {
  "Aman Verma": { name: "Aman Verma", shift: "Morning Shift (09:00 - 17:00)", department: "Kitchen Operations", role: "Kitchen Staff" },
  "Vijay Saxena": { name: "Vijay Saxena", shift: "Evening Shift (17:00 - 01:00)", department: "Baking & Dough Prep", role: "Kitchen Supervisor" },
  "Ramesh Singh": { name: "Ramesh Singh", shift: "General Shift (11:00 - 19:00)", department: "Kitchen Operations", role: "Kitchen Supervisor" },
  "Shubham Jamliya": { name: "Shubham Jamliya", shift: "Store General Hours", department: "Administration", role: "Store Manager" }
};

const STOCK_REQUESTS_KEY = "pvp_stock_requests";

export const getLocalStockRequests = () => {
  try {
    let list = JSON.parse(localStorage.getItem(STOCK_REQUESTS_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockStockRequests;
      localStorage.setItem(STOCK_REQUESTS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(STOCK_REQUESTS_KEY, JSON.stringify(initialMockStockRequests));
    return initialMockStockRequests;
  }
};

export const setLocalStockRequests = (requests) => {
  localStorage.setItem(STOCK_REQUESTS_KEY, JSON.stringify(requests));
};

// ==========================================
// Waste Logs Mock Data & Local Storage DB
// ==========================================

export const initialMockWasteLogs = [
  {
    _id: "waste-001",
    storeId: "st-indore-01",
    ingredientId: "ing-001",
    ingredientName: "Premium Mozzarella Cheese",
    quantity: 4.5,
    wasteType: "expired",
    reason: "Cheese bag left open in defrost chamber, caught mold",
    reportedBy: "Aman Verma",
    approvedBy: "Shubham Jamliya",
    estimatedLoss: 1890.0,
    remarks: "Standard spoilage write-off. Re-trained shift team on sealing protocols.",
    status: "approved",
    images: [
      "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=600&q=80"
    ],
    timeline: [
      { user: "Aman Verma", action: "reported", remarks: "Cheese bag left open in defrost chamber, caught mold", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { user: "Shubham Jamliya", action: "approved", remarks: "Standard spoilage write-off. Re-trained shift team on sealing protocols.", createdAt: new Date(Date.now() - 3600000 * 22).toISOString() }
    ],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    _id: "waste-002",
    storeId: "st-indore-01",
    ingredientId: "ing-004",
    ingredientName: "Fresh Paneer Cubes (Tikka Size)",
    quantity: 2.0,
    wasteType: "burnt",
    reason: "Burnt during tandoori deck pre-heat calibration",
    reportedBy: "Vijay Saxena",
    approvedBy: "",
    estimatedLoss: 720.0,
    remarks: "",
    status: "pending",
    images: [
      "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80"
    ],
    timeline: [
      { user: "Vijay Saxena", action: "reported", remarks: "Burnt during tandoori deck pre-heat calibration", createdAt: new Date(Date.now() - 3600000 * 4).toISOString() }
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    _id: "waste-003",
    storeId: "st-indore-01",
    ingredientId: "ing-003",
    ingredientName: "Classic Tomato Pizza Sauce",
    quantity: 3.0,
    wasteType: "spillage",
    reason: "Dispenser bucket slipped off packaging counter line",
    reportedBy: "Ramesh Singh",
    approvedBy: "Shubham Jamliya",
    estimatedLoss: 540.0,
    remarks: "Countertop cleaned. Floor slip signs deployed.",
    status: "approved",
    images: [
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80"
    ],
    timeline: [
      { user: "Ramesh Singh", action: "reported", remarks: "Dispenser bucket slipped off packaging counter line", createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
      { user: "Shubham Jamliya", action: "approved", remarks: "Countertop cleaned. Floor slip signs deployed.", createdAt: new Date(Date.now() - 3600000 * 10).toISOString() }
    ],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    _id: "waste-004",
    storeId: "st-indore-01",
    ingredientId: "ing-007",
    ingredientName: "Fresh Red Onions (Diced)",
    quantity: 5.0,
    wasteType: "damaged",
    reason: "Vegetable crate fell off transport cart, onions crushed/soiled",
    reportedBy: "Aman Verma",
    approvedBy: "",
    estimatedLoss: 175.0,
    remarks: "",
    status: "pending",
    images: [
      "https://images.unsplash.com/photo-1580196782150-e4e261908237?auto=format&fit=crop&w=600&q=80"
    ],
    timeline: [
      { user: "Aman Verma", action: "reported", remarks: "Vegetable crate fell off transport cart, onions crushed/soiled", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const WASTE_LOGS_KEY = "pvp_waste_logs";

export const getLocalWasteLogs = () => {
  try {
    let list = JSON.parse(localStorage.getItem(WASTE_LOGS_KEY));
    // Force refresh if list is empty or outdated (fewer items than initialMockWasteLogs)
    if (!list || !Array.isArray(list) || list.length < initialMockWasteLogs.length) {
      list = initialMockWasteLogs;
      localStorage.setItem(WASTE_LOGS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(WASTE_LOGS_KEY, JSON.stringify(initialMockWasteLogs));
    return initialMockWasteLogs;
  }
};

export const setLocalWasteLogs = (wasteLogs) => {
  localStorage.setItem(WASTE_LOGS_KEY, JSON.stringify(wasteLogs));
};

// ==========================================
// Low Stock Alerts Mock Data & Local Storage DB
// ==========================================

export const initialMockAlerts = [
  {
    _id: "alert-001",
    storeId: "st-indore-01",
    ingredientId: "ing-004",
    ingredientName: "Fresh Paneer Cubes (Tikka Size)",
    alertType: "low_stock",
    currentStock: 8.5,
    minimumStock: 10.0,
    severity: "medium",
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    resolvedBy: "",
    resolvedAt: "",
    resolutionNote: ""
  },
  {
    _id: "alert-002",
    storeId: "st-indore-01",
    ingredientId: "ing-005",
    ingredientName: "Sliced Jalapenos (Pickled)",
    alertType: "low_stock",
    currentStock: 0.0,
    minimumStock: 5.0,
    severity: "critical",
    status: "active",
    createdAt: new Date(Date.now() - 3605000 * 5).toISOString(), // 5 hours ago
    resolvedBy: "",
    resolvedAt: "",
    resolutionNote: ""
  },
  {
    _id: "alert-003",
    storeId: "st-indore-01",
    ingredientId: "ing-001",
    ingredientName: "Premium Mozzarella Cheese",
    alertType: "low_stock",
    currentStock: 12.0,
    minimumStock: 15.0,
    severity: "high",
    status: "resolved",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    resolvedBy: "Shubham Jamliya",
    resolvedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    resolutionNote: "Replenished cheese stock via express delivery MMP Dairy."
  }
];

const ALERTS_KEY = "pvp_inventory_alerts";

export const getLocalInventoryAlerts = () => {
  try {
    let alerts = JSON.parse(localStorage.getItem(ALERTS_KEY));
    if (!alerts || !Array.isArray(alerts)) {
      alerts = initialMockAlerts;
    }

    // Auto-syncing engine: automatically create active alerts if stock is below minimumStock
    const ingredients = getLocalIngredients();
    let changed = false;

    ingredients.forEach((ing) => {
      if (ing.currentStock <= ing.minimumStock) {
        // Check if there is already an active alert for this ingredient
        const hasActiveAlert = alerts.some(a => a.ingredientId === ing._id && a.status === "active");
        if (!hasActiveAlert) {
          const ratio = ing.minimumStock > 0 ? (ing.currentStock / ing.minimumStock) * 100 : 0;
          let severity = "low";
          if (ratio < 40) severity = "critical";
          else if (ratio >= 40 && ratio < 70) severity = "high";
          else if (ratio >= 70 && ratio < 90) severity = "medium";

          alerts.push({
            _id: `alert-${Date.now()}-${ing._id}`,
            storeId: ing.storeId || "st-indore-01",
            ingredientId: ing._id,
            ingredientName: ing.ingredientName,
            alertType: "low_stock",
            currentStock: ing.currentStock,
            minimumStock: ing.minimumStock,
            severity,
            status: "active",
            createdAt: new Date().toISOString(),
            resolvedBy: "",
            resolvedAt: "",
            resolutionNote: ""
          });
          changed = true;
        } else {
          // Update the currentStock value in the active alert dynamically
          const activeAlert = alerts.find(a => a.ingredientId === ing._id && a.status === "active");
          const ratio = ing.minimumStock > 0 ? (ing.currentStock / ing.minimumStock) * 100 : 0;
          let severity = "low";
          if (ratio < 40) severity = "critical";
          else if (ratio >= 40 && ratio < 70) severity = "high";
          else if (ratio >= 70 && ratio < 90) severity = "medium";

          if (activeAlert.currentStock !== ing.currentStock || activeAlert.severity !== severity) {
            activeAlert.currentStock = ing.currentStock;
            activeAlert.severity = severity;
            changed = true;
          }
        }
      } else {
        // If stock goes back up, and we have an active alert, auto-resolve it
        const activeAlertIndex = alerts.findIndex(a => a.ingredientId === ing._id && a.status === "active");
        if (activeAlertIndex !== -1) {
          alerts[activeAlertIndex] = {
            ...alerts[activeAlertIndex],
            status: "resolved",
            resolvedBy: "System Auto-Sync",
            resolvedAt: new Date().toISOString(),
            resolutionNote: "Stock level replenished above minimum stock threshold."
          };
          changed = true;
        }
      }
    });

    if (changed || !localStorage.getItem(ALERTS_KEY)) {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    }

    return alerts;
  } catch (e) {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(initialMockAlerts));
    return initialMockAlerts;
  }
};

export const setLocalInventoryAlerts = (alerts) => {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
};

// ==========================================
// Ingredient Shortages & Stock Transfers DB
// ==========================================

export const initialMockShortages = [
  {
    _id: "shortage-001",
    storeId: "st-indore-01",
    ingredientId: "ing-005",
    ingredientName: "Sliced Jalapenos (Pickled)",
    shortageQty: 15.0,
    affectedOrders: 3,
    severity: "critical",
    status: "active",
    actionTaken: "",
    createdBy: "System Auto-Detection",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolvedBy: "",
    resolvedAt: "",
    resolutionNote: ""
  },
  {
    _id: "shortage-002",
    storeId: "st-indore-01",
    ingredientId: "ing-013",
    ingredientName: "Large Pizza Box (Corrugated)",
    shortageQty: 120.0,
    affectedOrders: 5,
    severity: "high",
    status: "active",
    actionTaken: "",
    createdBy: "System Auto-Detection",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    resolvedBy: "",
    resolvedAt: "",
    resolutionNote: ""
  },
  {
    _id: "shortage-003",
    storeId: "st-indore-01",
    ingredientId: "ing-004",
    ingredientName: "Fresh Paneer Cubes (Tikka Size)",
    shortageQty: 5.0,
    affectedOrders: 2,
    severity: "medium",
    status: "resolved",
    actionTaken: "Transferred stock from Vijay Nagar store",
    createdBy: "System Auto-Detection",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    resolvedBy: "Shubham Jamliya",
    resolvedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    resolutionNote: "Completed stock transfer from Vijay Nagar branch."
  }
];

export const initialMockTransfers = [
  {
    _id: "tr-001",
    fromStore: "Vijay Nagar Store (Indore)",
    fromStoreId: "st-indore-02",
    toStore: "Indore Main Store",
    toStoreId: "st-indore-01",
    ingredientId: "ing-004",
    ingredientName: "Fresh Paneer Cubes (Tikka Size)",
    quantity: 10.0,
    status: "completed",
    approvedBy: "Admin (Rohan Sharma)",
    reason: "Emergency paneer transfer for weekend orders",
    remarks: "Transfer completed successfully",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    _id: "tr-002",
    fromStore: "Palasia Store (Indore)",
    fromStoreId: "st-indore-03",
    toStore: "Indore Main Store",
    toStoreId: "st-indore-01",
    ingredientId: "ing-005",
    ingredientName: "Sliced Jalapenos (Pickled)",
    quantity: 15.0,
    status: "pending",
    approvedBy: "",
    reason: "Replenish pickled jalapenos for pizza toppings",
    remarks: "Awaiting Admin approval",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

export const mockStores = [
  {
    storeId: "st-indore-02",
    name: "Vijay Nagar Store, Indore",
    distance: 3.2,
    availableQty: 45.0,
    managerName: "Rohan Sharma"
  },
  {
    storeId: "st-indore-03",
    name: "Palasia Store, Indore",
    distance: 5.1,
    availableQty: 22.5,
    managerName: "Anjali Gupta"
  },
  {
    storeId: "st-bhopal-01",
    name: "Arera Colony Store, Bhopal",
    distance: 190.0,
    availableQty: 80.0,
    managerName: "Ramesh Saxena"
  }
];

export const mockAffectedOrders = {
  "ing-005": [
    { _id: "ORD-9021", customer: "Aarav Mehta", pizzaName: "Double Cheese Margherita + Jalapenos", quantity: 2, status: "preparing", expectedDelivery: "12:55 PM", revenue: 740.00 },
    { _id: "ORD-9024", customer: "Diya Sharma", pizzaName: "Spicy Jalapeno Veg Supreme", quantity: 1, status: "pending", expectedDelivery: "01:10 PM", revenue: 490.00 },
    { _id: "ORD-9027", customer: "Kabir Kapoor", pizzaName: "Paneer Tikka Pizza (Jalapeno Crust)", quantity: 3, status: "preparing", expectedDelivery: "01:05 PM", revenue: 1280.00 }
  ],
  "ing-013": [
    { _id: "ORD-8941", customer: "Rohan Verma", pizzaName: "Party Veg Feast (Large Size)", quantity: 4, status: "preparing", expectedDelivery: "01:00 PM", revenue: 2400.00 },
    { _id: "ORD-8945", customer: "Ananya Gupta", pizzaName: "Double Cheese Burst Pizza (Large Size)", quantity: 2, status: "pending", expectedDelivery: "01:15 PM", revenue: 1100.00 }
  ],
  "ing-004": [
    { _id: "ORD-8910", customer: "Devendra Singh", pizzaName: "Paneer Tikka Stuffed Garlic Bread", quantity: 2, status: "completed", expectedDelivery: "Yesterday", revenue: 380.00 },
    { _id: "ORD-8912", customer: "Meera Nair", pizzaName: "Peppy Paneer Pizza (Medium)", quantity: 1, status: "completed", expectedDelivery: "Yesterday", revenue: 450.00 }
  ]
};

export const mockShortageTimeline = {
  "shortage-001": [
    { user: "System Auto-Detection", action: "detected", remarks: "Stock level dropped to 0.0 KG (below minimum 5.0 KG)", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
    { user: "Vijay Saxena", action: "reported", remarks: "Confirmed shortage in kitchen during morning pizza prep line", createdAt: new Date(Date.now() - 3600000 * 4).toISOString() }
  ],
  "shortage-002": [
    { user: "System Auto-Detection", action: "detected", remarks: "Stock level dropped to 0.0 Pcs (below minimum 100.0 Pcs)", createdAt: new Date(Date.now() - 3600000 * 8).toISOString() }
  ],
  "shortage-003": [
    { user: "System Auto-Detection", action: "detected", remarks: "Stock level dropped to 8.5 KG (below minimum 10.0 KG)", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
    { user: "Shubham Jamliya", action: "transfer_initiated", remarks: "Requested 10kg transfer from Vijay Nagar store", createdAt: new Date(Date.now() - 3600000 * 22).toISOString() },
    { user: "Shubham Jamliya", action: "resolved", remarks: "Transfer completed and stock replenished.", createdAt: new Date(Date.now() - 3600000 * 18).toISOString() }
  ]
};

const SHORTAGES_KEY = "pvp_inventory_shortages";
const TRANSFERS_KEY = "pvp_stock_transfers";

export const getLocalShortages = () => {
  try {
    let shortages = JSON.parse(localStorage.getItem(SHORTAGES_KEY));
    if (!shortages || !Array.isArray(shortages)) {
      shortages = initialMockShortages;
    }

    // Auto-syncing engine: automatically create active shortages if stock is 0
    const ingredients = getLocalIngredients();
    let changed = false;

    ingredients.forEach((ing) => {
      if (ing.currentStock === 0) {
        const hasActiveShortage = shortages.some(s => s.ingredientId === ing._id && s.status === "active");
        if (!hasActiveShortage) {
          shortages.push({
            _id: `shortage-${Date.now()}-${ing._id}`,
            storeId: ing.storeId || "st-indore-01",
            ingredientId: ing._id,
            ingredientName: ing.ingredientName,
            shortageQty: ing.minimumStock * 2,
            affectedOrders: ing._id === "ing-005" ? 3 : ing._id === "ing-013" ? 5 : 2,
            severity: ing.minimumStock > 10 ? "critical" : "high",
            status: "active",
            actionTaken: "",
            createdBy: "System Auto-Detection",
            createdAt: new Date().toISOString(),
            resolvedBy: "",
            resolvedAt: "",
            resolutionNote: ""
          });
          changed = true;
        }
      } else {
        // Auto-resolve shortages if stock is replenished
        const activeShortageIndex = shortages.findIndex(s => s.ingredientId === ing._id && s.status === "active");
        if (activeShortageIndex !== -1) {
          shortages[activeShortageIndex] = {
            ...shortages[activeShortageIndex],
            status: "resolved",
            resolvedBy: "System Auto-Sync",
            resolvedAt: new Date().toISOString(),
            resolutionNote: "Stock level replenished above 0.",
            actionTaken: "Inventory replenishment detected"
          };
          changed = true;
        }
      }
    });

    if (changed || !localStorage.getItem(SHORTAGES_KEY)) {
      localStorage.setItem(SHORTAGES_KEY, JSON.stringify(shortages));
    }
    return shortages;
  } catch (e) {
    localStorage.setItem(SHORTAGES_KEY, JSON.stringify(initialMockShortages));
    return initialMockShortages;
  }
};

export const setLocalShortages = (shortages) => {
  localStorage.setItem(SHORTAGES_KEY, JSON.stringify(shortages));
};

export const getLocalTransfers = () => {
  try {
    let transfers = JSON.parse(localStorage.getItem(TRANSFERS_KEY));
    if (!transfers || !Array.isArray(transfers)) {
      transfers = initialMockTransfers;
      localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
    }
    return transfers;
  } catch (e) {
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify(initialMockTransfers));
    return initialMockTransfers;
  }
};

export const setLocalTransfers = (transfers) => {
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
};



