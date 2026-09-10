import React from "react";
import { Drawer, Tabs, Table, Tag, Divider, Button, Timeline, Alert } from "antd";
import {
  User,
  MapPin,
  Pizza,
  History,
  CreditCard,
  Phone,
  Mail,
  Coins,
  Clock,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Receipt,
  FileText,
  HelpCircle
} from "lucide-react";
import { useRefundHistory } from "../hooks/useCancelledOrders";

export default function CancelledOrderDetailsDrawer({
  visible,
  onClose,
  order,
  role,
  onInitiateRefund,
  onReopenOrder,
}) {
  if (!order) return null;

  const isManager = role === "store_manager";
  const { data: refundAttempts = [], isLoading: isLoadingRefunds } = useRefundHistory(order._id);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const isReopenEligible = () => {
    const cancelledAtDate = new Date(order.cancelledAt || order.updatedAt);
    const timeDiffMins = (new Date() - cancelledAtDate) / 60000;
    const isTimeEligible = timeDiffMins <= 5;
    const isKitchenNotStarted = order.status !== "preparing" && order.status !== "baking" && order.status !== "packaging" && order.status !== "ready";
    return isTimeEligible && isKitchenNotStarted;
  };

  const getCancellationTypeTag = (type) => {
    switch (type?.toLowerCase()) {
      case "customer":
        return <Tag color="volcano" className="font-bold border-0 px-2 py-0.5 rounded-full uppercase">Customer Cancelled</Tag>;
      case "store":
        return <Tag color="orange" className="font-bold border-0 px-2 py-0.5 rounded-full uppercase">Store Rejected</Tag>;
      case "system":
        return <Tag color="red" className="font-bold border-0 px-2 py-0.5 rounded-full uppercase">System Cancelled</Tag>;
      default:
        return <Tag className="font-bold border-0 px-2 py-0.5 rounded-full uppercase">{type || "Unknown"}</Tag>;
    }
  };

  const getRefundStatusTag = (status) => {
    switch (status?.toLowerCase()) {
      case "refund_pending":
      case "pending":
        return <Tag color="processing" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize">Refund Pending</Tag>;
      case "refund_completed":
      case "completed":
        return <Tag color="success" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize">Refund Completed</Tag>;
      case "refund_failed":
      case "failed":
        return <Tag color="error" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize">Refund Failed</Tag>;
      case "none":
      default:
        return <Tag color="default" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize">No Refund</Tag>;
    }
  };

  // Refund attempts table columns
  const refundColumns = [
    {
      title: <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">Refund ID</span>,
      dataIndex: "_id",
      key: "_id",
      render: (text) => <span className="font-mono text-xs">{text}</span>
    },
    {
      title: <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">Amount</span>,
      dataIndex: "amount",
      key: "amount",
      render: (val) => <span className="font-extrabold text-xs">{formatCurrency(val)}</span>
    },
    {
      title: <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">Method</span>,
      dataIndex: "refundMethod",
      key: "refundMethod",
      render: (text) => <span className="capitalize text-xs font-semibold">{text?.replace("_", " ")}</span>
    },
    {
      title: <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">Status</span>,
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "completed") color = "success";
        if (status === "pending") color = "processing";
        if (status === "failed") color = "error";
        return <Tag color={color} className="font-bold border-0 px-2 py-0.5 rounded-full capitalize">{status}</Tag>;
      }
    },
    {
      title: <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">Reference No.</span>,
      dataIndex: "referenceNumber",
      key: "referenceNumber",
      render: (text) => <span className="font-mono text-xs text-zinc-400">{text || "N/A"}</span>
    },
    {
      title: <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">Processed By</span>,
      dataIndex: "processedBy",
      key: "processedBy",
      render: (text) => <span className="font-bold text-xs">{text}</span>
    },
    {
      title: <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300">Date</span>,
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => <span className="text-xs text-zinc-400 font-medium">{formatDate(text)}</span>
    }
  ];

  const tabItems = [
    {
      key: "customer",
      label: <span className="flex items-center gap-1.5 font-bold"><User size={14} /> Customer Info</span>,
      children: (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800">
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Profile Data</h4>
              <div className="space-y-3 font-semibold text-xs text-slate-700 dark:text-zinc-300">
                <p className="flex items-center gap-2"><User size={13} className="text-zinc-400" /> <span className="text-slate-900 dark:text-white font-extrabold">{order.customer?.name}</span></p>
                <p className="flex items-center gap-2"><Phone size={13} className="text-zinc-400" /> <span>{order.customer?.phone}</span></p>
                <p className="flex items-center gap-2"><Mail size={13} className="text-zinc-400" /> <span>{order.customer?.email || "No Email Provided"}</span></p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Loyalty & History</h4>
              <div className="space-y-3 font-semibold text-xs text-slate-700 dark:text-zinc-300">
                <p className="flex items-center gap-2"><Coins size={13} className="text-amber-500" /> <span>Loyalty Points: <strong className="text-slate-800 dark:text-zinc-200">{order.customer?.loyaltyPoints || 0}</strong></span></p>
                <p className="flex items-center gap-2"><History size={13} className="text-blue-500" /> <span>Previous Orders Count: <strong className="text-slate-800 dark:text-zinc-200">{order.customer?.previousOrdersCount || 0}</strong></span></p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Address</h4>
            <div className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                {order.deliveryAddress ? (
                  <>
                    <p className="text-slate-800 dark:text-zinc-200 font-extrabold">{order.deliveryAddress.houseNumber}, {order.deliveryAddress.street}</p>
                    <p>{order.deliveryAddress.landmark}</p>
                    <p>{order.deliveryAddress.city} - {order.deliveryAddress.pincode}</p>
                    {order.deliveryAddress.notes && <p className="italic text-[10px] text-zinc-450 mt-1">Note: {order.deliveryAddress.notes}</p>}
                  </>
                ) : (
                  <p>No delivery address logged (Self-Pickup order).</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "timeline",
      label: <span className="flex items-center gap-1.5 font-bold"><Clock size={14} /> Timeline</span>,
      children: (
        <div className="space-y-6 pt-4">
          <div className="flex gap-4 items-center bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <div>
              <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-wide">Cancelled By</p>
              <div className="mt-1">{getCancellationTypeTag(order.cancelledBy)}</div>
            </div>
            <Divider type="vertical" className="h-10 border-zinc-200 dark:border-zinc-800" />
            <div>
              <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-wide">Cancelled At</p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 mt-1">{formatDate(order.cancelledAt || order.updatedAt)}</p>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-2xl">
            <Timeline className="pt-2 font-semibold text-xs">
              {order.timeline?.map((evt, idx) => (
                <Timeline.Item
                  key={idx}
                  color={evt.status === "cancelled" || evt.status === "rejected" ? "red" : evt.status.includes("refund") ? "blue" : "green"}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-zinc-200 capitalize">{evt.status.replace("_", " ")}</p>
                      <p className="text-[10px] text-zinc-450 mt-0.5">{evt.note}</p>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 shrink-0">{formatDate(evt.timestamp)}</span>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        </div>
      )
    },
    {
      key: "payment",
      label: <span className="flex items-center gap-1.5 font-bold"><CreditCard size={14} /> Payment Details</span>,
      children: (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Transaction Info</h4>
              <div className="grid grid-cols-2 gap-y-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span>Transaction ID:</span>
                <span className="font-mono text-slate-900 dark:text-white font-extrabold">{order.transactionId || "N/A"}</span>
                
                <span>Payment Gateway:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-250">{order.paymentGateway || "N/A"}</span>
                
                <span>Payment Method:</span>
                <span className="font-bold text-slate-850 dark:text-zinc-200">{order.paymentMethod}</span>
                
                <span>Amount Paid:</span>
                <span className="font-black text-slate-900 dark:text-white">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Refund Info</h4>
              <div className="grid grid-cols-2 gap-y-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span>Refund Status:</span>
                <span>{getRefundStatusTag(order.refundStatus)}</span>
                
                <span>Refunded Amount:</span>
                <span className="font-black text-red-500">{formatCurrency(order.refundAmount)}</span>
                
                <span>Refund TXN ID:</span>
                <span className="font-mono text-zinc-400">{order.refundTransactionId || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "refunds",
      label: <span className="flex items-center gap-1.5 font-bold"><Receipt size={14} /> Refund History</span>,
      children: (
        <div className="pt-4 space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Refund Attempts Table</h4>
          <Table
            columns={refundColumns}
            dataSource={refundAttempts}
            rowKey="_id"
            loading={isLoadingRefunds}
            pagination={false}
            className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden text-xs"
          />
        </div>
      )
    },
    {
      key: "notes",
      label: <span className="flex items-center gap-1.5 font-bold"><MessageSquare size={14} /> Internal Notes</span>,
      children: (
        <div className="space-y-6 pt-4">
          <div className="space-y-4 bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancellation Reason</p>
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-150 dark:border-red-950">
                {order.cancelReason || "No cancellation reason logged."}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System/Staff Notes</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-1 p-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850">
                {order.notes || "No notes logged for this cancellation."}
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const canReopen = isReopenEligible() && order.status !== "awaiting_confirmation";
  const canRefund = isManager && order.paymentMethod !== "COD" && order.refundStatus !== "refund_completed" && order.refundStatus !== "refund_pending";

  return (
    <Drawer
      title={
        <div className="flex justify-between items-center w-full pr-8">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Cancelled Order Details</h3>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Order ID: {order.orderNumber}</p>
          </div>
          <div className="flex gap-1.5 items-center">
            {getCancellationTypeTag(order.cancelledBy)}
            {getRefundStatusTag(order.refundStatus)}
          </div>
        </div>
      }
      placement="right"
      width={1200}
      onClose={onClose}
      open={visible}
      footer={
        <div className="flex justify-between items-center px-4 py-2 border-t border-zinc-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40">
          <div>
            {canReopen && (
              <Tag color="purple" className="font-extrabold text-[9px] uppercase border-0 px-2 py-0.5 rounded-full">
                Reopen Eligible
              </Tag>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 active:scale-95 transition-all cursor-pointer text-xs"
              onClick={onClose}
            >
              Close
            </Button>
            
            {canRefund && (
              <Button
                type="primary"
                danger
                className="font-bold rounded-full px-4 active:scale-95 transition-all cursor-pointer text-xs flex items-center gap-1 shadow-md shadow-red-500/10"
                onClick={() => onInitiateRefund(order)}
              >
                Initiate Refund
              </Button>
            )}

            {isManager && canReopen && (
              <Button
                type="primary"
                className="font-bold !bg-purple-600 hover:!bg-purple-500 border-0 !text-white rounded-full px-4 active:scale-95 transition-all cursor-pointer text-xs flex items-center gap-1 shadow-md shadow-purple-600/10"
                onClick={() => onReopenOrder(order)}
              >
                Reopen Order
              </Button>
            )}
          </div>
        </div>
      }
    >
      <Tabs defaultActiveKey="customer" items={tabItems} className="cancelled-details-tabs" />
    </Drawer>
  );
}
