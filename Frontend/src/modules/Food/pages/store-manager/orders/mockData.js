// Mock Data for Store Operation Console (Incoming Orders)
// Complies with MongoDB schema and requirements.

export const initialMockStaff = [
  {
    _id: "staff-001",
    employeeId: "EMP-PV-110",
    name: "Ramesh Singh",
    role: "kitchen_supervisor",
    status: "active",
    currentActiveOrders: 2,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-002",
    employeeId: "EMP-PV-112",
    name: "Aman Verma",
    role: "kitchen_supervisor",
    status: "active",
    currentActiveOrders: 0,
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-003",
    employeeId: "EMP-PV-115",
    name: "Sanjay Gupta",
    role: "kitchen_supervisor",
    status: "active",
    currentActiveOrders: 4,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-004",
    employeeId: "EMP-PV-118",
    name: "Neha Joshi",
    role: "kitchen_supervisor",
    status: "active",
    currentActiveOrders: 1,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-005",
    employeeId: "EMP-PV-120",
    name: "Vijay Saxena",
    role: "kitchen_supervisor",
    status: "inactive", // inactive supervisor should be filtered out
    currentActiveOrders: 0,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&fm=webp"
  }
];

export const initialMockOrders = [
  {
    _id: "660c1d2eef20092c4820a001",
    orderNumber: "PVP-10241",
    customerId: "cust-9901",
    customer: {
      name: "Rohan Malhotra",
      phone: "+91 98765 43210",
      email: "rohan.malhotra@gmail.com",
      loyaltyPoints: 350,
      previousOrdersCount: 12
    },
    storeId: "st-indore-01",
    status: "payment_verified",
    createdAt: new Date(Date.now() - 120000).toISOString(), // 2 mins ago
    orderType: "delivery",
    priority: "normal",
    orderSource: "Website",
    paymentStatus: "paid",
    paymentMethod: "Online",
    deliveryAddress: {
      houseNumber: "Flat 402, Block C",
      street: "Shalimar Township",
      landmark: "Near Apollo Hospital",
      city: "Indore",
      pincode: "452010",
      notes: "Please call on arrival, baby sleeping.",
      googleMapsLink: "https://maps.google.com/?q=22.7508,75.8956"
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Large",
        variant: "Pan Crust",
        unitPrice: 280,
        subtotal: 560,
        customizations: {
          crustType: "Pan Crust",
          cheeseLevel: "Extra Cheese",
          extraToppings: ["Mushroom", "Black Olives"],
          removeIngredients: [],
          specialInstructions: "Make it extra spicy with green chillies if possible."
        }
      },
      {
        productId: "prod-003",
        name: "Stuffed Garlic Bread",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Regular",
        variant: "Classic",
        unitPrice: 140,
        subtotal: 140,
        customizations: {
          crustType: "Classic",
          cheeseLevel: "Normal",
          extraToppings: ["Sweet Corn"],
          removeIngredients: [],
          specialInstructions: ""
        }
      }
    ],
    couponId: "WELCOME50",
    subtotal: 700,
    discountAmount: 50,
    taxes: 32.50,
    deliveryCharges: 40.00,
    packingCharges: 25.00,
    grandTotal: 747.50
  },
  {
    _id: "660c1d2eef20092c4820a002",
    orderNumber: "PVP-10242",
    customerId: "cust-9902",
    customer: {
      name: "Isha Sharma",
      phone: "+91 88776 65544",
      email: "isha.sharma@yahoo.co.in",
      loyaltyPoints: 85,
      previousOrdersCount: 2
    },
    storeId: "st-indore-01",
    status: "awaiting_confirmation",
    createdAt: new Date(Date.now() - 480000).toISOString(), // 8 mins ago
    orderType: "pickup",
    priority: "urgent",
    orderSource: "Android",
    paymentStatus: "pending",
    paymentMethod: "COD",
    deliveryAddress: {
      houseNumber: "N/A - Store Pickup",
      street: "N/A",
      landmark: "N/A",
      city: "Indore",
      pincode: "452001",
      notes: "Will pick up by 8:30 PM",
      googleMapsLink: ""
    },
    items: [
      {
        productId: "prod-002",
        name: "Paneer Tikka Pizza",
        image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Thin Crust",
        unitPrice: 340,
        subtotal: 340,
        customizations: {
          crustType: "Thin Crust",
          cheeseLevel: "Normal",
          extraToppings: ["Extra Paneer", "Onion"],
          removeIngredients: [],
          specialInstructions: "Less oil"
        }
      },
      {
        productId: "prod-004",
        name: "Choco Lava Cake",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Regular",
        variant: "Chocolate",
        unitPrice: 90,
        subtotal: 180,
        customizations: {
          crustType: "N/A",
          cheeseLevel: "N/A",
          extraToppings: [],
          removeIngredients: [],
          specialInstructions: "Serve hot."
        }
      },
      {
        productId: "prod-005",
        name: "Coke (500ml)",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Regular",
        variant: "Beverage",
        unitPrice: 45,
        subtotal: 90,
        customizations: {
          crustType: "N/A",
          cheeseLevel: "N/A",
          extraToppings: [],
          removeIngredients: [],
          specialInstructions: "Chilled please."
        }
      }
    ],
    couponId: "",
    subtotal: 610,
    discountAmount: 0,
    taxes: 30.50,
    deliveryCharges: 0.00,
    packingCharges: 15.00,
    grandTotal: 655.50
  },
  {
    _id: "660c1d2eef20092c4820a003",
    orderNumber: "PVP-10243",
    customerId: "cust-9903",
    customer: {
      name: "Amit Kumar",
      phone: "+91 76543 21098",
      email: "amit.k@gmail.com",
      loyaltyPoints: 1200,
      previousOrdersCount: 45
    },
    storeId: "st-indore-01",
    status: "payment_verified",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    orderType: "delivery",
    priority: "normal",
    orderSource: "iOS",
    paymentStatus: "paid",
    paymentMethod: "Online",
    deliveryAddress: {
      houseNumber: "House 12, Road 4",
      street: "Saket Nagar",
      landmark: "Opposite Saket Garden",
      city: "Indore",
      pincode: "452018",
      notes: "Leave at security desk if unanswered.",
      googleMapsLink: "https://maps.google.com/?q=22.7201,75.8801"
    },
    items: [
      {
        productId: "prod-002",
        name: "Capsicum Veggie Supreme",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Cheese Burst",
        unitPrice: 380,
        subtotal: 380,
        customizations: {
          crustType: "Cheese Burst",
          cheeseLevel: "High",
          extraToppings: ["Capsicum", "Onion", "Tomato"],
          removeIngredients: ["Olives"],
          specialInstructions: ""
        }
      }
    ],
    couponId: "FESTIVE20",
    subtotal: 380,
    discountAmount: 76,
    taxes: 15.20,
    deliveryCharges: 40.00,
    packingCharges: 20.00,
    grandTotal: 379.20
  },
  {
    _id: "660c1d2eef20092c4820a004",
    orderNumber: "PVP-10244",
    customerId: "cust-9904",
    customer: {
      name: "Priyanjali Sen",
      phone: "+91 94250 88204",
      email: "priya.sen@outlook.com",
      loyaltyPoints: 0,
      previousOrdersCount: 0
    },
    storeId: "st-indore-01",
    status: "awaiting_confirmation",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    orderType: "delivery",
    priority: "urgent",
    orderSource: "Swiggy",
    paymentStatus: "paid",
    paymentMethod: "Online",
    deliveryAddress: {
      houseNumber: "A-12, Sector C",
      street: "Vijay Nagar",
      landmark: "Near Sayaji Hotel",
      city: "Indore",
      pincode: "452010",
      notes: "Please deliver before 9:00 PM.",
      googleMapsLink: ""
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {
          crustType: "Pan Crust",
          cheeseLevel: "Normal",
          extraToppings: [],
          removeIngredients: [],
          specialInstructions: ""
        }
      }
    ],
    couponId: "",
    subtotal: 220,
    discountAmount: 0,
    taxes: 11.00,
    deliveryCharges: 35.00,
    packingCharges: 15.00,
    grandTotal: 281.00
  }
];

