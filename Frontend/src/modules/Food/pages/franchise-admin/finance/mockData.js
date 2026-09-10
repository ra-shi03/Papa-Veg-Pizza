export const mockStores = [
  { id: "store-1", name: "Papa Veg Pizza - Indore Central", city: "Indore", rating: 4.8 },
  { id: "store-2", name: "Papa Veg Pizza - Bhopal Zone", city: "Bhopal", rating: 4.6 },
  { id: "store-3", name: "Papa Veg Pizza - Ujjain Branch", city: "Ujjain", rating: 4.4 },
  { id: "store-4", name: "Papa Veg Pizza - Gwalior Hub", city: "Gwalior", rating: 4.5 },
  { id: "store-5", name: "Papa Veg Pizza - Jabalpur Outlet", city: "Jabalpur", rating: 4.2 }
];

export const mockCustomers = [
  { id: "cust-1", name: "Amit Sharma", phone: "+91 98260 12345", email: "amit.sharma@gmail.com" },
  { id: "cust-2", name: "Priya Patel", phone: "+91 99770 55443", email: "priya.patel@yahoo.com" },
  { id: "cust-3", name: "Rohan Malhotra", phone: "+91 98930 54321", email: "rohan.malhotra@outlook.com" },
  { id: "cust-4", name: "Rashi Kumar", phone: "+91 99887 76655", email: "rashi.kumar@gmail.com" },
  { id: "cust-5", name: "Vikram Rathore", phone: "+91 88401 22894", email: "vikram.rathore@gmail.com" },
  { id: "cust-6", name: "Sneha Reddy", phone: "+91 74029 88390", email: "sneha.reddy@gmail.com" },
  { id: "cust-7", name: "Karan Johar", phone: "+91 97520 98765", email: "karan.johar@gmail.com" },
  { id: "cust-8", name: "Shweta Tiwari", phone: "+91 98260 99887", email: "shweta.tiwari@gmail.com" }
];

// Helper to generate revenue records for the past 30 days
const generateRevenueRecords = () => {
  const records = [];
  const now = new Date();
  
  // Base daily values per store
  const storeBases = {
    "store-1": { baseRev: 45000, baseOrders: 90, expPct: 0.65 },
    "store-2": { baseRev: 35000, baseOrders: 70, expPct: 0.68 },
    "store-3": { baseRev: 22000, baseOrders: 45, expPct: 0.70 },
    "store-4": { baseRev: 18000, baseOrders: 38, expPct: 0.72 },
    "store-5": { baseRev: 14000, baseOrders: 30, expPct: 0.75 }
  };

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateString = date.toISOString().split("T")[0];

    // Weekend multiplier
    const dayOfWeek = date.getDay();
    const multiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.45 : 1.0; // Sunday & Saturday peak

    mockStores.forEach(store => {
      const base = storeBases[store.id];
      // Random fluctuations (+/- 15%)
      const rand = 0.85 + Math.random() * 0.3;
      
      const totalOrders = Math.round(base.baseOrders * multiplier * rand);
      const grossRevenue = Math.round(base.baseRev * multiplier * rand);
      
      const discountAmount = Math.round(grossRevenue * (0.06 + Math.random() * 0.04)); // 6-10% discount
      const refundAmount = Math.random() < 0.15 ? Math.round(grossRevenue * 0.02) : 0; // 15% chance of small refund
      
      const deliveryCharges = totalOrders * 30; // ₹30 delivery charge average
      const taxCollected = Math.round((grossRevenue - discountAmount) * 0.05); // 5% GST
      
      const netRevenue = grossRevenue - discountAmount - refundAmount + deliveryCharges + taxCollected;
      const totalExpenses = Math.round(netRevenue * base.expPct); // 65-75% expenses
      const totalProfit = netRevenue - totalExpenses;

      records.push({
        _id: `rev-${store.id}-${dateString}`,
        franchiseId: store.id,
        date: dateString,
        totalOrders,
        grossRevenue,
        discountAmount,
        refundAmount,
        deliveryCharges,
        taxCollected,
        netRevenue,
        totalExpenses,
        totalProfit
      });
    });
  }
  return records;
};

export const mockFranchiseRevenue = generateRevenueRecords();

