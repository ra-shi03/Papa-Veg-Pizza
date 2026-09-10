export const mockSuppliers = [
  { _id: "SUP-001", name: "Durga Dairy Farms", contact: "Rajesh Kumar", email: "orders@durgadairy.com", phone: "+91 98270 12345" },
  { _id: "SUP-002", name: "Bharat Agro Foods", contact: "Sunil Sharma", email: "info@bharatagro.in", phone: "+91 94250 54321" },
  { _id: "SUP-003", name: "National Packaging Ltd.", contact: "Amit Patel", email: "sales@natpack.co.in", phone: "+91 731 4059080" },
  { _id: "SUP-004", name: "Murali Organic Spices", contact: "Venkatesh Iyer", email: "murali@organicspices.com", phone: "+91 94440 98765" },
  { _id: "SUP-005", name: "Shiv Shakti Flour Mills", contact: "Karan Singh", email: "contact@shivshaktifoods.com", phone: "+91 99811 22334" }
];

export const mockIngredients = [
  {
    _id: "ing-1",
    ingredientCode: "ING-001",
    name: "Hand-Tossed Pizza Dough",
    category: "Dough",
    unit: "Piece",
    sku: "DOUGH-HT-10",
    description: "Pre-proved and stretched wheat base for 10-inch standard pizzas.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 50,
    idealStock: 200,
    supplierId: "SUP-005",
    costPerUnit: 45,
    shelfLife: 3,
    expiryTracking: true,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-10T10:00:00Z",
    updatedAt: "2026-06-20T14:30:00Z"
  },
  {
    _id: "ing-2",
    ingredientCode: "ING-002",
    name: "Premium Mozzarella Cheese",
    category: "Cheese",
    unit: "Kg",
    sku: "CHEESE-MOZ-GP",
    description: "Grated and diced low-moisture mozzarella cheese with perfect stretch.",
    image: "https://images.unsplash.com/photo-1573145959986-a142c6e68ea8?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 15,
    idealStock: 60,
    supplierId: "SUP-001",
    costPerUnit: 480,
    shelfLife: 30,
    expiryTracking: true,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-12T09:15:00Z",
    updatedAt: "2026-06-21T11:00:00Z"
  },
  {
    _id: "ing-3",
    ingredientCode: "ING-003",
    name: "Rich Tomato Marinara Sauce",
    category: "Sauce",
    unit: "Litre",
    sku: "SAUCE-MAR-RT",
    description: "Signature recipe tomato sauce infused with fresh herbs and garlic.",
    image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 20,
    idealStock: 80,
    supplierId: "SUP-002",
    costPerUnit: 120,
    shelfLife: 15,
    expiryTracking: true,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-12T10:30:00Z",
    updatedAt: "2026-06-18T16:20:00Z"
  },
  {
    _id: "ing-4",
    ingredientCode: "ING-004",
    name: "Fresh Diced Red Onion",
    category: "Vegetables",
    unit: "Kg",
    sku: "VEG-ONION-R",
    description: "Crispy diced red onions, sourced locally.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 12,
    idealStock: 40,
    supplierId: "SUP-002",
    costPerUnit: 35,
    shelfLife: 5,
    expiryTracking: false,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-15T08:00:00Z",
    updatedAt: "2026-06-22T08:00:00Z"
  },
  {
    _id: "ing-5",
    ingredientCode: "ING-005",
    name: "Golden Sweet Corn Kernels",
    category: "Vegetables",
    unit: "Kg",
    sku: "VEG-CORN-SW",
    description: "Steamed sweet corn kernels, IQF frozen.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 8,
    idealStock: 30,
    supplierId: "SUP-002",
    costPerUnit: 90,
    shelfLife: 90,
    expiryTracking: true,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-15T08:15:00Z",
    updatedAt: "2026-06-19T09:45:00Z"
  },
  {
    _id: "ing-6",
    ingredientCode: "ING-006",
    name: "Fresh Paneer Cubes",
    category: "Cheese",
    unit: "Kg",
    sku: "CHEESE-PAN-CB",
    description: "Soft cottage cheese paneer cubes, processed daily.",
    image: "https://images.unsplash.com/photo-1573145959986-a142c6e68ea8?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 10,
    idealStock: 35,
    supplierId: "SUP-001",
    costPerUnit: 380,
    shelfLife: 7,
    expiryTracking: true,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-20T11:00:00Z",
    updatedAt: "2026-06-22T06:00:00Z"
  },
  {
    _id: "ing-7",
    ingredientCode: "ING-007",
    name: "Oregano Spice Sachets",
    category: "Seasoning",
    unit: "Pack",
    sku: "SPICE-ORE-SCH",
    description: "1g dried oregano seasoning packets.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 100,
    idealStock: 500,
    supplierId: "SUP-004",
    costPerUnit: 1.5,
    shelfLife: 180,
    expiryTracking: false,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-22T14:00:00Z",
    updatedAt: "2026-06-15T12:00:00Z"
  },
  {
    _id: "ing-8",
    ingredientCode: "ING-008",
    name: "10-Inch Corrugated Pizza Box",
    category: "Packaging",
    unit: "Piece",
    sku: "BOX-COR-10",
    description: "Eco-friendly food grade corrugated pizza delivery boxes.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 150,
    idealStock: 600,
    supplierId: "SUP-003",
    costPerUnit: 12,
    shelfLife: 365,
    expiryTracking: false,
    status: "ACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-25T15:30:00Z",
    updatedAt: "2026-06-10T10:00:00Z"
  },
  {
    _id: "ing-9",
    ingredientCode: "ING-009",
    name: "Chili Flakes Sachets",
    category: "Seasoning",
    unit: "Pack",
    sku: "SPICE-CHILI-SCH",
    description: "1g crushed red chili flakes packets.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    reorderLevel: 100,
    idealStock: 500,
    supplierId: "SUP-004",
    costPerUnit: 1.2,
    shelfLife: 180,
    expiryTracking: false,
    status: "INACTIVE",
    createdBy: "Franchise Admin",
    createdAt: "2026-05-22T14:15:00Z",
    updatedAt: "2026-06-12T11:00:00Z"
  }
];

