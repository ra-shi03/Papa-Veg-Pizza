import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Truck, Calendar } from "lucide-react";
import { useApprovePurchaseRequestMutation } from "../hooks/usePurchaseRequests";
import { mockSuppliers } from "../mockData";

export default function ApproveRequestModal({ isOpen, onClose, requestRecord }) {
  const approveMutation = useApprovePurchaseRequestMutation();

  const [items, setItems] = useState([]);
  const [vendorId, setVendorId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && requestRecord) {
      // Map items to editable list
      setItems(requestRecord.items.map(item => ({
        ingredientId: item.ingredientId,
        name: item.ingredient?.name || "Raw Material",
        unit: item.ingredient?.unit || "Units",
        requestedQty: item.requestedQty,
        approvedQty: item.requestedQty, // prefill with requested quantity
        unitPrice: item.unitPrice
      })));
      setVendorId(requestRecord.vendorId || mockSuppliers[0]?._id || "");
      setExpectedDeliveryDate(requestRecord.expectedDeliveryDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setRemarks("");
      setValidationError("");
      setShowConfirm(false);
    }
  }, [isOpen, requestRecord]);

  if (!isOpen || !requestRecord) return null;

  const handleQtyChange = (index, value) => {
    const qty = Number(value);
    if (value === "" || (/^\d*\.?\d*$/.test(value) && qty >= 0)) {
      setItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], approvedQty: value };
        return updated;
      });
      setValidationError("");
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.approvedQty) || 0) * item.unitPrice, 0);
  };

  const handleApproveClick = (e) => {
    e.preventDefault();
    if (items.some(item => !item.approvedQty || Number(item.approvedQty) <= 0)) {
      setValidationError("Approved quantity must be a positive number.");
      return;
    }
    if (!vendorId) {
      setValidationError("Please select a vendor.");
      return;
    }
    if (!expectedDeliveryDate) {
      setValidationError("Please select expected delivery date.");
      return;
    }
    setValidationError("");
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    approveMutation.mutate({
      requestId: requestRecord._id,
      approvedItems: items.map(item => ({
        ingredientId: item.ingredientId,
        approvedQty: Number(item.approvedQty)
      })),
      vendorId,
      expectedDeliveryDate,
      remarks
    }, {
      onSuccess: () => {
        setShowConfirm(false);
        onClose();
      }
    });
  };

  const selectedVendor = mockSuppliers.find(s => s._id === vendorId);

  return (
    <>
      <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

        {/* Modal Container */}
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleApproveClick}
            className="w-full max-w-[850px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
          >
            {/* Header */}
            <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <CheckCircle size={18} />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    Approve Purchase Requisition
                  </h3>
                  <p className="text-[9.5px] text-zinc-450 font-bold mt-0.5">
                    Review and authorize purchase request <span className="font-extrabold text-zinc-700 dark:text-zinc-200">{requestRecord.requestNumber}</span>
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                <X size={15} />
              </button>
            </header>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-thin bg-white dark:bg-zinc-950">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850">
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Store Outlet</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-white mt-0.5 block truncate">
                    {requestRecord.storeName}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Priority</span>
                  <span className={`text-[10px] font-black uppercase mt-0.5 block ${
                    requestRecord.priority === "Urgent" ? "text-red-600" : "text-zinc-650 dark:text-zinc-350"
                  }`}>
                    {requestRecord.priority}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Requested Value</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-white mt-0.5 block">
                    ₹{requestRecord.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Approved Value</span>
                  <span className="text-xs font-black text-[var(--primary)] mt-0.5 block animate-fade-in">
                    ₹{calculateTotal().toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Items Grid */}
              <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] uppercase text-zinc-400 border-b dark:border-zinc-850 font-bold">
                    <tr>
                      <th className="p-3">Ingredient</th>
                      <th className="p-3">Requested Qty</th>
                      <th className="p-3 w-32">Approved Qty *</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold">
                    {items.map((item, idx) => (
                      <tr key={item.ingredientId} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10">
                        <td className="p-3 text-zinc-850 dark:text-white">{item.name}</td>
                        <td className="p-3 text-zinc-450 font-mono">
                          {item.requestedQty} {item.unit}
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={item.approvedQty}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-center font-bold text-zinc-800 dark:text-white"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400">
                              {item.unit}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-600 dark:text-zinc-350">
                          ₹{item.unitPrice}
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-850 dark:text-white font-extrabold">
                          ₹{( (Number(item.approvedQty) || 0) * item.unitPrice ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vendor & Delivery Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Assign Procurement Vendor *</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white focus:border-[var(--primary)] outline-none"
                  >
                    <option value="" disabled>Select Vendor...</option>
                    {mockSuppliers.map(v => (
                      <option key={v._id} value={v._id}>{v.name} ({v.contact})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Expected Delivery Date *</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Approval Remarks / Notes</label>
                <textarea
                  placeholder="Enter approval details, delivery directions, or vendor communication details..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none resize-none"
                />
              </div>

              {validationError && (
                <p className="text-[10.5px] text-rose-600 font-extrabold flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>{validationError}</span>
                </p>
              )}
            </div>

            {/* Footer */}
            <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-55 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={approveMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {approveMutation.isPending ? "Approving..." : "Approve Requisition"}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-[60] overflow-hidden text-xs">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowConfirm(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 font-semibold animate-scale-up">
              <div className="flex gap-3">
                <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                  <Truck size={18} />
                </span>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm">
                    Confirm Approval & Purchase Order
                  </h3>
                  <p className="text-zinc-450 mt-1 leading-normal text-[10.5px]">
                    Are you sure you want to approve this request? This will generate a purchase order containing {items.length} items to <span className="font-extrabold text-zinc-950 dark:text-white">{selectedVendor ? selectedVendor.name : "vendor"}</span>.
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
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 bg-emerald-605 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {approveMutation.isPending ? "Confirming..." : "Confirm & Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
