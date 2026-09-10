// Mock Data for Kitchen Queue, Preparation Board & Pizza Station Operations
// Complies with MongoDB schemas for orders, order_items, customers, stores, staff, recipes, ingredients, shortages

export const mockChefs = [
  {
    _id: "chef-001",
    employeeId: "EMP-CHEF-101",
    name: "Chef Rajesh Kumar",
    role: "chef",
    status: "active",
    currentWorkload: 2, // number of active preparing orders
    maxWorkload: 4,
    availability: "available", // available, busy, off-duty
    avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "chef-002",
    employeeId: "EMP-CHEF-102",
    name: "Chef Vikram Rathore",
    role: "chef",
    status: "active",
    currentWorkload: 4,
    maxWorkload: 4,
    availability: "busy",
    avatar: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "chef-003",
    employeeId: "EMP-CHEF-103",
    name: "Chef Sanjay Sharma",
    role: "chef",
    status: "active",
    currentWorkload: 1,
    maxWorkload: 3,
    availability: "available",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "chef-004",
    employeeId: "EMP-CHEF-104",
    name: "Chef Priya Patel",
    role: "chef",
    status: "active",
    currentWorkload: 0,
    maxWorkload: 4,
    availability: "available",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "chef-005",
    employeeId: "EMP-CHEF-105",
    name: "Chef Amit Verma",
    role: "chef",
    status: "inactive",
    currentWorkload: 0,
    maxWorkload: 3,
    availability: "off-duty",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&fm=webp"
  }
];

