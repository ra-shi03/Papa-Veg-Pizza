import React, { useEffect } from "react";
import { X, User, Calendar, ClipboardCheck, Clock, AlertTriangle, Award, Star, Loader2 } from "lucide-react";
import { useStaffDetails } from "../hooks/useStaffDetails";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function StaffDetailModal({ isOpen, onClose, staffId }) {
  const { data, isLoading, isError } = useStaffDetails(staffId);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl mx-4 my-8 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <User size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Staff Performance Dossier
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Detailed employee productivity analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
              <span className="text-xs font-bold text-zinc-400">Loading performance report...</span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-rose-500 font-bold text-xs">
              Failed to load employee dossier. Please try again.
            </div>
          ) : (
            <>
              {/* SECTION 1: Profile Details */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-neutral-50/50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-3xl">
                <img 
                  src={data.profile?.photo} 
                  alt={data.profile?.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-[var(--primary)]/20 shadow-md shrink-0"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80";
                  }}
                />
                <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {data.profile?.name}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <span className="px-2.5 py-0.5 bg-neutral-200/50 dark:bg-zinc-800 rounded-full text-zinc-700 dark:text-zinc-350">{data.profile?.role}</span>
                    <span className="px-2.5 py-0.5 bg-neutral-200/50 dark:bg-zinc-800 rounded-full text-zinc-750">{data.profile?.station}</span>
                    <span className="text-[var(--primary)]">ID: {data.profile?.employeeId}</span>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400">
                    Joining Date: {formatDate(data.profile?.joiningDate)} &bull; Status: <span className="text-emerald-500">{data.profile?.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SECTION 2: Attendance History */}
                <div className="lg:col-span-7 space-y-3.5 bg-neutral-50/20 dark:bg-zinc-950/10 p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                      <Calendar size={12} className="text-[var(--primary)]" />
                      Attendance History
                    </h3>
                    <span className="text-xs font-extrabold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full">
                      Avg: {data.attendancePercentage}%
                    </span>
                  </div>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-2xl bg-white dark:bg-zinc-900">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-center">Check In</th>
                          <th className="px-4 py-2 text-center">Check Out</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {data.attendanceHistory?.map((att, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-4 py-2">{formatDate(att.date)}</td>
                            <td className="px-4 py-2 text-center">{att.checkIn}</td>
                            <td className="px-4 py-2 text-center">{att.checkOut}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                att.status === "Present"
                                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/10"
                                  : att.status === "Late Checkin"
                                  ? "text-amber-600 bg-amber-50 dark:bg-amber-950/10"
                                  : "text-zinc-450 bg-neutral-100 dark:bg-zinc-800"
                              }`}>
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 3 & 4: Operations & Prep Statistics */}
                <div className="lg:col-span-5 space-y-4">
                  {/* SECTION 3: Orders Completed */}
                  <div className="bg-neutral-50/20 dark:bg-zinc-950/10 p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-3">
                    <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                      <ClipboardCheck size={12} className="text-[var(--primary)]" />
                      Orders Operations
                    </h3>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Assigned Jobs</span>
                        <span className="text-base font-black text-slate-800 dark:text-white">{data.ordersCompleted?.total}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Completions</span>
                        <span className="text-base font-black text-emerald-500">{data.ordersCompleted?.completed}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Delays</span>
                        <span className="text-base font-black text-amber-500">{data.ordersCompleted?.delayed}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Cancellations</span>
                        <span className="text-base font-black text-rose-500">{data.ordersCompleted?.cancelled}</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: Preparation Statistics */}
                  <div className="bg-neutral-50/20 dark:bg-zinc-950/10 p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-2.5">
                    <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                      <Clock size={12} className="text-indigo-500" />
                      Preparation Speeds
                    </h3>
                    <div className="space-y-2 text-xs font-extrabold text-zinc-700 dark:text-zinc-350">
                      <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800">
                        <span>Average preparation Time</span>
                        <span className="text-[var(--primary)]">{data.preparationStats?.avgPrepTime} mins</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800">
                        <span>Fastest prep record</span>
                        <span className="text-emerald-500">{data.preparationStats?.fastestTime} mins</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800">
                        <span>Slowest prep record</span>
                        <span className="text-rose-500">{data.preparationStats?.slowestTime} mins</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Overall station efficiency</span>
                        <span className="text-emerald-500">{data.preparationStats?.efficiency}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SECTION 5: Complaints */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <AlertTriangle size={12} className="text-rose-500" />
                    Customer Service Complaints
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Complaint Category</th>
                          <th className="px-4 py-2 text-left">Detail</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {data.complaints?.map((c, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-4 py-2.5">{formatDate(c.date)}</td>
                            <td className="px-4 py-2.5 text-rose-500">{c.complaintType}</td>
                            <td className="px-4 py-2.5 text-zinc-500 truncate max-w-[120px]">{c.description}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-500">{c.status}</td>
                          </tr>
                        ))}
                        {(!data.complaints || data.complaints.length === 0) && (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-zinc-400">No complaints registered</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 6: Achievements */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <Award size={12} className="text-amber-500" />
                    Employee Badges & Achievements
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {data.achievements?.map((ach, idx) => (
                      <div 
                        key={idx}
                        className="flex gap-3 p-4 bg-amber-50/10 dark:bg-amber-950/10 border border-amber-550/15 rounded-2xl items-center"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Award size={20} className="stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">{ach.type}</div>
                          <p className="text-[10px] text-zinc-455 font-bold leading-normal truncate mt-0.5">{ach.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 7: Ratings & Customer Feedback */}
              <div className="space-y-3.5 bg-neutral-50/20 dark:bg-zinc-950/10 p-5 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <Star size={12} className="text-amber-500" />
                    Customer Reviews & Feedback
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-black text-slate-800 dark:text-white">
                    <span>Score: {data.ratings?.avgRating}</span>
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    <span className="text-zinc-400 font-bold">({data.ratings?.reviewCount} reviews)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.ratings?.customerFeedback?.map((f, idx) => (
                    <div 
                      key={idx}
                      className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-2xl space-y-2"
                    >
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400">
                        <span>{f.reviewer}</span>
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: f.stars }).map((_, sIdx) => (
                            <Star key={sIdx} size={9} className="fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-650 dark:text-zinc-350 text-[11px] font-bold leading-relaxed">
                        "{f.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-zinc-100 dark:border-zinc-850 shrink-0 bg-neutral-50/40 dark:bg-zinc-950/20">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
