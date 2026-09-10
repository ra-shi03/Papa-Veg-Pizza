export const initialStores = [
  { _id: "store-1", storeCode: "PVP-IND-01", storeName: "Papa Veg Pizza - Indore Central", city: "Indore" },
  { _id: "store-2", storeCode: "PVP-BHP-01", storeName: "Papa Veg Pizza - Bhopal Zone", city: "Bhopal" },
  { _id: "store-3", storeCode: "PVP-UJN-01", storeName: "Papa Veg Pizza - Ujjain Branch", city: "Ujjain" },
  { _id: "store-4", storeCode: "PVP-GWL-01", storeName: "Papa Veg Pizza - Gwalior Hub", city: "Gwalior" },
  { _id: "store-5", storeCode: "PVP-JBL-01", storeName: "Papa Veg Pizza - Jabalpur Outlet", city: "Jabalpur" },
  { _id: "store-6", storeCode: "PVP-DWS-01", storeName: "Papa Veg Pizza - Dewas Kitchen", city: "Dewas" },
  { _id: "store-7", storeCode: "PVP-PTH-01", storeName: "Papa Veg Pizza - Pithampur Express", city: "Pithampur" },
  { _id: "store-8", storeCode: "PVP-RTL-01", storeName: "Papa Veg Pizza - Ratlam Hub", city: "Ratlam" },
  { _id: "store-9", storeCode: "PVP-SGR-01", storeName: "Papa Veg Pizza - Sagar Outlet", city: "Sagar" },
  { _id: "store-10", storeCode: "PVP-REW-01", storeName: "Papa Veg Pizza - Rewa Kitchen", city: "Rewa" }
];

export const initialManagers = [
  {
    id: "mgr-1",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@papaveg.com",
    phone: "9876543210",
    employeeCode: "PVM-001",
    joinedDate: "2022-01-15",
    status: "Active",
    experience: "4.5 years",
    storeId: "store-1",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management", "reports_access", "refund_approval"],
    personalDetails: {
      address: "102, Shanti Nagar, AB Road, Indore, MP",
      emergencyContact: "Sunita Sharma (Wife) - 9876543211",
      salary: 55000
    }
  },
  {
    id: "mgr-2",
    name: "Sunil Kumar",
    email: "sunil.kumar@papaveg.com",
    phone: "9988776655",
    employeeCode: "PVM-002",
    joinedDate: "2021-06-10",
    status: "Active",
    experience: "5.2 years",
    storeId: "store-2",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management", "reports_access", "promotions_access", "refund_approval"],
    personalDetails: {
      address: "Plot 45, Arera Colony, Bhopal, MP",
      emergencyContact: "Ramesh Kumar (Brother) - 9988776654",
      salary: 62000
    }
  },
  {
    id: "mgr-3",
    name: "Amit Patel",
    email: "amit.patel@papaveg.com",
    phone: "9111223344",
    employeeCode: "PVM-003",
    joinedDate: "2023-03-20",
    status: "Active",
    experience: "3.2 years",
    storeId: "store-3",
    profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management"],
    personalDetails: {
      address: "24, Mahakal Marg, Ujjain, MP",
      emergencyContact: "Kiran Patel (Father) - 9111223340",
      salary: 48000
    }
  },
  {
    id: "mgr-4",
    name: "Vikram Malhotra",
    email: "vikram.m@papaveg.com",
    phone: "9893012345",
    employeeCode: "PVM-004",
    joinedDate: "2024-05-12",
    status: "On Leave",
    experience: "2.1 years",
    storeId: "store-4",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "staff_management"],
    personalDetails: {
      address: "G-12, DD Nagar, Gwalior, MP",
      emergencyContact: "Sanjay Malhotra (Father) - 9893012340",
      salary: 45000
    }
  },
  {
    id: "mgr-5",
    name: "Kavita Iyer",
    email: "kavita.iyer@papaveg.com",
    phone: "9755033445",
    employeeCode: "PVM-005",
    joinedDate: "2020-11-01",
    status: "Active",
    experience: "5.8 years",
    storeId: "store-5",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management", "reports_access", "promotions_access", "refund_approval"],
    personalDetails: {
      address: "405, Napier Town, Jabalpur, MP",
      emergencyContact: "M. Iyer (Husband) - 9755033440",
      salary: 65000
    }
  },
  {
    id: "mgr-6",
    name: "Priyanka Joshi",
    email: "priyanka.j@papaveg.com",
    phone: "9926077889",
    employeeCode: "PVM-006",
    joinedDate: "2023-08-15",
    status: "Active",
    experience: "2.8 years",
    storeId: "store-6",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access"],
    personalDetails: {
      address: "12, Civic Centre, Dewas, MP",
      emergencyContact: "Anoop Joshi (Brother) - 9926077880",
      salary: 46000
    }
  },
  {
    id: "mgr-7",
    name: "Sandeep Patil",
    email: "sandeep.patil@papaveg.com",
    phone: "9826255667",
    employeeCode: "PVM-007",
    joinedDate: "2025-01-10",
    status: "Active",
    experience: "1.5 years",
    storeId: "store-7",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen"],
    personalDetails: {
      address: "Sector 3, Pithampur Industrial Area, Pithampur, MP",
      emergencyContact: "Vandana Patil (Mother) - 9826255660",
      salary: 42000
    }
  },
  {
    id: "mgr-8",
    name: "Manoj Yadav",
    email: "manoj.yadav@papaveg.com",
    phone: "9977544332",
    employeeCode: "PVM-008",
    joinedDate: "2024-02-28",
    status: "Active",
    experience: "2.4 years",
    storeId: "store-8",
    profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management", "refund_approval"],
    personalDetails: {
      address: "Plot 89, Station Road, Ratlam, MP",
      emergencyContact: "Rekha Yadav (Wife) - 9977544330",
      salary: 50000
    }
  },
  {
    id: "mgr-9",
    name: "Deepak Deshmukh",
    email: "deepak.d@papaveg.com",
    phone: "9893211223",
    employeeCode: "PVM-009",
    joinedDate: "2025-09-01",
    status: "Suspended",
    experience: "0.8 years",
    storeId: "store-9",
    profileImage: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders"],
    personalDetails: {
      address: "Kakaganj Ward, Sagar, MP",
      emergencyContact: "Nitin Deshmukh (Father) - 9893211220",
      salary: 38000
    }
  },
  {
    id: "mgr-10",
    name: "Rohan Gupta",
    email: "rohan.gupta@papaveg.com",
    phone: "9754112233",
    employeeCode: "PVM-010",
    joinedDate: "2023-11-15",
    status: "Active",
    experience: "2.6 years",
    storeId: "store-10",
    profileImage: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management"],
    personalDetails: {
      address: "Civil Lines, Rewa, MP",
      emergencyContact: "Sudha Gupta (Mother) - 9754112230",
      salary: 47000
    }
  },
  {
    id: "mgr-11",
    name: "Sunita Rao",
    email: "sunita.rao@papaveg.com",
    phone: "9926889900",
    employeeCode: "PVM-011",
    joinedDate: "2020-04-10",
    status: "Active",
    experience: "6.2 years",
    storeId: "store-1",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management", "reports_access", "refund_approval"],
    personalDetails: {
      address: "22-A, Scheme 54, Vijay Nagar, Indore, MP",
      emergencyContact: "P. Rao (Husband) - 9926889901",
      salary: 63000
    }
  },
  {
    id: "mgr-12",
    name: "Aarav Singh",
    email: "aarav.singh@papaveg.com",
    phone: "9826022334",
    employeeCode: "PVM-012",
    joinedDate: "2025-02-01",
    status: "Active",
    experience: "1.2 years",
    storeId: "store-3",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access"],
    personalDetails: {
      address: "10-C, Nanakheda, Ujjain, MP",
      emergencyContact: "B. Singh (Father) - 9826022330",
      salary: 40000
    }
  },
  {
    id: "mgr-13",
    name: "Sanjay Trivedi",
    email: "sanjay.t@papaveg.com",
    phone: "9879011223",
    employeeCode: "PVM-013",
    joinedDate: "2023-01-10",
    status: "Active",
    experience: "3.5 years",
    storeId: "store-4",
    profileImage: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "staff_management", "reports_access"],
    personalDetails: {
      address: "Morar Colony, Gwalior, MP",
      emergencyContact: "Meena Trivedi (Wife) - 9879011220",
      salary: 49000
    }
  },
  {
    id: "mgr-14",
    name: "Neha Sharma",
    email: "neha.sharma@papaveg.com",
    phone: "9988112244",
    employeeCode: "PVM-014",
    joinedDate: "2024-09-12",
    status: "Active",
    experience: "1.8 years",
    storeId: "store-5",
    profileImage: "https://images.unsplash.com/photo-1558203728-00f45181dd84?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "promotions_access"],
    personalDetails: {
      address: "Madan Mahal Road, Jabalpur, MP",
      emergencyContact: "S. Sharma (Husband) - 9988112240",
      salary: 43000
    }
  },
  {
    id: "mgr-15",
    name: "Pooja Verma",
    email: "pooja.verma@papaveg.com",
    phone: "9926112233",
    employeeCode: "PVM-015",
    joinedDate: "2022-07-15",
    status: "Active",
    experience: "3.9 years",
    storeId: "store-2",
    profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "staff_management", "promotions_access", "refund_approval"],
    personalDetails: {
      address: "Indrapuri, Bhopal, MP",
      emergencyContact: "Vijay Verma (Husband) - 9926112230",
      salary: 52000
    }
  },
  {
    id: "mgr-16",
    name: "Sameer Joshi",
    email: "sameer.joshi@papaveg.com",
    phone: "9826311223",
    employeeCode: "PVM-016",
    joinedDate: "2021-12-01",
    status: "Active",
    experience: "4.6 years",
    storeId: "store-6",
    profileImage: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management", "refund_approval"],
    personalDetails: {
      address: "Vikram Nagar, Dewas, MP",
      emergencyContact: "Deepak Joshi (Brother) - 9826311220",
      salary: 54000
    }
  },
  {
    id: "mgr-17",
    name: "Shalini Singh",
    email: "shalini.s@papaveg.com",
    phone: "9752112233",
    employeeCode: "PVM-017",
    joinedDate: "2024-04-10",
    status: "Active",
    experience: "2.2 years",
    storeId: "store-8",
    profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "reports_access"],
    personalDetails: {
      address: "Jaora Road, Ratlam, MP",
      emergencyContact: "Amit Singh (Husband) - 9752112230",
      salary: 47000
    }
  },
  {
    id: "mgr-18",
    name: "Vijay Kumar",
    email: "vijay.kumar@papaveg.com",
    phone: "9893887766",
    employeeCode: "PVM-018",
    joinedDate: "2022-09-01",
    status: "Active",
    experience: "3.8 years",
    storeId: "store-7",
    profileImage: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=150&fm=webp",
    permissions: ["view_orders", "manage_kitchen", "inventory_access", "staff_management", "reports_access"],
    personalDetails: {
      address: "Sanjay Reservoir area, Pithampur, MP",
      emergencyContact: "Sarita Kumar (Wife) - 9893887760",
      salary: 51000
    }
  }
];

