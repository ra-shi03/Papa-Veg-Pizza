import React, { useState } from "react";
import { 
  X, User, ShoppingBag, AlertCircle, Image as ImageIcon, GitCommit, Clipboard, 
  Clock, CheckCircle, Ban, ShieldCheck, Phone, Mail, MapPin, Calendar, 
  Coins, UserCheck, Star, Eye, Download, Info
} from "lucide-react";
import { format } from "date-fns";
import { useOrderIssue } from "../ordersQuery";
import ImagePreviewModal from "./ImagePreviewModal";

export default function IssueDetailsDrawer({ isOpen, onClose, issueNumber }) {
  const { data: issue, isLoading } = useOrderIssue(issueNumber);
  const [activeTab, setActiveTab] = useState("customer");
  const [previewImage, setPreviewImage] = useState(null);

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Open":
        return "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30";
      case "Assigned":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30";
      case "Investigating":
        return "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30";
      case "Resolved":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30";
      case "Closed":
        return "text-zinc-600 bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800";
      default:
        return "text-zinc-650 bg-zinc-100 border-zinc-200";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return "text-red-700 bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-900";
      case "High":
        return "text-orange-700 bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-900";
      case "Medium":
        return "text-blue-700 bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-900";
      default:
        return "text-zinc-700 bg-zinc-100 border-zinc-200";
    }
  };

  const tabs = [
    { id: "customer", label: "Customer Info", icon: User },
    { id: "order", label: "Order Info", icon: ShoppingBag },
    { id: "description", label: "Issue Description", icon: AlertCircle },
    { id: "images", label: "Images Proof", icon: ImageIcon },
    { id: "notes", label: "Internal Notes", icon: Clipboard },
    { id: "timeline", label: "Timeline", icon: GitCommit },
  ];

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-[1000px] h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-in">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] text-white rounded-xl shadow-sm">
                <AlertCircle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                    Dispute Ticket Audit
                  </h3>
                  {issue && (
                    <>
                      <span className={`px-2.5 py-0.5 border rounded-full font-bold text-[9.5px] ${getStatusBadge(issue.status)}`}>
                        {issue.status}
                      </span>
                      <span className={`px-2 py-0.5 border rounded-full font-bold text-[9.5px] ${getPriorityBadge(issue.priority)}`}>
                        {issue.priority} Priority
                      </span>
                    </>
                  )}
                </div>
                {issue && (
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    Ticket ID: {issue.issueNumber} • Order: {issue.orderNumber} • Category: {issue.category}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="font-extrabold text-zinc-400">Loading complaint details...</p>
            </div>
          ) : issue ? (
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Tab Menu */}
              <nav className="w-56 bg-zinc-50/50 dark:bg-zinc-900/10 border-r border-zinc-150 dark:border-zinc-850 p-3 space-y-1 shrink-0 flex flex-col">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        active 
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-zinc-550 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <Icon size={14} className={active ? "text-white" : "text-zinc-400"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Tab Panel Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin dark:text-zinc-350">
                
                {/* 1. Customer Info Tab */}
                {activeTab === "customer" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <img
                          src={issue.customer?.avatar}
                          alt={issue.customer?.name}
                          className="w-14 h-14 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-100 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{issue.customer?.name}</h4>
                          <p className="text-[10px] text-zinc-450 font-bold">{issue.customer?.email}</p>
                          <p className="text-[10.5px] text-[var(--primary)] font-black flex items-center gap-1">
                            <Star size={12} className="fill-current text-yellow-500" />
                            <span>Premium Loyalty Member</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => window.open(`tel:${issue.customer?.phone}`)}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-[10px]"
                      >
                        <Phone size={12} />
                        <span>Call Customer</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Customer stats */}
                      <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Account Spend Summary</span>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                            <p className="text-[9px] text-zinc-400 uppercase font-semibold">Total Orders</p>
                            <p className="font-black text-xs text-zinc-800 dark:text-zinc-200 mt-0.5">{issue.customer?.totalOrders || 0}</p>
                          </div>
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                            <p className="text-[9px] text-zinc-400 uppercase font-semibold">Lifetime Value</p>
                            <p className="font-black text-xs text-emerald-600 mt-0.5">₹{(issue.customer?.lifetimeValue || 0).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact metadata */}
                      <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3 flex flex-col justify-center">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Direct Contact details</span>
                        <div className="space-y-1.5 font-bold text-zinc-650 dark:text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-zinc-400 shrink-0" />
                            <span>{issue.customer?.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-zinc-400 shrink-0" />
                            <span>Registered: {issue.customer?.memberSince || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Delivery Address */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                        <MapPin size={12} />
                        Delivery Destination
                      </span>
                      <p className="font-bold text-zinc-750 dark:text-zinc-250 leading-relaxed bg-zinc-50/30 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900 font-mono text-[10px]">
                        {issue.customer?.address || "Address not provided."}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Order Information Tab */}
                {activeTab === "order" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Order Number</p>
                        <p className="font-black text-zinc-800 dark:text-zinc-100 mt-0.5">{issue.order?.orderNumber}</p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Order Store</p>
                        <p className="font-black text-zinc-800 dark:text-zinc-100 mt-0.5 truncate">{issue.order?.storeName}</p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Placed Date</p>
                        <p className="font-black text-zinc-800 dark:text-zinc-100 mt-0.5">
                          {issue.order?.placedAt ? format(new Date(issue.order.placedAt), "dd MMM yyyy, hh:mm a") : "N/A"}
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Delivered Time</p>
                        <p className="font-black text-zinc-800 dark:text-zinc-100 mt-0.5">
                          {issue.order?.deliveredAt ? format(new Date(issue.order.deliveredAt), "dd MMM yyyy, hh:mm a") : "In Transit / Failed"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-4">
                      
                      {/* Items */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Items Ordered</span>
                        <div className="p-3 bg-zinc-50/40 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-900/50 font-bold text-zinc-800 dark:text-zinc-250 leading-relaxed font-mono">
                          {issue.order?.items}
                        </div>
                      </div>

                      {/* Fleet details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-0.5">
                          <p className="text-[8.5px] uppercase font-bold text-zinc-400">Delivery Partner</p>
                          <p className="font-extrabold text-zinc-800 dark:text-zinc-200">{issue.order?.deliveryPartner || "No Rider Allocated"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8.5px] uppercase font-bold text-zinc-400">Payment Mode</p>
                          <p className="font-extrabold text-zinc-800 dark:text-zinc-200">{issue.order?.paymentMethod || "UPI"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8.5px] uppercase font-bold text-zinc-400">Total Order Value</p>
                          <p className="font-black text-sm text-[var(--primary)]">₹{(issue.order?.totalAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. Issue Description Tab */}
                {activeTab === "description" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Complaint Category</p>
                        <p className="font-black text-zinc-850 dark:text-zinc-100 mt-0.5">{issue.category}</p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Current Status</p>
                        <p className="font-black text-zinc-850 dark:text-zinc-100 mt-0.5">{issue.status}</p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Assigned Staff</p>
                        <p className="font-black text-zinc-850 dark:text-zinc-100 mt-0.5 flex items-center gap-1.5">
                          <UserCheck size={12} className="text-blue-500" />
                          <span>{issue.assignedTo?.name || "Unassigned"}</span>
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Resolution Status</p>
                        <p className="font-black text-zinc-855 dark:text-zinc-100 mt-0.5">
                          {issue.resolution ? `${issue.resolution.resolutionType}` : "Pending Audit"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">Customer-reported Dispute Statement</span>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-250 leading-relaxed bg-zinc-50/30 dark:bg-zinc-900/20 p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 font-sans leading-relaxed">
                        {issue.description || "No full explanation provided."}
                      </p>
                    </div>

                    {/* Resolution details */}
                    {issue.resolution && (
                      <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl bg-emerald-550/[0.02] space-y-3">
                        <span className="text-[9px] uppercase font-bold text-emerald-650 dark:text-emerald-500 block">Resolution Package Settled</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 font-bold">
                          <div className="space-y-0.5">
                            <p className="text-[8.5px] uppercase font-bold text-zinc-400">Payout Action</p>
                            <p className="text-zinc-850 dark:text-zinc-200">{issue.resolution.resolutionType}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[8.5px] uppercase font-bold text-zinc-400">Compensation Value</p>
                            <p className="text-emerald-650 dark:text-emerald-500">₹{(issue.resolution.compensationAmount || 0).toFixed(2)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[8.5px] uppercase font-bold text-zinc-400">Compensation Code</p>
                            <p className="text-zinc-850 dark:text-zinc-200 font-mono">{issue.resolution.couponCode || "None"}</p>
                          </div>
                        </div>
                        {issue.resolution.remarks && (
                          <div className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-lg text-[9.5px] font-mono leading-relaxed">
                            {issue.resolution.remarks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Uploaded Images Tab */}
                {activeTab === "images" && (
                  <div className="space-y-4">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Complaint proof Attachments</span>
                    
                    {!issue.attachments || issue.attachments.length === 0 ? (
                      <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-855 rounded-2xl text-center space-y-2">
                        <ImageIcon className="mx-auto text-zinc-300" size={24} />
                        <p className="font-bold text-zinc-400">No attachments uploaded by customer</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {issue.attachments.map((imgUrl, index) => (
                          <div 
                            key={index} 
                            className="relative group aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs cursor-pointer"
                            onClick={() => setPreviewImage(imgUrl)}
                          >
                            <img
                              src={imgUrl}
                              alt={`Issue Proof ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350 select-none"
                            />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                              <button
                                type="button"
                                className="p-2 bg-white text-zinc-900 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(imgUrl);
                                }}
                                title="Zoom View"
                              >
                                <Eye size={13} strokeWidth={2.5} />
                              </button>
                              <a
                                href={imgUrl}
                                download={`issue-proof-${index + 1}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white text-zinc-900 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                title="Download"
                              >
                                <Download size={13} strokeWidth={2.5} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Internal Notes Tab */}
                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Operator Audit logs & Internal Notes</span>
                    
                    {!issue.internalNotes || issue.internalNotes.length === 0 ? (
                      <div className="p-8 border border-zinc-200 dark:border-zinc-855 rounded-2xl text-center text-zinc-400 font-bold">
                        No internal notes recorded.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {issue.internalNotes.map((note, index) => (
                          <div key={index} className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-zinc-850 dark:text-zinc-200">{note.addedBy} ({note.department})</span>
                              <span className="text-[9px] text-zinc-400 font-bold">
                                {note.createdAt ? format(new Date(note.createdAt), "dd MMM, hh:mm a") : ""}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-zinc-550 dark:text-zinc-350 leading-relaxed font-mono">
                              {note.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Timeline Tab */}
                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Ticket lifecycle tracking timeline</span>
                    
                    <div className="relative pl-6 border-l-2 border-zinc-100 dark:border-zinc-855 space-y-6">
                      {issue.timeline?.map((evt, idx) => (
                        <div key={idx} className="relative">
                          {/* Stepper Dot */}
                          <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 bg-[var(--primary)] flex items-center justify-center text-white ring-4 ring-zinc-50/80 dark:ring-zinc-900/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </span>

                          <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{evt.status}</span>
                              <span className="text-[9px] text-zinc-400 font-bold">
                                {evt.timestamp ? format(new Date(evt.timestamp), "dd MMM, hh:mm a") : ""}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-zinc-450 font-semibold">Updated By: {evt.updatedBy}</p>
                            {evt.remarks && (
                              <p className="text-[10px] text-zinc-500 bg-white dark:bg-zinc-950 px-2 py-1.5 rounded border border-zinc-100 dark:border-zinc-900 mt-1 font-mono leading-relaxed">
                                {evt.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="font-black text-zinc-400">Record not found.</span>
            </div>
          )}

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Close Drawer
            </button>
          </footer>

        </div>
      </div>

      {/* Embedded Image Preview Modal */}
      {issue?.attachments && (
        <ImagePreviewModal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          images={issue.attachments}
          initialIndex={issue.attachments.indexOf(previewImage)}
        />
      )}
    </div>
  );
}
