// Mock Database collections representing MongoDB data for the Customer List Page

export const mockStores = [
  { id: "store-01", name: "Indore Central" },
  { id: "store-02", name: "Bhopal Zone" },
  { id: "store-03", name: "Ujjain Branch" },
  { id: "store-04", name: "Gwalior Hub" }
];

export const mockUsers = [
  {
    _id: "user-01",
    fullName: "Rajesh Kumar",
    email: "rajesh.kumar@gmail.com",
    mobile: "+91 98765 43210",
    profileImage: "", // will fall back to initials RK
    role: "CUSTOMER",
    status: "Active",
    isVerified: true,
    createdAt: "2024-05-10T10:00:00.000Z",
    lastLogin: "2026-06-22T08:30:00.000Z"
  },
  {
    _id: "user-02",
    fullName: "Priya Patel",
    email: "priya.patel@yahoo.com",
    mobile: "+91 87654 32109",
    profileImage: "", // initials PP
    role: "CUSTOMER",
    status: "Active",
    isVerified: true,
    createdAt: "2024-06-15T14:30:00.000Z",
    lastLogin: "2026-06-21T18:15:00.000Z"
  },
  {
    _id: "user-03",
    fullName: "Aarav Mehta",
    email: "aarav.mehta@outlook.com",
    mobile: "+91 76543 21098",
    profileImage: "", // initials AM
    role: "CUSTOMER",
    status: "Active",
    isVerified: false,
    createdAt: "2026-06-10T09:15:00.000Z",
    lastLogin: "2026-06-22T11:45:00.000Z"
  },
  {
    _id: "user-04",
    fullName: "Sneha Sharma",
    email: "sneha.sharma@gmail.com",
    mobile: "+91 95432 10987",
    profileImage: "", // initials SS
    role: "CUSTOMER",
    status: "Active",
    isVerified: true,
    createdAt: "2025-01-20T11:00:00.000Z",
    lastLogin: "2026-06-20T20:00:00.000Z"
  },
  {
    _id: "user-05",
    fullName: "Amit Verma",
    email: "amit.verma@gmail.com",
    mobile: "+91 94321 09876",
    profileImage: "", // initials AV
    role: "CUSTOMER",
    status: "Blocked",
    isVerified: true,
    createdAt: "2024-11-05T16:45:00.000Z",
    lastLogin: "2026-06-10T12:00:00.000Z"
  },
  {
    _id: "user-06",
    fullName: "Pooja Gupta",
    email: "pooja.gupta@rediffmail.com",
    mobile: "+91 93210 98765",
    profileImage: "", // initials PG
    role: "CUSTOMER",
    status: "Active",
    isVerified: true,
    createdAt: "2024-03-01T10:30:00.000Z",
    lastLogin: "2026-06-22T13:10:00.000Z"
  },
  {
    _id: "user-07",
    fullName: "Vikram Singh",
    email: "vikram.singh@gmail.com",
    mobile: "+91 92109 87654",
    profileImage: "", // initials VS
    role: "CUSTOMER",
    status: "Active",
    isVerified: true,
    createdAt: "2025-03-12T08:00:00.000Z",
    lastLogin: "2026-06-18T15:30:00.000Z"
  },
  {
    _id: "user-08",
    fullName: "Sunita Rao",
    email: "sunita.rao@gmail.com",
    mobile: "+91 91098 76543",
    profileImage: "", // initials SR
    role: "CUSTOMER",
    status: "Active",
    isVerified: false,
    createdAt: "2026-06-18T10:00:00.000Z",
    lastLogin: "2026-06-19T09:00:00.000Z"
  },
  {
    _id: "user-09",
    fullName: "Rohan Malhotra",
    email: "rohan.malhotra@gmail.com",
    mobile: "+91 99887 76655",
    profileImage: "", // initials RM
    role: "CUSTOMER",
    status: "Active",
    isVerified: true,
    createdAt: "2025-08-25T17:20:00.000Z",
    lastLogin: "2026-06-22T06:45:00.000Z"
  },
  {
    _id: "user-10",
    fullName: "Kabir Sen",
    email: "kabir.sen@gmail.com",
    mobile: "+91 88776 65544",
    profileImage: "", // initials KS
    role: "CUSTOMER",
    status: "Blocked",
    isVerified: true,
    createdAt: "2025-02-14T13:40:00.000Z",
    lastLogin: "2026-06-05T19:30:00.000Z"
  }
];

