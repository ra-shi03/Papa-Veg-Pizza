import React from "react";
import { Modal, Table, Tag, Button } from "antd";
import { useRefundHistory } from "../hooks/useCancelledOrders";

export default function RefundHistoryModal({
  visible,
  onClose,
  order
}) {
  if (!order) return null;

  const { data: refundAttempts = [], isLoading } = useRefundHistory(order._id);

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

  const columns = [
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

  return (
    <Modal
      title={
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Refund History</h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Order ID: {order.orderNumber} • Audit Log</p>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button
          key="close"
          onClick={onClose}
          className="font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-5 active:scale-95 transition-all text-xs"
        >
          Close
        </Button>
      ]}
      className="rounded-3xl overflow-hidden"
    >
      <div className="py-2">
        <Table
          columns={columns}
          dataSource={refundAttempts}
          rowKey="_id"
          loading={isLoading}
          pagination={false}
          className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden text-xs"
        />
      </div>
    </Modal>
  );
}