export const getManagerPerformance = (mgrId) => {
  // Simulates performance data based on manager ID
  const seed = mgrId.split("-")[1] || 1;
  const rating = (4.2 + (seed % 9) * 0.1).toFixed(1);
  const orders = 300 + (seed * 30);
  const prepTime = 10 + (seed % 6);
  const invAcc = 94 + (seed % 5);
  const attRate = 92 + (seed % 7);

  // Recharts trends
  const ordersTrend = [
    { day: "Mon", orders: Math.floor(orders / 6) },
    { day: "Tue", orders: Math.floor(orders / 6.2) },
    { day: "Wed", orders: Math.floor(orders / 5.8) },
    { day: "Thu", orders: Math.floor(orders / 6.5) },
    { day: "Fri", orders: Math.floor(orders / 5.2) },
    { day: "Sat", orders: Math.floor(orders / 4.5) },
    { day: "Sun", orders: Math.floor(orders / 4.2) }
  ];

  const ratingTrend = [
    { label: "W1", rating: (parseFloat(rating) - 0.2).toFixed(1) },
    { label: "W2", rating: (parseFloat(rating) - 0.1).toFixed(1) },
    { label: "W3", rating: (parseFloat(rating) + 0.1).toFixed(1) },
    { label: "W4", rating: rating }
  ];

  const weeklyOrdersTrend = [
    { label: "W1", orders: Math.floor(orders * 0.9) },
    { label: "W2", orders: Math.floor(orders * 1.1) },
    { label: "W3", orders: Math.floor(orders * 0.95) },
    { label: "W4", orders: orders }
  ];

  const monthlyOrdersTrend = [
    { label: "Jan", orders: Math.floor(orders * 3.8) },
    { label: "Feb", orders: Math.floor(orders * 4.0) },
    { label: "Mar", orders: Math.floor(orders * 4.2) },
    { label: "Apr", orders: Math.floor(orders * 4.1) },
    { label: "May", orders: Math.floor(orders * 4.4) },
    { label: "Jun", orders: Math.floor(orders * 4.5) }
  ];

  return {
    ordersHandled: orders,
    avgPrepTime: prepTime,
    customerRating: parseFloat(rating),
    inventoryAccuracy: invAcc,
    attendanceRate: attRate,
    trends: {
      daily: ordersTrend,
      weekly: weeklyOrdersTrend,
      monthly: monthlyOrdersTrend,
      rating: ratingTrend,
      accuracy: invAcc
    }
  };
};

