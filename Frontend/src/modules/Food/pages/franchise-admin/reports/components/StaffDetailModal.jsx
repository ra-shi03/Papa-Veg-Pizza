import React, { useState } from "react";
import { X, User, Phone, Mail, MapPin, Calendar, Clock, Truck, Pizza, ShieldAlert, Award, FileText, CheckCircle2, TrendingUp, Landmark, Star, Printer, Download } from "lucide-react";
import { useStaffDetail, useStaffShifts } from "../hooks/useStaffReport";
import { toast } from "sonner";

export default function StaffDetailModal({ isOpen, staffId, onClose }) {
  const { data: staff, isLoading, error } = useStaffDetail(staffId);
  const { data: shiftsData, isLoading: isShiftsLoading } = useStaffShifts(staffId);
  
  // Shift Table search/pagination local states
  const [shiftPage, setShiftPage] = useState(1);
  const shiftsLimit = 3;

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-xs">
        <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm shrink-0">
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-48 bg-zinc-150 dark:bg-zinc-850 rounded" />
          </div>
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
            <div className="h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-xs items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-955 text-red-500 rounded-full flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Failed to Load Staff Details</h3>
          <p className="text-zinc-400 text-[10px] font-bold">The employee details could not be retrieved from the database.</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    );
  }

  const shifts = shiftsData?.shifts || [];
  const paginatedShifts = shifts.slice((shiftPage - 1) * shiftsLimit, shiftPage * shiftsLimit);
  const shiftsTotalPages = Math.ceil(shifts.length / shiftsLimit);

  const handlePrint = () => {
    toast.success("Opening print view...");
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Staff Performance Report - ${staff.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .details { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #eee; padding: 10px; text-align: left; }
            th { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>PAPA VEG PIZZA</h2>
              <p>Employee Performance Audit Report</p>
            </div>
            <div style="text-align: right;">
              <h2>${staff.role}</h2>
              <p>ID: ${staff.id}</p>
              <p>Status: ${staff.status}</p>
            </div>
          </div>
          <div class="details">
            <h3>Employee Profile</h3>
            <p><strong>Name:</strong> ${staff.name}</p>
            <p><strong>Email:</strong> ${staff.email}</p>
            <p><strong>Phone:</strong> ${staff.phone}</p>
            <p><strong>Store:</strong> ${staff.store}</p>
            <p><strong>Joining Date:</strong> ${new Date(staff.joiningDate).toLocaleDateString()}</p>
          </div>
          
          <div class="section-title">Attendance Summary</div>
          <p>Attendance Percentage: ${staff.attendanceSummary?.attendancePercentage}%</p>
          <p>Total Working Hours: ${staff.attendanceSummary?.workingHours} hrs</p>
          <p>Present: ${staff.attendanceSummary?.presentDays} Days | Absent: ${staff.attendanceSummary?.absentDays} Days | Late: ${staff.attendanceSummary?.lateEntries} Days</p>

          <div class="section-title">Productivity Score</div>
          <p>Performance Rating: ${staff.performanceMetrics?.performanceScore}/100</p>
          ${staff.deliveryMetrics ? `
            <h3>Delivery Performance</h3>
            <p>Completed Deliveries: ${staff.deliveryMetrics.deliveriesCompleted}</p>
            <p>Distance Covered: ${staff.deliveryMetrics.distanceCovered} km</p>
            <p>Average Delivery Speed: ${staff.deliveryMetrics.averageDeliveryTime} mins</p>
            <p>Total Rider Earnings: INR ${staff.deliveryMetrics.totalEarnings}</p>
          ` : ""}
          ${staff.kitchenMetrics ? `
            <h3>Kitchen Efficiency</h3>
            <p>Orders Prepared: ${staff.kitchenMetrics.ordersPrepared}</p>
            <p>Average Prep Time: ${staff.kitchenMetrics.averagePreparationTime} mins</p>
            <p>Kitchen Efficiency Index: ${staff.kitchenMetrics.efficiencyPercentage}%</p>
          ` : ""}
          ${staff.managerMetrics ? `
            <h3>Store Operations Index</h3>
            <p>Orders Managed: ${staff.managerMetrics.ordersManaged}</p>
            <p>Store Revenue Generated: INR ${staff.managerMetrics.revenueGenerated}</p>
            <p>Customer Complaints: ${staff.managerMetrics.complaintsHandled}</p>
            <p>Customer Satisfaction Rating: ${staff.managerMetrics.customerSatisfactionScore}%</p>
          ` : ""}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = (format) => {
    toast.success(`Exporting profile data as ${format}...`);
    const txt = `
Papa Veg Pizza Staff Report
--------------------------------------
Employee ID: ${staff.id}
Name: ${staff.name}
Role: ${staff.role}
Store Location: ${staff.store}
Joining Date: ${staff.joiningDate}
Current Status: ${staff.status}

ATTENDANCE SUMMARY:
- Attendance: ${staff.attendanceSummary?.attendancePercentage}%
- Working Hours: ${staff.attendanceSummary?.workingHours} hrs
- Present / Absent: ${staff.attendanceSummary?.presentDays} / ${staff.attendanceSummary?.absentDays} days

PERFORMANCE METRICS:
- Overall Score: ${staff.performanceMetrics?.performanceScore}/100
- Shift Hours Avg: ${staff.performanceMetrics?.averageShiftHours} hrs
- Contribution Value: INR ${staff.performanceMetrics?.revenueContribution}
`;

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${staff.id}-staff-report.${format.toLowerCase() === "excel" ? "csv" : "txt"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === "active") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
    if (s === "suspended") return "bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400";
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-xs select-none">
      
      {/* Header */}
      <header className="px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${getStatusBadge(staff.status)}`}>
                {staff.status}
              </span>
              <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight">
                {staff.name}
              </h2>
            </div>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              Role: {staff.role} • Employee ID: {staff.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Basic Info & Attendance */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info Section */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <User size={14} className="text-[var(--primary)]" />
                <span>Basic Profile Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-zinc-700 dark:text-zinc-300">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Contact Phone</span>
                    <a href={`tel:${staff.phone}`} className="hover:text-[var(--primary)] text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1">
                      <Phone size={10} />
                      <span>{staff.phone}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Official Email</span>
                    <a href={`mailto:${staff.email}`} className="hover:text-[var(--primary)] text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1">
                      <Mail size={10} />
                      <span>{staff.email}</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Assigned Store</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1">
                      <MapPin size={10} className="text-zinc-400" />
                      {staff.store}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Joining Date</span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1">
                        <Calendar size={10} className="text-zinc-400" />
                        {new Date(staff.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Emergency Contact</span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.emergencyContact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Shift History Section */}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 flex justify-between items-center">
                <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-[var(--primary)]" />
                  <span>Shift History Log</span>
                </h3>
              </div>

              {isShiftsLoading ? (
                <div className="p-6 text-center text-zinc-400">Loading shifts...</div>
              ) : shifts.length > 0 ? (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                      <thead>
                        <tr className="border-b border-zinc-250 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[9px] text-zinc-400 uppercase">
                          <th className="p-3">Shift Date</th>
                          <th className="p-3 text-center">Clock In</th>
                          <th className="p-3 text-center">Clock Out</th>
                          <th className="p-3 text-center">Break Duration</th>
                          <th className="p-3 text-center">Hours Worked</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedShifts.map((shift, idx) => (
                          <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10">
                            <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">
                              {new Date(shift.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="p-3 text-center font-mono">{shift.startTime}</td>
                            <td className="p-3 text-center font-mono">{shift.endTime}</td>
                            <td className="p-3 text-center text-zinc-400">{shift.breakTime} mins</td>
                            <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{shift.hoursWorked} hrs</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase">
                                {shift.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Shifts */}
                  {shiftsTotalPages > 1 && (
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/10 dark:bg-zinc-900/20">
                      <span className="text-[10px] text-zinc-400 font-bold">Shifts log {shiftPage} / {shiftsTotalPages}</span>
                      <div className="flex gap-1">
                        <button
                          disabled={shiftPage === 1}
                          onClick={() => setShiftPage(p => Math.max(p - 1, 1))}
                          className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          disabled={shiftPage === shiftsTotalPages}
                          onClick={() => setShiftPage(p => Math.min(p + 1, shiftsTotalPages))}
                          className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-bold">No shifts history logged.</div>
              )}
            </section>

          </div>

          {/* Right Column: Attendance & Role Metrics */}
          <div className="space-y-6">
            
            {/* Attendance Summary Card */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Attendance Summary</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 block font-bold">Attendance %</span>
                  <span className="text-base font-black text-emerald-500">{staff.attendanceSummary?.attendancePercentage}%</span>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 block font-bold">Total hours</span>
                  <span className="text-base font-black text-[var(--primary)]">{staff.attendanceSummary?.workingHours}</span>
                </div>
              </div>
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Present Days</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.attendanceSummary?.presentDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Absent Days</span>
                  <span className="text-rose-500 font-bold">{staff.attendanceSummary?.absentDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Late Entries</span>
                  <span className="text-amber-500 font-bold">{staff.attendanceSummary?.lateEntries} shifts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Half Days</span>
                  <span className="text-blue-500 font-bold">{staff.attendanceSummary?.halfDays} shifts</span>
                </div>
              </div>
            </section>

            {/* Performance Indicators */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <Award size={14} className="text-[var(--primary)]" />
                <span>Performance Score</span>
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full border-4 border-zinc-100 dark:border-zinc-800 flex items-center justify-center font-black text-sm text-[var(--primary)]">
                  {staff.performanceMetrics?.performanceScore}
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold">Overall index score</span>
                  <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">Excellent Productivity</span>
                </div>
              </div>

              {/* Specialized Metrics Card based on Employee Role */}
              {staff.deliveryMetrics && (
                <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-150 dark:border-blue-900/30 rounded-xl mt-3 space-y-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <h4 className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1">
                    <Truck size={12} />
                    <span>Rider Metrics</span>
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Deliveries Completed</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.deliveryMetrics.deliveriesCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Distance Covered</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.deliveryMetrics.distanceCovered} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Avg Delivery Speed</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.deliveryMetrics.averageDeliveryTime} mins</span>
                  </div>
                  <div className="flex justify-between text-[var(--sa-secondary)] font-bold">
                    <span>Rider Earnings</span>
                    <span>₹{staff.deliveryMetrics.totalEarnings}</span>
                  </div>
                </div>
              )}

              {staff.kitchenMetrics && (
                <div className="p-3 bg-amber-50/20 dark:bg-amber-955/10 border border-amber-150 dark:border-amber-900/30 rounded-xl mt-3 space-y-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <h4 className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                    <Pizza size={12} />
                    <span>Kitchen Worker Metrics</span>
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Orders Prepared</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.kitchenMetrics.ordersPrepared}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Avg Prep Speed</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.kitchenMetrics.averagePreparationTime} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Kitchen Efficiency</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.kitchenMetrics.efficiencyPercentage}%</span>
                  </div>
                </div>
              )}

              {staff.managerMetrics && (
                <div className="p-3 bg-purple-50/20 dark:bg-purple-955/10 border border-purple-150 dark:border-purple-900/30 rounded-xl mt-3 space-y-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <h4 className="text-[10px] font-black uppercase text-purple-500 flex items-center gap-1">
                    <Star size={12} />
                    <span>Store Manager Metrics</span>
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Orders Managed</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{staff.managerMetrics.ordersManaged}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Revenue Managed</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">₹{staff.managerMetrics.revenueGenerated?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Complaints Handled</span>
                    <span className="text-rose-500 font-bold">{staff.managerMetrics.complaintsHandled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Customer Satisfaction</span>
                    <span className="text-emerald-500 font-bold">{staff.managerMetrics.customerSatisfactionScore}%</span>
                  </div>
                </div>
              )}

            </section>

          </div>

        </div>
      </main>

      {/* Footer controls */}
      <footer className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold rounded-xl shadow-xs cursor-pointer text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => handleDownload("PDF")}
            className="px-3.5 py-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold rounded-xl shadow-xs cursor-pointer text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"
          >
            <Download size={13} className="text-rose-500" />
            <span>Download PDF</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 text-white font-black rounded-xl shadow-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
        >
          Close Detail
        </button>
      </footer>

    </div>
  );
}
