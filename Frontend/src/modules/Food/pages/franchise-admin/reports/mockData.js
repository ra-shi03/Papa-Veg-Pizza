// Mock Data for Franchise Admin Sales Reports Page
// Localized with Indian names, Rupee currency, and WebP product images.

export const mockStoresList = [
  { storeId: "store-1", storeName: "Papa Veg Pizza - Indore Central" },
  { storeId: "store-2", storeName: "Papa Veg Pizza - Bhopal Zone" },
  { storeId: "store-3", storeName: "Papa Veg Pizza - Ujjain Branch" },
  { storeId: "store-4", storeName: "Papa Veg Pizza - Gwalior Hub" },
  { storeId: "store-5", storeName: "Papa Veg Pizza - Jabalpur Outlet" }
];

export const mockProductsPerformance = [
  {
    productId: "prod-1",
    productName: "Tandoori Paneer Delight Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=150&q=80&fm=webp",
    quantitySold: 1250,
    revenue: 498750,
    contributionPercentage: 35.4
  },
  {
    productId: "prod-2",
    productName: "Double Cheese Margherita Pizza",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=150&q=80&fm=webp",
    quantitySold: 1480,
    revenue: 368520,
    contributionPercentage: 26.2
  },
  {
    productId: "prod-3",
    productName: "Farmhouse Veggie Supreme Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=150&q=80&fm=webp",
    quantitySold: 890,
    revenue: 355110,
    contributionPercentage: 25.2
  },
  {
    productId: "prod-4",
    productName: "Garlic Breadsticks with Cheese Dip",
    image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=150&q=80&fm=webp",
    quantitySold: 980,
    revenue: 126420,
    contributionPercentage: 9.0
  },
  {
    productId: "prod-5",
    productName: "Choco Lava Molten Cake",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=150&q=80&fm=webp",
    quantitySold: 620,
    revenue: 61380,
    contributionPercentage: 4.2
  }
];

export const mockStorePerformanceList = [
  {
    storeId: "store-1",
    storeName: "Papa Veg Pizza - Indore Central",
    orders: 4890,
    revenue: 1680000,
    avgOrderValue: 343.5,
    growthPercentage: 14.5
  },
  {
    storeId: "store-2",
    storeName: "Papa Veg Pizza - Bhopal Zone",
    orders: 3950,
    revenue: 1350000,
    avgOrderValue: 341.7,
    growthPercentage: 11.2
  },
  {
    storeId: "store-3",
    storeName: "Papa Veg Pizza - Ujjain Branch",
    orders: 2210,
    revenue: 720000,
    avgOrderValue: 325.8,
    growthPercentage: 8.4
  },
  {
    storeId: "store-4",
    storeName: "Papa Veg Pizza - Gwalior Hub",
    orders: 1980,
    revenue: 650000,
    avgOrderValue: 328.2,
    growthPercentage: -2.5
  },
  {
    storeId: "store-5",
    storeName: "Papa Veg Pizza - Jabalpur Outlet",
    orders: 1240,
    revenue: 380000,
    avgOrderValue: 306.4,
    growthPercentage: 5.8
  }
];

export const mockRevenueTrends = {
  daily: [
    { date: "Mon", revenue: 145000 },
    { date: "Tue", revenue: 156000 },
    { date: "Wed", revenue: 138000 },
    { date: "Thu", revenue: 162000 },
    { date: "Fri", revenue: 215000 },
    { date: "Sat", revenue: 298000 },
    { date: "Sun", revenue: 275000 }
  ],
  weekly: [
    { date: "Week 1", revenue: 1120000 },
    { date: "Week 2", revenue: 1240000 },
    { date: "Week 3", revenue: 1180000 },
    { date: "Week 4", revenue: 1350000 }
  ],
  monthly: [
    { date: "Jan", revenue: 4200000 },
    { date: "Feb", revenue: 4500000 },
    { date: "Mar", revenue: 4800000 },
    { date: "Apr", revenue: 4100000 },
    { date: "May", revenue: 5200000 },
    { date: "Jun", revenue: 5800000 }
  ],
  yearly: [
    { date: "2024", revenue: 51200000 },
    { date: "2025", revenue: 58400000 },
    { date: "2026", revenue: 64200000 }
  ]
};