export const initialMockActiveStaff = [
  {
    _id: "staff-active-001",
    employeeId: "EMP-PV-201",
    name: "Rohan Dev",
    role: "pizza_chef",
    status: "active",
    currentActiveOrders: 1,
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-active-002",
    employeeId: "EMP-PV-202",
    name: "Sandeep Sen",
    role: "pizza_chef",
    status: "active",
    currentActiveOrders: 3,
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-active-003",
    employeeId: "EMP-PV-203",
    name: "Karan Malhotra",
    role: "baking_chef",
    status: "active",
    currentActiveOrders: 2,
    avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-active-004",
    employeeId: "EMP-PV-204",
    name: "Anil Sharma",
    role: "baking_chef",
    status: "active",
    currentActiveOrders: 0,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-active-005",
    employeeId: "EMP-PV-205",
    name: "Vikram Gupta",
    role: "packaging_staff",
    status: "active",
    currentActiveOrders: 2,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&fm=webp"
  },
  {
    _id: "staff-active-006",
    employeeId: "EMP-PV-206",
    name: "Sunita Rao",
    role: "packaging_staff",
    status: "active",
    currentActiveOrders: 1,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&fm=webp"
  }
];

export const initialMockActiveOrders = [
  {
    _id: "660c1d2eef20092c4820a011",
    orderNumber: "PVP-10251",
    customerId: "cust-8801",
    customer: {
      name: "Aditya Roy",
      phone: "+91 99887 76655",
      email: "aditya.roy@gmail.com",
      loyaltyPoints: 120,
      previousOrdersCount: 5
    },
    storeId: "st-indore-01",
    status: "preparing",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    acceptedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    expectedReadyAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins from now
    orderType: "delivery",
    priority: "normal",
    orderSource: "Website",
    paymentStatus: "paid",
    paymentMethod: "Online",
    deliveryAddress: {
      houseNumber: "Flat 201, Sunshine Heights",
      street: "Geeta Bhawan Road",
      landmark: "Near Hanuman Temple",
      city: "Indore",
      pincode: "452001",
      notes: "Ring bell twice, deliver at flat.",
      googleMapsLink: "https://maps.google.com/?q=22.7244,75.8839"
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {
          crustType: "Pan Crust",
          cheeseLevel: "Extra Cheese",
          extraToppings: ["Mushroom"],
          removeIngredients: [],
          specialInstructions: "Cook well done"
        }
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), note: "Moved to kitchen preparing stage" }
    ],
    assignedStaff: {
      pizza_chef: { _id: "staff-active-001", name: "Rohan Dev" },
      baking_chef: null,
      packaging_staff: null
    },
    kitchenNote: "Make pizza crust thin and crispy if possible.",
    subtotal: 220,
    discountAmount: 0,
    taxes: 11.00,
    deliveryCharges: 35.00,
    packingCharges: 15.00,
    grandTotal: 281.00
  },
  {
    _id: "660c1d2eef20092c4820a012",
    orderNumber: "PVP-10252",
    customerId: "cust-8802",
    customer: {
      name: "Sneha Reddy",
      phone: "+91 91234 56789",
      email: "sneha.reddy@yahoo.com",
      loyaltyPoints: 340,
      previousOrdersCount: 14
    },
    storeId: "st-indore-01",
    status: "baking",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
    acceptedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    expectedReadyAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(), // 8 mins from now
    orderType: "pickup",
    priority: "urgent",
    orderSource: "iOS",
    paymentStatus: "paid",
    paymentMethod: "Online",
    deliveryAddress: {
      houseNumber: "N/A - Store Pickup",
      street: "N/A",
      landmark: "N/A",
      city: "Indore",
      pincode: "452001",
      notes: "",
      googleMapsLink: ""
    },
    items: [
      {
        productId: "prod-002",
        name: "Paneer Tikka Pizza",
        image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Large",
        variant: "Cheese Burst",
        unitPrice: 380,
        subtotal: 760,
        customizations: {
          crustType: "Cheese Burst",
          cheeseLevel: "Normal",
          extraToppings: ["Extra Paneer", "Onion"],
          removeIngredients: [],
          specialInstructions: ""
        }
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), note: "Moved to kitchen preparing stage" },
      { status: "baking", timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), note: "Moved to baking oven stage" }
    ],
    assignedStaff: {
      pizza_chef: { _id: "staff-active-002", name: "Sandeep Sen" },
      baking_chef: { _id: "staff-active-003", name: "Karan Malhotra" },
      packaging_staff: null
    },
    kitchenNote: "Extra spicy paneer tikka pieces.",
    subtotal: 760,
    discountAmount: 40,
    taxes: 36.00,
    deliveryCharges: 0.00,
    packingCharges: 25.00,
    grandTotal: 781.00
  },
  {
    _id: "660c1d2eef20092c4820a013",
    orderNumber: "PVP-10253",
    customerId: "cust-8803",
    customer: {
      name: "Kabir Kapoor",
      phone: "+91 98888 77777",
      email: "kabir.k@gmail.com",
      loyaltyPoints: 850,
      previousOrdersCount: 28
    },
    storeId: "st-indore-01",
    status: "packaging",
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 mins ago
    acceptedAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    expectedReadyAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago (delayed!)
    orderType: "delivery",
    priority: "vip",
    orderSource: "Swiggy",
    paymentStatus: "paid",
    paymentMethod: "Online",
    deliveryAddress: {
      houseNumber: "House No 55",
      street: "Saket Colony",
      landmark: "Opposite Community Hall",
      city: "Indore",
      pincode: "452018",
      notes: "Contactless delivery. Leave at door.",
      googleMapsLink: "https://maps.google.com/?q=22.7201,75.8801"
    },
    items: [
      {
        productId: "prod-003",
        name: "Stuffed Garlic Bread",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Regular",
        variant: "Classic",
        unitPrice: 140,
        subtotal: 140,
        customizations: {
          crustType: "Classic",
          cheeseLevel: "Normal",
          extraToppings: ["Sweet Corn"],
          removeIngredients: [],
          specialInstructions: ""
        }
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 19 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(), note: "Moved to kitchen preparing stage" },
      { status: "baking", timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), note: "Moved to baking oven stage" },
      { status: "packaging", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), note: "Moved to packaging stage" }
    ],
    assignedStaff: {
      pizza_chef: { _id: "staff-active-002", name: "Sandeep Sen" },
      baking_chef: { _id: "staff-active-003", name: "Karan Malhotra" },
      packaging_staff: { _id: "staff-active-005", name: "Vikram Gupta" }
    },
    kitchenNote: "Make garlic bread extra garlic buttery.",
    subtotal: 140,
    discountAmount: 0,
    taxes: 7.00,
    deliveryCharges: 40.00,
    packingCharges: 15.00,
    grandTotal: 202.00
  },
  {
    _id: "660c1d2eef20092c4820a014",
    orderNumber: "PVP-10254",
    customerId: "cust-8804",
    customer: {
      name: "Tanya Sharma",
      phone: "+91 88776 99887",
      email: "tanya.sharma@outlook.com",
      loyaltyPoints: 0,
      previousOrdersCount: 0
    },
    storeId: "st-indore-01",
    status: "confirmed", // Confirmed status, i.e. not yet in preparing, sits in "Preparing" column as "Not Started"
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    acceptedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    expectedReadyAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 mins from now
    orderType: "delivery",
    priority: "normal",
    orderSource: "Zomato",
    paymentStatus: "paid",
    paymentMethod: "Online",
    deliveryAddress: {
      houseNumber: "Building C, Appt 502",
      street: "Vijay Nagar",
      landmark: "Behind Infiniti Hotel",
      city: "Indore",
      pincode: "452010",
      notes: "",
      googleMapsLink: ""
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(), note: "Accepted by store manager" }
    ],
    assignedStaff: {
      pizza_chef: null,
      baking_chef: null,
      packaging_staff: null
    },
    kitchenNote: "",
    subtotal: 220,
    discountAmount: 0,
    taxes: 11.00,
    deliveryCharges: 35.00,
    packingCharges: 15.00,
    grandTotal: 281.00
  }
];

