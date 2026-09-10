// Mock API and Collection Data for Loyalty Program (Papa Veg Pizza)
import { toast } from 'sonner';

// 1. Initial loyalty_settings collection
let loyaltySettings = {
  _id: "set_001",
  pointPerRupee: 1, // ₹1 = 1 Point
  pointValue: 0.25, // 1 point = ₹0.25
  minimumRedeemPoints: 100,
  maximumRedeemPercent: 50, // Max 50% of bill amount can be paid via points
  expiryDays: 365
};

// 2. Initial tiers collection
let loyaltyTiers = [
  {
    _id: "tier_silver",
    name: "Silver",
    minSpent: 0,
    multiplier: 1.0,
    benefits: ["Earn 1x Points", "Birthday Coupon (10% Off)", "Early Access to New Menu"],
    isActive: true
  },
  {
    _id: "tier_gold",
    name: "Gold",
    minSpent: 10000,
    multiplier: 1.2,
    benefits: ["Earn 1.2x Points", "Free Delivery on Orders above ₹299", "Priority Customer Support", "Birthday Double Points"],
    isActive: true
  },
  {
    _id: "tier_platinum",
    name: "Platinum",
    minSpent: 25000,
    multiplier: 1.5,
    benefits: ["Earn 1.5x Points", "Free Delivery on All Orders", "Exclusive Chef's Tasting Invite", "Zero Packing Charges", "Dedicated Support Manager"],
    isActive: true
  }
];

// 3. Initial customer_loyalty collection seed (Indian Names, Numbers, Emails)
let customerLoyalty = [
  { _id: "cust_101", customerId: "PV-CUST-101", name: "Rajesh Sharma", phone: "+91 98120 45210", email: "rajesh.sharma@gmail.com", tier: "Platinum", availablePoints: 1250, redeemedPoints: 3400, totalPoints: 4650, lifetimeSpent: 32000, updatedAt: "2026-06-18T18:24:00Z" },
  { _id: "cust_102", customerId: "PV-CUST-102", name: "Priya Patel", phone: "+91 88402 12903", email: "priya.patel@yahoo.com", tier: "Gold", availablePoints: 850, redeemedPoints: 1200, totalPoints: 2050, lifetimeSpent: 15400, updatedAt: "2026-06-17T11:15:00Z" },
  { _id: "cust_103", customerId: "PV-CUST-103", name: "Amit Verma", phone: "+91 74029 88390", email: "amit.verma@outlook.com", tier: "Gold", availablePoints: 620, redeemedPoints: 800, totalPoints: 1420, lifetimeSpent: 11800, updatedAt: "2026-06-19T09:40:00Z" },
  { _id: "cust_104", customerId: "PV-CUST-104", name: "Sunita Deshmukh", phone: "+91 91234 56789", email: "sunita.d@gmail.com", tier: "Silver", availablePoints: 240, redeemedPoints: 0, totalPoints: 240, lifetimeSpent: 2400, updatedAt: "2026-06-15T14:32:00Z" },
  { _id: "cust_105", customerId: "PV-CUST-105", name: "Vikram Malhotra", phone: "+91 98450 12345", email: "vikram.m@rediffmail.com", tier: "Platinum", availablePoints: 1850, redeemedPoints: 5000, totalPoints: 6850, lifetimeSpent: 48000, updatedAt: "2026-06-19T08:12:00Z" },
  { _id: "cust_106", customerId: "PV-CUST-106", name: "Deepika Padukone", phone: "+91 87654 32109", email: "deepika.p@gmail.com", tier: "Silver", availablePoints: 450, redeemedPoints: 300, totalPoints: 750, lifetimeSpent: 7500, updatedAt: "2026-06-10T16:45:00Z" },
  { _id: "cust_107", customerId: "PV-CUST-107", name: "Rohan Khanna", phone: "+91 99887 76655", email: "rohan.khanna@gmail.com", tier: "Silver", availablePoints: 90, redeemedPoints: 0, totalPoints: 90, lifetimeSpent: 900, updatedAt: "2026-06-05T10:11:00Z" },
  { _id: "cust_108", customerId: "PV-CUST-108", name: "Isha Kapoor", phone: "+91 77665 54433", email: "isha.k@gmail.com", tier: "Gold", availablePoints: 780, redeemedPoints: 900, totalPoints: 1680, lifetimeSpent: 14200, updatedAt: "2026-06-19T04:22:00Z" },
  { _id: "cust_109", customerId: "PV-CUST-109", name: "Suresh Iyer", phone: "+91 94440 12345", email: "suresh.iyer@gmail.com", tier: "Platinum", availablePoints: 2100, redeemedPoints: 6000, totalPoints: 8100, lifetimeSpent: 56000, updatedAt: "2026-06-18T20:15:00Z" },
  { _id: "cust_110", customerId: "PV-CUST-110", name: "Neha Joshi", phone: "+91 98888 77777", email: "neha.joshi@gmail.com", tier: "Silver", availablePoints: 320, redeemedPoints: 100, totalPoints: 420, lifetimeSpent: 4200, updatedAt: "2026-06-12T13:04:00Z" }
];

