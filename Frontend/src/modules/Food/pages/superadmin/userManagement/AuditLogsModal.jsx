import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ShieldAlert,
  X,
  Search,
  Calendar,
  Info,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AUDIT_LOGS = [
  {
    id: 1,
    adminName: "Alex Rivera",
    adminRole: "Super Admin",
    avatar: "/placeholder-user.webp",
    action: "Access Revoked: Senior Financial Controller",
    target: "USR-9482-B",
    date: "Oct 24, 2023 • 14:22:05",
    ip: "192.168.1.104",
    severity: "CRITICAL"
  },
  {
    id: 2,
    adminName: "Sarah Jenkins",
    adminRole: "Security Lead",
    avatar: "/placeholder-user.webp",
    action: "Updated Permissions: Franchise Manager",
    target: "ROLE_FR_MGR",
    date: "Oct 24, 2023 • 11:45:12",
    ip: "10.0.4.55",
    severity: "HIGH"
  },
  {
    id: 3,
    adminName: "David Chen",
    adminRole: "System Admin",
    avatar: "/placeholder-user.webp",
    action: "User Assigned: New Kitchen Supervisor",
    target: "USR-8821-K",
    date: "Oct 24, 2023 • 09:10:33",
    ip: "192.168.1.12",
    severity: "MEDIUM"
  },
  {
    id: 4,
    adminName: "Maria Garcia",
    adminRole: "Operations Admin",
    avatar: "/placeholder-user.webp",
    action: "Role Created: Regional Auditor",
    target: "ROLE_REG_AUDIT",
    date: "Oct 23, 2023 • 17:30:45",
    ip: "172.16.0.44",
    severity: "LOW"
  },
  {
    id: 5,
    adminName: "Super Admin",
    adminRole: "System Root",
    avatar: "/placeholder-user.webp",
    action: "Password Policy Hardened: Global",
    target: "SYSTEM_CONFIG",
    date: "Oct 23, 2023 • 15:05:00",
    ip: "Localhost",
    severity: "HIGH"
  }
];

export default function AuditLogsModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState("Last 24 Hours");
  const [eventType, setEventType] = useState("All Event Types");
  const [severityFilter, setSeverityFilter] = useState("All Severities");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setDateRange("Last 24 Hours");
    setEventType("All Event Types");
    setSeverityFilter("All Severities");
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Administrator", "Role", "Action", "Target", "Date", "IP", "Severity"];
    const csvRows = [];
    csvRows.push(headers.join(","));

    filteredLogs.forEach(log => {
      const row = [
        log.id,
        `"${log.adminName}"`,
        `"${log.adminRole}"`,
        `"${log.action}"`,
        `"${log.target}"`,
        `"${log.date}"`,
        `"${log.ip}"`,
        `"${log.severity}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Security Audit Logs", 14, 15);
    
    const tableColumn = ["Admin", "Role", "Action", "Target", "Date", "IP", "Severity"];
    const tableRows = [];

    filteredLogs.forEach(log => {
      const rowData = [
        log.adminName,
        log.adminRole,
        log.action,
        log.target,
        log.date,
        log.ip,
        log.severity
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("audit_logs.pdf");
  };

  const filteredLogs = AUDIT_LOGS.filter(log => {
    const searchMatch = !debouncedSearch || 
      log.adminName.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      log.action.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const eventMatch = eventType === "All Event Types" || log.action.toLowerCase().includes(eventType.toLowerCase());
    const severityMatch = severityFilter === "All Severities" || log.severity.toLowerCase() === severityFilter.toLowerCase();
    
    return searchMatch && eventMatch && severityMatch;
  });

  const getSeverityClasses = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/50';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50';
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                <div>
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500 mb-0.5">
                    <ShieldAlert size={15} className="fill-red-100 dark:fill-red-950" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">SecureOps Systems</span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Security Audit Logs</h2>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Detailed audit trail of permission changes and access revocations.</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Filters */}
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 bg-white dark:bg-zinc-950 shrink-0">
                <div className="lg:col-span-1 relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by admin name or action..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </div>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all appearance-none cursor-pointer"
                  >
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Custom Range</option>
                  </select>
                </div>
                <div>
                  <select 
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
                  >
                    <option>All Event Types</option>
                    <option>Role Created</option>
                    <option>Permissions Updated</option>
                    <option>User Assigned</option>
                    <option>Access Revoked</option>
                  </select>
                </div>
                <div>
                  <select 
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
                  >
                    <option>All Severities</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={handleResetFilters}
                    className="w-full h-full px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all whitespace-nowrap cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto overflow-y-auto bg-white dark:bg-zinc-950 scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 z-10 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Administrator</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Target</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Timestamp / IP</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Severity</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-500 font-bold shrink-0 text-xs">
                              {log.adminName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{log.adminName}</p>
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{log.adminRole}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{log.action}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                            {log.target}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-[10px] font-mono font-semibold text-zinc-800 dark:text-zinc-200">{log.date}</p>
                          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">{log.ip}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getSeverityClasses(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button className="text-zinc-400 hover:text-[var(--primary)] transition-colors p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                            <Info size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-3 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col md:flex-row justify-between items-center gap-2.5 shrink-0 rounded-b-2xl">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleExportPDF}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Download size={14} /> PDF
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={14} /> CSV
                  </button>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mr-2">Showing 1-5 of 2,492</span>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-zinc-500 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      <ChevronLeft size={14} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center bg-[var(--primary)] text-white rounded-lg text-[10px] font-bold shadow-md shadow-[var(--primary)]/20">1</button>
                    <button className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors hidden sm:flex">2</button>
                    <button className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors hidden sm:flex">3</button>
                    <span className="text-zinc-400 mx-1">...</span>
                    <button className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
