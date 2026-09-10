// Mock data for Papa Veg Pizza Campaign Management Page (Indian Context)

export const mockStores = [
  { _id: "store-indore-1", name: "Indore Central (Vijay Nagar)" },
  { _id: "store-indore-2", name: "Indore Sudama Nagar" },
  { _id: "store-bhopal-1", name: "Bhopal MP Nagar" },
  { _id: "store-bhopal-2", name: "Bhopal Arera Colony" },
  { _id: "store-ujjain-1", name: "Ujjain Freeganj" },
  { _id: "store-dewas-1", name: "Dewas Bypass Outlet" },
  { _id: "store-jabalpur-1", name: "Jabalpur Civic Center" }
];

export const mockCampaigns = [
  {
    _id: "camp-1",
    franchiseId: "fran-central-1",
    campaignName: "Diwali Dhamaka Veggie Combo",
    campaignType: "festival",
    description: "Special Diwali festival offer featuring flat 25% off on family veggie pizza combos. Promoted via local push notifications and SMS banners.",
    startDate: "2026-10-15",
    endDate: "2026-11-05",
    budget: 120000,
    targetAudience: "all",
    stores: ["store-indore-1", "store-indore-2", "store-bhopal-1", "store-ujjain-1"],
    expectedReach: 75000,
    status: "draft",
    createdBy: "Shubham Jamliya",
    createdAt: "2026-06-20T10:00:00Z"
  },
  {
    _id: "camp-2",
    franchiseId: "fran-central-1",
    campaignName: "Monsoon Weekend Pizza Party",
    campaignType: "weekend_offer",
    description: "Buy 1 Get 1 Free on all Medium Pizzas every Saturday and Sunday during the rainy season. Targeted at weekend group orders.",
    startDate: "2026-06-01",
    endDate: "2026-07-31",
    budget: 85000,
    targetAudience: "loyalty",
    stores: ["store-indore-1", "store-indore-2", "store-bhopal-2", "store-dewas-1"],
    expectedReach: 45050,
    status: "active",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-05-25T11:30:00Z"
  },
  {
    _id: "camp-3",
    franchiseId: "fran-central-1",
    campaignName: "Midnight Paneer Tikka Flash Sale",
    campaignType: "flash_sale",
    description: "Late night flash sale. Save flat ₹150 on Paneer Tikka pizza and garlic bread combo between 10 PM and 1 AM.",
    startDate: "2026-06-15",
    endDate: "2026-06-30",
    budget: 45000,
    targetAudience: "all",
    stores: ["store-indore-1", "store-bhopal-1", "store-jabalpur-1"],
    expectedReach: 32000,
    status: "active",
    createdBy: "Amit Sharma",
    createdAt: "2026-06-14T09:15:00Z"
  },
  {
    _id: "camp-4",
    franchiseId: "fran-central-1",
    campaignName: "New User First Feast Combo",
    campaignType: "combo_offer",
    description: "Welcome offer combo featuring 1 Personal Pizza + 1 Stuffed Garlic Bread + 1 Drink at just ₹249 for new app users.",
    startDate: "2026-05-01",
    endDate: "2026-09-30",
    budget: 95000,
    targetAudience: "new",
    stores: ["store-indore-2", "store-ujjain-1", "store-dewas-1", "store-jabalpur-1"],
    expectedReach: 60000,
    status: "active",
    createdBy: "Shubham Jamliya",
    createdAt: "2026-04-28T08:00:00Z"
  },
  {
    _id: "camp-5",
    franchiseId: "fran-central-1",
    campaignName: "IPL Final Cheese Burst Flash Sale",
    campaignType: "flash_sale",
    description: "Super flash sale during the IPL final match. Flat 40% off on all cheese burst pizzas for orders placed during the game hours.",
    startDate: "2026-05-24",
    endDate: "2026-05-25",
    budget: 50000,
    targetAudience: "all",
    stores: ["store-indore-1", "store-indore-2", "store-bhopal-1", "store-bhopal-2", "store-ujjain-1", "store-dewas-1", "store-jabalpur-1"],
    expectedReach: 90000,
    status: "completed",
    createdBy: "Shubham Jamliya",
    createdAt: "2026-05-20T12:00:00Z"
  },
  {
    _id: "camp-6",
    franchiseId: "fran-central-1",
    campaignName: "Midweek Pizza Bonanza",
    campaignType: "weekend_offer",
    description: "Flat ₹100 discount on orders above ₹499 on Wednesdays and Thursdays to boost midweek order frequency.",
    startDate: "2026-06-01",
    endDate: "2026-06-20", // Expired
    budget: 35000,
    targetAudience: "all",
    stores: ["store-ujjain-1", "store-dewas-1"],
    expectedReach: 15000,
    status: "completed",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-05-28T14:40:00Z"
  },
  {
    _id: "camp-7",
    franchiseId: "fran-central-1",
    campaignName: "Holi Special Capsicum Feast",
    campaignType: "festival",
    description: "Festival of colors special: capsicum and onion supreme pizza at flat 50% discount.",
    startDate: "2026-03-10",
    endDate: "2026-03-15",
    budget: 40000,
    targetAudience: "all",
    stores: ["store-indore-1", "store-bhopal-1"],
    expectedReach: 28000,
    status: "completed",
    createdBy: "Amit Sharma",
    createdAt: "2026-03-05T16:25:00Z"
  },
  {
    _id: "camp-8",
    franchiseId: "fran-central-1",
    campaignName: "Veg Supreme Premium Loyalty Offer",
    campaignType: "combo_offer",
    description: "Exclusive combo discount for Gold Tier Loyalty members. Buy two large Veg Supreme pizzas, get free Choco Lava Cake.",
    startDate: "2026-06-10",
    endDate: "2026-07-15",
    budget: 65000,
    targetAudience: "loyalty",
    stores: ["store-indore-1", "store-indore-2", "store-bhopal-1", "store-bhopal-2"],
    expectedReach: 22000,
    status: "paused",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-06-08T13:10:00Z"
  }
];