export const initialMockOrders = [
  {
    _id: "ord-1051",
    orderNumber: "PVP-1051",
    customerId: "cust-101",
    customer: {
      name: "Rohan Malhotra",
      phone: "+91 98765 43210",
      email: "rohan.malhotra@gmail.com",
      deliveryAddress: {
        houseNumber: "Flat 402, Block C",
        street: "Shalimar Township",
        landmark: "Near Apollo Hospital",
        city: "Indore",
        pincode: "452010",
        notes: "Ring bell twice, deliver to door."
      }
    },
    storeId: "store-indore-01",
    status: "confirmed", // New Order column
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 mins ago
    queueEntryTime: null,
    expectedReadyTime: new Date(Date.now() + 25 * 60000).toISOString(),
    sla_minutes: 20,
    priority: "NORMAL",
    paymentStatus: "paid",
    paymentMethod: "ONLINE",
    transactionId: "TXN-8829104829",
    grandTotal: 580,
    assigned_chef: null,
    specialInstructions: "Make it extra spicy. Less onion.",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 10 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 5 * 60000).toISOString() }
    ],
    items: [
      {
        orderItemId: "oi-1051-1",
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        quantity: 2,
        size: "Medium",
        crust: "New Hand Tossed",
        toppings: ["Extra Cheese", "Tomato"],
        unitPrice: 240,
        subtotal: 480,
        specialInstructions: "Extra cheese on one, less on the other."
      },
      {
        orderItemId: "oi-1051-2",
        productId: "prod-002",
        name: "Garlic Breadsticks",
        quantity: 1,
        size: "Regular",
        crust: "N/A",
        toppings: [],
        unitPrice: 100,
        subtotal: 100,
        specialInstructions: ""
      }
    ]
  },
  {
    _id: "ord-1052",
    orderNumber: "PVP-1052",
    customerId: "cust-102",
    customer: {
      name: "Isha Sharma",
      phone: "+91 91234 56789",
      email: "isha.sharma@yahoo.co.in",
      deliveryAddress: {
        houseNumber: "House No. 12",
        street: "Saket Colony",
        landmark: "Opposite Saket Club",
        city: "Indore",
        pincode: "452018",
        notes: "Leave with security guard if not answering."
      }
    },
    storeId: "store-indore-01",
    status: "queued", // Accepted Orders column
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(), // 18 mins ago
    queueEntryTime: new Date(Date.now() - 15 * 60000).toISOString(), // Entered queue 15 mins ago
    expectedReadyTime: new Date(Date.now() + 10 * 60000).toISOString(),
    sla_minutes: 20,
    priority: "VIP", // Also Priority column
    paymentStatus: "paid",
    paymentMethod: "WALLET",
    transactionId: "TXN-9042918402",
    grandTotal: 720,
    assigned_chef: "chef-001", // Chef Rajesh Kumar
    specialInstructions: "Do not add olives. Jalapenos preferred.",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 22 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 18 * 60000).toISOString() },
      { status: "Queue Entry", time: new Date(Date.now() - 15 * 60000).toISOString() }
    ],
    items: [
      {
        orderItemId: "oi-1052-1",
        productId: "prod-003",
        name: "Farmhouse Pizza",
        quantity: 1,
        size: "Large",
        crust: "Cheese Burst",
        toppings: ["Mushrooms", "Capsicum", "Paneer"],
        unitPrice: 480,
        subtotal: 480,
        specialInstructions: "Add extra paneer cubes."
      },
      {
        orderItemId: "oi-1052-2",
        productId: "prod-004",
        name: "Choco Lava Cake",
        quantity: 2,
        size: "Regular",
        crust: "N/A",
        toppings: [],
        unitPrice: 120,
        subtotal: 240,
        specialInstructions: "Serve hot."
      }
    ]
  },
  {
    _id: "ord-1053",
    orderNumber: "PVP-1053",
    customerId: "cust-103",
    customer: {
      name: "Amit Verma",
      phone: "+91 99887 76655",
      email: "amit.verma@rediffmail.com",
      deliveryAddress: {
        houseNumber: "Sector B, Qtr 205",
        street: "Vijay Nagar",
        landmark: "Behind C21 Mall",
        city: "Indore",
        pincode: "452010",
        notes: "Deliver before 12:00 PM."
      }
    },
    storeId: "store-indore-01",
    status: "queued",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    queueEntryTime: new Date(Date.now() - 22 * 60000).toISOString(), // 22 mins ago (Exceeds SLA 15) -> Delayed Orders
    expectedReadyTime: new Date(Date.now() - 2 * 60000).toISOString(), // Overdue by 2 mins
    sla_minutes: 15,
    priority: "EXPRESS", // Also Priority column
    paymentStatus: "pending",
    paymentMethod: "COD",
    transactionId: "N/A",
    grandTotal: 350,
    assigned_chef: null,
    specialInstructions: "No special requirements.",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 30 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 25 * 60000).toISOString() },
      { status: "Queue Entry", time: new Date(Date.now() - 22 * 60000).toISOString() }
    ],
    items: [
      {
        orderItemId: "oi-1053-1",
        productId: "prod-005",
        name: "Tandoori Paneer Pizza",
        quantity: 1,
        size: "Medium",
        crust: "Thin Crust",
        toppings: ["Tandoori Paneer", "Red Paprika", "Onion"],
        unitPrice: 350,
        subtotal: 350,
        specialInstructions: "Thin crust must be crisp."
      }
    ]
  },
  {
    _id: "ord-1054",
    orderNumber: "PVP-1054",
    customerId: "cust-104",
    customer: {
      name: "Neha Joshi",
      phone: "+91 93456 78901",
      email: "neha.joshi@gmail.com",
      deliveryAddress: {
        houseNumber: "Apt 101, Residency",
        street: "Palasia Main Rd",
        landmark: "Near Palasia Square",
        city: "Indore",
        pincode: "452001",
        notes: "Ring bell and leave order on the chair outside."
      }
    },
    storeId: "store-indore-01",
    status: "confirmed",
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(), // 1 min ago
    queueEntryTime: null,
    expectedReadyTime: new Date(Date.now() + 29 * 60000).toISOString(),
    sla_minutes: 25,
    priority: "NORMAL",
    paymentStatus: "paid",
    paymentMethod: "ONLINE",
    transactionId: "TXN-7739102941",
    grandTotal: 1250,
    assigned_chef: null,
    specialInstructions: "Make sure pizzas are cut into 8 slices instead of 6.",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 4 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 1 * 60000).toISOString() }
    ],
    items: [
      {
        orderItemId: "oi-1054-1",
        productId: "prod-006",
        name: "Veggie Supreme Pizza",
        quantity: 2,
        size: "Medium",
        crust: "New Hand Tossed",
        toppings: ["Onion", "Capsicum", "Mushroom", "Sweet Corn", "Black Olives"],
        unitPrice: 320,
        subtotal: 640,
        specialInstructions: "Load up on olives."
      },
      {
        orderItemId: "oi-1054-2",
        productId: "prod-007",
        name: "Peppy Paneer Pizza",
        quantity: 1,
        size: "Large",
        crust: "Cheese Burst",
        toppings: ["Paneer", "Capsicum", "Red Paprika"],
        unitPrice: 490,
        subtotal: 490,
        specialInstructions: "Extra cheese burst."
      },
      {
        orderItemId: "oi-1054-3",
        productId: "prod-008",
        name: "Stuffed Garlic Bread",
        quantity: 1,
        size: "Regular",
        crust: "N/A",
        toppings: [],
        unitPrice: 120,
        subtotal: 120,
        specialInstructions: ""
      }
    ]
  },
  {
    _id: "ord-1055",
    orderNumber: "PVP-1055",
    customerId: "cust-105",
    customer: {
      name: "Sanjay Gupta",
      phone: "+91 97766 55443",
      email: "sanjay.gupta@gmail.com",
      deliveryAddress: {
        houseNumber: "House 54",
        street: "Anurag Nagar",
        landmark: "Behind Press Complex",
        city: "Indore",
        pincode: "452003",
        notes: "Deliver in back alley."
      }
    },
    storeId: "store-indore-01",
    status: "preparing", // Preparing orders (shown under Accepted/In progress)
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    queueEntryTime: new Date(Date.now() - 12 * 60000).toISOString(),
    expectedReadyTime: new Date(Date.now() + 5 * 60000).toISOString(),
    sla_minutes: 20,
    priority: "NORMAL",
    paymentStatus: "paid",
    paymentMethod: "ONLINE",
    transactionId: "TXN-8823102345",
    grandTotal: 410,
    assigned_chef: "chef-003", // Chef Sanjay Sharma
    specialInstructions: "Add oregano seasoning packets.",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 20 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 15 * 60000).toISOString() },
      { status: "Queue Entry", time: new Date(Date.now() - 12 * 60000).toISOString() },
      { status: "Preparation Started", time: new Date(Date.now() - 8 * 60000).toISOString() }
    ],
    items: [
      {
        orderItemId: "oi-1055-1",
        productId: "prod-009",
        name: "Country Special Pizza",
        quantity: 1,
        size: "Medium",
        crust: "New Hand Tossed",
        toppings: ["Onion", "Tomato", "Capsicum"],
        unitPrice: 290,
        subtotal: 290,
        specialInstructions: "No tomatoes please."
      },
      {
        orderItemId: "oi-1055-2",
        productId: "prod-010",
        name: "Pepsi Cola",
        quantity: 2,
        size: "500ml Can",
        crust: "N/A",
        toppings: [],
        unitPrice: 60,
        subtotal: 120,
        specialInstructions: "Serve chilled."
      }
    ]
  }
];

