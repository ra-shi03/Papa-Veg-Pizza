import React from "react";
import { Modal, Tabs, Tag } from "antd";
import {
  User,
  MapPin,
  ClipboardList,
  CreditCard,
  Phone,
  Mail,
  Utensils,
  IndianRupee,
  Clock,
  MessageSquare
} from "lucide-react";
import TimelineStepper from "./TimelineStepper";

export default function OrderDetailsModal({
  visible,
  onClose,
  order,
  onAccept,
  onAssignChef,
  onStartPreparation,
  onCancelOrder
}) {
  if (!order) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "VIP":
        return "gold";
      case "EXPRESS":
        return "red";
      default:
        return "blue";
    }
  };

  // Setup tabs
  const tabItems = [
    {
      key: "customer",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <User size={14} />
          Customer
        </span>
      ),
      children: (
        <div className="space-y-4 py-2 text-xs">
          <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Name</span>
              <span className="text-slate-900 dark:text-white font-extrabold">{order.customer?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Phone</span>
              <span className="text-slate-900 dark:text-white font-extrabold flex items-center gap-1">
                <Phone size={12} className="text-slate-400" />
                {order.customer?.phone}
              </span>
            </div>
            {order.customer?.email && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Email</span>
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  {order.customer?.email}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold mb-1">
              <MapPin size={14} className="text-[var(--primary)]" />
              <span>Delivery Address</span>
            </div>
            <p className="text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
              {order.customer?.deliveryAddress?.houseNumber}, {order.customer?.deliveryAddress?.street}
              {order.customer?.deliveryAddress?.landmark && `, ${order.customer?.deliveryAddress?.landmark}`}
              {`, ${order.customer?.deliveryAddress?.city} - ${order.customer?.deliveryAddress?.pincode}`}
            </p>
            {order.customer?.deliveryAddress?.notes && (
              <div className="mt-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 p-2 rounded-xl text-[10px] font-bold border border-yellow-100 dark:border-yellow-900/30 flex gap-1.5 items-start">
                <MessageSquare size={12} className="mt-0.5 shrink-0" />
                <span>Notes: {order.customer?.deliveryAddress?.notes}</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "items",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <Utensils size={14} />
          Items ({order.items?.length || 0})
        </span>
      ),
      children: (
        <div className="py-2 text-xs space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {order.items?.map((item, idx) => (
            <div key={item.orderItemId || idx} className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-slate-900 dark:text-white font-extrabold text-sm">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Size: <span className="font-extrabold text-slate-700 dark:text-zinc-300">{item.size}</span> | Crust: <span className="font-extrabold text-slate-700 dark:text-zinc-300">{item.crust}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full mr-2">
                    Qty: {item.quantity}
                  </span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>

              {item.toppings?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.toppings.map((t, tIdx) => (
                    <span key={tIdx} className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                      +{t}
                    </span>
                  ))}
                </div>
              )}

              {item.specialInstructions && (
                <div className="bg-slate-200/50 dark:bg-zinc-800/50 p-2 rounded-xl text-[10px] text-slate-600 dark:text-zinc-400 font-medium">
                  <span className="font-bold text-slate-800 dark:text-zinc-300">Instr:</span> {item.specialInstructions}
                </div>
              )}
            </div>
          ))}

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center px-1">
            <span className="font-extrabold text-slate-500 dark:text-zinc-400">Total Bill Amount</span>
            <span className="font-black text-base text-[var(--primary)]">{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      )
    },
    {
      key: "timeline",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <Clock size={14} />
          Timeline
        </span>
      ),
      children: (
        <div className="py-2">
          <TimelineStepper timeline={order.timeline} currentStatus={order.status} />
        </div>
      )
    },
    {
      key: "payment",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <CreditCard size={14} />
          Payment
        </span>
      ),
      children: (
        <div className="space-y-4 py-2 text-xs">
          <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Method</span>
              <span className="text-slate-900 dark:text-white font-extrabold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                {order.paymentMethod}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Payment Status</span>
              <span className={`font-extrabold px-2.5 py-0.5 rounded-full border ${
                order.paymentStatus === "paid"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
              }`}>
                {order.paymentStatus?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Transaction ID</span>
              <span className="text-slate-900 dark:text-white font-bold font-mono text-[10px]">
                {order.transactionId || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-850">
              <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Amount Charged</span>
              <span className="text-slate-900 dark:text-white font-black text-sm">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              Order {order.orderNumber}
            </span>
            <Tag color={getPriorityColor(order.priority)} className="font-extrabold text-[10px] uppercase border-0 px-2 py-0.5 rounded-full">
              {order.priority || "NORMAL"}
            </Tag>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
            Status: {order.status}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={480}
      className="compact-modal"
      centered
      footer={
        <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>

          {order.status === "confirmed" && (
            <button
              onClick={() => {
                onAccept(order._id);
                onClose();
              }}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              Accept Order
            </button>
          )}

          {order.status !== "confirmed" && (
            <button
              onClick={() => {
                onAssignChef(order);
                onClose();
              }}
              className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--sa-secondary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              {order.assigned_chef ? "Reassign Chef" : "Assign Chef"}
            </button>
          )}

          {order.status === "queued" && (
            <button
              onClick={() => {
                onStartPreparation(order._id);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              Start Preparation
            </button>
          )}

          {order.status !== "preparing" && order.status !== "ready_for_pickup" && order.status !== "cancelled" && (
            <button
              onClick={() => {
                onCancelOrder(order._id);
                onClose();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              Cancel Order
            </button>
          )}
        </div>
      }
    >
      <Tabs defaultActiveKey="customer" items={tabItems} className="details-tabs mt-1" />
    </Modal>
  );
}