export const mockCampaignPerformance = {
  "camp-1": {
    _id: "perf-1",
    campaignId: "camp-1",
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ordersGenerated: 0,
    revenueGenerated: 0,
    roi: 0,
    updatedAt: "2026-06-20T10:00:00Z",
    dailyBreakdown: []
  },
  "camp-2": {
    _id: "perf-2",
    campaignId: "camp-2",
    impressions: 38400,
    clicks: 4200,
    conversions: 1100,
    ordersGenerated: 950,
    revenueGenerated: 345000,
    roi: 305, // 305% ROI
    updatedAt: "2026-06-23T08:00:00Z",
    dailyBreakdown: [
      { date: "17 Jun", impressions: 5000, clicks: 550, orders: 120, revenue: 43000 },
      { date: "18 Jun", impressions: 6200, clicks: 680, orders: 150, revenue: 54000 },
      { date: "19 Jun", impressions: 4800, clicks: 510, orders: 110, revenue: 39000 },
      { date: "20 Jun", impressions: 7500, clicks: 820, orders: 190, revenue: 68000 },
      { date: "21 Jun", impressions: 8100, clicks: 900, orders: 210, revenue: 76000 },
      { date: "22 Jun", impressions: 6800, clicks: 740, orders: 170, revenue: 65000 }
    ]
  },
  "camp-3": {
    _id: "perf-3",
    campaignId: "camp-3",
    impressions: 19500,
    clicks: 1850,
    conversions: 450,
    ordersGenerated: 410,
    revenueGenerated: 128600,
    roi: 185,
    updatedAt: "2026-06-23T08:00:00Z",
    dailyBreakdown: [
      { date: "17 Jun", impressions: 2200, clicks: 210, orders: 45, revenue: 14000 },
      { date: "18 Jun", impressions: 2900, clicks: 270, orders: 60, revenue: 19000 },
      { date: "19 Jun", impressions: 2500, clicks: 240, orders: 55, revenue: 17000 },
      { date: "20 Jun", impressions: 3800, clicks: 360, orders: 85, revenue: 26000 },
      { date: "21 Jun", impressions: 4100, clicks: 390, orders: 90, revenue: 29000 },
      { date: "22 Jun", impressions: 4000, clicks: 380, orders: 75, revenue: 23600 }
    ]
  },
  "camp-4": {
    _id: "perf-4",
    campaignId: "camp-4",
    impressions: 54000,
    clicks: 6500,
    conversions: 1800,
    ordersGenerated: 1680,
    revenueGenerated: 420000,
    roi: 342,
    updatedAt: "2026-06-23T08:00:00Z",
    dailyBreakdown: [
      { date: "17 Jun", impressions: 8500, clicks: 1020, orders: 260, revenue: 65000 },
      { date: "18 Jun", impressions: 9200, clicks: 1100, orders: 280, revenue: 70000 },
      { date: "19 Jun", impressions: 8000, clicks: 960, orders: 250, revenue: 62005 },
      { date: "20 Jun", impressions: 9800, clicks: 1180, orders: 310, revenue: 78000 },
      { date: "21 Jun", impressions: 10500, clicks: 1260, orders: 320, revenue: 80000 },
      { date: "22 Jun", impressions: 8000, clicks: 980, orders: 260, revenue: 64995 }
    ]
  },
  "camp-5": {
    _id: "perf-5",
    campaignId: "camp-5",
    impressions: 89000,
    clicks: 12400,
    conversions: 3500,
    ordersGenerated: 3250,
    revenueGenerated: 980000,
    roi: 1860, // massive ROI
    updatedAt: "2026-05-26T00:00:00Z",
    dailyBreakdown: [
      { date: "24 Jun", impressions: 42000, clicks: 5800, orders: 1500, revenue: 450000 },
      { date: "25 Jun", impressions: 47000, clicks: 6600, orders: 1750, revenue: 530000 }
    ]
  },
  "camp-6": {
    _id: "perf-6",
    campaignId: "camp-6",
    impressions: 12500,
    clicks: 1100,
    conversions: 240,
    ordersGenerated: 220,
    revenueGenerated: 108000,
    roi: 208,
    updatedAt: "2026-06-20T23:59:59Z",
    dailyBreakdown: [
      { date: "15 Jun", impressions: 2100, clicks: 180, orders: 35, revenue: 17500 },
      { date: "16 Jun", impressions: 2300, clicks: 200, orders: 40, revenue: 19600 },
      { date: "17 Jun", impressions: 2200, clicks: 190, orders: 38, revenue: 18500 },
      { date: "18 Jun", impressions: 2800, clicks: 250, orders: 50, revenue: 24500 },
      { date: "19 Jun", impressions: 3100, clicks: 280, orders: 57, revenue: 27900 }
    ]
  },
  "camp-7": {
    _id: "perf-7",
    campaignId: "camp-7",
    impressions: 25000,
    clicks: 2200,
    conversions: 550,
    ordersGenerated: 520,
    revenueGenerated: 156000,
    roi: 290,
    updatedAt: "2026-03-15T23:59:59Z",
    dailyBreakdown: [
      { date: "10 Mar", impressions: 4000, clicks: 350, orders: 80, revenue: 24000 },
      { date: "11 Mar", impressions: 4500, clicks: 400, orders: 95, revenue: 28500 },
      { date: "12 Mar", impressions: 4200, clicks: 370, orders: 85, revenue: 25500 },
      { date: "13 Mar", impressions: 5800, clicks: 510, orders: 120, revenue: 36000 },
      { date: "14 Mar", impressions: 6500, clicks: 570, orders: 140, revenue: 42000 }
    ]
  },
  "camp-8": {
    _id: "perf-8",
    campaignId: "camp-8",
    impressions: 18500,
    clicks: 1400,
    conversions: 320,
    ordersGenerated: 290,
    revenueGenerated: 115000,
    roi: 76,
    updatedAt: "2026-06-23T08:00:00Z",
    dailyBreakdown: [
      { date: "17 Jun", impressions: 3000, clicks: 225, orders: 45, revenue: 18000 },
      { date: "18 Jun", impressions: 3200, clicks: 240, orders: 50, revenue: 20000 },
      { date: "19 Jun", impressions: 3100, clicks: 235, orders: 48, revenue: 19000 },
      { date: "20 Jun", impressions: 4500, clicks: 340, orders: 70, revenue: 28000 },
      { date: "21 Jun", impressions: 4700, clicks: 360, orders: 77, revenue: 30000 }
    ]
  }
};