// MOCK INGREDIENTS
export const mockIngredients = [
  { _id: "ing-001", name: "Premium Mozzarella Cheese", currentStock: 24.5, unit: "kg", availability: "In Stock" },
  { _id: "ing-002", name: "Fresh Pizza Dough (Medium)", currentStock: 12.0, unit: "units", availability: "In Stock" },
  { _id: "ing-003", name: "Fresh Pizza Dough (Large)", currentStock: 2.0, unit: "units", availability: "Low Stock" },
  { _id: "ing-004", name: "Signature Pizza Sauce", currentStock: 8.5, unit: "liters", availability: "In Stock" },
  { _id: "ing-005", name: "Sliced Mushrooms", currentStock: 4.2, unit: "kg", availability: "In Stock" },
  { _id: "ing-006", name: "Diced Tricolor Capsicum", currentStock: 0.0, unit: "kg", availability: "Out of Stock" },
  { _id: "ing-007", name: "Fresh Diced Paneer", currentStock: 6.0, unit: "kg", availability: "In Stock" },
  { _id: "ing-008", name: "Spicy Jalapeno Slices", currentStock: 1.5, unit: "kg", availability: "Low Stock" },
  { _id: "ing-009", name: "Black Olive Slices", currentStock: 3.8, unit: "kg", availability: "In Stock" },
  { _id: "ing-010", name: "Sweet Corn Kernels", currentStock: 5.0, unit: "kg", availability: "In Stock" }
];

// MOCK RECIPES
export const mockRecipes = [
  {
    _id: "rec-001",
    name: "Double Cheese Margherita Pizza",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
    prepTime: 10,
    difficulty: "Easy",
    recipeCode: "REC-MARG-01",
    ingredients: [
      { ingredientId: "ing-002", name: "Fresh Pizza Dough (Medium)", quantity: 1, unit: "unit" },
      { ingredientId: "ing-004", name: "Signature Pizza Sauce", quantity: 120, unit: "ml" },
      { ingredientId: "ing-001", name: "Premium Mozzarella Cheese", quantity: 180, unit: "g" }
    ],
    instructions: [
      "Stretches fresh pizza dough to 10-inch diameter on screen.",
      "Spreads 120ml signature pizza sauce evenly, leaving 1/2-inch border.",
      "Distributes 180g mozzarella cheese uniformly over sauce.",
      "Inspect edges for topping symmetry.",
      "Transfers stretched pizza to oven loading line."
    ]
  },
  {
    _id: "rec-002",
    name: "Farmhouse Pizza",
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=300&fm=webp",
    prepTime: 12,
    difficulty: "Medium",
    recipeCode: "REC-FARM-03",
    ingredients: [
      { ingredientId: "ing-002", name: "Fresh Pizza Dough (Medium)", quantity: 1, unit: "unit" },
      { ingredientId: "ing-004", name: "Signature Pizza Sauce", quantity: 120, unit: "ml" },
      { ingredientId: "ing-001", name: "Premium Mozzarella Cheese", quantity: 140, unit: "g" },
      { ingredientId: "ing-005", name: "Sliced Mushrooms", quantity: 40, unit: "g" },
      { ingredientId: "ing-006", name: "Diced Tricolor Capsicum", quantity: 45, unit: "g" },
      { ingredientId: "ing-007", name: "Fresh Diced Paneer", quantity: 50, unit: "g" }
    ],
    instructions: [
      "Stretch fresh dough, ensure thickness is consistent.",
      "Apply 120ml pizza sauce and spread evenly.",
      "Sprinkle 100g mozzarella cheese.",
      "Distribute mushrooms, capsicum, and paneer cubes uniformly.",
      "Top with remaining 40g cheese and slide to oven deck."
    ]
  },
  {
    _id: "rec-003",
    name: "Tandoori Paneer Pizza",
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=300&fm=webp",
    prepTime: 15,
    difficulty: "Hard",
    recipeCode: "REC-TAND-05",
    ingredients: [
      { ingredientId: "ing-002", name: "Fresh Pizza Dough (Medium)", quantity: 1, unit: "unit" },
      { ingredientId: "ing-004", name: "Signature Pizza Sauce", quantity: 100, unit: "ml" },
      { ingredientId: "ing-001", name: "Premium Mozzarella Cheese", quantity: 130, unit: "g" },
      { ingredientId: "ing-007", name: "Fresh Diced Paneer", quantity: 80, unit: "g" },
      { ingredientId: "ing-010", name: "Sweet Corn Kernels", quantity: 30, unit: "g" }
    ],
    instructions: [
      "Stretch dough to designated size.",
      "Mix paneer cubes in tandoori marinade marinade first.",
      "Spread thin layer of sauce, add cheese base.",
      "Arrange tandoori paneer cubes and corn evenly.",
      "Dust crust edges with garlic-herb seasoning before baking."
    ]
  }
];

