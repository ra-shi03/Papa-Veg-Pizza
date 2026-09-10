import React from "react";
import { Play, ClipboardCheck, Lock, Check, Printer, ExternalLink, ChefHat } from "lucide-react";
import { Tooltip } from "antd";
import PackagingStatusBadge from "./PackagingStatusBadge";

export default function PackagingTable({
  orders = [],
  staff = [],
  isLoading,
  onOpenStart,
  onOpenChecklist,
  onOpenSeal,
  onOpenReady,
  onOpenPrint
}) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeStaff = Array.isArray(staff) ? staff : [];

  const getStaffData = (staffId) => {
    return safeStaff.find((s) => s._id === staffId);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      return new Date(timeStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return "-";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
      
      {/* Desktop/Tablet Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px] sticky top-0">
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Fulfillment</th>
              <th className="py-3.5 px-4">Customer Name</th>
              <th className="py-3.5 px-4">Items Summary</th>
              <th className="py-3.5 px-4">QA Officer</th>
              <th className="py-3.5 px-4">Started At</th>
              <th className="py-3.5 px-4">Ended At</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-12" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-36" /></td>
                  <td className="py-4 px-4"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-full w-24" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-24 ml-auto" /></td>
                </tr>
              ))
            ) : safeOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-400 dark:text-zinc-550 font-bold">
                  No orders waiting for packaging.
                </td>
              </tr>
            ) : (
              safeOrders.map((order) => {
                const staffMember = getStaffData(order.assigned_staff);
                
                // Items text mapping
                const maxItems = 3;
                const visibleItems = order.items?.slice(0, maxItems) || [];
                const extraItemsCount = (order.items?.length || 0) - maxItems;

                return (
                  <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300">
                    <td className="py-3.5 px-4">
                      <span className="text-[var(--primary)] cursor-pointer hover:underline flex items-center gap-0.5 font-black">
                        #{order.orderNumber}
                        <ExternalLink size={10} className="text-slate-400" />
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                        order.deliveryType === "Delivery"
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-100"
                          : order.deliveryType === "Takeaway"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100"
                      }`}>
                        {order.deliveryType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">{order.customer?.name}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        {visibleItems.map((it, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[180px]">
                            {it.quantity} × {it.name} ({it.size})
                          </span>
                        ))}
                        {extraItemsCount > 0 && (
                          <span className="text-[9px] text-[var(--primary)] font-black">+{extraItemsCount} more items</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {staffMember ? (
                        <div className="flex items-center gap-1.5">
                          <img src={staffMember.avatar} alt={staffMember.name} className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-800" />
                          <span className="text-[10px] truncate max-w-[80px]">{staffMember.name.split(" ").slice(-1)[0]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-450 flex items-center gap-1 text-[10px] font-medium">
                          <ChefHat size={10} />
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-semibold">{formatTime(order.packaging_start_time)}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-semibold">{formatTime(order.packaging_end_time)}</td>
                    <td className="py-3.5 px-4">
                      <PackagingStatusBadge status={order.packaging_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Thermal Print */}
                        <Tooltip title="Print Receipt Label">
                          <button
                            onClick={() => onOpenPrint(order)}
                            className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-350 rounded-xl cursor-pointer transition-all border border-slate-150/50 dark:border-zinc-800"
                          >
                            <Printer size={13} />
                          </button>
                        </Tooltip>

                        {/* Status workflow triggers */}
                        {order.packaging_status === "ready_for_packaging" && (
                          <button
                            onClick={() => onOpenStart(order)}
                            className="h-8 px-3 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                          >
                            <Play size={10} fill="white" />
                            <span>Pack</span>
                          </button>
                        )}

                        {order.packaging_status === "packaging_started" && (
                          <button
                            onClick={() => onOpenChecklist(order)}
                            className="h-8 px-3 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                          >
                            <ClipboardCheck size={12} />
                            <span>QA Check</span>
                          </button>
                        )}

                        {order.packaging_status === "quality_checked" && (
                          <button
                            onClick={() => onOpenSeal(order)}
                            className="h-8 px-3 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider animate-pulse"
                          >
                            <Lock size={10} />
                            <span>Seal Box</span>
                          </button>
                        )}

                        {order.packaging_status === "sealed" && (
                          <button
                            onClick={() => onOpenReady(order)}
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                          >
                            <Check size={11} className="stroke-[3]" />
                            <span>Ready</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid Layout */}
      <div className="block md:hidden p-3 space-y-3 bg-slate-50/50 dark:bg-zinc-950/20">
        {isLoading ? (
          [1, 2].map((n) => (
            <div key={n} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2.5xl p-3.5 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-16" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-10" />
              </div>
              <div className="h-3.5 bg-slate-250 dark:bg-zinc-850 rounded w-full pt-1" />
              <div className="h-3 bg-slate-250 dark:bg-zinc-850 rounded w-2/3" />
            </div>
          ))
        ) : safeOrders.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-zinc-550 font-bold">
            No orders waiting for packaging.
          </div>
        ) : (
          safeOrders.map((order) => {
            const staffMember = getStaffData(order.assigned_staff);
            return (
              <div
                key={order._id}
                className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2.5xl p-3.5 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-900 dark:text-white">
                    #{order.orderNumber}
                  </span>
                  <PackagingStatusBadge status={order.packaging_status} />
                </div>

                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{order.customer?.name}</h4>
                      <p className="text-[9px] font-bold text-slate-450 mt-0.5">{order.deliveryType} fulfillment</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400">
                      {order.items?.length || 0} Items
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="text-[10px] font-medium text-slate-600 dark:text-zinc-300">
                        {it.quantity} × {it.name} ({it.size})
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] border-t border-slate-50 dark:border-zinc-850/50 pt-2 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {staffMember ? (
                      <>
                        <img src={staffMember.avatar} alt={staffMember.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                        <span className="font-extrabold">{staffMember.name.split(" ").slice(-1)[0]}</span>
                      </>
                    ) : (
                      <span>Unassigned</span>
                    )}
                  </div>
                  
                  <span className="text-[9px] font-black text-slate-400 uppercase">
                    Started: {formatTime(order.packaging_start_time)}
                  </span>
                </div>

                {/* Mobile actions */}
                <div className="flex gap-1.5 pt-2 border-t border-slate-50 dark:border-zinc-850/50">
                  <button
                    onClick={() => onOpenPrint(order)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 text-slate-655 dark:text-zinc-350 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                    title="Print Label"
                  >
                    <Printer size={11} />
                  </button>

                  {order.packaging_status === "ready_for_packaging" && (
                    <button
                      onClick={() => onOpenStart(order)}
                      className="flex-1 py-1.5 bg-[var(--primary)] text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play size={10} fill="white" />
                      Start Packaging
                    </button>
                  )}

                  {order.packaging_status === "packaging_started" && (
                    <button
                      onClick={() => onOpenChecklist(order)}
                      className="flex-1 py-1.5 bg-[var(--primary)] text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardCheck size={11} />
                      Verify QA Checklist
                    </button>
                  )}

                  {order.packaging_status === "quality_checked" && (
                    <button
                      onClick={() => onOpenSeal(order)}
                      className="flex-1 py-1.5 bg-[var(--primary)] text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                    >
                      <Lock size={10} />
                      Seal Package Box
                    </button>
                  )}

                  {order.packaging_status === "sealed" && (
                    <button
                      onClick={() => onOpenReady(order)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check size={11} className="stroke-[3]" />
                      Ready for Pickup
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
