export const initialMockStaff = [
  {
    _id: "staff-1",
    storeId: "store-indore-01",
    userId: "user-1",
    fullName: "Rohan Sharma",
    email: "rohan.sharma@papaveg.com",
    phone: "9876543210",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
    role: "Kitchen Supervisor",
    employeeCode: "PVP-KS-001",
    joiningDate: "2024-03-15",
    shiftId: "Morning", // Morning, Afternoon, Night
    salaryType: "Monthly",
    salary: 45000,
    experience: 5,
    skills: ["Pizza", "Dough Preparation", "Inventory", "Kitchen Management"],
    emergencyContact: "Neha Sharma (Wife) - 9876543211",
    status: "active",
    todayStatus: "present", // present, leave, absent, late
    performanceScore: 94,
    createdAt: "2024-03-15T09:00:00.000Z",
    stats: {
      ordersCompleted: 1420,
      avgPrepTime: 12, // in minutes
      delayedOrders: 15,
      attendance: 98 // in percent
    },
    activities: [
      { id: "act-1-1", type: "Shift Changes", title: "Shift changed to Morning", time: "2 days ago", status: "completed" },
      { id: "act-1-2", type: "Recent Performance Updates", title: "Performance rating updated to 94%", time: "3 days ago", status: "completed" },
      { id: "act-1-3", type: "Completed Orders", title: "Prepared 45 Veg Supreme Pizzas", time: "4 days ago", status: "completed" }
    ]
  },
  {
    _id: "staff-2",
    storeId: "store-indore-01",
    userId: "user-2",
    fullName: "Priya Patel",
    email: "priya.patel@papaveg.com",
    phone: "9123456789",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    role: "Pizza Maker",
    employeeCode: "PVP-PM-002",
    joiningDate: "2024-05-10",
    shiftId: "Afternoon",
    salaryType: "Monthly",
    salary: 32000,
    experience: 3,
    skills: ["Pizza", "Dough Preparation", "Cleaning"],
    emergencyContact: "Rajesh Patel (Father) - 9123456780",
    status: "active",
    todayStatus: "present",
    performanceScore: 89,
    createdAt: "2024-05-10T10:00:00.000Z",
    stats: {
      ordersCompleted: 980,
      avgPrepTime: 14,
      delayedOrders: 28,
      attendance: 94
    },
    activities: [
      { id: "act-2-1", type: "Completed Orders", title: "Prepared 32 Paneer Tikka Pizzas", time: "1 day ago", status: "completed" },
      { id: "act-2-2", type: "Attendance Logs", title: "Marked Late (Delayed by 15 mins)", time: "Yesterday", status: "warning" }
    ]
  },
  {
    _id: "staff-3",
    storeId: "store-indore-01",
    userId: "user-3",
    fullName: "Amit Verma",
    email: "amit.verma@papaveg.com",
    phone: "9876123450",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
    role: "Baker",
    employeeCode: "PVP-BK-003",
    joiningDate: "2024-06-01",
    shiftId: "Night",
    salaryType: "Hourly",
    salary: 150, // hourly
    experience: 2,
    skills: ["Baking", "Inventory"],
    emergencyContact: "Suman Verma (Mother) - 9876123451",
    status: "active",
    todayStatus: "leave",
    performanceScore: 91,
    createdAt: "2024-06-01T14:00:00.000Z",
    stats: {
      ordersCompleted: 750,
      avgPrepTime: 10,
      delayedOrders: 8,
      attendance: 96
    },
    activities: [
      { id: "act-3-1", type: "Attendance Logs", title: "Applied for Casual Leave", time: "Today", status: "info" },
      { id: "act-3-2", type: "Recent Performance Updates", title: "Baking efficiency score raised to 91%", time: "5 days ago", status: "completed" }
    ]
  },
  {
    _id: "staff-4",
    storeId: "store-indore-01",
    userId: "user-4",
    fullName: "Karan Singh",
    email: "karan.singh@papaveg.com",
    phone: "9988776655",
    profileImage: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=100",
    role: "Packager",
    employeeCode: "PVP-PK-004",
    joiningDate: "2024-07-20",
    shiftId: "Afternoon",
    salaryType: "Hourly",
    salary: 120,
    experience: 1,
    skills: ["Packaging", "Cleaning"],
    emergencyContact: "Gurnam Singh (Father) - 9988776650",
    status: "active",
    todayStatus: "absent",
    performanceScore: 85,
    createdAt: "2024-07-20T08:30:00.000Z",
    stats: {
      ordersCompleted: 1100,
      avgPrepTime: 6,
      delayedOrders: 10,
      attendance: 90
    },
    activities: [
      { id: "act-4-1", type: "Attendance Logs", title: "Marked Absent without prior notice", time: "Today", status: "severe" },
      { id: "act-4-2", type: "Completed Orders", title: "Packed 120 Delivery Orders", time: "2 days ago", status: "completed" }
    ]
  },
  {
    _id: "staff-5",
    storeId: "store-indore-01",
    userId: "user-5",
    fullName: "Sunita Rao",
    email: "sunita.rao@papaveg.com",
    phone: "9876541230",
    profileImage: "", // Empty for testing fallback avatar
    role: "Pizza Maker",
    employeeCode: "PVP-PM-005",
    joiningDate: "2024-08-15",
    shiftId: "Morning",
    salaryType: "Monthly",
    salary: 31000,
    experience: 4,
    skills: ["Pizza", "Dough Preparation", "Packaging"],
    emergencyContact: "Anand Rao (Husband) - 9876541231",
    status: "inactive",
    todayStatus: "absent",
    performanceScore: 88,
    createdAt: "2024-08-15T09:15:00.000Z",
    stats: {
      ordersCompleted: 540,
      avgPrepTime: 15,
      delayedOrders: 18,
      attendance: 92
    },
    activities: [
      { id: "act-5-1", type: "Shift Changes", title: "Shift changed to Morning", time: "1 week ago", status: "completed" },
      { id: "act-5-2", type: "Recent Performance Updates", title: "Profile deactivated by store manager", time: "2 weeks ago", status: "info" }
    ]
  }
];