export const getManagerAttendance = (mgrId) => {
  const seed = parseInt(mgrId.split("-")[1] || 1);
  const totalDays = 30;
  const lateCount = seed % 4;
  const leavesTaken = seed % 3;
  const absentCount = seed % 2 === 0 ? 1 : 0;
  const presentCount = totalDays - lateCount - leavesTaken - absentCount;
  const attendanceRate = ((presentCount + lateCount) / totalDays * 100).toFixed(1);

  // Generate day-by-day logs for the last 30 days
  const calendarLogs = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    let status = "Present";
    if (i % 9 === 0 && lateCount > 0 && calendarLogs.filter(l => l.status === "Late").length < lateCount) {
      status = "Late";
    } else if (i % 12 === 0 && leavesTaken > 0 && calendarLogs.filter(l => l.status === "Leave").length < leavesTaken) {
      status = "Leave";
    } else if (i === 15 && absentCount > 0) {
      status = "Absent";
    }

    calendarLogs.push({ date: dateStr, status });
  }

  return {
    attendanceRate: parseFloat(attendanceRate),
    lateCount,
    leavesTaken,
    absentCount,
    calendarLogs
  };
};

export const getManagerSalary = (mgrId, baseSalary) => {
  const seed = mgrId.split("-")[1] || 1;
  const bonus = seed % 2 === 0 ? 5000 : 3000;
  const deductions = seed % 3 === 0 ? 1500 : 500;
  const netSalary = baseSalary + bonus - deductions;

  const months = ["May 2026", "April 2026", "March 2026", "February 2026", "January 2026"];
  const salaryHistory = months.map((m, idx) => {
    const monthSeed = idx + parseInt(seed);
    const mBonus = monthSeed % 2 === 0 ? 4000 : 2000;
    const mDeductions = monthSeed % 3 === 0 ? 1000 : 0;
    return {
      month: m,
      baseSalary,
      bonus: mBonus,
      deduction: mDeductions,
      net: baseSalary + mBonus - mDeductions,
      status: "Paid"
    };
  });

  return {
    monthlySalary: baseSalary,
    bonus,
    deductions,
    netSalary,
    history: salaryHistory
  };
};

export const getManagerAuditLogs = (mgrId) => {
  const seed = mgrId.split("-")[1] || 1;
  return [
    { id: 1, action: "Login", details: "Logged in via Desktop app (IP: 192.168.1.104)", date: "Today, 09:15 AM", type: "system" },
    { id: 2, action: "Profile Update", details: "Updated emergency contact information", date: "Yesterday, 04:30 PM", type: "profile" },
    { id: 3, action: "Permission Changes", details: "Granted 'refund_approval' permission by Franchise Admin", date: "2026-06-15, 11:20 AM", type: "security" },
    { id: 4, action: "Store Assignment", details: `Assigned to Store #${seed} (Papa Veg Pizza - Indore Central)`, date: "2026-06-01, 10:00 AM", type: "assignment" },
    { id: 5, action: "Salary Changes", details: "Salary revision approved (+₹5,000 base revision)", date: "2026-05-28, 02:00 PM", type: "salary" },
    { id: 6, action: "Suspension", details: "Temporary warning suspension lifted by super admin", date: "2026-04-12, 09:00 AM", type: "status" }
  ];
};

export const getDashboardStats = (managersList) => {
  const total = managersList.length;
  const active = managersList.filter(m => m.status === "Active").length;
  const onLeave = managersList.filter(m => m.status === "On Leave").length;
  const suspended = managersList.filter(m => m.status === "Suspended").length;
  const avgRating = 4.7; // Hardcoded default, can be derived if needed
  const ordersManagedToday = 840;

  return {
    totalManagers: total,
    activeManagers: active,
    onLeaveManagers: onLeave,
    suspendedManagers: suspended,
    avgRating,
    ordersManagedToday
  };
};

export const initialKitchenStaff = [
  {
    id: "kit-1",
    name: "Rajesh Patel",
    email: "rajesh.patel@papaveg.com",
    phone: "9826011111",
    employeeCode: "PVK-101",
    joinedDate: "2023-01-10",
    status: "Active",
    experience: "3.5 years",
    storeId: "store-1",
    shiftType: "Morning",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    profileImage: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "22, Palasia Square, Indore, MP",
      emergencyContact: "Sudha Patel (Wife) - 9826011110",
      salary: 28000
    }
  },
  {
    id: "kit-2",
    name: "Amit Verma",
    email: "amit.verma@papaveg.com",
    phone: "9988111222",
    employeeCode: "PVK-102",
    joinedDate: "2022-05-15",
    status: "Active",
    experience: "4.2 years",
    storeId: "store-2",
    shiftType: "Afternoon",
    weeklyDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "102, MP Nagar, Bhopal, MP",
      emergencyContact: "K. Verma (Father) - 9988111220",
      salary: 31000
    }
  },
  {
    id: "kit-3",
    name: "Sunil Singh",
    email: "sunil.singh@papaveg.com",
    phone: "9111222333",
    employeeCode: "PVK-103",
    joinedDate: "2024-02-10",
    status: "Active",
    experience: "2.1 years",
    storeId: "store-3",
    shiftType: "Night",
    weeklyDays: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "15, Tower Chowk, Ujjain, MP",
      emergencyContact: "B. Singh (Brother) - 9111222330",
      salary: 25000
    }
  },
  {
    id: "kit-4",
    name: "Sanjay Gupta",
    email: "sanjay.g@papaveg.com",
    phone: "9893022233",
    employeeCode: "PVK-104",
    joinedDate: "2021-09-01",
    status: "Active",
    experience: "5.0 years",
    storeId: "store-4",
    shiftType: "Morning",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "DD Nagar, Gwalior, MP",
      emergencyContact: "Usha Gupta (Wife) - 9893022230",
      salary: 35000
    }
  },
  {
    id: "kit-5",
    name: "Priya Sharma",
    email: "priya.s@papaveg.com",
    phone: "9755044455",
    employeeCode: "PVK-105",
    joinedDate: "2023-07-20",
    status: "Active",
    experience: "2.8 years",
    storeId: "store-5",
    shiftType: "Afternoon",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Napier Town, Jabalpur, MP",
      emergencyContact: "M. Sharma (Husband) - 9755044450",
      salary: 27500
    }
  },
  {
    id: "kit-6",
    name: "Deepa Yadav",
    email: "deepa.y@papaveg.com",
    phone: "9926088899",
    employeeCode: "PVK-106",
    joinedDate: "2024-11-15",
    status: "Active",
    experience: "1.2 years",
    storeId: "store-6",
    shiftType: "Night",
    weeklyDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Scheme 74, Dewas, MP",
      emergencyContact: "S. Yadav (Father) - 9926088890",
      salary: 22000
    }
  },
  {
    id: "kit-7",
    name: "Manoj Trivedi",
    email: "manoj.t@papaveg.com",
    phone: "9826266677",
    employeeCode: "PVK-107",
    joinedDate: "2025-03-01",
    status: "On Leave",
    experience: "0.9 years",
    storeId: "store-7",
    shiftType: "Morning",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Pithampur Sec 1, Indore, MP",
      emergencyContact: "J. Trivedi (Brother) - 9826266670",
      salary: 20000
    }
  },
  {
    id: "kit-8",
    name: "Vikram Deshmukh",
    email: "vikram.d@papaveg.com",
    phone: "9977566677",
    employeeCode: "PVK-108",
    joinedDate: "2020-05-10",
    status: "Active",
    experience: "5.5 years",
    storeId: "store-8",
    shiftType: "Night",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Station Road, Ratlam, MP",
      emergencyContact: "R. Deshmukh (Wife) - 9977566670",
      salary: 36000
    }
  },
  {
    id: "kit-9",
    name: "Rohan Patil",
    email: "rohan.patil@papaveg.com",
    phone: "9893233344",
    employeeCode: "PVK-109",
    joinedDate: "2023-10-15",
    status: "Active",
    experience: "2.4 years",
    storeId: "store-9",
    shiftType: "Afternoon",
    weeklyDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Civil Lines, Sagar, MP",
      emergencyContact: "G. Patil (Father) - 9893233340",
      salary: 26000
    }
  },
  {
    id: "kit-10",
    name: "Kavita Rao",
    email: "kavita.rao@papaveg.com",
    phone: "9754122233",
    employeeCode: "PVK-110",
    joinedDate: "2022-08-20",
    status: "Active",
    experience: "3.8 years",
    storeId: "store-10",
    shiftType: "Morning",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "College Road, Rewa, MP",
      emergencyContact: "A. Rao (Brother) - 9754122230",
      salary: 29000
    }
  },
  {
    id: "kit-11",
    name: "Sunita Joshi",
    email: "sunita.j@papaveg.com",
    phone: "9926877788",
    employeeCode: "PVK-111",
    joinedDate: "2025-01-15",
    status: "Suspended",
    experience: "0.6 years",
    storeId: "store-1",
    shiftType: "Afternoon",
    weeklyDays: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "12, Scheme 54, Indore, MP",
      emergencyContact: "R. Joshi (Father) - 9926877780",
      salary: 19500
    }
  },
  {
    id: "kit-12",
    name: "Aarav Kumar",
    email: "aarav.k@papaveg.com",
    phone: "9826044455",
    employeeCode: "PVK-112",
    joinedDate: "2024-04-01",
    status: "Active",
    experience: "1.9 years",
    storeId: "store-3",
    shiftType: "Morning",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Freeganj, Ujjain, MP",
      emergencyContact: "S. Kumar (Father) - 9826044450",
      salary: 24000
    }
  },
  {
    id: "kit-13",
    name: "Sameer Malhotra",
    email: "sameer.m@papaveg.com",
    phone: "9879033344",
    employeeCode: "PVK-113",
    joinedDate: "2023-03-10",
    status: "Active",
    experience: "3.1 years",
    storeId: "store-4",
    shiftType: "Night",
    weeklyDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "DD Nagar, Gwalior, MP",
      emergencyContact: "N. Malhotra (Father) - 9879033340",
      salary: 28000
    }
  },
  {
    id: "kit-14",
    name: "Shalini Verma",
    email: "shalini.verma@papaveg.com",
    phone: "9988133344",
    employeeCode: "PVK-114",
    joinedDate: "2024-08-01",
    status: "Active",
    experience: "1.8 years",
    storeId: "store-5",
    shiftType: "Afternoon",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday", "Sunday"],
    profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Madan Mahal, Jabalpur, MP",
      emergencyContact: "R. Verma (Husband) - 9988133340",
      salary: 24500
    }
  },
  {
    id: "kit-15",
    name: "Neha Gupta",
    email: "neha.gupta@papaveg.com",
    phone: "9926133344",
    employeeCode: "PVK-115",
    joinedDate: "2022-12-10",
    status: "Active",
    experience: "3.4 years",
    storeId: "store-2",
    shiftType: "Morning",
    weeklyDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    profileImage: "https://images.unsplash.com/photo-1558203728-00f45181dd84?auto=format&fit=crop&q=80&w=150&fm=webp",
    personalDetails: {
      address: "Arera Colony, Bhopal, MP",
      emergencyContact: "M. Gupta (Husband) - 9926133340",
      salary: 28500
    }
  }
];