export const mockStoreStocks = {
  "ing-1": [
    { store: "Indore Central", stock: 120, ideal: 200, reorder: 50, batch: "B-DOUGH-8840", status: "Healthy" },
    { store: "Bhopal Zone", stock: 45, ideal: 150, reorder: 40, batch: "B-DOUGH-8841", status: "Low Stock" },
    { store: "Ujjain Branch", stock: 80, ideal: 120, reorder: 30, batch: "B-DOUGH-8842", status: "Healthy" }
  ],
  "ing-2": [
    { store: "Indore Central", stock: 12, ideal: 60, reorder: 15, batch: "B-CHEESE-9022", status: "Low Stock" },
    { store: "Bhopal Zone", stock: 24, ideal: 50, reorder: 12, batch: "B-CHEESE-9023", status: "Healthy" },
    { store: "Ujjain Branch", stock: 5, ideal: 40, reorder: 10, batch: "B-CHEESE-9024", status: "Critical" }
  ],
  "ing-3": [
    { store: "Indore Central", stock: 45, ideal: 80, reorder: 20, batch: "B-SAUCE-110", status: "Healthy" },
    { store: "Bhopal Zone", stock: 18, ideal: 60, reorder: 15, batch: "B-SAUCE-111", status: "Low Stock" },
    { store: "Ujjain Branch", stock: 32, ideal: 50, reorder: 12, batch: "B-SAUCE-112", status: "Healthy" }
  ],
  "ing-4": [
    { store: "Indore Central", stock: 28, ideal: 40, reorder: 12, batch: "N/A", status: "Healthy" },
    { store: "Bhopal Zone", stock: 9, ideal: 30, reorder: 10, batch: "N/A", status: "Low Stock" },
    { store: "Ujjain Branch", stock: 15, ideal: 25, reorder: 8, batch: "N/A", status: "Healthy" }
  ],
  "ing-5": [
    { store: "Indore Central", stock: 22, ideal: 30, reorder: 8, batch: "B-CORN-049", status: "Healthy" },
    { store: "Bhopal Zone", stock: 6, ideal: 25, reorder: 8, batch: "B-CORN-050", status: "Low Stock" },
    { store: "Ujjain Branch", stock: 14, ideal: 20, reorder: 6, batch: "B-CORN-051", status: "Healthy" }
  ],
  "ing-6": [
    { store: "Indore Central", stock: 8, ideal: 35, reorder: 10, batch: "B-PAN-331", status: "Low Stock" },
    { store: "Bhopal Zone", stock: 18, ideal: 30, reorder: 10, batch: "B-PAN-332", status: "Healthy" },
    { store: "Ujjain Branch", stock: 4, ideal: 20, reorder: 8, batch: "B-PAN-333", status: "Critical" }
  ],
  "ing-7": [
    { store: "Indore Central", stock: 420, ideal: 500, reorder: 100, batch: "N/A", status: "Healthy" },
    { store: "Bhopal Zone", stock: 380, ideal: 400, reorder: 80, batch: "N/A", status: "Healthy" },
    { store: "Ujjain Branch", stock: 90, ideal: 300, reorder: 60, batch: "N/A", status: "Low Stock" }
  ],
  "ing-8": [
    { store: "Indore Central", stock: 510, ideal: 600, reorder: 150, batch: "N/A", status: "Healthy" },
    { store: "Bhopal Zone", stock: 120, ideal: 450, reorder: 120, batch: "N/A", status: "Critical" },
    { store: "Ujjain Branch", stock: 320, ideal: 400, reorder: 100, batch: "N/A", status: "Healthy" }
  ]
};

