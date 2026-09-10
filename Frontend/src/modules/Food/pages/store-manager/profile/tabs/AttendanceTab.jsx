import React, { useState, useEffect } from "react";
import { Calendar, Percent, CheckCircle, AlertCircle, Clock, Search, Filter } from "lucide-react";
import { profileApi } from "@food/api";
import AttendanceTable from "../components/AttendanceTable";

export default function AttendanceTab() {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("June 2026");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 4;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await profileApi.getAttendance();
        if (res.success) {
          setAttendanceData(res.data);
        }
      } catch (err) {
        console.error("Failed to load attendance logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
          ))}
        </div>
        <div className="h-[200px] bg-zinc-150 dark:bg-zinc-850 rounded-xl" />
      </div>
    );
  }

  const summary = attendanceData?.summary || attendanceData?.data?.summary || {};
  
  let logs = [];
  if (attendanceData) {
    if (Array.isArray(attendanceData.logs)) {
      logs = attendanceData.logs;
    } else if (attendanceData.data && Array.isArray(attendanceData.data.logs)) {
      logs = attendanceData.data.logs;
    } else if (Array.isArray(attendanceData)) {
      logs = attendanceData;
    }
  }

  const stats = [
    { title: "Attendance Rate", value: `${summary.attendanceRate || 0}%`, label: "Target: >95%", icon: Percent, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100" },
    { title: "Present Days", value: summary.presentDays || 0, label: "Days worked", icon: CheckCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100" },
    { title: "Absent Days", value: summary.absentDays || 0, label: "Unexcused leaves", icon: AlertCircle, color: "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-100" },
    { title: "Total Hours", value: `${summary.totalHours || 0} hrs`, label: "Regular shifts", icon: Clock, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100" },
    { title: "Late Entries", value: summary.lateEntries || 0, label: "Buffer grace exceeded", icon: AlertCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100" },
  ];

  // Filtering logic
  const filteredLogs = logs.filter((log) => {
    // Status filter
    if (statusFilter !== "All" && log.status !== statusFilter) return false;
    // Month filter simulated (since dates are mock strings starting with 2026-06)
    if (selectedMonth === "June 2026" && !log.date.includes("2026-06")) return false;
    if (selectedMonth === "May 2026" && !log.date.includes("2026-05")) return false;
    return true;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* ATTENDANCE SUMMARY STATS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
          <Calendar size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Attendance Summary
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850/80 p-3 rounded-xl flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                    {stat.title}
                  </span>
                  <h3 className="text-base font-black text-slate-800 dark:text-zinc-200">
                    {stat.value}
                  </h3>
                  <span className="text-[8px] font-semibold text-slate-400 dark:text-zinc-550 block truncate">
                    {stat.label}
                  </span>
                </div>
                <div className={`p-1.5 rounded-lg border ${stat.color} shrink-0 flex items-center justify-center`}>
                  <Icon size={12} className="stroke-[2.2]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER CONTROLS & ATTENDANCE TABLE */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
            <Filter size={13} className="text-[var(--secondary)]" />
            <span>Attendance Log Sheets</span>
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Filter Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="text-[10px] font-bold px-2 py-1.5 border border-zinc-250 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 rounded-lg focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
            >
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
            </select>

            {/* Status Filter Tab Buttons */}
            <div className="flex items-center bg-zinc-100/60 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-150 dark:border-zinc-850">
              {["All", "Present", "Late", "Absent"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  className={`px-2 py-1 rounded-md text-[9px] font-extrabold transition-all ${
                    statusFilter === status
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-250"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Paginated Attendance table */}
        <AttendanceTable
          logs={paginatedLogs}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
