import React, { useState, useEffect } from "react";
import { Modal, Radio, Avatar, Skeleton } from "antd";
import { UserCheck, Briefcase, Award } from "lucide-react";
import { useActiveStaff } from "../hooks/useDelayedOrders";

export default function ReassignStaffModal({ visible, onClose, order, onConfirm }) {
  const { data: staffList = [], isLoading } = useActiveStaff();
  const safeStaffList = Array.isArray(staffList) ? staffList : [];
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    if (order) {
      setSelectedStaffId(order.assigned_staff || "");
    }
  }, [order, visible]);

  if (!order) return null;

  const handleConfirm = () => {
    if (!selectedStaffId) return;
    onConfirm({
      orderId: order._id,
      staffId: selectedStaffId
    });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <UserCheck size={18} className="text-[var(--primary)] animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Reassign Staff</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Reassign Order #{order.orderNumber} to another active staff member
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={420}
      centered
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStaffId || selectedStaffId === order.assigned_staff}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              selectedStaffId && selectedStaffId !== order.assigned_staff
                ? "bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)]"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            Reassign
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Order Details card */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              Current Stage: <span className="uppercase text-[var(--primary)]">{order.status}</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Delay: {order.delay_duration} mins • Expected: {new Date(order.expectedReadyTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Priority</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
              order.priority === "VIP" ? "bg-amber-50 text-amber-700 border border-amber-100" :
              order.priority === "EXPRESS" ? "bg-rose-50 text-rose-700 border border-rose-100" :
              "bg-slate-100 text-slate-700"
            }`}>{order.priority}</span>
          </div>
        </div>

        {/* Staff Selection List */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Select Active Staff Member
          </label>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton.Input active size="small" block />
              <Skeleton.Input active size="small" block />
              <Skeleton.Input active size="small" block />
            </div>
          ) : safeStaffList.length === 0 ? (
            <p className="text-slate-400 dark:text-zinc-500 font-bold py-4 text-center">No active staff members found.</p>
          ) : (
            <Radio.Group
              className="w-full flex flex-col gap-2"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            >
              {safeStaffList.map((s) => {
                const isCurrent = s._id === order.assigned_staff;
                const workload = s.currentWorkload || 0;
                const maxLoad = s.maxWorkload || 4;
                const isBusy = s.availability === "busy" || workload >= maxLoad;

                return (
                  <label
                    key={s._id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      selectedStaffId === s._id
                        ? "bg-slate-50 dark:bg-zinc-850/50 border-[var(--primary)]"
                        : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-850/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio value={s._id} disabled={isCurrent} />
                      <Avatar src={s.avatar} size="small" className="border border-slate-100 dark:border-zinc-800" />
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {isCurrent && (
                            <span className="text-[8px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.2 rounded border">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                          <Briefcase size={8} />
                          <span>{s.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-bold text-[9px]">
                      <div className="flex items-center gap-1 justify-end">
                        <span className={`h-1.5 w-1.5 rounded-full ${isBusy ? "bg-rose-500" : "bg-emerald-500"}`} />
                        <span className={isBusy ? "text-rose-500 font-black" : "text-emerald-600 font-black"}>
                          {isBusy ? "Busy" : "Available"}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Workload: {workload}/{maxLoad} orders
                      </div>
                    </div>
                  </label>
                );
              })}
            </Radio.Group>
          )}
        </div>
      </div>
    </Modal>
  );
}