// INITIAL PREPARATION BOARD ITEMS (TRACKED BY ORDER ITEM WORKFLOW)
export const initialMockPrepItems = [
  {
    _id: "prep-item-001",
    orderId: "ord-1052",
    orderNumber: "PVP-1052",
    priority: "VIP",
    name: "Farmhouse Pizza",
    size: "Large",
    crust: "Cheese Burst",
    quantity: 1,
    assigned_chef: "chef-001", // Chef Rajesh Kumar
    current_stage: "dough_prep", // assigned, dough_prep, sauce, toppings, ready_for_baking
    started_time: new Date(Date.now() - 4 * 60000).toISOString(), // started 4 mins ago
    estimated_time: 12, // 12 mins to prepare
    paused: false,
    pauseReason: "",
    recipeId: "rec-002"
  },
  {
    _id: "prep-item-002",
    orderId: "ord-1052",
    orderNumber: "PVP-1052",
    priority: "VIP",
    name: "Choco Lava Cake",
    size: "Regular",
    crust: "N/A",
    quantity: 2,
    assigned_chef: "chef-001",
    current_stage: "assigned",
    started_time: new Date(Date.now() - 3 * 60000).toISOString(),
    estimated_time: 8,
    paused: false,
    pauseReason: "",
    recipeId: null
  },
  {
    _id: "prep-item-003",
    orderId: "ord-1053",
    orderNumber: "PVP-1053",
    priority: "EXPRESS",
    name: "Tandoori Paneer Pizza",
    size: "Medium",
    crust: "Thin Crust",
    quantity: 1,
    assigned_chef: "chef-003", // Chef Sanjay Sharma
    current_stage: "sauce",
    started_time: new Date(Date.now() - 8 * 60000).toISOString(), // started 8 mins ago
    estimated_time: 15,
    paused: false,
    pauseReason: "",
    recipeId: "rec-003"
  },
  {
    _id: "prep-item-004",
    orderId: "ord-1055",
    orderNumber: "PVP-1055",
    priority: "NORMAL",
    name: "Country Special Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 1,
    assigned_chef: null, // Unassigned
    current_stage: "assigned",
    started_time: new Date(Date.now() - 1 * 60000).toISOString(),
    estimated_time: 12,
    paused: false,
    pauseReason: "",
    recipeId: null
  },
  {
    _id: "prep-item-005",
    orderId: "ord-1051",
    orderNumber: "PVP-1051",
    priority: "NORMAL",
    name: "Double Cheese Margherita Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 2,
    assigned_chef: "chef-004", // Chef Priya Patel
    current_stage: "toppings",
    started_time: new Date(Date.now() - 14 * 60000).toISOString(), // 14 mins ago (Exceeded SLA 10) -> Delayed
    estimated_time: 10,
    paused: false,
    pauseReason: "",
    recipeId: "rec-001"
  },
  {
    _id: "prep-item-006",
    orderId: "ord-1049",
    orderNumber: "PVP-1049",
    priority: "NORMAL",
    name: "Veggie Supreme Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 1,
    assigned_chef: "chef-003",
    current_stage: "ready_for_baking",
    started_time: new Date(Date.now() - 9 * 60000).toISOString(),
    estimated_time: 12,
    paused: false,
    pauseReason: "",
    recipeId: "rec-002"
  }
];

