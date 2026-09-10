// Mock Data for Assign Rider workstation
// Complies with MongoDB schemas for orders, delivery_partners, and delivery_assignments

export const initialMockReadyOrders = [
  {
    _id: "ord-201",
    orderNumber: "ORD-1025",
    customerId: "cust-201",
    customerName: "Arjun Mehta",
    customerPhone: "+91 98765 12345",
    totalAmount: 650,
    orderStatus: "ready_for_pickup",
    deliveryStatus: "waiting",
    packagingCompletedAt: new Date(Date.now() - 3 * 60000).toISOString(), // 3 mins ago
    assignedRiderId: null,
    deliveryAddress: "Flat 402, Block C, Shalimar Township, Vijay Nagar, Indore",
    items: [
      { name: "Double Cheese Margherita Pizza", quantity: 2, size: "Medium" },
      { name: "Garlic Breadsticks", quantity: 1, size: "Regular" }
    ]
  },
  {
    _id: "ord-202",
    orderNumber: "ORD-1026",
    customerId: "cust-202",
    customerName: "Sunita Sharma",
    customerPhone: "+91 91234 56789",
    totalAmount: 450,
    orderStatus: "ready_for_pickup",
    deliveryStatus: "waiting",
    packagingCompletedAt: new Date(Date.now() - 8 * 60000).toISOString(), // 8 mins ago
    assignedRiderId: null,
    deliveryAddress: "House No. 12, Saket Colony, Old Palasia, Indore",
    items: [
      { name: "Farmhouse Pizza", quantity: 1, size: "Large" }
    ]
  },
  {
    _id: "ord-203",
    orderNumber: "ORD-1027",
    customerId: "cust-203",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 99887 76655",
    totalAmount: 1250,
    orderStatus: "ready_for_pickup",
    deliveryStatus: "waiting",
    packagingCompletedAt: new Date(Date.now() - 25 * 60000).toISOString(), // 25 mins ago (Delayed)
    assignedRiderId: null,
    deliveryAddress: "Flat 101, Palasia Heights, Near Palasia Square, Indore",
    items: [
      { name: "Veggie Supreme Pizza", quantity: 2, size: "Medium" },
      { name: "Peppy Paneer Pizza", quantity: 1, size: "Large" },
      { name: "Choco Lava Cake", quantity: 2, size: "Regular" }
    ]
  },
  {
    _id: "ord-204",
    orderNumber: "ORD-1028",
    customerId: "cust-204",
    customerName: "Nisha Gupta",
    customerPhone: "+91 93456 78901",
    totalAmount: 350,
    orderStatus: "ready_for_pickup",
    deliveryStatus: "waiting",
    packagingCompletedAt: new Date(Date.now() - 12 * 60000).toISOString(), // 12 mins ago (Delayed)
    assignedRiderId: null,
    deliveryAddress: "Apt 205, Sector B, Scheme 54, Vijay Nagar, Indore",
    items: [
      { name: "Tandoori Paneer Pizza", quantity: 1, size: "Medium" }
    ]
  },
  {
    _id: "ord-205",
    orderNumber: "ORD-1029",
    customerId: "cust-205",
    customerName: "Rohan Verma",
    customerPhone: "+91 95555 44444",
    totalAmount: 890,
    orderStatus: "ready_for_pickup",
    deliveryStatus: "waiting",
    packagingCompletedAt: new Date(Date.now() - 1 * 60000).toISOString(), // 1 min ago
    assignedRiderId: null,
    deliveryAddress: "B-44, Anurag Nagar, Behind Press Complex, Indore",
    items: [
      { name: "Country Special Pizza", quantity: 1, size: "Medium" },
      { name: "Double Cheese Margherita Pizza", quantity: 1, size: "Large" }
    ]
  }
];