export const initialMockRiders = [
  {
    _id: "rider-001",
    name: "Ramesh Kumar",
    employeeId: "EMP-PV-RID-01",
    status: "active",
    availability: "available",
    vehicleType: "Bike",
    vehicleNumber: "MP-09-AB-1234",
    phone: "+91 98765 11111",
    rating: 4.8,
    currentDeliveries: 0
  },
  {
    _id: "rider-002",
    name: "Sunita Patil",
    employeeId: "EMP-PV-RID-02",
    status: "active",
    availability: "available",
    vehicleType: "Scooter",
    vehicleNumber: "MP-09-CD-5678",
    phone: "+91 98765 22222",
    rating: 4.9,
    currentDeliveries: 0
  },
  {
    _id: "rider-003",
    name: "Ajay Sharma",
    employeeId: "EMP-PV-RID-03",
    status: "active",
    availability: "available",
    vehicleType: "Bike",
    vehicleNumber: "MP-09-EF-9012",
    phone: "+91 98765 33333",
    rating: 4.6,
    currentDeliveries: 1
  },
  {
    _id: "rider-004",
    name: "Vijay Singh",
    employeeId: "EMP-PV-RID-04",
    status: "active",
    availability: "available",
    vehicleType: "Scooter",
    vehicleNumber: "MP-09-GH-3456",
    phone: "+91 98765 44444",
    rating: 4.7,
    currentDeliveries: 0
  }
];