// INITIAL PIZZA STATION ITEMS (ASSEMBLY WORKFLOW)
export const initialMockPizzaStationItems = [
  {
    _id: "pzs-001",
    pizzaId: "PIZ-451",
    orderId: "ord-1051",
    orderNumber: "PVP-1051",
    name: "Double Cheese Margherita Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 2,
    assigned_chef: "chef-001", // Chef Rajesh
    assembly_status: "assembly_started", // assigned, assembly_started, assembly_paused, assembly_completed, ready_for_baking
    assembly_started_time: new Date(Date.now() - 5 * 60000).toISOString(), // 5 mins ago
    completed_time: null,
    target_time: 10, // 10 mins assembly SLA
    toppings: ["Extra Cheese", "Tomato"],
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    recipeId: "rec-001",
    priority: "NORMAL"
  },
  {
    _id: "pzs-002",
    pizzaId: "PIZ-452",
    orderId: "ord-1052",
    orderNumber: "PVP-1052",
    name: "Farmhouse Pizza",
    size: "Large",
    crust: "Cheese Burst",
    quantity: 1,
    assigned_chef: "chef-003", // Chef Sanjay
    assembly_status: "assigned",
    assembly_started_time: null,
    completed_time: null,
    target_time: 12,
    toppings: ["Mushrooms", "Capsicum", "Paneer"],
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    recipeId: "rec-002",
    priority: "VIP"
  },
  {
    _id: "pzs-003",
    pizzaId: "PIZ-453",
    orderId: "ord-1053",
    orderNumber: "PVP-1053",
    name: "Tandoori Paneer Pizza",
    size: "Medium",
    crust: "Thin Crust",
    quantity: 1,
    assigned_chef: "chef-004", // Chef Priya
    assembly_status: "assembly_paused",
    assembly_started_time: new Date(Date.now() - 15 * 60000).toISOString(),
    completed_time: null,
    target_time: 10,
    toppings: ["Tandoori Paneer", "Red Paprika", "Onion"],
    paused: true,
    pauseReason: "Ingredient unavailable",
    pauseNotes: "Out of tricolor capsicum for custom seasoning.",
    recipeId: "rec-003",
    priority: "EXPRESS"
  },
  {
    _id: "pzs-004",
    pizzaId: "PIZ-454",
    orderId: "ord-1054",
    orderNumber: "PVP-1054",
    name: "Veggie Supreme Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 2,
    assigned_chef: null, // Unassigned
    assembly_status: "assigned",
    assembly_started_time: null,
    completed_time: null,
    target_time: 12,
    toppings: ["Onion", "Capsicum", "Mushroom", "Sweet Corn", "Black Olives"],
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    recipeId: "rec-002",
    priority: "NORMAL"
  },
  {
    _id: "pzs-005",
    pizzaId: "PIZ-455",
    orderId: "ord-1055",
    orderNumber: "PVP-1055",
    name: "Country Special Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 1,
    assigned_chef: "chef-001",
    assembly_status: "assembly_completed",
    assembly_started_time: new Date(Date.now() - 12 * 60000).toISOString(),
    completed_time: new Date(Date.now() - 2 * 60000).toISOString(), // completed 2 mins ago
    target_time: 10,
    toppings: ["Onion", "Tomato", "Capsicum"],
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    recipeId: "rec-002",
    priority: "NORMAL"
  },
  {
    _id: "pzs-006",
    pizzaId: "PIZ-449",
    orderId: "ord-1049",
    orderNumber: "PVP-1049",
    name: "Double Cheese Margherita Pizza",
    size: "Large",
    crust: "Pan",
    quantity: 1,
    assigned_chef: "chef-003",
    assembly_status: "assembly_started", // started 14 mins ago (Exceeded Target 10) -> Delayed
    assembly_started_time: new Date(Date.now() - 14 * 60000).toISOString(),
    completed_time: null,
    target_time: 10,
    toppings: ["Extra Cheese", "Basil"],
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    recipeId: "rec-001",
    priority: "NORMAL"
  }
];

// MOCK BAKING STAFF
export const mockStaff = [
  {
    _id: "staff-001",
    employeeId: "EMP-BAKE-201",
    name: "Rahul Verma",
    role: "Baking Assistant",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-002",
    employeeId: "EMP-BAKE-202",
    name: "Amit Sharma",
    role: "Oven Supervisor",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-003",
    employeeId: "EMP-BAKE-203",
    name: "Pooja Patel",
    role: "Baking Specialist",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-004",
    employeeId: "EMP-BAKE-204",
    name: "Sandip Joshi",
    role: "Kitchen Crew",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&fm=webp"
  }
];

// INITIAL OVENS STATUS
export const initialMockOvens = [
  {
    _id: "oven-01",
    oven_number: "OVEN-01",
    status: "busy", // available, busy, maintenance, offline
    temperature: 250,
    current_pizza: "Double Cheese Margherita",
    remaining_time: 240, // 4 mins left
    expectedDuration: 8
  },
  {
    _id: "oven-02",
    oven_number: "OVEN-02",
    status: "available",
    temperature: 248,
    current_pizza: null,
    remaining_time: null,
    expectedDuration: null
  },
  {
    _id: "oven-03",
    oven_number: "OVEN-03",
    status: "busy",
    temperature: 252,
    current_pizza: "Veggie Supreme Pizza",
    remaining_time: 80, // 1 min 20s left
    expectedDuration: 8
  },
  {
    _id: "oven-04",
    oven_number: "OVEN-04",
    status: "maintenance",
    temperature: 150,
    current_pizza: null,
    remaining_time: null,
    expectedDuration: null
  },
  {
    _id: "oven-05",
    oven_number: "OVEN-05",
    status: "offline",
    temperature: 25,
    current_pizza: null,
    remaining_time: null,
    expectedDuration: null
  }
];