export const initialMockRiders = [
  {
    _id: "rider-1",
    name: "Rahul Singh",
    mobile: "+91 98260 11223",
    vehicleType: "Bike",
    currentStatus: "online", // online, offline
    activeOrders: 1,
    availability: "idle", // idle, busy
    distanceFromStore: 2.4, // in km
    rating: 4.8
  },
  {
    _id: "rider-2",
    name: "Amit Patel",
    mobile: "+91 94250 44556",
    vehicleType: "Scooter",
    currentStatus: "online",
    activeOrders: 0,
    availability: "idle",
    distanceFromStore: 1.5,
    rating: 4.5
  },
  {
    _id: "rider-3",
    name: "Suresh Pillai",
    mobile: "+91 98930 77889",
    vehicleType: "Bike",
    currentStatus: "online",
    activeOrders: 0,
    availability: "idle",
    distanceFromStore: 0.8,
    rating: 4.9
  },
  {
    _id: "rider-4",
    name: "Vikram Rao",
    mobile: "+91 91110 99887",
    vehicleType: "E-Bike",
    currentStatus: "online",
    activeOrders: 2,
    availability: "busy",
    distanceFromStore: 3.5,
    rating: 4.2
  },
  {
    _id: "rider-5",
    name: "Pooja Varma",
    mobile: "+91 97550 55443",
    vehicleType: "Scooter",
    currentStatus: "offline",
    activeOrders: 0,
    availability: "idle",
    distanceFromStore: 2.7,
    rating: 4.7
  }
];

export const initialMockStoreRiders = [
  {
    _id: "rider-1",
    name: "Rahul Singh",
    mobile: "+91 98260 11223",
    vehicleType: "Bike",
    vehicleNumber: "MP-09-AB-1234",
    joiningDate: "2024-03-12",
    rating: 4.8,
    availability: "online",
    currentStatus: "busy",
    currentOrderId: "PVP-10263",
    lastActive: new Date(Date.now() - 2 * 60000).toISOString(),
    totalDeliveries: 1560,
    averageDeliveryTime: 22,
    cancellationRate: 1.2,
    customerRatings: 4.8,
    todayDeliveries: 12,
    activeOrders: 1
  },
  {
    _id: "rider-2",
    name: "Amit Patel",
    mobile: "+91 94250 44556",
    vehicleType: "Scooter",
    vehicleNumber: "MP-09-CD-5678",
    joiningDate: "2024-05-20",
    rating: 4.5,
    availability: "online",
    currentStatus: "idle",
    currentOrderId: null,
    lastActive: new Date(Date.now() - 5 * 60000).toISOString(),
    totalDeliveries: 980,
    averageDeliveryTime: 26,
    cancellationRate: 2.1,
    customerRatings: 4.4,
    todayDeliveries: 8,
    activeOrders: 0
  },
  {
    _id: "rider-3",
    name: "Suresh Pillai",
    mobile: "+91 98930 77889",
    vehicleType: "Bike",
    vehicleNumber: "MP-09-EF-9012",
    joiningDate: "2024-01-15",
    rating: 4.9,
    availability: "online",
    currentStatus: "idle",
    currentOrderId: null,
    lastActive: new Date(Date.now() - 1 * 60000).toISOString(),
    totalDeliveries: 2450,
    averageDeliveryTime: 18,
    cancellationRate: 0.5,
    customerRatings: 4.9,
    todayDeliveries: 15,
    activeOrders: 0
  },
  {
    _id: "rider-4",
    name: "Vikram Rao",
    mobile: "+91 91110 99887",
    vehicleType: "Bike",
    vehicleNumber: "MP-09-GH-3456",
    joiningDate: "2024-07-02",
    rating: 4.2,
    availability: "online",
    currentStatus: "busy",
    currentOrderId: "PVP-10264",
    lastActive: new Date(Date.now() - 8 * 60000).toISOString(),
    totalDeliveries: 420,
    averageDeliveryTime: 32,
    cancellationRate: 3.5,
    customerRatings: 4.1,
    todayDeliveries: 6,
    activeOrders: 2
  },
  {
    _id: "rider-5",
    name: "Pooja Varma",
    mobile: "+91 97550 55443",
    vehicleType: "Scooter",
    vehicleNumber: "MP-09-IJ-7890",
    joiningDate: "2024-09-18",
    rating: 4.7,
    availability: "offline",
    currentStatus: "idle",
    currentOrderId: null,
    lastActive: new Date(Date.now() - 120 * 60000).toISOString(),
    totalDeliveries: 110,
    averageDeliveryTime: 24,
    cancellationRate: 1.8,
    customerRatings: 4.6,
    todayDeliveries: 0,
    activeOrders: 0
  }
];

