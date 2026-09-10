import { initialStores, initialManagers, initialStoreApprovals, initialStorePerformance, initialOperatingHours } from "../../modules/Food/pages/franchise-admin/storeManagement/mockStoresData.js";
import { initialMockStoreRiders, initialMockLiveDeliveries, initialMockTrackingData, initialMockDeliveryIssues, initialMockNotifications, initialMockDeliveryTimelines } from "../../modules/Food/pages/store-manager/deliveryOperations/mockDeliveryData.js";
import { storePricingService } from "../../modules/Food/pages/franchise-admin/products/services/storePricingService.js";
import { mockCampaigns, mockCampaignPerformance, mockBanners, mockProducts, mockCoupons, mockNotifications, mockNotificationLogs } from "../../modules/Food/pages/franchise-admin/marketing/mockData.js";
import { initialMockStaff, initialMockAttendance, initialMockShifts, initialMockPerformance } from "../../modules/Food/pages/store-manager/staffManagement/mockData.js";
import {
  mockStoresList,
  mockProductsPerformance,
  mockStorePerformanceList,
  mockRevenueTrends,
  mockPaymentDistributionData,
  initialGeneratedReports,
  mockDashboardSummary,
  mockOrderDashboardSummary,
  mockOrderStatusDistribution,
  mockOrderTypeDistribution,
  mockOrderHourlyHeatmap,
  mockStorePerformanceOrders,
  mockDetailedOrderReportsList,
  mockSingleOrderDetail,
  initialGeneratedOrderReports,
  mockStaffDashboardSummary,
  mockStaffRoleDistribution,
  mockStaffAttendanceTrend,
  mockDeliveryPerformance,
  mockKitchenPerformance,
  mockManagerPerformance,
  mockStaffDetailedList,
  mockStaffShifts,
  initialGeneratedStaffReports,
  mockInventorySummary,
  mockConsumptionTrend,
  mockLowStockList,
  mockIngredientUsage,
  mockPurchaseRequestsAnalytics,
  mockPurchaseRequests,
  mockStockTransactions,
  mockSuppliersSummary,
  initialGeneratedInventoryReports
} from "../../modules/Food/pages/franchise-admin/reports/mockData.js";
import { mockDailySales, mockDetailedOrders, mockStoreKitchenPerformance, getMockKitchenDayDetails, getMockDelayAnalysis, getMockWasteAnalysis, mockStaffPerformance, getMockStaffDetails, getMockStaffComparison, generateStorePerformanceMock, getMockStoreMonthDetails } from "../../modules/Food/pages/store-manager/reports/mockData.js";

// Helper to load/save mock data from LocalStorage
const getStorageItem = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(`mock_db_${key}`);
    if (val === null || val === undefined || val === "null" || val === "undefined") {
      return defaultVal;
    }
    return JSON.parse(val);
  } catch (_) {
    return defaultVal;
  }
};

const setStorageItem = (key, val) => {
  try {
    localStorage.setItem(`mock_db_${key}`, JSON.stringify(val));
  } catch (_) { }
};

// Initial Seed Data
const initialCategories = [
  { id: "cat-1", name: "Pizzas", status: "Active", description: "Freshly vegetarian pizzas", order: 1, isGlobal: true, isApproved: true },
  { id: "cat-2", name: "Beverages", status: "Active", description: "Soft drinks and milkshakes", order: 2, isGlobal: true, isApproved: true },
  { id: "cat-3", name: "Sides", status: "Active", description: "Garlic breads, dips and sides", order: 3, isGlobal: true, isApproved: true },
  { id: "cat-4", name: "Desserts", status: "Draft", description: "Choco lava cakes and ice creams", order: 4, isGlobal: false, isApproved: false }
];

const initialRestaurants = [
  { id: "rest-1", name: "Papa Veg Pizza - Central Outlet", email: "central@papaveg.com", phone: "9876543210", address: "Sector 15, Central Market, Noida", status: "approved", isActive: true, cuisines: ["Italian", "Fast Food"], commission: 15 },
  { id: "rest-2", name: "Papa Veg Pizza - East Delhi", email: "eastdelhi@papaveg.com", phone: "9876543211", address: "Preet Vihar, New Delhi", status: "approved", isActive: true, cuisines: ["Italian", "Desserts"], commission: 12 },
  { id: "rest-3", name: "Veg Hub Franchise", email: "veghub@example.com", phone: "9876543212", address: "Indiranagar, Bangalore", status: "pending", isActive: false, cuisines: ["Italian", "Beverages"], commission: 10 }
];