// INITIAL MOCK BAKING ITEMS (order_items)
export const initialMockBakingItems = [
  {
    _id: "bake-item-001",
    orderItemId: "oi-1051-1",
    orderId: "ord-1051",
    orderNumber: "PVP-1051",
    name: "Double Cheese Margherita Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 2,
    assigned_oven: "oven-01",
    assigned_staff: "staff-001",
    baking_status: "baking_started", // ready_for_baking, baking_started, baking_paused, baking_completed, packaging
    started_time: new Date(Date.now() - 4 * 60000).toISOString(), // started 4 mins ago
    completed_time: null,
    target_time: 8, // expectedDuration in minutes
    temperature: 250,
    expectedDuration: 8,
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    remarks: "Extra crispy crust requested",
    priority: "NORMAL"
  },
  {
    _id: "bake-item-002",
    orderItemId: "oi-1052-1",
    orderId: "ord-1052",
    orderNumber: "PVP-1052",
    name: "Farmhouse Pizza",
    size: "Large",
    crust: "Cheese Burst",
    quantity: 1,
    assigned_oven: null,
    assigned_staff: null,
    baking_status: "ready_for_baking",
    started_time: null,
    completed_time: null,
    target_time: 10,
    temperature: 250,
    expectedDuration: 10,
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    remarks: "",
    priority: "VIP"
  },
  {
    _id: "bake-item-003",
    orderItemId: "oi-1053-1",
    orderId: "ord-1053",
    orderNumber: "PVP-1053",
    name: "Tandoori Paneer Pizza",
    size: "Medium",
    crust: "Thin Crust",
    quantity: 1,
    assigned_oven: "oven-03",
    assigned_staff: "staff-003",
    baking_status: "baking_started",
    started_time: new Date(Date.now() - 6.5 * 60000).toISOString(), // started 6.5 mins ago
    completed_time: null,
    target_time: 8,
    temperature: 250,
    expectedDuration: 8,
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    remarks: "No onions",
    priority: "EXPRESS"
  },
  {
    _id: "bake-item-004",
    orderItemId: "oi-1054-1",
    orderId: "ord-1054",
    orderNumber: "PVP-1054",
    name: "Veggie Supreme Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 2,
    assigned_oven: "oven-01",
    assigned_staff: "staff-002",
    baking_status: "baking_paused",
    started_time: new Date(Date.now() - 10 * 60000).toISOString(),
    completed_time: null,
    target_time: 8,
    temperature: 250,
    expectedDuration: 8,
    paused: true,
    pauseReason: "Machine issue",
    pauseNotes: "Oven door sensor fault",
    remarks: "",
    priority: "NORMAL"
  },
  {
    _id: "bake-item-005",
    orderItemId: "oi-1055-1",
    orderId: "ord-1055",
    orderNumber: "PVP-1055",
    name: "Country Special Pizza",
    size: "Medium",
    crust: "New Hand Tossed",
    quantity: 1,
    assigned_oven: "oven-02",
    assigned_staff: "staff-001",
    baking_status: "baking_completed",
    started_time: new Date(Date.now() - 9 * 60000).toISOString(),
    completed_time: new Date(Date.now() - 1 * 60000).toISOString(),
    target_time: 8,
    temperature: 250,
    expectedDuration: 8,
    paused: false,
    pauseReason: "",
    pauseNotes: "",
    remarks: "",
    priority: "NORMAL"
  }
];

// INITIAL KITCHEN ISSUES
export const initialMockKitchenIssues = [
  {
    _id: "issue-001",
    orderItemId: "oi-1050-1",
    issueType: "Overcooked", // Overcooked, Undercooked, Machine Failure, Temperature Error, Burnt Crust, Cheese Issue, Other
    severity: "High", // Low, Medium, High, Critical
    remarks: "Oven ran 15 deg hot, cheese scorched",
    image: "",
    notifyManager: true,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString()
  }
];

// MOCK PACKAGING STAFF
export const mockPackagingStaff = [
  {
    _id: "staff-pack-001",
    employeeId: "EMP-PACK-301",
    name: "Karan Johar",
    role: "Packaging Officer",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-pack-002",
    employeeId: "EMP-PACK-302",
    name: "Nisha Patel",
    role: "QA Inspector",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-pack-003",
    employeeId: "EMP-PACK-303",
    name: "Arjun Rampal",
    role: "Sealing Specialist",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&fm=webp"
  }
];

