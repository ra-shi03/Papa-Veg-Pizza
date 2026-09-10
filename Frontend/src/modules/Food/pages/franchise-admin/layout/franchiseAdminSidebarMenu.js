export const franchiseAdminSidebarMenu = [
  {
    type: "link",
    label: "Dashboard",
    path: "/franchise-admin/dashboard",
    icon: "LayoutDashboard",
  },
  {
    type: "section",
    label: "STORE MANAGEMENT",
    items: [
      { type: "link", label: "Stores", path: "/franchise-admin/stores", icon: "Store" },
      { type: "link", label: "Store Approvals", path: "/franchise-admin/store-approvals", icon: "FileCheck" },
      { type: "link", label: "Store Performance", path: "/franchise-admin/store-performance", icon: "TrendingUp" },
      { type: "link", label: "Operating Hours", path: "/franchise-admin/operating-hours", icon: "Clock" },
    ],
  },
  {
    type: "section",
    label: "STAFF MANAGEMENT",
    items: [
      { type: "link", label: "Store Managers", path: "/franchise-admin/store-managers", icon: "UserCog" },
      { type: "link", label: "Kitchen Staff", path: "/franchise-admin/employees", icon: "Users" },
      { type: "link", label: "Delivery Partners", path: "/franchise-admin/delivery-partners", icon: "Truck" },
    ],
  },
  {
    type: "section",
    label: "ORDERS",
    items: [
      { type: "link", label: "Live Orders", path: "/franchise-admin/live-orders", icon: "Activity" },
      { type: "link", label: "Completed Orders", path: "/franchise-admin/completed-orders", icon: "CheckCircle" },
      { type: "link", label: "Cancelled Orders", path: "/franchise-admin/cancelled-orders", icon: "XCircle" },
      { type: "link", label: "Refund Requests", path: "/franchise-admin/refund-requests", icon: "RotateCcw" },
      { type: "link", label: "Order Issues", path: "/franchise-admin/order-issues", icon: "AlertTriangle" },
    ],
  },
  {
    type: "section",
    label: "PRODUCTS",
    items: [
      { type: "link", label: "Products", path: "/franchise-admin/products", icon: "Pizza" },
      { type: "link", label: "Categories", path: "/franchise-admin/categories", icon: "Grid" },
      { type: "link", label: "Add-ons", path: "/franchise-admin/addons", icon: "Sparkles" },
      { type: "link", label: "Store Pricing", path: "/franchise-admin/store-pricing", icon: "DollarSign" },
    ],
  },
  {
    type: "section",
    label: "INVENTORY",
    items: [
      { type: "link", label: "Ingredients", path: "/franchise-admin/ingredients", icon: "ShoppingBag" },
      { type: "link", label: "Stock Levels", path: "/franchise-admin/stock-levels", icon: "Layers" },
      { type: "link", label: "Low Stock Alerts", path: "/franchise-admin/low-stock-alerts", icon: "AlertCircle" },
      { type: "link", label: "Purchase Requests", path: "/franchise-admin/purchase-requests", icon: "ClipboardList" },
    ],
  },
  {
    type: "section",
    label: "CUSTOMERS",
    items: [
      { type: "link", label: "Customer List", path: "/franchise-admin/customers-list", icon: "Users" },
      { type: "link", label: "Customer Complaints", path: "/franchise-admin/customer-complaints", icon: "ShieldAlert" },
      { type: "link", label: "Reviews & Ratings", path: "/franchise-admin/reviews-ratings", icon: "Star" },
      { type: "link", label: "Loyalty Members", path: "/franchise-admin/loyalty-members", icon: "Trophy" },
    ],
  },
  {
    type: "section",
    label: "FINANCE",
    items: [
      { type: "link", label: "Franchise Revenue", path: "/franchise-admin/franchise-revenue", icon: "DollarSign" },
      { type: "link", label: "Expenses", path: "/franchise-admin/expenses", icon: "TrendingDown" },
      { type: "link", label: "Store Earnings", path: "/franchise-admin/store-earnings", icon: "Landmark" },
      { type: "link", label: "Rider Payouts", path: "/franchise-admin/rider-payouts", icon: "CreditCard" },
      { type: "link", label: "Reports", path: "/franchise-admin/reports", icon: "FileText" },
    ],
  },
  {
    type: "section",
    label: "MARKETING",
    items: [
      { type: "link", label: "Local Coupons", path: "/franchise-admin/coupons", icon: "Ticket" },
      { type: "link", label: "Campaigns", path: "/franchise-admin/campaigns", icon: "Megaphone" },
      { type: "link", label: "Promotional Banners", path: "/franchise-admin/banners", icon: "Image" },
      { type: "link", label: "Notifications", path: "/franchise-admin/notifications", icon: "Bell" },
    ],
  },
  {
    type: "section",
    label: "REPORTS",
    items: [
      { type: "link", label: "Sales Reports", path: "/franchise-admin/sales-report", icon: "BarChart3" },
      { type: "link", label: "Order Reports", path: "/franchise-admin/orders-report", icon: "LineChart" },
      { type: "link", label: "Staff Reports", path: "/franchise-admin/staff-reports", icon: "ClipboardList" },
      { type: "link", label: "Inventory Reports", path: "/franchise-admin/inventory-reports", icon: "FileText" },
    ],
  },
  {
    type: "link",
    label: "Profile",
    path: "/franchise-admin/dashboard/profile",
    icon: "User",
  }
];
