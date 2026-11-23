// Rider / staff detail panels (performance, attendance, salary, wallet, live tracking) have no server data yet: empty values of the
// shape the screens read, so they show empty states instead of invented figures.
export const initialStores = [];
export const initialManagers = [];
export const getManagerPerformance = mgrId => {
  return { ordersHandled: 0, avgPrepTime: 0, customerRating: 0, inventoryAccuracy: 0, attendanceRate: 0, trends: { daily: [], weekly: [], monthly: [], rating: [], accuracy: 0 } };
};
export const getManagerAttendance = mgrId => {
  return { attendanceRate: 0, lateCount: 0, leavesTaken: 0, absentCount: 0, calendarLogs: [] };
};
export const getManagerSalary = (mgrId, baseSalary) => {
  return { monthlySalary: 0, bonus: 0, deductions: 0, netSalary: 0, history: [] };
};
export const getManagerAuditLogs = mgrId => {
  return [];
};
export const getDashboardStats = managersList => {
  return { totalManagers: 0, activeManagers: 0, onLeaveManagers: 0, suspendedManagers: 0, avgRating: 0, ordersManagedToday: 0 };
};
export const initialKitchenStaff = [];
export const getKitchenPerformance = staffId => {
  return { pizzasPrepared: 0, avgCookingTime: 0, qualityScore: 0, cancelledOrders: 0, attendanceRate: 0, trends: { daily: [], weekly: [], monthly: [], cooking: [] } };
};
export const getKitchenAttendance = staffId => {
  return { attendanceRate: 0, workingDays: 0, lateCount: 0, leavesTaken: 0, absentCount: 0, overtimeHours: 0, calendarLogs: [] };
};
export const getKitchenShifts = (staffId, defaultShift = "Morning") => {
  return { current: "", history: [] };
};
export const getKitchenSalary = (staffId, baseSalary) => {
  return { monthlySalary: 0, bonus: 0, deductions: 0, netSalary: 0, history: [] };
};
export const getKitchenAuditLogs = staffId => {
  return [];
};
export const getKitchenDashboardStats = staffList => {
  return { totalStaff: 0, activeStaff: 0, onShift: 0, avgCookingTime: 0, pizzasPreparedToday: 0, attendancePercentage: 0 };
};
export const initialDeliveryPartners = [];
export const getDeliveryPartnerPerformance = riderId => {
  return { totalDeliveries: 0, avgDeliveryTime: 0, distanceCovered: 0, avgRating: 0, cancellationRate: 0, earnings: 0, trends: { daily: [], weekly: [], monthly: [], rating: [] } };
};
export const getDeliveryPartnerAttendance = riderId => {
  return { attendanceRate: 0, workingDays: 0, lateCount: 0, leavesTaken: 0, absentCount: 0, hoursWorked: 0, overtimeHours: 0, calendarLogs: [] };
};
export const getDeliveryPartnerWallet = riderId => {
  return { balance: 0, todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0, bonuses: 0, penalties: 0, withdrawals: 0, history: [] };
};
export const getDeliveryPartnerLiveTracking = riderId => {
  return { lat: null, lng: null, eta: "", speed: null, battery: 0, networkStatus: "", batteryStatus: "", distanceRemaining: null, lastUpdated: "", currentOrder: { orderNumber: "", customerName: "", destination: "", estTime: "" }, routePath: [] };
};
export const getDeliveryPartnerSalary = (riderId, baseSalary) => {
  return { monthlySalary: 0, commission: 0, bonus: 0, deductions: 0, netSalary: 0, history: [] };
};
export const getDeliveryPartnerAuditLogs = riderId => {
  return [];
};
export const getDeliveryPartnerDashboardStats = riderList => {
  return { totalRiders: 0, onlineRiders: 0, busyRiders: 0, deliveredToday: 0, avgDeliveryTime: 0, avgRating: 0, todayEarnings: 0, cancelledDeliveries: 0 };
};
