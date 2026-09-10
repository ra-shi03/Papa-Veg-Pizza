import React from "react";
import { Modal } from "antd";
import { Trash2, Smartphone, Mail, Info } from "lucide-react";
import dayjs from "dayjs";

export default function DeleteNotificationModal({ open, onCancel, onConfirm, notification }) {
  if (!notification) return null;

  // Render channel labels
  const getChannelText = (types) => {
    if (!types) return "None";
    return types.join(", ");
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={450}
      centered
      className="font-['Poppins']"
    >
      <div className="flex flex-col items-center text-center p-2 font-['Poppins']">
        <div className="p-3 rounded-full bg-rose-50 text-rose-500 mb-4 animate-bounce shadow-sm">
          <Trash2 className="h-8 w-8" />
        </div>
        
        <h3 className="text-base font-black text-rose-600 mb-2 uppercase tracking-wide">
          Warning: Delete Notification
        </h3>
        
        <p className="text-zinc-650 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
          Are you sure you want to permanently delete the notification campaign <span className="font-bold text-slate-905 dark:text-white">"{notification.title}"</span>?
          This action cannot be undone and will delete all associated logs.
        </p>

        {/* Info panel */}
        <div className="w-full bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3.5 mb-6 text-left space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-zinc-400 uppercase">Notification Title:</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{notification.title}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-zinc-400 uppercase">Channels:</span>
            <span className="font-bold text-slate-900 dark:text-white uppercase font-mono bg-zinc-150 dark:bg-zinc-800 px-2 py-0.5 rounded">
              {getChannelText(notification.notificationType)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-zinc-400 uppercase">Audience Target:</span>
            <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded capitalize">
              {notification.targetAudience}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-zinc-400 uppercase">Scheduled Date:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {notification.scheduleTime ? dayjs(notification.scheduleTime).format("DD MMM YYYY, hh:mm A") : "Immediate"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-[10px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase rounded-lg transition-all text-[10px] cursor-pointer shadow-md"
          >
            Delete Campaign
          </button>
        </div>
      </div>
    </Modal>
  );
}
