import React, { useState, useEffect } from "react";
import { 
  X, User, Mail, Phone, Calendar, Clock, Star, MapPin, 
  Package, ClipboardList, ShieldAlert, Trophy, Trash2, 
  Edit, Plus, FileText, CheckCircle2, ChevronRight, 
  Check, Eye, AlertTriangle, AlertCircle, RefreshCw,
  Send, ExternalLink, HelpCircle
} from "lucide-react";
import { mockStores } from "../mockData";

// Helper to format date nicely
const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
};

export default function ComplaintDrawer({
  isOpen,
  onClose,
  complaintId,
  useComplaintsHook,
  onAssignClick,
  onEscalateClick,
  onResolveClick,
  onCloseClick,
  onDeleteClick
}) {
  const {
    complaintDetails,
    loadingDetails,
    fetchComplaintDetails,
    addComplaintNote,
    deleteComplaintNote
  } = useComplaintsHook;

  const [activeTab, setActiveTab] = useState("Complaint Info");
  const [newNote, setNewNote] = useState("");
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    if (isOpen && complaintId) {
      fetchComplaintDetails(complaintId);
      setActiveTab("Complaint Info");
      setNewNote("");
    }
  }, [isOpen, complaintId, fetchComplaintDetails]);

  if (!isOpen) return null;

  const tabs = [
    { name: "Complaint Info", icon: ShieldAlert },
    { name: "Customer Info", icon: User },
    { name: "Order Details", icon: Package },
    { name: "Timeline", icon: Clock },
    { name: "Resolution", icon: CheckCircle2 },
    { name: "Internal Notes", icon: ClipboardList },
    { name: "Attachments", icon: FileText }
  ];

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addComplaintNote(complaintId, newNote.trim());
    setNewNote("");
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "Low": return "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-350";
      case "Medium": return "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-300/40";
      case "High": return "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-300/40";
      case "Critical": return "bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border-rose-300/40";
      default: return "bg-zinc-100 text-zinc-700 border-zinc-300";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "In Progress": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Escalated": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "Resolved": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Closed": return "bg-zinc-550/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  // Compute SLA SLA breach logic based on priorities
  // Critical: 4h, High: 12h, Medium: 24h, Low: 48h
  const getSLADurationHours = (priority) => {
    if (priority === "Critical") return 4;
    if (priority === "High") return 12;
    if (priority === "Medium") return 24;
    return 48; // Low
  };

  const getSLADeadline = (createdStr, priority) => {
    const created = new Date(createdStr);
    const hours = getSLADurationHours(priority);
    return new Date(created.getTime() + hours * 60 * 60 * 1000);
  };

  const getSLANavigation = () => {
    if (!complaintDetails) return null;
    const { createdAt, priority, status, resolvedAt, handlingTimeHours } = complaintDetails;
    const limit = getSLADurationHours(priority);
    const deadline = getSLADeadline(createdAt, priority);
    const now = new Date();

    if (status === "Resolved" || status === "Closed") {
      const timeSpent = handlingTimeHours || 0;
      const breached = timeSpent > limit;
      return {
        breached,
        text: breached 
          ? `SLA Breached (Resolved in ${timeSpent}h vs limit ${limit}h)` 
          : `Within SLA (Resolved in ${timeSpent}h vs limit ${limit}h)`,
        color: breached ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200"
      };
    } else {
      const remainingMs = deadline - now;
      const remainingHrs = (remainingMs / (1000 * 60 * 60)).toFixed(1);
      const breached = remainingMs < 0;
      return {
        breached,
        text: breached
          ? `SLA Breached (Overdue by ${Math.abs(remainingHrs)}h | limit ${limit}h)`
          : `Within SLA (Deadline in ${remainingHrs}h | limit ${limit}h)`,
        color: breached ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200" : "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200"
      };
    }
  };

  const slaData = getSLANavigation();

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel (90% width) */}
      <div className="relative w-full max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] h-full bg-slate-50 dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-10 animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                  Ticket {complaintDetails?.ticketNumber || "Loading..."}
                </h3>
                {complaintDetails && (
                  <>
                    <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-bold border ${getPriorityBadgeClass(complaintDetails.priority)}`}>
                      {complaintDetails.priority}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-bold border ${getStatusBadgeClass(complaintDetails.status)}`}>
                      {complaintDetails.status}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Category: {complaintDetails?.category} | Registered: {complaintDetails ? formatDateTime(complaintDetails.createdAt) : "Loading..."}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* SLA Status Bar */}
        {complaintDetails && slaData && (
          <div className={`px-5 py-2 border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-extrabold flex items-center justify-between border ${slaData.color}`}>
            <span className="flex items-center gap-1.5 uppercase">
              {slaData.breached ? <AlertCircle size={12} className="text-rose-500" /> : <Clock size={12} />}
              {slaData.text}
            </span>
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-400">
              SLA Limit: {getSLADurationHours(complaintDetails.priority)} Hours
            </span>
          </div>
        )}

        {/* Tab Selection Bar */}
        <div className="flex bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-850 px-4 overflow-x-auto scrollbar-none gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-3 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isSelected 
                    ? "border-[var(--primary)] text-[var(--primary)]" 
                    : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <Icon size={12} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {loadingDetails ? (
            <div className="h-64 flex items-center justify-center flex-col gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
              <p className="text-xs text-zinc-450 dark:text-zinc-400">Fetching ticket database details...</p>
            </div>
          ) : complaintDetails ? (
            <div className="space-y-4">
              
              {/* TAB 1: COMPLAINT INFO */}
              {activeTab === "Complaint Info" && (
                <div className="space-y-4">
                  {/* Summary & Meta Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase text-zinc-400">Grievance Category</h4>
                        <p className="text-sm font-extrabold text-zinc-900 dark:text-white mt-0.5">{complaintDetails.category}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase text-zinc-400 text-right">Assignee</h4>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 text-right mt-0.5">
                          {complaintDetails.assignedTo ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {complaintDetails.assignedTo}
                            </span>
                          ) : (
                            <span className="text-rose-500 font-extrabold uppercase">Unassigned</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <h4 className="text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">Customer Reported Issue</h4>
                      <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 font-medium">
                        "{complaintDetails.description}"
                      </p>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white mb-3 tracking-wider">Ticket Management Actions</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <button
                        onClick={() => onAssignClick(complaintDetails)}
                        disabled={complaintDetails.status === "Closed"}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <User size={13} className="text-emerald-500" />
                        Assign Staff
                      </button>

                      <button
                        onClick={() => onEscalateClick(complaintDetails)}
                        disabled={complaintDetails.status === "Closed"}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <AlertTriangle size={13} className="text-red-500" />
                        Escalate
                      </button>

                      <button
                        onClick={() => onResolveClick(complaintDetails)}
                        disabled={complaintDetails.status === "Closed" || complaintDetails.status === "Resolved"}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <Check size={13} />
                        Mark Resolved
                      </button>

                      <button
                        onClick={() => onCloseClick(complaintDetails)}
                        disabled={complaintDetails.status === "Closed" || complaintDetails.status !== "Resolved"}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-800 dark:bg-zinc-250 dark:text-zinc-900 text-white hover:opacity-90 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <CheckCircle2 size={13} />
                        Close & Lock
                      </button>

                      <button
                        onClick={() => onDeleteClick(complaintDetails._id)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                      >
                        <Trash2 size={13} />
                        Delete Ticket
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOMER INFO */}
              {activeTab === "Customer Info" && (
                <div className="space-y-4">
                  {/* Basic Profile Details */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider">Customer Profile</h4>
                      <a 
                        href={`/franchise-admin/customers?userId=${complaintDetails.customerId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)] hover:underline flex items-center gap-0.5"
                      >
                        <span>Customer Dashboard</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Name</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{complaintDetails.customer?.fullName || "Guest Customer"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Phone Mobile</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{complaintDetails.customer?.mobile || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Email</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 truncate block max-w-full">{complaintDetails.customer?.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Verified</span>
                        <span className="text-xs font-bold">
                          {complaintDetails.customer?.isVerified ? (
                            <span className="text-green-600 flex items-center gap-0.5">Yes (OTP Verified)</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-0.5">Unverified Mobile</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spending Analytics */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Franchise Loyalty & Spending Analytics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Total Orders</span>
                        <div className="text-sm font-extrabold text-zinc-850 dark:text-white mt-0.5">{complaintDetails.customer?.totalOrders || 0}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Total Spent</span>
                        <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{complaintDetails.customer?.totalSpent || 0}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Avg Order Value</span>
                        <div className="text-sm font-extrabold text-zinc-850 dark:text-white mt-0.5">₹{complaintDetails.customer?.avgOrderValue || 0}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Loyalty Points</span>
                        <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{complaintDetails.customer?.loyaltyPoints || 0} Points</div>
                      </div>
                    </div>

                    {complaintDetails.customer?.tags?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-1.5">System Assignment Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {complaintDetails.customer.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ORDER DETAILS */}
              {activeTab === "Order Details" && (
                <div className="space-y-4">
                  {complaintDetails.order ? (
                    <div className="space-y-4">
                      {/* Order Core Meta */}
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                        <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Order Information</h4>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Order Number</span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{complaintDetails.order.orderNumber}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Date & Time</span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{formatDateTime(complaintDetails.order.date)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Order Status</span>
                            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 uppercase">
                              {complaintDetails.order.orderStatus}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Payment Method</span>
                            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{complaintDetails.order.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Type</span>
                            <span className="text-xs font-extrabold text-[var(--primary)] uppercase">{complaintDetails.order.deliveryType}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Total Amount</span>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">₹{complaintDetails.order.amount}</span>
                          </div>
                        </div>

                        {complaintDetails.order.paymentDetails && (
                          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <strong className="text-zinc-400">Transaction ID:</strong> <span className="font-bold text-zinc-700 dark:text-zinc-300">{complaintDetails.order.paymentDetails.transactionId}</span>
                            </div>
                            <div>
                              <strong className="text-zinc-400">Gateway Status:</strong> <span className="font-bold text-zinc-700 dark:text-zinc-300">{complaintDetails.order.paymentDetails.status}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items table */}
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                        <div className="px-4 py-3 border-b border-zinc-150 dark:border-zinc-850">
                          <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider">Ordered Products</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-400 border-b border-zinc-150 dark:border-zinc-850 text-[9px] font-bold uppercase">
                              <tr>
                                <th className="px-4 py-2">Item Name</th>
                                <th className="px-4 py-2 text-center">Qty</th>
                                <th className="px-4 py-2 text-right">Price</th>
                                <th className="px-4 py-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {complaintDetails.order.items?.map((item, i) => (
                                <tr key={i} className="text-zinc-750 dark:text-zinc-300">
                                  <td className="px-4 py-2.5 font-bold">{item.name}</td>
                                  <td className="px-4 py-2.5 text-center font-bold">{item.quantity}</td>
                                  <td className="px-4 py-2.5 text-right font-medium">₹{item.price}</td>
                                  <td className="px-4 py-2.5 text-right font-bold">₹{item.price * item.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
                          <div className="w-48 space-y-1.5 text-[10px]">
                            {complaintDetails.order.discount > 0 && (
                              <div className="flex justify-between text-rose-500 font-medium">
                                <span>Discount:</span>
                                <span>-₹{complaintDetails.order.discount}</span>
                              </div>
                            )}
                            {complaintDetails.order.taxes > 0 && (
                              <div className="flex justify-between text-zinc-450">
                                <span>GST Taxes:</span>
                                <span>+₹{complaintDetails.order.taxes}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-extrabold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 pt-1.5">
                              <span>Net Paid:</span>
                              <span>₹{complaintDetails.order.amount}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {complaintDetails.order.deliveryAddress && (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                          <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-2 flex items-center gap-1 text-[10px]">
                            <MapPin size={12} className="text-zinc-400" />
                            Delivery Destination Address
                          </h4>
                          <div className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg">
                            <strong className="text-zinc-900 dark:text-white">{complaintDetails.order.deliveryAddress.recipientName}</strong> ({complaintDetails.order.deliveryAddress.phone})<br />
                            {complaintDetails.order.deliveryAddress.houseNo}, {complaintDetails.order.deliveryAddress.street}<br />
                            {complaintDetails.order.deliveryAddress.city}, {complaintDetails.order.deliveryAddress.state} - <strong className="text-zinc-900 dark:text-white">{complaintDetails.order.deliveryAddress.pincode}</strong><br />
                            {complaintDetails.order.deliveryAddress.landmark && <span className="text-[10px] text-zinc-450 dark:text-zinc-450 italic mt-1 block">Landmark: {complaintDetails.order.deliveryAddress.landmark}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-400 p-4 gap-2">
                      <Package size={30} className="stroke-1" />
                      <p className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-400">No order details linked</p>
                      <p className="text-[10px] text-zinc-400 text-center max-w-xs leading-normal">
                        This complaint ticket was filed without a specific order transaction reference (e.g. app registry bugs).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TIMELINE LOG */}
              {activeTab === "Timeline" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
                  <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-5">Ticket Lifecycle Logs</h4>
                  
                  {complaintDetails.logs && complaintDetails.logs.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-zinc-150 dark:border-zinc-800 space-y-6 ml-2 text-xs">
                      {complaintDetails.logs.map((log, index) => (
                        <div key={log._id || index} className="relative">
                          {/* Dot marker */}
                          <span className="absolute -left-[31px] top-0.5 bg-white dark:bg-zinc-900 border-2 border-[var(--primary)] rounded-full w-4 h-4 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                          </span>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <span className="font-extrabold text-zinc-850 dark:text-zinc-100 uppercase text-[10px]">
                              {log.action}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-bold">
                              {formatDateTime(log.timestamp)}
                            </span>
                          </div>

                          <p className="text-zinc-550 dark:text-zinc-450 mt-1 text-[10px] leading-relaxed font-medium">
                            Performed by: <strong className="font-extrabold text-zinc-700 dark:text-zinc-300">{log.performedBy}</strong>
                          </p>

                          {(log.oldValue || log.newValue) && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[9px] bg-zinc-50 dark:bg-zinc-950 px-2 py-1 border border-zinc-150 dark:border-zinc-850 rounded w-fit max-w-full font-bold">
                              {log.oldValue && (
                                <>
                                  <span className="text-rose-500 line-through truncate max-w-[120px]">{log.oldValue}</span>
                                  <ChevronRight size={10} className="text-zinc-400" />
                                </>
                              )}
                              <span className="text-emerald-600 truncate max-w-[200px]">{log.newValue}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-zinc-400 py-6">No lifecycle audit records.</div>
                  )}
                </div>
              )}

              {/* TAB 5: RESOLUTION */}
              {activeTab === "Resolution" && (
                <div className="space-y-4">
                  {complaintDetails.resolvedAt ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-4">
                      
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 size={18} className="shrink-0" />
                        <div>
                          <p className="text-xs font-extrabold uppercase">Ticket Resolved Successfully</p>
                          <p className="text-[9px] font-bold mt-0.5 opacity-80">Resolved at: {formatDateTime(complaintDetails.resolvedAt)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                          <span className="text-[8px] font-bold text-zinc-450 uppercase block mb-1">Handling duration</span>
                          <strong className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">{complaintDetails.handlingTimeHours} Hours</strong>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                          <span className="text-[8px] font-bold text-zinc-450 uppercase block mb-1">SLA Compliance</span>
                          <span className={`text-xs font-extrabold ${slaData?.breached ? "text-rose-500" : "text-emerald-500"}`}>
                            {slaData?.breached ? "BREACHED" : "COMPLIANT"}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                        <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Resolution summary</h4>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 text-xs">
                          {complaintDetails.resolution}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-5 shadow-xs text-center space-y-4">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">Resolution Pending</h4>
                        <p className="text-[10px] text-zinc-400 max-w-sm mx-auto leading-normal">
                          This support case is currently actively open. Perform operations from the <strong className="font-extrabold">Complaint Info</strong> tab to assign support desk managers and dispatch compensation.
                        </p>
                      </div>

                      {complaintDetails.status !== "Closed" && (
                        <button
                          onClick={() => onResolveClick(complaintDetails)}
                          className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm text-[10px] cursor-pointer"
                        >
                          Resolve Ticket Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: INTERNAL NOTES */}
              {activeTab === "Internal Notes" && (
                <div className="space-y-4">
                  {/* Note Creator Form */}
                  <form onSubmit={handleAddNote} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider">Add Internal Private Note</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Write staff comment (e.g. checked order details, spoke to kitchen manager...)"
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 text-white rounded-lg hover:opacity-90 flex items-center justify-center cursor-pointer transition-all"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                    <span className="text-[8px] text-zinc-400 font-medium block">
                      * Internal notes are only viewable by store managers and franchise admins. Customers do not see these logs.
                    </span>
                  </form>

                  {/* Notes List */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-2">Staff Remarks & Logs</h4>
                    {complaintDetails.notes && complaintDetails.notes.length > 0 ? (
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {complaintDetails.notes.map(note => (
                          <div key={note._id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-start gap-3">
                            <div className="space-y-1 flex-1">
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold leading-normal">
                                "{note.note}"
                              </p>
                              <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-bold">
                                <span className="text-zinc-650 dark:text-zinc-400">{note.createdBy}</span>
                                <span>•</span>
                                <span>{formatDateTime(note.createdAt)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteComplaintNote(complaintDetails._id, note._id)}
                              className="p-1 rounded text-zinc-450 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-400">No staff remarks attached. Use form above to add notes.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: ATTACHMENTS */}
              {activeTab === "Attachments" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
                  <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Customer Uploaded Photo Evidence</h4>
                  {complaintDetails.attachments && complaintDetails.attachments.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {complaintDetails.attachments.map((url, index) => (
                        <div 
                          key={index}
                          onClick={() => setLightboxImg(url)}
                          className="relative aspect-square border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden group cursor-pointer hover:border-[var(--primary)] transition-all bg-slate-50 dark:bg-zinc-950"
                        >
                          <img src={url} alt={`Evidence ${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            <Eye size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-zinc-400 gap-2">
                      <FileText size={30} className="stroke-1" />
                      <p className="text-xs font-bold uppercase text-zinc-450">No files attached</p>
                      <p className="text-[10px] text-zinc-400 text-center max-w-xs leading-normal">
                        No photos or invoice copies were uploaded with this ticket registration.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="h-64 flex items-center justify-center flex-col text-zinc-400">
              <AlertCircle size={28} className="stroke-1 mb-2" />
              <p className="text-xs font-bold uppercase">No Ticket Context</p>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox for attachments */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 transition-opacity" onClick={() => setLightboxImg(null)} />
          <div className="relative max-w-4xl max-h-[85vh] z-10 flex flex-col items-center">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
            <img src={lightboxImg} alt="Lightbox Preview" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

    </div>
  );
}
