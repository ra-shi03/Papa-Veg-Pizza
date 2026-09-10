import React, { useState, useEffect } from "react";
import { X, AlertCircle, UploadCloud, FileText, CheckCircle, Search, User } from "lucide-react";
import { useResolveAlertMutation, useUsersListQuery } from "../hooks/useAlerts";

export default function ResolveAlertModal({ isOpen, onClose, alertRecord }) {
  const [resolutionType, setResolutionType] = useState("Purchase Ordered");
  const [refNumber, setRefNumber] = useState("");
  const [quantityAdded, setQuantityAdded] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState("");

  const resolveMutation = useResolveAlertMutation();
  const { data: usersResponse } = useUsersListQuery();
  const users = usersResponse?.data || [];

  useEffect(() => {
    if (isOpen) {
      setResolutionType("Purchase Ordered");
      setRefNumber("");
      setQuantityAdded("");
      setRemarks("");
      setFile(null);
      setAssignedTo(alertRecord?.assignedTo || "");
      setUserSearchQuery("");
      setShowUserDropdown(false);
      setShowConfirm(false);
      setValidationError("");
    }
  }, [isOpen, alertRecord]);

  if (!isOpen || !alertRecord) return null;

  const currentStock = alertRecord.currentStock;
  const unit = alertRecord.ingredient?.unit || "Kg";
  const name = alertRecord.ingredient?.name || "Raw Material";
  const store = alertRecord.storeName || "Store Outlet";

  // Calculate live preview stock values
  const qtyNumber = Number(quantityAdded) || 0;
  const newStock = currentStock + qtyNumber;

  const handleQtyChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setQuantityAdded(val);
      setValidationError("");
    }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setValidationError("Remarks are required to resolve the alert.");
      return;
    }
    if (quantityAdded && Number(quantityAdded) < 0) {
      setValidationError("Replenished quantity cannot be negative.");
      return;
    }
    setValidationError("");
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    resolveMutation.mutate({
      alertId: alertRecord._id,
      resolutionType,
      referenceNumber: refNumber,
      quantityAdded: qtyNumber,
      remarks,
      attachment: file ? { name: file.name, size: file.size } : null,
      assignedTo
    }, {
      onSuccess: () => {
        setShowConfirm(false);
        onClose();
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Filter users based on query
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const selectedUserObj = users.find(u => u.id === assignedTo);

  return (
    <>
      <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

        {/* Modal Window Container */}
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveClick}
            className="w-full max-w-[750px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
          >
            {/* Header */}
            <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Resolve Low Stock Alert
                </h3>
                <p className="text-[9.5px] text-zinc-400 font-bold mt-0.5">
                  Ingredient: <span className="text-[var(--primary)]">{name}</span> | Store: <span className="text-zinc-650 dark:text-zinc-200">{store}</span>
                </p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                <X size={15} />
              </button>
            </header>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[75vh] scrollbar-thin bg-white dark:bg-zinc-950">
              
              {/* Alert Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850">
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Current Stock</span>
                  <span className="text-xs font-black text-zinc-850 dark:text-white mt-0.5 block">
                    {currentStock} {unit}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Reorder Level</span>
                  <span className="text-xs font-black text-zinc-850 dark:text-white mt-0.5 block">
                    {alertRecord.reorderLevel} {unit}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Severity</span>
                  <span className={`text-[10px] font-black uppercase mt-0.5 block ${
                    alertRecord.severity === "CRITICAL" ? "text-red-650 dark:text-red-450" : "text-amber-600 dark:text-amber-500"
                  }`}>
                    {alertRecord.severity}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Created Date</span>
                  <span className="text-xs font-black text-zinc-650 dark:text-zinc-300 mt-0.5 block">
                    {new Date(alertRecord.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Input: Resolution Type Radio Cards */}
              <div className="space-y-2">
                <span className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Resolution Type *</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: "Purchase Ordered", desc: "PO initiated" },
                    { label: "Transferred From Another Store", desc: "Inter-store transfer" },
                    { label: "Manual Adjustment", desc: "Audit discrepancy" },
                    { label: "Stock Received", desc: "Direct stock intake" },
                    { label: "Other", desc: "Custom reason" }
                  ].map((res) => (
                    <label 
                      key={res.label} 
                      className={`flex flex-col justify-between p-2.5 border rounded-xl cursor-pointer text-center transition-all ${
                        resolutionType === res.label 
                          ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" 
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="resolutionType" 
                        checked={resolutionType === res.label}
                        onChange={() => setResolutionType(res.label)}
                        className="sr-only"
                      />
                      <span className="font-extrabold block text-[10.5px] truncate">{res.label}</span>
                      <span className="text-[8.5px] text-zinc-400 font-bold block mt-1 leading-tight">{res.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Row: Reference Number & Quantity Added */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-9011, TRF-0994"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Quantity Added / Replenished</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0.00"
                      value={quantityAdded}
                      onChange={handleQtyChange}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white pr-12 focus:border-[var(--primary)] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-extrabold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">
                      {unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assign Responsible User Dropdown */}
              <div className="space-y-1.5 relative">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Assign Responsible User</label>
                <div 
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white flex items-center justify-between cursor-pointer"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-zinc-400" />
                    <span>{selectedUserObj ? selectedUserObj.name : "Select responsible user..."}</span>
                  </div>
                  <Search size={14} className="text-zinc-400" />
                </div>

                {showUserDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-55 flex flex-col overflow-hidden max-h-48">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-855 dark:text-white outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 scrollbar-thin">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            className={`p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer flex items-center justify-between ${
                              assignedTo === u.id ? "bg-[var(--primary)]/5 text-[var(--primary)]" : ""
                            }`}
                            onClick={() => {
                              setAssignedTo(u.id);
                              setShowUserDropdown(false);
                            }}
                          >
                            <div>
                              <p className="font-extrabold text-zinc-850 dark:text-white">{u.name}</p>
                              <p className="text-[9px] text-zinc-400 font-bold">{u.email}</p>
                            </div>
                            {assignedTo === u.id && <span className="text-[var(--primary)] text-[10px] font-black">ACTIVE</span>}
                          </div>
                        ))
                      ) : (
                        <p className="p-3 text-center text-zinc-400 font-bold text-[10.5px]">No users found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks Textarea (Required) */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Remarks / Notes *</label>
                <textarea
                  placeholder="Describe resolution activities, references, or next steps (max 500 characters)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white focus:border-[var(--primary)] outline-none resize-none"
                />
                <div className="flex justify-between items-center text-[8.5px]">
                  <span className="text-rose-500 font-extrabold">{remarks.trim() ? "" : "Remarks are required"}</span>
                  <span className="text-zinc-450 font-bold">{remarks.length}/500</span>
                </div>
              </div>

              {/* Attachment Upload */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Upload Document (Invoice, Receipt, PO PDF)</label>
                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)]/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-zinc-50/20 dark:bg-zinc-900/10 relative">
                  <input 
                    type="file" 
                    accept=".jpg,.jpeg,.png,.pdf" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  {file ? (
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                      <FileText size={20} className="text-[var(--primary)]" />
                      <div className="text-left">
                        <p className="font-extrabold text-[10.5px] max-w-[200px] truncate">{file.name}</p>
                        <p className="text-[8.5px] text-zinc-450 font-bold">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-zinc-400" />
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-650 dark:text-zinc-350">
                          Click to upload invoice or drag & drop files
                        </p>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-0.5">
                          Supports JPG, PNG, PDF (Max 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Resolution Summary Preview Panel */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
                <span className="text-[9.5px] uppercase text-zinc-450 font-extrabold tracking-wider block">Resolution Summary Preview</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] text-zinc-650 dark:text-zinc-350">
                  <div>
                    <span className="text-zinc-400 font-bold block">Alert ID</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{alertRecord._id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Previous Stock</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{currentStock} {unit}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">New Stock</span>
                    <span className="text-zinc-850 dark:text-white font-extrabold">{newStock} {unit}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Resolution Type</span>
                    <span className="text-zinc-850 dark:text-white font-extrabold">{resolutionType}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Resolved By</span>
                    <span className="text-zinc-850 dark:text-white font-extrabold">Franchise Admin</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Resolved Date</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{new Date().toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {validationError && (
                <p className="text-[10.5px] text-rose-600 font-extrabold flex items-center gap-1 mt-1">
                  <AlertCircle size={11} />
                  <span>{validationError}</span>
                </p>
              )}

            </div>

            {/* Footer Buttons */}
            <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolveMutation.isPending}
                className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {resolveMutation.isPending ? "Resolving..." : "Resolve Alert"}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog Box */}
      {showConfirm && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-[60] overflow-hidden text-xs">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowConfirm(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 font-semibold animate-scale-up">
              <div className="flex gap-3">
                <span className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl shrink-0">
                  <AlertCircle size={18} />
                </span>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm">
                    Confirm Alert Resolution
                  </h3>
                  <p className="text-zinc-450 mt-1 leading-normal">
                    Are you sure you want to mark this alert as resolved? This will log a replenishing stock of <span className="text-zinc-900 dark:text-white font-black">{qtyNumber} {unit}</span> in the store inventory.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={resolveMutation.isPending}
                  className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {resolveMutation.isPending ? "Confirming..." : "Confirm Resolve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