// 4. Initial loyalty_transactions collection (Denormalized)
let loyaltyTransactions = [
  { _id: "txn_001", customerId: "PV-CUST-101", customerName: "Rajesh Sharma", orderId: "PV-ORD-9901", type: "earn", points: 450, amount: 450, createdAt: "2026-06-18T18:24:00Z" },
  { _id: "txn_002", customerId: "PV-CUST-101", customerName: "Rajesh Sharma", orderId: "PV-ORD-9801", type: "redeem", points: 200, amount: 50, createdAt: "2026-06-17T20:10:00Z" },
  { _id: "txn_003", customerId: "PV-CUST-102", customerName: "Priya Patel", orderId: "PV-ORD-9902", type: "earn", points: 150, amount: 150, createdAt: "2026-06-17T11:15:00Z" },
  { _id: "txn_004", customerId: "PV-CUST-103", customerName: "Amit Verma", orderId: "PV-ORD-9903", type: "earn", points: 220, amount: 220, createdAt: "2026-06-19T09:40:00Z" },
  { _id: "txn_005", customerId: "PV-CUST-103", customerName: "Amit Verma", orderId: "PV-ORD-9750", type: "redeem", points: 400, amount: 100, createdAt: "2026-06-12T19:30:00Z" },
  { _id: "txn_006", customerId: "PV-CUST-105", customerName: "Vikram Malhotra", orderId: "PV-ORD-9905", type: "earn", points: 680, amount: 680, createdAt: "2026-06-19T08:12:00Z" },
  { _id: "txn_007", customerId: "PV-CUST-105", customerName: "Vikram Malhotra", orderId: "PV-ORD-9812", type: "redeem", points: 1000, amount: 250, createdAt: "2026-06-14T21:40:00Z" },
  { _id: "txn_008", customerId: "PV-CUST-108", customerName: "Isha Kapoor", orderId: "PV-ORD-9908", type: "earn", points: 180, amount: 180, createdAt: "2026-06-19T04:22:00Z" },
  { _id: "txn_009", customerId: "PV-CUST-109", customerName: "Suresh Iyer", orderId: "PV-ORD-9909", type: "earn", points: 560, amount: 560, createdAt: "2026-06-18T20:15:00Z" },
  { _id: "txn_010", customerId: "PV-CUST-109", customerName: "Suresh Iyer", orderId: "PV-ORD-9502", type: "redeem", points: 2000, amount: 500, createdAt: "2026-06-02T13:20:00Z" },
  { _id: "txn_011", customerId: "PV-CUST-101", customerName: "Rajesh Sharma", orderId: "PV-ORD-9510", type: "earn", points: 420, amount: 420, createdAt: "2026-06-04T12:30:00Z" },
  { _id: "txn_012", customerId: "PV-CUST-102", customerName: "Priya Patel", orderId: "PV-ORD-9520", type: "earn", points: 350, amount: 350, createdAt: "2026-06-05T19:00:00Z" },
  { _id: "txn_013", customerId: "PV-CUST-105", customerName: "Vikram Malhotra", orderId: "PV-ORD-9610", type: "earn", points: 1200, amount: 1200, createdAt: "2026-05-18T19:45:00Z" },
  { _id: "txn_014", customerId: "PV-CUST-109", customerName: "Suresh Iyer", orderId: "PV-ORD-9620", type: "earn", points: 1500, amount: 1500, createdAt: "2026-05-20T20:10:00Z" },
  { _id: "txn_015", customerId: "PV-CUST-106", customerName: "Deepika Padukone", orderId: "PV-ORD-9701", type: "earn", points: 300, amount: 300, createdAt: "2026-06-10T16:45:00Z" },
  { _id: "txn_016", customerId: "PV-CUST-106", customerName: "Deepika Padukone", orderId: "PV-ORD-9650", type: "redeem", points: 300, amount: 75, createdAt: "2026-05-25T14:10:00Z" },
  { _id: "txn_017", customerId: "PV-CUST-110", customerName: "Neha Joshi", orderId: "PV-ORD-9710", type: "earn", points: 200, amount: 200, createdAt: "2026-06-12T13:04:00Z" },
  { _id: "txn_018", customerId: "PV-CUST-110", customerName: "Neha Joshi", orderId: "PV-ORD-9660", type: "redeem", points: 100, amount: 25, createdAt: "2026-05-28T21:00:00Z" }
];

