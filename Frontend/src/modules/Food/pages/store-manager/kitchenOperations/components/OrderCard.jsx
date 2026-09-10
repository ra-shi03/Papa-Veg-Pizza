import React from "react";
import {
  Clock,
  User,
  Phone,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Eye,
  Check,
  Flame,
  ArrowRight
} from "lucide-react";
import { Tooltip, Tag } from "antd";

export default function OrderCard({
  order,
  chefs = [],
  onAccept,
  onOpenAssignChef,
  onOpenRejectItem,
  onOpenDetails,
  onMarkPreparing
}) {
  const isOverdue = new Date(order.expectedReadyTime) < new Date() && order.status !== "ready_for_pickup";

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "VIP":
        return "orange";
      case "EXPRESS":
        return "red";
      default:
        return "blue";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toUpperCase()) {
      case "VIP":
      case "EXPRESS":
        return <Flame size={12} className="inline mr-1 animate-pulse" />;
      default:
        return null;
    }
  };

  // Get assigned chef's data
  const assignedChef = chefs.find((c) => c._id === order.assigned_chef);

  // Format date helper
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const visibleItems = order.items?.slice(0, 3) || [];
  const hiddenItemsCount = (order.items?.length || 0) - 3;

  return (
    <div className={`group bg-white dark:bg-zinc-900 border rounded-2.5xl p-3 space-y-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 relative overflow-hidden ${
      isOverdue ? "border-l-4 border-l-rose-500" : ""
    }`}>
      {/* Top Row: Order ID, Priority */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
          #{order.orderNumber || order._id.slice(-6)}
        </span>
        <Tag color={getPriorityColor(order.priority)} className="text-[9px] font-black border-0 px-2 py-0.5 rounded-full flex items-center">
          {getPriorityIcon(order.priority)}
          {order.priority || "NORMAL"}
        </Tag>
      </div>

      {/* Customer Info */}
      <div className="text-[10px] space-y-0.5 text-slate-500 dark:text-zinc-400 font-bold">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
          <User size={10} className="text-slate-400" />
          <span className="truncate">{order.customer?.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone size={10} className="text-slate-400" />
          <span>{order.customer?.phone}</span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="border-y border-slate-50 dark:border-zinc-850 py-1.5 space-y-1">
        {visibleItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start text-[10px] font-extrabold text-slate-800 dark:text-zinc-200">
            <span className="truncate max-w-[130px]">
              {item.quantity} × {item.name}
            </span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-850 px-1.5 py-0.2 rounded shrink-0 ml-1">
              {item.size}
            </span>
          </div>
        ))}
        {hiddenItemsCount > 0 && (
          <p className="text-[9px] font-black text-[var(--primary)] text-right pt-0.5">
            +{hiddenItemsCount} more items
          </p>
        )}
      </div>

      {/* Timings */}
      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-zinc-550">
        <div className="flex items-center gap-1">
          <Clock size={10} />
          <span>Order: {formatTime(order.createdAt)}</span>
        </div>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
          isOverdue 
            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-extrabold border border-rose-100 dark:border-rose-900/30" 
            : ""
        }`}>
          <span>Ready: {formatTime(order.expectedReadyTime)}</span>
        </div>
      </div>

      {/* Special Instructions (Tooltip) */}
      {order.specialInstructions && (
        <Tooltip title={order.specialInstructions}>
          <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-zinc-950 p-1.5 rounded-xl text-[9px] text-slate-500 dark:text-zinc-450 truncate cursor-pointer font-bold border border-slate-100/50 dark:border-zinc-850/50">
            <MessageSquare size={10} className="mt-0.5 text-slate-400 shrink-0" />
            <span className="truncate">{order.specialInstructions}</span>
          </div>
        </Tooltip>
      )}

      {/* Assigned Chef Row */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-zinc-850">
        <div className="flex items-center gap-1.5">
          {assignedChef ? (
            <>
              <img
                src={assignedChef.avatar}
                alt={assignedChef.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-zinc-850"
              />
              <span className="text-[9px] font-extrabold text-slate-700 dark:text-zinc-350">
                {assignedChef.name.split(" ").slice(-1)[0]}
              </span>
            </>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 flex items-center gap-1">
              <UserCheck size={10} />
              Not Assigned
            </span>
          )}
        </div>

        {order.status !== "confirmed" && (
          <button
            onClick={() => onOpenAssignChef(order)}
            className="text-[9px] font-black text-[var(--secondary)] hover:text-[var(--sa-secondary-hover)] cursor-pointer"
          >
            {assignedChef ? "Change Chef" : "+ Assign Chef"}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5 pt-1">
        {/* View Details always available */}
        <button
          onClick={() => onOpenDetails(order)}
          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-350 font-black rounded-xl text-[10px] transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
        >
          <Eye size={10} />
          Details
        </button>

        {/* Reject Item always available for fine tuning */}
        <button
          onClick={() => onOpenRejectItem(order)}
          className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/35 text-rose-600 dark:text-rose-450 font-black rounded-xl text-[10px] transition-all flex items-center justify-center cursor-pointer"
          title="Reject Item"
        >
          <AlertTriangle size={10} />
        </button>

        {/* Conditional status triggers */}
        {order.status === "confirmed" && (
          <button
            onClick={() => onAccept(order._id)}
            className="flex-1 py-1.5 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white font-black rounded-xl text-[10px] transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            <Check size={10} />
            Accept
          </button>
        )}

        {order.status === "queued" && (
          <button
            onClick={() => onMarkPreparing(order._id)}
            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            Start Prep
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