export const getKitchenPerformance = (staffId) => {
  const seed = parseInt(staffId.split("-")[1] || 1);
  const pizzas = 800 + seed * 80;
  const cookingTime = 8 + (seed % 5); // Average minutes to bake/prep a pizza
  const qualityScore = 92 + (seed % 7); // quality score %
  const cancelled = seed % 3;
  const attRate = 94 + (seed % 5);

  const dailyTrend = [
    { day: "Mon", pizzas: Math.floor(pizzas / 30) },
    { day: "Tue", pizzas: Math.floor(pizzas / 28) },
    { day: "Wed", pizzas: Math.floor(pizzas / 32) },
    { day: "Thu", pizzas: Math.floor(pizzas / 29) },
    { day: "Fri", pizzas: Math.floor(pizzas / 25) },
    { day: "Sat", pizzas: Math.floor(pizzas / 22) },
    { day: "Sun", pizzas: Math.floor(pizzas / 20) }
  ];

  const weeklyTrend = [
    { label: "W1", pizzas: Math.floor(pizzas / 4) },
    { label: "W2", pizzas: Math.floor(pizzas / 3.8) },
    { label: "W3", pizzas: Math.floor(pizzas / 4.2) },
    { label: "W4", pizzas: Math.floor(pizzas / 3.5) }
  ];

  const monthlyTrend = [
    { label: "Jan", pizzas: Math.floor(pizzas * 0.8) },
    { label: "Feb", pizzas: Math.floor(pizzas * 0.95) },
    { label: "Mar", pizzas: Math.floor(pizzas * 1.05) },
    { label: "Apr", pizzas: pizzas }
  ];

  const cookingTimeTrend = [
    { label: "W1", mins: cookingTime + 1.2 },
    { label: "W2", mins: cookingTime + 0.5 },
    { label: "W3", mins: cookingTime - 0.3 },
    { label: "W4", mins: cookingTime }
  ];

  return {
    pizzasPrepared: pizzas,
    avgCookingTime: cookingTime,
    qualityScore,
    cancelledOrders: cancelled,
    attendanceRate: attRate,
    trends: {
      daily: dailyTrend,
      weekly: weeklyTrend,
      monthly: monthlyTrend,
      cooking: cookingTimeTrend
    }
  };
};

export const getKitchenAttendance = (staffId) => {
  const seed = parseInt(staffId.split("-")[1] || 1);
  const totalDays = 30;
  const lateCount = seed % 3;
  const leavesTaken = seed % 2;
  const absentCount = seed % 4 === 0 ? 1 : 0;
  const presentCount = totalDays - lateCount - leavesTaken - absentCount;
  const attendanceRate = ((presentCount + lateCount) / totalDays * 100).toFixed(1);
  const overtimeHours = (seed % 3) * 5 + 4; // Simulated overtime hours

  const calendarLogs = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    let status = "Present";
    let checkIn = "09:00 AM";
    let checkOut = "06:00 PM";
    let ot = 0;

    if (i % 8 === 0 && lateCount > 0 && calendarLogs.filter(l => l.status === "Late").length < lateCount) {
      status = "Late";
      checkIn = "09:35 AM";
    } else if (i % 11 === 0 && leavesTaken > 0 && calendarLogs.filter(l => l.status === "Leave").length < leavesTaken) {
      status = "Leave";
      checkIn = "-";
      checkOut = "-";
    } else if (i === 12 && absentCount > 0) {
      status = "Absent";
      checkIn = "-";
      checkOut = "-";
    } else if (i % 5 === 0) {
      ot = 2; // 2 hours overtime
      checkOut = "08:00 PM";
    }

    calendarLogs.push({
      date: dateStr,
      status,
      checkIn,
      checkOut,
      overtimeHours: ot
    });
  }

  return {
    attendanceRate: parseFloat(attendanceRate),
    workingDays: presentCount + lateCount,
    lateCount,
    leavesTaken,
    absentCount,
    overtimeHours,
    calendarLogs
  };
};