// Helper to delay executions (simulate REST API latencies)
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Settings endpoints
  getSettings: async () => {
    await delay(300);
    return { ...loyaltySettings };
  },

  updateSettings: async (newSettings) => {
    await delay(500);
    loyaltySettings = { ...loyaltySettings, ...newSettings };
    return { success: true, data: loyaltySettings };
  },

  // Tiers endpoints
  getTiers: async () => {
    await delay(300);
    return [...loyaltyTiers];
  },

  updateTier: async (id, updatedTier) => {
    await delay(400);
    loyaltyTiers = loyaltyTiers.map(t => t._id === id ? { ...t, ...updatedTier } : t);
    return { success: true, data: loyaltyTiers.find(t => t._id === id) };
  },

  // Customer Loyalty accounts
  getCustomers: async (filters = {}, sorting = {}, pagination = {}) => {
    await delay(450);

    let filtered = [...customerLoyalty];

    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.phone.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.customerId.toLowerCase().includes(searchLower)
      );
    }

    // Tier Filter
    if (filters.tier && filters.tier !== 'All') {
      filtered = filtered.filter(c => c.tier === filters.tier);
    }

    // Available Points Range Filter
    if (filters.minPoints !== undefined && filters.minPoints !== '') {
      filtered = filtered.filter(c => c.availablePoints >= Number(filters.minPoints));
    }
    if (filters.maxPoints !== undefined && filters.maxPoints !== '') {
      filtered = filtered.filter(c => c.availablePoints <= Number(filters.maxPoints));
    }

    // Lifetime Spent Range Filter
    if (filters.minSpend !== undefined && filters.minSpend !== '') {
      filtered = filtered.filter(c => c.lifetimeSpent >= Number(filters.minSpend));
    }
    if (filters.maxSpend !== undefined && filters.maxSpend !== '') {
      filtered = filtered.filter(c => c.lifetimeSpent <= Number(filters.maxSpend));
    }

    // Date Range (based on updatedAt)
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      filtered = filtered.filter(c => new Date(c.updatedAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      filtered = filtered.filter(c => new Date(c.updatedAt).getTime() <= end);
    }

    // Sorting
    if (sorting.field) {
      const field = sorting.field;
      const isAsc = sorting.direction === 'asc';
      filtered.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (typeof valA === 'string') {
          return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return isAsc ? valA - valB : valB - valA;
        }
      });
    }

    // Pagination
    const totalCount = filtered.length;
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 5;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      data: paginated,
      totalCount,
      totalPages,
      page,
      limit
    };
  },

  getCustomerById: async (id) => {
    await delay(300);
    const customer = customerLoyalty.find(c => c._id === id || c.customerId === id);
    if (!customer) throw new Error("Customer loyalty record not found");
    return { ...customer };
  },

  // Manual Adjust Points
  adjustPoints: async (customerId, adjustType, pointsInput, reason, adminNotes) => {
    await delay(600);
    const points = Number(pointsInput);
    if (isNaN(points) || points <= 0) {
      throw new Error("Invalid point value");
    }

    const customerIndex = customerLoyalty.findIndex(c => c._id === customerId || c.customerId === customerId);
    if (customerIndex === -1) {
      throw new Error("Customer loyalty record not found");
    }

    const customer = customerLoyalty[customerIndex];
    let newAvailablePoints = customer.availablePoints;
    let newTotalPoints = customer.totalPoints;
    let newRedeemedPoints = customer.redeemedPoints;

    if (adjustType === 'add') {
      newAvailablePoints += points;
      newTotalPoints += points;
    } else if (adjustType === 'deduct') {
      if (customer.availablePoints < points) {
        throw new Error("Deduction points exceed current available balance.");
      }
      newAvailablePoints -= points;
      // When deducting manually, we decrease available. Total points is total ever earned, 
      // but let's deduct from total points too if needed. Let's just adjust availablePoints.
    } else {
      throw new Error("Invalid adjustment type");
    }

    // Update Customer
    const updatedCustomer = {
      ...customer,
      availablePoints: newAvailablePoints,
      totalPoints: newTotalPoints,
      updatedAt: new Date().toISOString()
    };
    customerLoyalty[customerIndex] = updatedCustomer;

    // Create a transaction record
    const newTxn = {
      _id: `txn_${Date.now()}`,
      customerId: customer.customerId,
      customerName: customer.name,
      orderId: "MANUAL-ADJUST",
      type: adjustType === 'add' ? 'earn' : 'redeem',
      points: points,
      amount: 0, // Manual adjustments have no order currency transaction value
      createdAt: new Date().toISOString(),
      reason: reason || "Manual Admin Adjustment",
      adminNotes: adminNotes || ""
    };
    loyaltyTransactions.unshift(newTxn);

    return { success: true, customer: updatedCustomer, transaction: newTxn };
  },

  // Upgrade Tier Manually
  upgradeTier: async (customerId, newTier, reason) => {
    await delay(500);
    const customerIndex = customerLoyalty.findIndex(c => c._id === customerId || c.customerId === customerId);
    if (customerIndex === -1) {
      throw new Error("Customer loyalty record not found");
    }

    const customer = customerLoyalty[customerIndex];
    const tierConfig = loyaltyTiers.find(t => t.name.toLowerCase() === newTier.toLowerCase());
    if (!tierConfig) {
      throw new Error("Specified tier does not exist.");
    }

    const updatedCustomer = {
      ...customer,
      tier: tierConfig.name,
      updatedAt: new Date().toISOString(),
      upgradeReason: reason || "Manual Promotion"
    };
    customerLoyalty[customerIndex] = updatedCustomer;

    // Log adjustment in transaction history as a free adjustment note
    const newTxn = {
      _id: `txn_${Date.now()}`,
      customerId: customer.customerId,
      customerName: customer.name,
      orderId: "TIER-UPGRADE",
      type: "earn", // count as earn adjustment
      points: 0,
      amount: 0,
      createdAt: new Date().toISOString(),
      reason: `Tier Promoted to ${tierConfig.name}. Reason: ${reason}`
    };
    loyaltyTransactions.unshift(newTxn);

    return { success: true, customer: updatedCustomer };
  },

  // Transactions ledger history
  getHistory: async (filters = {}, pagination = {}) => {
    await delay(500);

    let filtered = [...loyaltyTransactions];

    // Customer name/id search
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.customerName.toLowerCase().includes(searchLower) ||
        t.customerId.toLowerCase().includes(searchLower) ||
        t.orderId.toLowerCase().includes(searchLower) ||
        t._id.toLowerCase().includes(searchLower)
      );
    }

    // Specific Customer ID filter
    if (filters.customerId) {
      filtered = filtered.filter(t => t.customerId === filters.customerId);
    }

    // Type filter
    if (filters.type && filters.type !== 'All') {
      filtered = filtered.filter(t => t.type === filters.type.toLowerCase());
    }

    // Date range
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() <= end);
    }

    // Sort by date desc always for transactions
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const totalCount = filtered.length;
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      data: paginated,
      totalCount,
      totalPages,
      page,
      limit
    };
  }
};