// Top products mock data
export const mockTopProducts = [
  { name: "Paneer Tikka Pizza", quantity: 1420, revenue: 566580, contribution: 32 },
  { name: "Veg Supreme Pizza", quantity: 980, revenue: 391020, contribution: 22 },
  { name: "Margherita Pizza", quantity: 840, revenue: 209160, contribution: 12 },
  { name: "Farmhouse Delight Pizza", quantity: 720, revenue: 230400, contribution: 13 },
  { name: "Garlic Breadsticks", quantity: 950, revenue: 122550, contribution: 7 },
  { name: "Chocolate Lava Cake", quantity: 810, revenue: 80190, contribution: 5 },
  { name: "Pepsi Cold Drink", quantity: 1200, revenue: 60000, contribution: 3 },
  { name: "Capsicum Onion Pizza", quantity: 310, revenue: 58900, contribution: 3 },
  { name: "Spicy Paneer Pocket", quantity: 240, revenue: 28800, contribution: 2 },
  { name: "Tomato Basil Soup", quantity: 120, revenue: 10800, contribution: 1 }
];

// Refund summary list
export const mockRefundRequests = [
  { id: "REF-90410", orderId: "PVP-1092", reason: "Cold pizza delivered after 75 mins delay", amount: 439, status: "Completed", processedBy: "Admin Shubham", date: "2026-06-22" },
  { id: "REF-90398", orderId: "PVP-1088", reason: "Wrong toppings - Paneer Tikka instead of Veg Supreme", amount: 399, status: "Completed", processedBy: "System Auto", date: "2026-06-21" },
  { id: "REF-90352", orderId: "PVP-1075", reason: "Order cancelled by store due to out of stock cheese", amount: 320, status: "Completed", processedBy: "Admin Shubham", date: "2026-06-20" },
  { id: "REF-90341", orderId: "PVP-1064", reason: "Burnt crust and missing garlic dip add-on", amount: 150, status: "Refunded", processedBy: "System Auto", date: "2026-06-19" },
  { id: "REF-90320", orderId: "PVP-1051", reason: "Payment deducted twice, order rejected by gateway", amount: 590, status: "Completed", processedBy: "Admin Shubham", date: "2026-06-18" },
  { id: "REF-90299", orderId: "PVP-1040", reason: "Rider spill/damaged pizza during transport", amount: 499, status: "Cancelled", processedBy: "System Auto", date: "2026-06-17" }
];