export const mockCustomers = [
  {
    _id: "cust-01",
    userId: "user-01",
    franchiseId: "franchise-01",
    totalOrders: 42,
    totalSpent: 18500,
    avgOrderValue: 440.48,
    lastOrderDate: "2026-06-22T08:15:00.000Z",
    loyaltyPoints: 1250,
    customerType: "VIP",
    favoriteStoreId: "store-01",
    tags: ["Regular", "High Spender", "Cheese Lover"],
    blockedReason: "",
    notes: [
      { id: "note-101", note: "Customer prefers extra oregano packets.", createdBy: "Admin Shubham", createdAt: "2026-05-12T11:00:00.000Z" },
      { id: "note-102", note: "Always orders Cheese Burst crust.", createdBy: "Manager Rohit", createdAt: "2026-06-01T15:30:00.000Z" }
    ],
    updatedAt: "2026-06-22T08:30:00.000Z"
  },
  {
    _id: "cust-02",
    userId: "user-02",
    franchiseId: "franchise-01",
    totalOrders: 28,
    totalSpent: 11200,
    avgOrderValue: 400.00,
    lastOrderDate: "2026-06-21T17:45:00.000Z",
    loyaltyPoints: 780,
    customerType: "VIP",
    favoriteStoreId: "store-02",
    tags: ["Veg Delight", "Dessert Fan"],
    blockedReason: "",
    notes: [
      { id: "note-201", note: "Polite customer. Likes Choco Lava Cake.", createdBy: "Admin Shubham", createdAt: "2026-04-18T10:15:00.000Z" }
    ],
    updatedAt: "2026-06-21T18:15:00.000Z"
  },
  {
    _id: "cust-03",
    userId: "user-03",
    franchiseId: "franchise-01",
    totalOrders: 2,
    totalSpent: 980,
    avgOrderValue: 490.00,
    lastOrderDate: "2026-06-22T11:30:00.000Z",
    loyaltyPoints: 45,
    customerType: "New",
    favoriteStoreId: "store-01",
    tags: ["First Month"],
    blockedReason: "",
    notes: [],
    updatedAt: "2026-06-22T11:45:00.000Z"
  },
  {
    _id: "cust-04",
    userId: "user-04",
    franchiseId: "franchise-01",
    totalOrders: 15,
    totalSpent: 5250,
    avgOrderValue: 350.00,
    lastOrderDate: "2026-06-20T19:30:00.000Z",
    loyaltyPoints: 320,
    customerType: "Regular",
    favoriteStoreId: "store-03",
    tags: ["Spicy Pizza Fans"],
    blockedReason: "",
    notes: [],
    updatedAt: "2026-06-20T20:00:00.000Z"
  },
  {
    _id: "cust-05",
    userId: "user-05",
    franchiseId: "franchise-01",
    totalOrders: 9,
    totalSpent: 3600,
    avgOrderValue: 400.00,
    lastOrderDate: "2026-06-10T11:30:00.000Z",
    loyaltyPoints: 210,
    customerType: "Regular",
    favoriteStoreId: "store-02",
    tags: ["Late Delivery Complaints"],
    blockedReason: "Fake Orders",
    notes: [
      { id: "note-501", note: "Blocked due to repeated fake COD orders.", createdBy: "Admin Shubham", createdAt: "2026-06-10T12:00:00.000Z" }
    ],
    updatedAt: "2026-06-10T12:00:00.000Z"
  },
  {
    _id: "cust-06",
    userId: "user-06",
    franchiseId: "franchise-01",
    totalOrders: 35,
    totalSpent: 16200,
    avgOrderValue: 462.85,
    lastOrderDate: "2026-06-22T12:45:00.000Z",
    loyaltyPoints: 1100,
    customerType: "VIP",
    favoriteStoreId: "store-04",
    tags: ["High Spender", "Paneer Lover"],
    blockedReason: "",
    notes: [],
    updatedAt: "2026-06-22T13:10:00.000Z"
  },
  {
    _id: "cust-07",
    userId: "user-07",
    franchiseId: "franchise-01",
    totalOrders: 11,
    totalSpent: 4180,
    avgOrderValue: 380.00,
    lastOrderDate: "2026-06-18T14:45:00.000Z",
    loyaltyPoints: 250,
    customerType: "Regular",
    favoriteStoreId: "store-01",
    tags: ["On-time Deliveries Only"],
    blockedReason: "",
    notes: [],
    updatedAt: "2026-06-18T15:30:00.000Z"
  },
  {
    _id: "cust-08",
    userId: "user-08",
    franchiseId: "franchise-01",
    totalOrders: 1,
    totalSpent: 450,
    avgOrderValue: 450.00,
    lastOrderDate: "2026-06-18T09:30:00.000Z",
    loyaltyPoints: 20,
    customerType: "New",
    favoriteStoreId: "store-02",
    tags: ["Promo Code User"],
    blockedReason: "",
    notes: [],
    updatedAt: "2026-06-19T09:00:00.000Z"
  },
  {
    _id: "cust-09",
    userId: "user-09",
    franchiseId: "franchise-01",
    totalOrders: 18,
    totalSpent: 7920,
    avgOrderValue: 440.00,
    lastOrderDate: "2026-06-22T06:15:00.000Z",
    loyaltyPoints: 510,
    customerType: "Regular",
    favoriteStoreId: "store-04",
    tags: ["Beverage Fan"],
    blockedReason: "",
    notes: [],
    updatedAt: "2026-06-22T06:45:00.000Z"
  },
  {
    _id: "cust-10",
    userId: "user-10",
    franchiseId: "franchise-01",
    totalOrders: 6,
    totalSpent: 2100,
    avgOrderValue: 350.00,
    lastOrderDate: "2026-06-05T18:45:00.000Z",
    loyaltyPoints: 120,
    customerType: "Regular",
    favoriteStoreId: "store-01",
    tags: [],
    blockedReason: "Payment Fraud",
    notes: [
      { id: "note-1001", note: "Customer disputed transaction and charged back.", createdBy: "Manager Rohit", createdAt: "2026-06-05T19:15:00.000Z" }
    ],
    updatedAt: "2026-06-05T19:30:00.000Z"
  }
];