export const mockPurchaseOrders = {
  "ing-1": [
    { _id: "po-1", poNumber: "PO-2026-9042", supplierName: "Shiv Shakti Flour Mills", quantity: 300, rate: 45, amount: 13500, receivedDate: "2026-06-18T10:00:00Z", status: "COMPLETED" },
    { _id: "po-2", poNumber: "PO-2026-8811", supplierName: "Shiv Shakti Flour Mills", quantity: 200, rate: 45, amount: 9000, receivedDate: "2026-05-15T14:20:00Z", status: "COMPLETED" }
  ],
  "ing-2": [
    { _id: "po-3", poNumber: "PO-2026-9110", supplierName: "Durga Dairy Farms", quantity: 50, rate: 480, amount: 24000, receivedDate: "2026-06-15T09:30:00Z", status: "COMPLETED" },
    { _id: "po-4", poNumber: "PO-2026-8930", supplierName: "Durga Dairy Farms", quantity: 80, rate: 470, amount: 37600, receivedDate: "2026-05-20T11:00:00Z", status: "COMPLETED" }
  ],
  "ing-3": [
    { _id: "po-5", poNumber: "PO-2026-9049", supplierName: "Bharat Agro Foods", quantity: 100, rate: 120, amount: 12000, receivedDate: "2026-06-12T16:00:00Z", status: "COMPLETED" }
  ],
  "ing-4": [
    { _id: "po-6", poNumber: "PO-2026-9080", supplierName: "Bharat Agro Foods", quantity: 40, rate: 35, amount: 1400, receivedDate: "2026-06-20T12:00:00Z", status: "COMPLETED" }
  ],
  "ing-5": [
    { _id: "po-7", poNumber: "PO-2026-9081", supplierName: "Bharat Agro Foods", quantity: 50, rate: 90, amount: 4500, receivedDate: "2026-06-19T10:00:00Z", status: "COMPLETED" }
  ],
  "ing-6": [
    { _id: "po-8", poNumber: "PO-2026-9112", supplierName: "Durga Dairy Farms", quantity: 40, rate: 380, amount: 15200, receivedDate: "2026-06-16T09:00:00Z", status: "COMPLETED" }
  ],
  "ing-7": [
    { _id: "po-9", poNumber: "PO-2026-8799", supplierName: "Murali Organic Spices", quantity: 1000, rate: 1.5, amount: 1500, receivedDate: "2026-05-10T14:00:00Z", status: "COMPLETED" }
  ],
  "ing-8": [
    { _id: "po-10", poNumber: "PO-2026-8910", supplierName: "National Packaging Ltd.", quantity: 1000, rate: 12, amount: 12000, receivedDate: "2026-06-02T11:00:00Z", status: "COMPLETED" }
  ]
};

export const mockConsumptionHistory = {
  "ing-1": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 142, consumedQty: "142 Piece", products: "Margherita, Farmhouse Delight, Peppy Paneer" },
    { date: "2026-06-21", store: "Bhopal Zone", orderCount: 88, consumedQty: "88 Piece", products: "Margherita, Veg Supreme, Peppy Paneer" },
    { date: "2026-06-20", store: "Indore Central", orderCount: 165, consumedQty: "165 Piece", products: "Margherita, Peppy Paneer, Double Cheese" }
  ],
  "ing-2": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 142, consumedQty: "14.2 Kg", products: "Double Cheese, Margherita, Peppy Paneer" },
    { date: "2026-06-21", store: "Bhopal Zone", orderCount: 88, consumedQty: "8.8 Kg", products: "Margherita, Double Cheese, Peppy Paneer" }
  ],
  "ing-3": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 142, consumedQty: "7.1 Litre", products: "All Pizza Pizzas" }
  ],
  "ing-4": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 82, consumedQty: "4.1 Kg", products: "Veg Supreme, Peppy Paneer" }
  ],
  "ing-5": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 54, consumedQty: "2.7 Kg", products: "Veg Supreme, Farmhouse Delight" }
  ],
  "ing-6": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 48, consumedQty: "4.8 Kg", products: "Peppy Paneer, Tandoori Paneer" }
  ],
  "ing-7": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 142, consumedQty: "284 Pack", products: "Dine-in/Delivery Accompaniments" }
  ],
  "ing-8": [
    { date: "2026-06-21", store: "Indore Central", orderCount: 110, consumedQty: "110 Piece", products: "Delivery Orders" }
  ]
};

export const mockExpiryBatches = {
  "ing-1": [
    { batchNumber: "B-DOUGH-8840", mfgDate: "2026-06-21", expiryDate: "2026-06-24", quantity: 150, daysRemaining: 2, status: "NEAR EXPRIY" },
    { batchNumber: "B-DOUGH-8799", mfgDate: "2026-06-18", expiryDate: "2026-06-21", quantity: 50, daysRemaining: 0, status: "EXPIRED" }
  ],
  "ing-2": [
    { batchNumber: "B-CHEESE-9022", mfgDate: "2026-06-01", expiryDate: "2026-07-01", quantity: 45, daysRemaining: 9, status: "HEALTHY" },
    { batchNumber: "B-CHEESE-8890", mfgDate: "2026-05-15", expiryDate: "2026-06-15", quantity: 15, daysRemaining: -7, status: "EXPIRED" }
  ],
  "ing-3": [
    { batchNumber: "B-SAUCE-110", mfgDate: "2026-06-18", expiryDate: "2026-07-03", quantity: 60, daysRemaining: 11, status: "HEALTHY" }
  ],
  "ing-5": [
    { batchNumber: "B-CORN-049", mfgDate: "2026-05-01", expiryDate: "2026-08-01", quantity: 30, daysRemaining: 40, status: "HEALTHY" }
  ],
  "ing-6": [
    { batchNumber: "B-PAN-331", mfgDate: "2026-06-20", expiryDate: "2026-06-27", quantity: 30, daysRemaining: 5, status: "NEAR EXPRIY" },
    { batchNumber: "B-PAN-320", mfgDate: "2026-06-13", expiryDate: "2026-06-20", quantity: 10, daysRemaining: -2, status: "EXPIRED" }
  ]
};