// INITIAL PACKAGING ORDERS
export const initialMockPackagingOrders = [
  {
    _id: "ord-1048",
    orderNumber: "PVP-1048",
    customer: {
      name: "Rohan Gupta",
      phone: "+91 91234 56789",
      deliveryAddress: {
        street: "12, Scheme 54",
        area: "Vijay Nagar",
        city: "Indore",
        zipcode: "452010"
      }
    },
    items: [
      { name: "Double Cheese Margherita Pizza", quantity: 2, size: "Medium" },
      { name: "Veggie Supreme Pizza", quantity: 1, size: "Large" }
    ],
    deliveryType: "Delivery",
    packaging_status: "ready_for_packaging",
    status: "preparing",
    assigned_staff: null,
    packaging_start_time: null,
    packaging_end_time: null,
    pickup_number: "P-104",
    createdAt: new Date(Date.now() - 40 * 60000).toISOString()
  },
  {
    _id: "ord-1047",
    orderNumber: "PVP-1047",
    customer: {
      name: "Meera Sen",
      phone: "+91 98765 12345",
      deliveryAddress: {
        street: "Flat 302, Royal Palms",
        area: "Nipania",
        city: "Indore",
        zipcode: "452016"
      }
    },
    items: [
      { name: "Farmhouse Pizza", quantity: 1, size: "Large" }
    ],
    deliveryType: "Takeaway",
    packaging_status: "packaging_started",
    status: "preparing",
    assigned_staff: "staff-pack-001",
    packaging_start_time: new Date(Date.now() - 4 * 60000).toISOString(),
    packaging_end_time: null,
    pickup_number: "T-301",
    createdAt: new Date(Date.now() - 35 * 60000).toISOString()
  },
  {
    _id: "ord-1046",
    orderNumber: "PVP-1046",
    customer: {
      name: "Aman Verma",
      phone: "+91 93456 78901",
      deliveryAddress: {
        street: "Table 5 (Dine-in)",
        area: "Main Store Hall",
        city: "Indore",
        zipcode: "452001"
      }
    },
    items: [
      { name: "Peppy Paneer Pizza", quantity: 1, size: "Medium" },
      { name: "Fresh Veggie Pizza", quantity: 2, size: "Regular" }
    ],
    deliveryType: "Dine In",
    packaging_status: "quality_checked",
    status: "preparing",
    assigned_staff: "staff-pack-002",
    packaging_start_time: new Date(Date.now() - 8 * 60000).toISOString(),
    packaging_end_time: null,
    pickup_number: "D-05",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString()
  },
  {
    _id: "ord-1045",
    orderNumber: "PVP-1045",
    customer: {
      name: "Preeti Joshi",
      phone: "+91 95555 44444",
      deliveryAddress: {
        street: "A-23, Saket",
        area: "Old Palasia",
        city: "Indore",
        zipcode: "452018"
      }
    },
    items: [
      { name: "Tandoori Paneer Pizza", quantity: 1, size: "Medium" }
    ],
    deliveryType: "Delivery",
    packaging_status: "sealed",
    status: "preparing",
    assigned_staff: "staff-pack-003",
    packaging_start_time: new Date(Date.now() - 9 * 60000).toISOString(),
    packaging_end_time: new Date(Date.now() - 4 * 60000).toISOString(),
    pickup_number: "P-103",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    _id: "ord-1044",
    orderNumber: "PVP-1044",
    customer: {
      name: "Sanjay Shah",
      phone: "+91 97777 88888",
      deliveryAddress: {
        street: "B-44, Shalimar Complex",
        area: "Vijay Nagar",
        city: "Indore",
        zipcode: "452010"
      }
    },
    items: [
      { name: "Double Cheese Margherita Pizza", quantity: 1, size: "Medium" }
    ],
    deliveryType: "Delivery",
    packaging_status: "ready_for_pickup",
    status: "ready_for_pickup",
    assigned_staff: "staff-pack-001",
    packaging_start_time: new Date(Date.now() - 15 * 60000).toISOString(),
    packaging_end_time: new Date(Date.now() - 10 * 60000).toISOString(),
    pickup_number: "P-102",
    createdAt: new Date(Date.now() - 50 * 60000).toISOString()
  }
];

// INITIAL PACKAGING LOGS
export const initialMockPackagingLogs = [
  {
    _id: "log-001",
    orderId: "ord-1045",
    pizzaCountVerified: true,
    saucesIncluded: true,
    cutleryIncluded: true,
    billAttached: true,
    qualityVerified: true,
    packagingSealed: true,
    notes: "Everything checked, double sauces added.",
    packaging_staff: "staff-pack-003",
    createdAt: new Date(Date.now() - 4 * 60000).toISOString()
  }
];