export const mockOrders = [
  {
    _id: "ord-1001",
    orderNumber: "PV-98421",
    customerId: "cust-01",
    storeName: "Indore Central",
    amount: 450,
    paymentMethod: "Razorpay Online",
    orderStatus: "delivered",
    deliveryType: "delivery",
    date: "2026-06-22T08:15:00.000Z",
    items: [
      { name: "Paneer Tikka Pizza (Medium)", quantity: 1, price: 350 },
      { name: "Choco Lava Cake", quantity: 1, price: 100 }
    ],
    taxes: 22.50,
    discount: 50.00,
    coupon: "FIRSTPV",
    deliveryAddress: {
      recipientName: "Rajesh Kumar",
      phone: "+91 98765 43210",
      houseNo: "Flat 402, Block B",
      street: "Shanti Enclave, Vijay Nagar",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452010",
      landmark: "Near Apollo Hospital"
    },
    paymentDetails: {
      transactionId: "pay_xyz78910",
      status: "Captured",
      date: "2026-06-22T08:16:00.000Z"
    },
    timeline: [
      { status: "Ordered Placed", time: "2026-06-22T08:15:00.000Z", desc: "Order placed by customer" },
      { status: "Accepted", time: "2026-06-22T08:18:00.000Z", desc: "Accepted by Store Manager Rohit" },
      { status: "Preparing", time: "2026-06-22T08:20:00.000Z", desc: "Pizza in the oven" },
      { status: "Out for Delivery", time: "2026-06-22T08:35:00.000Z", desc: "Assigned to rider Rahul Dev" },
      { status: "Delivered", time: "2026-06-22T08:50:00.000Z", desc: "Delivered at doorstep successfully" }
    ]
  },
  {
    _id: "ord-1002",
    orderNumber: "PV-98422",
    customerId: "cust-01",
    storeName: "Indore Central",
    amount: 580,
    paymentMethod: "COD (Cash on Delivery)",
    orderStatus: "delivered",
    deliveryType: "delivery",
    date: "2026-06-20T19:40:00.000Z",
    items: [
      { name: "Cheese Burst Veg Supreme (Medium)", quantity: 1, price: 480 },
      { name: "Pepsi 750ml", quantity: 2, price: 50 }
    ],
    taxes: 29.00,
    discount: 0.00,
    coupon: "",
    deliveryAddress: {
      recipientName: "Rajesh Kumar",
      phone: "+91 98765 43210",
      houseNo: "Flat 402, Block B",
      street: "Shanti Enclave, Vijay Nagar",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452010",
      landmark: "Near Apollo Hospital"
    },
    paymentDetails: {
      transactionId: "N/A",
      status: "Paid in Cash",
      date: "2026-06-20T20:10:00.000Z"
    },
    timeline: [
      { status: "Ordered Placed", time: "2026-06-20T19:40:00.000Z", desc: "Order placed by customer" },
      { status: "Delivered", time: "2026-06-20T20:10:00.000Z", desc: "Delivered by Vikram Rathore" }
    ]
  },
  {
    _id: "ord-1003",
    orderNumber: "PV-98425",
    customerId: "cust-02",
    storeName: "Bhopal Zone",
    amount: 590,
    paymentMethod: "UPI (PhonePe)",
    orderStatus: "delivered",
    deliveryType: "delivery",
    date: "2026-06-21T17:45:00.000Z",
    items: [
      { name: "Double Cheese Margherita (Large)", quantity: 1, price: 420 },
      { name: "Garlic Breadsticks", quantity: 1, price: 120 },
      { name: "Cheesy Dip", quantity: 2, price: 25 }
    ],
    taxes: 29.50,
    discount: 30.00,
    coupon: "UPI50",
    deliveryAddress: {
      recipientName: "Priya Patel",
      phone: "+91 87654 32109",
      houseNo: "Plot No. 125",
      street: "Sector A, Arera Colony",
      city: "Bhopal",
      state: "Madhya Pradesh",
      pincode: "462016",
      landmark: "Opposite Hanuman Temple"
    },
    paymentDetails: {
      transactionId: "upi_phpe8892718",
      status: "Captured",
      date: "2026-06-21T17:46:00.000Z"
    },
    timeline: [
      { status: "Ordered Placed", time: "2026-06-21T17:45:00.000Z", desc: "Order placed by customer" },
      { status: "Delivered", time: "2026-06-21T18:15:00.000Z", desc: "Delivered by Rider Amit" }
    ]
  },
  {
    _id: "ord-1004",
    orderNumber: "PV-98430",
    customerId: "cust-03",
    storeName: "Indore Central",
    amount: 490,
    paymentMethod: "UPI (GPay)",
    orderStatus: "delivered",
    deliveryType: "takeaway",
    date: "2026-06-22T11:30:00.000Z",
    items: [
      { name: "Farmhouse Pizza (Medium)", quantity: 1, price: 390 },
      { name: "Choco Lava Cake", quantity: 1, price: 100 }
    ],
    taxes: 24.50,
    discount: 0.00,
    coupon: "",
    deliveryAddress: {
      recipientName: "Aarav Mehta",
      phone: "+91 76543 21098",
      houseNo: "12, Scheme 54",
      street: "Vijay Nagar",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452010",
      landmark: "Behind C21 Mall"
    },
    paymentDetails: {
      transactionId: "upi_gpay_00281",
      status: "Captured",
      date: "2026-06-22T11:31:00.000Z"
    },
    timeline: [
      { status: "Ordered Placed", time: "2026-06-22T11:30:00.000Z", desc: "Takeaway order placed" },
      { status: "Prepared & Handed Over", time: "2026-06-22T11:45:00.000Z", desc: "Handed over to customer" }
    ]
  }
];