// Expenses Mock Data
export const mockExpenses = [
  {
    _id: "exp-1",
    franchiseId: "store-1",
    storeId: "store-1",
    expenseNumber: "EXP-2026-0001",
    category: "Inventory",
    amount: 24500,
    description: "Bulk purchase of Amul cheese blocks and flour from local vendor",
    paymentMethod: "UPI",
    attachment: "https://pdfobject.com/pdf/sample.pdf",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-22",
    status: "Approved",
    createdBy: "Amit Sharma"
  },
  {
    _id: "exp-2",
    franchiseId: "store-1",
    storeId: "store-1",
    expenseNumber: "EXP-2026-0002",
    category: "Salary",
    amount: 18000,
    description: "Monthly salary payment for junior kitchen staff - Karan Singh",
    paymentMethod: "Bank Transfer",
    attachment: "",
    approvedBy: "",
    expenseDate: "2026-06-21",
    status: "Pending",
    createdBy: "Amit Sharma"
  },
  {
    _id: "exp-3",
    franchiseId: "store-2",
    storeId: "store-2",
    expenseNumber: "EXP-2026-0003",
    category: "Maintenance",
    amount: 4500,
    description: "Deep cleaning and repair of pizza conveyor oven burners",
    paymentMethod: "Cash",
    attachment: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=600",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-20",
    status: "Approved",
    createdBy: "Priya Patel"
  },
  {
    _id: "exp-4",
    franchiseId: "store-3",
    storeId: "store-3",
    expenseNumber: "EXP-2026-0004",
    category: "Electricity",
    amount: 12400,
    description: "Electricity bill payment for Ujjain branch (MPWZ)",
    paymentMethod: "UPI",
    attachment: "https://pdfobject.com/pdf/sample.pdf",
    approvedBy: "",
    expenseDate: "2026-06-19",
    status: "Pending",
    createdBy: "Rohan Malhotra"
  },
  {
    _id: "exp-5",
    franchiseId: "store-4",
    storeId: "store-4",
    expenseNumber: "EXP-2026-0005",
    category: "Gas",
    amount: 6800,
    description: "Refilling of 4 commercial LPG cylinders from Indane Gas",
    paymentMethod: "Card",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-18",
    status: "Approved",
    createdBy: "Rashi Kumar"
  },
  {
    _id: "exp-6",
    franchiseId: "store-5",
    storeId: "store-5",
    expenseNumber: "EXP-2026-0006",
    category: "Marketing",
    amount: 15000,
    description: "Distribution of local pamphlets and Facebook ads for new outlet launch",
    paymentMethod: "Wallet",
    attachment: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
    approvedBy: "",
    expenseDate: "2026-06-17",
    status: "Rejected",
    createdBy: "Vikram Rathore"
  },
  {
    _id: "exp-7",
    franchiseId: "store-1",
    storeId: "store-1",
    expenseNumber: "EXP-2026-0007",
    category: "Refund",
    amount: 450,
    description: "Refund to customer Amit Sharma due to cold pizza complaints",
    paymentMethod: "UPI",
    attachment: "",
    approvedBy: "System Auto",
    expenseDate: "2026-06-16",
    status: "Approved",
    createdBy: "Amit Sharma"
  },
  {
    _id: "exp-8",
    franchiseId: "store-2",
    storeId: "store-2",
    expenseNumber: "EXP-2026-0008",
    category: "Delivery",
    amount: 3200,
    description: "Fuel reimbursement for delivery riders - Indore Central hub",
    paymentMethod: "Cash",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-15",
    status: "Approved",
    createdBy: "Priya Patel"
  },
  {
    _id: "exp-9",
    franchiseId: "store-3",
    storeId: "store-3",
    expenseNumber: "EXP-2026-0009",
    category: "Miscellaneous",
    amount: 1200,
    description: "Purchase of basic cleaning items - brooms, floor cleaners, wipes",
    paymentMethod: "Cash",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-14",
    status: "Approved",
    createdBy: "Rohan Malhotra"
  },
  {
    _id: "exp-10",
    franchiseId: "store-4",
    storeId: "store-4",
    expenseNumber: "EXP-2026-0010",
    category: "Inventory",
    amount: 31200,
    description: "Fresh vegetable supply (onions, capsicum, tomatoes) from Indore Mandi",
    paymentMethod: "Bank Transfer",
    attachment: "https://pdfobject.com/pdf/sample.pdf",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-13",
    status: "Approved",
    createdBy: "Rashi Kumar"
  },
  {
    _id: "exp-11",
    franchiseId: "store-5",
    storeId: "store-5",
    expenseNumber: "EXP-2026-0011",
    category: "Salary",
    amount: 22000,
    description: "Monthly salary payment for head chef - Sneha Reddy",
    paymentMethod: "Bank Transfer",
    attachment: "",
    approvedBy: "",
    expenseDate: "2026-06-12",
    status: "Pending",
    createdBy: "Vikram Rathore"
  },
  {
    _id: "exp-12",
    franchiseId: "store-1",
    storeId: "store-1",
    expenseNumber: "EXP-2026-0012",
    category: "Maintenance",
    amount: 1500,
    description: "Water purifier filter replacement service charge",
    paymentMethod: "UPI",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-10",
    status: "Approved",
    createdBy: "Amit Sharma"
  },
  {
    _id: "exp-13",
    franchiseId: "store-2",
    storeId: "store-2",
    expenseNumber: "EXP-2026-0013",
    category: "Electricity",
    amount: 14800,
    description: "Electricity bill for Bhopal Zone outlet",
    paymentMethod: "UPI",
    attachment: "",
    approvedBy: "",
    expenseDate: "2026-06-08",
    status: "Pending",
    createdBy: "Priya Patel"
  },
  {
    _id: "exp-14",
    franchiseId: "store-3",
    storeId: "store-3",
    expenseNumber: "EXP-2026-0014",
    category: "Gas",
    amount: 7200,
    description: "Refilling of 4 commercial LPG cylinders - Ujjain outlet",
    paymentMethod: "Card",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-06",
    status: "Approved",
    createdBy: "Rohan Malhotra"
  },
  {
    _id: "exp-15",
    franchiseId: "store-4",
    storeId: "store-4",
    expenseNumber: "EXP-2026-0015",
    category: "Marketing",
    amount: 8500,
    description: "Local influencer promotion video charge - Gwalior Hub",
    paymentMethod: "UPI",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-04",
    status: "Approved",
    createdBy: "Rashi Kumar"
  },
  {
    _id: "exp-16",
    franchiseId: "store-1",
    storeId: "store-1",
    expenseNumber: "EXP-2026-0016",
    category: "Inventory",
    amount: 19500,
    description: "Pizza boxes purchase (3000 units) from packing vendor",
    paymentMethod: "Bank Transfer",
    attachment: "https://pdfobject.com/pdf/sample.pdf",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-02",
    status: "Approved",
    createdBy: "Amit Sharma"
  },
  {
    _id: "exp-17",
    franchiseId: "store-2",
    storeId: "store-2",
    expenseNumber: "EXP-2026-0017",
    category: "Salary",
    amount: 15000,
    description: "Monthly salary payment for delivery boy - Vikram Rathore",
    paymentMethod: "Bank Transfer",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-06-01",
    status: "Approved",
    createdBy: "Priya Patel"
  },
  {
    _id: "exp-18",
    franchiseId: "store-1",
    storeId: "store-1",
    expenseNumber: "EXP-2026-0018",
    category: "Inventory",
    amount: 42000,
    description: "Cheese and Paneer bulk procurement for June stock",
    paymentMethod: "Bank Transfer",
    attachment: "https://pdfobject.com/pdf/sample.pdf",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-05-28",
    status: "Approved",
    createdBy: "Amit Sharma"
  },
  {
    _id: "exp-19",
    franchiseId: "store-3",
    storeId: "store-3",
    expenseNumber: "EXP-2026-0019",
    category: "Electricity",
    amount: 11900,
    description: "Electricity bill for Ujjain outlet - May month billing",
    paymentMethod: "UPI",
    attachment: "",
    approvedBy: "Shubham Jamliya",
    expenseDate: "2026-05-25",
    status: "Approved",
    createdBy: "Rohan Malhotra"
  },
  {
    _id: "exp-20",
    franchiseId: "store-4",
    storeId: "store-4",
    expenseNumber: "EXP-2026-0020",
    category: "Marketing",
    amount: 18000,
    description: "Google Ads campaign setup for Papa Veg Pizza brand awareness",
    paymentMethod: "Card",
    attachment: "",
    approvedBy: "",
    expenseDate: "2026-05-22",
    status: "Rejected",
    createdBy: "Rashi Kumar"
  }
];