// Derived stats helper for overall loyalty programs
export const getLoyaltyDashboardStats = () => {
  // Members: count from customerLoyalty
  const members = customerLoyalty.length;

  // Points Issued: Earn transactions sum
  const totalPointsIssued = loyaltyTransactions
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.points, 0);

  // Points Redeemed: Redeem transactions sum
  const pointsRedeemed = loyaltyTransactions
    .filter(t => t.type === 'redeem')
    .reduce((sum, t) => sum + t.points, 0);

  // Expiring points: static calculation or 10% of total available points
  const totalAvailable = customerLoyalty.reduce((sum, c) => sum + c.availablePoints, 0);
  const expiringPoints = Math.round(totalAvailable * 0.12);

  // Active members: customers who had a transaction in the last 15 days
  const activeMembers = customerLoyalty.filter(c => {
    const lastUpdate = new Date(c.updatedAt).getTime();
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    return lastUpdate >= fifteenDaysAgo;
  }).length;

  // Loyalty Revenue: lifetime spent of loyalty customers
  const loyaltyRevenue = customerLoyalty.reduce((sum, c) => sum + c.lifetimeSpent, 0);

  return {
    members,
    totalPointsIssued,
    pointsRedeemed,
    expiringPoints,
    activeMembers,
    loyaltyRevenue
  };
};