export const initialMockLiveDeliveries = [
  {
    _id: "track-101",
    orderId: "ORD-1025",
    customerName: "Arjun Mehta",
    riderName: "Rahul Singh",
    pickupTime: new Date(Date.now() - 15 * 60000).toISOString(),
    eta: "12 mins",
    deliveryStatus: "out_for_delivery"
  },
  {
    _id: "track-102",
    orderId: "ORD-1026",
    customerName: "Sunita Sharma",
    riderName: "Amit Patel",
    pickupTime: new Date(Date.now() - 8 * 60000).toISOString(),
    eta: "8 mins",
    deliveryStatus: "picked_up"
  },
  {
    _id: "track-103",
    orderId: "ORD-1027",
    customerName: "Vikram Malhotra",
    riderName: "Vikram Rao",
    pickupTime: "",
    eta: "22 mins",
    deliveryStatus: "assigned"
  },
  {
    _id: "track-104",
    orderId: "ORD-1028",
    customerName: "Nisha Gupta",
    riderName: "Suresh Pillai",
    pickupTime: new Date(Date.now() - 35 * 60000).toISOString(),
    eta: "Delivered",
    deliveryStatus: "delivered"
  },
  {
    _id: "track-105",
    orderId: "ORD-1029",
    customerName: "Rohan Verma",
    riderName: "Pooja Varma",
    pickupTime: new Date(Date.now() - 2 * 60000).toISOString(),
    eta: "15 mins",
    deliveryStatus: "out_for_delivery"
  }
];

