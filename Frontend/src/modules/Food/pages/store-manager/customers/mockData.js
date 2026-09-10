export const mockCustomers = [
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

export const mockOrders = [
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
  }
];

export const mockComplaints = [
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

export const mockReviews = [
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

export const mockOrderItems = [
  { _id: "item-1", orderId: "ord-1", name: "Veg Supreme Pizza", price: 380, quantity: 1, customizations: "Extra cheese" },
  { _id: "item-2", orderId: "ord-1", name: "Garlic Bread", price: 100, quantity: 1, customizations: "" },
  { _id: "item-3", orderId: "ord-2", name: "Farmhouse Delight Pizza", price: 420, quantity: 1, customizations: "Thin Crust" },
  { _id: "item-4", orderId: "ord-2", name: "Garlic Bread", price: 100, quantity: 1, customizations: "" },
  { _id: "item-5", orderId: "ord-2", name: "Pepsi 500ml", price: 70, quantity: 1, customizations: "" },
  { _id: "item-6", orderId: "ord-4", name: "Double Cheese Margherita", price: 320, quantity: 2, customizations: "" },
  { _id: "item-7", orderId: "ord-4", name: "Choco Lava Cake", price: 110, quantity: 1, customizations: "" },
  { _id: "item-8", orderId: "ord-5", name: "Tandoori Paneer Pizza", price: 450, quantity: 1, customizations: "Spicy" }
];

export const mockStaff = [
  { _id: "staff-1", fullName: "Rohan Sharma", role: "Kitchen Supervisor" },
  { _id: "staff-2", fullName: "Priya Patel", role: "Pizza Maker" },
  { _id: "staff-3", fullName: "Amit Kumar", role: "Rider Leader" },
  { _id: "staff-4", fullName: "Sandhya Roy", role: "Customer Support" }
];