export const initialMockAttendance = [
  // Today's Attendance (2026-06-25)
  {
    _id: "att-today-1",
    storeId: "store-indore-01",
    staffId: "staff-1", // Rohan Sharma
    shiftId: "Morning",
    date: "2026-06-25",
    checkIn: "08:52 AM",
    checkOut: "06:15 PM",
    totalHours: 9.38,
    overtimeHours: 1.38,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "Completed prep work early",
    createdAt: "2026-06-25T08:52:00.000Z"
  },
  {
    _id: "att-today-2",
    storeId: "store-indore-01",
    staffId: "staff-2", // Priya Patel
    shiftId: "Afternoon",
    date: "2026-06-25",
    checkIn: "03:58 PM",
    checkOut: "", // Still working
    totalHours: 0,
    overtimeHours: 0,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "",
    createdAt: "2026-06-25T15:58:00.000Z"
  },
  {
    _id: "att-today-3",
    storeId: "store-indore-01",
    staffId: "staff-3", // Amit Verma
    shiftId: "Night",
    date: "2026-06-25",
    checkIn: "",
    checkOut: "",
    totalHours: 0,
    overtimeHours: 0,
    status: "leave",
    markedBy: "Shubham Jamliya",
    notes: "Applied for Casual Leave",
    createdAt: "2026-06-25T09:00:00.000Z"
  },
  {
    _id: "att-today-4",
    storeId: "store-indore-01",
    staffId: "staff-4", // Karan Singh
    shiftId: "Afternoon",
    date: "2026-06-25",
    checkIn: "",
    checkOut: "",
    totalHours: 0,
    overtimeHours: 0,
    status: "absent",
    markedBy: "Shubham Jamliya",
    notes: "No show, no prior notice",
    createdAt: "2026-06-25T17:00:00.000Z"
  },
  {
    _id: "att-today-5",
    storeId: "store-indore-01",
    staffId: "staff-5", // Sunita Rao
    shiftId: "Morning",
    date: "2026-06-25",
    checkIn: "",
    checkOut: "",
    totalHours: 0,
    overtimeHours: 0,
    status: "absent",
    markedBy: "Shubham Jamliya",
    notes: "Profile is inactive",
    createdAt: "2026-06-25T09:00:00.000Z"
  },

  // Yesterday's Attendance (2026-06-24)
  {
    _id: "att-yest-1",
    storeId: "store-indore-01",
    staffId: "staff-1",
    shiftId: "Morning",
    date: "2026-06-24",
    checkIn: "09:05 AM", // Late arrival
    checkOut: "05:00 PM",
    totalHours: 7.92,
    overtimeHours: 0,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "Delayed by traffic",
    createdAt: "2026-06-24T09:05:00.000Z"
  },
  {
    _id: "att-yest-2",
    storeId: "store-indore-01",
    staffId: "staff-2",
    shiftId: "Afternoon",
    date: "2026-06-24",
    checkIn: "03:55 PM",
    checkOut: "12:10 AM",
    totalHours: 8.25,
    overtimeHours: 0.25,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "Helped close the oven line",
    createdAt: "2026-06-24T15:55:00.000Z"
  },
  {
    _id: "att-yest-3",
    storeId: "store-indore-01",
    staffId: "staff-3",
    shiftId: "Night",
    date: "2026-06-24",
    checkIn: "11:00 PM",
    checkOut: "07:00 AM",
    totalHours: 8.0,
    overtimeHours: 0,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "",
    createdAt: "2026-06-24T23:00:00.000Z"
  },
  {
    _id: "att-yest-4",
    storeId: "store-indore-01",
    staffId: "staff-4",
    shiftId: "Afternoon",
    date: "2026-06-24",
    checkIn: "04:00 PM",
    checkOut: "08:00 PM",
    totalHours: 4.0,
    overtimeHours: 0,
    status: "half_day",
    markedBy: "Shubham Jamliya",
    notes: "Left early due to doctor appointment",
    createdAt: "2026-06-24T16:00:00.000Z"
  },
  {
    _id: "att-yest-5",
    storeId: "store-indore-01",
    staffId: "staff-5",
    shiftId: "Morning",
    date: "2026-06-24",
    checkIn: "",
    checkOut: "",
    totalHours: 0,
    overtimeHours: 0,
    status: "absent",
    markedBy: "Shubham Jamliya",
    notes: "",
    createdAt: "2026-06-24T09:00:00.000Z"
  },

  // 2026-06-23
  {
    _id: "att-23-1",
    storeId: "store-indore-01",
    staffId: "staff-1",
    shiftId: "Morning",
    date: "2026-06-23",
    checkIn: "08:50 AM",
    checkOut: "05:00 PM",
    totalHours: 8.16,
    overtimeHours: 0.16,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "",
    createdAt: "2026-06-23T08:50:00.000Z"
  },
  {
    _id: "att-23-2",
    storeId: "store-indore-01",
    staffId: "staff-2",
    shiftId: "Afternoon",
    date: "2026-06-23",
    checkIn: "03:57 PM",
    checkOut: "01:30 AM",
    totalHours: 9.55,
    overtimeHours: 1.55,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "Overtime for cleanup operations",
    createdAt: "2026-06-23T15:57:00.000Z"
  },
  {
    _id: "att-23-3",
    storeId: "store-indore-01",
    staffId: "staff-3",
    shiftId: "Night",
    date: "2026-06-23",
    checkIn: "10:55 PM",
    checkOut: "07:05 AM",
    totalHours: 8.16,
    overtimeHours: 0.16,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "",
    createdAt: "2026-06-23T22:55:00.000Z"
  },
  {
    _id: "att-23-4",
    storeId: "store-indore-01",
    staffId: "staff-4",
    shiftId: "Afternoon",
    date: "2026-06-23",
    checkIn: "04:00 PM",
    checkOut: "12:00 AM",
    totalHours: 8.0,
    overtimeHours: 0,
    status: "present",
    markedBy: "Shubham Jamliya",
    notes: "",
    createdAt: "2026-06-23T16:00:00.000Z"
  },
  {
    _id: "att-23-5",
    storeId: "store-indore-01",
    staffId: "staff-5",
    shiftId: "Morning",
    date: "2026-06-23",
    checkIn: "",
    checkOut: "",
    totalHours: 0,
    overtimeHours: 0,
    status: "absent",
    markedBy: "Shubham Jamliya",
    notes: "",
    createdAt: "2026-06-23T09:00:00.000Z"
  }
];