const initialFoods = [
  { id: "food-1", name: "Margherita Pizza", category: "cat-1", categoryName: "Pizzas", price: 249, description: "Classic cheese pizza with rich tomato sauce", status: "Active", image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143", isVeg: true, isApproved: true },
  { id: "food-2", name: "Veg Supreme Pizza", category: "cat-1", categoryName: "Pizzas", price: 399, description: "Loaded with onion, capsicum, tomato, mushroom & olives", status: "Active", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591", isVeg: true, isApproved: true },
  { id: "food-3", name: "Garlic Breadsticks", category: "cat-3", categoryName: "Sides", price: 129, description: "Baked garlic breadsticks served with creamy dip", status: "Active", image: "https://images.unsplash.com/photo-1544982503-9f984c14501a", isVeg: true, isApproved: true },
  { id: "food-4", name: "Chocolate Lava Cake", category: "cat-4", categoryName: "Desserts", price: 99, description: "Warm chocolate cake with a gooey chocolate center", status: "Active", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c", isVeg: true, isApproved: false }
];

const initialOrders = [
  { id: "660c1d2eef20092c4820a011", orderNumber: "PVP-1092", customer: { name: "Rashi Kumar", phone: "9988776655" }, restaurant: { name: "Papa Veg Pizza - Central Outlet" }, items: [{ name: "Veg Supreme Pizza", quantity: 1, price: 399 }], total: 439, status: "delivered", paymentMethod: "Online", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "660c1d2eef20092c4820a012", orderNumber: "PVP-1093", customer: { name: "Amit Sharma", phone: "9988776654" }, restaurant: { name: "Papa Veg Pizza - East Delhi" }, items: [{ name: "Margherita Pizza", quantity: 2, price: 249 }], total: 548, status: "preparing", paymentMethod: "COD", createdAt: new Date().toISOString() }
];

const initialTickets = [
  { id: "ticket-1", subject: "Refund query", description: "Customer requesting refund for order PVP-1091", status: "open", priority: "high", user: { name: "Rashi Kumar", role: "customer" }, createdAt: new Date().toISOString() },
  { id: "ticket-2", subject: "Commission settlement", description: "Franchise owner asking about monthly payouts", status: "pending", priority: "medium", user: { name: "Rajesh Gupta", role: "franchise" }, createdAt: new Date(Date.now() - 86400000).toISOString() }
];

const initialEmergencyReports = [
  { id: "report-1", title: "Accident reported", description: "Rider reported a minor road incident near sector 62", status: "pending", priority: "high", createdAt: new Date().toISOString() }
];

const initialMockCustomers = [
  {
    _id: "cust-1",
    name: "Aarav Sharma",
    mobile: "9876543210",
    email: "aarav.sharma@gmail.com",
    totalOrders: 14,
    totalSpent: 6480,
    loyaltyPoints: 320,
    lastOrderDate: "2026-06-24T12:30:00Z",
    createdAt: "2025-08-15T10:00:00Z"
  },
  {
    _id: "cust-2",
    name: "Ananya Patel",
    mobile: "9123456789",
    email: "ananya.patel@yahoo.com",
    totalOrders: 8,
    totalSpent: 3820,
    loyaltyPoints: 190,
    lastOrderDate: "2026-06-25T11:15:00Z",
    createdAt: "2025-11-20T14:30:00Z"
  },
  {
    _id: "cust-3",
    name: "Rohan Verma",
    mobile: "9812345678",
    email: "rohan.verma@outlook.com",
    totalOrders: 1,
    totalSpent: 450,
    loyaltyPoints: 20,
    lastOrderDate: "2026-06-25T15:10:00Z",
    createdAt: "2026-06-25T15:00:00Z"
  },
  {
    _id: "cust-4",
    name: "Aditi Rao",
    mobile: "9988776655",
    email: "aditi.rao@gmail.com",
    totalOrders: 25,
    totalSpent: 12450,
    loyaltyPoints: 620,
    lastOrderDate: "2026-06-20T20:45:00Z",
    createdAt: "2025-01-10T09:15:00Z"
  },
  {
    _id: "cust-5",
    name: "Vikram Singh",
    mobile: "9765432109",
    email: "vikram.singh@gmail.com",
    totalOrders: 5,
    totalSpent: 2150,
    loyaltyPoints: 100,
    lastOrderDate: "2026-05-15T18:20:00Z",
    createdAt: "2026-02-12T11:45:00Z"
  },
  {
    _id: "cust-6",
    name: "Pooja Hegde",
    mobile: "9654321098",
    email: "pooja.hegde@hotmail.com",
    totalOrders: 12,
    totalSpent: 5290,
    loyaltyPoints: 260,
    lastOrderDate: "2026-06-25T13:00:00Z",
    createdAt: "2025-09-05T16:40:00Z"
  },
  {
    _id: "cust-7",
    name: "Kabir Mehta",
    mobile: "9543210987",
    email: "kabir.mehta@gmail.com",
    totalOrders: 18,
    totalSpent: 8900,
    loyaltyPoints: 440,
    lastOrderDate: "2026-06-22T21:10:00Z",
    createdAt: "2025-05-18T10:30:00Z"
  },
  {
    _id: "cust-8",
    name: "Diya Iyer",
    mobile: "9432109876",
    email: "diya.iyer@gmail.com",
    totalOrders: 3,
    totalSpent: 1200,
    loyaltyPoints: 60,
    lastOrderDate: "2026-06-25T14:50:00Z",
    createdAt: "2026-01-20T12:00:00Z"
  }
];

const initialMockOrders = [
  {
    _id: "ord-1",
    customerId: "cust-1",
    storeId: "store-104",
    orderNumber: "PVP-9081",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "UPI / PhonePe",
    totalAmount: 480,
    deliveryType: "delivery",
    addressId: "addr-1",
    riderId: "rider-1",
    createdAt: "2026-06-24T12:30:00Z"
  },
  {
    _id: "ord-2",
    customerId: "cust-2",
    storeId: "store-104",
    orderNumber: "PVP-9082",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Netbanking",
    totalAmount: 590,
    deliveryType: "delivery",
    addressId: "addr-2",
    riderId: "rider-2",
    createdAt: "2026-06-25T11:15:00Z"
  },
  {
    _id: "ord-3",
    customerId: "cust-3",
    storeId: "store-104",
    orderNumber: "PVP-9083",
    orderStatus: "preparing",
    paymentStatus: "pending",
    paymentMethod: "COD",
    totalAmount: 450,
    deliveryType: "takeaway",
    addressId: null,
    riderId: null,
    createdAt: "2026-06-25T15:10:00Z"
  },
  {
    _id: "ord-4",
    customerId: "cust-4",
    storeId: "store-104",
    orderNumber: "PVP-9084",
    orderStatus: "refunded",
    paymentStatus: "refunded",
    paymentMethod: "Credit Card",
    totalAmount: 750,
    deliveryType: "delivery",
    addressId: "addr-4",
    riderId: "rider-3",
    createdAt: "2026-06-20T20:45:00Z"
  },
  {
    _id: "ord-5",
    customerId: "cust-6",
    storeId: "store-104",
    orderNumber: "PVP-9085",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "UPI / Paytm",
    totalAmount: 320,
    deliveryType: "delivery",
    addressId: "addr-6",
    riderId: "rider-4",
    createdAt: "2026-06-25T13:00:00Z"
  },
  {
    _id: "ord-6",
    customerId: "cust-7",
    storeId: "store-104",
    orderNumber: "PVP-9086",
    orderStatus: "ready",
    paymentStatus: "paid",
    paymentMethod: "UPI / GooglePay",
    totalAmount: 620,
    deliveryType: "takeaway",
    addressId: null,
    riderId: null,
    createdAt: "2026-06-22T21:10:00Z"
  },
  {
    _id: "ord-7",
    customerId: "cust-8",
    storeId: "store-104",
    orderNumber: "PVP-9087",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "COD",
    totalAmount: 380,
    deliveryType: "delivery",
    addressId: "addr-8",
    riderId: "rider-1",
    createdAt: "2026-06-25T14:50:00Z"
  },
  {
    _id: "ord-8",
    customerId: "cust-1",
    storeId: "store-104",
    orderNumber: "PVP-8001",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "UPI / PhonePe",
    totalAmount: 350,
    deliveryType: "delivery",
    addressId: "addr-1",
    riderId: "rider-1",
    createdAt: "2026-05-10T11:00:00Z"
  },
  {
    _id: "ord-9",
    customerId: "cust-4",
    storeId: "store-104",
    orderNumber: "PVP-8002",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "UPI / Paytm",
    totalAmount: 490,
    deliveryType: "delivery",
    addressId: "addr-4",
    riderId: "rider-3",
    createdAt: "2026-06-12T19:30:00Z"
  }
];

const initialMockOrderItems = [
  { _id: "item-1", orderId: "ord-1", name: "Veg Supreme Pizza", quantity: 1, price: 399, customizations: "Size: Large, Extra Cheese: Yes, Toppings: Onion, Capsicum" },
  { _id: "item-2", orderId: "ord-1", name: "Garlic Breadsticks", quantity: 1, price: 81, customizations: "None" },
  { _id: "item-3", orderId: "ord-2", name: "Farmhouse Delight Pizza", quantity: 1, price: 349, customizations: "Size: Medium, Extra Cheese: No" },
  { _id: "item-4", orderId: "ord-2", name: "Chocolate Lava Cake", quantity: 2, price: 99, customizations: "None" },
  { _id: "item-5", orderId: "ord-3", name: "Peppy Paneer Pizza", quantity: 1, price: 399, customizations: "Size: Medium, Extra Cheese: Yes" },
  { _id: "item-6", orderId: "ord-3", name: "Pepsi Can", quantity: 1, price: 51, customizations: "None" },
  { _id: "item-7", orderId: "ord-4", name: "Double Cheese Margherita", quantity: 2, price: 299, customizations: "Size: Medium" },
  { _id: "item-8", orderId: "ord-4", name: "Stuffed Garlic Bread", quantity: 1, price: 152, customizations: "Extra Cheese: Yes" },
  { _id: "item-9", orderId: "ord-5", name: "Capsicum Pizza", quantity: 2, price: 160, customizations: "Size: Regular" },
  { _id: "item-10", orderId: "ord-6", name: "Tandoori Paneer Pizza", quantity: 1, price: 449, customizations: "Size: Large, Extra Cheese: Yes" },
  { _id: "item-11", orderId: "ord-6", name: "Garlic Breadsticks", quantity: 1, price: 129, customizations: "None" },
  { _id: "item-12", orderId: "ord-6", name: "Choco Lava Cake", quantity: 1, price: 42, customizations: "None" },
  { _id: "item-13", orderId: "ord-7", name: "Country Special Pizza", quantity: 1, price: 329, customizations: "Size: Medium, Extra Cheese: Yes" },
  { _id: "item-14", orderId: "ord-7", name: "Pepsi Can", quantity: 1, price: 51, customizations: "None" }
];

const initialMockPayments = [
  { _id: "pay-1", orderId: "ord-1", transactionId: "TXN908123891", amount: 480, method: "UPI / PhonePe", status: "success", createdAt: "2026-06-24T12:31:00Z" },
  { _id: "pay-2", orderId: "ord-2", transactionId: "TXN908223892", amount: 590, method: "Netbanking", status: "success", createdAt: "2026-06-25T11:16:00Z" },
  { _id: "pay-3", orderId: "ord-3", transactionId: "TXN908323893", amount: 450, method: "Cash On Delivery", status: "pending", createdAt: "2026-06-25T15:10:00Z" },
  { _id: "pay-4", orderId: "ord-4", transactionId: "TXN908423894", amount: 750, method: "Credit Card", status: "refunded", createdAt: "2026-06-20T20:46:00Z" },
  { _id: "pay-5", orderId: "ord-5", transactionId: "TXN908523895", amount: 320, method: "UPI / Paytm", status: "success", createdAt: "2026-06-25T13:01:00Z" },
  { _id: "pay-6", orderId: "ord-6", transactionId: "TXN908623896", amount: 620, method: "UPI / GooglePay", status: "success", createdAt: "2026-06-22T21:11:00Z" },
  { _id: "pay-7", orderId: "ord-7", transactionId: "TXN908723897", amount: 380, method: "Cash On Delivery", status: "success", createdAt: "2026-06-25T14:55:00Z" }
];

const initialMockRefunds = [
  {
    _id: "ref-1",
    orderId: "ord-4",
    orderNumber: "PVP-9084",
    reason: "Late delivery and cold pizza. Customer refused to accept.",
    amount: 750,
    status: "approved",
    approvedBy: "Store Manager (Shubham Jamliya)",
    createdAt: "2026-06-20T21:30:00Z"
  },
  {
    _id: "ref-2",
    orderId: "ord-5",
    orderNumber: "PVP-9085",
    reason: "Incorrect toppings delivered. Wrong pizza prepared.",
    amount: 320,
    status: "pending",
    approvedBy: "--",
    createdAt: "2026-06-25T13:30:00Z"
  }
];

const initialMockComplaints = [
  {
    _id: "comp-1",
    storeId: "store-104",
    customerId: "cust-1",
    orderId: "ord-8",
    complaintType: "missing_items",
    priority: "low",
    description: "Order PVP-8001 was missing extra seasoning packets and chili flakes.",
    images: ["https://images.unsplash.com/photo-1544982503-9f984c14501a"],
    status: "resolved",
    resolution: {
      actionTaken: "Refunded ₹50 seasoning charge and added 50 loyalty points to customer profile.",
      resolvedBy: "Shubham Jamliya",
      refundAmount: 50,
      replacementOrderId: "",
      couponIssued: "SORRY50",
      resolvedAt: "2026-05-10T12:00:00Z"
    },
    resolvedBy: "Shubham Jamliya",
    createdAt: "2026-05-10T11:30:00Z",
    updatedAt: "2026-05-10T12:00:00Z"
  },
  {
    _id: "comp-2",
    storeId: "store-104",
    customerId: "cust-4",
    orderId: "ord-4",
    complaintType: "late_delivery",
    priority: "critical",
    description: "Late delivery by 45 minutes and pizza was completely cold on order PVP-9084.",
    images: ["https://images.unsplash.com/photo-1604382355076-af4b0eb60143"],
    status: "resolved",
    resolution: {
      actionTaken: "Approved full refund of ₹750 immediately and apologized for the inconvenience.",
      resolvedBy: "Shubham Jamliya",
      refundAmount: 750,
      replacementOrderId: "",
      couponIssued: "FREEPIZZA",
      resolvedAt: "2026-06-20T21:05:00Z"
    },
    resolvedBy: "Shubham Jamliya",
    createdAt: "2026-06-20T20:45:00Z",
    updatedAt: "2026-06-20T21:05:00Z"
  },
  {
    _id: "comp-3",
    storeId: "store-104",
    customerId: "cust-6",
    orderId: "ord-5",
    complaintType: "wrong_order",
    priority: "high",
    description: "Wrong toppings delivered on order PVP-9085. Onion toppings were added instead of Paneer.",
    images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591"],
    status: "investigating",
    resolution: null,
    resolvedBy: "",
    createdAt: "2026-06-25T13:20:00Z",
    updatedAt: "2026-06-25T13:20:00Z"
  },
  {
    _id: "comp-4",
    storeId: "store-104",
    customerId: "cust-2",
    orderId: "ord-2",
    complaintType: "food_quality",
    priority: "medium",
    description: "Pizza crust was burnt and too hard to chew on PVP-9082. Please check kitchen temperature settings.",
    images: [],
    status: "pending",
    resolution: null,
    resolvedBy: "",
    createdAt: "2026-06-25T11:30:00Z",
    updatedAt: "2026-06-25T11:30:00Z"
  },
  {
    _id: "comp-5",
    storeId: "store-104",
    customerId: "cust-7",
    orderId: "ord-6",
    complaintType: "rider_behavior",
    priority: "low",
    description: "Rider was rude during delivery and refused to come to the third floor for order PVP-9086.",
    images: [],
    status: "investigating",
    resolution: null,
    resolvedBy: "",
    createdAt: "2026-06-22T21:30:00Z",
    updatedAt: "2026-06-22T21:30:00Z"
  },
  {
    _id: "comp-6",
    storeId: "store-104",
    customerId: "cust-8",
    orderId: "ord-7",
    complaintType: "late_delivery",
    priority: "high",
    description: "Order PVP-9087 was delayed by more than an hour. Delivery address induction issue.",
    images: [],
    status: "resolved",
    resolution: {
      actionTaken: "Delivered a fresh hot replacement order free of cost.",
      resolvedBy: "Shubham Jamliya",
      refundAmount: 0,
      replacementOrderId: "ord-3",
      couponIssued: "COMP100",
      resolvedAt: "2026-06-25T15:30:00Z"
    },
    resolvedBy: "Shubham Jamliya",
    createdAt: "2026-06-25T15:00:00Z",
    updatedAt: "2026-06-25T15:30:00Z"
  }
];

const initialMockReviews = [
  {
    _id: "rev-1",
    storeId: "store-104",
    customerId: "cust-1",
    orderId: "ord-1",
    rating: 5,
    reviewText: "Excellent paneer toppings and hot packaging! Best Veg Pizza in Indore.",
    images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400"],
    sentiment: "Positive",
    reply: {
      text: "Thank you Aarav! We take pride in our hot deliveries and premium paneer quality.",
      repliedBy: "Store Manager (Shubham Jamliya)",
      repliedAt: "2026-06-24T14:00:00Z"
    },
    createdAt: "2026-06-24T13:10:00Z"
  },
  {
    _id: "rev-2",
    storeId: "store-104",
    customerId: "cust-2",
    orderId: "ord-2",
    rating: 4,
    reviewText: "Garlic bread was outstanding. Pizza was slightly cold but toppings were fresh.",
    images: [],
    sentiment: "Neutral",
    reply: null,
    createdAt: "2026-06-25T12:00:00Z"
  },
  {
    _id: "rev-3",
    storeId: "store-104",
    customerId: "cust-4",
    orderId: "ord-4",
    rating: 1,
    reviewText: "Very bad delivery experience, took 1.5 hours and pizza was cold and soggy.",
    images: ["https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&q=80&w=400"],
    sentiment: "Negative",
    reply: null,
    createdAt: "2026-06-20T22:00:00Z"
  },
  {
    _id: "rev-4",
    storeId: "store-104",
    customerId: "cust-7",
    orderId: "ord-5",
    rating: 5,
    reviewText: "Best Veg Pizza franchise in town. Spicy paneer was great.",
    images: [],
    sentiment: "Positive",
    reply: {
      text: "Thanks for the 5-star rating! We are glad you enjoyed the Spicy Paneer Pizza.",
      repliedBy: "Store Manager (Shubham Jamliya)",
      repliedAt: "2026-06-23T10:00:00Z"
    },
    createdAt: "2026-06-22T22:00:00Z"
  }
];


const initialMockDeliveryTracking = [
  {
    orderId: "ord-1",
    stages: [
      { status: "Order Placed", timestamp: "2026-06-24T12:30:00Z" },
      { status: "Kitchen Started", timestamp: "2026-06-24T12:35:00Z" },
      { status: "Ready", timestamp: "2026-06-24T12:47:00Z" },
      { status: "Rider Assigned", timestamp: "2026-06-24T12:49:00Z" },
      { status: "Out For Delivery", timestamp: "2026-06-24T12:51:00Z" },
      { status: "Delivered", timestamp: "2026-06-24T13:05:00Z" }
    ]
  },
  {
    orderId: "ord-2",
    stages: [
      { status: "Order Placed", timestamp: "2026-06-25T11:15:00Z" },
      { status: "Kitchen Started", timestamp: "2026-06-25T11:20:00Z" },
      { status: "Ready", timestamp: "2026-06-25T11:32:00Z" },
      { status: "Rider Assigned", timestamp: "2026-06-25T11:33:00Z" },
      { status: "Out For Delivery", timestamp: "2026-06-25T11:35:00Z" },
      { status: "Delivered", timestamp: "2026-06-25T11:49:00Z" }
    ]
  },
  {
    orderId: "ord-3",
    stages: [
      { status: "Order Placed", timestamp: "2026-06-25T15:10:00Z" },
      { status: "Kitchen Started", timestamp: "2026-06-25T15:15:00Z" }
    ]
  },
  {
    orderId: "ord-4",
    stages: [
      { status: "Order Placed", timestamp: "2026-06-20T20:45:00Z" },
      { status: "Kitchen Started", timestamp: "2026-06-20T20:50:00Z" },
      { status: "Ready", timestamp: "2026-06-20T21:05:00Z" },
      { status: "Rider Assigned", timestamp: "2026-06-20T21:10:00Z" },
      { status: "Out For Delivery", timestamp: "2026-06-20T21:15:00Z" }
    ]
  },
  {
    orderId: "ord-5",
    stages: [
      { status: "Order Placed", timestamp: "2026-06-25T13:00:00Z" },
      { status: "Kitchen Started", timestamp: "2026-06-25T13:05:00Z" },
      { status: "Ready", timestamp: "2026-06-25T13:18:00Z" },
      { status: "Rider Assigned", timestamp: "2026-06-25T13:20:00Z" },
      { status: "Out For Delivery", timestamp: "2026-06-25T13:22:00Z" },
      { status: "Delivered", timestamp: "2026-06-25T13:38:00Z" }
    ]
  },
  {
    orderId: "ord-6",
    stages: [
      { status: "Order Placed", timestamp: "2026-06-22T21:10:00Z" },
      { status: "Kitchen Started", timestamp: "2026-06-22T21:15:00Z" },
      { status: "Ready", timestamp: "2026-06-22T21:28:00Z" }
    ]
  },
  {
    orderId: "ord-7",
    stages: [
      { status: "Order Placed", timestamp: "2026-06-25T14:50:00Z" },
      { status: "Kitchen Started", timestamp: "2026-06-25T14:55:00Z" },
      { status: "Ready", timestamp: "2026-06-25T15:08:00Z" },
      { status: "Rider Assigned", timestamp: "2026-06-25T15:10:00Z" },
      { status: "Out For Delivery", timestamp: "2026-06-25T15:12:00Z" },
      { status: "Delivered", timestamp: "2026-06-25T15:28:00Z" }
    ]
  }
];

// Initialize Database Collections
let db = {
  categories: getStorageItem("categories", initialCategories),
  restaurants: getStorageItem("restaurants", initialRestaurants),
  foods: getStorageItem("foods", initialFoods),
  orders: getStorageItem("orders", initialOrders),
  tickets: getStorageItem("tickets", initialTickets),
  emergencyReports: getStorageItem("emergencyReports", initialEmergencyReports),
  stores: getStorageItem("stores", initialStores),
  managers: getStorageItem("managers", initialManagers),
  storeApprovals: getStorageItem("storeApprovals", initialStoreApprovals),
  storePerformance: getStorageItem("storePerformance", initialStorePerformance),
  operatingHours: getStorageItem("operatingHours", initialOperatingHours),
  campaigns: getStorageItem("campaigns", mockCampaigns),
  campaignPerformance: getStorageItem("campaignPerformance", mockCampaignPerformance),
  banners: getStorageItem("banners", mockBanners),
  products: getStorageItem("products", mockProducts),
  coupons: getStorageItem("coupons", mockCoupons),
  notifications: getStorageItem("notifications", mockNotifications),
  notificationLogs: getStorageItem("notificationLogs", mockNotificationLogs),
  generated_reports: getStorageItem("generated_reports", initialGeneratedReports),
  generated_order_reports: getStorageItem("generated_order_reports", initialGeneratedOrderReports),
  generated_staff_reports: getStorageItem("generated_staff_reports", initialGeneratedStaffReports),
  generated_inventory_reports: getStorageItem("generated_inventory_reports", initialGeneratedInventoryReports),
  store_riders: getStorageItem("store_riders", initialMockStoreRiders),
  live_deliveries: getStorageItem("live_deliveries", initialMockLiveDeliveries),
  tracking_data: getStorageItem("tracking_data", initialMockTrackingData),
  delivery_issues: getStorageItem("delivery_issues", initialMockDeliveryIssues),
  delivery_notifications: getStorageItem("delivery_notifications", initialMockNotifications),
  delivery_timelines: getStorageItem("delivery_timelines", initialMockDeliveryTimelines),
  staff: getStorageItem("staff", initialMockStaff),
  attendance: getStorageItem("attendance", initialMockAttendance),
  shifts: getStorageItem("shifts", initialMockShifts),
  performance: getStorageItem("performance", initialMockPerformance),
  customers: getStorageItem("customers", initialMockCustomers),
  store_orders: getStorageItem("store_orders", initialMockOrders),
  order_items: getStorageItem("order_items", initialMockOrderItems),
  payments: getStorageItem("payments", initialMockPayments),
  refunds: getStorageItem("refunds", initialMockRefunds),
  customer_complaints: getStorageItem("customer_complaints", initialMockComplaints),
  customer_reviews: getStorageItem("customer_reviews", initialMockReviews),
  delivery_tracking: getStorageItem("delivery_tracking", initialMockDeliveryTracking)
};

// Sync stores and managers to ensure new approvals data is available in existing localStorage
initialStores.forEach(s => {
  if (!db.stores.some(ds => ds._id === s._id)) {
    db.stores.push(s);
  }
});
initialManagers.forEach(m => {
  const existingIdx = db.managers.findIndex(dm => dm.id === m.id);
  if (existingIdx === -1) {
    db.managers.push(m);
  } else if (db.managers[existingIdx].name !== m.name) {
    db.managers[existingIdx] = { ...db.managers[existingIdx], ...m };
  }
});
initialStorePerformance.forEach(p => {
  const existingIdx = db.storePerformance.findIndex(dp => dp._id === p._id);
  if (existingIdx === -1) {
    db.storePerformance.push(p);
  } else {
    // If the local record has 0 revenue/orders or missing storeId (which indicates placeholder data), overwrite with seeded data
    if ((db.storePerformance[existingIdx].revenue === 0 || !db.storePerformance[existingIdx].storeId) && p.revenue > 0) {
      db.storePerformance[existingIdx] = { ...db.storePerformance[existingIdx], ...p };
    } else {
      db.storePerformance[existingIdx] = { ...p, ...db.storePerformance[existingIdx] };
    }
  }
});
initialOperatingHours.forEach(oh => {
  const existingIdx = db.operatingHours.findIndex(doh => doh._id === oh._id);
  if (existingIdx === -1) {
    db.operatingHours.push(oh);
  } else {
    db.operatingHours[existingIdx] = { ...oh, ...db.operatingHours[existingIdx] };
  }
});

// Validate/Migrate customer_complaints to ensure new fields (like priority) are populated
if (db.customer_complaints && (db.customer_complaints.length === 0 || !db.customer_complaints.some(c => c.priority))) {
  db.customer_complaints = [...initialMockComplaints];
}

// Validate/Migrate customer_reviews to ensure new fields (like sentiment) are populated
if (db.customer_reviews && (db.customer_reviews.length === 0 || !db.customer_reviews.some(r => r.sentiment))) {
  db.customer_reviews = [...initialMockReviews];
}

const saveDB = () => {
  Object.keys(db).forEach((key) => {
    setStorageItem(key, db[key]);
  });
};

saveDB();

// Request Processor
export function handleMockRequest(config) {
  const url = String(config.url || "").replace(/\\/g, "/");
  const method = String(config.method || "get").toLowerCase();
  const data = config.data ? (typeof config.data === "string" ? JSON.parse(config.data) : config.data) : null;

  console.log(`[Mock Server] [${method.toUpperCase()}] ${url}`, data);

  // Helper response builders
  const successRes = (payload) => ({ success: true, status: 200, data: { success: true, data: payload } });
  const successMsg = (msg, payload = null) => ({ success: true, status: 200, data: { success: true, message: msg, data: payload } });
  const errorRes = (msg, status = 400) => ({ success: false, status, data: { success: false, message: msg } });

  // --- ORDER REPORTS ENDPOINTS ---
  if (url.includes("/reports/orders") && !url.includes("/reports/orders/dashboard") && !url.includes("/reports/orders/summary") && !url.includes("/reports/orders/status-distribution") && !url.includes("/reports/orders/hourly") && !url.includes("/reports/orders/order-type") && !url.includes("/reports/orders/store-performance") && !url.includes("/reports/orders/list")) {
    if (method === "get") {
      const params = config.params || {};
      const startDate = params.startDate || "";
      const endDate = params.endDate || "";
      const status = params.status || "All";
      const paymentMethod = params.paymentMethod || "All";
      const orderType = params.orderType || "All";
      const couponUsed = params.couponUsed || "All";
      const search = params.search || "";
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 10;

      let filtered = [...mockDetailedOrders];

      // Filter by Date Range
      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const endTime = end.getTime();
        filtered = filtered.filter(o => {
          const time = new Date(o.createdAt).getTime();
          return time >= start && time <= endTime;
        });
      }

      // Filter by Status
      if (status !== "All") {
        filtered = filtered.filter(o => o.orderStatus.toLowerCase() === status.toLowerCase());
      }

      // Filter by Payment Method
      if (paymentMethod !== "All") {
        filtered = filtered.filter(o => {
          const pMethod = o.paymentMethod.toLowerCase();
          const filterMethod = paymentMethod.toLowerCase();
          if (filterMethod === "upi") return pMethod.includes("upi");
          if (filterMethod === "card") return pMethod.includes("card") || pMethod.includes("netbanking");
          if (filterMethod === "wallet") return pMethod.includes("wallet");
          return pMethod.includes(filterMethod);
        });
      }

      // Filter by Order Type
      if (orderType !== "All") {
        filtered = filtered.filter(o => o.orderType.toLowerCase() === orderType.toLowerCase());
      }

      // Filter by Coupon Used
      if (couponUsed !== "All") {
        if (couponUsed === "Coupon Applied") {
          filtered = filtered.filter(o => o.couponId !== null);
        } else if (couponUsed === "No Coupon") {
          filtered = filtered.filter(o => o.couponId === null);
        }
      }

      // Filter by Search Query
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(o => 
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q)
        );
      }

      // Calculate Dashboard Cards Metrics
      const totalCount = filtered.length;
      const completedCount = filtered.filter(o => o.orderStatus === "completed" || o.orderStatus === "delivered").length;
      const cancelledCount = filtered.filter(o => o.orderStatus === "cancelled").length;
      const refundCount = filtered.filter(o => o.orderStatus === "refunded").length;

      const prepOrders = filtered.filter(o => o.preparationTime > 0);
      const avgPrepTime = prepOrders.length > 0 
        ? Math.round(prepOrders.reduce((sum, o) => sum + o.preparationTime, 0) / prepOrders.length) 
        : 0;

      const delOrders = filtered.filter(o => o.orderType === "delivery" && o.deliveryTime > 0);
      const avgDeliveryTime = delOrders.length > 0 
        ? Math.round(delOrders.reduce((sum, o) => sum + o.deliveryTime, 0) / delOrders.length) 
        : 0;

      const couponOrders = filtered.filter(o => o.couponId !== null);
      const couponUsage = couponOrders.length;
      const couponPercentage = totalCount > 0 ? Math.round((couponUsage / totalCount) * 100) : 0;

      const dashboard = {
        totalOrders: totalCount,
        completedOrders: completedCount,
        cancelledOrders: cancelledCount,
        avgPreparationTime: avgPrepTime,
        avgDeliveryTime,
        refundOrders: refundCount,
        couponUsageCount: couponUsage,
        couponUsagePercentage: couponPercentage
      };

      // Charts: Orders By Status
      const statusDistribution = {
        completed: completedCount,
        cancelled: cancelledCount,
        refunded: refundCount,
        pending: filtered.filter(o => o.orderStatus === "pending" || o.orderStatus === "preparing" || o.orderStatus === "ready").length
      };

      // Charts: Peak Hours Analysis
      const hourlyMap = {};
      for (let h = 10; h <= 22; h++) {
        hourlyMap[`${h.toString().padStart(2, '0')}:00`] = 0;
      }
      filtered.forEach(o => {
        const date = new Date(o.createdAt);
        const hr = `${date.getHours().toString().padStart(2, '0')}:00`;
        if (hourlyMap[hr] !== undefined) {
          hourlyMap[hr] += 1;
        }
      });
      const hourlyOrders = Object.keys(hourlyMap).map(hour => ({
        hour,
        orders: hourlyMap[hour]
      }));

      // Charts: Order Type Distribution
      const typeDistribution = {
        delivery: { count: 0, revenue: 0 },
        takeaway: { count: 0, revenue: 0 },
        "dine-in": { count: 0, revenue: 0 }
      };
      filtered.forEach(o => {
        const type = o.orderType.toLowerCase();
        if (typeDistribution[type]) {
          typeDistribution[type].count += 1;
          typeDistribution[type].revenue += o.totalAmount;
        }
      });
      const orderTypeDistribution = Object.keys(typeDistribution).map(type => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: typeDistribution[type].count,
        revenue: typeDistribution[type].revenue,
        percentage: totalCount > 0 ? Math.round((typeDistribution[type].count / totalCount) * 100) : 0
      }));

      // Order Analytics Table - Sorting
      const sortBy = params.sortBy || "createdAt";
      const sortOrder = params.sortOrder || "desc";
      const sorted = [...filtered].sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === "createdAt") {
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
        }

        if (typeof valA === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });

      // Pagination
      const pages = Math.ceil(sorted.length / limit) || 1;
      const startIdx = (page - 1) * limit;
      const paginatedOrders = sorted.slice(startIdx, startIdx + limit);

      const orderAnalytics = paginatedOrders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customer.name,
        orderType: o.orderType,
        itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: o.totalAmount,
        preparationTime: o.preparationTime,
        deliveryTime: o.deliveryTime,
        orderStatus: o.orderStatus,
        couponCode: o.coupon ? o.coupon.code : null,
        createdAt: o.createdAt
      }));

      return successRes({
        dashboard,
        statusDistribution,
        hourlyOrders,
        orderTypeDistribution,
        orderAnalytics,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages
        }
      });
    }
  }

  // --- ORDER DETAIL ENDPOINT ---
  const orderReportDetailMatch = url.match(/\/reports\/order\/([^/]+)$/);
  if (orderReportDetailMatch && method === "get") {
    const orderId = orderReportDetailMatch[1];
    const order = mockDetailedOrders.find(o => o._id === orderId);
    if (!order) {
      return errorRes("Order details not found", 404);
    }
    return successRes({
      orderInfo: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        orderType: order.orderType,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount
      },
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: order.customer.address,
        orderHistoryCount: order.customer.orderHistoryCount
      },
      items: order.items,
      coupon: order.coupon,
      payment: {
        method: order.paymentMethod,
        status: order.paymentStatus,
        transactionId: `TXN${9000000000 + Math.floor(Math.random() * 999999999)}`,
        amountPaid: order.totalAmount
      },
      preparationTimeline: order.preparationTimeline,
      deliveryTimeline: order.deliveryTimeline,
      staff: order.staff,
      customerRating: order.customerRating
    });
  }

  // --- REFUND DETAILS ENDPOINT ---
  const refundDetailMatch = url.match(/\/reports\/refund\/([^/]+)$/);
  if (refundDetailMatch && method === "get") {
    const orderId = refundDetailMatch[1];
    const order = mockDetailedOrders.find(o => o._id === orderId);
    if (!order || !order.refund) {
      return errorRes("Refund record not found for this order", 404);
    }
    return successRes({
      refundAmount: order.refund.amount,
      reason: order.refund.reason,
      approvedBy: order.refund.approvedBy,
      status: order.refund.status,
      createdAt: order.refund.createdAt
    });
  }

  // --- EXPORT ORDERS ENDPOINT ---
  if (url.includes("/reports/export-orders") && method === "post") {
    return {
      success: true,
      status: 200,
      headers: {
        "content-type": "text/csv",
        "content-disposition": "attachment; filename=\"Orders_Report.csv\""
      },
      data: "Order ID,Number,Customer,Type,Amount,Status,Date\nord-1,PVP-1001,Aarav Sharma,delivery,₹549,completed,2026-06-25"
    };
  }

  // --- STORE PERFORMANCE ENDPOINTS ---
  if (url.includes("/reports/store/revenue/")) {
    const revMatch = url.match(/\/reports\/store\/revenue\/([^/]+)$/);
    if (revMatch && method === "get") {
      const month = decodeURIComponent(revMatch[1]);
      const details = getMockStoreMonthDetails(month);
      return successRes(details.revenueBreakdown);
    }
  }

  if (url.includes("/reports/store/expenses/")) {
    const expMatch = url.match(/\/reports\/store\/expenses\/([^/]+)$/);
    if (expMatch && method === "get") {
      const month = decodeURIComponent(expMatch[1]);
      const details = getMockStoreMonthDetails(month);
      return successRes(details.expensesBreakdown);
    }
  }

  if (url.includes("/reports/store") && method === "get") {
    const monthMatch = url.match(/\/reports\/store\/([^/]+)$/);
    if (monthMatch && !url.includes("revenue") && !url.includes("expenses")) {
      const month = decodeURIComponent(monthMatch[1]);
      return successRes(getMockStoreMonthDetails(month));
    } else if (!monthMatch) {
      const params = config.params || {};
      return successRes(generateStorePerformanceMock(params));
    }
  }

  if (url.includes("/reports/export-store") && method === "post") {
    const payload = config.data || {};
    const period = payload.period || "monthly";
    const exportType = payload.exportType || "pdf";
    let filename = `StorePerformance_Report_${period}.${exportType.toLowerCase()}`;
    return {
      success: true,
      status: 200,
      headers: {
        "content-type": exportType === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filename}"`
      },
      data: exportType === "csv" ? "Month,Revenue,Expenses,Profit\nJun 2026,650000,380000,270000" : "binary_data_placeholder"
    };
  }

  // --- DAILY SALES ENDPOINTS ---
  if (url.includes("/reports/daily-sales")) {
    const dateMatch = url.match(/\/reports\/daily-sales\/(\d{4}-\d{2}-\d{2})$/);
    if (dateMatch && method === "get") {
      const date = dateMatch[1];
      const dayData = mockDailySales.find(d => d.date === date);
      if (!dayData) {
        return errorRes("Date details not found in mock data", 404);
      }
      const paymentBreakdown = [
        { method: "Cash", transactions: dayData.paymentTransactions.cash, revenue: dayData.paymentDistribution.cash },
        { method: "UPI", transactions: dayData.paymentTransactions.upi, revenue: dayData.paymentDistribution.upi },
        { method: "Card", transactions: dayData.paymentTransactions.card, revenue: dayData.paymentDistribution.card },
        { method: "Wallet", transactions: dayData.paymentTransactions.wallet, revenue: dayData.paymentDistribution.wallet }
      ];
      return successRes({
        date: dayData.date,
        totalRevenue: dayData.revenue,
        completedOrders: dayData.completedOrders,
        cancelledOrders: dayData.cancelledOrders,
        refundAmount: dayData.refundAmount,
        paymentBreakdown,
        topSellingItems: dayData.topSellingItems,
        topCustomers: dayData.topCustomers,
        hourlySales: dayData.hourlySales
      });
    }

    if (method === "get") {
      const params = config.params || {};
      const startDate = params.startDate || "";
      const endDate = params.endDate || "";
      const paymentMethod = params.paymentMethod || "All";
      const orderType = params.orderType || "All";

      let filtered = [...mockDailySales];

      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        filtered = filtered.filter(item => {
          const d = new Date(item.date).getTime();
          return d >= start && d <= end;
        });
      }

      if (filtered.length === 0) {
        filtered = mockDailySales.slice(0, 7);
      }

      let revenue = 0;
      let totalOrders = 0;
      let cashSales = 0;
      let onlineSales = 0;
      let cancelledRevenue = 0;
      let refundAmount = 0;
      const paymentDistribution = { cash: 0, upi: 0, card: 0, wallet: 0 };
      const orderStatusDistribution = { completed: 0, cancelled: 0, refunded: 0 };
      
      const hourlyMap = {};
      for (let h = 10; h <= 22; h++) {
        hourlyMap[`${h.toString().padStart(2, '0')}:00`] = 0;
      }

      filtered.forEach(day => {
        let dayRevenue = day.revenue;
        let dayCash = day.paymentDistribution.cash;
        let dayUpi = day.paymentDistribution.upi;
        let dayCard = day.paymentDistribution.card;
        let dayWallet = day.paymentDistribution.wallet;
        let dayOnline = day.onlineSales;
        let dayDiscounts = day.discountAmount;
        let dayTaxes = day.taxAmount;

        if (paymentMethod !== "All") {
          const pMethod = paymentMethod.toLowerCase();
          if (pMethod === "cash") {
            dayRevenue = dayCash;
            dayUpi = 0;
            dayCard = 0;
            dayWallet = 0;
            dayOnline = 0;
            dayDiscounts = Math.floor(dayDiscounts * (dayCash / day.revenue));
            dayTaxes = Math.floor(dayTaxes * (dayCash / day.revenue));
          } else {
            dayCash = 0;
            if (pMethod === "upi") {
              dayRevenue = dayUpi;
              dayCard = 0;
              dayWallet = 0;
            } else if (pMethod === "card") {
              dayRevenue = dayCard;
              dayUpi = 0;
              dayWallet = 0;
            } else if (pMethod === "wallet") {
              dayRevenue = dayWallet;
              dayUpi = 0;
              dayCard = 0;
            }
            dayOnline = dayRevenue;
            dayDiscounts = Math.floor(dayDiscounts * (dayOnline / day.revenue));
            dayTaxes = Math.floor(dayTaxes * (dayOnline / day.revenue));
          }
        }

        if (orderType !== "All") {
          let factor = 0.4;
          if (orderType.toLowerCase() === "dine-in") factor = 0.3;
          if (orderType.toLowerCase() === "takeaway") factor = 0.3;

          dayRevenue = Math.floor(dayRevenue * factor);
          dayCash = Math.floor(dayCash * factor);
          dayUpi = Math.floor(dayUpi * factor);
          dayCard = Math.floor(dayCard * factor);
          dayWallet = Math.floor(dayWallet * factor);
          dayOnline = dayUpi + dayCard + dayWallet;
          dayDiscounts = Math.floor(dayDiscounts * factor);
          dayTaxes = Math.floor(dayTaxes * factor);
        }

        revenue += dayRevenue;
        totalOrders += orderType !== "All" ? Math.floor(day.totalOrders * 0.35) : day.totalOrders;
        cashSales += dayCash;
        onlineSales += dayOnline;
        cancelledRevenue += orderType !== "All" ? Math.floor(day.cancelledRevenue * 0.35) : day.cancelledRevenue;
        refundAmount += orderType !== "All" ? Math.floor(day.refundAmount * 0.35) : day.refundAmount;

        paymentDistribution.cash += dayCash;
        paymentDistribution.upi += dayUpi;
        paymentDistribution.card += dayCard;
        paymentDistribution.wallet += dayWallet;

        orderStatusDistribution.completed += orderType !== "All" ? Math.floor(day.orderStatusDistribution.completed * 0.35) : day.orderStatusDistribution.completed;
        orderStatusDistribution.cancelled += orderType !== "All" ? Math.floor(day.orderStatusDistribution.cancelled * 0.35) : day.orderStatusDistribution.cancelled;
        orderStatusDistribution.refunded += orderType !== "All" ? Math.floor(day.orderStatusDistribution.refunded * 0.35) : day.orderStatusDistribution.refunded;

        day.hourlySales.forEach(hItem => {
          let hrRev = hItem.revenue;
          if (paymentMethod !== "All") {
            const pMethod = paymentMethod.toLowerCase();
            const ratio = pMethod === "cash" ? (day.paymentDistribution.cash / day.revenue) : (day.onlineSales / day.revenue);
            hrRev = Math.floor(hrRev * ratio);
          }
          if (orderType !== "All") {
            let factor = 0.4;
            if (orderType.toLowerCase() === "dine-in") factor = 0.3;
            if (orderType.toLowerCase() === "takeaway") factor = 0.3;
            hrRev = Math.floor(hrRev * factor);
          }
          hourlyMap[hItem.time] = (hourlyMap[hItem.time] || 0) + hrRev;
        });
      });

      const avgOrderValue = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;
      const salesGrowth = filtered.length > 0 ? filtered[0].salesGrowth : 0;

      const revenueTrend = Object.keys(hourlyMap).map(time => ({
        time,
        revenue: Math.round(hourlyMap[time] / filtered.length)
      }));

      const salesSummary = filtered.map(day => {
        let dayRevenue = day.revenue;
        let dayCash = day.paymentDistribution.cash;
        let dayUpi = day.paymentDistribution.upi;
        let dayCard = day.paymentDistribution.card;
        let dayWallet = day.paymentDistribution.wallet;
        let dayDiscounts = day.discountAmount;
        let dayTaxes = day.taxAmount;
        let dayRefunds = day.refundAmount;
        let dayOrders = day.totalOrders;

        if (paymentMethod !== "All") {
          const pMethod = paymentMethod.toLowerCase();
          if (pMethod === "cash") {
            dayRevenue = dayCash;
            dayDiscounts = Math.floor(dayDiscounts * (dayCash / day.revenue));
            dayTaxes = Math.floor(dayTaxes * (dayCash / day.revenue));
            dayRefunds = Math.floor(dayRefunds * (dayCash / day.revenue));
          } else {
            dayRevenue = pMethod === "upi" ? dayUpi : pMethod === "card" ? dayCard : dayWallet;
            dayDiscounts = Math.floor(dayDiscounts * (dayRevenue / day.revenue));
            dayTaxes = Math.floor(dayTaxes * (dayRevenue / day.revenue));
            dayRefunds = Math.floor(dayRefunds * (dayRevenue / day.revenue));
          }
        }

        if (orderType !== "All") {
          let factor = 0.4;
          if (orderType.toLowerCase() === "dine-in") factor = 0.3;
          if (orderType.toLowerCase() === "takeaway") factor = 0.3;

          dayRevenue = Math.floor(dayRevenue * factor);
          dayDiscounts = Math.floor(dayDiscounts * factor);
          dayTaxes = Math.floor(dayTaxes * factor);
          dayRefunds = Math.floor(dayRefunds * factor);
          dayOrders = Math.floor(dayOrders * factor);
        }

        return {
          date: day.date,
          orders: dayOrders,
          revenue: dayRevenue,
          discounts: dayDiscounts,
          taxes: dayTaxes,
          refunds: dayRefunds,
          netSales: dayRevenue - dayRefunds - dayDiscounts + dayTaxes,
          growth: day.salesGrowth
        };
      });

      return successRes({
        revenue,
        totalOrders,
        avgOrderValue,
        cashSales,
        onlineSales,
        cancelledRevenue,
        refundAmount,
        salesGrowth,
        revenueTrend,
        paymentDistribution,
        orderStatusDistribution,
        salesSummary
      });
    }
  }

  // --- EXPORT SALES REPORT ENDPOINT ---
  if (url.includes("/reports/export-sales") && method === "post") {
    return {
      success: true,
      status: 200,
      headers: {
        "content-type": "text/csv",
        "content-disposition": "attachment; filename=\"DailySales_Report.csv\""
      },
      data: "Date,Revenue,Orders\n2026-06-25,48900,98"
    };
  }

  // --- STAFF PERFORMANCE COMPARISON ENDPOINT ---
  if (url.includes("/reports/staff-comparison") && method === "get") {
    const staffA = config.params?.staffA;
    const staffB = config.params?.staffB;
    return successRes(getMockStaffComparison(staffA, staffB));
  }

  // --- STAFF PERFORMANCE DETAIL REPORT ENDPOINT ---
  const staffDetailMatch = url.match(/\/reports\/staff\/([^/]+)$/);
  if (staffDetailMatch && method === "get" && !url.includes("summary") && !url.includes("dashboard") && !url.includes("role-distribution") && !url.includes("attendance-trend") && !url.includes("delivery-performance") && !url.includes("kitchen-performance") && !url.includes("manager-performance") && !url.includes("list")) {
    const staffId = staffDetailMatch[1];
    return successRes(getMockStaffDetails(staffId));
  }

  // --- STAFF PERFORMANCE EXPORT ENDPOINT ---
  if (url.includes("/reports/export-staff") && method === "post") {
    return {
      success: true,
      status: 200,
      headers: {
        "content-type": "text/csv",
        "content-disposition": "attachment; filename=\"StaffPerformance_Report.csv\""
      },
      data: "Staff,Role,Attendance,Orders,Avg Prep Time,Complaints,Efficiency,Rating\nChef Sanjay,Chef,96%,245,14.5m,1,98%,4.8"
    };
  }

  // --- STAFF PERFORMANCE DASHBOARD ENDPOINT ---
  if (url.includes("/reports/staff-performance") && method === "get" && !url.includes("/reports/staff/")) {
    const params = config.params || {};
    const role = params.role || "All";
    const station = params.station || "All";
    const period = params.period || "monthly";
    const search = params.search || "";
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const sortBy = params.sortBy || "efficiency";
    const sortOrder = params.sortOrder || "desc";

    let filtered = [...mockStaffPerformance];

    // Role filtering
    if (role !== "All") {
      filtered = filtered.filter(s => s.role.toLowerCase() === role.toLowerCase());
    }

    // Station filtering
    if (station !== "All") {
      filtered = filtered.filter(s => s.station.toLowerCase() === station.toLowerCase());
    }

    // Search filtering
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.role.toLowerCase().includes(q)
      );
    }

    // Aggregate Dashboard Metrics
    let totalOrders = 0;
    let totalPrepTime = 0;
    let totalComplaints = 0;
    let totalEfficiency = 0;
    let totalAttendance = 0;

    filtered.forEach(s => {
      totalOrders += s.orders;
      totalPrepTime += s.avgPrepTime;
      totalComplaints += s.complaints;
      totalEfficiency += s.efficiency;
      totalAttendance += s.attendance;
    });

    const count = filtered.length;
    const avgPrep = count > 0 ? parseFloat((totalPrepTime / count).toFixed(1)) : 12;
    const avgAttendance = count > 0 ? Math.round(totalAttendance / count) : 95;
    const avgEfficiency = count > 0 ? Math.round(totalEfficiency / count) : 94;

    const sortedRankings = [...mockStaffPerformance].sort((a, b) => b.efficiency - a.efficiency);
    const topPerformerRaw = sortedRankings[0] || mockStaffPerformance[0];

    const dashboard = {
      topPerformer: {
        name: topPerformerRaw.name,
        avatar: topPerformerRaw.profileImage,
        role: topPerformerRaw.role,
        efficiency: topPerformerRaw.efficiency,
        rating: topPerformerRaw.rating,
        ordersCompleted: topPerformerRaw.orders
      },
      avgAttendance,
      avgAttendanceTrend: 1.5,
      avgPrepTime: avgPrep,
      customerComplaints: totalComplaints,
      customerComplaintsTrend: -2,
      delayedTasks: Math.round(totalOrders * 0.03),
      staffEfficiency: avgEfficiency
    };

    // Rankings chart data
    const rankings = sortedRankings.slice(0, 5).map(s => ({
      name: s.name.split(" ")[1] ? `${s.name.split(" ")[0]} ${s.name.split(" ")[1][0]}.` : s.name,
      role: s.role,
      efficiency: s.efficiency
    }));

    // Attendance Trend chart data
    const attendanceTrend = [
      { month: "Jan", attendance: 93 },
      { month: "Feb", attendance: 94 },
      { month: "Mar", attendance: 95 },
      { month: "Apr", attendance: 92 },
      { month: "May", attendance: 96 },
      { month: "Jun", attendance: avgAttendance }
    ];

    // Complaints analysis chart data
    const complaintsAnalysis = filtered.map(s => ({
      name: s.name.split(" ")[0],
      complaints: s.complaints,
      severity: s.complaints > 2 ? "High" : s.complaints > 0 ? "Medium" : "Low"
    }));

    // Sorting Table Rows
    const sorted = [...filtered].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    const total = sorted.length;
    const pages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginated = sorted.slice(startIdx, startIdx + limit);

    return successRes({
      dashboard,
      rankings,
      attendanceTrend,
      complaintsAnalysis,
      staffPerformance: paginated,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  }

  // --- KITCHEN PERFORMANCE DELAY ANALYSIS ENDPOINT ---
  const kitchenDelayMatch = url.match(/\/reports\/kitchen\/delay\/([^/]+)$/);
  if (kitchenDelayMatch && method === "get") {
    const orderId = kitchenDelayMatch[1];
    return successRes(getMockDelayAnalysis(orderId));
  }

  // --- KITCHEN PERFORMANCE WASTE ANALYSIS ENDPOINT ---
  const kitchenWasteMatch = url.match(/\/reports\/kitchen\/waste\/([^/]+)$/);
  if (kitchenWasteMatch && method === "get") {
    const wasteId = kitchenWasteMatch[1];
    return successRes(getMockWasteAnalysis(wasteId));
  }

  // --- KITCHEN PERFORMANCE DATE DETAILS ENDPOINT ---
  const kitchenDateMatch = url.match(/\/reports\/kitchen\/(\d{4}-\d{2}-\d{2})$/);
  if (kitchenDateMatch && method === "get") {
    const date = kitchenDateMatch[1];
    return successRes(getMockKitchenDayDetails(date));
  }

  // --- KITCHEN PERFORMANCE EXPORT ENDPOINT ---
  if (url.includes("/reports/export-kitchen-performance") && method === "post") {
    return {
      success: true,
      status: 200,
      headers: {
        "content-type": "text/csv",
        "content-disposition": "attachment; filename=\"KitchenPerformance_Report.csv\""
      },
      data: "Date,Orders,Avg Prep Time,Delayed Orders,Waste %,Efficiency,Shortages\n2026-06-25,120,18,14,3.2,91,1"
    };
  }

  // --- KITCHEN PERFORMANCE DASHBOARD ENDPOINT ---
  if (url.includes("/reports/kitchen-performance") && method === "get") {
    const params = config.params || {};
    const startDate = params.startDate || "";
    const endDate = params.endDate || "";
    const station = params.station || "All";
    const staffId = params.staffId || "All";
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const sortBy = params.sortBy || "date";
    const sortOrder = params.sortOrder || "desc";

    let filtered = [...mockStoreKitchenPerformance];

    // Date filtering
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(item => {
        const d = new Date(item.date).getTime();
        return d >= start && d <= end;
      });
    }

    if (filtered.length === 0) {
      filtered = mockStoreKitchenPerformance.slice(0, 7);
    }

    // Dynamic metrics calculation
    let totalOrders = 0;
    let totalPrepTime = 0;
    let totalDelayed = 0;
    let totalWaste = 0;
    let totalEfficiency = 0;
    let totalShortages = 0;

    filtered.forEach(d => {
      totalOrders += d.orders;
      totalPrepTime += d.avgPrepTime;
      totalDelayed += d.delayedOrders;
      totalWaste += d.wastePercentage;
      totalEfficiency += d.efficiency;
      totalShortages += d.shortages;
    });

    const count = filtered.length;
    const avgPrep = Math.round(totalPrepTime / count) || 20;
    const avgWaste = parseFloat((totalWaste / count).toFixed(1)) || 3.5;
    const avgEff = Math.round(totalEfficiency / count) || 90;

    // Station completions adjustment based on filters
    const basePizzaTime = station === "Pizza Station" ? 12 : 16;
    const baseBakingTime = station === "Baking Station" ? 8 : 10;
    const basePackagingTime = station === "Packaging Station" ? 3 : 5;

    const stationPerformance = [
      { name: "Pizza Station", avgCompletionTime: basePizzaTime },
      { name: "Baking Station", avgCompletionTime: baseBakingTime },
      { name: "Packaging Station", avgCompletionTime: basePackagingTime }
    ];

    // Delay Reasons Distribution
    const delayReasons = [
      { name: "Ingredient Shortage", value: Math.round(totalDelayed * 0.4) || 8, percentage: 40 },
      { name: "Staff Shortage", value: Math.round(totalDelayed * 0.25) || 5, percentage: 25 },
      { name: "Equipment Failure", value: Math.round(totalDelayed * 0.15) || 3, percentage: 15 },
      { name: "High Order Volume", value: Math.round(totalDelayed * 0.2) || 4, percentage: 20 }
    ];

    // Preparation Trend Array
    const preparationTrend = filtered.map(item => ({
      date: item.date,
      avgPrepTime: item.avgPrepTime
    })).reverse();

    // Dashboard object
    const dashboard = {
      avgPrepTime: avgPrep,
      avgPrepTimeTrend: -4.5,
      delayedOrders: totalDelayed,
      delayedOrdersTrend: 1.2,
      kitchenEfficiency: avgEff,
      kitchenEfficiencyTrend: 3.8,
      pizzaCompletionRate: 94.2,
      pizzaCompletionRateTrend: 0.5,
      ingredientShortages: totalShortages,
      ingredientShortagesTrend: -2.0,
      foodWastePercentage: avgWaste,
      foodWastePercentageTrend: -1.2,
      kitchenUtilization: 84.5,
      kitchenUtilizationTrend: 1.5
    };

    // Sort table rows
    const sorted = [...filtered].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    // Pagination
    const total = sorted.length;
    const pages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginated = sorted.slice(startIdx, startIdx + limit);

    return successRes({
      dashboard,
      preparationTrend,
      stationPerformance,
      delayReasons,
      kitchenPerformance: paginated,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  }


  // --- ORDER REPORT ENDPOINTS ---
  if (url.includes("/reports/orders/dashboard") || url.includes("/reports/orders/summary")) {
    const storeId = config.params?.storeId;
    if (storeId && storeId !== "all") {
      return successRes({
        ...mockOrderDashboardSummary,
        totalOrders: Math.floor(mockOrderDashboardSummary.totalOrders / 3),
        completedOrders: Math.floor(mockOrderDashboardSummary.completedOrders / 3),
        cancelledOrders: Math.floor(mockOrderDashboardSummary.cancelledOrders / 3),
        refundedOrders: Math.floor(mockOrderDashboardSummary.refundedOrders / 3),
        averageOrderValue: 338.40
      });
    }
    return successRes(mockOrderDashboardSummary);
  }

  if (url.includes("/reports/orders/status-distribution")) {
    return successRes(mockOrderStatusDistribution);
  }

  if (url.includes("/reports/orders/hourly")) {
    return successRes(mockOrderHourlyHeatmap);
  }

  if (url.includes("/reports/orders/order-type")) {
    return successRes(mockOrderTypeDistribution);
  }

  if (url.includes("/reports/orders/store-performance")) {
    return successRes(mockStorePerformanceOrders);
  }

  if (url.includes("/reports/orders/list")) {
    const search = config.params?.search || "";
    let filtered = [...mockDetailedOrderReportsList];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.storeName.toLowerCase().includes(q)
      );
    }
    const sortBy = config.params?.sortBy || "createdAt";
    const sortOrder = config.params?.sortOrder || "desc";
    filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    const page = Number(config.params?.page) || 1;
    const limit = Number(config.params?.limit) || 10;
    const totalCount = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return successRes({
      orders: paginated,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  }

  if (url.includes("/reports/orders/generate") && method === "post") {
    const newRep = {
      id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      reportType: data?.reportType || "Custom",
      startDate: data?.startDate || "2026-06-23",
      endDate: data?.endDate || "2026-06-23",
      revenue: Math.floor(500000 + Math.random() * 2000000),
      orders: Math.floor(1500 + Math.random() * 5000),
      refundAmount: data?.includeRefunds ? Math.floor(10000 + Math.random() * 50000) : 0,
      status: "Completed",
      generatedBy: "Rashi Kumar (Admin)",
      createdAt: new Date().toISOString(),
      fileUrl: "#"
    };
    db.generated_order_reports.unshift(newRep);
    saveDB();
    return successRes({
      reportId: newRep.id,
      fileUrl: newRep.fileUrl,
      status: newRep.status
    });
  }

  // Single Order API Match
  const singleOrderMatch = url.match(/\/orders\/([^/]+)$/);
  if (singleOrderMatch && method === "get" && !url.includes("/reports/")) {
    const id = singleOrderMatch[1];
    return successRes({
      ...mockSingleOrderDetail,
      orderId: id,
      orderNumber: id.startsWith("ord-") ? `PVP-${id.replace("ord-", "109")}` : id
    });
  }

  // Invoice API Match
  const invoiceMatch = url.match(/\/orders\/([^/]+)\/invoice$/);
  if (invoiceMatch && method === "get") {
    const id = invoiceMatch[1];
    return successRes({
      ...mockSingleOrderDetail,
      orderId: id,
      orderNumber: id.startsWith("ord-") ? `PVP-${id.replace("ord-", "109")}` : id
    });
  }

  // --- SALES REPORT ENDPOINTS ---
  if (url.includes("/reports/sales/dashboard") || url.includes("/reports/sales/summary")) {
    const storeId = config.params?.storeId;
    if (storeId && storeId !== "all") {
      return successRes({
        ...mockDashboardSummary,
        totalRevenue: Math.floor(mockDashboardSummary.totalRevenue / 3),
        totalOrders: Math.floor(mockDashboardSummary.totalOrders / 3),
        netRevenue: Math.floor(mockDashboardSummary.netRevenue / 3),
        growthPercentage: 5.4,
      });
    }
    return successRes(mockDashboardSummary);
  }

  if (url.includes("/reports/sales/revenue-trend")) {
    const mode = config.params?.mode || "daily";
    return successRes(mockRevenueTrends[mode] || mockRevenueTrends.daily);
  }

  if (url.includes("/reports/sales/store-performance")) {
    return successRes(mockStorePerformanceList);
  }

  if (url.includes("/reports/sales/payment-distribution")) {
    return successRes(mockPaymentDistributionData);
  }

  if (url.includes("/reports/sales/top-products")) {
    return successRes(mockProductsPerformance);
  }

  if (url.includes("/reports/sales/generate") && method === "post") {
    const newRep = {
      id: `REP-2026-${Math.floor(100 + Math.random() * 900)}`,
      reportType: data?.reportType || "Custom",
      startDate: data?.startDate || "2026-06-23",
      endDate: data?.endDate || "2026-06-23",
      revenue: Math.floor(500000 + Math.random() * 2000000),
      orders: Math.floor(1500 + Math.random() * 5000),
      refundAmount: data?.includeRefunds ? Math.floor(10000 + Math.random() * 50000) : 0,
      status: "Completed",
      generatedBy: "Rashi Kumar (Admin)",
      createdAt: new Date().toISOString(),
      fileUrl: "#"
    };
    db.generated_reports.unshift(newRep);
    saveDB();
    return successRes({
      reportId: newRep.id,
      fileUrl: newRep.fileUrl,
      status: newRep.status
    });
  }

  const reportsMatch = url.match(/\/generated-reports\/([^/]+)/);
  if (reportsMatch) {
    const id = reportsMatch[1];
    if (method === "delete") {
      db.generated_reports = db.generated_reports.filter(r => r.id !== id);
      saveDB();
      return successMsg("Report deleted successfully");
    }
    if (method === "get") {
      const report = db.generated_reports.find(r => r.id === id);
      if (report) {
        return successRes({
          report,
          summary: {
            revenue: report.revenue,
            orders: report.orders,
            refunds: report.refundAmount,
            taxes: Math.floor(report.revenue * 0.05),
            netRevenue: report.revenue - report.refundAmount - Math.floor(report.revenue * 0.05),
            growthPercentage: 8.5
          },
          trend: mockRevenueTrends.daily,
          paymentSplit: mockPaymentDistributionData,
          storePerformance: mockStorePerformanceList,
          topProducts: mockProductsPerformance
        });
      }
      return errorRes("Report not found", 404);
    }
  }

  if (url.includes("/generated-reports") && method === "get") {
    const search = config.params?.search || "";
    let filtered = [...db.generated_reports];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.reportType.toLowerCase().includes(q) ||
        r.generatedBy.toLowerCase().includes(q)
      );
    }
    const sortBy = config.params?.sortBy || "createdAt";
    const sortOrder = config.params?.sortOrder || "desc";
    filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    const page = Number(config.params?.page) || 1;
    const limit = Number(config.params?.limit) || 10;
    const totalCount = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return successRes({
      reports: paginated,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  }

  // --- STORE OPERATIONS DASHBOARD WIDGETS ---
  if (url.includes("/store/dashboard/today-sales")) {
    return successRes({ todaySales: 45230, percentageChange: 12 });
  }
  if (url.includes("/store/dashboard/today-orders")) {
    return successRes({ totalOrders: 136 });
  }
  if (url.includes("/store/dashboard/active-orders")) {
    return successRes({ activeOrders: 23 });
  }
  if (url.includes("/store/dashboard/prep-time")) {
    return successRes({ avgPrepTime: 14 });
  }
  if (url.includes("/store/dashboard/pending-deliveries")) {
    return successRes({ pendingDeliveries: 8 });
  }
  if (url.includes("/store/dashboard/low-stock")) {
    return successRes({ lowStockItems: 5 });
  }
  if (url.includes("/store/dashboard/staff-duty")) {
    return successRes({ staffOnDuty: 12 });
  }
  if (url.includes("/store/dashboard/customer-rating")) {
    return successRes({ rating: 4.7 });
  }
  if (url.includes("/store/dashboard/hourly-sales")) {
    const filter = config.params?.filter || "daily";
    const data = filter === "daily"
      ? [
        { hour: "10 AM", sales: 3200 },
        { hour: "11 AM", sales: 4800 },
        { hour: "12 PM", sales: 8500 },
        { hour: "01 PM", sales: 12000 },
        { hour: "02 PM", sales: 9400 },
        { hour: "03 PM", sales: 5500 },
        { hour: "04 PM", sales: 4200 },
        { hour: "05 PM", sales: 6800 },
        { hour: "06 PM", sales: 11000 },
        { hour: "07 PM", sales: 18500 },
        { hour: "08 PM", sales: 24000 },
        { hour: "09 PM", sales: 19000 },
        { hour: "10 PM", sales: 12500 },
        { hour: "11 PM", sales: 6200 }
      ]
      : filter === "weekly"
        ? [
          { hour: "Mon", sales: 42000 },
          { hour: "Tue", sales: 48000 },
          { hour: "Wed", sales: 51000 },
          { hour: "Thu", sales: 58000 },
          { hour: "Fri", sales: 74000 },
          { hour: "Sat", sales: 92000 },
          { hour: "Sun", sales: 86000 }
        ]
        : [
          { hour: "Jan", sales: 1420000 },
          { hour: "Feb", sales: 1550000 },
          { hour: "Mar", sales: 1680000 },
          { hour: "Apr", sales: 1820000 },
          { hour: "May", sales: 2010000 },
          { hour: "Jun", sales: 1980000 }
        ];
    return successRes(data);
  }
  if (url.includes("/store/dashboard/top-products")) {
    return successRes([
      { productName: "Paneer Tikka Pizza", sold: 82, revenue: 24600 },
      { productName: "Double Cheese Margherita", sold: 68, revenue: 18360 },
      { productName: "Farmhouse Delight", sold: 54, revenue: 15120 },
      { productName: "Veg Supreme Feast", sold: 41, revenue: 13530 },
      { productName: "Capsicum Onion Classic", sold: 35, revenue: 7700 }
    ]);
  }
  if (url.includes("/store/dashboard/staff-overview")) {
    return successRes({ present: 12, late: 2, absent: 1 });
  }
  if (url.includes("/store/dashboard/order-status")) {
    return successRes({
      incoming: 5,
      preparing: 8,
      baking: 3,
      packaging: 4,
      ready: 2,
      delivered: 70,
      cancelled: 5
    });
  }
  if (url.includes("/store/dashboard/live-orders")) {
    return successRes({
      incoming: [
        { orderNumber: "PV-8850", customer: "Rohan Malhotra", amount: 640, eta: "25m", status: "Incoming" },
        { orderNumber: "PV-8849", customer: "Alok Gupta", amount: 480, eta: "20m", status: "Incoming" },
        { orderNumber: "PV-8848", customer: "Pooja Patel", amount: 550, eta: "30m", status: "Incoming" }
      ],
      preparing: [
        { orderNumber: "PV-8842", customer: "Amit Verma", amount: 590, eta: "12m", status: "Preparing" },
        { orderNumber: "PV-8841", customer: "Isha Sharma", amount: 390, eta: "15m", status: "Preparing" },
        { orderNumber: "PV-8840", customer: "Deepak Rawat", amount: 720, eta: "8m", status: "Preparing" },
        { orderNumber: "PV-8843", customer: "Neha Sen", amount: 420, eta: "14m", status: "Preparing" },
        { orderNumber: "PV-8844", customer: "Vijay Nair", amount: 650, eta: "10m", status: "Preparing" }
      ],
      ready: [
        { orderNumber: "PV-8839", customer: "Karan Singh", amount: 340, eta: "0m", status: "Ready" },
        { orderNumber: "PV-8837", customer: "Sanjay Jha", amount: 980, eta: "0m", status: "Ready" }
      ],
      delivery: [
        { orderNumber: "PV-8830", customer: "Sunil Dutt", amount: 1150, eta: "18m", status: "Out For Delivery" },
        { orderNumber: "PV-8828", customer: "Kriti Sen", amount: 460, eta: "22m", status: "Out For Delivery" }
      ]
    });
  }
  if (url.includes("/store/dashboard/kitchen-performance")) {
    return successRes({
      avgPrepTime: 13,
      delayedOrders: 3,
      pizzaStation: 80,
      bakingStation: 50,
      packagingStation: 20
    });
  }
  if (url.includes("/store/dashboard/inventory-alerts")) {
    return successRes({
      lowStock: [
        { ingredient: "Processed Cheese", availableQty: 2, minQty: 15, reorderLevel: 10, unit: "kg", supplier: "Amul Dairy Corp", severity: "Critical" },
        { ingredient: "Olives", availableQty: 0.5, minQty: 5, reorderLevel: 3, unit: "kg", supplier: "Del Monte Foods", severity: "Critical" },
        { ingredient: "Pizza Sauce", availableQty: 4, minQty: 12, reorderLevel: 8, unit: "litres", supplier: "Kissan Food Systems", severity: "Warning" },
        { ingredient: "Capsicum", availableQty: 6, minQty: 10, reorderLevel: 5, unit: "kg", supplier: "Local Mandi Vendor", severity: "Normal" }
      ]
    });
  }
  if (url.includes("/store/dashboard/delivery-overview")) {
    return successRes({
      availableRiders: 6,
      assignedRiders: 9,
      delayedDeliveries: 2
    });
  }
  if (url.includes("/store/dashboard/recent-complaints")) {
    return successRes([
      { orderNumber: "PV-8839", customer: "Rohan Malhotra", issueType: "Cold food delivered", priority: "High", status: "Open", phone: "9826012431", time: "15m ago" },
      { orderNumber: "PV-8835", customer: "Isha Sharma", issueType: "Missing beverage", priority: "Medium", status: "Open", phone: "9977544021", time: "28m ago" },
      { orderNumber: "PV-8830", customer: "Amit Verma", issueType: "Delayed courier", priority: "Low", status: "In Progress", phone: "9893012903", time: "1h ago" },
      { orderNumber: "PV-8822", customer: "Pooja Patel", issueType: "Incorrect pizza base", priority: "Critical", status: "Open", phone: "9111223344", time: "2h ago" }
    ]);
  }
  if (url.includes("/store/dashboard/activity-logs")) {
    return successRes([
      { id: 1, action: "Order PV-8842 accepted", user: "Manager (Shubham)", type: "order", timestamp: "1m ago" },
      { id: 2, action: "Margherita pizza moved to Baking", user: "Chef (Vijay)", type: "kitchen", timestamp: "5m ago" },
      { id: 3, action: "Low stock alert triggered: Paneer", user: "System", type: "inventory", timestamp: "14m ago" },
      { id: 4, action: "Rider assigned: Ramesh Singh", user: "Auto-Dispatch", type: "delivery", timestamp: "20m ago" },
      { id: 5, action: "Shift started: Assistant Manager Pooja", user: "Pooja Rawat", type: "staff", timestamp: "1h ago" }
    ]);
  }

  if (url.includes("/stores/dropdown")) {
    return successRes(mockStoresList);
  }


  // 1. Authentication & Profile
  if (
    url.includes("/food/auth/admin/login") ||
    url.includes("/auth/admin/login") ||
    url.includes("/food/auth/franchise/login") ||
    url.includes("/auth/franchise/login") ||
    url.includes("/food/auth/store/login") ||
    url.includes("/auth/store/login")
  ) {
    const email = data?.email || "";
    if (email.includes("superadmin")) {
      return {
        success: true,
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: "mockHeader.eyJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJzdXBlcmFkbWluIiwidXNlcklkIjoiYWRtaW4tMSJ9.mockSignature",
            refreshToken: "mock-superadmin-refresh-token-12345",
            user: { id: "admin-1", name: "Papa Veg Super Admin", email, role: "superadmin" }
          }
        }
      };
    } else if (email.includes("franchise") || email.includes("admin")) {
      return {
        success: true,
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: "mockHeader.eyJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJhZG1pbiIsInVzZXJJZCI6ImFkbWluLTEifQ==.mockSignature",
            refreshToken: "mock-admin-refresh-token-12345",
            user: { id: "admin-2", name: "Papa Veg Franchise Admin", email, role: "admin" }
          }
        }
      };
    }
    return errorRes("Invalid email or password");
  }

  // Store Operations Unified Login Mock
  if (url.includes("/food/auth/store/login") || url.includes("/auth/store/login")) {
    const email = data?.email || "";
    let role = "store_manager";
    let tokenPayload = "eyJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJzdG9yZV9tYW5hZ2VyIiwidXNlcklkIjoic3RvcmUtMSJ9"; // store_manager
    let name = "Store Manager";
    let id = "store-1";

    if (email.includes("supervisor")) {
      role = "kitchen_supervisor";
      tokenPayload = "eyJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJraXRjaGVuX3N1cGVydmlzb3IiLCJ1c2VySWQiOiJzdG9yZS0yIn0=";
      name = "Kitchen Supervisor";
      id = "store-2";
    } else if (email.includes("staff")) {
      role = "kitchen_staff";
      tokenPayload = "eyJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJraXRjaGVuX3N0YWZmIiwidXNlcklkIjoic3RvcmUtMyJ9";
      name = "Kitchen Chef";
      id = "store-3";
    }

    return {
      success: true,
      status: 200,
      data: {
        success: true,
        data: {
          accessToken: `mockHeader.${tokenPayload}.mockSignature`,
          refreshToken: "mock-store-refresh-token-12345",
          user: { id, name, email, role }
        }
      }
    };
  }

  // Delivery Partner Login Mock
  if (
    url.includes("/food/auth/delivery/request-otp") ||
    url.includes("/auth/delivery/request-otp") ||
    url.includes("/food/auth/delivery/send-otp") ||
    url.includes("/auth/delivery/send-otp")
  ) {
    return successRes({ otp: "1234" });
  }

  if (url.includes("/food/auth/delivery/verify-otp") || url.includes("/auth/delivery/verify-otp")) {
    const phone = data?.phone || "";
    const otp = data?.otp || "";
    
    if (otp === "1234") {
      return {
        success: true,
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: "mockHeader.eyJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJkZWxpdmVyeSIsInVzZXJJZCI6InJpZGVyLTEifQ==.mockSignature",
            refreshToken: "mock-rider-refresh-token-12345",
            user: {
              id: "rider-1",
              _id: "rider-1",
              name: "Rider V2 Mock",
              phone: phone || "6797980889",
              email: "rider@papavegpizza.com",
              status: "approved",
              profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
              walletAmount: 1500,
              refCode: "RIDER123"
            },
            needsRegistration: false
          }
        }
      };
    }
    return errorRes("Invalid OTP code", 400);
  }

  // Customer User Login Mock
  if (
    url.includes("/food/auth/user/request-otp") ||
    url.includes("/auth/user/request-otp") ||
    url.includes("/food/auth/user/send-otp") ||
    url.includes("/auth/user/send-otp")
  ) {
    return successRes({ otp: "1234" });
  }

  if (url.includes("/food/auth/user/verify-otp") || url.includes("/auth/user/verify-otp")) {
    const phone = data?.phone || "";
    const otp = data?.otp || "";
    
    if (otp === "1234") {
      return {
        success: true,
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: "mockHeader.eyJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJ1c2VyIiwidXNlcklkIjoidXNlci0xIn0=.mockSignature",
            refreshToken: "mock-user-refresh-token-12345",
            user: {
              id: "cust-1",
              _id: "cust-1",
              name: "Rashi Kumar",
              phone: phone || "9988776655",
              email: "rashi@example.com",
              role: "USER"
            },
            needsRegistration: false
          }
        }
      };
    }
    return errorRes("Invalid OTP code", 400);
  }

  if (url.includes("/food/auth/me") || url.includes("/auth/me")) {
    const isUser = config.contextModule === "user" || localStorage.getItem("user_accessToken") === "dummy_access_token";
    if (isUser) {
      let userData = {
        id: "user_dummy_12345",
        name: "",
        phone: "8770552411",
        email: "",
        profileCompleted: false
      };
      try {
        const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.role !== "superadmin" && parsed.id !== "admin-1") {
            userData = parsed;
          }
        }
      } catch (e) {}
      return {
        success: true,
        status: 200,
        data: {
          success: true,
          data: {
            user: userData
          }
        }
      };
    }

    const moduleName = config.contextModule || "admin";
    let moduleUser = null;
    try {
      const stored = localStorage.getItem(`${moduleName}_user`);
      if (stored) {
        moduleUser = JSON.parse(stored);
      }
    } catch (e) {}

    if (!moduleUser) {
      // Fallback defaults
      if (moduleName === "superadmin") {
        moduleUser = {
          id: "admin-1",
          name: "Papa Veg Super Admin",
          email: "superadmin@papavegpizza.com",
          role: "superadmin",
          profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
        };
      } else if (moduleName === "admin") {
        moduleUser = {
          id: "admin-2",
          name: "Papa Veg Franchise Admin",
          email: "franchise@papavegpizza.com",
          role: "admin",
          profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
        };
      } else {
        moduleUser = {
          id: "store-1",
          name: "Store Manager",
          email: "manager@papavegpizza.com",
          role: "store_manager",
          profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
        };
      }
    }

    return {
      success: true,
      status: 200,
      data: {
        success: true,
        data: {
          user: moduleUser
        }
      }
    };
  }

  if (url.includes("/food/user/profile/profile-image") && method === "post") {
    const defaultUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
    return successRes({ profileImage: defaultUrl });
  }

  if (url.includes("/food/user/profile") && method === "patch") {
    let userData = {};
    try {
      const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user");
      if (stored) {
        userData = JSON.parse(stored);
      }
    } catch (e) {}

    const updatedUser = {
      ...userData,
      ...data,
      phone: data.mobile || data.phone || userData.phone,
      mobile: data.mobile || data.phone || userData.mobile
    };

    try {
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      localStorage.setItem("user_user", JSON.stringify(updatedUser));
      localStorage.setItem("userProfile", JSON.stringify(updatedUser));
      
      const phone = updatedUser.phone || updatedUser.mobile;
      if (phone) {
        const completedProfiles = JSON.parse(localStorage.getItem("completed_profiles") || "{}");
        completedProfiles[phone] = updatedUser;
        localStorage.setItem("completed_profiles", JSON.stringify(completedProfiles));

        // Sync inside the users array in local storage
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const index = users.findIndex(u => {
          const cleanU = String(u.phone || u.mobile || "").replace(/\D/g, "").slice(-10);
          const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
          return cleanU === cleanPhone;
        });
        if (index > -1) {
          users[index] = { ...users[index], ...updatedUser };
        } else {
          users.push(updatedUser);
        }
        localStorage.setItem("users", JSON.stringify(users));
      }
    } catch (e) {}

    return successRes({ user: updatedUser });
  }

  if (url.includes("/food/auth/logout") || url.includes("/auth/logout")) {
    return successMsg("Logged out successfully");
  }

  // Restaurant Current & Profile Mocks
  if (url.includes("/food/restaurant/current") || url.includes("/restaurant/current")) {
    const currentRest = db.restaurants[0] || {
      id: "rest-1",
      name: "Papa Veg Pizza - Central Outlet",
      email: "central@papaveg.com",
      phone: "9876543210"
    };

    const populated = {
      id: currentRest.id,
      _id: currentRest.id,
      restaurantId: currentRest.restaurantId || "REST0001",
      name: currentRest.name,
      email: currentRest.email,
      phone: currentRest.phone,
      status: currentRest.status || "approved",
      isActive: currentRest.isActive !== false,
      isAcceptingOrders: currentRest.isAcceptingOrders !== false,
      rating: currentRest.rating || 4.8,
      totalRatings: currentRest.totalRatings || 142,
      cuisines: currentRest.cuisines || ["Italian", "Fast Food"],
      location: currentRest.location || {
        addressLine1: "Sector 15, Central Market",
        addressLine2: "",
        area: "Noida",
        city: "Delhi NCR",
        landmark: "Near Metro Station"
      },
      profileImage: currentRest.profileImage || {
        url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
        publicId: "profile-1"
      },
      coverImages: currentRest.coverImages || [
        { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop", publicId: "cover-1" }
      ],
      menuImages: currentRest.menuImages || [
        { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop", publicId: "cover-1" }
      ]
    };

    return successRes({ restaurant: populated });
  }

  if (url.includes("/food/restaurant/profile") && method === "patch") {
    if (db.restaurants && db.restaurants.length > 0) {
      db.restaurants[0] = { ...db.restaurants[0], ...data };
      saveDB();
    }
    return successMsg("Profile updated successfully", { restaurant: db.restaurants[0] });
  }

  if (url.includes("/food/restaurant/availability") && method === "patch") {
    if (db.restaurants && db.restaurants.length > 0) {
      db.restaurants[0].isAcceptingOrders = data?.isAcceptingOrders;
      saveDB();
    }
    return successMsg("Availability updated successfully", { restaurant: db.restaurants[0] });
  }

  if (url.includes("/food/restaurant/profile/profile-image") && method === "post") {
    return successRes({
      profileImage: {
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        publicId: "profile-uploaded"
      }
    });
  }

  if (url.includes("/food/restaurant/profile/menu-image") && method === "post") {
    return successRes({
      menuImage: {
        url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143",
        publicId: "menu-uploaded"
      }
    });
  }

  // 2. Sidebar Badges
  if (url.includes("/food/admin/sidebar-badges")) {
    const pendingRests = db.restaurants.filter(r => r.status === "pending").length;
    const pendingCats = db.categories.filter(c => c.status === "Draft").length;
    const pendingFds = db.foods.filter(f => !f.isApproved).length;
    const openTickets = db.tickets.filter(t => t.status === "open").length;
    return successRes({
      pendingRestaurants: pendingRests,
      pendingCategories: pendingCats,
      pendingFoods: pendingFds,
      supportTickets: openTickets
    });
  }

  // 3. Dashboard Stats
  if (url.includes("/food/admin/dashboard-stats") || url.match(/\/admin\/dashboard$/)) {
    return successRes({
      revenue: 52000,
      orders: 245,
      activeStores: 12,
      activeRiders: 34,
      lowStock: 5,
      refunds: 3,
      avgOrderValue: 212,
      customerSatisfaction: 4.7
    });
  }

  if (url.includes("/admin/dashboard/revenue")) {
    return successRes([
      { date: "Mon", revenue: 42000, orders: 198 },
      { date: "Tue", revenue: 48000, orders: 226 },
      { date: "Wed", revenue: 52000, orders: 245 },
      { date: "Thu", revenue: 50000, orders: 235 },
      { date: "Fri", revenue: 58000, orders: 270 },
      { date: "Sat", revenue: 72000, orders: 340 },
      { date: "Sun", revenue: 65000, orders: 310 }
    ]);
  }

  if (url.includes("/admin/dashboard/live-orders")) {
    return successRes([
      { id: "PVP-9042", store: "Papa Veg Pizza - Indore Central", customer: "Rohan Malhotra", status: "preparing", time: "08:24 PM", amount: 450, phone: "9826012345", address: "12, Palasia Square, Indore", items: [{ name: "Paneer Tikka Pizza", quantity: 1, price: 399 }, { name: "Pepsi", quantity: 1, price: 51 }], payment: "Online - Paid", assignedStaff: { kitchen: "Chef Anil", rider: "Karan Singh" }, notes: "Extra spicy, double cheese" },
      { id: "PVP-9041", store: "Papa Veg Pizza - Bhopal Zone", customer: "Isha Sharma", status: "confirmed", time: "08:28 PM", amount: 590, phone: "9893054321", address: "Plot 45, Maharana Pratap Nagar, Bhopal", items: [{ name: "Veg Supreme Pizza", quantity: 1, price: 499 }, { name: "Garlic Bread", quantity: 1, price: 91 }], payment: "COD - Unpaid", assignedStaff: { kitchen: "Chef Sunita", rider: "Pending Allocation" }, notes: "Awaiting preparation start" },
      { id: "PVP-9039", store: "Papa Veg Pizza - Ujjain Branch", customer: "Amit Verma", status: "baking", time: "08:15 PM", amount: 380, phone: "9752098765", address: "102, Freeganj, Ujjain", items: [{ name: "Margherita Pizza", quantity: 2, price: 190 }], payment: "Online - Paid", assignedStaff: { kitchen: "Chef Anil", rider: "Rahul Dev" }, notes: "No onions" },
      { id: "PVP-9038", store: "Papa Veg Pizza - Gwalior Hub", customer: "Pooja Patel", status: "packed", time: "08:10 PM", amount: 320, phone: "9977055443", address: "G-4, Deen Dayal Nagar, Gwalior", items: [{ name: "Farmhouse Delight Pizza", quantity: 1, price: 320 }], payment: "Online - Paid", assignedStaff: { kitchen: "Chef Manoj", rider: "Vikram Rathore" }, notes: "Delivery before 9 PM" },
      { id: "PVP-9036", store: "Papa Veg Pizza - Indore Central", customer: "Deepak Rawat", status: "out_for_delivery", time: "08:02 PM", amount: 520, phone: "9826099887", address: "Flat 304, Royal Palms, Indore", items: [{ name: "Tandoori Paneer Pizza", quantity: 1, price: 421 }, { name: "Choco Lava Cake", quantity: 1, price: 99 }], payment: "Online - Paid", assignedStaff: { kitchen: "Chef Anil", rider: "Rahul Dev" }, notes: "Leave at security gate" }
    ]);
  }

  if (url.includes("/admin/dashboard/store-performance")) {
    return successRes([
      { name: "Indore Central", orders: 120, revenue: 324000, rating: 4.8, completion: 98 },
      { name: "Bhopal Zone", orders: 95, revenue: 256000, rating: 4.6, completion: 96 },
      { name: "Ujjain Branch", orders: 60, revenue: 162000, rating: 4.4, completion: 94 },
      { name: "Gwalior Hub", orders: 50, revenue: 135000, rating: 4.5, completion: 95 },
      { name: "Jabalpur Outlet", orders: 40, revenue: 108000, rating: 4.2, completion: 92 },
      { name: "Dewas Hub", orders: 30, revenue: 81000, rating: 4.3, completion: 93 },
      { name: "Pithampur Point", orders: 25, revenue: 67000, rating: 4.1, completion: 90 },
      { name: "Ratlam Outlet", orders: 22, revenue: 59000, rating: 4.5, completion: 96 },
      { name: "Sagar Hub", orders: 18, revenue: 48000, rating: 4.0, completion: 89 },
      { name: "Rewa Branch", orders: 15, revenue: 40000, rating: 4.2, completion: 91 }
    ]);
  }

  if (url.includes("/admin/dashboard/inventory-alerts")) {
    return successRes([
      { ingredient: "Processed Pizza Cheese", store: "Indore Central", currentStock: 12, reorderLevel: 50, unit: "kg" },
      { ingredient: "Wheat Pizza Dough Base", store: "Ujjain Branch", currentStock: 14, reorderLevel: 80, unit: "units" },
      { ingredient: "Fresh Diced Paneer cubes", store: "Bhopal Zone", currentStock: 8, reorderLevel: 30, unit: "kg" },
      { ingredient: "Sweet Corn Kernels", store: "Gwalior Hub", currentStock: 25, reorderLevel: 20, unit: "kg" },
      { ingredient: "Chipotle & Jalapeno Dips", store: "Indore Central", currentStock: 35, reorderLevel: 100, unit: "tubes" }
    ]);
  }

  if (url.includes("/admin/dashboard/delivery-performance")) {
    return successRes({
      metrics: {
        activeRiders: 34,
        deliveredOrders: 215,
        avgDeliveryTime: 24,
        failedDeliveries: 2
      },
      hourlyChart: [
        { hour: "12 PM", deliveries: 25 },
        { hour: "2 PM", deliveries: 32 },
        { hour: "4 PM", deliveries: 18 },
        { hour: "6 PM", deliveries: 45 },
        { hour: "8 PM", deliveries: 65 },
        { hour: "10 PM", deliveries: 30 }
      ]
    });
  }

  if (url.includes("/admin/dashboard/customer-activity")) {
    return successRes({
      newCustomers: 45,
      repeatCustomers: 120,
      loyaltyMembers: 350,
      avgRating: 4.7
    });
  }

  if (url.includes("/search") || url.match(/\/search$/)) {
    const q = String(config.params?.q || "").toLowerCase().trim();
    if (!q) {
      return successRes({ orders: [], stores: [], products: [], customers: [], riders: [] });
    }

    // Filter local entities based on search query
    const filteredOrders = db.orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q)
    );

    const filteredStores = db.restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );

    const filteredProducts = db.foods.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q)
    );

    // Simulated customers from orders
    const allCustomers = [
      { name: "Rashi Kumar", phone: "9988776655", email: "rashi@example.com" },
      { name: "Amit Sharma", phone: "9988776654", email: "amit@example.com" },
      { name: "Rohan Malhotra", phone: "9826012345", email: "rohan@example.com" },
      { name: "Isha Sharma", phone: "9893054321", email: "isha@example.com" }
    ];
    const filteredCustomers = allCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );

    const allRiders = [
      { name: "Ramesh Rider", phone: "9876543230" },
      { name: "Suresh Rider", phone: "9876543231" },
      { name: "Rahul Dev", phone: "9840212903" },
      { name: "Karan Singh", phone: "9752098765" }
    ];
    const filteredRiders = allRiders.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q)
    );

    return successRes({
      orders: filteredOrders,
      stores: filteredStores,
      products: filteredProducts,
      customers: filteredCustomers,
      riders: filteredRiders
    });
  }

  // 4. Categories Management
  if (url.includes("/food/admin/categories")) {
    if (method === "get") {
      return successRes(db.categories);
    }
    if (method === "post") {
      const newCat = {
        id: `cat-${Date.now()}`,
        name: data?.name || "New Category",
        status: data?.status || "Active",
        description: data?.description || "",
        order: db.categories.length + 1,
        isGlobal: Boolean(data?.isGlobal),
        isApproved: true
      };
      db.categories.push(newCat);
      saveDB();
      return successMsg("Category created successfully", newCat);
    }

    // Match id parameter e.g. /food/admin/categories/cat-1
    const match = url.match(/\/food\/admin\/categories\/([^/]+)/);
    if (match) {
      const id = match[1];
      if (method === "patch") {
        const catIdx = db.categories.findIndex(c => c.id === id);
        if (catIdx !== -1) {
          db.categories[catIdx] = { ...db.categories[catIdx], ...data };
          saveDB();
          return successMsg("Category updated successfully", db.categories[catIdx]);
        }
        return errorRes("Category not found", 404);
      }
      if (method === "delete") {
        db.categories = db.categories.filter(c => c.id !== id);
        saveDB();
        return successMsg("Category deleted successfully");
      }
    }
  }

  // Categories approval and toggles
  const catToggleMatch = url.match(/\/food\/admin\/categories\/([^/]+)\/toggle/);
  if (catToggleMatch) {
    const id = catToggleMatch[1];
    const catIdx = db.categories.findIndex(c => c.id === id);
    if (catIdx !== -1) {
      db.categories[catIdx].status = db.categories[catIdx].status === "Active" ? "Draft" : "Active";
      saveDB();
      return successMsg("Category status toggled successfully", db.categories[catIdx]);
    }
    return errorRes("Category not found", 404);
  }

  const catApproveMatch = url.match(/\/food\/admin\/categories\/([^/]+)\/approve/);
  if (catApproveMatch) {
    const id = catApproveMatch[1];
    const catIdx = db.categories.findIndex(c => c.id === id);
    if (catIdx !== -1) {
      db.categories[catIdx].status = "Active";
      db.categories[catIdx].isApproved = true;
      saveDB();
      return successMsg("Category approved successfully", db.categories[catIdx]);
    }
    return errorRes("Category not found", 404);
  }

  // 5. Restaurants Management
  if (url.includes("/food/admin/restaurants")) {
    if (method === "get") {
      if (url.includes("/pending")) {
        return successRes(db.restaurants.filter(r => r.status === "pending"));
      }
      return successRes(db.restaurants);
    }
    if (method === "post") {
      const newRest = {
        id: `rest-${Date.now()}`,
        name: data?.name || "New Outlet",
        email: data?.email || "",
        phone: data?.phone || "",
        address: data?.address || "",
        status: "approved",
        isActive: true,
        cuisines: data?.cuisines || [],
        commission: Number(data?.commission || 15)
      };
      db.restaurants.push(newRest);
      saveDB();
      return successMsg("Restaurant created successfully", newRest);
    }

    const match = url.match(/\/food\/admin\/restaurants\/([^/]+)/);
    if (match) {
      const id = match[1];
      if (method === "patch") {
        const restIdx = db.restaurants.findIndex(r => r.id === id);
        if (restIdx !== -1) {
          db.restaurants[restIdx] = { ...db.restaurants[restIdx], ...data };
          saveDB();
          return successMsg("Restaurant details updated", db.restaurants[restIdx]);
        }
        return errorRes("Restaurant not found", 404);
      }
      if (method === "delete") {
        db.restaurants = db.restaurants.filter(r => r.id !== id);
        saveDB();
        return successMsg("Restaurant deleted successfully");
      }
    }
  }

  // Restaurant approvals
  const restApproveMatch = url.match(/\/food\/admin\/restaurants\/([^/]+)\/approve/);
  if (restApproveMatch) {
    const id = restApproveMatch[1];
    const restIdx = db.restaurants.findIndex(r => r.id === id);
    if (restIdx !== -1) {
      db.restaurants[restIdx].status = "approved";
      db.restaurants[restIdx].isActive = true;
      saveDB();
      return successMsg("Restaurant approved successfully", db.restaurants[restIdx]);
    }
    return errorRes("Restaurant not found", 404);
  }

  const restRejectMatch = url.match(/\/food\/admin\/restaurants\/([^/]+)\/reject/);
  if (restRejectMatch) {
    const id = restRejectMatch[1];
    const restIdx = db.restaurants.findIndex(r => r.id === id);
    if (restIdx !== -1) {
      db.restaurants[restIdx].status = "rejected";
      db.restaurants[restIdx].isActive = false;
      saveDB();
      return successMsg("Restaurant application rejected", db.restaurants[restIdx]);
    }
    return errorRes("Restaurant not found", 404);
  }

  // 6. Food Catalog (Products)
  if (url.includes("/food/admin/foods")) {
    if (method === "get") {
      if (url.includes("/pending-approvals")) {
        return successRes(db.foods.filter(f => !f.isApproved));
      }
      return successRes(db.foods);
    }
    if (method === "post") {
      const categoryItem = db.categories.find(c => c.id === data?.category);
      const newFood = {
        id: `food-${Date.now()}`,
        name: data?.name || "New Food Item",
        category: data?.category || "",
        categoryName: categoryItem ? categoryItem.name : "Uncategorized",
        price: Number(data?.price || 0),
        description: data?.description || "",
        status: data?.status || "Active",
        image: data?.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591",
        isVeg: data?.isVeg !== false,
        isApproved: true
      };
      db.foods.push(newFood);
      saveDB();
      return successMsg("Product created successfully", newFood);
    }

    const match = url.match(/\/food\/admin\/foods\/([^/]+)/);
    if (match) {
      const id = match[1];
      if (method === "patch") {
        const foodIdx = db.foods.findIndex(f => f.id === id);
        if (foodIdx !== -1) {
          db.foods[foodIdx] = { ...db.foods[foodIdx], ...data };
          saveDB();
          return successMsg("Product updated successfully", db.foods[foodIdx]);
        }
        return errorRes("Product not found", 404);
      }
      if (method === "delete") {
        db.foods = db.foods.filter(f => f.id !== id);
        saveDB();
        return successMsg("Product deleted successfully");
      }
    }
  }

  // Food approvals
  const foodApproveMatch = url.match(/\/food\/admin\/foods\/([^/]+)\/approve/);
  if (foodApproveMatch) {
    const id = foodApproveMatch[1];
    const foodIdx = db.foods.findIndex(f => f.id === id);
    if (foodIdx !== -1) {
      db.foods[foodIdx].isApproved = true;
      saveDB();
      return successMsg("Product approved successfully", db.foods[foodIdx]);
    }
    return errorRes("Product not found", 404);
  }

  const foodRejectMatch = url.match(/\/food\/admin\/foods\/([^/]+)\/reject/);
  if (foodRejectMatch) {
    const id = foodRejectMatch[1];
    const foodIdx = db.foods.findIndex(f => f.id === id);
    if (foodIdx !== -1) {
      db.foods = db.foods.filter(f => f.id !== id);
      saveDB();
      return successMsg("Product registration rejected & removed", null);
    }
    return errorRes("Product not found", 404);
  }

  // 7. Orders Management
  if (url.includes("/food/admin/orders")) {
    if (method === "get") {
      const match = url.match(/\/food\/admin\/orders\/([^/]+)/);
      if (match) {
        const id = match[1];
        const order = db.orders.find(o => o.id === id);
        if (order) return successRes(order);
        return errorRes("Order not found", 404);
      }
      return successRes(db.orders);
    }
  }

  // 8. Support tickets
  if (url.includes("/food/admin/support-tickets")) {
    if (method === "get") {
      return successRes(db.tickets);
    }
    const match = url.match(/\/food\/admin\/support-tickets\/([^/]+)/);
    if (match) {
      const id = match[1];
      if (method === "patch") {
        const ticketIdx = db.tickets.findIndex(t => t.id === id);
        if (ticketIdx !== -1) {
          db.tickets[ticketIdx] = { ...db.tickets[ticketIdx], ...data };
          saveDB();
          return successMsg("Ticket status updated", db.tickets[ticketIdx]);
        }
        return errorRes("Ticket not found", 404);
      }
    }
  }

  // 9. Delivery Partners and Emergencies
  if (url.includes("/food/admin/delivery/partners")) {
    return successRes([
      { id: "del-1", name: "Ramesh Rider", phone: "9876543230", status: "online", vehicleNumber: "DL-3S-AQ-1234", vehicleType: "Bike" },
      { id: "del-2", name: "Suresh Rider", phone: "9876543231", status: "offline", vehicleNumber: "DL-3S-AQ-1235", vehicleType: "Electric Scooter" }
    ]);
  }

  if (url.includes("/food/admin/delivery/join-requests")) {
    return successRes([
      { id: "del-req-1", name: "Vikram Singh", phone: "9876543232", vehicleType: "Bike", status: "pending" }
    ]);
  }

  if (url.includes("/food/admin/safety-emergency-reports")) {
    return successRes(db.emergencyReports);
  }

  // 10. Settings & Fallbacks
  if (url.includes("/food/admin/business-settings")) {
    return successRes({
      name: "Papa Veg Pizza",
      logo: "/assets/logo1.png",
      favicon: "/favicon.ico",
      contactEmail: "info@papavegpizza.com",
      contactPhone: "+91 9988776655",
      taxRate: 5,
      deliveryFeePerKm: 15,
      minimumOrderValue: 150
    });
  }

  if (url.includes("/food/admin/fee-settings") || url.includes("/food/admin/referral-settings")) {
    return successRes({ success: true });
  }

  // --- STORES MANAGEMENT MOCK ENDPOINTS ---

  // GET /users/:id
  const userIdMatch = url.match(/\/users\/([^/]+)$/);
  if (userIdMatch && method === "get") {
    const id = userIdMatch[1];
    const mgr = db.managers.find(m => m.id === id);
    if (mgr) return successRes(mgr);
    return errorRes("User not found", 404);
  }

  // GET /users (managers or staff)
  if (url.includes("/users")) {
    const role = config.params?.role || "";
    if (role === "store_manager") {
      return successRes(db.managers);
    }
    // Return staff for this store
    return successRes([
      { name: "Suresh Patel", role: "Kitchen Chef", phone: "9826011122", status: "On Duty" },
      { name: "Rahul Deshmukh", role: "Kitchen Helper", phone: "9752099988", status: "On Duty" },
      { name: "Amit Yadav", role: "Delivery Rider", phone: "9977088822", status: "Active" },
      { name: "Sunita Verma", role: "Cashier", phone: "9893044455", status: "On Duty" }
    ]);
  }

  // GET /orders?storeId=
  if (url.includes("/orders") && config.params?.storeId) {
    return successRes([
      { id: "PVP-9042", customer: "Rohan Malhotra", amount: 450, status: "delivered", createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: "PVP-9041", customer: "Isha Sharma", amount: 590, status: "preparing", createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: "PVP-9039", customer: "Amit Verma", amount: 380, status: "preparing", createdAt: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: "PVP-9038", customer: "Pooja Patel", amount: 320, status: "delivered", createdAt: new Date(Date.now() - 75 * 60000).toISOString() },
      { id: "PVP-9036", customer: "Deepak Rawat", amount: 520, status: "cancelled", createdAt: new Date(Date.now() - 120 * 60000).toISOString() }
    ]);
  }

  // GET /inventory?storeId=
  if (url.includes("/inventory") && config.params?.storeId) {
    return successRes([
      { item: "Processed Pizza Cheese", quantity: "12 kg", threshold: "50 kg", status: "Low Stock" },
      { item: "Wheat Pizza Dough Base", quantity: "80 units", threshold: "100 units", status: "Low Stock" },
      { item: "Fresh Diced Paneer Cubes", quantity: "18 kg", threshold: "15 kg", status: "In Stock" },
      { item: "Sweet Corn Kernels", quantity: "25 kg", threshold: "20 kg", status: "In Stock" },
      { item: "Tomato Pizza Sauce", quantity: "35 litres", threshold: "40 litres", status: "Low Stock" }
    ]);
  }

  // GET /reviews?storeId=
  if (url.includes("/reviews") && config.params?.storeId) {
    return successRes([
      { rating: 5, comment: "Superb pizza! Extremely cheesy and hot. Highly recommended.", customer: "Rajesh Joshi", date: "2026-06-19" },
      { rating: 4, comment: "Good taste, garlic bread was also nice. Timely delivery.", customer: "Shweta Tiwari", date: "2026-06-18" },
      { rating: 5, comment: "Papa Veg Pizza Indore has the best Margherita in town!", customer: "Karan Johar", date: "2026-06-15" }
    ]);
  }

  // GET /stores/dashboard-kpis
  if (url.includes("/stores/dashboard-kpis")) {
    const unarchived = db.stores.filter(s => s.isArchived !== true);
    const activeStores = unarchived.filter(s => s.status === "Active");
    const openNow = activeStores.filter(s => s.isOpen === true).length;
    const closedStores = unarchived.filter(s => s.status === "Closed").length;
    const totalRating = unarchived.reduce((sum, s) => sum + (s.averageRating || 0), 0);
    const avgRating = unarchived.length > 0 ? (totalRating / unarchived.length).toFixed(1) : "0.0";

    return successRes({
      totalStores: unarchived.length,
      activeStoresCount: activeStores.length,
      openNowCount: openNow,
      closedStoresCount: closedStores,
      averageRating: parseFloat(avgRating),
      ordersToday: 1246
    });
  }

  // --- CAMPAIGNS MARKETING MOCKS ---
  if (url.includes("/campaign-performance/")) {
    const id = url.split("/").pop();
    const performance = db.campaignPerformance[id] || {
      _id: `perf-${id}`,
      campaignId: id,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ordersGenerated: 0,
      revenueGenerated: 0,
      roi: 0,
      updatedAt: new Date().toISOString(),
      dailyBreakdown: []
    };

    // Add calculated CTR & Conversion percentages
    const ctr = performance.impressions > 0 ? ((performance.clicks / performance.impressions) * 100).toFixed(2) : "0.00";
    const conversionRate = performance.clicks > 0 ? ((performance.conversions / performance.clicks) * 100).toFixed(2) : "0.00";

    const campaign = db.campaigns.find(c => c._id === id);
    return successRes({
      campaign,
      performance: {
        ...performance,
        ctr,
        conversionRate
      }
    });
  }

  if (url.includes("/campaigns")) {
    if (method === "get") {
      const idMatch = url.match(/\/campaigns\/([^/]+)$/);
      if (idMatch) {
        const id = idMatch[1];
        const campaign = db.campaigns.find(c => c._id === id);
        if (campaign) return successRes(campaign);
        return errorRes("Campaign not found", 404);
      }
      return successRes(db.campaigns);
    }
    if (method === "post") {
      const newCamp = {
        ...data,
        _id: `camp-${Date.now()}`,
        status: data?.status || "draft",
        createdBy: "Shubham Jamliya",
        createdAt: new Date().toISOString()
      };
      db.campaigns.unshift(newCamp);

      // Create empty performance entry
      db.campaignPerformance[newCamp._id] = {
        _id: `perf-${Date.now()}`,
        campaignId: newCamp._id,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ordersGenerated: 0,
        revenueGenerated: 0,
        roi: 0,
        updatedAt: new Date().toISOString(),
        dailyBreakdown: []
      };

      saveDB();
      return successMsg("Campaign created successfully", newCamp);
    }

    const match = url.match(/\/campaigns\/([^/]+)$/);
    if (match) {
      const id = match[1];
      if (method === "put" || method === "patch") {
        const idx = db.campaigns.findIndex(c => c._id === id);
        if (idx !== -1) {
          db.campaigns[idx] = { ...db.campaigns[idx], ...data };
          saveDB();
          return successMsg("Campaign updated successfully", db.campaigns[idx]);
        }
        return errorRes("Campaign not found", 404);
      }
      if (method === "delete") {
        const idx = db.campaigns.findIndex(c => c._id === id);
        if (idx !== -1) {
          const removed = db.campaigns[idx];
          db.campaigns = db.campaigns.filter(c => c._id !== id);
          delete db.campaignPerformance[id];
          saveDB();
          return successMsg(`Campaign "${removed.campaignName}" deleted successfully`);
        }
        return errorRes("Campaign not found", 404);
      }
    }
  }

  // --- BANNERS MARKETING MOCKS ---
  if (url.includes("/banners")) {
    if (method === "get") {
      const idMatch = url.match(/\/banners\/([^/]+)$/);
      if (idMatch) {
        const id = idMatch[1];
        const banner = db.banners.find(b => b._id === id);
        if (banner) return successRes(banner);
        return errorRes("Banner not found", 404);
      }

      let bannersList = [...db.banners];
      const params = config.params || {};
      const search = params.search || "";
      const status = params.status || "All";
      const redirectType = params.redirectType || "All";
      const storeId = params.storeId || "All";

      if (search) {
        const q = search.toLowerCase();
        bannersList = bannersList.filter(b => b.title?.toLowerCase().includes(q) || b.subtitle?.toLowerCase().includes(q));
      }

      if (status !== "All") {
        bannersList = bannersList.filter(b => {
          const now = new Date();
          if (status.toLowerCase() === "active") {
            const isNotExpired = new Date(b.endDate) >= now;
            const isStarted = new Date(b.startDate) <= now;
            return b.status === "active" && isNotExpired && isStarted;
          }
          if (status.toLowerCase() === "expired") {
            return new Date(b.endDate) < now;
          }
          if (status.toLowerCase() === "scheduled") {
            return new Date(b.startDate) > now;
          }
          return b.status === status.toLowerCase();
        });
      }

      if (redirectType !== "All") {
        bannersList = bannersList.filter(b => b.redirectType === redirectType.toLowerCase());
      }

      if (storeId !== "All" && storeId) {
        bannersList = bannersList.filter(b => !b.stores || b.stores.length === 0 || b.stores.includes(storeId));
      }

      return successRes(bannersList);
    }

    if (method === "post") {
      const newBanner = {
        ...data,
        _id: `banner-${Date.now()}`,
        status: data?.status || "inactive",
        createdBy: "Shubham Jamliya",
        createdAt: new Date().toISOString()
      };
      db.banners.unshift(newBanner);
      saveDB();
      return successMsg("Banner created successfully", newBanner);
    }

    const match = url.match(/\/banners\/([^/]+)$/);
    if (match) {
      const id = match[1];
      if (method === "put" || method === "patch") {
        const idx = db.banners.findIndex(b => b._id === id);
        if (idx !== -1) {
          db.banners[idx] = { ...db.banners[idx], ...data };
          saveDB();
          return successMsg("Banner updated successfully", db.banners[idx]);
        }
        return errorRes("Banner not found", 404);
      }
      if (method === "delete") {
        const idx = db.banners.findIndex(b => b._id === id);
        if (idx !== -1) {
          const removed = db.banners[idx];
          db.banners = db.banners.filter(b => b._id !== id);
          saveDB();
          return successMsg(`Banner "${removed.title}" deleted successfully`);
        }
        return errorRes("Banner not found", 404);
      }
    }
  }

  // --- IMAGE UPLOAD MOCK ---
  if (url.includes("/upload")) {
    if (method === "post") {
      const mockImageUrls = [
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1200&q=80"
      ];
      const randomUrl = mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];
      return successRes({ imageUrl: randomUrl });
    }
  }

  // --- ADDITIONAL MARKETING GETTERS ---
  if (url.includes("/products") && method === "get") {
    return successRes(db.products);
  }

  if (url.includes("/coupons") && method === "get") {
    return successRes(db.coupons);
  }

  // GET /stores/:id/performance
  if (url.match(/\/stores\/([^/]+)\/performance$/)) {
    const match = url.match(/\/stores\/([^/]+)\/performance$/);
    const id = match[1];
    const store = db.stores.find(s => s._id === id);
    if (!store) return errorRes("Store not found", 404);

    return successRes({
      ordersToday: Math.floor(Math.random() * 50) + 20,
      weeklyOrders: Math.floor(Math.random() * 300) + 150,
      monthlyRevenue: Math.floor(Math.random() * 200000) + 100000,
      averageRating: store.averageRating || 4.5,
      cancellationRate: "1.2%",
      completionRate: "98.8%",
      revenueTrend: [
        { name: "Mon", revenue: 12000 },
        { name: "Tue", revenue: 15000 },
        { name: "Wed", revenue: 18000 },
        { name: "Thu", revenue: 14000 },
        { name: "Fri", revenue: 22000 },
        { name: "Sat", revenue: 28000 },
        { name: "Sun", revenue: 25000 }
      ],
      ordersTrend: [
        { name: "Mon", orders: 40 },
        { name: "Tue", orders: 50 },
        { name: "Wed", orders: 60 },
        { name: "Thu", orders: 45 },
        { name: "Fri", orders: 75 },
        { name: "Sat", orders: 95 },
        { name: "Sun", orders: 85 }
      ],
      topProducts: [
        { name: "Veg Supreme Pizza", sales: 120 },
        { name: "Margherita Pizza", sales: 95 },
        { name: "Garlic Breadsticks", sales: 80 }
      ],
      customerRatings: [
        { rating: "5 Star", count: 140 },
        { rating: "4 Star", count: 45 },
        { rating: "3 Star", count: 12 },
        { rating: "2 Star", count: 3 },
        { rating: "1 Star", count: 1 }
      ]
    });
  }

  // GET /stores/:id/hours
  if (url.match(/\/stores\/([^/]+)\/hours$/)) {
    const match = url.match(/\/stores\/([^/]+)\/hours$/);
    const id = match[1];
    const store = db.stores.find(s => s._id === id);
    if (!store) return errorRes("Store not found", 404);

    const schedule = store.operatingHours || [
      { day: "Monday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
      { day: "Tuesday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
      { day: "Wednesday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
      { day: "Thursday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
      { day: "Friday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
      { day: "Saturday", openTime: "11:00", closeTime: "23:30", isHoliday: false },
      { day: "Sunday", openTime: "11:00", closeTime: "23:30", isHoliday: false }
    ];
    return successRes(schedule);
  }

  // PATCH /stores/:id/status
  if (method === "patch" && url.match(/\/stores\/([^/]+)\/status$/)) {
    const match = url.match(/\/stores\/([^/]+)\/status$/);
    const id = match[1];
    const storeIdx = db.stores.findIndex(s => s._id === id);
    if (storeIdx !== -1) {
      db.stores[storeIdx].status = data.status;
      db.stores[storeIdx].isOpen = data.status === "Active";
      db.stores[storeIdx].statusChangeReason = data.reason || "";
      db.stores[storeIdx].updatedAt = new Date().toISOString();
      saveDB();
      return successMsg("Store status updated successfully", db.stores[storeIdx]);
    }
    return errorRes("Store not found", 404);
  }

  // PATCH /stores/:id/hours
  if (method === "patch" && url.match(/\/stores\/([^/]+)\/hours$/)) {
    const match = url.match(/\/stores\/([^/]+)\/hours$/);
    const id = match[1];
    const storeIdx = db.stores.findIndex(s => s._id === id);
    if (storeIdx !== -1) {
      db.stores[storeIdx].operatingHours = data.hours || data;
      db.stores[storeIdx].updatedAt = new Date().toISOString();
      saveDB();
      return successMsg("Operating hours updated successfully", db.stores[storeIdx]);
    }
    return errorRes("Store not found", 404);
  }

  // PATCH or DELETE or GET /stores/:id
  const storeIdMatch = url.match(/\/stores\/([^/]+)$/);
  if (storeIdMatch) {
    const id = storeIdMatch[1];
    const storeIdx = db.stores.findIndex(s => s._id === id);

    if (method === "get") {
      if (storeIdx !== -1) {
        return successRes(db.stores[storeIdx]);
      }
      return errorRes("Store not found", 404);
    }

    if (method === "patch") {
      if (storeIdx !== -1) {
        db.stores[storeIdx] = {
          ...db.stores[storeIdx],
          ...data,
          address: {
            ...db.stores[storeIdx].address,
            ...(data.address || {})
          },
          updatedAt: new Date().toISOString()
        };
        saveDB();
        return successMsg("Store details updated successfully", db.stores[storeIdx]);
      }
      return errorRes("Store not found", 404);
    }

    if (method === "delete") {
      if (storeIdx !== -1) {
        db.stores[storeIdx].isArchived = true;
        db.stores[storeIdx].status = "Closed";
        db.stores[storeIdx].isOpen = false;
        db.stores[storeIdx].updatedAt = new Date().toISOString();
        saveDB();
        return successMsg("Store archived successfully");
      }
      return errorRes("Store not found", 404);
    }
  }

  // 10. Store Approvals Dashboard endpoint
  if (url.includes("/store-approvals/dashboard")) {
    const pending = db.storeApprovals.filter(s => s.status === "Pending").length;
    const approved = db.storeApprovals.filter(s => s.status === "Approved").length;
    const rejected = db.storeApprovals.filter(s => s.status === "Rejected").length;
    return successRes({
      pendingApprovals: pending || 18,
      approvedToday: approved || 7,
      rejectedStores: rejected || 4,
      avgApprovalTime: 3.2
    });
  }

  // 11. Store Approvals Audit timeline
  const auditMatch = url.match(/\/store-approvals\/([^/]+)\/audit$/);
  if (auditMatch) {
    const id = auditMatch[1];
    const app = db.storeApprovals.find(s => s._id === id);
    if (!app) return errorRes("Approval record not found", 404);

    const logs = [
      { actor: app.submittedBy || "Franchise Manager", action: "Submitted", date: app.createdAt, remarks: app.remarks || "No remarks" }
    ];
    if (app.status === "Approved") {
      logs.push({ actor: app.approvedBy || "Super Admin", action: "Approved", date: app.approvedAt || new Date().toISOString(), remarks: "Store approved and configuration activated." });
    } else if (app.status === "Rejected") {
      logs.push({ actor: "Super Admin", action: "Rejected", date: app.approvedAt || new Date().toISOString(), remarks: `Rejected: ${app.rejectionReason}` });
    }
    return successRes(logs);
  }

  // 12. Store Approvals Documents Zip download
  if (url.match(/\/store-approvals\/([^/]+)\/documents$/)) {
    return successMsg("Document zip download simulation started.");
  }

  // 13. PATCH approve store approval
  if (method === "patch" && url.match(/\/store-approvals\/([^/]+)\/approve$/)) {
    const match = url.match(/\/store-approvals\/([^/]+)\/approve$/);
    const id = match[1];
    const appIdx = db.storeApprovals.findIndex(s => s._id === id);
    if (appIdx !== -1) {
      db.storeApprovals[appIdx].status = "Approved";
      db.storeApprovals[appIdx].approvedBy = "Super Admin";
      db.storeApprovals[appIdx].approvedAt = new Date().toISOString();

      // Also ensure corresponding store in db.stores is set to Active and isOpen is true
      const storeId = db.storeApprovals[appIdx].storeId;
      const storeIdx = db.stores.findIndex(s => s._id === storeId);
      if (storeIdx !== -1) {
        db.stores[storeIdx].status = "Active";
        db.stores[storeIdx].isOpen = true;
        db.stores[storeIdx].updatedAt = new Date().toISOString();
      } else {
        // Create new store if it doesn't exist
        const app = db.storeApprovals[appIdx];
        const newStore = {
          _id: storeId,
          franchiseId: app.franchiseId || "fran-1",
          storeCode: app.storeCode,
          storeName: app.storeName,
          managerId: app.managerId,
          phone: app.phone,
          email: app.email,
          address: app.address,
          status: "Active",
          storeType: app.storeType,
          openingDate: new Date().toISOString().split("T")[0],
          currentCapacity: 0,
          totalOrders: 0,
          averageRating: 5.0,
          isOpen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.stores.unshift(newStore);
      }
      saveDB();
      return successMsg("Store approved successfully", db.storeApprovals[appIdx]);
    }
    return errorRes("Approval record not found", 404);
  }

  // 14. PATCH reject store approval
  if (method === "patch" && url.match(/\/store-approvals\/([^/]+)\/reject$/)) {
    const match = url.match(/\/store-approvals\/([^/]+)\/reject$/);
    const id = match[1];
    const appIdx = db.storeApprovals.findIndex(s => s._id === id);
    if (appIdx !== -1) {
      db.storeApprovals[appIdx].status = "Rejected";
      db.storeApprovals[appIdx].rejectionReason = data.reason || "Documents Incomplete";
      db.storeApprovals[appIdx].approvedBy = "Super Admin";
      db.storeApprovals[appIdx].approvedAt = new Date().toISOString();
      db.storeApprovals[appIdx].remarks = data.comments || "";

      // Update corresponding store in db.stores to Inactive / Closed
      const storeId = db.storeApprovals[appIdx].storeId;
      const storeIdx = db.stores.findIndex(s => s._id === storeId);
      if (storeIdx !== -1) {
        db.stores[storeIdx].status = "Closed";
        db.stores[storeIdx].isOpen = false;
        db.stores[storeIdx].updatedAt = new Date().toISOString();
      }
      saveDB();
      return successMsg("Store rejected successfully", db.storeApprovals[appIdx]);
    }
    return errorRes("Approval record not found", 404);
  }

  // 15. GET list of approvals
  if (url.includes("/store-approvals")) {
    if (method === "get") {
      let filtered = [...db.storeApprovals];
      const search = config.params?.search || "";
      const status = config.params?.status || "";
      const city = config.params?.city || "";
      const managerId = config.params?.managerId || "";
      const startDate = config.params?.startDate || "";
      const endDate = config.params?.endDate || "";
      const sort = config.params?.sort || "createdAt";
      const order = config.params?.order || "desc";

      if (search) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(s =>
          s.storeName.toLowerCase().includes(q) ||
          s._id.toLowerCase().includes(q) ||
          (s.managerName || "").toLowerCase().includes(q)
        );
      }

      if (status && status !== "All") {
        filtered = filtered.filter(s => s.status === status);
      }

      if (city && city !== "All") {
        filtered = filtered.filter(s => s.address?.city === city);
      }

      if (managerId && managerId !== "All") {
        filtered = filtered.filter(s => s.managerId === managerId);
      }

      if (startDate) {
        filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(startDate));
      }
      if (endDate) {
        filtered = filtered.filter(s => new Date(s.createdAt) <= new Date(endDate + "T23:59:59.999Z"));
      }

      // Sorting
      filtered.sort((a, b) => {
        let valA = a[sort];
        let valB = b[sort];
        if (typeof valA === "string") {
          return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return order === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });

      const page = parseInt(config.params?.page || "1", 10);
      const limit = parseInt(config.params?.limit || "10", 10);
      const totalCount = filtered.length;

      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return successRes({
        approvals: paginated,
        totalCount,
        page,
        limit
      });
    }
  }

  // 15b. Store Pricing Management Endpoints
  if (url.includes("/store-pricing")) {
    if (url.includes("/bulk-action")) {
      return successRes(storePricingService.applyBulkAction(data.pricingIds, data.action, data.payload || {}));
    }
    const idMatch = url.match(/\/store-pricing\/([^/?]+)/);
    if (idMatch && idMatch[1] !== "bulk-action") {
      const id = idMatch[1];
      if (method === "put" || method === "patch") {
        return successRes(storePricingService.updateStorePricing(id, data));
      }
      return successRes(storePricingService.getStorePricingById(id));
    }
    return successRes(storePricingService.getStorePricing(config.params || {}));
  }

  if (url.includes("/bulk-price-update") && method === "post") {
    return successRes(storePricingService.bulkPriceUpdate(data));
  }

  if (url.includes("/copy-pricing") && method === "post") {
    return successRes(storePricingService.copyPricing(data));
  }

  if (url.includes("/price-history/")) {
    const productIdMatch = url.match(/\/price-history\/([^/?]+)/);
    if (productIdMatch) {
      const productId = productIdMatch[1];
      return successRes(storePricingService.getPriceHistory(productId, config.params || {}));
    }
  }

  // GET or POST /stores
  if (url.includes("/stores")) {
    if (method === "get") {
      let filtered = db.stores.filter(s => s.isArchived !== true);

      const search = config.params?.search || "";
      const status = config.params?.status || "";
      const type = config.params?.type || "";
      const isOpen = config.params?.isOpen || "";
      const manager = config.params?.manager || "";
      const sort = config.params?.sort || "";
      const order = config.params?.order || "asc";

      if (search) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(s =>
          s.storeName.toLowerCase().includes(q) ||
          s.storeCode.toLowerCase().includes(q) ||
          (s.address?.city || "").toLowerCase().includes(q)
        );
      }

      if (status && status !== "All") {
        filtered = filtered.filter(s => s.status === status);
      }

      if (type && type !== "All") {
        filtered = filtered.filter(s => s.storeType === type);
      }

      if (isOpen) {
        const openBool = isOpen === "true" || isOpen === true;
        filtered = filtered.filter(s => s.isOpen === openBool);
      }

      if (manager && manager !== "All") {
        filtered = filtered.filter(s => s.managerId === manager);
      }

      // Sorting
      if (sort) {
        filtered.sort((a, b) => {
          let valA = a[sort];
          let valB = b[sort];
          if (sort === "city") {
            valA = a.address?.city || "";
            valB = b.address?.city || "";
          }
          if (typeof valA === "string") {
            return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return order === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });
      }

      const page = parseInt(config.params?.page || "1", 10);
      const limit = parseInt(config.params?.limit || "10", 10);
      const totalCount = filtered.length;

      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return successRes({
        stores: paginated,
        totalCount,
        page,
        limit
      });
    }

    if (method === "post") {
      const newStore = {
        _id: `store-${Date.now()}`,
        franchiseId: "fran-1",
        storeCode: data.storeCode || `PVP-STR-${Date.now().toString().slice(-4)}`,
        storeName: data.storeName || "New Store Outlet",
        managerId: data.managerId || "",
        phone: data.phone || "",
        email: data.email || "",
        address: {
          line1: data.address?.line1 || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          pincode: data.address?.pincode || "",
          coordinates: data.address?.coordinates || [75.8763, 22.7196]
        },
        status: data.status || "Active",
        storeType: data.storeType || "Regular",
        openingDate: data.openingDate || new Date().toISOString().split("T")[0],
        currentCapacity: data.currentCapacity || 25,
        totalOrders: 0,
        averageRating: 5.0,
        isOpen: data.status === "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.stores.unshift(newStore);
      saveDB();
      return successMsg("Store created successfully", newStore);
    }
  }

  // --- STORE PERFORMANCE ANALYTICS MOCK ENDPOINTS ---

  // GET /store-performance/dashboard
  if (url.includes("/store-performance/dashboard")) {
    const activePerfs = db.storePerformance.filter(p => p.status === "Active");
    const totalRev = activePerfs.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalOrd = activePerfs.reduce((sum, p) => sum + (p.totalOrders || 0), 0);
    const avgPrep = activePerfs.length > 0 ? Math.round(activePerfs.reduce((sum, p) => sum + (p.avgPreparationTime || 0), 0) / activePerfs.length) : 14;
    const avgDel = activePerfs.length > 0 ? Math.round(activePerfs.reduce((sum, p) => sum + (p.avgDeliveryTime || 0), 0) / activePerfs.length) : 24;
    const avgRating = activePerfs.length > 0 ? (activePerfs.reduce((sum, p) => sum + (p.customerRating || 0), 0) / activePerfs.length).toFixed(1) : "4.8";

    // Best store is the one with the highest performanceScore
    let bestStoreName = "Papa Veg Pizza - Indore Central";
    if (activePerfs.length > 0) {
      const sortedByScore = [...activePerfs].sort((a, b) => b.performanceScore - a.performanceScore);
      bestStoreName = sortedByScore[0].storeName;
    }

    return successRes({
      revenueToday: totalRev || 185000,
      ordersToday: totalOrd || 1260,
      avgPreparationTime: avgPrep || 14,
      avgDeliveryTime: avgDel || 24,
      customerRating: parseFloat(avgRating) || 4.8,
      cancellationRate: 2.1,
      inventoryWaste: 3.0,
      bestStore: bestStoreName
    });
  }

  // GET /store-performance/revenue
  if (url.includes("/store-performance/revenue")) {
    return successRes({
      daily: [
        { time: "Mon", revenue: 85000 },
        { time: "Tue", revenue: 98000 },
        { time: "Wed", revenue: 112000 },
        { time: "Thu", revenue: 95000 },
        { time: "Fri", revenue: 142050 },
        { time: "Sat", revenue: 185000 },
        { time: "Sun", revenue: 165000 }
      ],
      weekly: [
        { time: "Week 1", revenue: 650000 },
        { time: "Week 2", revenue: 780000 },
        { time: "Week 3", revenue: 890000 },
        { time: "Week 4", revenue: 1120000 }
      ],
      monthly: [
        { time: "Jan", revenue: 2400000 },
        { time: "Feb", revenue: 2800000 },
        { time: "Mar", revenue: 3100000 },
        { time: "Apr", revenue: 2900000 },
        { time: "May", revenue: 3800000 },
        { time: "Jun", revenue: 4200000 }
      ]
    });
  }

  // GET /store-performance/orders
  if (url.includes("/store-performance/orders")) {
    return successRes([
      { time: "Mon", completed: 580, cancelled: 12 },
      { time: "Tue", completed: 620, cancelled: 15 },
      { time: "Wed", completed: 740, cancelled: 18 },
      { time: "Thu", completed: 690, cancelled: 10 },
      { time: "Fri", completed: 950, cancelled: 22 },
      { time: "Sat", completed: 1260, cancelled: 26 },
      { time: "Sun", completed: 1100, cancelled: 20 }
    ]);
  }

  // GET /store-performance/ratings
  if (url.includes("/store-performance/ratings")) {
    return successRes([
      { time: "Mon", rating: 4.6 },
      { time: "Tue", rating: 4.7 },
      { time: "Wed", rating: 4.8 },
      { time: "Thu", rating: 4.6 },
      { time: "Fri", rating: 4.7 },
      { time: "Sat", rating: 4.8 },
      { time: "Sun", rating: 4.9 }
    ]);
  }

  // GET /store-performance/comparison
  if (url.includes("/store-performance/comparison")) {
    const list = db.storePerformance.filter(p => p.status === "Active").slice(0, 5);
    return successRes(
      list.map(p => ({
        name: p.storeName.replace("Papa Veg Pizza - ", ""),
        revenue: p.revenue,
        orders: p.totalOrders,
        rating: p.customerRating,
        cancellation: parseFloat(((p.cancelledOrders / (p.totalOrders || 1)) * 100).toFixed(1))
      }))
    );
  }

  // GET /store-performance/busy-hours
  if (url.includes("/store-performance/busy-hours")) {
    return successRes([
      { hour: "11 AM", density: 30 },
      { hour: "12 PM", density: 55 },
      { hour: "1 PM", density: 85 },
      { hour: "2 PM", density: 60 },
      { hour: "3 PM", density: 40 },
      { hour: "4 PM", density: 35 },
      { hour: "5 PM", density: 45 },
      { hour: "6 PM", density: 70 },
      { hour: "7 PM", density: 90 },
      { hour: "8 PM", density: 100 },
      { hour: "9 PM", density: 95 },
      { hour: "10 PM", density: 75 },
      { hour: "11 PM", density: 40 }
    ]);
  }

  // GET /store-performance/compare
  if (url.includes("/store-performance/compare")) {
    let storeIdsStr = config.params?.storeIds || "";
    if (!storeIdsStr) {
      const match = url.match(/[?&]storeIds=([^&]+)/);
      if (match) storeIdsStr = decodeURIComponent(match[1]);
    }
    const storeIds = storeIdsStr ? storeIdsStr.split(",") : [];

    // Find matching performance records
    let perfs = db.storePerformance.filter(p => storeIds.includes(p.storeId) || storeIds.includes(p._id));

    // Fallback to seed data if localStorage db is out of sync or missing these records
    if (perfs.length === 0 && initialStorePerformance) {
      perfs = initialStorePerformance.filter(p => storeIds.includes(p.storeId) || storeIds.includes(p._id));
    }

    return successRes(perfs);
  }

  // GET /store-performance/export
  if (url.includes("/store-performance/export")) {
    return successMsg("Report export started. Your file will download automatically.");
  }

  // Single Store Analytics subroutes
  const singleStorePerfMatch = url.match(/\/store-performance\/([^/]+)\/([^/]+)$/);
  if (singleStorePerfMatch) {
    const storeId = singleStorePerfMatch[1];
    const subRoute = singleStorePerfMatch[2];
    const perf = db.storePerformance.find(p => p.storeId === storeId) || db.storePerformance[0];

    if (subRoute === "revenue") {
      return successRes({
        todayRevenue: perf.revenue || 56000,
        weeklyRevenue: (perf.revenue * 6.5) || 364000,
        monthlyRevenue: (perf.revenue * 27) || 1512000,
        avgOrderValue: perf.avgOrderValue || 200,
        trend: [
          { time: "Mon", revenue: perf.revenue * 0.7 },
          { time: "Tue", revenue: perf.revenue * 0.8 },
          { time: "Wed", revenue: perf.revenue * 0.9 },
          { time: "Thu", revenue: perf.revenue * 0.8 },
          { time: "Fri", revenue: perf.revenue * 1.1 },
          { time: "Sat", revenue: perf.revenue },
          { time: "Sun", revenue: perf.revenue * 0.95 }
        ],
        paymentMethods: [
          { name: "UPI / NetBanking", value: 65 },
          { name: "Credit / Debit Cards", value: 25 },
          { name: "Cash on Delivery", value: 10 }
        ],
        distribution: [
          { category: "Pizzas", value: 60 },
          { category: "Sides & Garlic Bread", value: 25 },
          { category: "Beverages", value: 10 },
          { category: "Desserts", value: 5 }
        ]
      });
    }

    if (subRoute === "orders") {
      return successRes({
        totalOrders: perf.totalOrders || 280,
        completedOrders: perf.completedOrders || 274,
        cancelledOrders: perf.cancelledOrders || 6,
        completionRate: parseFloat(((perf.completedOrders / (perf.totalOrders || 1)) * 100).toFixed(1)) || 97.9,
        avgOrdersPerHour: Math.round(perf.totalOrders / 12) || 23,
        dailyOrders: [
          { time: "Mon", completed: 180, cancelled: 4 },
          { time: "Tue", completed: 210, cancelled: 5 },
          { time: "Wed", completed: 230, cancelled: 6 },
          { time: "Thu", completed: 220, cancelled: 3 },
          { time: "Fri", completed: 260, cancelled: 8 },
          { time: "Sat", completed: perf.completedOrders, cancelled: perf.cancelledOrders },
          { time: "Sun", completed: 250, cancelled: 5 }
        ],
        statusDistribution: [
          { name: "Delivered", value: 92 },
          { name: "Cancelled", value: 2.1 },
          { name: "Returned / Failed", value: 5.9 }
        ],
        peakHours: [
          { hour: "12 PM - 2 PM", count: 85 },
          { hour: "2 PM - 6 PM", count: 45 },
          { hour: "6 PM - 9 PM", count: 120 },
          { hour: "9 PM - 11 PM", count: 70 }
        ]
      });
    }

    if (subRoute === "ratings") {
      return successRes({
        avgRating: perf.customerRating || 4.8,
        totalReviews: 840,
        positiveReviews: 790,
        negativeReviews: 50,
        distribution: [
          { rating: "5 Star", count: 680 },
          { rating: "4 Star", count: 110 },
          { rating: "3 Star", count: 35 },
          { rating: "2 Star", count: 10 },
          { rating: "1 Star", count: 5 }
        ],
        trend: [
          { time: "Jan", rating: 4.5 },
          { time: "Feb", rating: 4.6 },
          { time: "Mar", rating: 4.6 },
          { time: "Apr", rating: 4.7 },
          { time: "May", rating: 4.8 },
          { time: "Jun", rating: perf.customerRating || 4.8 }
        ],
        recentReviews: [
          { customer: "Rohan Malhotra", rating: 5, comment: "Double cheese margherita was extremely hot and loaded!", date: "2026-06-20" },
          { customer: "Isha Sharma", rating: 4, comment: "Quick delivery and nice service. Dips were super tasty.", date: "2026-06-20" },
          { customer: "Amit Patel", rating: 5, comment: "Perfect crust and amazing paneer tikka pizza!", date: "2026-06-19" },
          { customer: "Sneha Varma", rating: 3, comment: "Pizza was good but delivery took around 40 minutes.", date: "2026-06-18" },
          { customer: "Manoj Joshi", rating: 5, comment: "Fabulous, standard taste is maintained.", date: "2026-06-17" }
        ]
      });
    }

    if (subRoute === "inventory") {
      return successRes({
        wastePercent: perf.inventoryWaste || 2.2,
        outOfStockItems: 2,
        stockTurnover: 12.4,
        lowStockAlerts: 4,
        wasteTrend: [
          { time: "Mon", waste: perf.inventoryWaste * 0.9 },
          { time: "Tue", waste: perf.inventoryWaste * 1.1 },
          { time: "Wed", waste: perf.inventoryWaste * 0.8 },
          { time: "Thu", waste: perf.inventoryWaste },
          { time: "Fri", waste: perf.inventoryWaste * 1.2 },
          { time: "Sat", waste: perf.inventoryWaste },
          { time: "Sun", waste: perf.inventoryWaste * 0.95 }
        ],
        consumption: [
          { ingredient: "Processed Cheese", consumed: 85, reorder: false },
          { ingredient: "Pizza Sauce", consumed: 72, reorder: false },
          { ingredient: "Wheat Flour", consumed: 94, reorder: true },
          { ingredient: "Fresh Paneer", consumed: 60, reorder: false }
        ]
      });
    }

    if (subRoute === "products") {
      return successRes({
        list: [
          { product: "Double Cheese Margherita", sold: 1200, revenue: 298800, rating: 4.9, popularity: 98 },
          { product: "Paneer Tikka Pizza", sold: 950, revenue: 379050, rating: 4.8, popularity: 95 },
          { product: "Garlic Breadsticks", sold: 800, revenue: 103200, rating: 4.7, popularity: 89 },
          { product: "Veg Supreme Pizza", sold: 680, revenue: 271320, rating: 4.6, popularity: 85 },
          { product: "Choco Lava Cake", sold: 620, revenue: 61380, rating: 4.8, popularity: 82 }
        ],
        chart: [
          { name: "Margherita", sold: 1200 },
          { name: "Paneer Tikka", sold: 950 },
          { name: "Garlic Bread", sold: 800 },
          { name: "Veg Supreme", sold: 680 },
          { name: "Choco Lava", sold: 620 }
        ]
      });
    }

    if (subRoute === "staff") {
      return successRes({
        ordersProcessed: perf.completedOrders || 274,
        avgPrepTime: perf.avgPreparationTime || 12,
        efficiencyScore: 92,
        performance: [
          { name: "Chef Suresh (Kitchen)", orders: 120, rating: 4.9 },
          { name: "Chef Anil (Oven)", orders: 95, rating: 4.8 },
          { name: "Rider Karan (Delivery)", orders: 35, rating: 4.7 },
          { name: "Rider Rahul (Delivery)", orders: 24, rating: 4.6 }
        ],
        productivity: [
          { hour: "11 AM - 3 PM", speed: 90 },
          { hour: "3 PM - 7 PM", speed: 94 },
          { hour: "7 PM - 11 PM", speed: 92 }
        ]
      });
    }
  }

  // GET /store-performance
  if (url.includes("/store-performance")) {
    if (method === "get") {
      let filtered = [...db.storePerformance];

      const search = config.params?.search || "";
      const storeId = config.params?.storeId || "";
      const status = config.params?.status || "";
      const type = config.params?.type || "";
      const city = config.params?.city || "";
      const sort = config.params?.sort || "";
      const order = config.params?.order || "asc";

      if (search) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(p =>
          p.storeName.toLowerCase().includes(q) ||
          p.storeId.toLowerCase().includes(q)
        );
      }

      if (storeId && storeId !== "All") {
        filtered = filtered.filter(p => p.storeId === storeId);
      }

      if (status && status !== "All") {
        filtered = filtered.filter(p => p.status === status);
      }

      if (type && type !== "All") {
        filtered = filtered.filter(p => p.storeType === type);
      }

      if (city && city !== "All") {
        filtered = filtered.filter(p => p.city === city);
      }

      // Sorting
      if (sort) {
        filtered.sort((a, b) => {
          let valA = a[sort];
          let valB = b[sort];
          if (typeof valA === "string") {
            return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return order === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });
      }

      const page = parseInt(config.params?.page || "1", 10);
      const limit = parseInt(config.params?.limit || "10", 10);
      const totalCount = filtered.length;

      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return successRes({
        list: paginated,
        totalCount,
        page,
        limit
      });
    }
  }

  // GET /operating-hours/dashboard
  if (url.includes("/operating-hours/dashboard")) {
    const activeStores = db.stores.filter(s => s.status === "Active" && s.isArchived !== true);
    const openNow = activeStores.filter(s => s.isOpen === true).length;
    const closedStores = db.stores.filter(s => s.isOpen === false || s.status === "Closed").length;

    // Count 24x7 stores
    const count24x7 = db.operatingHours.filter(oh => {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      return days.every(d => oh[d] && oh[d].open === "12:00 AM" && oh[d].close === "12:00 AM" && !oh[d].isClosed);
    }).length;

    // Count holiday closures
    const holidayCount = db.operatingHours.filter(oh => oh.holidaySchedule && oh.holidaySchedule.length > 0).length;

    return successRes({
      storesOpenNow: openNow || 8,
      storesClosed: closedStores || 4,
      stores24x7: count24x7 || 2,
      holidayClosures: holidayCount || 5,
      upcomingChanges: 3
    });
  }

  // GET /operating-hours/export
  if (url.includes("/operating-hours/export")) {
    return successMsg("Report export started. Your file will download automatically.");
  }

  // POST /operating-hours/copy
  if (url.includes("/operating-hours/copy")) {
    const sourceStoreId = data?.sourceStoreId;
    const destStoreId = data?.destStoreId;

    const sourceOh = db.operatingHours.find(oh => oh.storeId === sourceStoreId);
    const destIdx = db.operatingHours.findIndex(oh => oh.storeId === destStoreId);

    if (sourceOh && destIdx !== -1) {
      db.operatingHours[destIdx] = {
        ...db.operatingHours[destIdx],
        monday: { ...sourceOh.monday },
        tuesday: { ...sourceOh.tuesday },
        wednesday: { ...sourceOh.wednesday },
        thursday: { ...sourceOh.thursday },
        friday: { ...sourceOh.friday },
        saturday: { ...sourceOh.saturday },
        sunday: { ...sourceOh.sunday },
        updatedBy: "Super Admin",
        updatedAt: new Date().toISOString()
      };
      if (!db.operatingHours[destIdx].auditLogs) db.operatingHours[destIdx].auditLogs = [];
      db.operatingHours[destIdx].auditLogs.unshift({
        updatedBy: "Super Admin",
        action: "Copied Timings",
        date: new Date().toISOString(),
        remarks: `Copied schedule from store ${sourceStoreId}`
      });
      saveDB();
      return successMsg("Schedule copied successfully.");
    }
    return errorRes("Source or destination store not found.", 404);
  }

  // PATCH /operating-hours/bulk-update
  if (url.includes("/operating-hours/bulk-update")) {
    const storeIds = data?.storeIds || [];
    const weekdays = data?.weekdays || [];
    const open = data?.open || "09:00 AM";
    const close = data?.close || "10:00 PM";
    const isClosed = data?.isClosed || false;

    db.operatingHours.forEach((oh) => {
      if (storeIds.includes(oh.storeId)) {
        weekdays.forEach(day => {
          const d = day.toLowerCase();
          if (oh[d]) {
            oh[d] = { open, close, isClosed };
          }
        });
        oh.updatedBy = "Super Admin";
        oh.updatedAt = new Date().toISOString();
        if (!oh.auditLogs) oh.auditLogs = [];
        oh.auditLogs.unshift({
          updatedBy: "Super Admin",
          action: "Bulk Updated Timings",
          date: new Date().toISOString(),
          remarks: `Bulk updated days: ${weekdays.join(", ")}`
        });
      }
    });
    saveDB();
    return successMsg("Bulk update completed successfully.");
  }

  // Store-specific operations
  const storeStatusMatch = url.match(/\/stores\/([^/]+)\/status$/);
  if (storeStatusMatch && method === "patch") {
    const storeId = storeStatusMatch[1];
    const storeIdx = db.stores.findIndex(s => s._id === storeId);

    if (storeIdx !== -1) {
      const newStatus = data?.status || "Closed";
      const newIsOpen = data?.isOpen !== undefined ? data.isOpen : false;

      db.stores[storeIdx].status = newStatus;
      db.stores[storeIdx].isOpen = newIsOpen;
      db.stores[storeIdx].updatedAt = new Date().toISOString();

      // Also add audit log
      const ohIdx = db.operatingHours.findIndex(oh => oh.storeId === storeId);
      if (ohIdx !== -1) {
        if (!db.operatingHours[ohIdx].auditLogs) db.operatingHours[ohIdx].auditLogs = [];
        db.operatingHours[ohIdx].auditLogs.unshift({
          updatedBy: "Super Admin",
          action: "Status Changed / Temporary Closure",
          date: new Date().toISOString(),
          remarks: `Status updated to ${newStatus}. Closure reason: ${data?.reason || "N/A"}`
        });
        db.operatingHours[ohIdx].updatedAt = new Date().toISOString();
      }

      saveDB();
      return successMsg("Store status updated successfully.");
    }
    return errorRes("Store not found.", 404);
  }

  const specificOhHolidaysMatch = url.match(/\/operating-hours\/([^/]+)\/holidays$/);
  if (specificOhHolidaysMatch && method === "patch") {
    const storeId = specificOhHolidaysMatch[1];
    const ohIdx = db.operatingHours.findIndex(oh => oh.storeId === storeId);

    if (ohIdx !== -1) {
      db.operatingHours[ohIdx].holidaySchedule = data?.holidaySchedule || [];
      db.operatingHours[ohIdx].updatedBy = "Super Admin";
      db.operatingHours[ohIdx].updatedAt = new Date().toISOString();

      if (!db.operatingHours[ohIdx].auditLogs) db.operatingHours[ohIdx].auditLogs = [];
      db.operatingHours[ohIdx].auditLogs.unshift({
        updatedBy: "Super Admin",
        action: "Updated Holiday Schedule",
        date: new Date().toISOString(),
        remarks: `Updated holidays. Total defined: ${data?.holidaySchedule?.length || 0}`
      });

      saveDB();
      return successRes(db.operatingHours[ohIdx]);
    }
    return errorRes("Operating hours not found.", 404);
  }

  const specificOhMatch = url.match(/\/operating-hours\/([^/]+)$/);
  if (specificOhMatch) {
    const storeId = specificOhMatch[1];
    const oh = db.operatingHours.find(o => o.storeId === storeId);

    if (method === "get") {
      if (oh) return successRes(oh);
      return errorRes("Operating hours not found.", 404);
    }

    if (method === "patch") {
      const ohIdx = db.operatingHours.findIndex(o => o.storeId === storeId);
      if (ohIdx !== -1) {
        db.operatingHours[ohIdx] = {
          ...db.operatingHours[ohIdx],
          ...data,
          updatedBy: "Super Admin",
          updatedAt: new Date().toISOString()
        };
        if (!db.operatingHours[ohIdx].auditLogs) db.operatingHours[ohIdx].auditLogs = [];
        db.operatingHours[ohIdx].auditLogs.unshift({
          updatedBy: "Super Admin",
          action: "Updated Weekly Hours",
          date: new Date().toISOString(),
          remarks: "Modified days of week timings"
        });

        saveDB();
        return successRes(db.operatingHours[ohIdx]);
      }
      return errorRes("Operating hours not found.", 404);
    }
  }

  // GET /operating-hours (Listing with search, pagination, sort, filter)
  if (url.includes("/operating-hours") && method === "get") {
    let list = db.operatingHours.map(oh => {
      const store = db.stores.find(s => s._id === oh.storeId) || { storeName: "Unknown Store", storeCode: "N/A", status: "Closed", isOpen: false, storeType: "Regular", address: { city: "Indore" } };
      return {
        _id: oh._id,
        storeId: oh.storeId,
        storeName: store.storeName,
        storeCode: store.storeCode,
        status: store.status,
        isOpen: store.isOpen,
        storeType: store.storeType,
        city: store.address?.city || "Indore",
        schedule: oh,
        lastUpdated: oh.updatedAt
      };
    });

    const search = config.params?.search || "";
    const status = config.params?.status || "";
    const type = config.params?.type || "";
    const city = config.params?.city || "";
    const sort = config.params?.sort || "storeName";
    const order = config.params?.order || "asc";

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(item =>
        item.storeName.toLowerCase().includes(q) ||
        item.storeCode.toLowerCase().includes(q)
      );
    }

    if (status && status !== "All") {
      const isOpenVal = status === "Open";
      list = list.filter(item => item.isOpen === isOpenVal);
    }

    if (type && type !== "All") {
      list = list.filter(item => item.storeType === type);
    }

    if (city && city !== "All") {
      list = list.filter(item => item.city.toLowerCase() === city.toLowerCase());
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];
      if (typeof valA === "string") {
        return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return order === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    const page = parseInt(config.params?.page || "1", 10);
    const limit = parseInt(config.params?.limit || "10", 10);
    const totalCount = list.length;

    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return successRes({
      list: paginated,
      totalCount,
      page,
      limit
    });
  }

  // === NOTIFICATIONS MANAGEMENT ENDPOINTS ===

  // 1. GET /stores - Get all outlets
  if (url.match(/\/stores$/) && method === "get") {
    return successRes(db.stores);
  }

  // 2. GET /notifications - Get filtered and paginated list
  if (url.includes("/notifications") && method === "get") {
    let list = [...db.notifications];

    const search = config.params?.search || "";
    const channel = config.params?.channel || "";
    const audience = config.params?.audience || "";
    const status = config.params?.status || "";
    const startDate = config.params?.startDate || "";
    const endDate = config.params?.endDate || "";

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(n => n.title.toLowerCase().includes(q) || (n.message || "").toLowerCase().includes(q));
    }

    if (channel && channel !== "All") {
      list = list.filter(n => n.notificationType && n.notificationType.includes(channel.toLowerCase()));
    }

    if (audience && audience !== "All") {
      list = list.filter(n => n.targetAudience === audience.toLowerCase());
    }

    if (status && status !== "All") {
      list = list.filter(n => n.status === status.toLowerCase());
    }

    if (startDate) {
      list = list.filter(n => new Date(n.createdAt) >= new Date(startDate));
    }

    if (endDate) {
      // End of day
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      list = list.filter(n => new Date(n.createdAt) <= endLimit);
    }

    // Dynamic calculations of sentCount and openRate from logs
    const resultList = list.map(n => {
      const logs = db.notificationLogs.filter(l => l.notificationId === n._id);
      const sentCount = logs.length;
      const openedCount = logs.filter(l => l.opened).length;
      const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;

      return {
        ...n,
        sentCount: n.status === "sent" ? (sentCount || 1200) : 0, // mock high reach for list if logs small
        openRate: n.status === "sent" ? (openRate || 68) : 0
      };
    });

    // Sort by createdAt desc
    resultList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const page = parseInt(config.params?.page || "1", 10);
    const limit = parseInt(config.params?.limit || "10", 10);
    const totalCount = resultList.length;

    const startIndex = (page - 1) * limit;
    const paginated = resultList.slice(startIndex, startIndex + limit);

    return successRes({
      list: paginated,
      totalCount,
      page,
      limit
    });
  }

  // Helper to generate simulated logs
  const simulateLogs = (notificationId, targetAudience, channels, storeIds) => {
    const customerNames = [
      "Rohan Malhotra", "Aarav Sharma", "Pooja Patel", "Rashi Kumar", "Amit Verma",
      "Siddharth Jain", "Neha Gupta", "Vikram Singh", "Preeti Mishra", "Deepak Rawat",
      "Priya Verma", "Aman Gupta", "Kunal Sen", "Kiran Joshi", "Aanchal Mehta",
      "Devendra Rajput", "Shalini Dwivedi", "Rajesh Tiwari", "Meera Nair", "Harsh Vardhan"
    ];
    const channelsList = channels && channels.length > 0 ? channels : ["push"];
    const storesList = storeIds && storeIds.length > 0 ? storeIds : db.stores.map(s => s._id);

    const generated = [];
    customerNames.forEach((name, idx) => {
      channelsList.forEach(chan => {
        const isDelivered = Math.random() < 0.96;
        const isOpened = isDelivered && Math.random() < 0.70;
        const isClicked = isOpened && Math.random() < 0.35;
        const storeId = storesList[Math.floor(Math.random() * storesList.length)];

        generated.push({
          _id: `log-${notificationId}-${idx}-${chan}`,
          notificationId,
          customerId: `cust-${idx + 10}`,
          customerName: name,
          channel: chan,
          sentStatus: isDelivered ? "delivered" : "failed",
          opened: isOpened,
          clicked: isClicked,
          deliveredAt: isDelivered ? new Date(Date.now() - 600000).toISOString() : null,
          storeId
        });
      });
    });
    return generated;
  };

  // 3. POST /notifications - Create notification
  if (url.includes("/notifications") && method === "post") {
    const newId = `notif-${Date.now()}`;
    const newNotification = {
      _id: newId,
      franchiseId: data?.franchiseId || "fran-central-1",
      title: data?.title || "",
      message: data?.message || "",
      notificationType: data?.notificationType || ["push"],
      targetAudience: data?.targetAudience || "all",
      stores: data?.stores || [],
      scheduleTime: data?.scheduleTime || new Date().toISOString(),
      status: data?.status || "draft",
      createdBy: "Shubham Jamliya",
      createdAt: new Date().toISOString()
    };

    db.notifications.push(newNotification);

    // If immediate send
    if (newNotification.status === "sent") {
      const generatedLogs = simulateLogs(
        newId,
        newNotification.targetAudience,
        newNotification.notificationType,
        newNotification.stores
      );
      db.notificationLogs.push(...generatedLogs);
    }

    saveDB();
    return successMsg("Notification created successfully.", newNotification);
  }

  // 4. PUT /notifications/:id - Update notification
  const specificNotificationMatch = url.match(/\/notifications\/([^/]+)$/);
  if (specificNotificationMatch && method === "put") {
    const id = specificNotificationMatch[1];
    const idx = db.notifications.findIndex(n => n._id === id);

    if (idx !== -1) {
      const previousStatus = db.notifications[idx].status;
      const updated = {
        ...db.notifications[idx],
        ...data,
        updatedAt: new Date().toISOString()
      };

      db.notifications[idx] = updated;

      // If transitioning to sent
      if (updated.status === "sent" && previousStatus !== "sent") {
        // Clear any existing logs first just in case
        db.notificationLogs = db.notificationLogs.filter(l => l.notificationId !== id);
        const generatedLogs = simulateLogs(
          id,
          updated.targetAudience,
          updated.notificationType,
          updated.stores
        );
        db.notificationLogs.push(...generatedLogs);
      }

      saveDB();
      return successMsg("Notification updated successfully.", updated);
    }
    return errorRes("Notification not found.", 404);
  }

  // 5. DELETE /notifications/:id - Delete notification
  if (specificNotificationMatch && method === "delete") {
    const id = specificNotificationMatch[1];
    const exists = db.notifications.some(n => n._id === id);
    if (exists) {
      db.notifications = db.notifications.filter(n => n._id !== id);
      db.notificationLogs = db.notificationLogs.filter(l => l.notificationId !== id);
      saveDB();
      return successMsg("Notification archived successfully.");
    }
    return errorRes("Notification not found.", 404);
  }

  // 6. GET /notification-logs/:id - Get analytics & detailed logs
  const specificLogsMatch = url.match(/\/notification-logs\/([^/]+)$/);
  if (specificLogsMatch && method === "get") {
    const notifId = specificLogsMatch[1];
    const notif = db.notifications.find(n => n._id === notifId);

    if (!notif) {
      return errorRes("Notification not found.", 404);
    }

    let logs = db.notificationLogs.filter(l => l.notificationId === notifId);

    // If notification is sent but logs are empty, auto-generate them
    if (notif.status === "sent" && logs.length === 0) {
      logs = simulateLogs(notifId, notif.targetAudience, notif.notificationType, notif.stores);
      db.notificationLogs.push(...logs);
      saveDB();
    }

    // Filter local logs for list search
    const logSearch = config.params?.search || "";
    let filteredLogs = [...logs];
    if (logSearch) {
      const q = logSearch.toLowerCase().trim();
      filteredLogs = filteredLogs.filter(l =>
        l.customerName.toLowerCase().includes(q) ||
        l.channel.toLowerCase().includes(q) ||
        l.sentStatus.toLowerCase().includes(q)
      );
    }

    // Pagination
    const page = parseInt(config.params?.page || "1", 10);
    const limit = parseInt(config.params?.limit || "10", 10);
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);

    // KPI Calculations
    const sent = logs.length;
    const delivered = logs.filter(l => l.sentStatus === "delivered").length;
    const failed = logs.filter(l => l.sentStatus === "failed").length;
    const opened = logs.filter(l => l.opened).length;
    const clicked = logs.filter(l => l.clicked).length;

    const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
    const ctr = delivered > 0 ? Math.round((clicked / delivered) * 100) : 0;

    // Deviceswise simulation
    const deviceData = [
      { device: "Android", count: Math.round(sent * 0.58), percentage: 58 },
      { device: "iOS", count: Math.round(sent * 0.30), percentage: 30 },
      { device: "Web Browser", count: Math.round(sent * 0.12), percentage: 12 }
    ];

    // Pie chart simulation
    const pieChartData = [
      { name: "Delivered", value: delivered, color: "#10b981" },
      { name: "Failed", value: failed, color: "#ef4444" },
      { name: "Pending", value: notif.status === "scheduled" ? sent : 0, color: "#3b82f6" }
    ];

    // Store breakdown simulation
    const storesList = notif.stores && notif.stores.length > 0 ? notif.stores : db.stores.map(s => s._id);
    const storeData = storesList.map(storeId => {
      const storeName = db.stores.find(s => s._id === storeId)?.name || "Unknown Store";
      const storeLogs = logs.filter(l => l.storeId === storeId);

      const sDelivered = storeLogs.filter(l => l.sentStatus === "delivered").length;
      const sOpened = storeLogs.filter(l => l.opened).length;
      const sClicked = storeLogs.filter(l => l.clicked).length;
      const sCtr = sDelivered > 0 ? parseFloat(((sClicked / sDelivered) * 100).toFixed(1)) : 0;

      return {
        store: storeName,
        delivered: sDelivered,
        opened: sOpened,
        clicked: sClicked,
        ctr: sCtr
      };
    });

    return successRes({
      aggregates: {
        sent: notif.status === "sent" ? (sent || 1200) : 0,
        delivered: notif.status === "sent" ? (delivered || 1160) : 0,
        failed: notif.status === "sent" ? (failed || 40) : 0,
        opened: notif.status === "sent" ? (opened || 780) : 0,
        clicked: notif.status === "sent" ? (clicked || 240) : 0,
        openRate: notif.status === "sent" ? (openRate || 67) : 0,
        ctr: notif.status === "sent" ? (ctr || 21) : 0
      },
      pieChartData,
      deviceData,
      storeData,
      logsList: {
        list: paginatedLogs,
        totalCount: filteredLogs.length,
        page,
        limit
      }
    });
  }

  // --- STORE KITCHEN STAFF OPERATIONS ENDPOINTS ---
  if (url.includes("/store/staff") && method === "get") {
    // Check if single staff GET
    const singleMatch = url.match(/\/store\/staff\/([^/]+)$/);
    if (singleMatch) {
      const id = singleMatch[1];
      const found = db.staff.find(s => s._id === id);
      if (found) return successRes(found);
      return errorRes("Staff member not found", 404);
    }

    // List GET
    const search = config.params?.search || "";
    const role = config.params?.role || "All";
    const shiftId = config.params?.shiftId || "All";
    const status = config.params?.status || "All";

    let list = [...db.staff];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        s =>
          (s.fullName && s.fullName.toLowerCase().includes(q)) ||
          (s.employeeCode && s.employeeCode.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
      );
    }

    if (role && role !== "All") {
      list = list.filter(s => s.role === role);
    }

    if (shiftId && shiftId !== "All") {
      list = list.filter(s => s.shiftId === shiftId);
    }

    if (status && status !== "All") {
      list = list.filter(s => s.status === status);
    }

    return successRes(list);
  }

  if (url.includes("/store/staff") && method === "post") {
    const payload = data;
    const nextCodeNum = db.staff.length + 1;
    const codeMap = {
      "Kitchen Supervisor": "KS",
      "Pizza Maker": "PM",
      "Baker": "BK",
      "Packager": "PK"
    };
    const prefix = codeMap[payload.role] || "ST";
    const employeeCode = `PVP-${prefix}-0${nextCodeNum}`;

    const newStaff = {
      _id: `staff-${Date.now()}`,
      storeId: "store-indore-01",
      userId: `user-${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      profileImage: payload.profileImage || "",
      role: payload.role,
      employeeCode,
      joiningDate: payload.joiningDate || new Date().toISOString().split("T")[0],
      shiftId: payload.shiftId || "Morning",
      salaryType: payload.salaryType || "Monthly",
      salary: Number(payload.salary) || 0,
      experience: Number(payload.experience) || 0,
      skills: payload.skills || [],
      emergencyContact: payload.emergencyContact || "",
      status: "active",
      todayStatus: "present",
      performanceScore: 90,
      createdAt: new Date().toISOString(),
      stats: {
        ordersCompleted: 0,
        avgPrepTime: 15,
        delayedOrders: 0,
        attendance: 100
      },
      activities: [
        { id: `act-${Date.now()}-1`, type: "Shift Changes", title: "Joined the store", time: "Just now", status: "completed" }
      ]
    };

    db.staff.push(newStaff);
    saveDB();
    return successRes(newStaff);
  }

  // PUT /store/staff/:id
  const storeStaffPutMatch = url.match(/\/store\/staff\/([^/]+)$/);
  if (storeStaffPutMatch && method === "put") {
    const id = storeStaffPutMatch[1];
    const idx = db.staff.findIndex(s => s._id === id);
    if (idx !== -1) {
      db.staff[idx] = {
        ...db.staff[idx],
        fullName: data.fullName ?? db.staff[idx].fullName,
        email: data.email ?? db.staff[idx].email,
        phone: data.phone ?? db.staff[idx].phone,
        profileImage: data.profileImage ?? db.staff[idx].profileImage,
        role: data.role ?? db.staff[idx].role,
        joiningDate: data.joiningDate ?? db.staff[idx].joiningDate,
        salaryType: data.salaryType ?? db.staff[idx].salaryType,
        salary: data.salary !== undefined ? Number(data.salary) : db.staff[idx].salary,
        experience: data.experience !== undefined ? Number(data.experience) : db.staff[idx].experience,
        skills: data.skills ?? db.staff[idx].skills,
        emergencyContact: data.emergencyContact ?? db.staff[idx].emergencyContact,
      };
      saveDB();
      return successRes(db.staff[idx]);
    }
    return errorRes("Staff member not found", 404);
  }

  // PATCH /store/staff/:id/status
  const storeStaffStatusMatch = url.match(/\/store\/staff\/([^/]+)\/status$/);
  if (storeStaffStatusMatch && method === "patch") {
    const id = storeStaffStatusMatch[1];
    const idx = db.staff.findIndex(s => s._id === id);
    if (idx !== -1) {
      const status = data.status;
      const actId = `act-${Date.now()}-status`;
      const label = status === "active" ? "activated" : status === "inactive" ? "deactivated" : "suspended";
      const type = status === "active" ? "completed" : status === "inactive" ? "info" : "severe";
      db.staff[idx].status = status;
      db.staff[idx].activities = [
        { id: actId, type: "Recent Performance Updates", title: `Staff profile ${label}`, time: "Just now", status: type },
        ...db.staff[idx].activities
      ];
      saveDB();
      return successRes(db.staff[idx]);
    }
    return errorRes("Staff member not found", 404);
  }

  // PATCH /store/staff/:id/shift
  const storeStaffShiftMatch = url.match(/\/store\/staff\/([^/]+)\/shift$/);
  if (storeStaffShiftMatch && method === "patch") {
    const id = storeStaffShiftMatch[1];
    const idx = db.staff.findIndex(s => s._id === id);
    if (idx !== -1) {
      const actId = `act-${Date.now()}-shift`;
      db.staff[idx].shiftId = data.shiftId;
      db.staff[idx].activities = [
        { id: actId, type: "Shift Changes", title: `Assigned shift: ${data.shiftId} (Eff. ${data.effectiveDate || "Immediate"})`, time: "Just now", status: "completed" },
        ...db.staff[idx].activities
      ];
      saveDB();
      return successRes(db.staff[idx]);
    }
    return errorRes("Staff member not found", 404);
  }

  // PATCH /store/staff/:id/leave
  const storeStaffLeaveMatch = url.match(/\/store\/staff\/([^/]+)\/leave$/);
  if (storeStaffLeaveMatch && method === "patch") {
    const id = storeStaffLeaveMatch[1];
    const idx = db.staff.findIndex(s => s._id === id);
    if (idx !== -1) {
      const actId = `act-${Date.now()}-leave`;
      db.staff[idx].todayStatus = "leave";
      db.staff[idx].activities = [
        { id: actId, type: "Attendance Logs", title: `Marked Leave: ${data.leaveType} (${data.startDate} to ${data.endDate})`, time: "Just now", status: "info" },
        ...db.staff[idx].activities
      ];
      saveDB();
      return successRes(db.staff[idx]);
    }
    return errorRes("Staff member not found", 404);
  }

  // DELETE /store/staff/:id
  const storeStaffDeleteMatch = url.match(/\/store\/staff\/([^/]+)$/);
  if (storeStaffDeleteMatch && method === "delete") {
    const id = storeStaffDeleteMatch[1];
    const idx = db.staff.findIndex(s => s._id === id);
    if (idx !== -1) {
      const deleted = db.staff[idx];
      db.staff = db.staff.filter(s => s._id !== id);
      saveDB();
      return successRes(deleted);
    }
  }

  // --- KITCHEN ATTENDANCE ENDPOINTS ---
  // GET /store/attendance/:id (Single record)
  const storeAttendanceDetailsMatch = url.match(/\/store\/attendance\/([^/]+)$/);
  if (storeAttendanceDetailsMatch && method === "get" && !url.includes("/bulk")) {
    const id = storeAttendanceDetailsMatch[1];
    const found = db.attendance.find((a) => a._id === id);
    if (found) {
      return successRes(found);
    }
    return errorRes("Attendance record not found", 404);
  }

  // GET /store/attendance
  if (url.includes("/store/attendance") && method === "get" && !storeAttendanceDetailsMatch) {
    const filters = config.params || {};
    let list = [...db.attendance];

    // Filter by Date
    if (filters.date) {
      list = list.filter((a) => a.date === filters.date);
    }

    // Filter by Shift
    if (filters.shiftId && filters.shiftId !== "All") {
      list = list.filter((a) => a.shiftId === filters.shiftId);
    }

    // Filter by Status
    if (filters.status && filters.status !== "All") {
      list = list.filter((a) => a.status === filters.status);
    }

    // Filter by Search and Role
    if (filters.search || (filters.role && filters.role !== "All")) {
      list = list.filter((a) => {
        const staffObj = db.staff.find((s) => s._id === a.staffId);
        if (!staffObj) return false;

        if (filters.role && filters.role !== "All") {
          if (staffObj.role !== filters.role) return false;
        }

        if (filters.search) {
          const q = filters.search.toLowerCase();
          const nameMatch = staffObj.fullName && staffObj.fullName.toLowerCase().includes(q);
          const codeMatch = staffObj.employeeCode && staffObj.employeeCode.toLowerCase().includes(q);
          return nameMatch || codeMatch;
        }

        return true;
      });
    }

    return successRes(list);
  }

  // POST /store/attendance/bulk
  if (url.includes("/store/attendance/bulk") && method === "post") {
    const payload = data || {};
    const attendances = payload.attendances || [];

    db.attendance = db.attendance.filter(
      (a) => !(a.date === payload.date && a.shiftId === payload.shiftId)
    );

    const newRecords = attendances.map((item) => {
      let checkIn = "";
      let checkOut = "";
      let totalHours = 0;
      let overtimeHours = 0;

      if (item.status === "present") {
        checkIn = "09:00 AM";
        checkOut = "05:00 PM";
        totalHours = 8.0;
        overtimeHours = 0;
      } else if (item.status === "half_day") {
        checkIn = "09:00 AM";
        checkOut = "01:00 PM";
        totalHours = 4.0;
        overtimeHours = 0;
      }

      return {
        _id: `att-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        storeId: payload.storeId || "store-indore-01",
        staffId: item.staffId,
        shiftId: payload.shiftId,
        date: payload.date,
        checkIn,
        checkOut,
        totalHours,
        overtimeHours,
        status: item.status,
        markedBy: payload.markedBy || "Shubham Jamliya",
        notes: "",
        createdAt: new Date().toISOString()
      };
    });

    db.attendance = [...newRecords, ...db.attendance];
    saveDB();
    return successRes(newRecords);
  }

  // POST /store/attendance
  if (url.includes("/store/attendance") && method === "post" && !url.includes("/bulk")) {
    const payload = data || {};
    const newRecord = {
      _id: `att-${Date.now()}`,
      storeId: payload.storeId || "store-indore-01",
      staffId: payload.staffId,
      shiftId: payload.shiftId,
      date: payload.date,
      checkIn: payload.checkIn || "",
      checkOut: payload.checkOut || "",
      totalHours: Number(payload.totalHours) || 0,
      overtimeHours: Number(payload.overtimeHours) || 0,
      status: payload.status,
      markedBy: payload.markedBy || "Shubham Jamliya",
      notes: payload.notes || "",
      createdAt: new Date().toISOString()
    };

    db.attendance = [newRecord, ...db.attendance];
    saveDB();
    return successRes(newRecord);
  }

  // PUT /store/attendance/:id
  const storeAttendancePutMatch = url.match(/\/store\/attendance\/([^/]+)$/);
  if (storeAttendancePutMatch && method === "put") {
    const id = storeAttendancePutMatch[1];
    const payload = data || {};
    const idx = db.attendance.findIndex((a) => a._id === id);
    if (idx !== -1) {
      db.attendance[idx] = {
        ...db.attendance[idx],
        shiftId: payload.shiftId ?? db.attendance[idx].shiftId,
        date: payload.date ?? db.attendance[idx].date,
        checkIn: payload.checkIn ?? db.attendance[idx].checkIn,
        checkOut: payload.checkOut ?? db.attendance[idx].checkOut,
        totalHours: payload.totalHours !== undefined ? Number(payload.totalHours) : db.attendance[idx].totalHours,
        overtimeHours: payload.overtimeHours !== undefined ? Number(payload.overtimeHours) : db.attendance[idx].overtimeHours,
        status: payload.status ?? db.attendance[idx].status,
        notes: payload.notes ?? db.attendance[idx].notes,
        markedBy: payload.markedBy ?? db.attendance[idx].markedBy
      };
      saveDB();
      return successRes(db.attendance[idx]);
    }
    return errorRes("Attendance record not found", 404);
  }

  // DELETE /store/attendance/:id
  const storeAttendanceDeleteMatch = url.match(/\/store\/attendance\/([^/]+)$/);
  if (storeAttendanceDeleteMatch && method === "delete") {
    const id = storeAttendanceDeleteMatch[1];
    const idx = db.attendance.findIndex((a) => a._id === id);
    if (idx !== -1) {
      const deleted = db.attendance[idx];
      db.attendance = db.attendance.filter((a) => a._id !== id);
      saveDB();
      return successRes(deleted);
    }
    return errorRes("Attendance record not found", 404);
  }

  // --- KITCHEN SHIFTS ENDPOINTS ---
  // GET /store/shifts/:id (Single record)
  const storeShiftsDetailsMatch = url.match(/\/store\/shifts\/([^/]+)$/);
  if (storeShiftsDetailsMatch && method === "get" && !url.includes("/assign")) {
    const id = storeShiftsDetailsMatch[1];
    const found = db.shifts.find((s) => s._id === id);
    if (found) {
      return successRes(found);
    }
    return errorRes("Shift not found", 404);
  }

  // GET /store/shifts
  if (url.includes("/store/shifts") && method === "get" && !storeShiftsDetailsMatch) {
    const filters = config.params || {};
    let list = [...db.shifts];

    if (filters.status && filters.status !== "All") {
      list = list.filter((s) => s.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((s) => s.shiftName.toLowerCase().includes(q));
    }

    return successRes(list);
  }

  // POST /store/shifts
  if (url.includes("/store/shifts") && method === "post" && !url.includes("/assign")) {
    const payload = data || {};
    const newRecord = {
      _id: payload.shiftName.replace(/ /g, "_") + "-" + Date.now(),
      storeId: payload.storeId || "store-indore-01",
      shiftName: payload.shiftName,
      startTime: payload.startTime,
      endTime: payload.endTime,
      breakMinutes: Number(payload.breakMinutes) || 0,
      maxStaff: Number(payload.maxStaff) || 5,
      assignedStaff: [],
      status: "active",
      description: payload.description || "",
      createdBy: "Shubham Jamliya",
      createdAt: new Date().toISOString()
    };

    db.shifts = [...db.shifts, newRecord];
    saveDB();
    return successRes(newRecord);
  }

  // PUT /store/shifts/:id
  const storeShiftsPutMatch = url.match(/\/store\/shifts\/([^/]+)$/);
  if (storeShiftsPutMatch && method === "put") {
    const id = storeShiftsPutMatch[1];
    const payload = data || {};
    const idx = db.shifts.findIndex((s) => s._id === id);
    if (idx !== -1) {
      db.shifts[idx] = {
        ...db.shifts[idx],
        shiftName: payload.shiftName ?? db.shifts[idx].shiftName,
        startTime: payload.startTime ?? db.shifts[idx].startTime,
        endTime: payload.endTime ?? db.shifts[idx].endTime,
        breakMinutes: payload.breakMinutes !== undefined ? Number(payload.breakMinutes) : db.shifts[idx].breakMinutes,
        maxStaff: payload.maxStaff !== undefined ? Number(payload.maxStaff) : db.shifts[idx].maxStaff,
        status: payload.status ?? db.shifts[idx].status,
        description: payload.description ?? db.shifts[idx].description
      };
      saveDB();
      return successRes(db.shifts[idx]);
    }
    return errorRes("Shift not found", 404);
  }

  // DELETE /store/shifts/:id
  const storeShiftsDeleteMatch = url.match(/\/store\/shifts\/([^/]+)$/);
  if (storeShiftsDeleteMatch && method === "delete") {
    const id = storeShiftsDeleteMatch[1];
    const idx = db.shifts.findIndex((s) => s._id === id);
    if (idx !== -1) {
      const deleted = db.shifts[idx];
      db.shifts = db.shifts.filter((s) => s._id !== id);

      // Clean up staff shift references
      db.staff = db.staff.map((s) => {
        if (s.shiftId === id) {
          return { ...s, shiftId: "" };
        }
        return s;
      });

      saveDB();
      return successRes(deleted);
    }
    return errorRes("Shift not found", 404);
  }

  // POST /store/shifts/:id/assign
  const storeShiftsAssignMatch = url.match(/\/store\/shifts\/([^/]+)\/assign$/);
  if (storeShiftsAssignMatch && method === "post") {
    const shiftId = storeShiftsAssignMatch[1];
    const payload = data || {};
    const staffIds = payload.staffIds || [];

    const idx = db.shifts.findIndex((s) => s._id === shiftId);
    if (idx !== -1) {
      // Update shift assignedStaff array
      db.shifts[idx].assignedStaff = staffIds;

      // Remove these staff members from other shifts they might have been assigned to
      db.shifts = db.shifts.map((s) => {
        if (s._id !== shiftId) {
          s.assignedStaff = s.assignedStaff.filter((id) => !staffIds.includes(id));
        }
        return s;
      });

      // Update staff shiftId references in db.staff
      db.staff = db.staff.map((s) => {
        if (staffIds.includes(s._id)) {
          return { ...s, shiftId };
        }
        if (s.shiftId === shiftId && !staffIds.includes(s._id)) {
          return { ...s, shiftId: "" };
        }
        return s;
      });

      saveDB();
      return successRes(db.shifts[idx]);
    }
    return errorRes("Shift not found", 404);
  }

  // --- STAFF PERFORMANCE ENDPOINTS ---
  // GET /store/performance/:staffId
  const storePerformanceDetailsMatch = url.match(/\/store\/performance\/([^/]+)$/);
  if (storePerformanceDetailsMatch && method === "get") {
    const staffId = storePerformanceDetailsMatch[1];
    const period = config.params?.period || "monthly";
    const found = db.performance.find((p) => p.staffId === staffId && p.period === period);
    const staffObj = db.staff.find((s) => s._id === staffId);
    if (found) {
      return successRes({ ...found, staff: staffObj || null });
    }
    return successRes({
      staffId,
      period,
      totalOrders: 0,
      avgPreparationTime: 0,
      delayedOrders: 0,
      attendancePercentage: 100,
      customerComplaints: 0,
      rating: 5.0,
      score: 100,
      staff: staffObj || null
    });
  }

  // GET /store/performance
  if (url.includes("/store/performance") && method === "get" && !storePerformanceDetailsMatch) {
    const filters = config.params || {};
    const period = filters.period || "monthly";

    let list = db.performance.filter((p) => p.period === period);

    let joinedList = list.map((p) => {
      const staffObj = db.staff.find((s) => s._id === p.staffId);
      return {
        ...p,
        fullName: staffObj?.fullName || "",
        employeeCode: staffObj?.employeeCode || "",
        role: staffObj?.role || "",
        profileImage: staffObj?.profileImage || "",
        status: staffObj?.status || "active"
      };
    });

    if (filters.role && filters.role !== "All") {
      const r = filters.role.toLowerCase().replace(/ /g, "_");
      joinedList = joinedList.filter((p) => p.role.toLowerCase().replace(/ /g, "_") === r);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      joinedList = joinedList.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.employeeCode.toLowerCase().includes(q)
      );
    }

    joinedList.sort((a, b) => b.score - a.score);

    return successRes(joinedList);
  }

  // GET /staff (supervisors query)
  if (url.includes("/staff") && !url.includes("/store/staff") && !url.includes("/reports/") && method === "get") {
    const role = config.params?.role || "";
    const status = config.params?.status || "";
    const searchQuery = config.params?.q || "";

    let list = [...db.staff];
    if (role) {
      list = list.filter(s => s.role.toLowerCase() === role.toLowerCase() || s.role.replace(/ /g, "_").toLowerCase() === role.toLowerCase());
    }
    if (status) {
      list = list.filter(s => s.status === status);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.fullName.toLowerCase().includes(q) || s.employeeCode.toLowerCase().includes(q));
    }
    return successRes(list);
  }

  // --- STAFF REPORT ENDPOINTS ---
  if (url.includes("/reports/staff/summary") || url.includes("/reports/staff/dashboard")) {
    return successRes(mockStaffDashboardSummary);
  }

  if (url.includes("/reports/staff/role-distribution")) {
    return successRes(mockStaffRoleDistribution);
  }

  if (url.includes("/reports/staff/attendance-trend")) {
    return successRes(mockStaffAttendanceTrend);
  }

  if (url.includes("/reports/staff/delivery-performance")) {
    return successRes(mockDeliveryPerformance);
  }

  if (url.includes("/reports/staff/kitchen-performance")) {
    return successRes(mockKitchenPerformance);
  }

  if (url.includes("/reports/staff/manager-performance")) {
    return successRes(mockManagerPerformance);
  }

  if (url.includes("/reports/staff/list")) {
    const search = config.params?.search || "";
    const role = config.params?.role || "All Roles";
    const status = config.params?.status || "All";
    const storeId = config.params?.storeId || "all";

    let filtered = [...mockStaffDetailedList];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.store.toLowerCase().includes(q)
      );
    }

    if (role && role !== "All Roles" && role !== "All") {
      filtered = filtered.filter(s => s.role === role);
    }

    if (status && status !== "All") {
      filtered = filtered.filter(s => s.status === status);
    }

    if (storeId && storeId !== "all") {
      const storeName = db.stores.find(st => st._id === storeId)?.name || storeId;
      filtered = filtered.filter(s => s.store.toLowerCase().includes(storeId.toLowerCase()) || s.store.includes(storeName));
    }

    const sortBy = config.params?.sortBy || "joiningDate";
    const sortOrder = config.params?.sortOrder || "desc";
    filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    const page = Number(config.params?.page) || 1;
    const limit = Number(config.params?.limit) || 10;
    const totalCount = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return successRes({
      staff: paginated,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  }

  // Get Shifts History
  const staffShiftsMatch = url.match(/\/staff\/([^/]+)\/shifts$/);
  if (staffShiftsMatch && method === "get") {
    const id = staffShiftsMatch[1];
    const shifts = mockStaffShifts[id] || [
      { date: "2026-06-22", startTime: "09:00", endTime: "17:00", breakTime: 45, hoursWorked: 7.25, status: "Completed" },
      { date: "2026-06-21", startTime: "09:00", endTime: "17:00", breakTime: 45, hoursWorked: 7.25, status: "Completed" }
    ];
    return successRes({ shifts });
  }

  // Get Single Staff Details
  const singleStaffMatch = url.match(/\/staff\/([^/]+)$/);
  if (singleStaffMatch && method === "get" && !url.includes("/reports/")) {
    const id = singleStaffMatch[1];
    const staffBase = mockStaffDetailedList.find(s => s.id === id) || mockStaffDetailedList[0];

    const staffDetail = {
      ...staffBase,
      phone: "+91 99887 76655",
      email: `${staffBase.name.toLowerCase().replace(" ", ".")}@papaveg.com`,
      emergencyContact: "+91 98765 43210",
      attendanceSummary: {
        presentDays: 24,
        absentDays: 2,
        lateEntries: 3,
        halfDays: 1,
        attendancePercentage: staffBase.attendancePercentage,
        workingHours: 185.5
      },
      performanceMetrics: {
        completedOrders: staffBase.role === "Kitchen Staff" ? 320 : 0,
        completedDeliveries: staffBase.role === "Delivery Partner" ? 540 : 0,
        customerRatings: staffBase.role === "Store Manager" ? 4.7 : (staffBase.role === "Delivery Partner" ? 4.8 : 4.6),
        revenueContribution: staffBase.role === "Store Manager" ? 1680000 : 250000,
        performanceScore: staffBase.performanceScore,
        averageShiftHours: 7.8
      },
      deliveryMetrics: staffBase.role === "Delivery Partner" ? {
        deliveriesCompleted: 540,
        distanceCovered: 1620,
        averageDeliveryTime: 22.4,
        rating: 4.8,
        totalEarnings: 16200
      } : null,
      kitchenMetrics: staffBase.role === "Kitchen Staff" ? {
        ordersPrepared: 320,
        averagePreparationTime: 12.8,
        efficiencyPercentage: 96.5,
        shiftHours: 180
      } : null,
      managerMetrics: staffBase.role === "Store Manager" ? {
        ordersManaged: 4890,
        revenueGenerated: 1680000,
        complaintsHandled: 12,
        customerSatisfactionScore: 94.5
      } : null
    };

    return successRes(staffDetail);
  }

  // Get Generated Staff Reports list
  if (url.includes("/staff-reports") && method === "get") {
    return successRes(db.generated_staff_reports);
  }

  // Generate Staff Report
  if (url.includes("/reports/staff/generate") && method === "post") {
    const newRep = {
      id: `STF-2026-${Math.floor(100 + Math.random() * 900)}`,
      role: data?.role || "All Roles",
      storeName: data?.storeId === "all" ? "All Stores (Franchise-wide)" : (db.stores.find(st => st._id === data.storeId)?.name || data.storeId),
      startDate: data?.startDate || "2026-06-23",
      endDate: data?.endDate || "2026-06-23",
      status: "Completed",
      generatedBy: "Rashi Kumar (Admin)",
      createdAt: new Date().toISOString(),
      fileUrl: "#"
    };
    db.generated_staff_reports.unshift(newRep);
    saveDB();
    return successRes({
      reportId: newRep.id,
      fileUrl: newRep.fileUrl,
      status: newRep.status
    });
  }

  // Delete Generated Staff Report
  const deleteStaffReportMatch = url.match(/\/staff-reports\/([^/]+)$/);
  if (deleteStaffReportMatch && method === "delete") {
    const id = deleteStaffReportMatch[1];
    db.generated_staff_reports = db.generated_staff_reports.filter(r => r.id !== id);
    saveDB();
    return successRes({ success: true, message: "Report deleted successfully" });
  }

  // Export Staff Report
  const exportStaffReportMatch = url.match(/\/staff-reports\/([^/]+)\/export$/);
  if (exportStaffReportMatch && method === "get") {
    const id = exportStaffReportMatch[1];
    const rep = db.generated_staff_reports.find(r => r.id === id) || db.generated_staff_reports[0];
    return successRes(rep);
  }

  // --- INVENTORY REPORT ENDPOINTS ---
  if (url.includes("/reports/inventory/summary") || url.includes("/reports/inventory/dashboard")) {
    return successRes(mockInventorySummary);
  }

  if (url.includes("/reports/inventory/consumption-trend")) {
    return successRes(mockConsumptionTrend);
  }

  if (url.includes("/reports/inventory/low-stock")) {
    return successRes(mockLowStockList);
  }

  if (url.includes("/reports/inventory/ingredient-usage")) {
    const search = config.params?.search || "";
    const category = config.params?.category || "All";
    const stockStatus = config.params?.stockStatus || "All";

    let filtered = [...mockIngredientUsage];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i && (
          (i.name || "").toLowerCase().includes(q) ||
          (i.category || "").toLowerCase().includes(q)
        )
      );
    }

    if (category && category !== "All") {
      filtered = filtered.filter(i => i && i.category === category);
    }

    if (stockStatus && stockStatus !== "All") {
      filtered = filtered.filter(i => {
        if (!i) return false;
        if (stockStatus === "Low Stock") return i.closingStock <= 30 && i.closingStock > 10;
        if (stockStatus === "Critical") return i.closingStock <= 10 && i.closingStock > 0;
        if (stockStatus === "Out Of Stock") return i.closingStock === 0;
        return i.closingStock > 30; // Normal
      });
    }

    return successRes(filtered);
  }

  if (url.includes("/reports/inventory/purchase-analytics")) {
    return successRes(mockPurchaseRequestsAnalytics);
  }

  if (url.includes("/purchase-requests")) {
    const search = config.params?.search || "";
    let filtered = [...mockPurchaseRequests];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(pr => pr.ingredient.toLowerCase().includes(q) || pr.supplier.toLowerCase().includes(q));
    }
    return successRes(filtered);
  }

  if (url.includes("/stock-transactions")) {
    const search = config.params?.search || "";
    let filtered = [...mockStockTransactions];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(tx => tx.ingredient.toLowerCase().includes(q) || tx.transactionType.toLowerCase().includes(q));
    }
    return successRes(filtered);
  }

  if (url.includes("/reports/inventory/suppliers")) {
    return successRes(mockSuppliersSummary);
  }

  if (url.includes("/reports/inventory/list")) {
    const search = config.params?.search || "";
    let filtered = [...db.generated_inventory_reports];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => r.storeName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }

    const sortBy = config.params?.sortBy || "createdAt";
    const sortOrder = config.params?.sortOrder || "desc";
    filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    const page = Number(config.params?.page) || 1;
    const limit = Number(config.params?.limit) || 10;
    const totalCount = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return successRes({
      reports: paginated,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  }

  // Get report detail
  const singleInventoryReportMatch = url.match(/\/reports\/inventory\/([^/]+)$/);
  if (singleInventoryReportMatch && method === "get" && !url.includes("/list") && !url.includes("/generate")) {
    const id = singleInventoryReportMatch[1];
    const reportBase = db.generated_inventory_reports.find(r => r.id === id) || db.generated_inventory_reports[0];

    const reportDetail = {
      ...reportBase,
      openingStock: 1540,
      purchasedQuantity: 1800,
      consumedQuantity: 1245,
      closingStock: 2095,
      wastage: 59.8,
      currentInventoryValue: reportBase.stockValue,
      ingredientsTrend: [
        { date: "Mon", consumption: 180, purchases: 150, wastage: 8 },
        { date: "Tue", consumption: 190, purchases: 200, wastage: 12 },
        { date: "Wed", consumption: 210, purchases: 300, wastage: 6 },
        { date: "Thu", consumption: 175, purchases: 150, wastage: 14 }
      ]
    };
    return successRes(reportDetail);
  }

  if (url.includes("/reports/inventory/generate") && method === "post") {
    const newRep = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      storeName: data?.storeId === "all" ? "All Stores (Franchise-wide)" : (db.stores.find(st => st._id === data.storeId)?.name || data.storeId),
      startDate: data?.startDate || "2026-06-23",
      endDate: data?.endDate || "2026-06-23",
      itemsConsumed: Math.floor(1000 + Math.random() * 2000),
      stockValue: Math.floor(500000 + Math.random() * 500000),
      generatedBy: "Rashi Kumar (Admin)",
      status: "Completed",
      createdAt: new Date().toISOString(),
      fileUrl: "#"
    };
    db.generated_inventory_reports.unshift(newRep);
    saveDB();
    return successRes({
      reportId: newRep.id,
      fileUrl: newRep.fileUrl,
      status: newRep.status
    });
  }

  // Delete inventory report log
  const deleteInventoryReportMatch = url.match(/\/reports\/inventory\/([^/]+)$/);
  if (deleteInventoryReportMatch && method === "delete") {
    const id = deleteInventoryReportMatch[1];
    db.generated_inventory_reports = db.generated_inventory_reports.filter(r => r.id !== id);
    saveDB();
    return successRes({ success: true, message: "Inventory report deleted successfully" });
  }

  // GET /store/riders
  if (url.includes("/store/riders") && method === "get") {
    return successRes(db.store_riders);
  }

  // GET /store/rider/:id
  const riderDetailMatch = url.match(/\/store\/rider\/([^/]+)$/);
  if (riderDetailMatch && method === "get") {
    const id = riderDetailMatch[1];
    const rider = db.store_riders.find((r) => r._id === id);
    if (rider) {
      return successRes(rider);
    }
    return errorRes("Rider not found", 404);
  }

  // GET /store/delivery/live
  if (url.includes("/store/delivery/live") && method === "get") {
    return successRes(db.live_deliveries);
  }

  // GET /store/tracking/:orderId
  const trackingDetailMatch = url.match(/\/store\/tracking\/([^/]+)$/);
  if (trackingDetailMatch && method === "get") {
    const id = trackingDetailMatch[1];
    const tracking = db.tracking_data[id];
    if (tracking) {
      return successRes(tracking);
    }
    return errorRes("Tracking not found for order", 404);
  }

  // GET /store/delivery/issues
  if (url.includes("/store/delivery/issues") && method === "get") {
    return successRes(db.delivery_issues);
  }

  // POST /store/delivery/issues
  if (url.includes("/store/delivery/issues") && method === "post") {
    const rider = db.store_riders.find(r => r._id === data.riderId);
    const newIssue = {
      _id: `TKT-${Math.floor(305 + Math.random() * 100)}`,
      orderId: data.orderId,
      riderId: data.riderId,
      riderName: rider ? rider.name : "Not Assigned",
      issueType: data.issueType,
      description: data.description || "",
      reportedBy: data.reportedBy || "Store Manager",
      severity: data.severity || "medium",
      status: "open",
      resolution: "",
      refundAmount: 0,
      penaltyAmount: 0,
      createdAt: new Date().toISOString()
    };
    db.delivery_issues.unshift(newIssue);

    // Add a timeline node
    if (!db.delivery_timelines[data.orderId]) {
      db.delivery_timelines[data.orderId] = [];
    }
    db.delivery_timelines[data.orderId].push({
      status: `issue_reported_${data.issueType.toLowerCase().replace(/\s+/g, "_")}`,
      updatedBy: data.reportedBy || "Store Manager",
      timestamp: new Date().toISOString()
    });

    // Create notification
    const newNotif = {
      _id: `notif-${Date.now()}`,
      userId: "manager-1",
      title: "Delivery Issue Created",
      message: `${data.issueType} reported for Order ${data.orderId}`,
      type: data.severity === "critical" ? "critical" : "warning",
      isRead: false,
      createdAt: new Date().toISOString()
    };
    db.delivery_notifications.unshift(newNotif);

    saveDB();
    return successRes(newIssue);
  }

  // PATCH /store/delivery/issues/:id
  const issuePatchMatch = url.match(/\/store\/delivery\/issues\/([^/]+)$/);
  if (issuePatchMatch && method === "patch") {
    const id = issuePatchMatch[1];
    const idx = db.delivery_issues.findIndex(iss => iss._id === id);
    if (idx !== -1) {
      const issue = db.delivery_issues[idx];
      const updated = {
        ...issue,
        ...data,
      };

      if (data.reassignRiderId) {
        const newRider = db.store_riders.find(r => r._id === data.reassignRiderId);
        if (newRider) {
          updated.riderId = newRider._id;
          updated.riderName = newRider.name;
        }
      }

      db.delivery_issues[idx] = updated;

      // Update timelines
      if (db.delivery_timelines[issue.orderId]) {
        db.delivery_timelines[issue.orderId].push({
          status: `issue_resolved_${updated.status}`,
          updatedBy: "Store Manager",
          timestamp: new Date().toISOString()
        });
      }

      // Create notification
      const newNotif = {
        _id: `notif-${Date.now()}`,
        userId: "manager-1",
        title: `Issue ${updated.status}`,
        message: `Issue ticket ${id} has been set to ${updated.status}.`,
        type: updated.status === "resolved" ? "success" : "info",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      db.delivery_notifications.unshift(newNotif);

      saveDB();
      return successRes(updated);
    }
    return errorRes("Issue ticket not found", 404);
  }

  // GET /store/delivery/notifications
  if (url.includes("/store/delivery/notifications") && method === "get") {
    return successRes(db.delivery_notifications);
  }

  // PATCH /store/delivery/notifications/:id
  const notifPatchMatch = url.match(/\/store\/delivery\/notifications\/([^/]+)$/);
  if (notifPatchMatch && method === "patch") {
    const id = notifPatchMatch[1];
    const idx = db.delivery_notifications.findIndex(n => n._id === id);
    if (idx !== -1) {
      db.delivery_notifications[idx].isRead = true;
      saveDB();
      return successRes(db.delivery_notifications[idx]);
    }
    return errorRes("Notification not found", 404);
  }

  // GET /store/delivery/timeline/:orderId
  const timelineMatch = url.match(/\/store\/delivery\/timeline\/([^/]+)$/);
  if (timelineMatch && method === "get") {
    const orderId = timelineMatch[1];
    const timeline = db.delivery_timelines[orderId] || [];
    return successRes(timeline);
  }

  const cleanUrl = url.split("?")[0];

  // GET /store/complaints
  if (cleanUrl.endsWith("/store/complaints") && method === "get") {
    const search = config.params?.search || "";
    const complaintType = config.params?.complaintType || "";
    const priority = config.params?.priority || "";
    const status = config.params?.status || "";
    const startDate = config.params?.startDate || "";
    const endDate = config.params?.endDate || "";
    const page = Number(config.params?.page) || 1;
    const limit = Number(config.params?.limit) || 10;
    const sortBy = config.params?.sortBy || "createdAt";
    const sortOrder = config.params?.sortOrder || "desc";

    let filtered = [...db.customer_complaints];

    // Filter by search (customer name, email, phone, order number, complaint description, or complaint ID)
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => {
        const customer = db.customers.find(cust => cust._id === c.customerId);
        const order = db.store_orders.find(ord => ord._id === c.orderId);

        return (
          c._id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.complaintType.toLowerCase().includes(q) ||
          (customer && (
            customer.name.toLowerCase().includes(q) ||
            customer.email.toLowerCase().includes(q) ||
            customer.mobile.includes(q)
          )) ||
          (order && order.orderNumber.toLowerCase().includes(q))
        );
      });
    }

    // Filter by type
    if (complaintType && complaintType !== "All") {
      filtered = filtered.filter(c => c.complaintType.toLowerCase() === complaintType.toLowerCase());
    }

    // Filter by priority
    if (priority && priority !== "All") {
      filtered = filtered.filter(c => c.priority.toLowerCase() === priority.toLowerCase());
    }

    // Filter by status
    if (status && status !== "All") {
      filtered = filtered.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(c => {
        const d = new Date(c.createdAt).getTime();
        return d >= start && d <= end;
      });
    }

    // Map each complaint to include customer profile summary and order number
    const complaintsWithDetails = filtered.map(c => {
      const customer = db.customers.find(cust => cust._id === c.customerId);
      const order = db.store_orders.find(ord => ord._id === c.orderId);
      return {
        ...c,
        customerName: customer ? customer.name : "Unknown",
        customerMobile: customer ? customer.mobile : "",
        customerEmail: customer ? customer.email : "",
        orderNumber: order ? order.orderNumber : "N/A"
      };
    });

    // Sorting
    complaintsWithDetails.sort((a, b) => {
      let valA, valB;
      if (sortBy === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? valA - valB : valB - valA;
      } else if (sortBy === "priority") {
        const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        valA = priorityOrder[a.priority.toLowerCase()] || 0;
        valB = priorityOrder[b.priority.toLowerCase()] || 0;
      } else if (sortBy === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sortBy === "complaintType") {
        valA = a.complaintType;
        valB = b.complaintType;
      } else if (sortBy === "customerName") {
        valA = a.customerName;
        valB = b.customerName;
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    const totalCount = complaintsWithDetails.length;
    const pages = Math.ceil(totalCount / limit);
    const start = (page - 1) * limit;
    const paginated = complaintsWithDetails.slice(start, start + limit);

    return successRes({
      complaints: paginated,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages
      }
    });
  }

  // GET /store/complaints/:id
  const complaintDetailMatch = cleanUrl.match(/\/store\/complaints\/([^/]+)$/);
  if (complaintDetailMatch && !url.includes("/resolve") && method === "get") {
    const id = complaintDetailMatch[1];
    const complaint = db.customer_complaints.find(c => c._id === id);
    if (!complaint) {
      return errorRes("Complaint not found", 404);
    }

    const customer = db.customers.find(cust => cust._id === complaint.customerId);
    const order = db.store_orders.find(ord => ord._id === complaint.orderId);
    let orderItems = [];
    if (order) {
      orderItems = db.order_items.filter(it => it.orderId === order._id);
    }

    return successRes({
      ...complaint,
      customer: customer || null,
      order: order ? {
        ...order,
        items: orderItems
      } : null
    });
  }

  // PUT /store/complaints/:id/resolve
  const complaintResolveMatch = cleanUrl.match(/\/store\/complaints\/([^/]+)\/resolve$/);
  if (complaintResolveMatch && method === "put") {
    const id = complaintResolveMatch[1];
    const complaintIdx = db.customer_complaints.findIndex(c => c._id === id);
    if (complaintIdx === -1) {
      return errorRes("Complaint not found", 404);
    }

    const complaint = db.customer_complaints[complaintIdx];
    const refundAmount = Number(data?.refundAmount) || 0;
    const replacementOrderId = data?.replacementOrderId || "";
    const couponIssued = data?.couponIssued || "";
    const actionTaken = data?.actionTaken || "Resolved by store supervisor";
    const resolvedBy = data?.staff || data?.resolvedBy || "Store Manager";

    const updated = {
      ...complaint,
      status: "resolved",
      resolvedBy,
      updatedAt: new Date().toISOString(),
      resolution: {
        actionTaken,
        resolvedBy,
        refundAmount,
        replacementOrderId,
        couponIssued,
        evidenceImage: data?.evidenceImage || "",
        resolvedAt: new Date().toISOString()
      }
    };

    db.customer_complaints[complaintIdx] = updated;

    // Handle refund simulation
    if (refundAmount > 0 && complaint.orderId) {
      const order = db.store_orders.find(o => o._id === complaint.orderId);
      if (order) {
        order.paymentStatus = "refunded";
        order.orderStatus = "refunded";

        // Add to refunds log
        const refundExists = db.refunds.some(r => r.orderId === order._id);
        if (!refundExists) {
          db.refunds.unshift({
            _id: `ref-${Math.floor(100 + Math.random() * 900)}`,
            orderId: order._id,
            orderNumber: order.orderNumber,
            reason: complaint.description || "Customer Complaint / Quality Issues",
            amount: refundAmount,
            status: "approved",
            approvedBy: resolvedBy,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    saveDB();
    return successRes(updated);
  }

  // GET /store/reviews
  if (cleanUrl.endsWith("/store/reviews") && method === "get") {
    const search = config.params?.search || "";
    const rating = config.params?.rating || "All";
    const sentiment = config.params?.sentiment || "All";
    const replyStatus = config.params?.replyStatus || "All";
    const startDate = config.params?.startDate || "";
    const endDate = config.params?.endDate || "";
    const page = Number(config.params?.page) || 1;
    const limit = Number(config.params?.limit) || 10;
    const sortBy = config.params?.sortBy || "createdAt";
    const sortOrder = config.params?.sortOrder || "desc";

    let filtered = [...db.customer_reviews];

    // Filter by search (customer name, email, mobile)
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => {
        const customer = db.customers.find(cust => cust._id === r.customerId);
        return customer && (
          customer.name.toLowerCase().includes(q) ||
          customer.email.toLowerCase().includes(q) ||
          customer.mobile.includes(q)
        );
      });
    }

    // Filter by rating
    if (rating && rating !== "All") {
      const ratingNum = Number(rating.replace(/[^0-9]/g, ""));
      if (!isNaN(ratingNum)) {
        filtered = filtered.filter(r => r.rating === ratingNum);
      }
    }

    // Filter by sentiment
    if (sentiment && sentiment !== "All") {
      filtered = filtered.filter(r => r.sentiment.toLowerCase() === sentiment.toLowerCase());
    }

    // Filter by reply status
    if (replyStatus && replyStatus !== "All") {
      if (replyStatus.toLowerCase() === "replied") {
        filtered = filtered.filter(r => r.reply !== null && r.reply !== undefined);
      } else if (replyStatus.toLowerCase() === "pending" || replyStatus.toLowerCase() === "pending_reply") {
        filtered = filtered.filter(r => r.reply === null || r.reply === undefined);
      }
    }

    // Date range
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(r => {
        const d = new Date(r.createdAt).getTime();
        return d >= start && d <= end;
      });
    }

    // Join customer details and order number
    const reviewsWithDetails = filtered.map(r => {
      const customer = db.customers.find(cust => cust._id === r.customerId);
      const order = db.store_orders.find(ord => ord._id === r.orderId);
      return {
        ...r,
        customerName: customer ? customer.name : "Unknown",
        customerMobile: customer ? customer.mobile : "",
        customerEmail: customer ? customer.email : "",
        orderNumber: order ? order.orderNumber : "N/A"
      };
    });

    // Sorting
    reviewsWithDetails.sort((a, b) => {
      let valA, valB;
      if (sortBy === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? valA - valB : valB - valA;
      } else if (sortBy === "rating") {
        valA = a.rating;
        valB = b.rating;
      } else if (sortBy === "sentiment") {
        valA = a.sentiment;
        valB = b.sentiment;
      } else if (sortBy === "customerName") {
        valA = a.customerName;
        valB = b.customerName;
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    const totalCount = reviewsWithDetails.length;
    const pages = Math.ceil(totalCount / limit);
    const start = (page - 1) * limit;
    const paginated = reviewsWithDetails.slice(start, start + limit);

    return successRes({
      reviews: paginated,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages
      }
    });
  }

  // GET /store/reviews/:id
  const reviewDetailMatch = cleanUrl.match(/\/store\/reviews\/([^/]+)$/);
  if (reviewDetailMatch && !url.includes("/reply") && method === "get") {
    const reviewId = reviewDetailMatch[1];
    const review = db.customer_reviews.find(r => r._id === reviewId);
    if (!review) {
      return errorRes("Review not found", 404);
    }

    const customer = db.customers.find(cust => cust._id === review.customerId);
    const order = db.store_orders.find(ord => ord._id === review.orderId);
    let orderItems = [];
    if (order) {
      orderItems = db.order_items.filter(it => it.orderId === order._id);
    }

    // Stats
    let customerStatistics = { totalOrders: 0, totalSpent: 0, loyaltyPoints: 0, averageRatingGiven: 0 };
    if (customer) {
      const allCustReviews = db.customer_reviews.filter(r => r.customerId === customer._id);
      const totalCustRating = allCustReviews.reduce((sum, r) => sum + r.rating, 0);
      customerStatistics = {
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        loyaltyPoints: customer.loyaltyPoints,
        averageRatingGiven: allCustReviews.length > 0 ? (totalCustRating / allCustReviews.length).toFixed(1) : 0
      };
    }

    return successRes({
      review,
      customer: customer || null,
      order: order || null,
      orderItems,
      customerStatistics
    });
  }

  // POST /store/reviews/:id/reply
  const reviewReplyMatch = cleanUrl.match(/\/store\/reviews\/([^/]+)\/reply$/);
  if (reviewReplyMatch && method === "post") {
    const reviewId = reviewReplyMatch[1];
    const reviewIdx = db.customer_reviews.findIndex(r => r._id === reviewId);
    if (reviewIdx === -1) {
      return errorRes("Review not found", 404);
    }

    const review = db.customer_reviews[reviewIdx];
    const updated = {
      ...review,
      reply: {
        text: data?.text || "",
        repliedBy: data?.repliedBy || "Store Manager",
        repliedAt: new Date().toISOString()
      }
    };

    db.customer_reviews[reviewIdx] = updated;
    saveDB();
    return successRes(updated);
  }

  // GET /store/customers/orders
  if (url.includes("/store/customers/orders") && method === "get") {
    const search = config.params?.search || "";
    const status = config.params?.status || "";
    const paymentStatus = config.params?.paymentStatus || "";
    const returning = config.params?.returning === "true" || config.params?.returning === true;
    const highValue = config.params?.highValue === "true" || config.params?.highValue === true;
    const startDate = config.params?.startDate || "";
    const endDate = config.params?.endDate || "";
    const page = Number(config.params?.page) || 1;
    const limit = Number(config.params?.limit) || 10;
    const sortBy = config.params?.sortBy || "name";
    const sortOrder = config.params?.sortOrder || "asc";

    let filtered = [...db.customers];

    // Filter by search (name, email, mobile)
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.mobile.includes(q)
      );
    }

    // Filter by returning customer (totalOrders > 1)
    if (returning) {
      filtered = filtered.filter(c => c.totalOrders > 1);
    }

    // Filter by high value customer (totalSpent >= 5000)
    if (highValue) {
      filtered = filtered.filter(c => c.totalSpent >= 5000);
    }

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(c => {
        const d = new Date(c.lastOrderDate).getTime();
        return d >= start && d <= end;
      });
    }

    // Join order details for table display (each customer gets their latest order details)
    let customersWithOrders = filtered.map(c => {
      // Find latest order for this customer
      const cOrders = db.store_orders.filter(o => o.customerId === c._id);
      cOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latestOrder = cOrders[0] || null;
      return {
        ...c,
        recentOrder: latestOrder ? {
          _id: latestOrder._id,
          orderNumber: latestOrder.orderNumber,
          createdAt: latestOrder.createdAt,
          totalAmount: latestOrder.totalAmount,
          paymentStatus: latestOrder.paymentStatus,
          deliveryType: latestOrder.deliveryType,
          orderStatus: latestOrder.orderStatus
        } : null
      };
    });

    // Apply Order Status filter
    if (status && status !== "All") {
      customersWithOrders = customersWithOrders.filter(c =>
        c.recentOrder && c.recentOrder.orderStatus.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply Payment Status filter
    if (paymentStatus && paymentStatus !== "All") {
      customersWithOrders = customersWithOrders.filter(c =>
        c.recentOrder && c.recentOrder.paymentStatus.toLowerCase() === paymentStatus.toLowerCase()
      );
    }

    // Sorting
    customersWithOrders.sort((a, b) => {
      let valA, valB;
      if (sortBy === "name") {
        valA = a.name;
        valB = b.name;
      } else if (sortBy === "mobile") {
        valA = a.mobile;
        valB = b.mobile;
      } else if (sortBy === "orderNumber") {
        valA = a.recentOrder ? a.recentOrder.orderNumber : "";
        valB = b.recentOrder ? b.recentOrder.orderNumber : "";
      } else if (sortBy === "lastOrderDate" || sortBy === "orderDate") {
        valA = a.lastOrderDate;
        valB = b.lastOrderDate;
      } else if (sortBy === "totalSpent" || sortBy === "orderAmount" || sortBy === "totalAmount") {
        valA = a.recentOrder ? a.recentOrder.totalAmount : 0;
        valB = b.recentOrder ? b.recentOrder.totalAmount : 0;
      } else if (sortBy === "totalOrders") {
        valA = a.totalOrders;
        valB = b.totalOrders;
      } else {
        valA = a.name;
        valB = b.name;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    const totalCount = customersWithOrders.length;
    const pages = Math.ceil(totalCount / limit);
    const start = (page - 1) * limit;
    const paginated = customersWithOrders.slice(start, start + limit);

    return successRes({
      customers: paginated,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages
      }
    });
  }

  // GET /store/customers/:customerId
  const customerDetailMatch = url.match(/\/store\/customers\/([^/]+)$/);
  if (customerDetailMatch && method === "get") {
    const customerId = customerDetailMatch[1];
    const customer = db.customers.find(c => c._id === customerId);
    if (!customer) {
      return errorRes("Customer not found", 404);
    }

    const recentOrders = db.store_orders.filter(o => o.customerId === customerId);
    recentOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const complaints = db.customer_complaints.filter(c => c.customerId === customerId);
    const reviews = db.customer_reviews.filter(r => r.customerId === customerId);

    return successRes({
      customerProfile: customer,
      recentOrders,
      complaints,
      reviews
    });
  }

  // GET /store/orders/:orderId
  const orderDetailMatch = url.match(/\/store\/orders\/([^/]+)$/);
  if (orderDetailMatch && method === "get") {
    const orderId = orderDetailMatch[1];
    const order = db.store_orders.find(o => o._id === orderId);
    if (!order) {
      return errorRes("Order not found", 404);
    }

    const customer = db.customers.find(c => c._id === order.customerId);
    const items = db.order_items.filter(it => it.orderId === orderId);
    const payments = db.payments.filter(p => p.orderId === orderId);

    // Get delivery tracking nodes
    const trackingObj = db.delivery_tracking.find(t => t.orderId === orderId);
    const deliveryTracking = trackingObj ? trackingObj.stages : [];

    const refunds = db.refunds.filter(r => r.orderId === orderId);

    return successRes({
      order: {
        ...order,
        customerName: customer ? customer.name : "Unknown Customer",
        customerEmail: customer ? customer.email : "",
        customerMobile: customer ? customer.mobile : ""
      },
      items: items.map(it => ({
        ...it,
        subtotal: it.quantity * it.price
      })),
      payments,
      deliveryTracking,
      refunds
    });
  }

  // POST /store/orders/:orderId/refund (Trigger simulated refund request)
  const orderRefundMatch = url.match(/\/store\/orders\/([^/]+)\/refund$/);
  if (orderRefundMatch && method === "post") {
    const orderId = orderRefundMatch[1];
    const order = db.store_orders.find(o => o._id === orderId);
    if (!order) {
      return errorRes("Order not found", 404);
    }

    // Create a refund record
    const newRefund = {
      _id: `ref-${Math.floor(100 + Math.random() * 900)}`,
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason: data?.reason || "Customer Complaint / Quality Issues",
      amount: order.totalAmount,
      status: "pending",
      approvedBy: "--",
      createdAt: new Date().toISOString()
    };

    db.refunds.unshift(newRefund);

    // Update order paymentStatus and orderStatus
    order.paymentStatus = "refunded";
    order.orderStatus = "refunded";

    saveDB();
    return successRes(newRefund);
  }

  // Default Fallback: Success for all operations so the admin panel continues working
  return successRes({ success: true, message: "Stubbed operational response" });
}
