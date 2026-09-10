import React, { useState, useEffect } from "react";
import { X, Search, CheckCircle, Calendar, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffList } from "../hooks/useStaff";
import { useShiftDetails, useAssignStaffToShift } from "../hooks/useShifts";

export default function AssignStaffModal({ isOpen, onClose, shiftId }) {
  const { data: shift, isLoading: isLoadingShift } = useShiftDetails(shiftId);
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffList({ status: "active" });
  const assignMutation = useAssignStaffToShift();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Initialize selected staff ids from shift's current assignedStaff
  useEffect(() => {
    if (shift && Array.isArray(shift.assignedStaff)) {
      setSelectedStaffIds(shift.assignedStaff);
    }
  }, [shift]);

  const handleToggleStaff = (staffId) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAllFiltered = (filteredIds) => {
    const allSelected = filteredIds.every((id) => selectedStaffIds.includes(id));
    if (allSelected) {
      setSelectedStaffIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStaffIds((prev) => {
        const next = [...prev];
        filteredIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (s.status !== "active") return false;
    const q = searchTerm.toLowerCase();
    const nameMatch = s.fullName && s.fullName.toLowerCase().includes(q);
    const roleMatch = s.role && s.role.toLowerCase().includes(q);
    const codeMatch = s.employeeCode && s.employeeCode.toLowerCase().includes(q);
    return nameMatch || roleMatch || codeMatch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!effectiveFrom) return;

    const payload = {
      staffIds: selectedStaffIds,
      effectiveFrom,
      notes,
    };

    assignMutation.mutate({ shiftId, payload }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
            Assign Staff to Shift
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer outline-none"
          >
            <X size={15} className="text-zinc-400" />
          </button>
        </DialogHeader>

        {isLoadingShift ? (
          <div className="py-12 text-center text-xs font-bold text-zinc-400">Loading details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs font-semibold text-slate-700 dark:text-zinc-355">
            {/* Shift Read-Only Info */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider block">Target Shift</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{shift?.shiftName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold text-zinc-455 uppercase tracking-wider block">Timings</span>
                <span className="text-xs font-extrabold text-primary">{shift?.startTime} - {shift?.endTime}</span>
              </div>
            </div>

            {/* Config: Effective Date and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Effective From</label>
                <div className="relative">
                  <Calendar className="absolute right-3.5 top-3 text-zinc-400" size={14} />
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    required
                    className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-850 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Schedule adjustments, swaps..."
                  className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Staff Search and Header */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-0.5">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Selected: {selectedStaffIds.length} / {shift?.maxStaff || 10} Staff Capacity
                </label>
                {filteredStaff.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectAllFiltered(filteredStaff.map((f) => f._id))}
                    className="text-[9px] font-extrabold uppercase text-primary hover:underline self-start sm:self-center"
                  >
                    Toggle Selection on Filtered
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-zinc-400" size={14} />
                <input
                  type="text"
                  placeholder="Search staff by name, code, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-primary text-xs font-semibold"
                />
              </div>
            </div>

            {/* Staff Selection List */}
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-zinc-50/20 dark:bg-zinc-950/20 divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoadingStaff ? (
                <div className="p-8 text-center text-zinc-450">Loading staff database...</div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-bold">No active employees match search</div>
              ) : (
                filteredStaff.map((staff) => {
                  const isChecked = selectedStaffIds.includes(staff._id);
                  const isAssignedElsewhere = staff.shiftId && staff.shiftId !== shiftId;

                  return (
                    <div
                      key={staff._id}
                      onClick={() => handleToggleStaff(staff._id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-zinc-50 dark:bg-zinc-900/60"
                          : "hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Click handler on parent row manages check state
                          className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary cursor-pointer"
                        />
                        <img
                          src={staff.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${staff.fullName}`}
                          alt={staff.fullName}
                          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-850 object-cover bg-zinc-100"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {staff.fullName}
                            <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {staff.employeeCode}
                            </span>
                          </p>
                          <p className="text-[9px] text-zinc-450 font-bold uppercase">{staff.role} • {staff.experience} Years Exp</p>
                        </div>
                      </div>

                      {/* Current assignment warning indicator */}
                      <div>
                        {isAssignedElsewhere ? (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-600 dark:bg-amber-955/20 dark:border-amber-900/40 flex items-center gap-0.5">
                            <AlertCircle size={9} />
                            Swaps from {staff.shiftId}
                          </span>
                        ) : staff.shiftId === shiftId ? (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-955/20 dark:border-emerald-900/40">
                            Currently Assigned
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-450 dark:bg-zinc-800 dark:text-zinc-400">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignMutation.isPending}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-full active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {assignMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>Assign Staff ({selectedStaffIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
