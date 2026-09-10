import React from "react";
import { Modal, Button } from "antd";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useMarkReady } from "../hooks/useActiveOrders";

export default function MarkReadyModal({ visible, onClose, order }) {
  const markReadyMutation = useMarkReady();

  if (!order) return null;

  const handleConfirm = async () => {
    try {
      await markReadyMutation.mutateAsync({ orderId: order._id });
      onClose();
    } catch (error) {
      // Handled by mutation toast
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <CheckCircle2 size={18} className="text-green-500" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Mark Order Ready</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Transition order to dispatch and notify delivery rider</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={420}
      centered
      destroyOnClose
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={markReadyMutation.isPending}
          onClick={handleConfirm}
          className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs flex items-center gap-1.5 inline-flex justify-center"
        >
          Confirm Ready <ArrowRight size={14} />
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        <div className="flex items-start gap-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 p-4 rounded-2xl">
          <AlertTriangle className="text-green-600 mt-0.5 shrink-0 animate-pulse" size={16} />
          <div>
            <p className="text-xs font-bold text-green-800 dark:text-green-400">Complete Kitchen Lifecycle</p>
            <p className="text-[10px] text-green-700/80 dark:text-green-500 font-semibold mt-1">
              Marking order <strong>{order.orderNumber}</strong> as ready will:
            </p>
            <ul className="text-[10px] text-green-700/85 dark:text-green-500 list-disc pl-4 mt-1 space-y-0.5 font-semibold">
              <li>Remove it from the active kitchen board.</li>
              <li>Advance its status to "ready".</li>
              <li>Send a real-time notification to packaging / dispatch desk.</li>
              <li>Notify the customer that their meal is prepared and ready!</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-semibold">
          Are you sure you want to mark this order as fully prepared, baked, and packaged?
        </p>
      </div>
    </Modal>
  );
}
