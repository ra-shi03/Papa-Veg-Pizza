import React, { useState } from "react";
import { Modal, Skeleton } from "antd";
import { UserCheck, AlertCircle } from "lucide-react";
import { useChefs } from "../hooks/useKitchenQueue";

export default function ReassignChefModal({ visible, onClose, item, onReassign }) {
  const { data: chefs = [], isLoading, error } = useChefs();
  const [selectedChefId, setSelectedChefId] = useState("");

  if (!item) return null;

  const handleSubmit = () => {
    if (!selectedChefId) return;
    onReassign({ orderItemId: item._id, chefId: selectedChefId });
    onClose();
  };

  const getAvailabilityColor = (avail) => {
    switch (avail) {
      case "available":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30";
      case "busy":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30";
      default:
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30";
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <UserCheck size={18} className="text-[var(--primary)]" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Reassign Chef</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5">
              Change preparation personnel for "{item.name}"
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={400}
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
            onClick={handleSubmit}
            disabled={!selectedChefId}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              selectedChefId
                ? "bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)]"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-650 cursor-not-allowed"
            }`}
          >
            Confirm Reassignment
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 p-3 border border-slate-100 dark:border-zinc-850 rounded-2xl animate-pulse">
                <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded w-24" />
                  <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6 text-rose-500 text-xs font-bold flex flex-col items-center justify-center gap-2">
            <AlertCircle size={24} />
            <span>Failed to load chefs. Please retry.</span>
          </div>
        ) : chefs.length === 0 ? (
          <p className="text-center py-6 text-slate-400 dark:text-zinc-550 text-xs font-bold">
            No on-duty chefs found.
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {chefs.map((chef) => {
              const isSelected = selectedChefId === chef._id;
              const isCurrent = item.assigned_chef === chef._id;
              const isOff = chef.availability === "off-duty";
              const workloadPct = Math.min((chef.currentWorkload / (chef.maxWorkload || 4)) * 100, 100);

              return (
                <div
                  key={chef._id}
                  onClick={() => {
                    if (!isOff && !isCurrent) {
                      setSelectedChefId(chef._id);
                    }
                  }}
                  className={`flex items-center justify-between p-3 border rounded-2xl cursor-pointer transition-all ${
                    isOff || isCurrent ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-855" : ""
                  } ${
                    isSelected
                      ? "border-[var(--primary)] bg-orange-50/20 dark:bg-orange-950/10 shadow-sm ring-1 ring-[var(--primary)]"
                      : "border-slate-100 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={chef.avatar}
                      alt={chef.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-zinc-800"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {chef.name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[8px] font-bold text-slate-450 bg-slate-100 dark:bg-zinc-800 px-1 py-0.2 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
                        {chef.employeeId}
                      </p>

                      {/* Workload */}
                      {!isOff && (
                        <div className="mt-1.5 w-24">
                          <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 dark:text-zinc-500 mb-0.5">
                            <span>Workload</span>
                            <span>{chef.currentWorkload}/{chef.maxWorkload || 4}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                workloadPct >= 100 
                                  ? "bg-rose-500" 
                                  : workloadPct >= 75 
                                  ? "bg-amber-500" 
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${workloadPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getAvailabilityColor(chef.availability)}`}>
                    {chef.availability}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