export const mockPaymentDistributionData = {
  upi: 55,
  card: 20,
  cash: 15,
  wallet: 10
};

export const initialGeneratedReports = [
  {
    id: "REP-2026-001",
    reportType: "Monthly",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    revenue: 4890000,
    orders: 14280,
    refundAmount: 98500,
    status: "Completed",
    generatedBy: "Rashi Kumar (Admin)",
    createdAt: "2026-06-01T10:15:30.000Z",
    fileUrl: "#"
  },
  {
    id: "REP-2026-002",
    reportType: "Weekly",
    startDate: "2026-06-01",
    endDate: "2026-06-07",
    revenue: 1240000,
    orders: 3620,
    refundAmount: 22400,
    status: "Completed",
    generatedBy: "Amit Sharma (Store Manager)",
    createdAt: "2026-06-08T09:30:00.000Z",
    fileUrl: "#"
  },
  {
    id: "REP-2026-003",
    reportType: "Daily",
    startDate: "2026-06-22",
    endDate: "2026-06-22",
    revenue: 298000,
    orders: 870,
    refundAmount: 5200,
    status: "Completed",
    generatedBy: "Rashi Kumar (Admin)",
    createdAt: "2026-06-23T00:30:15.000Z",
    fileUrl: "#"
  },
  {
    id: "REP-2026-004",
    reportType: "Custom",
    startDate: "2026-06-10",
    endDate: "2026-06-20",
    revenue: 3850000,
    orders: 11120,
    refundAmount: 76000,
    status: "Processing",
    generatedBy: "Isha Verma (Financial Analyst)",
    createdAt: "2026-06-23T11:45:00.000Z",
    fileUrl: null
  }
];

export const mockDashboardSummary = {
  totalRevenue: 4780180,
  totalOrders: 14280,
  avgOrderValue: 334.75,
  refundAmount: 126100,
  taxCollected: 239009,
  netRevenue: 4415071, // Revenue - Refunds - Taxes
  growthPercentage: 12.8,
  topStore: {
    storeName: "Indore Central Outlet",
    revenue: 1680000,
    orders: 4890
  }
};

// --- ORDER REPORTS DATASETS ---

export const mockOrderDashboardSummary = {
  totalOrders: 18450,
  completedOrders: 16920,
  cancelledOrders: 980,
  refundedOrders: 550,
  averagePreparationTime: 14.8,
  averageDeliveryTime: 23.5,
  averageOrderValue: 342.60
};

export const mockOrderStatusDistribution = {
  pending: 120,
  confirmed: 350,
  preparing: 480,
  baking: 290,
  packed: 150,
  outForDelivery: 140,
  delivered: 16920,
  cancelled: 980,
  refunded: 550
};

export const mockOrderTypeDistribution = {
  delivery: 9820,
  takeaway: 5410,
  dineIn: 3220
};

