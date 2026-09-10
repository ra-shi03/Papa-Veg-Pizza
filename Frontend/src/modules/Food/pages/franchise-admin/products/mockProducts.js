// In-memory mock database for Pizza Franchise Products
// Standard Indian names, prices, categories, and WebP format image sources.

export const mockCategories = [
  {
    _id: "cat-pizzas-classic",
    id: "cat-pizzas-classic",
    franchiseId: "FRAN-001",
    name: "Classic Pizzas",
    slug: "classic-pizzas",
    description: "Traditional Italian pizzas with hand-stretched bases and fresh herbs.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    icon: "Pizza",
    parentCategory: null,
    displayOrder: 1,
    isFeatured: true,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "cat-pizzas-gourmet",
    id: "cat-pizzas-gourmet",
    franchiseId: "FRAN-001",
    name: "Gourmet Pizzas",
    slug: "gourmet-pizzas",
    description: "Premium handcrafted pizzas topped with exotic toppings and sauces.",
    image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp",
    icon: "Flame",
    parentCategory: "cat-pizzas-classic",
    displayOrder: 2,
    isFeatured: true,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "cat-sides",
    id: "cat-sides",
    franchiseId: "FRAN-001",
    name: "Sides & Appetizers",
    slug: "sides-appetizers",
    description: "Baked garlic breadsticks, delicious dips, and savory sides.",
    image: "https://images.unsplash.com/photo-1573145959986-a142c6e68ea8?auto=format&fit=crop&w=400&q=80&fm=webp",
    icon: "Layers",
    parentCategory: null,
    displayOrder: 3,
    isFeatured: false,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "cat-desserts",
    id: "cat-desserts",
    franchiseId: "FRAN-001",
    name: "Desserts",
    slug: "desserts",
    description: "Decadent chocolate cakes, sweet treats, and lava delicacies.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80&fm=webp",
    icon: "Cookie",
    parentCategory: null,
    displayOrder: 4,
    isFeatured: true,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "cat-drinks",
    id: "cat-drinks",
    franchiseId: "FRAN-001",
    name: "Beverages",
    slug: "beverages",
    description: "Chilled mocktails, soft drinks, and refreshing milkshakes.",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80&fm=webp",
    icon: "GlassWater",
    parentCategory: null,
    displayOrder: 5,
    isFeatured: false,
    status: "INACTIVE",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockTaxCategories = [
  { id: "gst-5", name: "GST 5% (Food standard)" },
  { id: "gst-12", name: "GST 12% (Processed items)" },
  { id: "gst-18", name: "GST 18% (Aerated drinks/Services)" }
];

// Initial products mock database
export const initialProducts = [
  {
    _id: "prod-101",
    franchiseId: "FRAN-001",
    categoryId: "cat-pizzas-classic",
    name: "Double Cheese Margherita Pizza",
    slug: "double-cheese-margherita-pizza",
    sku: "PVP-MARG-01",
    shortDescription: "Classic cheese pizza with double mozzarella cheese burst.",
    description: "An absolute classic! A golden-crusted pizza topped with rich, slow-simmered tomato sauce, fresh basil, and an extra-generous layer of melted premium mozzarella cheese. A cheese lover's dream come true.",
    productType: "VEG",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    galleryImages: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80&fm=webp"
    ],
    basePrice: 249,
    preparationTime: 12,
    calories: 290,
    spiceLevel: 1,
    status: "ACTIVE",
    isFeatured: true,
    isBestSeller: true,
    isCustomizable: true,
    displayOrder: 1,
    taxCategory: "gst-5",
    createdBy: "Franchise Admin",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "prod-102",
    franchiseId: "FRAN-001",
    categoryId: "cat-pizzas-gourmet",
    name: "Tandoori Paneer Overloaded Pizza",
    slug: "tandoori-paneer-overloaded-pizza",
    sku: "PVP-PANEER-02",
    shortDescription: "Spicy tandoori paneer cubes, red onions, capsicum and red paprika.",
    description: "A fiery fusion of succulent paneer cubes marinated in authentic Indian tandoori spices, baked to perfection with red capsicum, crunchy onions, red paprika, and a rich, creamy tandoori sauce swirl.",
    productType: "VEG",
    image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp",
    galleryImages: [
      "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp",
      "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80&fm=webp"
    ],
    basePrice: 349,
    preparationTime: 15,
    calories: 340,
    spiceLevel: 3,
    status: "ACTIVE",
    isFeatured: true,
    isBestSeller: true,
    isCustomizable: true,
    displayOrder: 2,
    taxCategory: "gst-5",
    createdBy: "Franchise Admin",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "prod-103",
    franchiseId: "FRAN-001",
    categoryId: "cat-pizzas-gourmet",
    name: "Fiery Chicken Tikka Pizza",
    slug: "fiery-chicken-tikka-pizza",
    sku: "PVP-CHICK-03",
    shortDescription: "Hot chicken tikka chunks, green chillies, onions, and spicy tomato sauce.",
    description: "For the adventurous spicy lovers! Tender chicken tikka pieces marinated in fiery hot spices, topped with sliced green chillies, red onions, capsicum, and premium mozzarella cheese, baked on our hand-tossed base.",
    productType: "NON_VEG",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80&fm=webp",
    galleryImages: [
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80&fm=webp"
    ],
    basePrice: 389,
    preparationTime: 14,
    calories: 380,
    spiceLevel: 5,
    status: "ACTIVE",
    isFeatured: false,
    isBestSeller: true,
    isCustomizable: true,
    displayOrder: 3,
    taxCategory: "gst-5",
    createdBy: "System Operator",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "prod-104",
    franchiseId: "FRAN-001",
    categoryId: "cat-sides",
    name: "Cheesy Garlic Breadsticks",
    slug: "cheesy-garlic-breadsticks",
    sku: "PVP-GARLIC-04",
    shortDescription: "Baked garlic bread stuffed with mozzarella cheese and sweet corn.",
    description: "Crispy on the outside, soft and gooey on the inside! Freshly baked bread brushed with rich garlic butter, stuffed with sweet corn and melted mozzarella cheese, served with a side of creamy jalapeno dip.",
    productType: "VEG",
    image: "https://images.unsplash.com/photo-1573145959986-a142c6e68ea8?auto=format&fit=crop&w=400&q=80&fm=webp",
    galleryImages: [],
    basePrice: 149,
    preparationTime: 8,
    calories: 210,
    spiceLevel: 1,
    status: "ACTIVE",
    isFeatured: true,
    isBestSeller: false,
    isCustomizable: false,
    displayOrder: 4,
    taxCategory: "gst-5",
    createdBy: "Franchise Admin",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "prod-105",
    franchiseId: "FRAN-001",
    categoryId: "cat-desserts",
    name: "Eggless Choco Lava Cake",
    slug: "eggless-choco-lava-cake",
    sku: "PVP-LAVA-05",
    shortDescription: "Warm chocolate cake with a rich liquid chocolate center.",
    description: "Indulge in our famous eggless chocolate cake, baked warm to create a molten center of thick liquid chocolate that flows out with your first bite. Perfect dessert to end your pizza feast.",
    productType: "EGG",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80&fm=webp",
    galleryImages: [],
    basePrice: 99,
    preparationTime: 6,
    calories: 320,
    spiceLevel: 1,
    status: "ACTIVE",
    isFeatured: false,
    isBestSeller: true,
    isCustomizable: false,
    displayOrder: 5,
    taxCategory: "gst-12",
    createdBy: "System Operator",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "prod-106",
    franchiseId: "FRAN-001",
    categoryId: "cat-pizzas-classic",
    name: "Spicy Jalapeno Veg Delight",
    slug: "spicy-jalapeno-veg-delight",
    sku: "PVP-JALAP-06",
    shortDescription: "Spicy jalapenos, sweet corn, golden olives, and mozzarella.",
    description: "A delightful mix of spicy sliced jalapenos, sweet golden corn kernels, sliced black olives, and premium mozzarella cheese on a tangy herb tomato base sauce.",
    productType: "VEG",
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80&fm=webp",
    galleryImages: [],
    basePrice: 299,
    preparationTime: 10,
    calories: 275,
    spiceLevel: 2,
    status: "INACTIVE",
    isFeatured: false,
    isBestSeller: false,
    isCustomizable: true,
    displayOrder: 6,
    taxCategory: "gst-5",
    createdBy: "Franchise Admin",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Initial product variants database
export const initialVariants = [
  // Double Cheese Margherita
  { _id: "var-101", productId: "prod-101", name: "Small", size: "Small", price: 149, servingPersons: 1, calories: 180, isDefault: false, status: "ACTIVE" },
  { _id: "var-102", productId: "prod-101", name: "Medium", size: "Medium", price: 249, servingPersons: 2, calories: 290, isDefault: true, status: "ACTIVE" },
  { _id: "var-103", productId: "prod-101", name: "Large", size: "Large", price: 399, servingPersons: 4, calories: 450, isDefault: false, status: "ACTIVE" },
  
  // Tandoori Paneer Overloaded
  { _id: "var-201", productId: "prod-102", name: "Small Tandoori", size: "Small", price: 199, servingPersons: 1, calories: 210, isDefault: false, status: "ACTIVE" },
  { _id: "var-202", productId: "prod-102", name: "Medium Tandoori", size: "Medium", price: 349, servingPersons: 2, calories: 340, isDefault: true, status: "ACTIVE" },
  { _id: "var-203", productId: "prod-102", name: "Large Tandoori", size: "Large", price: 549, servingPersons: 4, calories: 520, isDefault: false, status: "ACTIVE" },

  // Fiery Chicken Tikka
  { _id: "var-301", productId: "prod-103", name: "Small Chicken", size: "Small", price: 229, servingPersons: 1, calories: 240, isDefault: false, status: "ACTIVE" },
  { _id: "var-302", productId: "prod-103", name: "Medium Chicken", size: "Medium", price: 389, servingPersons: 2, calories: 380, isDefault: true, status: "ACTIVE" },
  { _id: "var-303", productId: "prod-103", name: "Large Chicken", size: "Large", price: 599, servingPersons: 4, calories: 610, isDefault: false, status: "ACTIVE" }
];

// Initial store product pricing override
export const initialStorePricing = [
  // Connaught Place pricing overrides (ST-001)
  { _id: "sp-101", storeId: "ST-001", productId: "prod-101", price: 269, status: "ACTIVE" }, // CP is more expensive
  { _id: "sp-102", storeId: "ST-001", productId: "prod-102", price: 369, status: "ACTIVE" },
  
  // Indiranagar pricing overrides (ST-002)
  { _id: "sp-201", storeId: "ST-002", productId: "prod-101", price: 259, status: "ACTIVE" },
  
  // Salt Lake pricing (ST-003) - not available override example
  { _id: "sp-301", storeId: "ST-003", productId: "prod-106", price: 299, status: "INACTIVE" }
];

// Product images database
export const initialProductImages = [
  { _id: "img-101", productId: "prod-101", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp", type: "THUMBNAIL", displayOrder: 1 },
  { _id: "img-102", productId: "prod-101", imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80&fm=webp", type: "GALLERY", displayOrder: 2 },
  { _id: "img-201", productId: "prod-102", imageUrl: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp", type: "THUMBNAIL", displayOrder: 1 },
  { _id: "img-301", productId: "prod-103", imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80&fm=webp", type: "THUMBNAIL", displayOrder: 1 }
];

// Mock Inventory Items for Add-on Mapping
export const mockInventoryItems = [
  { _id: "inv-mozzarella", name: "Premium Mozzarella Cheese", currentStock: 45.5, unit: "kg", costPrice: 320, lowStockWarning: 10 },
  { _id: "inv-paneer", name: "Fresh Malai Paneer Cubes", currentStock: 12.0, unit: "kg", costPrice: 280, lowStockWarning: 5 },
  { _id: "inv-jalapenos", name: "Sliced Pickled Jalapenos", currentStock: 8.2, unit: "kg", costPrice: 150, lowStockWarning: 3 },
  { _id: "inv-olives", name: "Black Olive Slices", currentStock: 14.8, unit: "kg", costPrice: 190, lowStockWarning: 4 },
  { _id: "inv-corn", name: "Golden Sweet Corn Kernels", currentStock: 0.8, unit: "kg", costPrice: 90, lowStockWarning: 5 },
  { _id: "inv-cheeseburst", name: "Cheese Burst Liquid Blend", currentStock: 0.0, unit: "kg", costPrice: 340, lowStockWarning: 8 },
  { _id: "inv-schezwan", name: "Fiery Schezwan Drizzle Sauce", currentStock: 25.0, unit: "liters", costPrice: 110, lowStockWarning: 5 }
];

// Initial Mock Add-ons
export const mockAddons = [
  {
    _id: "add-1",
    franchiseId: "FRAN-001",
    name: "Extra Mozzarella Cheese",
    type: "CHEESE",
    image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80&fm=webp",
    description: "Premium melted mozzarella cheese topping for stringy goodness.",
    price: 75,
    inventoryItemId: "inv-mozzarella",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "add-2",
    franchiseId: "FRAN-001",
    name: "Fresh Paneer Cubes",
    type: "TOPPING",
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80&fm=webp",
    description: "Succulent cottage cheese cubes spiced with tandoori powder.",
    price: 60,
    inventoryItemId: "inv-paneer",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "add-3",
    franchiseId: "FRAN-001",
    name: "Spicy Jalapeno Slices",
    type: "TOPPING",
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80&fm=webp",
    description: "Hot sliced Mexican jalapenos to kick up the heat.",
    price: 45,
    inventoryItemId: "inv-jalapenos",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "add-4",
    franchiseId: "FRAN-001",
    name: "Sliced Black Olives",
    type: "TOPPING",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    description: "Fine quality sliced Spanish black olives.",
    price: 45,
    inventoryItemId: "inv-olives",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "add-5",
    franchiseId: "FRAN-001",
    name: "Golden Sweet Corn",
    type: "TOPPING",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
    description: "Juicy, steamed golden corn kernels.",
    price: 40,
    inventoryItemId: "inv-corn",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "add-6",
    franchiseId: "FRAN-001",
    name: "Cheese Burst Liquid Crust",
    type: "CHEESE",
    image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80&fm=webp",
    description: "Creamy liquid cheese filled inside the pizza crust.",
    price: 95,
    inventoryItemId: "inv-cheeseburst",
    status: "OUT_OF_STOCK",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "add-7",
    franchiseId: "FRAN-001",
    name: "Schezwan Sauce Drizzle",
    type: "SAUCE",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80&fm=webp",
    description: "A spicy, zesty drizzle of special garlic schezwan sauce.",
    price: 30,
    inventoryItemId: "inv-schezwan",
    status: "INACTIVE",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Initial Mock Add-on Groups
export const mockAddonGroups = [
  {
    _id: "grp-1",
    franchiseId: "FRAN-001",
    name: "Cheese & Crust Customizations",
    selectionType: "SINGLE",
    minSelection: 0,
    maxSelection: 1,
    isRequired: false,
    addonIds: ["add-1", "add-6"]
  },
  {
    _id: "grp-2",
    franchiseId: "FRAN-001",
    name: "Gourmet Veggie Toppings",
    selectionType: "MULTIPLE",
    minSelection: 0,
    maxSelection: 4,
    isRequired: false,
    addonIds: ["add-2", "add-3", "add-4", "add-5"]
  }
];

// Product assignments mappings: productId -> [addonIds]
export const mockProductAddonAssignments = [
  { _id: "asgn-1", productId: "prod-101", addonIds: ["add-1", "add-3", "add-4", "add-6"], createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { _id: "asgn-2", productId: "prod-102", addonIds: ["add-1", "add-2", "add-5"], createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
  { _id: "asgn-3", productId: "prod-103", addonIds: ["add-1", "add-3"], createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
];

// Initial Store-specific pricing overrides database (store_products collection representation)
export const initialStoreProducts = [
  // Double Cheese Margherita Pizza (prod-101) overrides across active stores
  {
    _id: "sp-1-101",
    storeId: "store-1",
    productId: "prod-101",
    smallPrice: 159,
    mediumPrice: 269,
    largePrice: 419,
    deliveryPrice: 289,
    takeawayPrice: 249,
    dineInPrice: 269,
    specialPrice: 239,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    availability: "PROMOTION ACTIVE",
    status: "ACTIVE",
    updatedBy: "Subham Jamliya",
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "sp-2-101",
    storeId: "store-2",
    productId: "prod-101",
    smallPrice: 149,
    mediumPrice: 249,
    largePrice: 399,
    deliveryPrice: 269,
    takeawayPrice: 239,
    dineInPrice: 249,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Rashid Khan",
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "sp-3-101",
    storeId: "store-3",
    productId: "prod-101",
    smallPrice: 139,
    mediumPrice: 239,
    largePrice: 379,
    deliveryPrice: 259,
    takeawayPrice: 229,
    dineInPrice: 239,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Aarav Sharma",
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "sp-4-101",
    storeId: "store-4",
    productId: "prod-101",
    smallPrice: 149,
    mediumPrice: 249,
    largePrice: 399,
    deliveryPrice: 269,
    takeawayPrice: 239,
    dineInPrice: 249,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "UNAVAILABLE",
    status: "ACTIVE",
    updatedBy: "Vikram Singh",
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Tandoori Paneer Overloaded Pizza (prod-102) overrides
  {
    _id: "sp-1-102",
    storeId: "store-1",
    productId: "prod-102",
    smallPrice: 209,
    mediumPrice: 369,
    largePrice: 569,
    deliveryPrice: 389,
    takeawayPrice: 359,
    dineInPrice: 369,
    specialPrice: 329,
    startDate: "2026-06-10",
    endDate: "2026-07-10",
    availability: "PROMOTION ACTIVE",
    status: "ACTIVE",
    updatedBy: "Subham Jamliya",
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "sp-2-102",
    storeId: "store-2",
    productId: "prod-102",
    smallPrice: 199,
    mediumPrice: 349,
    largePrice: 549,
    deliveryPrice: 369,
    takeawayPrice: 339,
    dineInPrice: 349,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Rashid Khan",
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "sp-5-102",
    storeId: "store-5",
    productId: "prod-102",
    smallPrice: 199,
    mediumPrice: 349,
    largePrice: 549,
    deliveryPrice: 369,
    takeawayPrice: 339,
    dineInPrice: 349,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "INACTIVE",
    updatedBy: "Manoj Verma",
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Fiery Chicken Tikka Pizza (prod-103)
  {
    _id: "sp-1-103",
    storeId: "store-1",
    productId: "prod-103",
    smallPrice: 239,
    mediumPrice: 409,
    largePrice: 629,
    deliveryPrice: 429,
    takeawayPrice: 399,
    dineInPrice: 409,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Subham Jamliya",
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "sp-3-103",
    storeId: "store-3",
    productId: "prod-103",
    smallPrice: 219,
    mediumPrice: 379,
    largePrice: 579,
    deliveryPrice: 399,
    takeawayPrice: 369,
    dineInPrice: 379,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "UNAVAILABLE",
    status: "ACTIVE",
    updatedBy: "Aarav Sharma",
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Cheesy Garlic Breadsticks (prod-104)
  {
    _id: "sp-1-104",
    storeId: "store-1",
    productId: "prod-104",
    smallPrice: 119,
    mediumPrice: 159,
    largePrice: 229,
    deliveryPrice: 169,
    takeawayPrice: 149,
    dineInPrice: 159,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Subham Jamliya",
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "sp-2-104",
    storeId: "store-2",
    productId: "prod-104",
    smallPrice: 109,
    mediumPrice: 149,
    largePrice: 219,
    deliveryPrice: 159,
    takeawayPrice: 139,
    dineInPrice: 149,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Rashid Khan",
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Eggless Choco Lava Cake (prod-105)
  {
    _id: "sp-1-105",
    storeId: "store-1",
    productId: "prod-105",
    smallPrice: 89,
    mediumPrice: 109,
    largePrice: 159,
    deliveryPrice: 119,
    takeawayPrice: 99,
    dineInPrice: 109,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Subham Jamliya",
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Spicy Jalapeno Veg Delight (prod-106)
  {
    _id: "sp-1-106",
    storeId: "store-1",
    productId: "prod-106",
    smallPrice: 189,
    mediumPrice: 319,
    largePrice: 479,
    deliveryPrice: 339,
    takeawayPrice: 309,
    dineInPrice: 319,
    specialPrice: 0,
    startDate: "",
    endDate: "",
    availability: "AVAILABLE",
    status: "ACTIVE",
    updatedBy: "Subham Jamliya",
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Initial Price History database (product_price_history collection representation)
export const initialPriceHistory = [
  {
    _id: "ph-1",
    storeId: "store-1",
    productId: "prod-101",
    oldPrice: { smallPrice: 149, mediumPrice: 249, largePrice: 399 },
    newPrice: { smallPrice: 159, mediumPrice: 269, largePrice: 419 },
    changedBy: "Subham Jamliya",
    reason: "Annual Inflation Adjustment",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "ph-2",
    storeId: "store-1",
    productId: "prod-102",
    oldPrice: { smallPrice: 199, mediumPrice: 349, largePrice: 549 },
    newPrice: { smallPrice: 209, mediumPrice: 369, largePrice: 569 },
    changedBy: "Subham Jamliya",
    reason: "Dairy Cost Increase (Cheese & Paneer)",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "ph-3",
    storeId: "store-2",
    productId: "prod-101",
    oldPrice: { smallPrice: 139, mediumPrice: 239, largePrice: 379 },
    newPrice: { smallPrice: 149, mediumPrice: 249, largePrice: 399 },
    changedBy: "Rashid Khan",
    reason: "Base Price Alignment",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