// INITIAL MOCK DELAYED ORDERS
export const initialMockDelayedOrders = [
  {
    _id: "ord-1058",
    orderNumber: "PVP-1058",
    customer: {
      name: "Aarav Sharma",
      phone: "+91 98765 43210"
    },
    status: "preparing", // Queued, Preparing, Baking, Packaging, Ready
    assigned_staff: "chef-001", // Chef Rajesh Kumar
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    expectedReadyTime: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins overdue
    sla_minutes: 20,
    priority: "VIP",
    grandTotal: 650,
    isDelayed: true,
    delay_duration: 18, // minutes
    reason: "Ingredient Shortage", // kitchen_issues.reason
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 45 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 40 * 60000).toISOString() },
      { status: "Queued", time: new Date(Date.now() - 35 * 60000).toISOString() },
      { status: "Preparing", time: new Date(Date.now() - 30 * 60000).toISOString(), delay: 12 }
    ],
    items: [
      { name: "Double Cheese Margherita Pizza", quantity: 2, size: "Medium" },
      { name: "Garlic Breadsticks", quantity: 1, size: "Regular" }
    ]
  },
  {
    _id: "ord-1059",
    orderNumber: "PVP-1059",
    customer: {
      name: "Priya Patel",
      phone: "+91 87654 32109"
    },
    status: "baking",
    assigned_staff: "staff-002", // Amit Sharma
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    expectedReadyTime: new Date(Date.now() - 18 * 60000).toISOString(),
    sla_minutes: 22,
    priority: "EXPRESS",
    grandTotal: 450,
    isDelayed: true,
    delay_duration: 22, // minutes (Critical > 20)
    reason: "Machine Failure",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 50 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 46 * 60000).toISOString() },
      { status: "Queued", time: new Date(Date.now() - 42 * 60000).toISOString() },
      { status: "Preparing", time: new Date(Date.now() - 35 * 60000).toISOString() },
      { status: "Baking", time: new Date(Date.now() - 25 * 60000).toISOString(), delay: 17 }
    ],
    items: [
      { name: "Farmhouse Pizza", quantity: 1, size: "Large" }
    ]
  },
  {
    _id: "ord-1060",
    orderNumber: "PVP-1060",
    customer: {
      name: "Rohan Malhotra",
      phone: "+91 76543 21098"
    },
    status: "packaging",
    assigned_staff: "staff-pack-001", // Karan Johar
    createdAt: new Date(Date.now() - 28 * 60000).toISOString(),
    expectedReadyTime: new Date(Date.now() - 8 * 60000).toISOString(),
    sla_minutes: 20,
    priority: "NORMAL",
    grandTotal: 890,
    isDelayed: true,
    delay_duration: 8,
    reason: "High Order Volume",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 35 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 32 * 60000).toISOString() },
      { status: "Queued", time: new Date(Date.now() - 28 * 60000).toISOString() },
      { status: "Preparing", time: new Date(Date.now() - 20 * 60000).toISOString() },
      { status: "Baking", time: new Date(Date.now() - 12 * 60000).toISOString() },
      { status: "Packaging", time: new Date(Date.now() - 4 * 60000).toISOString(), delay: 6 }
    ],
    items: [
      { name: "Veggie Supreme Pizza", quantity: 2, size: "Medium" },
      { name: "Choco Lava Cake", quantity: 2, size: "Regular" }
    ]
  },
  {
    _id: "ord-1061",
    orderNumber: "PVP-1061",
    customer: {
      name: "Isha Verma",
      phone: "+91 99887 76655"
    },
    status: "queued",
    assigned_staff: null,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    expectedReadyTime: new Date(Date.now() - 5 * 60000).toISOString(),
    sla_minutes: 20,
    priority: "NORMAL",
    grandTotal: 320,
    isDelayed: true,
    delay_duration: 12,
    reason: "Staff Shortage",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 30 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 25 * 60000).toISOString() },
      { status: "Queued", time: new Date(Date.now() - 20 * 60000).toISOString(), delay: 12 }
    ],
    items: [
      { name: "Tandoori Paneer Pizza", quantity: 1, size: "Medium" }
    ]
  },
  {
    _id: "ord-1062",
    orderNumber: "PVP-1062",
    customer: {
      name: "Sanjay Sharma",
      phone: "+91 91234 56789"
    },
    status: "preparing",
    assigned_staff: "chef-003", // Chef Sanjay Sharma
    createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
    expectedReadyTime: new Date(Date.now() - 25 * 60000).toISOString(),
    sla_minutes: 30,
    priority: "VIP",
    grandTotal: 1200,
    isDelayed: true,
    delay_duration: 35, // minutes (Critical > 30)
    reason: "Ingredient Shortage",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 65 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 60 * 60000).toISOString() },
      { status: "Queued", time: new Date(Date.now() - 55 * 60000).toISOString() },
      { status: "Preparing", time: new Date(Date.now() - 45 * 60000).toISOString(), delay: 30 }
    ],
    items: [
      { name: "Peppy Paneer Pizza", quantity: 2, size: "Large" },
      { name: "Country Special Pizza", quantity: 1, size: "Medium" }
    ]
  },
  {
    _id: "ord-1063",
    orderNumber: "PVP-1063",
    customer: {
      name: "Amit Varma",
      phone: "+91 93456 78901"
    },
    status: "baking",
    assigned_staff: "staff-003", // Pooja Patel
    createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
    expectedReadyTime: new Date(Date.now() - 45 * 60000).toISOString(),
    sla_minutes: 30,
    priority: "EXPRESS",
    grandTotal: 580,
    isDelayed: true,
    delay_duration: 50, // minutes (Critical > 45)
    reason: "Machine Failure",
    timeline: [
      { status: "Placed", time: new Date(Date.now() - 85 * 60000).toISOString() },
      { status: "Confirmed", time: new Date(Date.now() - 80 * 60000).toISOString() },
      { status: "Queued", time: new Date(Date.now() - 75 * 60000).toISOString() },
      { status: "Preparing", time: new Date(Date.now() - 65 * 60000).toISOString() },
      { status: "Baking", time: new Date(Date.now() - 50 * 60000).toISOString(), delay: 45 }
    ],
    items: [
      { name: "Double Cheese Margherita Pizza", quantity: 1, size: "Large" },
      { name: "Stuffed Garlic Bread", quantity: 1, size: "Regular" }
    ]
  }
];

// INITIAL MOCK ESCALATIONS
export const initialMockEscalations = [
  {
    _id: "esc-001",
    orderId: "ord-1059",
    severity: "High",
    reason: "Oven temperature fluctuation causing delay",
    assignedTo: "mgt-002", // Kitchen Supervisor (Arvind Swamy)
    notes: "Supervisor checking the heating elements.",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString()
  }
];

// MOCK MANAGEMENT STAFF
export const mockManagementStaff = [
  { _id: "mgt-001", name: "Suresh Kumar", role: "Store Manager", status: "active", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100&fm=webp" },
  { _id: "mgt-002", name: "Arvind Swamy", role: "Kitchen Supervisor", status: "active", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&fm=webp" },
  { _id: "mgt-003", name: "Vikram Rathore", role: "Operations Manager", status: "active", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&fm=webp" }
];