export const mockOrderHourlyHeatmap = [
  // Mon
  { day: "Mon", hour: 11, totalOrders: 42 },
  { day: "Mon", hour: 12, totalOrders: 98 },
  { day: "Mon", hour: 13, totalOrders: 124 },
  { day: "Mon", hour: 14, totalOrders: 82 },
  { day: "Mon", hour: 18, totalOrders: 112 },
  { day: "Mon", hour: 19, totalOrders: 184 },
  { day: "Mon", hour: 20, totalOrders: 245 },
  { day: "Mon", hour: 21, totalOrders: 210 },
  // Tue
  { day: "Tue", hour: 11, totalOrders: 45 },
  { day: "Tue", hour: 12, totalOrders: 105 },
  { day: "Tue", hour: 13, totalOrders: 118 },
  { day: "Tue", hour: 14, totalOrders: 78 },
  { day: "Tue", hour: 18, totalOrders: 120 },
  { day: "Tue", hour: 19, totalOrders: 195 },
  { day: "Tue", hour: 20, totalOrders: 230 },
  { day: "Tue", hour: 21, totalOrders: 205 },
  // Wed
  { day: "Wed", hour: 11, totalOrders: 38 },
  { day: "Wed", hour: 12, totalOrders: 92 },
  { day: "Wed", hour: 13, totalOrders: 110 },
  { day: "Wed", hour: 14, totalOrders: 70 },
  { day: "Wed", hour: 18, totalOrders: 108 },
  { day: "Wed", hour: 19, totalOrders: 175 },
  { day: "Wed", hour: 20, totalOrders: 225 },
  { day: "Wed", hour: 21, totalOrders: 198 },
  // Thu
  { day: "Thu", hour: 11, totalOrders: 50 },
  { day: "Thu", hour: 12, totalOrders: 115 },
  { day: "Thu", hour: 13, totalOrders: 130 },
  { day: "Thu", hour: 14, totalOrders: 85 },
  { day: "Thu", hour: 18, totalOrders: 132 },
  { day: "Thu", hour: 19, totalOrders: 210 },
  { day: "Thu", hour: 20, totalOrders: 260 },
  { day: "Thu", hour: 21, totalOrders: 220 },
  // Fri
  { day: "Fri", hour: 11, totalOrders: 65 },
  { day: "Fri", hour: 12, totalOrders: 140 },
  { day: "Fri", hour: 13, totalOrders: 165 },
  { day: "Fri", hour: 14, totalOrders: 98 },
  { day: "Fri", hour: 18, totalOrders: 185 },
  { day: "Fri", hour: 19, totalOrders: 290 },
  { day: "Fri", hour: 20, totalOrders: 380 },
  { day: "Fri", hour: 21, totalOrders: 310 },
  // Sat
  { day: "Sat", hour: 11, totalOrders: 80 },
  { day: "Sat", hour: 12, totalOrders: 195 },
  { day: "Sat", hour: 13, totalOrders: 220 },
  { day: "Sat", hour: 14, totalOrders: 140 },
  { day: "Sat", hour: 18, totalOrders: 245 },
  { day: "Sat", hour: 19, totalOrders: 390 },
  { day: "Sat", hour: 20, totalOrders: 490 },
  { day: "Sat", hour: 21, totalOrders: 430 },
  // Sun
  { day: "Sun", hour: 11, totalOrders: 75 },
  { day: "Sun", hour: 12, totalOrders: 180 },
  { day: "Sun", hour: 13, totalOrders: 210 },
  { day: "Sun", hour: 14, totalOrders: 130 },
  { day: "Sun", hour: 18, totalOrders: 220 },
  { day: "Sun", hour: 19, totalOrders: 370 },
  { day: "Sun", hour: 20, totalOrders: 460 },
  { day: "Sun", hour: 21, totalOrders: 395 }
];

export const mockStorePerformanceOrders = [
  { storeId: "store-1", storeName: "Papa Veg Pizza - Indore Central", orders: 4890, completedOrders: 4610, cancelledOrders: 180, avgDeliveryTime: 21.2, revenue: 1680000, growthPercentage: 14.5 },
  { storeId: "store-2", storeName: "Papa Veg Pizza - Bhopal Zone", orders: 3950, completedOrders: 3680, cancelledOrders: 170, avgDeliveryTime: 23.4, revenue: 1350000, growthPercentage: 11.2 },
  { storeId: "store-3", storeName: "Papa Veg Pizza - Ujjain Branch", orders: 2210, completedOrders: 2050, cancelledOrders: 90, avgDeliveryTime: 24.8, revenue: 720000, growthPercentage: 8.4 },
  { storeId: "store-4", storeName: "Papa Veg Pizza - Gwalior Hub", orders: 1980, completedOrders: 1810, cancelledOrders: 120, avgDeliveryTime: 25.1, revenue: 650000, growthPercentage: -2.5 },
  { storeId: "store-5", storeName: "Papa Veg Pizza - Jabalpur Outlet", orders: 1240, completedOrders: 1150, cancelledOrders: 50, avgDeliveryTime: 26.5, revenue: 380000, growthPercentage: 5.8 }
];

