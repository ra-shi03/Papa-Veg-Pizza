import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { useDeleteReport } from "../hooks/useSalesReport";
import { toast } from "sonner";

export default function DeleteConfirmationModal({ isOpen, reportId, onClose }) {
  const deleteReportMutation = useDeleteReport();

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      await deleteReportMutation.mutateAsync(reportId);
      toast.success("Sales report deleted successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to delete sales report");
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden text-xs">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-red-500 text-white rounded-lg">
                <AlertTriangle size={12} />
              </span>
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                Delete Report
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={13} />
            </button>
          </header>

          {/* Body */}
          <div className="p-4 space-y-2 text-center">
            <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
              Are you sure you want to delete this report?
            </p>
            <p className="text-[10px] text-zinc-400 leading-normal">
              This action is permanent and will remove the generated report log entry (ID: <span className="font-mono font-black text-slate-700 dark:text-zinc-300">{reportId}</span>) from the system.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer text-zinc-800 dark:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteReportMutation.isPending}
              className="px-3.5 py-1.5 text-white font-black rounded-lg shadow bg-red-500 hover:bg-red-650 cursor-pointer disabled:opacity-50"
            >
              Delete
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