export const initialMockReadyOrders = [
  {
    _id: "660c1d2eef20092c4820a021",
    orderNumber: "PVP-10261",
    customerId: "cust-7701",
    customer: {
      name: "Arjun Mehta",
      phone: "+91 98222 33333",
      email: "arjun.mehta@gmail.com",
      loyaltyPoints: 150,
      previousOrdersCount: 8
    },
    storeId: "st-indore-01",
    status: "ready",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    readyAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago (Green)
    orderType: "delivery",
    priority: "normal",
    paymentMethod: "Online",
    grandTotal: 345.00,
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {
          crustType: "Pan Crust",
          cheeseLevel: "Extra Cheese"
        }
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" }
    ],
    deliveryAddress: {
      houseNumber: "House 204",
      street: "Anand Nagar",
      landmark: "Near Anand Club",
      city: "Indore",
      pincode: "452001",
      notes: "Deliver to security guard.",
      googleMapsLink: "https://maps.google.com/?q=22.7196,75.8577"
    },
    deliveryPartnerId: null,
    riderAssignedAt: null
  },
  {
    _id: "660c1d2eef20092c4820a022",
    orderNumber: "PVP-10262",
    customerId: "cust-7702",
    customer: {
      name: "Kavya Nair",
      phone: "+91 94000 55555",
      email: "kavya.nair@yahoo.in",
      loyaltyPoints: 45,
      previousOrdersCount: 1
    },
    storeId: "st-indore-01",
    status: "ready",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    readyAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago (Normal)
    orderType: "pickup",
    priority: "urgent",
    paymentMethod: "COD",
    grandTotal: 490.00,
    items: [
      {
        productId: "prod-002",
        name: "Paneer Tikka Pizza",
        image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Large",
        variant: "Thin Crust",
        unitPrice: 380,
        subtotal: 380,
        customizations: {
          crustType: "Thin Crust",
          extraToppings: ["Onion", "Sweet Corn"]
        }
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), note: "Marked ready for pickup" }
    ],
    deliveryAddress: {
      houseNumber: "N/A - Store Pickup",
      street: "N/A",
      landmark: "N/A",
      city: "Indore",
      pincode: "452001",
      notes: "Will pick up by 12:45 PM",
      googleMapsLink: ""
    },
    deliveryPartnerId: null,
    riderAssignedAt: null
  },
  {
    _id: "660c1d2eef20092c4820a023",
    orderNumber: "PVP-10263",
    customerId: "cust-7703",
    customer: {
      name: "Suresh Kumar",
      phone: "+91 88777 66666",
      email: "suresh.kumar@gmail.com",
      loyaltyPoints: 680,
      previousOrdersCount: 19
    },
    storeId: "st-indore-01",
    status: "ready",
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago (Yellow - waiting > 10m)
    orderType: "delivery",
    priority: "vip",
    paymentMethod: "Online",
    grandTotal: 720.00,
    items: [
      {
        productId: "prod-003",
        name: "Stuffed Garlic Bread",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Regular",
        variant: "Classic",
        unitPrice: 140,
        subtotal: 280,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 36 * 65000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 17 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" }
    ],
    deliveryAddress: {
      houseNumber: "Flat 505, Block B",
      street: "Shalimar Township",
      landmark: "Near Apollo Hospital",
      city: "Indore",
      pincode: "452010",
      notes: "",
      googleMapsLink: "https://maps.google.com/?q=22.7508,75.8956"
    },
    deliveryPartnerId: "rider-001", // Assigned Ramesh Kumar
    riderAssignedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    _id: "660c1d2eef20092c4820a024",
    orderNumber: "PVP-10264",
    customerId: "cust-7704",
    customer: {
      name: "Priya Patel",
      phone: "+91 99887 76655",
      email: "priya.patel@outlook.com",
      loyaltyPoints: 0,
      previousOrdersCount: 0
    },
    storeId: "st-indore-01",
    status: "ready",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 mins ago (Red - waiting > 15m)
    orderType: "delivery",
    priority: "urgent",
    paymentMethod: "Online",
    grandTotal: 290.00,
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), note: "Order placed" },
      { status: "confirmed", timestamp: new Date(Date.now() - 44 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" }
    ],
    deliveryAddress: {
      houseNumber: "Building D, Flat 101",
      street: "Vijay Nagar",
      landmark: "Opposite Sayaji Hotel",
      city: "Indore",
      pincode: "452010",
      notes: "Call when you reach gate.",
      googleMapsLink: ""
    },
    deliveryPartnerId: null,
    riderAssignedAt: null
  }
];