export const initialMockShifts = [
  {
    _id: "Morning",
    storeId: "store-indore-01",
    shiftName: "Morning Shift",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    breakMinutes: 30,
    maxStaff: 10,
    assignedStaff: ["staff-1", "staff-5"],
    status: "active",
    description: "Standard morning kitchen operations and ingredient prep shift.",
    createdBy: "Shubham Jamliya",
    createdAt: "2024-03-15T09:00:00.000Z"
  },
  {
    _id: "Afternoon",
    storeId: "store-indore-01",
    shiftName: "Afternoon Shift",
    startTime: "04:00 PM",
    endTime: "12:00 AM",
    breakMinutes: 45,
    maxStaff: 8,
    assignedStaff: ["staff-2", "staff-4"],
    status: "active",
    description: "Afternoon and evening peak pizza production and baking shift.",
    createdBy: "Shubham Jamliya",
    createdAt: "2024-03-15T09:00:00.000Z"
  },
  {
    _id: "Night",
    storeId: "store-indore-01",
    shiftName: "Night Shift",
    startTime: "11:00 PM",
    endTime: "07:00 AM",
    breakMinutes: 30,
    maxStaff: 5,
    assignedStaff: ["staff-3"],
    status: "active",
    description: "Late night operations, delivery dispatch, and kitchen sanitation.",
    createdBy: "Shubham Jamliya",
    createdAt: "2024-03-15T09:00:00.000Z"
  }
];