export const mockCoupons = [
  { 
    _id: "coup-1", 
    couponCode: "PAPA50", 
    code: "PAPA50",
    title: "Flat 50% Off Special", 
    description: "Get flat 50% discount on Margherita pizzas. Maximum discount up to ₹150.", 
    discountType: "percentage", 
    discountValue: 50, 
    maximumDiscount: 150, 
    minimumOrderAmount: 299, 
    status: "active", 
    startDate: "2026-06-01", 
    endDate: "2026-07-31", 
    storeIds: ["store-indore-1"],
    createdBy: "Shubham Jamliya",
    createdAt: "2026-06-01T10:00:00Z"
  },
  { 
    _id: "coup-2", 
    couponCode: "FREEGB", 
    code: "FREEGB",
    title: "Free Garlic Breadsticks", 
    description: "Get a free Stuffed Garlic Bread on orders above ₹399.", 
    discountType: "fixed", 
    discountValue: 129, 
    maximumDiscount: 129, 
    minimumOrderAmount: 399, 
    status: "active", 
    startDate: "2026-06-05", 
    endDate: "2026-08-31", 
    storeIds: ["store-indore-1", "store-bhopal-1"],
    createdBy: "Rajesh Kumar",
    createdAt: "2026-06-05T12:00:00Z"
  },
  { 
    _id: "coup-3", 
    couponCode: "WELCOME100", 
    code: "WELCOME100",
    title: "Welcome Discount Offer", 
    description: "Flat ₹100 off on your first order. Minimum order value ₹199.", 
    discountType: "fixed", 
    discountValue: 100, 
    maximumDiscount: 100, 
    minimumOrderAmount: 199, 
    status: "active", 
    startDate: "2026-05-01", 
    endDate: "2026-12-31", 
    storeIds: [],
    createdBy: "Amit Sharma",
    createdAt: "2026-05-01T09:00:00Z"
  },
  { 
    _id: "coup-4", 
    couponCode: "DIWALI25", 
    code: "DIWALI25",
    title: "Diwali Fest Combo Discount", 
    description: "Celebrate Diwali with 25% off on all items. Minimum order value ₹499.", 
    discountType: "percentage", 
    discountValue: 25, 
    maximumDiscount: 300, 
    minimumOrderAmount: 499, 
    status: "active", 
    startDate: "2026-10-15", 
    endDate: "2026-11-05", 
    storeIds: [],
    createdBy: "Shubham Jamliya",
    createdAt: "2026-06-20T10:00:00Z"
  }
];