export const initialMockCompletedOrders = [
  {
    _id: "comp-001",
    orderNumber: "PVP-90812",
    customerId: "cust-5011",
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(), // 3 days ago
    deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
    totalDuration: 30, // 30 minutes
    customerRating: 5,
    review: "Excellent crust and toppings! The Double Cheese Margherita was loaded with fresh cheese.",
    invoiceUrl: "/invoices/invoice-90812.pdf",
    transactionId: "TXN_778129031",
    paymentMethod: "Online",
    paymentGateway: "Razorpay",
    refundStatus: "none",
    refundAmount: 0,
    refundTransactionId: "",
    deliveryPartnerId: "rider-001", // Ramesh Kumar
    couponId: "cp-50",
    couponCode: "PVPWELCOME",
    couponType: "flat",
    discountAmount: 50.00,
    couponCampaignName: "Welcome Offer 2026",
    subtotal: 1100.00,
    taxes: 55.00, // CGST + SGST (5%)
    deliveryCharges: 40.00,
    packingCharges: 15.00,
    tipAmount: 20.00,
    grandTotal: 1180.00, // High Value Order (> 1000)
    orderType: "delivery",
    priority: "vip",
    orderSource: "Website",
    customer: {
      name: "Rahul Sharma",
      phone: "+91 98765 12345",
      email: "rahul.sharma@gmail.com",
      loyaltyPoints: 450,
      previousOrdersCount: 15
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Large",
        variant: "Pan Crust",
        unitPrice: 280,
        subtotal: 560,
        customizations: {
          crustType: "Pan Crust",
          cheeseLevel: "Extra Cheese",
          extraToppings: ["Mushroom", "Black Olives"],
          specialInstructions: "Make it extra cheesy!"
        }
      },
      {
        productId: "prod-002",
        name: "Tandoori Paneer Pizza",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Medium",
        variant: "Cheese Burst",
        unitPrice: 270,
        subtotal: 540,
        customizations: {
          crustType: "Cheese Burst",
          cheeseLevel: "Regular Cheese",
          extraToppings: ["Onion", "Paneer Tikka"],
          specialInstructions: "Spicy and well done."
        }
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(), note: "Order placed via Website" },
      { status: "confirmed", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 43 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 40 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 22 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 18 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" },
      { status: "picked_up", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 16 * 60 * 1000).toISOString(), note: "Picked up by rider Ramesh Kumar" },
      { status: "delivered", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(), note: "Delivered to customer" },
      { status: "completed", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString(), note: "Feedback received, order closed" }
    ]
  },
  {
    _id: "comp-002",
    orderNumber: "PVP-90815",
    customerId: "cust-5012",
    status: "delivered",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 50 * 60 * 1000).toISOString(), // 2 days ago
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString(),
    totalDuration: 40,
    customerRating: 4,
    review: "Pizza was hot and tasty, but delivery took a little longer than expected.",
    invoiceUrl: "/invoices/invoice-90815.pdf",
    transactionId: "",
    paymentMethod: "COD",
    paymentGateway: "Cash",
    refundStatus: "none",
    refundAmount: 0,
    refundTransactionId: "",
    deliveryPartnerId: "rider-002", // Sunita Patil
    couponId: "",
    couponCode: "",
    couponType: "",
    discountAmount: 0,
    couponCampaignName: "",
    subtotal: 420.00,
    taxes: 21.00,
    deliveryCharges: 40.00,
    packingCharges: 10.00,
    tipAmount: 0,
    grandTotal: 491.00,
    orderType: "delivery",
    priority: "normal",
    orderSource: "Android",
    customer: {
      name: "Sneha Patel",
      phone: "+91 99887 11223",
      email: "sneha.patel@yahoo.com",
      loyaltyPoints: 120,
      previousOrdersCount: 3
    },
    items: [
      {
        productId: "prod-003",
        name: "Veggie Supreme Pizza",
        image: "https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Thin Crust",
        unitPrice: 240,
        subtotal: 240,
        customizations: {
          crustType: "Thin Crust",
          cheeseLevel: "Regular Cheese",
          extraToppings: ["Capsicum", "Tomato"],
          specialInstructions: "Cut into 6 slices."
        }
      },
      {
        productId: "prod-004",
        name: "Garlic Breadsticks",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Standard",
        variant: "Original",
        unitPrice: 90,
        subtotal: 180,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 50 * 60 * 1000).toISOString(), note: "Order placed via Android" },
      { status: "confirmed", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 48 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 32 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 24 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 20 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" },
      { status: "picked_up", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(), note: "Picked up by rider Sunita Patil" },
      { status: "delivered", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString(), note: "Delivered to customer" }
    ]
  },
  {
    _id: "comp-003",
    orderNumber: "PVP-90820",
    customerId: "cust-5013",
    status: "completed",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 120 * 60 * 1000).toISOString(), // 1 day ago
    deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 95 * 60 * 1000).toISOString(),
    totalDuration: 25,
    customerRating: 3,
    review: "Taste was average, crust was a bit dry. Delivery was quick though.",
    invoiceUrl: "/invoices/invoice-90820.pdf",
    transactionId: "TXN_WALLET_88201",
    paymentMethod: "Wallet",
    paymentGateway: "Paytm Wallet",
    refundStatus: "none",
    refundAmount: 0,
    refundTransactionId: "",
    deliveryPartnerId: "rider-003", // Ajay Sharma
    couponId: "",
    couponCode: "",
    couponType: "",
    discountAmount: 0,
    couponCampaignName: "",
    subtotal: 800.00,
    taxes: 40.00,
    deliveryCharges: 0.00,
    packingCharges: 10.00,
    tipAmount: 10.00,
    grandTotal: 860.00,
    orderType: "delivery",
    priority: "normal",
    orderSource: "iOS",
    customer: {
      name: "Vikram Singh",
      phone: "+91 97766 55443",
      email: "vikram.s@gmail.com",
      loyaltyPoints: 310,
      previousOrdersCount: 9
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 440,
        customizations: {}
      },
      {
        productId: "prod-003",
        name: "Veggie Supreme Pizza",
        image: "https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Cheese Burst",
        unitPrice: 310,
        subtotal: 310,
        customizations: {
          crustType: "Cheese Burst",
          cheeseLevel: "Regular Cheese"
        }
      },
      {
        productId: "prod-005",
        name: "Choco Lava Cake",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Standard",
        variant: "Original",
        unitPrice: 50,
        subtotal: 50,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 120 * 60 * 1000).toISOString(), note: "Order placed via iOS App" },
      { status: "confirmed", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 118 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 115 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 105 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 99 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 97 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" },
      { status: "picked_up", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 96 * 60 * 1000).toISOString(), note: "Picked up by rider Ajay Sharma" },
      { status: "delivered", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 95 * 60 * 1000).toISOString(), note: "Delivered to customer" },
      { status: "completed", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 80 * 60 * 1000).toISOString(), note: "Feedback logged" }
    ]
  },
  {
    _id: "comp-004",
    orderNumber: "PVP-90825",
    customerId: "cust-5014",
    status: "completed",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    deliveredAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
    totalDuration: 30,
    customerRating: 5,
    review: "Amazing taste! Tandoori paneer was fresh and spicy. Worth the price.",
    invoiceUrl: "/invoices/invoice-90825.pdf",
    transactionId: "TXN_778129090",
    paymentMethod: "Online",
    paymentGateway: "Razorpay",
    refundStatus: "none",
    refundAmount: 0,
    refundTransactionId: "",
    deliveryPartnerId: null, // Self-pickup
    couponId: "cp-100",
    couponCode: "FESTIVE100",
    couponType: "flat",
    discountAmount: 100.00,
    couponCampaignName: "Festive Season Discount",
    subtotal: 1200.00,
    taxes: 60.00,
    deliveryCharges: 0.00,
    packingCharges: 20.00,
    tipAmount: 0,
    grandTotal: 1180.00, // High Value Order (> 1000)
    orderType: "pickup",
    priority: "normal",
    orderSource: "POS",
    customer: {
      name: "Aarav Verma",
      phone: "+91 96655 44332",
      email: "aarav.v@gmail.com",
      loyaltyPoints: 210,
      previousOrdersCount: 4
    },
    items: [
      {
        productId: "prod-002",
        name: "Tandoori Paneer Pizza",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 3,
        size: "Large",
        variant: "Pan Crust",
        unitPrice: 320,
        subtotal: 960,
        customizations: {
          crustType: "Pan Crust",
          cheeseLevel: "Extra Cheese",
          extraToppings: ["Paneer Tikka"]
        }
      },
      {
        productId: "prod-003",
        name: "Veggie Supreme Pizza",
        image: "https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Thin Crust",
        unitPrice: 240,
        subtotal: 240,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), note: "POS order placed at store counter" },
      { status: "confirmed", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 5.8 * 60 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 5.6 * 60 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 5.55 * 60 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(), note: "Marked ready for counter pickup" },
      { status: "delivered", timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(), note: "Picked up by customer Aarav Verma" },
      { status: "completed", timestamp: new Date(Date.now() - 5.4 * 60 * 60 * 1000).toISOString(), note: "Order closed" }
    ]
  },
  {
    _id: "comp-005",
    orderNumber: "PVP-90830",
    customerId: "cust-5015",
    status: "completed",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    deliveredAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(),
    totalDuration: 30,
    customerRating: 5,
    review: "Awesome, refund processed fast too since they forgot my dessert. Pizza was delicious.",
    invoiceUrl: "/invoices/invoice-90830.pdf",
    transactionId: "TXN_778129101",
    paymentMethod: "Online",
    paymentGateway: "Razorpay",
    refundStatus: "refunded",
    refundAmount: 150.00,
    refundTransactionId: "REF_9912001A",
    deliveryPartnerId: "rider-001", // Ramesh Kumar
    couponId: "",
    couponCode: "",
    couponType: "",
    discountAmount: 0,
    couponCampaignName: "",
    subtotal: 650.00,
    taxes: 32.50,
    deliveryCharges: 40.00,
    packingCharges: 10.00,
    tipAmount: 0,
    grandTotal: 732.50,
    orderType: "delivery",
    priority: "normal",
    orderSource: "Swiggy",
    customer: {
      name: "Ananya Iyer",
      phone: "+91 95544 33221",
      email: "ananya.iyer@gmail.com",
      loyaltyPoints: 90,
      previousOrdersCount: 2
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 440,
        customizations: {}
      },
      {
        productId: "prod-005",
        name: "Choco Lava Cake",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 3,
        size: "Standard",
        variant: "Original",
        unitPrice: 50,
        subtotal: 150,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), note: "Swiggy Channel Order accepted" },
      { status: "confirmed", timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 7.9 * 60 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 7.7 * 60 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 7.6 * 60 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 7.55 * 60 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" },
      { status: "picked_up", timestamp: new Date(Date.now() - 7.52 * 60 * 60 * 1000).toISOString(), note: "Picked up by rider Ramesh Kumar" },
      { status: "delivered", timestamp: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(), note: "Delivered to customer" },
      { status: "completed", timestamp: new Date(Date.now() - 7.3 * 60 * 60 * 1000).toISOString(), note: "Refund issued for missing items. Order closed." }
    ]
  },
  {
    _id: "comp-006",
    orderNumber: "PVP-90835",
    customerId: "cust-5016",
    status: "delivered",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    deliveredAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    totalDuration: 30,
    customerRating: 1,
    review: "Pizza was absolutely cold and dry. Very disappointed with Swiggy delivery partner.",
    invoiceUrl: "/invoices/invoice-90835.pdf",
    transactionId: "TXN_778129112",
    paymentMethod: "Online",
    paymentGateway: "Razorpay",
    refundStatus: "none",
    refundAmount: 0,
    refundTransactionId: "",
    deliveryPartnerId: "rider-002", // Sunita Patil
    couponId: "",
    couponCode: "",
    couponType: "",
    discountAmount: 0,
    couponCampaignName: "",
    subtotal: 510.00,
    taxes: 25.50,
    deliveryCharges: 40.00,
    packingCharges: 10.00,
    tipAmount: 0,
    grandTotal: 585.50,
    orderType: "delivery",
    priority: "normal",
    orderSource: "Zomato",
    customer: {
      name: "Sameer Joshi",
      phone: "+91 94433 22110",
      email: "sameer.joshi@outlook.com",
      loyaltyPoints: 40,
      previousOrdersCount: 1
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {}
      },
      {
        productId: "prod-002",
        name: "Tandoori Paneer Pizza",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 290,
        subtotal: 290,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), note: "Zomato Channel Order accepted" },
      { status: "confirmed", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "preparing", timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 1.7 * 60 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 1.6 * 60 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 1.55 * 60 * 60 * 1000).toISOString(), note: "Marked ready for dispatch" },
      { status: "picked_up", timestamp: new Date(Date.now() - 1.52 * 60 * 65 * 1000).toISOString(), note: "Picked up by rider Sunita Patil" },
      { status: "delivered", timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), note: "Delivered to customer Sameer Joshi" }
    ]
  }
];