export const initialMockTrackingData = {
  "ORD-1025": {
    customer: {
      name: "Arjun Mehta",
      phone: "+91 98765 12345",
      address: "Flat 402, Block C, Shalimar Township, Vijay Nagar, Indore",
      latitude: 22.7513,
      longitude: 75.8953
    },
    rider: {
      name: "Rahul Singh",
      mobile: "+91 98260 11223",
      vehicleNumber: "MP-09-AB-1234",
      latitude: 22.7445,
      longitude: 75.8965,
      speed: 35
    },
    order: {
      orderId: "ORD-1025",
      amount: 650,
      items: [
        { name: "Double Cheese Margherita Pizza", quantity: 2, size: "Medium" },
        { name: "Garlic Breadsticks", quantity: 1, size: "Regular" }
      ],
      pickupTime: new Date(Date.now() - 15 * 60000).toISOString()
    },
    store: {
      latitude: 22.7432,
      longitude: 75.8970
    },
    timeline: {
      assignedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      acceptedAt: new Date(Date.now() - 22 * 60000).toISOString(),
      pickupAt: new Date(Date.now() - 15 * 60000).toISOString(),
      outForDeliveryAt: new Date(Date.now() - 12 * 60000).toISOString(),
      deliveredAt: ""
    }
  },
  "ORD-1026": {
    customer: {
      name: "Sunita Sharma",
      phone: "+91 91234 56789",
      address: "House No. 12, Saket Colony, Old Palasia, Indore",
      latitude: 22.7315,
      longitude: 75.8820
    },
    rider: {
      name: "Amit Patel",
      mobile: "+91 94250 44556",
      vehicleNumber: "MP-09-CD-5678",
      latitude: 22.7390,
      longitude: 75.8910,
      speed: 28
    },
    order: {
      orderId: "ORD-1026",
      amount: 450,
      items: [
        { name: "Farmhouse Pizza", quantity: 1, size: "Large" }
      ],
      pickupTime: new Date(Date.now() - 8 * 60000).toISOString()
    },
    store: {
      latitude: 22.7432,
      longitude: 75.8970
    },
    timeline: {
      assignedAt: new Date(Date.now() - 18 * 60000).toISOString(),
      acceptedAt: new Date(Date.now() - 16 * 60000).toISOString(),
      pickupAt: new Date(Date.now() - 8 * 60000).toISOString(),
      outForDeliveryAt: "",
      deliveredAt: ""
    }
  },
  "ORD-1027": {
    customer: {
      name: "Vikram Malhotra",
      phone: "+91 99887 76655",
      address: "Flat 101, Palasia Heights, Near Palasia Square, Indore",
      latitude: 22.7280,
      longitude: 75.8910
    },
    rider: {
      name: "Vikram Rao",
      mobile: "+91 91110 99887",
      vehicleNumber: "MP-09-GH-3456",
      latitude: 22.7432,
      longitude: 75.8970,
      speed: 0
    },
    order: {
      orderId: "ORD-1027",
      amount: 1250,
      items: [
        { name: "Veggie Supreme Pizza", quantity: 2, size: "Medium" },
        { name: "Peppy Paneer Pizza", quantity: 1, size: "Large" }
      ],
      pickupTime: ""
    },
    store: {
      latitude: 22.7432,
      longitude: 75.8970
    },
    timeline: {
      assignedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      acceptedAt: "",
      pickupAt: "",
      outForDeliveryAt: "",
      deliveredAt: ""
    }
  },
  "ORD-1028": {
    customer: {
      name: "Nisha Gupta",
      phone: "+91 93456 78901",
      address: "Apt 205, Sector B, Scheme 54, Vijay Nagar, Indore",
      latitude: 22.7560,
      longitude: 75.8940
    },
    rider: {
      name: "Suresh Pillai",
      mobile: "+91 98930 77889",
      vehicleNumber: "MP-09-EF-9012",
      latitude: 22.7560,
      longitude: 75.8940,
      speed: 0
    },
    order: {
      orderId: "ORD-1028",
      amount: 350,
      items: [
        { name: "Tandoori Paneer Pizza", quantity: 1, size: "Medium" }
      ],
      pickupTime: new Date(Date.now() - 35 * 60000).toISOString()
    },
    store: {
      latitude: 22.7432,
      longitude: 75.8970
    },
    timeline: {
      assignedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      acceptedAt: new Date(Date.now() - 42 * 60000).toISOString(),
      pickupAt: new Date(Date.now() - 35 * 60000).toISOString(),
      outForDeliveryAt: new Date(Date.now() - 30 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 10 * 60000).toISOString()
    }
  },
  "ORD-1029": {
    customer: {
      name: "Rohan Verma",
      phone: "+91 95555 44444",
      address: "B-44, Anurag Nagar, Behind Press Complex, Indore",
      latitude: 22.7380,
      longitude: 75.8850
    },
    rider: {
      name: "Pooja Varma",
      mobile: "+91 97550 55443",
      vehicleNumber: "MP-09-IJ-7890",
      latitude: 22.7410,
      longitude: 75.8910,
      speed: 38
    },
    order: {
      orderId: "ORD-1029",
      amount: 890,
      items: [
        { name: "Country Special Pizza", quantity: 1, size: "Medium" },
        { name: "Double Cheese Margherita Pizza", quantity: 1, size: "Large" }
      ],
      pickupTime: new Date(Date.now() - 10 * 60000).toISOString()
    },
    store: {
      latitude: 22.7432,
      longitude: 75.8970
    },
    timeline: {
      assignedAt: new Date(Date.now() - 20 * 60000).toISOString(),
      acceptedAt: new Date(Date.now() - 18 * 60000).toISOString(),
      pickupAt: new Date(Date.now() - 10 * 60000).toISOString(),
      outForDeliveryAt: new Date(Date.now() - 7 * 60000).toISOString(),
      deliveredAt: ""
    }
  }
};