export const getKitchenShifts = (staffId, defaultShift = "Morning") => {
  const seed = parseInt(staffId.split("-")[1] || 1);
  const shiftsMap = {
    Morning: { type: "Morning", start: "08:00 AM", end: "04:00 PM" },
    Afternoon: { type: "Afternoon", start: "04:00 PM", end: "12:00 AM" },
    Night: { type: "Night", start: "12:00 AM", end: "08:00 AM" }
  };

  const current = shiftsMap[defaultShift] || shiftsMap.Morning;
  
  const history = [
    { period: "June 2026 - Present", shiftType: current.type, storeCode: "PVP-IND-01", status: "Active" },
    { period: "Jan 2026 - May 2026", shiftType: current.type === "Morning" ? "Afternoon" : "Morning", storeCode: "PVP-IND-01", status: "Completed" }
  ];

  return {
    current,
    history
  };
};

export const getKitchenSalary = (staffId, baseSalary) => {
  const seed = parseInt(staffId.split("-")[1] || 1);
  const bonus = seed % 2 === 0 ? 3000 : 1500;
  const deductions = seed % 3 === 0 ? 1000 : 500;
  const netSalary = baseSalary + bonus - deductions;

  const months = ["May 2026", "April 2026", "March 2026", "February 2026", "January 2026"];
  const salaryHistory = months.map((m, idx) => {
    const monthSeed = idx + seed;
    const mBonus = monthSeed % 2 === 0 ? 2500 : 1000;
    const mDeductions = monthSeed % 3 === 0 ? 500 : 0;
    return {
      month: m,
      baseSalary,
      bonus: mBonus,
      deduction: mDeductions,
      net: baseSalary + mBonus - mDeductions,
      status: "Paid"
    };
  });

  return {
    monthlySalary: baseSalary,
    bonus,
    deductions,
    netSalary,
    history: salaryHistory
  };
};

export const getKitchenAuditLogs = (staffId) => {
  const seed = parseInt(staffId.split("-")[1] || 1);
  return [
    { id: 1, action: "Shift Changed", details: "Relocated to Afternoon Shift for operational pizza loads", date: "Today, 10:30 AM", type: "shift" },
    { id: 2, action: "Profile Updated", details: "Updated emergency contact and residential address details", date: "Yesterday, 02:45 PM", type: "profile" },
    { id: 3, action: "Attendance Edited", details: "Manually matched check-out time adjustment (Approved by Store Manager)", date: "2026-06-15, 06:10 PM", type: "attendance" },
    { id: 4, action: "Performance Updated", details: "Monthly review rating scored 94/100 by kitchen lead", date: "2026-06-01, 12:00 PM", type: "performance" },
    { id: 5, action: "Login History", details: "Logged into Kitchen Display System (Terminal ID: KDS-02)", date: "2026-06-01, 07:55 AM", type: "system" }
  ];
};

export const getKitchenDashboardStats = (staffList) => {
  const total = staffList.length;
  const active = staffList.filter((m) => m.status === "Active").length;
  const onShift = staffList.filter((m) => m.status === "Active" && m.shiftType === "Morning").length; // Mock count
  const avgCookingTime = 11.4; // mins
  const pizzasPreparedToday = 240;
  const attendancePercentage = 95.8;

  return {
    totalStaff: total,
    activeStaff: active,
    onShift,
    avgCookingTime,
    pizzasPreparedToday,
    attendancePercentage
  };
};