// Derived stats helper for the analytics sub-tab
export const getAnalyticsStats = () => {
  const members = customerLoyalty.length;
  if (members === 0) return { avgPoints: 0, avgLifetimeSpend: 0, avgRedemptionValue: 0, retentionRate: 0 };

  const totalPoints = customerLoyalty.reduce((sum, c) => sum + c.availablePoints, 0);
  const avgPoints = Math.round(totalPoints / members);

  const totalSpend = customerLoyalty.reduce((sum, c) => sum + c.lifetimeSpent, 0);
  const avgLifetimeSpend = Math.round(totalSpend / members);

  // Average redemption value in INR
  const totalRedeemedTxns = loyaltyTransactions.filter(t => t.type === 'redeem');
  const totalRedemptionRupees = totalRedeemedTxns.reduce((sum, t) => sum + (t.points * loyaltySettings.pointValue), 0);
  const avgRedemptionValue = totalRedeemedTxns.length ? Math.round(totalRedemptionRupees / totalRedeemedTxns.length) : 0;

  // Retention rate helper
  const retentionRate = 78; // static realistic KPI index percentage

  return {
    avgPoints,
    avgLifetimeSpend,
    avgRedemptionValue,
    retentionRate
  };
};

// Format Currency Utility helper
export const formatINR = (val) => {
  return `₹${Number(val).toLocaleString('en-IN')}`;
};
