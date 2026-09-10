import React, { useState } from "react";
import { 
  X, CheckCircle, AlertCircle, Clock, ShoppingBag, Package, 
  User, DollarSign, List, History, SlidersHorizontal, Info 
} from "lucide-react";
import { usePurchaseRequestDetailsQuery } from "../hooks/usePurchaseRequests";
import { mockSuppliers } from "../mockData";

export default function PurchaseRequestDetailsDrawer({ 
  isOpen, onClose, requestId, onApprove, onReject, onReceive 
}) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, items, history, audit

  const { data: detailsResponse, isLoading } = usePurchaseRequestDetailsQuery(requestId);
  const request = detailsResponse?.data;

  if (!isOpen) return null;

  const getPriorityBadge = (p) => {
    switch (p) {
      case "Urgent":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">
            Urgent
          </span>
        );
      case "High":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
            High
          </span>
        );
      case "Medium":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Medium
          </span>
        );
      case "Low":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "Received":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-purple-500/10 text-purple-650 border border-purple-500/20">
            Received
          </span>
        );
      case "Approved":
      case "Ordered":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {s}
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
            Rejected
          </span>
        );
      case "Pending":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
            <Clock size={10} /> Pending
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-zinc-500/10 text-zinc-650 border border-zinc-500/20">
            Draft
          </span>
        );
    }
  };

  const supplier = mockSuppliers.find(s => s._id === request?.vendorId);

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute top-0 bottom-0 right-0 w-full max-w-[700px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in">
        
        {/* Header */}
        {isLoading ? (
          <div className="p-5 border-b border-zinc-150 dark:border-zinc-850 animate-pulse bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/2" />
          </div>
        ) : (
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight flex items-center gap-1.5">
                  <span>{request.requestNumber}</span>
                  {getStatusBadge(request.status)}
                  {getPriorityBadge(request.priority)}
                </h3>
                <p className="text-[10px] text-zinc-450 mt-1">
                  Outlet: <span className="font-bold text-zinc-700 dark:text-zinc-200">{request.storeName}</span> ({request.storeCode}) | Requested by: {request.requesterName}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            {/* Quick action buttons in header */}
            <div className="flex items-center justify-between gap-3 border-t dark:border-zinc-850 pt-3">
              <span className="text-[9.5px] text-zinc-400 font-bold">
                Created: {new Date(request.createdAt).toLocaleString("en-IN")}
              </span>

              <div className="flex items-center gap-2">
                {(request.status === "Pending" || request.status === "Draft") && (
                  <>
                    <button
                      onClick={() => onReject(request)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 rounded-lg font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onApprove(request)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black cursor-pointer shadow-sm"
                    >
                      Approve Requisition
                    </button>
                  </>
                )}
                {request.status === "Approved" && (
                  <button
                    onClick={() => onReceive(request)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Package size={12} /> Mark Received
                  </button>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Navigation Tabs */}
        <nav className="flex border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 px-4">
          {[
            { id: "overview", label: "Overview", icon: Info },
            { id: "items", label: "Requested Items", icon: List },
            { id: "history", label: "Approval History", icon: History },
            { id: "audit", label: "System Audit Logs", icon: SlidersHorizontal }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 font-extrabold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin bg-white dark:bg-zinc-950">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
              <div className="h-32 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-4 font-semibold">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Total Requisition Amount</span>
                      <span className="text-sm font-black text-zinc-850 dark:text-white mt-1 block">
                        ₹{request.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Requisition Items Count</span>
                      <span className="text-sm font-black text-zinc-850 dark:text-white mt-1 block">
                        {request.items.length} Ingredients
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Approval Status</span>
                      <span className="text-xs font-black text-zinc-800 dark:text-white mt-1.5 block">
                        {request.status}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Expected Delivery</span>
                      <span className="text-xs font-black text-zinc-800 dark:text-white mt-1.5 block">
                        {request.expectedDeliveryDate 
                          ? new Date(request.expectedDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "Awaiting approval"}
                      </span>
                    </div>
                  </div>

                  {request.remarks && (
                    <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Requisition remarks</span>
                      <p className="text-[10px] text-zinc-700 dark:text-zinc-350 mt-1 leading-normal">
                        "{request.remarks}"
                      </p>
                    </div>
                  )}

                  {supplier && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-2">
                      <span className="text-[8.5px] uppercase text-emerald-800 dark:text-emerald-450 font-black block">Supplier Assigned</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-650 dark:text-zinc-300">
                        <div>
                          <span className="text-zinc-400 block font-bold">Vendor Name</span>
                          <span className="font-extrabold text-zinc-800 dark:text-white">{supplier.name}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-bold">Contact Person</span>
                          <span className="font-extrabold text-zinc-800 dark:text-white">{supplier.contact}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Items List */}
              {activeTab === "items" && (
                <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] uppercase text-zinc-400 border-b dark:border-zinc-850 font-bold">
                      <tr>
                        <th className="p-3">Ingredient</th>
                        <th className="p-3 text-right">Requested Qty</th>
                        <th className="p-3 text-right">Approved Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold">
                      {request.items.map((item) => (
                        <tr key={item.ingredientId} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10">
                          <td className="p-3 text-zinc-850 dark:text-white leading-tight">
                            <p className="font-extrabold">{item.ingredient?.name}</p>
                            <p className="text-[9px] text-zinc-400 mt-0.5 font-mono">{item.ingredient?.ingredientCode}</p>
                          </td>
                          <td className="p-3 text-right font-mono text-zinc-450">
                            {item.requestedQty} {item.ingredient?.unit}
                          </td>
                          <td className="p-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                            {request.status === "Pending" ? "-" : `${item.approvedQty || 0} ${item.ingredient?.unit}`}
                          </td>
                          <td className="p-3 text-right font-mono text-zinc-600 dark:text-zinc-350">
                            ₹{item.unitPrice}
                          </td>
                          <td className="p-3 text-right font-mono text-zinc-855 dark:text-white font-extrabold">
                            ₹{item.totalPrice.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: History Timeline */}
              {activeTab === "history" && (
                <div className="relative pl-5 border-l border-zinc-150 dark:border-zinc-800 space-y-5 py-2 font-semibold">
                  {request.timeline?.map((evt, idx) => (
                    <div key={evt._id || idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center">
                        <span className={`w-1 h-1 rounded-full ${
                          request.status === "Rejected" && idx === 0 ? "bg-red-500" : "bg-[var(--primary)]"
                        }`} />
                      </span>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{evt.title}</span>
                          <span className="text-zinc-450 font-bold">{new Date(evt.createdAt).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-[9.5px] text-zinc-450 leading-relaxed font-bold">{evt.description}</p>
                        <p className="text-[8px] text-zinc-400 font-bold">Actioned by: {evt.performedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Audit Logs */}
              {activeTab === "audit" && (
                <div className="space-y-3 font-semibold font-mono text-[10px]">
                  {request.timeline?.map((log, idx) => (
                    <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold">
                        <span>EVENT_ID: {log._id}</span>
                        <span>{new Date(log.createdAt).toISOString()}</span>
                      </div>
                      <p className="font-extrabold text-zinc-800 dark:text-white">{log.title}</p>
                      <p className="text-[9.5px] text-zinc-500 font-sans leading-normal">{log.description}</p>
                      <div className="text-[8.5px] font-sans text-zinc-450 flex items-center gap-1.5 pt-1">
                        <User size={10} />
                        <span>Performed by: {log.performedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