export const mockDetailedOrderReportsList = [
  { orderId: "ord-1", orderNumber: "PVP-1092", customerName: "Rashi Kumar", storeName: "Papa Veg Pizza - Indore Central", amount: 450, orderType: "Delivery", status: "Delivered", deliveryTime: 22, createdAt: "2026-06-23T11:44:00.000Z" },
  { orderId: "ord-2", orderNumber: "PVP-1093", customerName: "Amit Sharma", storeName: "Papa Veg Pizza - Bhopal Zone", amount: 590, orderType: "Takeaway", status: "Preparing", deliveryTime: 0, createdAt: "2026-06-23T11:50:00.000Z" },
  { orderId: "ord-3", orderNumber: "PVP-1094", customerName: "Rohan Malhotra", storeName: "Papa Veg Pizza - Indore Central", amount: 399, orderType: "Delivery", status: "Out For Delivery", deliveryTime: 15, createdAt: "2026-06-23T11:51:00.000Z" },
  { orderId: "ord-4", orderNumber: "PVP-1095", customerName: "Isha Sharma", storeName: "Papa Veg Pizza - Ujjain Branch", amount: 620, orderType: "Dine-In", status: "Baking", deliveryTime: 0, createdAt: "2026-06-23T11:52:00.000Z" },
  { orderId: "ord-5", orderNumber: "PVP-1096", customerName: "Vikram Rathore", storeName: "Papa Veg Pizza - Gwalior Hub", amount: 320, orderType: "Delivery", status: "Delivered", deliveryTime: 28, createdAt: "2026-06-23T11:20:00.000Z" },
  { orderId: "ord-6", orderNumber: "PVP-1097", customerName: "Pooja Patel", storeName: "Papa Veg Pizza - Jabalpur Outlet", amount: 520, orderType: "Delivery", status: "Cancelled", deliveryTime: 0, createdAt: "2026-06-23T10:15:00.000Z" },
  { orderId: "ord-7", orderNumber: "PVP-1098", customerName: "Karan Singh", storeName: "Papa Veg Pizza - Indore Central", amount: 480, orderType: "Takeaway", status: "Refunded", deliveryTime: 0, createdAt: "2026-06-23T09:40:00.000Z" }
];

export const mockSingleOrderDetail = {
  orderNumber: "PVP-1092",
  customer: {
    name: "Rashi Kumar",
    phone: "+91 99887 76655",
    email: "rashi.kumar@gmail.com",
    address: "142, Palasia Square, Near HDFC Bank, Indore, Madhya Pradesh",
    loyaltyPoints: 350
  },
  items: [
    { name: "Tandoori Paneer Delight Pizza", quantity: 1, price: 399, subtotal: 399, customization: "Extra Paneer, Cheese Burst Base" },
    { name: "Choco Lava Molten Cake", quantity: 1, price: 99, subtotal: 99, customization: "Normal" }
  ],
  payment: {
    method: "UPI (Google Pay)",
    transactionId: "TXN-8840212903",
    amount: 498,
    status: "Paid"
  },
  timeline: [
    { stage: "Placed", timestamp: "2026-06-23T11:44:00.000Z", completed: true },
    { stage: "Confirmed", timestamp: "2026-06-23T11:46:00.000Z", completed: true },
    { stage: "Preparing", timestamp: "2026-06-23T11:48:00.000Z", completed: true },
    { stage: "Baking", timestamp: "2026-06-23T11:51:00.000Z", completed: true },
    { stage: "Packed", timestamp: "2026-06-23T11:55:00.000Z", completed: true },
    { stage: "Assigned", timestamp: "2026-06-23T11:56:00.000Z", completed: true },
    { stage: "Out For Delivery", timestamp: "2026-06-23T11:58:00.000Z", completed: true },
    { stage: "Delivered", timestamp: "2026-06-23T12:06:00.000Z", completed: true }
  ],
  rider: {
    name: "Rahul Dev",
    phone: "+91 98402 12903",
    assignedTime: "2026-06-23T11:56:00.000Z",
    pickupTime: "2026-06-23T11:58:00.000Z",
    deliveryTime: "2026-06-23T12:06:00.000Z"
  },
  invoiceSummary: {
    subtotal: 498,
    tax: 25,
    discount: 50,
    deliveryCharges: 30,
    grandTotal: 503
  }
};