// Mapped store_earnings mock collection from franchise revenue records
export const mockStoreEarnings = mockFranchiseRevenue.map(rec => ({
  _id: rec._id.replace("rev-", "earn-"),
  storeId: rec.franchiseId,
  franchiseId: rec.franchiseId,
  date: rec.date,
  totalOrders: rec.totalOrders,
  grossSales: rec.grossRevenue,
  discounts: rec.discountAmount,
  refunds: rec.refundAmount,
  expenses: rec.totalExpenses,
  netProfit: rec.totalProfit
}));

export const mockDeliveryPartners = [
  { id: "rider-1", name: "Rajesh Kumar", phone: "+91 98260 11223", vehicleType: "Bike", rating: 4.8, active: true, storeId: "store-1" },
  { id: "rider-2", name: "Suresh Patel", phone: "+91 99770 44556", vehicleType: "Scooter", rating: 4.5, active: true, storeId: "store-1" },
  { id: "rider-3", name: "Rahul Sharma", phone: "+91 98930 77889", vehicleType: "Bike", rating: 4.6, active: true, storeId: "store-2" },
  { id: "rider-4", name: "Amit Mishra", phone: "+91 99887 11223", vehicleType: "EV Cycle", rating: 4.2, active: true, storeId: "store-3" },
  { id: "rider-5", name: "Vikram Rathore", phone: "+91 88401 22894", vehicleType: "Bike", rating: 4.7, active: true, storeId: "store-4" },
  { id: "rider-6", name: "Karan Singh", phone: "+91 74029 88390", vehicleType: "Scooter", rating: 4.4, active: true, storeId: "store-5" },
  { id: "rider-7", name: "Rahul Dev", phone: "+91 98402 12903", vehicleType: "Bike", rating: 4.9, active: true, storeId: "store-1" }
];