export const mockCouponUsage = [
  {
    _id: "usage-1",
    couponId: "coup-1",
    analytics: { totalUsage: 1450, totalDiscountGiven: 142000, ordersMatching: 1450 }
  },
  {
    _id: "usage-2",
    couponId: "coup-2",
    analytics: { totalUsage: 890, totalDiscountGiven: 114810, ordersMatching: 890 }
  }
];

export const mockProducts = [
  { _id: "prod-1", name: "Margherita Pizza", price: 249, category: "cat-1", image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=85" },
  { _id: "prod-2", name: "Veg Supreme Pizza", price: 399, category: "cat-1", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=85" },
  { _id: "prod-3", name: "Paneer Tikka Pizza", price: 349, category: "cat-1", image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=85" },
  { _id: "prod-4", name: "Double Cheese Burst Margherita", price: 299, category: "cat-1", image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=400&q=85" },
  { _id: "prod-5", name: "Garlic Breadsticks", price: 129, category: "cat-3", image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=400&q=85" }
];

export const mockCategories = [
  { _id: "cat-1", name: "Pizzas", status: "Active" },
  { _id: "cat-2", name: "Beverages", status: "Active" },
  { _id: "cat-3", name: "Sides", status: "Active" },
  { _id: "cat-4", name: "Desserts", status: "Active" }
];

export const mockBanners = [
  {
    _id: "banner-1",
    franchiseId: "fran-central-1",
    title: "Diwali Feast Pizza Combo",
    subtitle: "Get Flat 25% Off on all Family Pizza Combos. Celebrate Diwali with Papa Veg Pizza!",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    mobileImageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    redirectType: "coupon",
    redirectId: "coup-4",
    stores: ["store-indore-1", "store-bhopal-1"],
    startDate: "2026-10-15",
    endDate: "2026-11-05",
    priority: 2,
    status: "inactive",
    createdBy: "Shubham Jamliya",
    createdAt: "2026-06-20T10:00:00Z"
  },
  {
    _id: "banner-2",
    franchiseId: "fran-central-1",
    title: "Weekend Midnight Flash Sale",
    subtitle: "Buy 1 Get 1 Free on all Medium Pizzas. Every Saturday and Sunday from 10 PM to 1 AM.",
    imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1200&q=80",
    mobileImageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80",
    redirectType: "campaign",
    redirectId: "camp-2",
    stores: ["store-indore-1", "store-indore-2", "store-ujjain-1"],
    startDate: "2026-06-01",
    endDate: "2026-07-31",
    priority: 5,
    status: "active",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-05-25T11:30:00Z"
  },
  {
    _id: "banner-3",
    franchiseId: "fran-central-1",
    title: "Monsoon Paneer Tikka Blast",
    subtitle: "Savor the rain with our special Paneer Tikka pizza at flat ₹150 off.",
    imageUrl: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=1200&q=80",
    mobileImageUrl: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=600&q=80",
    redirectType: "product",
    redirectId: "prod-3",
    stores: [],
    startDate: "2026-06-15",
    endDate: "2026-06-30",
    priority: 8,
    status: "active",
    createdBy: "Amit Sharma",
    createdAt: "2026-06-14T09:15:00Z"
  },
  {
    _id: "banner-4",
    franchiseId: "fran-central-1",
    title: "IPL Cheese Burst Dhamaka",
    subtitle: "Cheer for your team with 40% Off on all Cheese Burst Pizzas during match hours.",
    imageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1200&q=80",
    mobileImageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80",
    redirectType: "campaign",
    redirectId: "camp-5",
    stores: ["store-jabalpur-1", "store-dewas-1"],
    startDate: "2026-05-20",
    endDate: "2026-05-25",
    priority: 1,
    status: "active",
    createdBy: "Shubham Jamliya",
    createdAt: "2026-05-18T12:00:00Z"
  }
];

export const mockNotifications = [
  {
    _id: "notif-1",
    franchiseId: "fran-central-1",
    title: "Paneer Tikka Midweek Madness",
    message: "Craving Paneer Tikka? Order now and get flat 30% off on all Medium Paneer Tikka pizzas! Valid only for today.",
    notificationType: ["push", "sms", "email"],
    targetAudience: "loyalty",
    stores: ["store-indore-1", "store-indore-2", "store-bhopal-1"],
    scheduleTime: "2026-06-17T11:00:00Z",
    status: "sent",
    createdBy: "Shubham Jamliya",
    createdAt: "2026-06-17T09:30:00Z"
  },
  {
    _id: "notif-2",
    franchiseId: "fran-central-1",
    title: "Rainy Day BOGO Special!",
    message: "Heavy rains outside? Stay dry & feast inside! Buy 1 Pizza, Get 1 Pizza absolutely FREE. Use coupon BOGORAIN.",
    notificationType: ["push"],
    targetAudience: "all",
    stores: [], // Global
    scheduleTime: "2026-06-22T12:30:00Z",
    status: "sent",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-06-22T12:00:00Z"
  },
  {
    _id: "notif-3",
    franchiseId: "fran-central-1",
    title: "Weekend Cheese Feast",
    message: "Get free Garlic Bread + Dip on your first order this Saturday & Sunday. T&C apply.",
    notificationType: ["push", "sms"],
    targetAudience: "new",
    stores: ["store-bhopal-1", "store-ujjain-1"],
    scheduleTime: "2026-06-27T10:00:00Z",
    status: "scheduled",
    createdBy: "Amit Sharma",
    createdAt: "2026-06-23T08:15:00Z"
  },
  {
    _id: "notif-4",
    franchiseId: "fran-central-1",
    title: "Diwali Early Bird Discount",
    message: "Pre-book your Diwali Pizza Platters today and save 20%. Tap to browse combos.",
    notificationType: ["push", "email"],
    targetAudience: "inactive",
    stores: [],
    scheduleTime: "2026-11-04T18:00:00Z",
    status: "draft",
    createdBy: "Shubham Jamliya",
    createdAt: "2026-06-23T10:30:00Z"
  },
  {
    _id: "notif-5",
    franchiseId: "fran-central-1",
    title: "Cancelled Monsoon Treats",
    message: "Special offers for Indore users. Cancelled due to logistics clash.",
    notificationType: ["sms"],
    targetAudience: "all",
    stores: ["store-indore-1"],
    scheduleTime: "2026-06-15T15:00:00Z",
    status: "cancelled",
    createdBy: "Rajesh Kumar",
    createdAt: "2026-06-14T16:00:00Z"
  }
];

export const mockNotificationLogs = [
  // Logs for notif-1 (Sent)
  { _id: "log-1-1", notificationId: "notif-1", customerId: "cust-1", customerName: "Rohan Malhotra", channel: "push", sentStatus: "delivered", opened: true, clicked: true, deliveredAt: "2026-06-17T11:02:00Z", storeId: "store-indore-1" },
  { _id: "log-1-2", notificationId: "notif-1", customerId: "cust-2", customerName: "Aarav Sharma", channel: "sms", sentStatus: "delivered", opened: true, clicked: false, deliveredAt: "2026-06-17T11:03:00Z", storeId: "store-indore-1" },
  { _id: "log-1-3", notificationId: "notif-1", customerId: "cust-3", customerName: "Pooja Patel", channel: "email", sentStatus: "delivered", opened: false, clicked: false, deliveredAt: "2026-06-17T11:05:00Z", storeId: "store-indore-2" },
  { _id: "log-1-4", notificationId: "notif-1", customerId: "cust-4", customerName: "Amit Verma", channel: "push", sentStatus: "delivered", opened: true, clicked: true, deliveredAt: "2026-06-17T11:01:00Z", storeId: "store-indore-2" },
  { _id: "log-1-5", notificationId: "notif-1", customerId: "cust-5", customerName: "Rashi Kumar", channel: "sms", sentStatus: "failed", opened: false, clicked: false, deliveredAt: null, storeId: "store-bhopal-1" },
  { _id: "log-1-6", notificationId: "notif-1", customerId: "cust-6", customerName: "Siddharth Jain", channel: "push", sentStatus: "delivered", opened: true, clicked: false, deliveredAt: "2026-06-17T11:01:30Z", storeId: "store-bhopal-1" },
  { _id: "log-1-7", notificationId: "notif-1", customerId: "cust-7", customerName: "Neha Gupta", channel: "email", sentStatus: "delivered", opened: true, clicked: true, deliveredAt: "2026-06-17T11:04:00Z", storeId: "store-indore-1" },
  { _id: "log-1-8", notificationId: "notif-1", customerId: "cust-8", customerName: "Vikram Singh", channel: "sms", sentStatus: "delivered", opened: false, clicked: false, deliveredAt: "2026-06-17T11:02:15Z", storeId: "store-indore-2" },
  { _id: "log-1-9", notificationId: "notif-1", customerId: "cust-9", customerName: "Preeti Mishra", channel: "push", sentStatus: "delivered", opened: true, clicked: true, deliveredAt: "2026-06-17T11:02:30Z", storeId: "store-bhopal-1" },
  { _id: "log-1-10", notificationId: "notif-1", customerId: "cust-10", customerName: "Deepak Rawat", channel: "email", sentStatus: "failed", opened: false, clicked: false, deliveredAt: null, storeId: "store-indore-1" },

  // Logs for notif-2 (Sent)
  { _id: "log-2-1", notificationId: "notif-2", customerId: "cust-1", customerName: "Rohan Malhotra", channel: "push", sentStatus: "delivered", opened: true, clicked: true, deliveredAt: "2026-06-22T12:31:00Z", storeId: "store-indore-1" },
  { _id: "log-2-2", notificationId: "notif-2", customerId: "cust-3", customerName: "Pooja Patel", channel: "push", sentStatus: "delivered", opened: true, clicked: false, deliveredAt: "2026-06-22T12:32:00Z", storeId: "store-indore-2" },
  { _id: "log-2-3", notificationId: "notif-2", customerId: "cust-4", customerName: "Amit Verma", channel: "push", sentStatus: "delivered", opened: false, clicked: false, deliveredAt: "2026-06-22T12:30:30Z", storeId: "store-bhopal-1" },
  { _id: "log-2-4", notificationId: "notif-2", customerId: "cust-5", customerName: "Rashi Kumar", channel: "push", sentStatus: "delivered", opened: true, clicked: true, deliveredAt: "2026-06-22T12:33:00Z", storeId: "store-bhopal-2" },
  { _id: "log-2-5", notificationId: "notif-2", customerId: "cust-7", customerName: "Neha Gupta", channel: "push", sentStatus: "failed", opened: false, clicked: false, deliveredAt: null, storeId: "store-ujjain-1" },
  { _id: "log-2-6", notificationId: "notif-2", customerId: "cust-9", customerName: "Preeti Mishra", channel: "push", sentStatus: "delivered", opened: true, clicked: true, deliveredAt: "2026-06-22T12:31:15Z", storeId: "store-dewas-1" },
  { _id: "log-2-7", notificationId: "notif-2", customerId: "cust-11", customerName: "Rajesh Sharma", channel: "push", sentStatus: "delivered", opened: true, clicked: false, deliveredAt: "2026-06-22T12:34:00Z", storeId: "store-jabalpur-1" },
  { _id: "log-2-8", notificationId: "notif-2", customerId: "cust-12", customerName: "Sanjay Joshi", channel: "push", sentStatus: "delivered", opened: false, clicked: false, deliveredAt: "2026-06-22T12:32:45Z", storeId: "store-indore-1" }
];