export const mockStockTransactions = {
  "ing-1": [
    { date: "2026-06-21T18:30:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90422", quantity: -1, openingStock: 121, closingStock: 120, performedBy: "Rahul Dev (Kitchen)" },
    { date: "2026-06-18T11:00:00Z", store: "Indore Central", type: "Purchase", reference: "PO-2026-9042", quantity: 300, openingStock: 20, closingStock: 320, performedBy: "Indore Central Store Manager" },
    { date: "2026-06-15T10:15:00Z", store: "Bhopal Zone", type: "Adjustment", reference: "ADJ-0091", quantity: -5, openingStock: 50, closingStock: 45, performedBy: "Bhopal Store Manager (Spoilage)" }
  ],
  "ing-2": [
    { date: "2026-06-21T19:00:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90431", quantity: -0.2, openingStock: 12.2, closingStock: 12.0, performedBy: "Isha Sharma (Kitchen)" },
    { date: "2026-06-15T11:30:00Z", store: "Indore Central", type: "Purchase", reference: "PO-2026-9110", quantity: 50, openingStock: 15, closingStock: 65, performedBy: "Indore Central Store Manager" },
    { date: "2026-06-14T15:20:00Z", store: "Ujjain Branch", type: "Wastage", reference: "WST-0032", quantity: -2, openingStock: 7, closingStock: 5, performedBy: "Ujjain Chef (Soured)" }
  ],
  "ing-3": [
    { date: "2026-06-21T12:00:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90390", quantity: -0.5, openingStock: 45.5, closingStock: 45.0, performedBy: "Rahul Dev (Kitchen)" }
  ],
  "ing-4": [
    { date: "2026-06-21T14:20:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90420", quantity: -2, openingStock: 30, closingStock: 28, performedBy: "Rahul Dev (Kitchen)" },
    { date: "2026-06-20T10:00:00Z", store: "Bhopal Zone", type: "Purchase", reference: "PO-2026-9080", quantity: 40, openingStock: 10, closingStock: 50, performedBy: "Bhopal Store Manager" },
    { date: "2026-06-19T11:15:00Z", store: "Ujjain Branch", type: "Adjustment", reference: "ADJ-0081", quantity: -1, openingStock: 16, closingStock: 15, performedBy: "Ujjain Store Manager" }
  ],
  "ing-5": [
    { date: "2026-06-21T15:30:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90421", quantity: -1.5, openingStock: 23.5, closingStock: 22.0, performedBy: "Rahul Dev (Kitchen)" },
    { date: "2026-06-20T09:45:00Z", store: "Indore Central", type: "Purchase", reference: "PO-2026-9081", quantity: 50, openingStock: 5, closingStock: 55, performedBy: "Indore Central Store Manager" },
    { date: "2026-06-19T16:00:00Z", store: "Bhopal Zone", type: "Consumption", reference: "ORD-90380", quantity: -0.8, openingStock: 6.8, closingStock: 6.0, performedBy: "Bhopal Chef" },
    { date: "2026-06-18T10:30:00Z", store: "Ujjain Branch", type: "Adjustment", reference: "ADJ-0082", quantity: -2, openingStock: 16, closingStock: 14, performedBy: "Ujjain Store Manager" }
  ],
  "ing-6": [
    { date: "2026-06-21T16:10:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90425", quantity: -2, openingStock: 10, closingStock: 8, performedBy: "Isha Sharma (Kitchen)" },
    { date: "2026-06-20T11:15:00Z", store: "Bhopal Zone", type: "Purchase", reference: "PO-2026-9112", quantity: 40, openingStock: 5, closingStock: 45, performedBy: "Bhopal Store Manager" },
    { date: "2026-06-19T09:00:00Z", store: "Ujjain Branch", type: "Wastage", reference: "WST-0035", quantity: -1, openingStock: 5, closingStock: 4, performedBy: "Ujjain Chef (Soured)" }
  ],
  "ing-7": [
    { date: "2026-06-21T17:00:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90426", quantity: -20, openingStock: 440, closingStock: 420, performedBy: "Rahul Dev (Kitchen)" },
    { date: "2026-06-20T14:30:00Z", store: "Bhopal Zone", type: "Purchase", reference: "PO-2026-8799", quantity: 1000, openingStock: 200, closingStock: 1200, performedBy: "Bhopal Store Manager" }
  ],
  "ing-8": [
    { date: "2026-06-21T17:45:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90427", quantity: -15, openingStock: 525, closingStock: 510, performedBy: "Rahul Dev (Kitchen)" },
    { date: "2026-06-20T11:00:00Z", store: "Indore Central", type: "Purchase", reference: "PO-2026-8910", quantity: 1000, openingStock: 50, closingStock: 1050, performedBy: "Indore Central Store Manager" }
  ],
  "ing-9": [
    { date: "2026-06-21T18:00:00Z", store: "Indore Central", type: "Consumption", reference: "ORD-90428", quantity: -25, openingStock: 300, closingStock: 275, performedBy: "Rahul Dev (Kitchen)" }
  ]
};

