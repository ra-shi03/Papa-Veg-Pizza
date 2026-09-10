import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Layers, AlertTriangle, ShieldCheck, ToggleLeft, ToggleRight, FolderPlus, Trash2 } from "lucide-react";
import { addonService } from "../addonService";

export default function BulkAddonModal({ isOpen, onClose, selectedCount, selectedIds, onBulkSubmit }) {
  const [bulkAction, setBulkAction] = useState(""); // ENABLE, DISABLE, ASSIGN_GROUP, DELETE
  const [groupId, setGroupId] = useState("");

  const { data: groupsResponse } = useQuery({
    queryKey: ["addon-groups-for-bulk"],
    queryFn: () => addonService.getAddonGroups(),
    enabled: isOpen
  });
  const groupsList = groupsResponse?.data || [];

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bulkAction) return;

    const payload = {};
    if (bulkAction === "ASSIGN_GROUP") {
      if (!groupId) return;
      payload.groupId = groupId;
    }

    onBulkSubmit(selectedIds, bulkAction, payload);
    // Reset states
    setBulkAction("");
    setGroupId("");
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[450px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg"><Layers size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Execute Bulk Operations
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={15} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
            {/* Body */}
            <div className="p-5 space-y-4">
              
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl leading-relaxed">
                <span>Targeting: </span>
                <span className="font-black text-zinc-900 dark:text-white text-xs">{selectedCount} add-on items</span>
                <span> selected in listing.</span>
              </div>

              {/* Action Cards selection */}
              <div className="space-y-2">
                <label className="block text-zinc-500 font-bold mb-1">Select Action to Apply</label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkAction("ENABLE")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "ENABLE"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <ToggleRight size={16} />
                    <span>Activate Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAction("DISABLE")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "DISABLE"
                        ? "bg-zinc-100 border-zinc-500 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <ToggleLeft size={16} />
                    <span>Deactivate Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAction("ASSIGN_GROUP")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "ASSIGN_GROUP"
                        ? "bg-purple-55/10 border-purple-500 text-purple-700 dark:text-purple-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <FolderPlus size={16} />
                    <span>Assign Group</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAction("DELETE")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "DELETE"
                        ? "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-650 dark:text-red-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <Trash2 size={16} />
                    <span>Delete Add-ons</span>
                  </button>
                </div>
              </div>

              {/* Conditional Group Selector */}
              {bulkAction === "ASSIGN_GROUP" && (
                <div className="space-y-1.5 p-3.5 bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl animate-fade-in">
                  <label className="block text-zinc-500 font-bold">Target Add-on Group</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer font-bold"
                  >
                    <option value="">-- Choose Target Group --</option>
                    {groupsList.map((g) => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Warning for Delete */}
              {bulkAction === "DELETE" && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-red-750 dark:text-red-400 font-bold flex items-start gap-2 animate-pulse">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>Warning: This will permanently delete all {selectedCount} selected add-on options from menus and customization options! Action cannot be reversed.</span>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bulkAction || (bulkAction === "ASSIGN_GROUP" && !groupId)}
                className={`px-5 py-2 text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
                  !bulkAction || (bulkAction === "ASSIGN_GROUP" && !groupId)
                    ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed"
                    : bulkAction === "DELETE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-zinc-950 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                }`}
              >
                <span>Execute Action</span>
              </button>
            </footer>
          </form>

        </div>
      </div>
    </div>
  );
}