export const initialGeneratedOrderReports = [
  {
    id: "ORD-2026-001",
    reportType: "Monthly",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    revenue: 4890000,
    orders: 14280,
    refundAmount: 98500,
    status: "Completed",
    generatedBy: "Rashi Kumar (Admin)",
    createdAt: "2026-06-01T10:15:30.000Z",
    fileUrl: "#"
  }
];

// --- STAFF REPORTS DATASETS ---
export const mockStaffDashboardSummary = {
  totalEmployees: 48,
  activeEmployees: 42,
  attendancePercentage: 94.6,
  averageWorkingHours: 7.8,
  completedDeliveries: 12450,
  kitchenProductivity: 254
};

export const mockStaffRoleDistribution = {
  managers: 5,
  kitchenStaff: 18,
  deliveryPartners: 25
};

export const mockStaffAttendanceTrend = [
  { date: "Mon", attendancePercentage: 92.5 },
  { date: "Tue", attendancePercentage: 94.0 },
  { date: "Wed", attendancePercentage: 95.8 },
  { date: "Thu", attendancePercentage: 93.2 },
  { date: "Fri", attendancePercentage: 95.0 },
  { date: "Sat", attendancePercentage: 96.5 },
  { date: "Sun", attendancePercentage: 97.2 }
];

export const mockDeliveryPerformance = [
  { id: "staff-3", name: "Rahul Dev", completedDeliveries: 540, distanceCovered: 1620, avgDeliveryTime: 22.4, rating: 4.8, totalEarnings: 16200, performanceScore: 95 },
  { id: "staff-7", name: "Amit Patel", completedDeliveries: 480, distanceCovered: 1340, avgDeliveryTime: 24.1, rating: 4.6, totalEarnings: 14400, performanceScore: 89 },
  { id: "staff-8", name: "Sunil Verma", completedDeliveries: 510, distanceCovered: 1490, avgDeliveryTime: 23.5, rating: 4.7, totalEarnings: 15300, performanceScore: 92 },
  { id: "staff-9", name: "Deepak Kumar", completedDeliveries: 420, distanceCovered: 1100, avgDeliveryTime: 26.8, rating: 4.3, totalEarnings: 12600, performanceScore: 82 },
  { id: "staff-10", name: "Vijay Singh", completedDeliveries: 495, distanceCovered: 1510, avgDeliveryTime: 21.9, rating: 4.9, totalEarnings: 14850, performanceScore: 97 }
];

export const mockKitchenPerformance = [
  { id: "staff-2", name: "Suresh Kumar", ordersPrepared: 320, avgPrepTime: 12.8, shiftHours: 180, performanceScore: 94, efficiencyPercentage: 96.5 },
  { id: "staff-4", name: "Rajesh Gupta", ordersPrepared: 290, avgPrepTime: 14.2, shiftHours: 175, performanceScore: 88, efficiencyPercentage: 91.2 },
  { id: "staff-5", name: "Vikram Sen", ordersPrepared: 345, avgPrepTime: 11.5, shiftHours: 180, performanceScore: 98, efficiencyPercentage: 98.4 },
  { id: "staff-6", name: "Pooja Sharma", ordersPrepared: 275, avgPrepTime: 15.1, shiftHours: 160, performanceScore: 85, efficiencyPercentage: 88.6 }
];

export const mockManagerPerformance = [
  { id: "staff-1", name: "Rashi Kumar", store: "Papa Veg Pizza - Indore Central", ordersManaged: 4890, revenue: 1680000, complaints: 12, customerRating: 4.7, performanceScore: 96 },
  { id: "staff-11", name: "Anoop Sharma", store: "Papa Veg Pizza - Bhopal Zone", ordersManaged: 3950, revenue: 1350000, complaints: 18, customerRating: 4.5, performanceScore: 91 },
  { id: "staff-12", name: "Manish Joshi", store: "Papa Veg Pizza - Ujjain Branch", ordersManaged: 2210, revenue: 720000, complaints: 8, customerRating: 4.6, performanceScore: 93 }
];