export const initialMockPerformance = [
  // MONTHLY
  {
    _id: "perf-m-1",
    storeId: "store-indore-01",
    staffId: "staff-1",
    period: "monthly",
    totalOrders: 152,
    avgPreparationTime: 8.5,
    delayedOrders: 3,
    attendancePercentage: 98,
    customerComplaints: 0,
    rating: 4.8,
    score: 95.2,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-m-2",
    storeId: "store-indore-01",
    staffId: "staff-2",
    period: "monthly",
    totalOrders: 120,
    avgPreparationTime: 6.2,
    delayedOrders: 1,
    attendancePercentage: 94,
    customerComplaints: 1,
    rating: 4.9,
    score: 93.6,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-m-3",
    storeId: "store-indore-01",
    staffId: "staff-3",
    period: "monthly",
    totalOrders: 98,
    avgPreparationTime: 9.8,
    delayedOrders: 4,
    attendancePercentage: 96,
    customerComplaints: 0,
    rating: 4.7,
    score: 91.0,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-m-4",
    storeId: "store-indore-01",
    staffId: "staff-4",
    period: "monthly",
    totalOrders: 140,
    avgPreparationTime: 7.0,
    delayedOrders: 12,
    attendancePercentage: 90,
    customerComplaints: 3,
    rating: 4.2,
    score: 83.5,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-m-5",
    storeId: "store-indore-01",
    staffId: "staff-5",
    period: "monthly",
    totalOrders: 110,
    avgPreparationTime: 8.0,
    delayedOrders: 2,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 4.6,
    score: 94.5,
    createdAt: "2026-06-25T00:00:00.000Z"
  },

  // WEEKLY
  {
    _id: "perf-w-1",
    storeId: "store-indore-01",
    staffId: "staff-1",
    period: "weekly",
    totalOrders: 38,
    avgPreparationTime: 8.2,
    delayedOrders: 1,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 4.9,
    score: 96.8,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-w-2",
    storeId: "store-indore-01",
    staffId: "staff-2",
    period: "weekly",
    totalOrders: 32,
    avgPreparationTime: 6.4,
    delayedOrders: 0,
    attendancePercentage: 92,
    customerComplaints: 0,
    rating: 4.8,
    score: 92.5,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-w-3",
    storeId: "store-indore-01",
    staffId: "staff-3",
    period: "weekly",
    totalOrders: 25,
    avgPreparationTime: 10.0,
    delayedOrders: 1,
    attendancePercentage: 96,
    customerComplaints: 0,
    rating: 4.6,
    score: 91.8,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-w-4",
    storeId: "store-indore-01",
    staffId: "staff-4",
    period: "weekly",
    totalOrders: 35,
    avgPreparationTime: 7.2,
    delayedOrders: 4,
    attendancePercentage: 85,
    customerComplaints: 1,
    rating: 4.0,
    score: 80.2,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-w-5",
    storeId: "store-indore-01",
    staffId: "staff-5",
    period: "weekly",
    totalOrders: 28,
    avgPreparationTime: 8.5,
    delayedOrders: 0,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 4.7,
    score: 95.0,
    createdAt: "2026-06-25T00:00:00.000Z"
  },

  // DAILY
  {
    _id: "perf-d-1",
    storeId: "store-indore-01",
    staffId: "staff-1",
    period: "daily",
    totalOrders: 6,
    avgPreparationTime: 7.8,
    delayedOrders: 0,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 5.0,
    score: 98.5,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-d-2",
    storeId: "store-indore-01",
    staffId: "staff-2",
    period: "daily",
    totalOrders: 8,
    avgPreparationTime: 5.9,
    delayedOrders: 0,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 4.9,
    score: 97.2,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-d-3",
    storeId: "store-indore-01",
    staffId: "staff-3",
    period: "daily",
    totalOrders: 4,
    avgPreparationTime: 10.2,
    delayedOrders: 0,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 4.5,
    score: 89.0,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-d-4",
    storeId: "store-indore-01",
    staffId: "staff-4",
    period: "daily",
    totalOrders: 7,
    avgPreparationTime: 6.8,
    delayedOrders: 1,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 4.2,
    score: 87.5,
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    _id: "perf-d-5",
    storeId: "store-indore-01",
    staffId: "staff-5",
    period: "daily",
    totalOrders: 5,
    avgPreparationTime: 8.1,
    delayedOrders: 0,
    attendancePercentage: 100,
    customerComplaints: 0,
    rating: 4.7,
    score: 94.8,
    createdAt: "2026-06-25T00:00:00.000Z"
  }
];