export const mockCustomerAddresses = [
  {
    _id: "addr-01",
    customerId: "cust-01",
    addressType: "Home",
    recipientName: "Rajesh Kumar",
    phone: "+91 98765 43210",
    houseNumber: "Flat 402, Block B",
    street: "Shanti Enclave, Vijay Nagar",
    city: "Indore",
    state: "Madhya Pradesh",
    pincode: "452010",
    landmark: "Near Apollo Hospital",
    latitude: "22.7523",
    longitude: "75.8941",
    isDefault: true
  },
  {
    _id: "addr-02",
    customerId: "cust-01",
    addressType: "Office",
    recipientName: "Rajesh Kumar",
    phone: "+91 98765 43210",
    houseNumber: "Unit 305, 3rd Floor",
    street: "Crystal IT Park, Ring Road",
    city: "Indore",
    state: "Madhya Pradesh",
    pincode: "452001",
    landmark: "Near Teen Imli Chauraha",
    latitude: "22.7051",
    longitude: "75.8756",
    isDefault: false
  },
  {
    _id: "addr-03",
    customerId: "cust-02",
    addressType: "Home",
    recipientName: "Priya Patel",
    phone: "+91 87654 32109",
    houseNumber: "Plot No. 125",
    street: "Sector A, Arera Colony",
    city: "Bhopal",
    state: "Madhya Pradesh",
    pincode: "462016",
    landmark: "Opposite Hanuman Temple",
    latitude: "23.2144",
    longitude: "77.4328",
    isDefault: true
  }
];

export const mockReviews = [
  {
    _id: "rev-01",
    customerId: "cust-01",
    rating: 5,
    productName: "Paneer Tikka Pizza",
    storeName: "Indore Central",
    reviewText: "The paneer was incredibly soft and fresh. Perfectly baked cheese burst crust. My absolute favorite!",
    date: "2026-06-22T09:00:00.000Z",
    status: "Published"
  },
  {
    _id: "rev-02",
    customerId: "cust-01",
    rating: 4,
    productName: "Veg Supreme Pizza",
    storeName: "Indore Central",
    reviewText: "Tastes great, loaded with olives and jalapenos. Delivered warm on time.",
    date: "2026-06-15T20:30:00.000Z",
    status: "Published"
  },
  {
    _id: "rev-03",
    customerId: "cust-02",
    rating: 3,
    productName: "Garlic Breadsticks",
    storeName: "Bhopal Zone",
    reviewText: "The breadsticks were a bit dry this time. The seasoning was good but need more butter spread.",
    date: "2026-06-20T18:00:00.000Z",
    status: "Published"
  }
];

export const mockLoyaltyTransactions = [
  {
    _id: "loy-01",
    customerId: "cust-01",
    date: "2026-06-22T08:15:00.000Z",
    pointsEarned: 45,
    pointsRedeemed: 0,
    balance: 1250,
    source: "Order PV-98421 Reward Points",
    remarks: "Automated credit from order spend"
  },
  {
    _id: "loy-02",
    customerId: "cust-01",
    date: "2026-06-20T19:40:00.000Z",
    pointsEarned: 58,
    pointsRedeemed: 0,
    balance: 1205,
    source: "Order PV-98422 Reward Points",
    remarks: "Automated credit from order spend"
  },
  {
    _id: "loy-03",
    customerId: "cust-01",
    date: "2026-06-10T14:00:00.000Z",
    pointsEarned: 100,
    pointsRedeemed: 0,
    balance: 1147,
    source: "Adjust Points (Admin)",
    remarks: "Compensated for late delivery complaint resolver"
  },
  {
    _id: "loy-04",
    customerId: "cust-01",
    date: "2026-05-01T12:00:00.000Z",
    pointsEarned: 0,
    pointsRedeemed: 200,
    balance: 1047,
    source: "Free Choco Lava Cake Redemption",
    remarks: "Redeemed via mobile app coupon"
  }
];

export const mockComplaints = [
  {
    _id: "comp-01",
    complaintNumber: "TKT-04821",
    customerId: "cust-01",
    category: "Delivery Delay",
    priority: "Medium",
    assignedTo: "Rohan Dev (Rider)",
    status: "Resolved",
    createdDate: "2026-06-10T12:15:00.000Z",
    message: "Rider took 55 minutes to deliver. The pizza was completely cold when arrived.",
    images: [],
    resolutionNotes: "Apologized to customer. Refunded delivery fee and credited 100 loyalty points.",
    timeline: [
      { title: "Complaint Registered", time: "2026-06-10T12:15:00.000Z", desc: "Filed via Web App" },
      { title: "Assigned Staff", time: "2026-06-10T12:30:00.000Z", desc: "Assigned to Support Agent Amit" },
      { title: "Resolved", time: "2026-06-10T14:00:00.000Z", desc: "Resolved with customer compensation" }
    ]
  },
  {
    _id: "comp-02",
    complaintNumber: "TKT-04902",
    customerId: "cust-01",
    category: "Wrong Item Delivered",
    priority: "High",
    assignedTo: "Indore Central Kitchen",
    status: "Open",
    createdDate: "2026-06-22T09:30:00.000Z",
    message: "Ordered Double Cheese Margherita but got normal Margherita. I paid extra for double cheese.",
    images: [],
    resolutionNotes: "",
    timeline: [
      { title: "Complaint Registered", time: "2026-06-22T09:30:00.000Z", desc: "Filed via Mobile App" }
    ]
  }
];