export const mockRiderPayouts = [
  {
    _id: "pay-1",
    riderId: "rider-1",
    franchiseId: "store-1",
    payoutNumber: "PAY-2026-0001",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    totalDeliveries: 120,
    baseSalary: 6000,
    incentive: 1800,
    bonus: 500,
    penalties: 200,
    totalAmount: 8100,
    paymentStatus: "Paid",
    paidDate: "2026-06-16",
    paymentMethod: "UPI"
  },
  {
    _id: "pay-2",
    riderId: "rider-2",
    franchiseId: "store-1",
    payoutNumber: "PAY-2026-0002",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    totalDeliveries: 95,
    baseSalary: 6000,
    incentive: 1425,
    bonus: 200,
    penalties: 0,
    totalAmount: 7625,
    paymentStatus: "Pending",
    paidDate: null,
    paymentMethod: null
  },
  {
    _id: "pay-3",
    riderId: "rider-3",
    franchiseId: "store-2",
    payoutNumber: "PAY-2026-0003",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    totalDeliveries: 110,
    baseSalary: 6000,
    incentive: 1650,
    bonus: 400,
    penalties: 100,
    totalAmount: 7950,
    paymentStatus: "Paid",
    paidDate: "2026-06-16",
    paymentMethod: "Bank Transfer"
  },
  {
    _id: "pay-4",
    riderId: "rider-4",
    franchiseId: "store-3",
    payoutNumber: "PAY-2026-0004",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    totalDeliveries: 80,
    baseSalary: 5500,
    incentive: 1200,
    bonus: 0,
    penalties: 300,
    totalAmount: 6400,
    paymentStatus: "Failed",
    paidDate: "2026-06-17",
    paymentMethod: "UPI"
  },
  {
    _id: "pay-5",
    riderId: "rider-5",
    franchiseId: "store-4",
    payoutNumber: "PAY-2026-0005",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    totalDeliveries: 130,
    baseSalary: 6500,
    incentive: 1950,
    bonus: 600,
    penalties: 150,
    totalAmount: 8900,
    paymentStatus: "Paid",
    paidDate: "2026-06-16",
    paymentMethod: "UPI"
  },
  {
    _id: "pay-6",
    riderId: "rider-6",
    franchiseId: "store-5",
    payoutNumber: "PAY-2026-0006",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    totalDeliveries: 85,
    baseSalary: 5500,
    incentive: 1275,
    bonus: 100,
    penalties: 50,
    totalAmount: 6825,
    paymentStatus: "Pending",
    paidDate: null,
    paymentMethod: null
  },
  {
    _id: "pay-7",
    riderId: "rider-7",
    franchiseId: "store-1",
    payoutNumber: "PAY-2026-0007",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    totalDeliveries: 140,
    baseSalary: 6500,
    incentive: 2100,
    bonus: 800,
    penalties: 0,
    totalAmount: 9400,
    paymentStatus: "Paid",
    paidDate: "2026-06-16",
    paymentMethod: "Bank Transfer"
  },
  {
    _id: "pay-prev-1",
    riderId: "rider-1",
    franchiseId: "store-1",
    payoutNumber: "PAY-2026-0008",
    startDate: "2026-05-15",
    endDate: "2026-05-31",
    totalDeliveries: 115,
    baseSalary: 6000,
    incentive: 1725,
    bonus: 300,
    penalties: 100,
    totalAmount: 7925,
    paymentStatus: "Paid",
    paidDate: "2026-06-01",
    paymentMethod: "UPI"
  },
  {
    _id: "pay-prev-2",
    riderId: "rider-2",
    franchiseId: "store-1",
    payoutNumber: "PAY-2026-0009",
    startDate: "2026-05-15",
    endDate: "2026-05-31",
    totalDeliveries: 90,
    baseSalary: 6000,
    incentive: 1350,
    bonus: 100,
    penalties: 50,
    totalAmount: 7400,
    paymentStatus: "Paid",
    paidDate: "2026-06-01",
    paymentMethod: "UPI"
  },
  {
    _id: "pay-prev-2",
    riderId: "rider-2",
    franchiseId: "store-1",
    payoutNumber: "PAY-2026-0009",
    startDate: "2026-05-15",
    endDate: "2026-05-31",
    totalDeliveries: 90,
    baseSalary: 6000,
    incentive: 1350,
    bonus: 100,
    penalties: 50,
    totalAmount: 7400,
    paymentStatus: "Paid",
    paidDate: "2026-06-01",
    paymentMethod: "Cash"
  }
];