export const initialMockCancelledOrders = [
  {
    _id: "canc-001",
    orderNumber: "PVP-20101",
    customerId: "cust-5011",
    status: "cancelled",
    cancelReason: "Customer requested cancellation because they ordered the wrong size.",
    cancelledBy: "customer",
    cancelledAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago (Reopen Eligible!)
    refundStatus: "refund_completed",
    refundAmount: 450,
    refundTransactionId: "RFD_TXN_998122",
    paymentMethod: "Online",
    transactionId: "TXN_778129031",
    grandTotal: 450,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    orderType: "delivery",
    priority: "normal",
    orderSource: "Website",
    customer: {
      name: "Rahul Sharma",
      phone: "+91 98765 12345",
      email: "rahul.sharma@gmail.com",
      loyaltyPoints: 450,
      previousOrdersCount: 15
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {}
      },
      {
        productId: "prod-003",
        name: "Stuffed Garlic Bread",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Regular",
        variant: "Classic",
        unitPrice: 140,
        subtotal: 140,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), note: "Order placed via Website" },
      { status: "confirmed", timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(), note: "Accepted by store manager" },
      { status: "cancelled", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), note: "Cancelled by Customer. Reason: wrong size" },
      { status: "refund_initiated", timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), note: "Refund initiated automatically" },
      { status: "refund_completed", timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(), note: "Refund processed successfully" }
    ],
    notes: "Customer contacted support shortly after ordering."
  },
  {
    _id: "canc-002",
    orderNumber: "PVP-20102",
    customerId: "cust-5012",
    status: "rejected",
    cancelReason: "Store rejected the order because Paneer was out of stock.",
    cancelledBy: "store",
    cancelledAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 mins ago
    refundStatus: "refund_pending",
    refundAmount: 650,
    refundTransactionId: "",
    paymentMethod: "Online",
    transactionId: "TXN_778129032",
    grandTotal: 650,
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    orderType: "delivery",
    priority: "vip",
    orderSource: "Mobile App",
    customer: {
      name: "Priya Patel",
      phone: "+91 99887 76655",
      email: "priya.patel@outlook.com",
      loyaltyPoints: 120,
      previousOrdersCount: 4
    },
    items: [
      {
        productId: "prod-002",
        name: "Tandoori Paneer Pizza",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 290,
        subtotal: 580,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), note: "Order placed via Mobile App" },
      { status: "rejected", timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), note: "Rejected by store. Reason: Paneer out of stock." }
    ],
    notes: "Call customer and offer alternative toppings next time."
  },
  {
    _id: "canc-003",
    orderNumber: "PVP-20103",
    customerId: "cust-5013",
    status: "cancelled",
    cancelReason: "System cancelled due to rider availability timeout.",
    cancelledBy: "system",
    cancelledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    refundStatus: "none",
    refundAmount: 0,
    refundTransactionId: "",
    paymentMethod: "COD",
    transactionId: "",
    grandTotal: 320,
    createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    orderType: "delivery",
    priority: "normal",
    orderSource: "Zomato",
    customer: {
      name: "Amit Verma",
      phone: "+91 97766 55443",
      email: "amit.verma@yahoo.com",
      loyaltyPoints: 0,
      previousOrdersCount: 0
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 1,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 220,
        subtotal: 220,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), note: "Zomato order received" },
      { status: "confirmed", timestamp: new Date(Date.now() - 2.45 * 60 * 60 * 1000).toISOString(), note: "Accepted by store" },
      { status: "preparing", timestamp: new Date(Date.now() - 2.4 * 60 * 60 * 1000).toISOString(), note: "Moved to preparing" },
      { status: "baking", timestamp: new Date(Date.now() - 2.3 * 60 * 60 * 1000).toISOString(), note: "Moved to baking" },
      { status: "packaging", timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(), note: "Moved to packaging" },
      { status: "ready", timestamp: new Date(Date.now() - 2.15 * 60 * 60 * 1000).toISOString(), note: "Marked ready" },
      { status: "cancelled", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), note: "System auto-cancelled. No delivery partner assigned." }
    ]
  },
  {
    _id: "canc-004",
    orderNumber: "PVP-20104",
    customerId: "cust-5014",
    status: "cancelled",
    cancelReason: "Customer requested cancellation before acceptance.",
    cancelledBy: "customer",
    cancelledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    refundStatus: "refund_completed",
    refundAmount: 1200,
    refundTransactionId: "RFD_TXN_998125",
    paymentMethod: "Wallet",
    transactionId: "TXN_778129034",
    grandTotal: 1200,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    orderType: "pickup",
    priority: "normal",
    orderSource: "Mobile App",
    customer: {
      name: "Suresh Kumar",
      phone: "+91 88777 66666",
      email: "suresh.kumar@gmail.com",
      loyaltyPoints: 680,
      previousOrdersCount: 19
    },
    items: [
      {
        productId: "prod-002",
        name: "Tandoori Paneer Pizza",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 4,
        size: "Medium",
        variant: "Pan Crust",
        unitPrice: 290,
        subtotal: 1160,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(), note: "Placed order via Mobile App" },
      { status: "cancelled", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: "Cancelled by Customer. Reason: Placed duplicate order." },
      { status: "refund_initiated", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: "Refund to Wallet initiated" },
      { status: "refund_completed", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: "Refund added to customer Wallet" }
    ]
  },
  {
    _id: "canc-005",
    orderNumber: "PVP-20105",
    customerId: "cust-5015",
    status: "rejected",
    cancelReason: "Store rejected the order: Address out of delivery range.",
    cancelledBy: "store",
    cancelledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    refundStatus: "refund_failed",
    refundAmount: 890,
    refundTransactionId: "",
    paymentMethod: "Online",
    transactionId: "TXN_778129035",
    grandTotal: 890,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    orderType: "delivery",
    priority: "normal",
    orderSource: "Website",
    customer: {
      name: "Neha Gupta",
      phone: "+91 91122 33445",
      email: "neha.gupta@gmail.com",
      loyaltyPoints: 300,
      previousOrdersCount: 8
    },
    items: [
      {
        productId: "prod-001",
        name: "Double Cheese Margherita Pizza",
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
        quantity: 2,
        size: "Large",
        variant: "Pan Crust",
        unitPrice: 280,
        subtotal: 560,
        customizations: {}
      }
    ],
    timeline: [
      { status: "received", timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString(), note: "Placed order via Website" },
      { status: "rejected", timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: "Rejected by store. Reason: Out of delivery area." },
      { status: "refund_initiated", timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: "Refund initiation failed due to bank gateway error" }
    ]
  }
];

export const initialMockRefunds = [
  {
    _id: "ref-101",
    orderId: "canc-001",
    customerId: "cust-5011",
    amount: 450,
    refundType: "full",
    refundMethod: "original_source",
    refundReason: "Customer Request",
    status: "completed",
    referenceNumber: "REF_REFID_778129031",
    processedBy: "System Auto",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString()
  },
  {
    _id: "ref-102",
    orderId: "canc-004",
    customerId: "cust-5014",
    amount: 1200,
    refundType: "full",
    refundMethod: "wallet",
    refundReason: "Duplicate Order",
    status: "completed",
    referenceNumber: "REF_REFID_778129034",
    processedBy: "Store Manager",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "ref-103",
    orderId: "canc-005",
    customerId: "cust-5015",
    amount: 890,
    refundType: "full",
    refundMethod: "original_source",
    refundReason: "Store Rejection",
    status: "failed",
    referenceNumber: "REF_FAILED_39812",
    processedBy: "System Auto",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];