export const mockCustomerBlocks = [
  {
    _id: "block-01",
    customerId: "cust-05",
    reason: "Fake Orders",
    blockedBy: "Admin Shubham",
    blockUntil: "2026-07-10T12:00:00.000Z",
    permanent: false,
    remarks: "Customer repeatedly ordered cash on delivery and refused acceptance at door."
  },
  {
    _id: "block-02",
    customerId: "cust-10",
    reason: "Payment Fraud",
    blockedBy: "Admin Shubham",
    blockUntil: "",
    permanent: true,
    remarks: "Disputed transaction ID pay_hshs9928 and initiated chargeback without returning pizza."
  }
];

export const mockActivityLogs = [
  {
    _id: "act-01",
    customerId: "cust-01",
    activityType: "Customer Registered",
    description: "Account created and verified mobile +91 98765 43210",
    createdBy: "System",
    createdAt: "2024-05-10T10:00:00.000Z"
  },
  {
    _id: "act-02",
    customerId: "cust-01",
    activityType: "Order Placed",
    description: "Placed Order PV-98421 online of amount ₹450",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-06-22T08:15:00.000Z"
  },
  {
    _id: "act-03",
    customerId: "cust-01",
    activityType: "Review Added",
    description: "Added 5-star review for Paneer Tikka Pizza",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-06-22T09:00:00.000Z"
  },
  {
    _id: "act-04",
    customerId: "cust-05",
    activityType: "Blocked",
    description: "Blocked by Admin Shubham for 'Fake Orders'",
    createdBy: "Admin Shubham",
    createdAt: "2026-06-10T12:00:00.000Z"
  }
];

export const mockEmployees = [
  { id: "emp-01", fullName: "Rohit Sharma", email: "rohit@papavegpizza.com", role: "Support Agent" },
  { id: "emp-02", fullName: "Karan Dev", email: "karan@papavegpizza.com", role: "Kitchen Manager" },
  { id: "emp-03", fullName: "Vikram Singh", email: "vikram@papavegpizza.com", role: "Delivery Supervisor" },
  { id: "emp-04", fullName: "Amit Mishra", email: "amit@papavegpizza.com", role: "Support Specialist" }
];

export const mockComplaintNotes = [
  { _id: "note-c01", complaintId: "comp-01", note: "Customer verified delay via phone call tracker.", createdBy: "Admin Shubham", createdAt: "2026-06-10T12:45:00.000Z" },
  { _id: "note-c02", complaintId: "comp-02", note: "Kitchen staff advised to cross-check paneer toppings before dispatch.", createdBy: "Admin Shubham", createdAt: "2026-06-22T09:45:00.000Z" },
  { _id: "note-c03", complaintId: "comp-03", note: "User claims money debited but order didn't generate.", createdBy: "Admin Shubham", createdAt: "2026-06-21T10:15:00.000Z" }
];

export const mockComplaintLogs = [
  { _id: "log-01", complaintId: "comp-01", action: "Complaint Created", oldValue: "", newValue: "Open", performedBy: "System", timestamp: "2026-06-10T12:15:00.000Z" },
  { _id: "log-02", complaintId: "comp-01", action: "Assigned To Staff", oldValue: "", newValue: "Rohan Dev (Rider)", performedBy: "Admin Shubham", timestamp: "2026-06-10T12:30:00.000Z" },
  { _id: "log-03", complaintId: "comp-01", action: "Resolved", oldValue: "In Progress", newValue: "Resolved", performedBy: "Amit Mishra", timestamp: "2026-06-10T14:00:00.000Z" },
  { _id: "log-04", complaintId: "comp-02", action: "Complaint Created", oldValue: "", newValue: "Open", performedBy: "System", timestamp: "2026-06-22T09:30:00.000Z" },
  { _id: "log-05", complaintId: "comp-03", action: "Complaint Created", oldValue: "", newValue: "Open", performedBy: "System", timestamp: "2026-06-21T10:00:00.000Z" },
  { _id: "log-06", complaintId: "comp-03", action: "Escalated", oldValue: "Open", newValue: "Escalated", performedBy: "Admin Shubham", timestamp: "2026-06-21T11:00:00.000Z" }
];