export const mockInventoryStocks = [
  // ing-1 (Hand-Tossed Pizza Dough)
  { _id: "stk-store-1-ing-1", storeId: "store-1", ingredientId: "ing-1", currentStock: 120, reservedStock: 10, availableStock: 110, idealStock: 200, reorderLevel: 50, unit: "Piece", lastUpdated: "2026-06-21T18:30:00Z", updatedBy: "Rahul Dev" },
  { _id: "stk-store-2-ing-1", storeId: "store-2", ingredientId: "ing-1", currentStock: 45, reservedStock: 0, availableStock: 45, idealStock: 150, reorderLevel: 40, unit: "Piece", lastUpdated: "2026-06-15T10:15:00Z", updatedBy: "Bhopal Store Manager" },
  { _id: "stk-store-3-ing-1", storeId: "store-3", ingredientId: "ing-1", currentStock: 80, reservedStock: 5, availableStock: 75, idealStock: 120, reorderLevel: 30, unit: "Piece", lastUpdated: "2026-06-20T14:30:00Z", updatedBy: "Ujjain Store Manager" },

  // ing-2 (Premium Mozzarella Cheese)
  { _id: "stk-store-1-ing-2", storeId: "store-1", ingredientId: "ing-2", currentStock: 12, reservedStock: 2, availableStock: 10, idealStock: 60, reorderLevel: 15, unit: "Kg", lastUpdated: "2026-06-21T19:00:00Z", updatedBy: "Isha Sharma" },
  { _id: "stk-store-2-ing-2", storeId: "store-2", ingredientId: "ing-2", currentStock: 24, reservedStock: 4, availableStock: 20, idealStock: 50, reorderLevel: 12, unit: "Kg", lastUpdated: "2026-06-15T11:30:00Z", updatedBy: "Indore Central Store Manager" },
  { _id: "stk-store-3-ing-2", storeId: "store-3", ingredientId: "ing-2", currentStock: 5, reservedStock: 1, availableStock: 4, idealStock: 40, reorderLevel: 10, unit: "Kg", lastUpdated: "2026-06-14T15:20:00Z", updatedBy: "Ujjain Chef" },

  // ing-3 (Rich Tomato Marinara Sauce)
  { _id: "stk-store-1-ing-3", storeId: "store-1", ingredientId: "ing-3", currentStock: 45, reservedStock: 5, availableStock: 40, idealStock: 80, reorderLevel: 20, unit: "Litre", lastUpdated: "2026-06-21T12:00:00Z", updatedBy: "Rahul Dev" },
  { _id: "stk-store-2-ing-3", storeId: "store-2", ingredientId: "ing-3", currentStock: 18, reservedStock: 2, availableStock: 16, idealStock: 60, reorderLevel: 15, unit: "Litre", lastUpdated: "2026-06-20T10:00:00Z", updatedBy: "Bhopal Store Manager" },
  { _id: "stk-store-3-ing-3", storeId: "store-3", ingredientId: "ing-3", currentStock: 32, reservedStock: 0, availableStock: 32, idealStock: 50, reorderLevel: 12, unit: "Litre", lastUpdated: "2026-06-18T16:20:00Z", updatedBy: "System" },

  // ing-4 (Fresh Diced Red Onion)
  { _id: "stk-store-1-ing-4", storeId: "store-1", ingredientId: "ing-4", currentStock: 28, reservedStock: 3, availableStock: 25, idealStock: 40, reorderLevel: 12, unit: "Kg", lastUpdated: "2026-06-21T14:20:00Z", updatedBy: "Rahul Dev" },
  { _id: "stk-store-2-ing-4", storeId: "store-2", ingredientId: "ing-4", currentStock: 9, reservedStock: 0, availableStock: 9, idealStock: 30, reorderLevel: 10, unit: "Kg", lastUpdated: "2026-06-20T10:00:00Z", updatedBy: "Bhopal Store Manager" },
  { _id: "stk-store-3-ing-4", storeId: "store-3", ingredientId: "ing-4", currentStock: 15, reservedStock: 0, availableStock: 15, idealStock: 25, reorderLevel: 8, unit: "Kg", lastUpdated: "2026-06-19T11:15:00Z", updatedBy: "Ujjain Store Manager" },

  // ing-5 (Golden Sweet Corn Kernels)
  { _id: "stk-store-1-ing-5", storeId: "store-1", ingredientId: "ing-5", currentStock: 22, reservedStock: 2, availableStock: 20, idealStock: 30, reorderLevel: 8, unit: "Kg", lastUpdated: "2026-06-21T15:30:00Z", updatedBy: "Rahul Dev" },
  { _id: "stk-store-2-ing-5", storeId: "store-2", ingredientId: "ing-5", currentStock: 6, reservedStock: 0, availableStock: 6, idealStock: 25, reorderLevel: 8, unit: "Kg", lastUpdated: "2026-06-19T16:00:00Z", updatedBy: "Bhopal Chef" },
  { _id: "stk-store-3-ing-5", storeId: "store-3", ingredientId: "ing-5", currentStock: 14, reservedStock: 1, availableStock: 13, idealStock: 20, reorderLevel: 6, unit: "Kg", lastUpdated: "2026-06-18T10:30:00Z", updatedBy: "Ujjain Store Manager" },

  // ing-6 (Fresh Paneer Cubes)
  { _id: "stk-store-1-ing-6", storeId: "store-1", ingredientId: "ing-6", currentStock: 8, reservedStock: 1, availableStock: 7, idealStock: 35, reorderLevel: 10, unit: "Kg", lastUpdated: "2026-06-21T16:10:00Z", updatedBy: "Isha Sharma" },
  { _id: "stk-store-2-ing-6", storeId: "store-2", ingredientId: "ing-6", currentStock: 18, reservedStock: 2, availableStock: 16, idealStock: 30, reorderLevel: 10, unit: "Kg", lastUpdated: "2026-06-20T11:15:00Z", updatedBy: "Bhopal Store Manager" },
  { _id: "stk-store-3-ing-6", storeId: "store-3", ingredientId: "ing-6", currentStock: 4, reservedStock: 0, availableStock: 4, idealStock: 20, reorderLevel: 8, unit: "Kg", lastUpdated: "2026-06-19T09:00:00Z", updatedBy: "Ujjain Chef" },

  // ing-7 (Oregano Spice Sachets)
  { _id: "stk-store-1-ing-7", storeId: "store-1", ingredientId: "ing-7", currentStock: 420, reservedStock: 0, availableStock: 420, idealStock: 500, reorderLevel: 100, unit: "Pack", lastUpdated: "2026-06-21T17:00:00Z", updatedBy: "Rahul Dev" },
  { _id: "stk-store-2-ing-7", storeId: "store-2", ingredientId: "ing-7", currentStock: 380, reservedStock: 0, availableStock: 380, idealStock: 400, reorderLevel: 80, unit: "Pack", lastUpdated: "2026-06-20T14:30:00Z", updatedBy: "Bhopal Store Manager" },
  { _id: "stk-store-3-ing-7", storeId: "store-3", ingredientId: "ing-7", currentStock: 90, reservedStock: 0, availableStock: 90, idealStock: 300, reorderLevel: 60, unit: "Pack", lastUpdated: "2026-06-15T12:00:00Z", updatedBy: "System" },

  // ing-8 (10-Inch Corrugated Pizza Box)
  { _id: "stk-store-1-ing-8", storeId: "store-1", ingredientId: "ing-8", currentStock: 510, reservedStock: 10, availableStock: 500, idealStock: 600, reorderLevel: 150, unit: "Piece", lastUpdated: "2026-06-21T17:45:00Z", updatedBy: "Rahul Dev" },
  { _id: "stk-store-2-ing-8", storeId: "store-2", ingredientId: "ing-8", currentStock: 120, reservedStock: 0, availableStock: 120, idealStock: 450, reorderLevel: 120, unit: "Piece", lastUpdated: "2026-06-20T11:00:00Z", updatedBy: "Indore Central Store Manager" },
  { _id: "stk-store-3-ing-8", storeId: "store-3", ingredientId: "ing-8", currentStock: 320, reservedStock: 0, availableStock: 320, idealStock: 400, reorderLevel: 100, unit: "Piece", lastUpdated: "2026-06-10T10:00:00Z", updatedBy: "System" },

  // ing-9 (Chili Flakes Sachets)
  { _id: "stk-store-1-ing-9", storeId: "store-1", ingredientId: "ing-9", currentStock: 275, reservedStock: 0, availableStock: 275, idealStock: 500, reorderLevel: 100, unit: "Pack", lastUpdated: "2026-06-21T18:00:00Z", updatedBy: "Rahul Dev" },
  { _id: "stk-store-2-ing-9", storeId: "store-2", ingredientId: "ing-9", currentStock: 0, reservedStock: 0, availableStock: 0, idealStock: 400, reorderLevel: 80, unit: "Pack", lastUpdated: "2026-06-22T08:00:00Z", updatedBy: "System" }
];

