import React from "react";
import { Drawer, Tag, Switch, Button, Divider } from "antd";
import { Calendar, Mail, FileText, Clock, ToggleLeft, Edit, AlertCircle } from "lucide-react";

export default function ScheduleDetailsDrawer({ visible, schedule, onClose, onEdit, onToggleActive }) {
  if (!schedule) return null;

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[var(--primary)]" />
          <span className="text-sm font-extrabold uppercase tracking-wide">Schedule Details</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      size={400}
      extra={
        <Button 
          type="primary" 
          onClick={() => { onEdit(schedule); onClose(); }}
          className="bg-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-lg px-3 py-1 flex items-center gap-1 cursor-pointer"
        >
          <Edit size={12} />
          <span>Edit</span>
        </Button>
      }
      className="dark:bg-zinc-950 font-semibold"
    >
      <div className="space-y-6 text-xs text-zinc-700 dark:text-zinc-300">
        
        {/* Core status summary */}
        <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl">
          <div>
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Active Status</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-200 mt-0.5 block">
              {schedule.active ? "Currently Active" : "Disabled / Inactive"}
            </span>
          </div>
          <Switch 
            checked={schedule.active} 
            onChange={() => onToggleActive(schedule._id)} 
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 block mb-0.5">Report Type</span>
            <span className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <FileText size={14} className="text-zinc-400" />
              {schedule.reportType}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 block mb-0.5">Run Loop Frequency</span>
            <Tag color="purple" className="font-extrabold text-[10px] uppercase border-0 px-2 py-0.5 rounded">
              {schedule.frequency}
            </Tag>
          </div>

          <div>
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 block mb-0.5">Output Format</span>
            <Tag className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-750 font-black text-[9px] uppercase px-2 py-0.5 rounded">
              {schedule.format}
            </Tag>
          </div>

          <Divider className="my-2" />

          <div>
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 block mb-1">Email Recipients</span>
            <div className="flex flex-col gap-1.5">
              {schedule.emailRecipients?.map(email => (
                <div key={email} className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
                  <Mail size={12} className="text-zinc-400" />
                  <span>{email}</span>
                </div>
              ))}
              {(!schedule.emailRecipients || schedule.emailRecipients.length === 0) && (
                <span className="text-zinc-400 italic">No emails configured.</span>
              )}
            </div>
          </div>

          <Divider className="my-2" />

          <div className="space-y-3">
            <div>
              <span className="text-[9px] font-extrabold uppercase text-zinc-400 block mb-0.5">Next Run Scheduled</span>
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <Clock size={12} className="text-zinc-400" />
                {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "--"}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-extrabold uppercase text-zinc-400 block mb-0.5">Last Successful Run</span>
              <span className="font-bold text-zinc-500">
                {schedule.lastRun && schedule.lastRun !== "--" 
                  ? new Date(schedule.lastRun).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "Never executed yet"}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-extrabold uppercase text-zinc-400 block mb-0.5">Delivery Method Dispatch</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                {schedule.deliveryMethod || "Both"}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6">
          <div className="flex items-start gap-1.5 p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl text-[10px] text-zinc-400 leading-normal">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>Updates to this schedule will recalculate the Next Run interval based on the frequency loop immediately.</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
