import React from "react";
import { Modal, Button } from "antd";
import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmationModal({ visible, title = "Confirm Deletion", message, onConfirm, onCancel, loading }) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 text-slate-800 dark:text-white border-b border-zinc-100 dark:border-zinc-800">
          <AlertTriangle size={18} className="text-rose-500" />
          <span className="text-sm font-extrabold uppercase tracking-wide">{title}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button 
          key="cancel" 
          onClick={onCancel}
          disabled={loading}
          className="border-zinc-255 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl h-10 px-5 cursor-pointer"
        >
          Cancel
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          onClick={onConfirm}
          loading={loading}
          className="bg-rose-600 border-rose-605 hover:bg-rose-700 text-white font-bold rounded-xl h-10 px-5 cursor-pointer"
        >
          Delete
        </Button>
      ]}
      centered
      width={400}
      className="reports-modal dark:bg-zinc-900 font-semibold"
    >
      <div className="py-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300 leading-normal">
        {message || "Are you sure you want to delete this item? This action is permanent and cannot be undone."}
      </div>
    </Modal>
  );
}