export const mockInventoryTransactions = [
  // ing-1
  { _id: "txn-1", storeId: "store-1", ingredientId: "ing-1", type: "Consumption", quantity: -1, previousStock: 121, newStock: 120, reason: "Order Preparation", referenceId: "ORD-90422", createdBy: "Rahul Dev", createdAt: "2026-06-21T18:30:00Z" },
  { _id: "txn-2", storeId: "store-1", ingredientId: "ing-1", type: "Purchase", quantity: 300, previousStock: 20, newStock: 320, reason: "New Stock Arrival", referenceId: "PO-2026-9042", createdBy: "Indore Central Store Manager", createdAt: "2026-06-18T11:00:00Z" },
  { _id: "txn-3", storeId: "store-2", ingredientId: "ing-1", type: "Adjustment", quantity: -5, previousStock: 50, newStock: 45, reason: "Manual Correction", referenceId: "ADJ-0091", createdBy: "Bhopal Store Manager", createdAt: "2026-06-15T10:15:00Z" },

  // ing-2
  { _id: "txn-4", storeId: "store-1", ingredientId: "ing-2", type: "Consumption", quantity: -0.2, previousStock: 12.2, newStock: 12.0, reason: "Order Preparation", referenceId: "ORD-90431", createdBy: "Isha Sharma", createdAt: "2026-06-21T19:00:00Z" },
  { _id: "txn-5", storeId: "store-1", ingredientId: "ing-2", type: "Purchase", quantity: 50, previousStock: 15, newStock: 65, reason: "New Stock Arrival", referenceId: "PO-2026-9110", createdBy: "Indore Central Store Manager", createdAt: "2026-06-15T11:30:00Z" },
  { _id: "txn-6", storeId: "store-3", ingredientId: "ing-2", type: "Waste", quantity: -2, previousStock: 7, newStock: 5, reason: "Damage", referenceId: "WST-0032", createdBy: "Ujjain Chef", createdAt: "2026-06-14T15:20:00Z" },

  // ing-3
  { _id: "txn-7", storeId: "store-1", ingredientId: "ing-3", type: "Consumption", quantity: -0.5, previousStock: 45.5, newStock: 45.0, reason: "Order Preparation", referenceId: "ORD-90390", createdBy: "Rahul Dev", createdAt: "2026-06-21T12:00:00Z" },

  // ing-4
  { _id: "txn-8", storeId: "store-1", ingredientId: "ing-4", type: "Consumption", quantity: -2, previousStock: 30, newStock: 28, reason: "Order Preparation", referenceId: "ORD-90420", createdBy: "Rahul Dev", createdAt: "2026-06-21T14:20:00Z" },
  { _id: "txn-9", storeId: "store-2", ingredientId: "ing-4", type: "Purchase", quantity: 40, previousStock: 10, newStock: 50, reason: "New Stock Arrival", referenceId: "PO-2026-9080", createdBy: "Bhopal Store Manager", createdAt: "2026-06-20T10:00:00Z" },
  { _id: "txn-10", storeId: "store-3", ingredientId: "ing-4", type: "Adjustment", quantity: -1, previousStock: 16, newStock: 15, reason: "Manual Correction", referenceId: "ADJ-0081", createdBy: "Ujjain Store Manager", createdAt: "2026-06-19T11:15:00Z" },

  // ing-5
  { _id: "txn-11", storeId: "store-1", ingredientId: "ing-5", type: "Consumption", quantity: -1.5, previousStock: 23.5, newStock: 22.0, reason: "Order Preparation", referenceId: "ORD-90421", createdBy: "Rahul Dev", createdAt: "2026-06-21T15:30:00Z" },
  { _id: "txn-12", storeId: "store-1", ingredientId: "ing-5", type: "Purchase", quantity: 50, previousStock: 5, newStock: 55, reason: "New Stock Arrival", referenceId: "PO-2026-9081", createdBy: "Indore Central Store Manager", createdAt: "2026-06-20T09:45:00Z" },
  { _id: "txn-13", storeId: "store-2", ingredientId: "ing-5", type: "Consumption", quantity: -0.8, previousStock: 6.8, newStock: 6.0, reason: "Order Preparation", referenceId: "ORD-90380", createdBy: "Bhopal Chef", createdAt: "2026-06-19T16:00:00Z" },
  { _id: "txn-14", storeId: "store-3", ingredientId: "ing-5", type: "Adjustment", quantity: -2, previousStock: 16, newStock: 14, reason: "Manual Correction", referenceId: "ADJ-0082", createdBy: "Ujjain Store Manager", createdAt: "2026-06-18T10:30:00Z" }
];