// Expanded complaints collection
export const mockCustomerComplaintsExpanded = [
  {
    _id: "comp-01",
    ticketNumber: "TKT-04821",
    customerId: "cust-01",
    orderId: "ord-1001",
    storeId: "store-01",
    category: "Delivery",
    priority: "Medium",
    description: "Rider took 55 minutes to deliver. The pizza was completely cold when arrived.",
    attachments: [],
    status: "Resolved",
    assignedTo: "Amit Mishra",
    resolution: "Apologized to customer. Refunded delivery fee and credited 100 loyalty points.",
    createdAt: "2026-06-10T12:15:00.000Z",
    resolvedAt: "2026-06-10T14:00:00.000Z",
    handlingTimeHours: 1.75
  },
  {
    _id: "comp-02",
    ticketNumber: "TKT-04902",
    customerId: "cust-01",
    orderId: "ord-1001",
    storeId: "store-01",
    category: "Food Quality",
    priority: "High",
    description: "Ordered Double Cheese Margherita but got normal Margherita. I paid extra for double cheese.",
    attachments: [],
    status: "Open",
    assignedTo: "",
    resolution: "",
    createdAt: "2026-06-22T09:30:00.000Z",
    resolvedAt: "",
    handlingTimeHours: null
  },
  {
    _id: "comp-03",
    ticketNumber: "TKT-04903",
    customerId: "cust-02",
    orderId: "ord-1003",
    storeId: "store-02",
    category: "Payment",
    priority: "Critical",
    description: "UPI transaction of ₹590 got debited from my bank but app showed payment failed.",
    attachments: [],
    status: "Escalated",
    assignedTo: "Amit Mishra",
    resolution: "",
    createdAt: "2026-06-21T10:00:00.000Z",
    resolvedAt: "",
    handlingTimeHours: null
  },
  {
    _id: "comp-04",
    ticketNumber: "TKT-04904",
    customerId: "cust-04",
    orderId: "ord-1002",
    storeId: "store-03",
    category: "Missing Item",
    priority: "Low",
    description: "They forgot to send the Pepsi 750ml bottles. I only got the pizza.",
    attachments: [],
    status: "In Progress",
    assignedTo: "Rohit Sharma",
    resolution: "",
    createdAt: "2026-06-22T08:00:00.000Z",
    resolvedAt: "",
    handlingTimeHours: null
  },
  {
    _id: "comp-05",
    ticketNumber: "TKT-04905",
    customerId: "cust-06",
    orderId: "ord-1004",
    storeId: "store-04",
    category: "App Issue",
    priority: "Low",
    description: "The GPS locator keeps failing on checkout screen, and I have to type address every time.",
    attachments: [],
    status: "Closed",
    assignedTo: "Amit Mishra",
    resolution: "Closed ticket since user confirmed app update fixed the GPS locator issue.",
    createdAt: "2026-06-19T14:00:00.000Z",
    resolvedAt: "2026-06-20T11:00:00.000Z",
    handlingTimeHours: 21
  }
];

export const mockReviewsExpanded = [
  {
    _id: "rev-101",
    customerId: "cust-01",
    orderId: "PV-98421",
    storeId: "store-01",
    rating: 5,
    reviewText: "Amazing Paneer Tikka pizza! Delivered hot, cheesy, and absolutely delicious. My go-to order!",
    images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop"],
    tags: ["Tasty", "Fast Delivery", "Recommended"],
    status: "Published",
    adminReply: {
      message: "Thank you Rajesh! We are delighted to hear you loved our Paneer Tikka pizza. Looking forward to serving you again!",
      date: "2026-06-22T10:00:00.000Z",
      createdBy: "Admin Shubham"
    },
    createdAt: "2026-06-22T09:00:00.000Z"
  },
  {
    _id: "rev-102",
    customerId: "cust-02",
    orderId: "PV-98425",
    storeId: "store-02",
    rating: 4,
    reviewText: "Double Cheese Margherita was great, but the delivery took around 45 mins. The cheesy dip was super yummy though.",
    images: [],
    tags: ["Good Food", "Slow Delivery"],
    status: "Published",
    adminReply: null,
    createdAt: "2026-06-21T18:00:00.000Z"
  },
  {
    _id: "rev-103",
    customerId: "cust-03",
    orderId: "PV-98430",
    storeId: "store-01",
    rating: 1,
    reviewText: "Extremely disappointed this time. The cheese burst pizza was completely burnt and cold. The crust felt like cardboard.",
    images: ["https://images.unsplash.com/photo-1571066811602-716837d681de?w=500&auto=format&fit=crop"],
    tags: ["Burnt Pizza", "Cold Delivery", "Bad Quality"],
    status: "Published",
    adminReply: null,
    createdAt: "2026-06-22T12:00:00.000Z"
  },
  {
    _id: "rev-104",
    customerId: "cust-04",
    orderId: "PV-98422",
    storeId: "store-03",
    rating: 2,
    reviewText: "They forgot to send my Pepsi 750ml bottles. Tried calling the store but no response. Pizza was mediocre.",
    images: [],
    tags: ["Missing Items", "No Response"],
    status: "Published",
    adminReply: {
      message: "Hello Sneha, we sincerely apologize for this error. We have initiated a refund for the missing beverage and credited 50 loyalty points to your profile.",
      date: "2026-06-22T09:30:00.000Z",
      createdBy: "Admin Shubham"
    },
    createdAt: "2026-06-22T08:15:00.000Z"
  },
  {
    _id: "rev-105",
    customerId: "cust-05",
    orderId: "PV-98421",
    storeId: "store-02",
    rating: 5,
    reviewText: "Exquisite taste! The cheese was stretchy and the crust was soft. The Choco Lava Cake was a sweet dream.",
    images: ["https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop"],
    tags: ["Tasty", "Great Dessert"],
    status: "Hidden",
    adminReply: null,
    createdAt: "2026-06-10T13:00:00.000Z"
  },
  {
    _id: "rev-106",
    customerId: "cust-06",
    orderId: "PV-98425",
    storeId: "store-04",
    rating: 5,
    reviewText: "Best Veg Supreme Pizza ever! Toppings were fresh and loaded. Will definitely order again soon.",
    images: [],
    tags: ["Loaded Toppings", "Super fresh"],
    status: "Published",
    adminReply: {
      message: "Thank you Pooja! Glad you enjoyed the fresh toppings. We hope to serve you again soon!",
      date: "2026-06-22T14:00:00.000Z",
      createdBy: "Admin Shubham"
    },
    createdAt: "2026-06-22T13:00:00.000Z"
  },
  {
    _id: "rev-107",
    customerId: "cust-07",
    orderId: "PV-98422",
    storeId: "store-01",
    rating: 3,
    reviewText: "Average pizza. Normal base was dry. Paneer topping was scarce. Garlic bread was good though.",
    images: [],
    tags: ["Dry Base", "Few Toppings"],
    status: "Published",
    adminReply: null,
    createdAt: "2026-06-18T16:00:00.000Z"
  }
];

