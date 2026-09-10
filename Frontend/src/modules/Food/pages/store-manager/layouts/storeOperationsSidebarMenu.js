export const storeOperationsSidebarMenu = [
  {
    type: "link",
    label: "Dashboard",
    path: "/store-operations/dashboard",
    icon: "LayoutDashboard",
    allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
  },
  {
    type: "section",
    label: "Orders",
    allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"],
    items: [
      {
        type: "link",
        label: "Incoming Orders",
        path: "/store-operations/orders/incoming",
        icon: "Inbox",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      },
      {
        type: "link",
        label: "Active Orders",
        path: "/store-operations/orders/active",
        icon: "PlayCircle",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      },
      {
        type: "link",
        label: "Ready Orders",
        path: "/store-operations/orders/ready",
        icon: "CheckCircle2",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Completed Orders",
        path: "/store-operations/orders/completed",
        icon: "CheckCircle",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Cancelled Orders",
        path: "/store-operations/orders/cancelled",
        icon: "XCircle",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      }
    ]
  },
  {
    type: "section",
    label: "Kitchen Operations",
    allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"],
    items: [
      {
        type: "link",
        label: "Kitchen Queue",
        path: "/store-operations/kitchen/queue",
        icon: "ListOrdered",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Preparation Board",
        path: "/store-operations/kitchen/preparation",
        icon: "KanbanSquare",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Pizza Station",
        path: "/store-operations/kitchen/pizza-station",
        icon: "Pizza",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Baking Station",
        path: "/store-operations/kitchen/baking-station",
        icon: "CookingPot",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Packaging Station",
        path: "/store-operations/kitchen/packaging-station",
        icon: "Package",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Delayed Orders",
        path: "/store-operations/kitchen/delayed-orders",
        icon: "Hourglass",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      }
    ]
  },
  {
    type: "section",
    label: "Delivery Operations",
    allowedRoles: ["store_manager"],
    items: [
      {
        type: "link",
        label: "Assign Rider",
        path: "/store-operations/delivery/assign",
        icon: "UserCheck",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Rider Availability",
        path: "/store-operations/delivery/availability",
        icon: "ToggleLeft",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Delivery Tracking",
        path: "/store-operations/delivery/tracking",
        icon: "MapPin",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Delivery Issues",
        path: "/store-operations/delivery/issues",
        icon: "AlertOctagon",
        allowedRoles: ["store_manager"]
      }
    ]
  },
  {
    type: "section",
    label: "Inventory",
    allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"],
    items: [
      {
        type: "link",
        label: "Ingredient Stock",
        path: "/store-operations/inventory/stock",
        icon: "ClipboardList",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      },
      {
        type: "link",
        label: "Stock Requests",
        path: "/store-operations/inventory/requests",
        icon: "FileText",
        allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
      },
      {
        type: "link",
        label: "Waste Management",
        path: "/store-operations/inventory/waste",
        icon: "Trash2",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      },
      {
        type: "link",
        label: "Low Stock Alerts",
        path: "/store-operations/inventory/low-stock",
        icon: "AlertTriangle",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      },
      {
        type: "link",
        label: "Ingredient Shortages",
        path: "/store-operations/inventory/shortages",
        icon: "TrendingDown",
        allowedRoles: ["store_manager", "kitchen_supervisor"]
      }
    ]
  },
  {
    type: "section",
    label: "Staff Management",
    allowedRoles: ["store_manager"],
    items: [
      {
        type: "link",
        label: "Kitchen Staff",
        path: "/store-operations/staff/list",
        icon: "Contact",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Attendance",
        path: "/store-operations/staff/attendance",
        icon: "CalendarCheck",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Shift Management",
        path: "/store-operations/staff/shifts",
        icon: "Clock",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Performance",
        path: "/store-operations/staff/performance",
        icon: "Award",
        allowedRoles: ["store_manager"]
      }
    ]
  },
  {
    type: "section",
    label: "Customers",
    allowedRoles: ["store_manager", "assistant_manager", "store_owner"],
    items: [
      {
        type: "link",
        label: "Customer Orders",
        path: "/store-operations/customers/orders",
        icon: "History",
        allowedRoles: ["store_manager", "assistant_manager", "store_owner"]
      },
      {
        type: "link",
        label: "Complaints",
        path: "/store-operations/customers/complaints",
        icon: "ShieldAlert",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Reviews",
        path: "/store-operations/customers/reviews",
        icon: "Star",
        allowedRoles: ["store_manager", "store_owner", "assistant_manager", "customer_experience_manager"]
      }
    ]
  },
  {
    type: "section",
    label: "Reports",
    allowedRoles: ["store_manager"],
    items: [
      {
        type: "link",
        label: "Daily Sales",
        path: "/store-operations/reports/sales",
        icon: "DollarSign",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Order Reports",
        path: "/store-operations/reports/orders",
        icon: "FileText",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Kitchen Performance",
        path: "/store-operations/reports/kitchen",
        icon: "Gauge",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Staff Performance",
        path: "/store-operations/reports/staff",
        icon: "Users",
        allowedRoles: ["store_manager"]
      },
      {
        type: "link",
        label: "Store Performance",
        path: "/store-operations/reports/store",
        icon: "Store",
        allowedRoles: ["store_manager"]
      }
    ]
  },
  {
    type: "link",
    label: "My Tasks",
    path: "/store-operations/tasks",
    icon: "ListTodo",
    allowedRoles: ["kitchen_supervisor", "kitchen_staff"]
  },
  {
    type: "link",
    label: "Profile",
    path: "/store-operations/profile",
    icon: "User",
    allowedRoles: ["store_manager", "kitchen_supervisor", "kitchen_staff"]
  }
];