export const mockLowStockAlerts = [
  {
    _id: "alt-1",
    storeId: "store-1",
    ingredientId: "ing-2",
    currentStock: 12,
    reorderLevel: 15,
    severity: "CRITICAL",
    status: "OPEN",
    assignedTo: "mgr-1",
    notes: "Requires immediate reorder from Durga Dairy Farms.",
    createdAt: "2026-06-22T08:30:00Z",
    resolvedAt: null,
    createdBy: "System",
    updatedBy: "System"
  },
  {
    _id: "alt-2",
    storeId: "store-3",
    ingredientId: "ing-2",
    currentStock: 5,
    reorderLevel: 10,
    severity: "CRITICAL",
    status: "OPEN",
    assignedTo: "mgr-3",
    notes: "Critical shortage of cheese for the weekend peak hours.",
    createdAt: "2026-06-22T09:15:00Z",
    resolvedAt: null,
    createdBy: "System",
    updatedBy: "System"
  },
  {
    _id: "alt-3",
    storeId: "store-1",
    ingredientId: "ing-6",
    currentStock: 8,
    reorderLevel: 10,
    severity: "LOW",
    status: "OPEN",
    assignedTo: "mgr-1",
    notes: "Paneer consumption is high. Reorder standard quantity.",
    createdAt: "2026-06-22T10:00:00Z",
    resolvedAt: null,
    createdBy: "System",
    updatedBy: "System"
  },
  {
    _id: "alt-4",
    storeId: "store-3",
    ingredientId: "ing-6",
    currentStock: 4,
    reorderLevel: 8,
    severity: "CRITICAL",
    status: "OPEN",
    assignedTo: "mgr-3",
    notes: "Awaiting local dairy supply adjustment.",
    createdAt: "2026-06-22T10:45:00Z",
    resolvedAt: null,
    createdBy: "System",
    updatedBy: "System"
  },
  {
    _id: "alt-5",
    storeId: "store-2",
    ingredientId: "ing-8",
    currentStock: 120,
    reorderLevel: 120,
    severity: "LOW",
    status: "OPEN",
    assignedTo: "mgr-2",
    notes: "Reorder scheduled for boxes.",
    createdAt: "2026-06-22T11:00:00Z",
    resolvedAt: null,
    createdBy: "System",
    updatedBy: "System"
  },
  {
    _id: "alt-6",
    storeId: "store-2",
    ingredientId: "ing-2",
    currentStock: 24,
    reorderLevel: 12,
    severity: "CRITICAL",
    status: "RESOLVED",
    assignedTo: "mgr-2",
    notes: "Stock replenished via purchase order PO-2026-9110.",
    createdAt: "2026-06-21T09:00:00Z",
    resolvedAt: "2026-06-21T15:30:00Z",
    createdBy: "System",
    updatedBy: "mgr-2"
  },
  {
    _id: "alt-7",
    storeId: "store-1",
    ingredientId: "ing-4",
    currentStock: 28,
    reorderLevel: 12,
    severity: "LOW",
    status: "RESOLVED",
    assignedTo: "mgr-1",
    notes: "Manual adjustment completed after receiving local bags.",
    createdAt: "2026-06-21T10:00:00Z",
    resolvedAt: "2026-06-21T14:20:00Z",
    createdBy: "System",
    updatedBy: "mgr-1"
  }
];