export const initialDeliveryPartners = [
  {
    id: "rider-1",
    name: "Rahul Verma",
    email: "rahul.verma@papaveg.com",
    phone: "9826022211",
    employeeCode: "PVR-201",
    joinedDate: "2024-03-10",
    status: "Online",
    availability: "Available",
    experience: "1.5 years",
    storeId: "store-1",
    vehicleType: "Bike",
    vehicleNumber: "MP-09-AB-1234",
    licenseNumber: "DL-092024001234",
    profileImage: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.8,
    ordersToday: 12,
    personalDetails: {
      address: "45, Vijay Nagar, Indore, MP",
      emergencyContact: "Suman Verma (Mother) - 9826022210",
      salary: 18000,
      salaryType: "Commission",
      commissionRate: 15,
      aadhaarNumber: "1234 5678 9012",
      panNumber: "ABCDE1234F",
      bankDetails: {
        bankName: "State Bank of India",
        accountNo: "10002345678",
        ifscCode: "SBIN0003043"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-2",
    name: "Sandeep Singh",
    email: "sandeep.singh@papaveg.com",
    phone: "9926011122",
    employeeCode: "PVR-202",
    joinedDate: "2023-11-15",
    status: "Busy",
    availability: "Available",
    experience: "2.1 years",
    storeId: "store-2",
    vehicleType: "Scooter",
    vehicleNumber: "MP-04-CD-5678",
    licenseNumber: "DL-042023005678",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.6,
    ordersToday: 9,
    personalDetails: {
      address: "102, MP Nagar, Bhopal, MP",
      emergencyContact: "G. Singh (Father) - 9926011120",
      salary: 19000,
      salaryType: "Salary",
      commissionRate: 10,
      aadhaarNumber: "2345 6789 0123",
      panNumber: "BCDEF2345G",
      bankDetails: {
        bankName: "HDFC Bank",
        accountNo: "20003456789",
        ifscCode: "HDFC0000102"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Pending",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-3",
    name: "Deepak Joshi",
    email: "deepak.joshi@papaveg.com",
    phone: "9111222444",
    employeeCode: "PVR-203",
    joinedDate: "2025-01-20",
    status: "Offline",
    availability: "Unavailable",
    experience: "0.5 years",
    storeId: "store-3",
    vehicleType: "Cycle",
    vehicleNumber: "N/A - Bicycle",
    licenseNumber: "N/A",
    profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.2,
    ordersToday: 0,
    personalDetails: {
      address: "12, Mahakal Marg, Ujjain, MP",
      emergencyContact: "Ramesh Joshi (Father) - 9111222440",
      salary: 14000,
      salaryType: "Salary",
      commissionRate: 5,
      aadhaarNumber: "3456 7890 1234",
      panNumber: "CDEFG3456H",
      bankDetails: {
        bankName: "Bank of Baroda",
        accountNo: "30004567890",
        ifscCode: "BARB0UJJAXX"
      }
    },
    documents: {
      drivingLicense: "N/A",
      vehicleRC: "N/A",
      insurance: "N/A",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-4",
    name: "Amit Yadav",
    email: "amit.yadav@papaveg.com",
    phone: "9893055566",
    employeeCode: "PVR-204",
    joinedDate: "2022-08-01",
    status: "Online",
    availability: "Available",
    experience: "3.2 years",
    storeId: "store-4",
    vehicleType: "Car",
    vehicleNumber: "MP-07-EF-9012",
    licenseNumber: "DL-072022009012",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.9,
    ordersToday: 15,
    personalDetails: {
      address: "Plot 88, DD Nagar, Gwalior, MP",
      emergencyContact: "Sunita Yadav (Wife) - 9893055560",
      salary: 22000,
      salaryType: "Commission",
      commissionRate: 18,
      aadhaarNumber: "4567 8901 2345",
      panNumber: "DEFGH4567I",
      bankDetails: {
        bankName: "ICICI Bank",
        accountNo: "40005678901",
        ifscCode: "ICIC0000021"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-5",
    name: "Rohit Patel",
    email: "rohit.patel@papaveg.com",
    phone: "9755011100",
    employeeCode: "PVR-205",
    joinedDate: "2024-05-10",
    status: "Suspended",
    availability: "Unavailable",
    experience: "2.0 years",
    storeId: "store-5",
    vehicleType: "Bike",
    vehicleNumber: "MP-20-GH-3456",
    licenseNumber: "DL-202024003456",
    profileImage: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 3.8,
    ordersToday: 0,
    personalDetails: {
      address: "15, Napier Town, Jabalpur, MP",
      emergencyContact: "T. Patel (Brother) - 9755011109",
      salary: 17500,
      salaryType: "Salary",
      commissionRate: 10,
      aadhaarNumber: "5678 9012 3456",
      panNumber: "EFGHI5678J",
      bankDetails: {
        bankName: "Axis Bank",
        accountNo: "50006789012",
        ifscCode: "UTIB0000125"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Rejected",
      insurance: "Expired",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Pending"
    }
  },
  {
    id: "rider-6",
    name: "Sunita Raj",
    email: "sunita.raj@papaveg.com",
    phone: "9926077788",
    employeeCode: "PVR-206",
    joinedDate: "2023-05-20",
    status: "Online",
    availability: "Available",
    experience: "2.8 years",
    storeId: "store-1",
    vehicleType: "Scooter",
    vehicleNumber: "MP-09-JK-7890",
    licenseNumber: "DL-092023007890",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.7,
    ordersToday: 11,
    personalDetails: {
      address: "88, Palasia Square, Indore, MP",
      emergencyContact: "Amit Raj (Husband) - 9926077780",
      salary: 19500,
      salaryType: "Commission",
      commissionRate: 14,
      aadhaarNumber: "6789 0123 4567",
      panNumber: "FGHIJ6789K",
      bankDetails: {
        bankName: "Punjab National Bank",
        accountNo: "60007890123",
        ifscCode: "PUNB0024400"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-7",
    name: "Pooja Sharma",
    email: "pooja.sharma@papaveg.com",
    phone: "9826088899",
    employeeCode: "PVR-207",
    joinedDate: "2024-10-01",
    status: "Busy",
    availability: "Available",
    experience: "1.0 years",
    storeId: "store-2",
    vehicleType: "Cycle",
    vehicleNumber: "N/A - Bicycle",
    licenseNumber: "N/A",
    profileImage: "https://images.unsplash.com/photo-1558203728-00f45181dd84?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.5,
    ordersToday: 8,
    personalDetails: {
      address: "56, Arera Colony, Bhopal, MP",
      emergencyContact: "M. Sharma (Father) - 9826088890",
      salary: 13000,
      salaryType: "Salary",
      commissionRate: 8,
      aadhaarNumber: "7890 1234 5678",
      panNumber: "GHIJK7890L",
      bankDetails: {
        bankName: "State Bank of India",
        accountNo: "70008901234",
        ifscCode: "SBIN0005012"
      }
    },
    documents: {
      drivingLicense: "N/A",
      vehicleRC: "N/A",
      insurance: "N/A",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-8",
    name: "Vikas Mishra",
    email: "vikas.mishra@papaveg.com",
    phone: "9111333777",
    employeeCode: "PVR-208",
    joinedDate: "2023-01-10",
    status: "Online",
    availability: "Available",
    experience: "3.5 years",
    storeId: "store-3",
    vehicleType: "Bike",
    vehicleNumber: "MP-13-LM-4567",
    licenseNumber: "DL-132023004567",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.8,
    ordersToday: 13,
    personalDetails: {
      address: "24, Nanakheda, Ujjain, MP",
      emergencyContact: "Usha Mishra (Wife) - 9111333770",
      salary: 21000,
      salaryType: "Commission",
      commissionRate: 16,
      aadhaarNumber: "8901 2345 6789",
      panNumber: "HIJKL8901M",
      bankDetails: {
        bankName: "HDFC Bank",
        accountNo: "80009012345",
        ifscCode: "HDFC0000045"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-9",
    name: "Manish Gupta",
    email: "manish.gupta@papaveg.com",
    phone: "9893044433",
    employeeCode: "PVR-209",
    joinedDate: "2024-02-15",
    status: "Offline",
    availability: "Unavailable",
    experience: "1.2 years",
    storeId: "store-4",
    vehicleType: "Scooter",
    vehicleNumber: "MP-07-NP-2345",
    licenseNumber: "DL-072024002345",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.4,
    ordersToday: 0,
    personalDetails: {
      address: "G-10, DD Nagar, Gwalior, MP",
      emergencyContact: "S. Gupta (Mother) - 9893044430",
      salary: 17000,
      salaryType: "Salary",
      commissionRate: 10,
      aadhaarNumber: "9012 3456 7890",
      panNumber: "IJKLM9012N",
      bankDetails: {
        bankName: "ICICI Bank",
        accountNo: "90000123456",
        ifscCode: "ICIC0000045"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Pending",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-10",
    name: "Sanjay Rawat",
    email: "sanjay.rawat@papaveg.com",
    phone: "9755033322",
    employeeCode: "PVR-210",
    joinedDate: "2022-11-20",
    status: "Online",
    availability: "Available",
    experience: "3.8 years",
    storeId: "store-5",
    vehicleType: "Bike",
    vehicleNumber: "MP-20-PQ-8901",
    licenseNumber: "DL-202022008901",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.9,
    ordersToday: 16,
    personalDetails: {
      address: "105, Napier Town, Jabalpur, MP",
      emergencyContact: "A. Rawat (Brother) - 9755033320",
      salary: 23000,
      salaryType: "Commission",
      commissionRate: 17,
      aadhaarNumber: "0123 4567 8901",
      panNumber: "JKLMN0123O",
      bankDetails: {
        bankName: "Axis Bank",
        accountNo: "10001234567",
        ifscCode: "UTIB0000125"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-11",
    name: "Rajesh Sen",
    email: "rajesh.sen@papaveg.com",
    phone: "9826044433",
    employeeCode: "PVR-211",
    joinedDate: "2023-08-15",
    status: "Busy",
    availability: "Available",
    experience: "2.5 years",
    storeId: "store-1",
    vehicleType: "Bike",
    vehicleNumber: "MP-09-RS-4567",
    licenseNumber: "DL-092023004567",
    profileImage: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.5,
    ordersToday: 10,
    personalDetails: {
      address: "A-24, Sukhliya, Indore, MP",
      emergencyContact: "Jyoti Sen (Wife) - 9826044430",
      salary: 19000,
      salaryType: "Commission",
      commissionRate: 15,
      aadhaarNumber: "1234 0987 5678",
      panNumber: "KLMNO1234P",
      bankDetails: {
        bankName: "Union Bank of India",
        accountNo: "11002345678",
        ifscCode: "UBIN0530433"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-12",
    name: "Manoj Sharma",
    email: "manoj.sharma@papaveg.com",
    phone: "9926055566",
    employeeCode: "PVR-212",
    joinedDate: "2024-04-10",
    status: "Online",
    availability: "Available",
    experience: "1.8 years",
    storeId: "store-2",
    vehicleType: "Scooter",
    vehicleNumber: "MP-04-TV-8901",
    licenseNumber: "DL-042024008901",
    profileImage: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.7,
    ordersToday: 12,
    personalDetails: {
      address: "Arera Colony, Bhopal, MP",
      emergencyContact: "K. Sharma (Father) - 9926055560",
      salary: 18500,
      salaryType: "Salary",
      commissionRate: 12,
      aadhaarNumber: "2345 0987 6789",
      panNumber: "LMNOP2345Q",
      bankDetails: {
        bankName: "HDFC Bank",
        accountNo: "12003456789",
        ifscCode: "HDFC0000102"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-13",
    name: "Vijay Dube",
    email: "vijay.dube@papaveg.com",
    phone: "9111444888",
    employeeCode: "PVR-213",
    joinedDate: "2022-05-10",
    status: "Online",
    availability: "Available",
    experience: "4.0 years",
    storeId: "store-3",
    vehicleType: "Car",
    vehicleNumber: "MP-13-WX-5678",
    licenseNumber: "DL-132022005678",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.8,
    ordersToday: 14,
    personalDetails: {
      address: "10, Tower Chowk, Ujjain, MP",
      emergencyContact: "S. Dube (Mother) - 9111444880",
      salary: 24000,
      salaryType: "Commission",
      commissionRate: 18,
      aadhaarNumber: "3456 0987 7890",
      panNumber: "MNOPQ3456R",
      bankDetails: {
        bankName: "Bank of India",
        accountNo: "13004567890",
        ifscCode: "BKID0003301"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-14",
    name: "Sunil Prasad",
    email: "sunil.prasad@papaveg.com",
    phone: "9893088877",
    employeeCode: "PVR-214",
    joinedDate: "2024-09-01",
    status: "Offline",
    availability: "Unavailable",
    experience: "1.1 years",
    storeId: "store-4",
    vehicleType: "Bike",
    vehicleNumber: "MP-07-YZ-1234",
    licenseNumber: "DL-072024001234",
    profileImage: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.3,
    ordersToday: 0,
    personalDetails: {
      address: "DD Nagar, Gwalior, MP",
      emergencyContact: "J. Prasad (Father) - 9893088870",
      salary: 16500,
      salaryType: "Salary",
      commissionRate: 10,
      aadhaarNumber: "4567 0987 8901",
      panNumber: "NOPQR4567S",
      bankDetails: {
        bankName: "ICICI Bank",
        accountNo: "14005678901",
        ifscCode: "ICIC0000021"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Pending",
      insurance: "Expired",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  },
  {
    id: "rider-15",
    name: "Ajay Nair",
    email: "ajay.nair@papaveg.com",
    phone: "9755088899",
    employeeCode: "PVR-215",
    joinedDate: "2023-10-15",
    status: "Online",
    availability: "Available",
    experience: "2.6 years",
    storeId: "store-5",
    vehicleType: "Scooter",
    vehicleNumber: "MP-20-AB-9012",
    licenseNumber: "DL-202023009012",
    profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&fm=webp",
    rating: 4.7,
    ordersToday: 13,
    personalDetails: {
      address: "Napier Town, Jabalpur, MP",
      emergencyContact: "G. Nair (Father) - 9755088890",
      salary: 19000,
      salaryType: "Commission",
      commissionRate: 14,
      aadhaarNumber: "5678 0987 9012",
      panNumber: "OPQRS5678T",
      bankDetails: {
        bankName: "HDFC Bank",
        accountNo: "15006789012",
        ifscCode: "HDFC0000125"
      }
    },
    documents: {
      drivingLicense: "Verified",
      vehicleRC: "Verified",
      insurance: "Verified",
      aadhaar: "Verified",
      panCard: "Verified",
      bankProof: "Verified"
    }
  }
];

export const getDeliveryPartnerPerformance = (riderId) => {
  const seed = parseInt(riderId.split("-")[1] || 1);
  const totalD = 180 + seed * 25;
  const avgTime = 22 + (seed % 6);
  const distance = 400 + seed * 50;
  const rating = (4.0 + (seed % 9) * 0.1).toFixed(1);
  const cancelRate = seed % 4;
  const earnings = totalD * 40;

  const dailyTrend = [
    { day: "Mon", deliveries: Math.floor(totalD / 30) },
    { day: "Tue", deliveries: Math.floor(totalD / 28) },
    { day: "Wed", deliveries: Math.floor(totalD / 32) },
    { day: "Thu", deliveries: Math.floor(totalD / 29) },
    { day: "Fri", deliveries: Math.floor(totalD / 25) },
    { day: "Sat", deliveries: Math.floor(totalD / 22) },
    { day: "Sun", deliveries: Math.floor(totalD / 20) }
  ];

  const weeklyTrend = [
    { label: "W1", deliveries: Math.floor(totalD / 4) },
    { label: "W2", deliveries: Math.floor(totalD / 3.8) },
    { label: "W3", deliveries: Math.floor(totalD / 4.2) },
    { label: "W4", deliveries: Math.floor(totalD / 3.5) }
  ];

  const monthlyTrend = [
    { label: "Jan", deliveries: Math.floor(totalD * 0.8) },
    { label: "Feb", deliveries: Math.floor(totalD * 0.9) },
    { label: "Mar", deliveries: Math.floor(totalD * 1.05) },
    { label: "Apr", deliveries: totalD }
  ];

  const ratingTrend = [
    { label: "W1", rating: parseFloat(rating) - 0.2 },
    { label: "W2", rating: parseFloat(rating) + 0.1 },
    { label: "W3", rating: parseFloat(rating) - 0.1 },
    { label: "W4", rating: parseFloat(rating) }
  ];

  return {
    totalDeliveries: totalD,
    avgDeliveryTime: avgTime,
    distanceCovered: distance,
    avgRating: parseFloat(rating),
    cancellationRate: cancelRate,
    earnings,
    trends: {
      daily: dailyTrend,
      weekly: weeklyTrend,
      monthly: monthlyTrend,
      rating: ratingTrend
    }
  };
};

export const getDeliveryPartnerAttendance = (riderId) => {
  const seed = parseInt(riderId.split("-")[1] || 1);
  const totalDays = 30;
  const lateCount = seed % 3;
  const leavesTaken = seed % 2;
  const absentCount = seed % 4 === 0 ? 1 : 0;
  const presentCount = totalDays - lateCount - leavesTaken - absentCount;
  const attendanceRate = ((presentCount + lateCount) / totalDays * 100).toFixed(1);
  const workingHours = (presentCount + lateCount) * 8;
  const overtimeHours = (seed % 3) * 6;

  const calendarLogs = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    let status = "Present";
    let checkIn = "10:00 AM";
    let checkOut = "06:00 PM";
    
    if (i % 8 === 0 && lateCount > 0 && calendarLogs.filter(l => l.status === "Late").length < lateCount) {
      status = "Late";
      checkIn = "10:45 AM";
    } else if (i % 11 === 0 && leavesTaken > 0 && calendarLogs.filter(l => l.status === "Leave").length < leavesTaken) {
      status = "Leave";
      checkIn = "-";
      checkOut = "-";
    } else if (i === 14 && absentCount > 0) {
      status = "Absent";
      checkIn = "-";
      checkOut = "-";
    }

    calendarLogs.push({
      date: dateStr,
      status,
      checkIn,
      checkOut,
      workingHours: status === "Present" || status === "Late" ? 8 : 0
    });
  }

  return {
    attendanceRate: parseFloat(attendanceRate),
    workingDays: presentCount + lateCount,
    lateCount,
    leavesTaken,
    absentCount,
    hoursWorked: workingHours,
    overtimeHours,
    calendarLogs
  };
};

export const getDeliveryPartnerWallet = (riderId) => {
  const seed = parseInt(riderId.split("-")[1] || 1);
  const balance = 1200 + seed * 200;
  const todayEarnings = 450 + seed * 50;
  const weeklyEarnings = todayEarnings * 6;
  const monthlyEarnings = weeklyEarnings * 4;
  const bonuses = seed % 2 === 0 ? 1000 : 500;
  const penalties = seed % 3 === 0 ? 200 : 0;
  const withdrawals = seed * 1200;

  const transactions = [
    { id: `TX-${seed}01`, date: "Today, 04:30 PM", type: "Order Payout", amount: 45, refId: "ORD-9801", status: "Credited" },
    { id: `TX-${seed}02`, date: "Today, 02:10 PM", type: "Order Payout", amount: 60, refId: "ORD-9755", status: "Credited" },
    { id: `TX-${seed}03`, date: "Yesterday, 06:15 PM", type: "Weekly Bonus", amount: bonuses, refId: "BON-WK24", status: "Credited" },
    { id: `TX-${seed}04`, date: "2026-06-16", type: "Rider Withdrawal", amount: 1500, refId: "WD-11409", status: "Processed" },
    { id: `TX-${seed}05`, date: "2026-06-15", type: "Late Delivery Penalty", amount: penalties || 50, refId: "ORD-9411", status: "Debited" }
  ];

  return {
    balance,
    todayEarnings,
    weeklyEarnings,
    monthlyEarnings,
    bonuses,
    penalties,
    withdrawals,
    history: transactions
  };
};

export const getDeliveryPartnerLiveTracking = (riderId) => {
  const seed = parseInt(riderId.split("-")[1] || 1);
  const battery = 88 - (seed * 3) % 20;
  const network = battery > 75 ? "Excellent" : "Good";
  const speed = 25 + (seed % 3) * 5;
  const batteryStatus = battery > 20 ? "Normal" : "Low";

  const locations = [
    { lat: 22.7196, lng: 75.8577, desc: "Indore Central Store" },
    { lat: 22.7253, lng: 75.8654, desc: "Palasia Junction" },
    { lat: 22.7301, lng: 75.8798, desc: "Saket Square" },
    { lat: 22.7412, lng: 75.8955, desc: "Vijay Nagar Crossing" },
    { lat: 22.7523, lng: 75.9088, desc: "LIG Square Delivery Point" }
  ];

  const currentIdx = seed % locations.length;
  const currentPos = locations[currentIdx];
  const destPos = locations[(currentIdx + 1) % locations.length];

  return {
    lat: currentPos.lat,
    lng: currentPos.lng,
    eta: `${10 + (seed % 4) * 3} mins`,
    speed: `${speed} km/h`,
    battery,
    networkStatus: network,
    batteryStatus,
    distanceRemaining: `${(1.2 + (seed % 3) * 0.8).toFixed(1)} km`,
    lastUpdated: "Just now",
    currentOrder: {
      orderNumber: `ORD-980${seed}`,
      customerName: ["Aman Gupta", "Rahul Dev", "Rohan Mehta", "Gaurav Sen", "Priya Jain"][seed % 5],
      destination: destPos.desc,
      estTime: `${15 + (seed % 3) * 5} mins`
    },
    routePath: locations
  };
};

export const getDeliveryPartnerSalary = (riderId, baseSalary) => {
  const seed = parseInt(riderId.split("-")[1] || 1);
  const commission = 3500 + seed * 300;
  const bonus = seed % 2 === 0 ? 1500 : 500;
  const deductions = seed % 3 === 0 ? 500 : 0;
  const netSalary = baseSalary + commission + bonus - deductions;

  const months = ["May 2026", "April 2026", "March 2026", "February 2026", "January 2026"];
  const salaryHistory = months.map((m, idx) => {
    const monthSeed = idx + seed;
    const mComm = 3000 + monthSeed * 250;
    const mBonus = monthSeed % 2 === 0 ? 1000 : 400;
    const mDeductions = monthSeed % 3 === 0 ? 300 : 0;
    return {
      month: m,
      baseSalary,
      commission: mComm,
      bonus: mBonus,
      deduction: mDeductions,
      net: baseSalary + mComm + mBonus - mDeductions,
      status: "Paid"
    };
  });

  return {
    monthlySalary: baseSalary,
    commission,
    bonus,
    deductions,
    netSalary,
    history: salaryHistory
  };
};

export const getDeliveryPartnerAuditLogs = (riderId) => {
  return [
    { id: 1, action: "Profile Updated", details: "Updated emergency contact and residential address details", date: "Today, 11:30 AM", type: "profile" },
    { id: 2, action: "Document Uploaded", details: "Uploaded renewed Vehicle Insurance policy copy", date: "Yesterday, 04:15 PM", type: "document" },
    { id: 3, action: "Wallet Updated", details: "Credited Weekly Performance Bonus of ₹500", date: "2026-06-16, 06:00 PM", type: "wallet" },
    { id: 4, action: "Status Changed", details: "Switched status to Online (Available)", date: "2026-06-15, 09:00 AM", type: "status" },
    { id: 5, action: "Login Activity", details: "Logged into Rider Mobile App (v2.4.1, Android 13)", date: "2026-06-15, 08:58 AM", type: "system" }
  ];
};

export const getDeliveryPartnerDashboardStats = (riderList) => {
  const total = riderList.length;
  const online = riderList.filter(r => r.status === "Online").length;
  const busy = riderList.filter(r => r.status === "Busy").length;
  const delivered = 145 + riderList.length * 4;
  const avgTime = 24.5;
  const avgRating = 4.7;
  const todayEarnings = 8400 + riderList.length * 150;
  const cancelled = 3;

  return {
    totalRiders: total,
    onlineRiders: online,
    busyRiders: busy,
    deliveredToday: delivered,
    avgDeliveryTime: avgTime,
    avgRating,
    todayEarnings,
    cancelledDeliveries: cancelled
  };
};
