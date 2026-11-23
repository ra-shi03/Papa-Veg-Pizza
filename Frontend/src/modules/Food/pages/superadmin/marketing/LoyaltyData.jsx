// API and Collection Data for Loyalty Program (Papa Veg Pizza)
import { toast } from 'sonner';

// 1. Initial loyalty_settings collection
let loyaltySettings = {
  _id: "",
  pointPerRupee: 0,
  // ₹1 = 1 Point
  pointValue: 0,
  // 1 point = ₹0.25
  minimumRedeemPoints: 0,
  maximumRedeemPercent: 0,
  // Max 50% of bill amount can be paid via points
  expiryDays: 0
};

// 2. Initial tiers collection
let loyaltyTiers = [];

// 3. Initial customer_loyalty collection seed (Indian Names, Numbers, Emails)
let customerLoyalty = [];

// 4. Initial loyalty_transactions collection (Denormalized)
let loyaltyTransactions = [];

// Helper to delay executions (simulate REST API latencies)
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));
export const api = {
  // Settings endpoints
  getSettings: async () => {
    await delay(300);
    return {
      ...loyaltySettings
    };
  },
  updateSettings: async newSettings => {
    await delay(500);
    loyaltySettings = {
      ...loyaltySettings,
      ...newSettings
    };
    return {
      success: true,
      data: loyaltySettings
    };
  },
  // Tiers endpoints
  getTiers: async () => {
    await delay(300);
    return [];
  },
  updateTier: async (id, updatedTier) => {
    await delay(400);
    loyaltyTiers = loyaltyTiers.map(t => t._id === id ? {
      ...t,
      ...updatedTier
    } : t);
    return {
      success: true,
      data: loyaltyTiers.find(t => t._id === id)
    };
  },
  // Customer Loyalty accounts
  getCustomers: async (filters = {}, sorting = {}, pagination = {}) => {
    await delay(450);
    let filtered = [];

    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchLower) || c.phone.toLowerCase().includes(searchLower) || c.email.toLowerCase().includes(searchLower) || c.customerId.toLowerCase().includes(searchLower));
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
  getCustomerById: async id => {
    await delay(300);
    const customer = customerLoyalty.find(c => c._id === id || c.customerId === id);
    if (!customer) throw new Error("Customer loyalty record not found");
    return {
      ...customer
    };
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
      _id: "",
      customerId: customer.customerId,
      customerName: customer.name,
      orderId: "",
      type: adjustType === 'add' ? 'earn' : 'redeem',
      points: points,
      amount: 0,
      // Manual adjustments have no order currency transaction value
      createdAt: new Date().toISOString(),
      reason: reason || "Manual Admin Adjustment",
      adminNotes: adminNotes || ""
    };
    loyaltyTransactions.unshift(newTxn);
    return {
      success: true,
      customer: updatedCustomer,
      transaction: newTxn
    };
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
      _id: "",
      customerId: customer.customerId,
      customerName: customer.name,
      orderId: "",
      type: "",
      // count as earn adjustment
      points: 0,
      amount: 0,
      createdAt: new Date().toISOString(),
      reason: ""
    };
    loyaltyTransactions.unshift(newTxn);
    return {
      success: true,
      customer: updatedCustomer
    };
  },
  // Transactions ledger history
  getHistory: async (filters = {}, pagination = {}) => {
    await delay(500);
    let filtered = [];

    // Customer name/id search
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => t.customerName.toLowerCase().includes(searchLower) || t.customerId.toLowerCase().includes(searchLower) || t.orderId.toLowerCase().includes(searchLower) || t._id.toLowerCase().includes(searchLower));
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
  const totalPointsIssued = loyaltyTransactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.points, 0);

  // Points Redeemed: Redeem transactions sum
  const pointsRedeemed = loyaltyTransactions.filter(t => t.type === 'redeem').reduce((sum, t) => sum + t.points, 0);

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
  if (members === 0) return {
    avgPoints: 0,
    avgLifetimeSpend: 0,
    avgRedemptionValue: 0,
    retentionRate: 0
  };
  const totalPoints = customerLoyalty.reduce((sum, c) => sum + c.availablePoints, 0);
  const avgPoints = Math.round(totalPoints / members);
  const totalSpend = customerLoyalty.reduce((sum, c) => sum + c.lifetimeSpent, 0);
  const avgLifetimeSpend = Math.round(totalSpend / members);

  // Average redemption value in INR
  const totalRedeemedTxns = loyaltyTransactions.filter(t => t.type === 'redeem');
  const totalRedemptionRupees = totalRedeemedTxns.reduce((sum, t) => sum + t.points * loyaltySettings.pointValue, 0);
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
export const formatINR = val => {
  return `₹${Number(val).toLocaleString('en-IN')}`;
};