export const mockPurchaseRequests = [
  {
    _id: "pr-1",
    requestNumber: "PR-2026-0001",
    storeId: "store-1",
    requestedBy: "mgr-1", // Subham Jamliya
    status: "Pending",
    priority: "Urgent",
    totalAmount: 33300,
    remarks: "Urgent cheese and paneer replenishment needed before weekend peak hours.",
    approvedBy: null,
    approvedAt: null,
    createdAt: "2026-06-22T08:00:00Z"
  },
  {
    _id: "pr-2",
    requestNumber: "PR-2026-0002",
    storeId: "store-2",
    requestedBy: "mgr-2", // Rashid Khan
    status: "Approved",
    priority: "High",
    totalAmount: 17205,
    remarks: "Bhopal zone dough and cheese restock.",
    approvedBy: "Franchise Admin",
    approvedAt: "2026-06-21T14:30:00Z",
    createdAt: "2026-06-21T10:15:00Z"
  },
  {
    _id: "pr-3",
    requestNumber: "PR-2026-0003",
    storeId: "store-1",
    requestedBy: "mgr-1",
    status: "Received",
    priority: "Medium",
    totalAmount: 4200,
    remarks: "Tomato marinara sauce batch replenishment.",
    approvedBy: "Franchise Admin",
    approvedAt: "2026-06-20T11:00:00Z",
    createdAt: "2026-06-20T08:45:00Z"
  },
  {
    _id: "pr-4",
    requestNumber: "PR-2026-0004",
    storeId: "store-3",
    requestedBy: "mgr-3", // Aarav Sharma
    status: "Rejected",
    priority: "Low",
    totalAmount: 1500,
    remarks: "Duplicate request for boxes.",
    approvedBy: "Franchise Admin",
    approvedAt: "2026-06-20T15:00:00Z",
    createdAt: "2026-06-20T13:30:00Z"
  },
  {
    _id: "pr-5",
    requestNumber: "PR-2026-0005",
    storeId: "store-2",
    requestedBy: "mgr-2",
    status: "Draft",
    priority: "Low",
    totalAmount: 3960,
    remarks: "Drafting requirements for next week packaging.",
    approvedBy: null,
    approvedAt: null,
    createdAt: "2026-06-22T11:30:00Z"
  }
];

export const mockPurchaseRequestItems = [
  // pr-1 items
  {
    _id: "pri-1",
    requestId: "pr-1",
    ingredientId: "ing-2", // Premium Mozzarella Cheese
    requestedQty: 48,
    approvedQty: 0,
    unitPrice: 480,
    totalPrice: 23040
  },
  {
    _id: "pri-2",
    requestId: "pr-1",
    ingredientId: "ing-6", // Fresh Paneer Cubes
    requestedQty: 27,
    approvedQty: 0,
    unitPrice: 380,
    totalPrice: 10260
  },
  
  // pr-2 items
  {
    _id: "pri-3",
    requestId: "pr-2",
    ingredientId: "ing-2",
    requestedQty: 26,
    approvedQty: 26,
    unitPrice: 480,
    totalPrice: 12480
  },
  {
    _id: "pri-4",
    requestId: "pr-2",
    ingredientId: "ing-1", // Hand-Tossed Pizza Dough
    requestedQty: 105,
    approvedQty: 105,
    unitPrice: 45,
    totalPrice: 4725
  },

  // pr-3 items
  {
    _id: "pri-5",
    requestId: "pr-3",
    ingredientId: "ing-3", // Rich Tomato Marinara Sauce
    requestedQty: 35,
    approvedQty: 35,
    unitPrice: 120,
    totalPrice: 4200
  },

  // pr-4 items
  {
    _id: "pri-6",
    requestId: "pr-4",
    ingredientId: "ing-8", // 10-Inch Corrugated Pizza Box
    requestedQty: 125,
    approvedQty: 0,
    unitPrice: 12,
    totalPrice: 1500
  },

  // pr-5 items
  {
    _id: "pri-7",
    requestId: "pr-5",
    ingredientId: "ing-8",
    requestedQty: 330,
    approvedQty: 0,
    unitPrice: 12,
    totalPrice: 3960
  }
];