export const mockStaffDetailedList = [
  { id: "staff-1", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Rashi Kumar", role: "Store Manager", store: "Papa Veg Pizza - Indore Central", attendancePercentage: 98.2, performanceScore: 96, status: "Active", joiningDate: "2024-03-15T00:00:00.000Z" },
  { id: "staff-2", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Suresh Kumar", role: "Kitchen Staff", store: "Papa Veg Pizza - Indore Central", attendancePercentage: 95.4, performanceScore: 94, status: "Active", joiningDate: "2024-05-10T00:00:00.000Z" },
  { id: "staff-3", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Rahul Dev", role: "Delivery Partner", store: "Papa Veg Pizza - Indore Central", attendancePercentage: 92.1, performanceScore: 95, status: "Active", joiningDate: "2024-06-01T00:00:00.000Z" },
  { id: "staff-4", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Rajesh Gupta", role: "Kitchen Staff", store: "Papa Veg Pizza - Indore Central", attendancePercentage: 89.5, performanceScore: 88, status: "Active", joiningDate: "2024-08-20T00:00:00.000Z" },
  { id: "staff-5", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Vikram Sen", role: "Kitchen Staff", store: "Papa Veg Pizza - Bhopal Zone", attendancePercentage: 97.8, performanceScore: 98, status: "Active", joiningDate: "2024-04-12T00:00:00.000Z" },
  { id: "staff-6", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Pooja Sharma", role: "Kitchen Staff", store: "Papa Veg Pizza - Bhopal Zone", attendancePercentage: 86.4, performanceScore: 85, status: "Active", joiningDate: "2025-01-10T00:00:00.000Z" },
  { id: "staff-7", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Amit Patel", role: "Delivery Partner", store: "Papa Veg Pizza - Bhopal Zone", attendancePercentage: 91.8, performanceScore: 89, status: "Active", joiningDate: "2024-07-15T00:00:00.000Z" },
  { id: "staff-8", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Sunil Verma", role: "Delivery Partner", store: "Papa Veg Pizza - Ujjain Branch", attendancePercentage: 94.2, performanceScore: 92, status: "Active", joiningDate: "2024-09-01T00:00:00.000Z" },
  { id: "staff-9", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Deepak Kumar", role: "Delivery Partner", store: "Papa Veg Pizza - Ujjain Branch", attendancePercentage: 85.0, performanceScore: 82, status: "Suspended", joiningDate: "2024-11-10T00:00:00.000Z" },
  { id: "staff-10", photo: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Vijay Singh", role: "Delivery Partner", store: "Papa Veg Pizza - Indore Central", attendancePercentage: 96.5, performanceScore: 97, status: "Active", joiningDate: "2024-03-20T00:00:00.000Z" },
  { id: "staff-11", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Anoop Sharma", role: "Store Manager", store: "Papa Veg Pizza - Bhopal Zone", attendancePercentage: 95.8, performanceScore: 91, status: "Active", joiningDate: "2024-02-18T00:00:00.000Z" },
  { id: "staff-12", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80&fm=webp", name: "Manish Joshi", role: "Store Manager", store: "Papa Veg Pizza - Ujjain Branch", attendancePercentage: 93.9, performanceScore: 93, status: "Inactive", joiningDate: "2024-06-10T00:00:00.000Z" }
];

export const mockStaffShifts = {
  "staff-1": [
    { date: "2026-06-22", startTime: "09:00", endTime: "17:00", breakTime: 45, hoursWorked: 7.25, status: "Completed" },
    { date: "2026-06-21", startTime: "09:00", endTime: "17:00", breakTime: 45, hoursWorked: 7.25, status: "Completed" },
    { date: "2026-06-20", startTime: "09:00", endTime: "17:00", breakTime: 45, hoursWorked: 7.25, status: "Completed" }
  ],
  "staff-2": [
    { date: "2026-06-22", startTime: "10:00", endTime: "18:00", breakTime: 30, hoursWorked: 7.5, status: "Completed" },
    { date: "2026-06-21", startTime: "10:00", endTime: "18:00", breakTime: 30, hoursWorked: 7.5, status: "Completed" },
    { date: "2026-06-20", startTime: "10:00", endTime: "18:00", breakTime: 30, hoursWorked: 7.5, status: "Completed" }
  ],
  "staff-3": [
    { date: "2026-06-22", startTime: "11:00", endTime: "19:00", breakTime: 60, hoursWorked: 7.0, status: "Completed" },
    { date: "2026-06-21", startTime: "11:00", endTime: "19:00", breakTime: 60, hoursWorked: 7.0, status: "Completed" },
    { date: "2026-06-20", startTime: "11:00", endTime: "19:00", breakTime: 60, hoursWorked: 7.0, status: "Completed" }
  ]
};

export const initialGeneratedStaffReports = [
  {
    id: "STF-2026-001",
    role: "All Roles",
    storeName: "All Stores (Franchise-wide)",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    status: "Completed",
    generatedBy: "Rashi Kumar (Admin)",
    createdAt: "2026-06-01T11:20:00.000Z",
    fileUrl: "#"
  }
];

// --- INVENTORY REPORTS DATASETS ---
export const mockInventorySummary = {
  totalIngredients: 45,
  stockValue: 845200,
  lowStockItems: 6,
  wastagePercentage: 4.8,
  pendingPurchaseRequests: 8,
  inventoryTurnoverRatio: 5.2
};

export const mockConsumptionTrend = [
  { date: "Mon", consumed: 240, purchased: 300, wastage: 12 },
  { date: "Tue", consumed: 260, purchased: 250, wastage: 15 },
  { date: "Wed", consumed: 280, purchased: 400, wastage: 10 },
  { date: "Thu", consumed: 250, purchased: 200, wastage: 18 },
  { date: "Fri", consumed: 340, purchased: 500, wastage: 14 },
  { date: "Sat", consumed: 420, purchased: 600, wastage: 22 },
  { date: "Sun", consumed: 390, purchased: 350, wastage: 20 }
];

export const mockLowStockList = [
  { name: "Premium Mozzarella Cheese", currentStock: 12, minimumStock: 30, criticalLevel: 10 },
  { name: "Fresh Mushrooms", currentStock: 8, minimumStock: 20, criticalLevel: 5 },
  { name: "Papa Veg Pizza Sauce", currentStock: 15, minimumStock: 40, criticalLevel: 15 },
  { name: "Organic Extra Virgin Olive Oil", currentStock: 3, minimumStock: 10, criticalLevel: 2 },
  { name: "Fresh Basil Leaves", currentStock: 1, minimumStock: 5, criticalLevel: 1 },
  { name: "Wheat Pizza Dough Balls", currentStock: 45, minimumStock: 100, criticalLevel: 30 }
];

export const mockIngredientUsage = [
  { name: "Premium Mozzarella Cheese", category: "Cheese", openingStock: 50, consumed: 88, purchased: 50, closingStock: 12, wastage: 4.2, unit: "kg", wastagePercentage: 4.77 },
  { name: "Paneer Cubes (Cottage Cheese)", category: "Cheese", openingStock: 30, consumed: 45, purchased: 40, closingStock: 25, wastage: 1.8, unit: "kg", wastagePercentage: 4.0 },
  { name: "Papa Veg Pizza Sauce", category: "Sauces", openingStock: 40, consumed: 65, purchased: 40, closingStock: 15, wastage: 3.5, unit: "liters", wastagePercentage: 5.38 },
  { name: "Fresh Dough Balls (Standard)", category: "Dough", openingStock: 200, consumed: 680, purchased: 600, closingStock: 120, wastage: 22.0, unit: "pcs", wastagePercentage: 3.24 },
  { name: "Diced Tomatoes", category: "Vegetables", openingStock: 25, consumed: 58, purchased: 60, closingStock: 27, wastage: 2.8, unit: "kg", wastagePercentage: 4.83 },
  { name: "Sliced Capsicum", category: "Vegetables", openingStock: 20, consumed: 48, purchased: 50, closingStock: 22, wastage: 2.1, unit: "kg", wastagePercentage: 4.38 },
  { name: "Premium Wheat Base Dough", category: "Dough", openingStock: 80, consumed: 235, purchased: 200, closingStock: 45, wastage: 8.5, unit: "pcs", wastagePercentage: 3.62 }
];

export const mockPurchaseRequestsAnalytics = {
  pending: 8,
  approved: 15,
  ordered: 12,
  rejected: 3
};

export const mockPurchaseRequests = [
  { requestNumber: "PR-2026-101", ingredient: "Premium Mozzarella Cheese", quantity: 50, supplier: "Amul Dairy Dist", requestDate: "2026-06-22T10:15:00.000Z", status: "Pending", approvedBy: "—" },
  { requestNumber: "PR-2026-102", ingredient: "Papa Veg Pizza Sauce", quantity: 100, supplier: "Veeba Foods Pvt Ltd", requestDate: "2026-06-22T11:30:00.000Z", status: "Approved", approvedBy: "Rashi Kumar (Admin)" },
  { requestNumber: "PR-2026-103", ingredient: "Diced Tomatoes", quantity: 60, supplier: "Indore Agri Market Agency", requestDate: "2026-06-21T09:00:00.000Z", status: "Ordered", approvedBy: "Rashi Kumar (Admin)" },
  { requestNumber: "PR-2026-104", ingredient: "Fresh Basil Leaves", quantity: 10, supplier: "Indore Organic Green Farm", requestDate: "2026-06-20T14:40:00.000Z", status: "Rejected", approvedBy: "Rashi Kumar (Admin)" }
];

export const mockStockTransactions = [
  { date: "2026-06-23T11:00:00.000Z", ingredient: "Premium Mozzarella Cheese", transactionType: "Consumption", quantity: 15, referenceNumber: "TXN-77402", updatedBy: "Chef Vikram Sen", remarks: "Daily Pizza Prep" },
  { date: "2026-06-23T09:30:00.000Z", ingredient: "Premium Mozzarella Cheese", transactionType: "Purchase", quantity: 50, referenceNumber: "TXN-77399", updatedBy: "Rashi Kumar (Admin)", remarks: "Restocked from PR-2026-100" },
  { date: "2026-06-22T17:45:00.000Z", ingredient: "Papa Veg Pizza Sauce", transactionType: "Wastage", quantity: 2.5, referenceNumber: "TXN-77382", updatedBy: "Chef Suresh Kumar", remarks: "Spillage during dispensing" },
  { date: "2026-06-22T10:00:00.000Z", ingredient: "Paneer Cubes (Cottage Cheese)", transactionType: "Transfer", quantity: 10, referenceNumber: "TXN-77351", updatedBy: "Anoop Sharma (Mgr)", remarks: "Transferred to Bhopal Zone" },
  { date: "2026-06-21T15:20:00.000Z", ingredient: "Premium Wheat Base Dough", transactionType: "Adjustment", quantity: -4, referenceNumber: "TXN-77312", updatedBy: "Rashi Kumar (Admin)", remarks: "Audit Stock Correction" }
];

export const mockSuppliersSummary = [
  { supplierName: "Amul Dairy Dist", itemsSupplied: "Cheese, Butter, Cream", ordersCount: 24, totalPurchaseValue: 345000, averageDeliveryTime: 1.5, status: "Active" },
  { supplierName: "Veeba Foods Pvt Ltd", itemsSupplied: "Pizza Sauce, Marinara Dip, Mayo", ordersCount: 18, totalPurchaseValue: 189000, averageDeliveryTime: 2.1, status: "Active" },
  { supplierName: "Indore Agri Market Agency", itemsSupplied: "Tomatoes, Capsicum, Onions, Mushrooms", ordersCount: 42, totalPurchaseValue: 124500, averageDeliveryTime: 0.8, status: "Active" },
  { supplierName: "Indore Organic Green Farm", itemsSupplied: "Basil Leaves, Jalapenos, Olives", ordersCount: 15, totalPurchaseValue: 56000, averageDeliveryTime: 1.2, status: "Active" }
];

export const initialGeneratedInventoryReports = [
  {
    id: "INV-2026-001",
    storeName: "All Stores (Franchise-wide)",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    itemsConsumed: 1245,
    stockValue: 845200,
    generatedBy: "Rashi Kumar (Admin)",
    status: "Completed",
    createdAt: "2026-06-01T10:30:00.000Z",
    fileUrl: "#"
  }
];