export const initialMockDeliveryIssues = [
  {
    _id: "TKT-301",
    orderId: "ORD-1025",
    riderId: "rider-1",
    riderName: "Rahul Singh",
    issueType: "Rider Not Responding",
    description: "Rider is not answering calls for the last 15 minutes. Pizza is out for delivery.",
    reportedBy: "Store Manager",
    severity: "critical",
    status: "open",
    resolution: "",
    refundAmount: 0,
    penaltyAmount: 0,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString()
  },
  {
    _id: "TKT-302",
    orderId: "ORD-1026",
    riderId: "rider-2",
    riderName: "Amit Patel",
    issueType: "Late Delivery",
    description: "Order is delayed by 15 mins beyond estimated window. Customer is complaining.",
    reportedBy: "Customer",
    severity: "medium",
    status: "in_progress",
    resolution: "",
    refundAmount: 0,
    penaltyAmount: 0,
    createdAt: new Date(Date.now() - 40 * 60000).toISOString()
  },
  {
    _id: "TKT-303",
    orderId: "ORD-1027",
    riderId: "rider-4",
    riderName: "Vikram Rao",
    issueType: "Wrong Address",
    description: "Rider reached Palasia instead of Vijay Nagar. Confused about block C Shalimar Township.",
    reportedBy: "Rider",
    severity: "low",
    status: "resolved",
    resolution: "Rider redirected to Shalimar Township Block C. Reached successfully.",
    refundAmount: 100,
    penaltyAmount: 0,
    createdAt: new Date(Date.now() - 120 * 60000).toISOString()
  },
  {
    _id: "TKT-304",
    orderId: "ORD-1029",
    riderId: "rider-5",
    riderName: "Pooja Varma",
    issueType: "Vehicle Breakdown",
    description: "Rider reported a tyre puncture near Press Complex. Pizza is cooling down.",
    reportedBy: "Rider",
    severity: "critical",
    status: "escalated",
    resolution: "",
    refundAmount: 0,
    penaltyAmount: 0,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString()
  }
];

export const initialMockNotifications = [
  {
    _id: "notif-1",
    userId: "manager-1",
    title: "Critical Delivery Exception",
    message: "Rider Pooja Varma reported Vehicle Breakdown for ORD-1029",
    type: "critical",
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString()
  },
  {
    _id: "notif-2",
    userId: "manager-1",
    title: "Late Delivery Ticket Opened",
    message: "Customer Sunita Sharma opened Late Delivery ticket for ORD-1026",
    type: "warning",
    isRead: false,
    createdAt: new Date(Date.now() - 40 * 60000).toISOString()
  }
];

export const initialMockDeliveryTimelines = {
  "ORD-1025": [
    { status: "ready_for_pickup", updatedBy: "Store Staff", timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    { status: "rider_assigned", updatedBy: "Store Manager", timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    { status: "accepted", updatedBy: "Rider Rahul", timestamp: new Date(Date.now() - 22 * 60000).toISOString() },
    { status: "picked_up", updatedBy: "Rider Rahul", timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
    { status: "out_for_delivery", updatedBy: "Rider Rahul", timestamp: new Date(Date.now() - 12 * 60000).toISOString() }
  ],
  "ORD-1026": [
    { status: "ready_for_pickup", updatedBy: "Store Staff", timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    { status: "rider_assigned", updatedBy: "Store Manager", timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    { status: "accepted", updatedBy: "Rider Amit", timestamp: new Date(Date.now() - 16 * 60000).toISOString() },
    { status: "picked_up", updatedBy: "Rider Amit", timestamp: new Date(Date.now() - 8 * 60000).toISOString() }
  ],
  "ORD-1027": [
    { status: "ready_for_pickup", updatedBy: "Store Staff", timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
    { status: "rider_assigned", updatedBy: "Store Manager", timestamp: new Date(Date.now() - 5 * 60000).toISOString() }
  ],
  "ORD-1028": [
    { status: "ready_for_pickup", updatedBy: "Store Staff", timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
    { status: "rider_assigned", updatedBy: "Store Manager", timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
    { status: "accepted", updatedBy: "Rider Suresh", timestamp: new Date(Date.now() - 42 * 60000).toISOString() },
    { status: "picked_up", updatedBy: "Rider Suresh", timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
    { status: "out_for_delivery", updatedBy: "Rider Suresh", timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    { status: "delivered", updatedBy: "Rider Suresh", timestamp: new Date(Date.now() - 10 * 60000).toISOString() }
  ],
  "ORD-1029": [
    { status: "ready_for_pickup", updatedBy: "Store Staff", timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    { status: "rider_assigned", updatedBy: "Store Manager", timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
    { status: "accepted", updatedBy: "Rider Pooja", timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    { status: "picked_up", updatedBy: "Rider Pooja", timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
    { status: "out_for_delivery", updatedBy: "Rider Pooja", timestamp: new Date(Date.now() - 7 * 60000).toISOString() }
  ]
};