export const mockGeneratedReports = [
  {
    _id: "rep-1",
    reportNumber: "REP-2026-0001",
    reportType: "Sales Report",
    startDate: "2026-06-01",
    endDate: "2026-06-22",
    generatedBy: "Amit Sharma",
    fileUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Completed",
    createdAt: "2026-06-22T10:30:00Z",
    fileSize: "2.4 MB",
    duration: "1.2s",
    jobId: "bull-job-101",
    stores: "All Stores",
    format: "PDF",
    includeCharts: true,
    includeSummary: true,
    downloadCount: 4
  },
  {
    _id: "rep-2",
    reportNumber: "REP-2026-0002",
    reportType: "Store Performance Report",
    startDate: "2026-06-01",
    endDate: "2026-06-20",
    generatedBy: "Priya Patel",
    fileUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Completed",
    createdAt: "2026-06-21T14:45:00Z",
    fileSize: "1.8 MB",
    duration: "2.1s",
    jobId: "bull-job-102",
    stores: "Papa Veg Pizza - Indore Central",
    format: "Excel",
    includeCharts: false,
    includeSummary: true,
    downloadCount: 8
  },
  {
    _id: "rep-3",
    reportNumber: "REP-2026-0003",
    reportType: "Product Sales Report",
    startDate: "2026-06-10",
    endDate: "2026-06-17",
    generatedBy: "Rohan Malhotra",
    fileUrl: "",
    status: "Generating",
    createdAt: "2026-06-22T18:20:00Z",
    fileSize: "--",
    duration: "--",
    jobId: "bull-job-103",
    stores: "Papa Veg Pizza - Bhopal Zone",
    format: "PDF",
    includeCharts: true,
    includeSummary: true,
    downloadCount: 0
  },
  {
    _id: "rep-4",
    reportNumber: "REP-2026-0004",
    reportType: "Inventory Report",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    generatedBy: "Rashi Kumar",
    fileUrl: "",
    status: "Failed",
    createdAt: "2026-06-20T09:15:00Z",
    fileSize: "--",
    duration: "--",
    jobId: "bull-job-104",
    stores: "All Stores",
    format: "CSV",
    includeCharts: false,
    includeSummary: false,
    downloadCount: 0
  },
  {
    _id: "rep-5",
    reportNumber: "REP-2026-0005",
    reportType: "Rider Performance Report",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    generatedBy: "Vikram Rathore",
    fileUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Completed",
    createdAt: "2026-06-16T17:00:00Z",
    fileSize: "1.1 MB",
    duration: "1.5s",
    jobId: "bull-job-105",
    stores: "Papa Veg Pizza - Ujjain Branch",
    format: "CSV",
    includeCharts: false,
    includeSummary: true,
    downloadCount: 2
  },
  {
    _id: "rep-6",
    reportNumber: "REP-2026-0006",
    reportType: "Customer Report",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    generatedBy: "Sneha Reddy",
    fileUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Completed",
    createdAt: "2026-06-01T11:00:00Z",
    fileSize: "3.5 MB",
    duration: "3.4s",
    jobId: "bull-job-106",
    stores: "All Stores",
    format: "PDF",
    includeCharts: true,
    includeSummary: true,
    downloadCount: 15
  },
  {
    _id: "rep-7",
    reportNumber: "REP-2026-0007",
    reportType: "Finance Report",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    generatedBy: "Shubham Jamliya",
    fileUrl: "https://pdfobject.com/pdf/sample.pdf",
    status: "Completed",
    createdAt: "2026-06-01T12:30:00Z",
    fileSize: "2.9 MB",
    duration: "2.8s",
    jobId: "bull-job-107",
    stores: "All Stores",
    format: "Excel",
    includeCharts: true,
    includeSummary: true,
    downloadCount: 12
  }
];

export const mockScheduledReports = [
  {
    _id: "sch-1",
    reportType: "Sales Report",
    frequency: "Daily",
    emailRecipients: ["shubham@papavegpizza.com", "finance@papavegpizza.com"],
    format: "PDF",
    nextRun: "2026-06-23T08:00:00Z",
    lastRun: "2026-06-22T08:00:00Z",
    deliveryMethod: "Both",
    runTime: "08:00 AM",
    active: true
  },
  {
    _id: "sch-2",
    reportType: "Store Performance Report",
    frequency: "Weekly",
    emailRecipients: ["ops@papavegpizza.com"],
    format: "Excel",
    nextRun: "2026-06-28T09:00:00Z",
    lastRun: "2026-06-21T09:00:00Z",
    deliveryMethod: "Email",
    runTime: "09:00 AM",
    active: true
  },
  {
    _id: "sch-3",
    reportType: "Inventory Report",
    frequency: "Monthly",
    emailRecipients: ["kitchen@papavegpizza.com", "procurement@papavegpizza.com"],
    format: "CSV",
    nextRun: "2026-07-01T06:00:00Z",
    lastRun: "2026-06-01T06:00:00Z",
    deliveryMethod: "Download Center",
    runTime: "06:00 AM",
    active: false
  }
];