export const mockReviewLogs = [
  { _id: "rlog-01", reviewId: "rev-101", action: "Review Created", oldValue: "", newValue: "Published", performedBy: "System", createdAt: "2026-06-22T09:00:00.000Z" },
  { _id: "rlog-02", reviewId: "rev-101", action: "Reply Added", oldValue: "", newValue: "Replied", performedBy: "Admin Shubham", createdAt: "2026-06-22T10:00:00.000Z" },
  { _id: "rlog-03", reviewId: "rev-102", action: "Review Created", oldValue: "", newValue: "Published", performedBy: "System", createdAt: "2026-06-21T18:00:00.000Z" },
  { _id: "rlog-04", reviewId: "rev-103", action: "Review Created", oldValue: "", newValue: "Published", performedBy: "System", createdAt: "2026-06-22T12:00:00.000Z" },
  { _id: "rlog-05", reviewId: "rev-104", action: "Review Created", oldValue: "", newValue: "Published", performedBy: "System", createdAt: "2026-06-22T08:15:00.000Z" },
  { _id: "rlog-06", reviewId: "rev-104", action: "Reply Added", oldValue: "", newValue: "Replied", performedBy: "Admin Shubham", createdAt: "2026-06-22T09:30:00.000Z" },
  { _id: "rlog-07", reviewId: "rev-105", action: "Review Created", oldValue: "", newValue: "Published", performedBy: "System", createdAt: "2026-06-10T13:00:00.000Z" },
  { _id: "rlog-08", reviewId: "rev-105", action: "Review Hidden", oldValue: "Published", newValue: "Hidden", performedBy: "Admin Shubham", createdAt: "2026-06-10T14:30:00.000Z" }
];

export const mockLoyaltyMembers = [
  {
    _id: "lm-01",
    customerId: "cust-01",
    membershipNumber: "PVP-LOY-82910",
    tier: "Platinum",
    totalPoints: 4850,
    availablePoints: 2450,
    redeemedPoints: 2400,
    totalSpent: 48500,
    joinedDate: "2024-05-15T10:00:00.000Z",
    expiryDate: "2027-05-15T10:00:00.000Z",
    status: "Active",
    lastActivityDate: "2026-06-22T08:30:00.000Z"
  },
  {
    _id: "lm-02",
    customerId: "cust-02",
    membershipNumber: "PVP-LOY-92015",
    tier: "Gold",
    totalPoints: 3200,
    availablePoints: 1200,
    redeemedPoints: 2000,
    totalSpent: 32000,
    joinedDate: "2024-06-20T14:30:00.000Z",
    expiryDate: "2027-06-20T14:30:00.000Z",
    status: "Active",
    lastActivityDate: "2026-06-21T18:15:00.000Z"
  },
  {
    _id: "lm-03",
    customerId: "cust-03",
    membershipNumber: "PVP-LOY-10394",
    tier: "Bronze",
    totalPoints: 150,
    availablePoints: 150,
    redeemedPoints: 0,
    totalSpent: 1500,
    joinedDate: "2026-06-10T09:15:00.000Z",
    expiryDate: "2027-06-10T09:15:00.000Z",
    status: "Active",
    lastActivityDate: "2026-06-22T11:45:00.000Z"
  },
  {
    _id: "lm-04",
    customerId: "cust-04",
    membershipNumber: "PVP-LOY-29384",
    tier: "Silver",
    totalPoints: 1250,
    availablePoints: 750,
    redeemedPoints: 500,
    totalSpent: 12500,
    joinedDate: "2025-01-25T11:00:00.000Z",
    expiryDate: "2027-01-25T11:00:00.000Z",
    status: "Active",
    lastActivityDate: "2026-06-20T20:00:00.000Z"
  },
  {
    _id: "lm-05",
    customerId: "cust-05",
    membershipNumber: "PVP-LOY-59281",
    tier: "Gold",
    totalPoints: 2800,
    availablePoints: 1800,
    redeemedPoints: 1000,
    totalSpent: 28000,
    joinedDate: "2024-11-10T16:45:00.000Z",
    expiryDate: "2025-11-10T16:45:00.000Z",
    status: "Expired",
    lastActivityDate: "2025-11-05T12:00:00.000Z"
  },
  {
    _id: "lm-06",
    customerId: "cust-06",
    membershipNumber: "PVP-LOY-48193",
    tier: "Silver",
    totalPoints: 950,
    availablePoints: 450,
    redeemedPoints: 500,
    totalSpent: 9500,
    joinedDate: "2024-03-05T10:30:00.000Z",
    expiryDate: "2027-03-05T10:30:00.000Z",
    status: "Suspended",
    lastActivityDate: "2026-06-22T13:10:00.000Z"
  },
  {
    _id: "lm-07",
    customerId: "cust-07",
    membershipNumber: "PVP-LOY-73928",
    tier: "Platinum",
    totalPoints: 5200,
    availablePoints: 3700,
    redeemedPoints: 1500,
    totalSpent: 52000,
    joinedDate: "2025-03-15T08:00:00.000Z",
    expiryDate: "2027-03-15T08:00:00.000Z",
    status: "Active",
    lastActivityDate: "2026-06-18T15:30:00.000Z"
  },
  {
    _id: "lm-08",
    customerId: "cust-08",
    membershipNumber: "PVP-LOY-29103",
    tier: "Bronze",
    totalPoints: 400,
    availablePoints: 400,
    redeemedPoints: 0,
    totalSpent: 4000,
    joinedDate: "2025-05-20T12:00:00.000Z",
    expiryDate: "2027-05-20T12:00:00.000Z",
    status: "Inactive",
    lastActivityDate: "2026-03-10T14:20:00.000Z"
  }
];

export const mockLoyaltyTransactionsExpanded = [
  { _id: "lt-01", memberId: "lm-01", orderId: "PV-98401", transactionType: "Earn", points: 250, remarks: "Points earned for order PV-98401", createdAt: "2026-06-22T08:30:00.000Z" },
  { _id: "lt-02", memberId: "lm-01", orderId: "PV-98350", transactionType: "Redeem", points: -500, remarks: "Points redeemed for discount coupon PVP-DISC500", createdAt: "2026-06-15T12:00:00.000Z" },
  { _id: "lt-03", memberId: "lm-01", orderId: "N/A", transactionType: "Adjust", points: 100, remarks: "Manual loyalty points bonus by Admin Shubham", createdAt: "2026-06-10T15:00:00.000Z" },
  { _id: "lt-04", memberId: "lm-02", orderId: "PV-98405", transactionType: "Earn", points: 300, remarks: "Points earned for order PV-98405", createdAt: "2026-06-21T18:15:00.000Z" },
  { _id: "lt-05", memberId: "lm-02", orderId: "PV-98299", transactionType: "Redeem", points: -1000, remarks: "Points redeemed for Free Veg Pizza Coupon", createdAt: "2026-05-20T19:30:00.000Z" },
  { _id: "lt-06", memberId: "lm-03", orderId: "PV-98399", transactionType: "Earn", points: 150, remarks: "Points earned on joining and order PV-98399", createdAt: "2026-06-22T11:45:00.000Z" },
  { _id: "lt-07", memberId: "lm-04", orderId: "PV-98395", transactionType: "Earn", points: 120, remarks: "Points earned for order PV-98395", createdAt: "2026-06-20T20:00:00.000Z" },
  { _id: "lt-08", memberId: "lm-05", orderId: "N/A", transactionType: "Expire", points: -500, remarks: "Expired unused points on membership expiry", createdAt: "2025-11-10T16:45:00.000Z" }
];

export const mockTierHistory = [
  { _id: "th-01", memberId: "lm-01", oldTier: "Gold", newTier: "Platinum", changedAt: "2025-12-15T11:00:00.000Z", changedBy: "System", reason: "Crossed ₹40,000 threshold spend" },
  { _id: "th-02", memberId: "lm-02", oldTier: "Silver", newTier: "Gold", changedAt: "2025-10-10T14:00:00.000Z", changedBy: "System", reason: "Crossed ₹25,000 threshold spend" },
  { _id: "th-03", memberId: "lm-04", oldTier: "Bronze", newTier: "Silver", changedAt: "2025-06-01T09:00:00.000Z", changedBy: "System", reason: "Crossed ₹10,000 threshold spend" }
];

export const mockRewardRedemptions = [
  { _id: "rr-01", memberId: "lm-01", couponCode: "PV-DISC500", rewardName: "₹500 Discount Coupon", pointsUsed: 500, redeemedAt: "2026-06-15T12:00:00.000Z", status: "Used" },
  { _id: "rr-02", memberId: "lm-02", couponCode: "PV-FREEPIZZA", rewardName: "Free Veg Supreme Pizza", pointsUsed: 1000, redeemedAt: "2026-05-20T19:30:00.000Z", status: "Used" },
  { _id: "rr-03", memberId: "lm-04", couponCode: "PV-GARLICB", rewardName: "Free Garlic Bread", pointsUsed: 500, redeemedAt: "2026-04-12T13:45:00.000Z", status: "Active" }
];

export const mockLoyaltyLogs = [
  { _id: "llog-01", memberId: "lm-01", action: "Membership Created", performedBy: "System", createdAt: "2024-05-15T10:00:00.000Z" },
  { _id: "llog-02", memberId: "lm-01", action: "Tier Upgraded", performedBy: "System", createdAt: "2025-12-15T11:00:00.000Z" },
  { _id: "llog-03", memberId: "lm-01", action: "Points Earned", performedBy: "System", createdAt: "2026-06-22T08:30:00.000Z" },
  { _id: "llog-04", memberId: "lm-01", action: "Points Adjusted", performedBy: "Admin Shubham", createdAt: "2026-06-10T15:00:00.000Z" },
  { _id: "llog-05", memberId: "lm-06", action: "Suspended", performedBy: "Admin Shubham", createdAt: "2026-06-22T13:10:00.000Z" }
];



