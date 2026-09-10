import React, { useState, useEffect } from "react";
import { X, AlertCircle, Package, UploadCloud, FileText } from "lucide-react";
import { useReceivePurchaseRequestMutation } from "../hooks/usePurchaseRequests";
import { mockSuppliers } from "../mockData";

export default function MarkReceivedModal({ isOpen, onClose, requestRecord }) {
  const receiveMutation = useReceivePurchaseRequestMutation();

  const [deliveryDate, setDeliveryDate] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen && requestRecord) {
      setDeliveryDate(new Date().toISOString().split("T")[0]);
      setVendorId(requestRecord.vendorId || mockSuppliers[0]?._id || "");
      setInvoiceNumber("");
      setRemarks("");
      setFile(null);
      setItems(requestRecord.items.map(item => ({
        ingredientId: item.ingredientId,
        name: item.ingredient?.name || "Raw Material",
        unit: item.ingredient?.unit || "Units",
        approvedQty: item.approvedQty || item.requestedQty,
        receivedQty: item.approvedQty || item.requestedQty, // prefill with approved qty
        unitPrice: item.unitPrice
      })));
      setValidationError("");
    }
  }, [isOpen, requestRecord]);

  if (!isOpen || !requestRecord) return null;

  const handleQtyChange = (index, value) => {
    if (value === "" || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) {
      setItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], receivedQty: value };
        return updated;
      });
      setValidationError("");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setValidationError("Invoice Number is required to record goods received.");
      return;
    }
    if (items.some(item => item.receivedQty === "" || Number(item.receivedQty) < 0)) {
      setValidationError("Received quantity cannot be negative.");
      return;
    }

    receiveMutation.mutate({
      requestId: requestRecord._id,
      deliveryDate,
      vendorId,
      invoiceNumber: invoiceNumber.trim(),
      receivedItems: items.map(item => ({
        ingredientId: item.ingredientId,
        receivedQty: Number(item.receivedQty)
      })),
      remarks
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <form 
          onSubmit={handleSubmit}
          className="w-full max-w-[850px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                <Package size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Goods Received & Stock Intake
                </h3>
                <p className="text-[9.5px] text-zinc-450 font-bold mt-0.5">
                  Confirm receipt of materials for requisition <span className="font-extrabold text-zinc-700 dark:text-zinc-200">{requestRecord.requestNumber}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-thin bg-white dark:bg-zinc-950">
            
            {/* Input fields row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Receiving Date *</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white focus:border-[var(--primary)] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Vendor Outlet</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white focus:border-[var(--primary)] outline-none"
                >
                  <option value="" disabled>Select Vendor...</option>
                  {mockSuppliers.map(v => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Invoice Number *</label>
                <input
                  type="text"
                  placeholder="e.g. INV-9042-26"
                  value={invoiceNumber}
                  onChange={(e) => { setInvoiceNumber(e.target.value); setValidationError(""); }}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-white focus:border-[var(--primary)] outline-none"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] uppercase text-zinc-400 border-b dark:border-zinc-850 font-bold">
                  <tr>
                    <th className="p-3">Ingredient</th>
                    <th className="p-3">Approved Qty</th>
                    <th className="p-3 w-36">Received Qty *</th>
                    <th className="p-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold">
                  {items.map((item, idx) => {
                    const approved = Number(item.approvedQty) || 0;
                    const received = Number(item.receivedQty) || 0;
                    const variance = received - approved;

                    return (
                      <tr key={item.ingredientId} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10">
                        <td className="p-3 text-zinc-855 dark:text-white">{item.name}</td>
                        <td className="p-3 text-zinc-450 font-mono">
                          {approved} {item.unit}
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={item.receivedQty}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-center font-bold text-zinc-800 dark:text-white"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-455">
                              {item.unit}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            variance === 0 
                              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800" 
                              : variance > 0 
                                ? "bg-emerald-500/10 text-emerald-600" 
                                : "bg-red-500/10 text-red-650"
                          }`}>
                            {variance > 0 ? `+${variance}` : variance} {item.unit}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Receiving Remarks / Discrepancy Comments</label>
              <textarea
                placeholder="Enter details about damaged goods, discrepancies, temperature logs or comments..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none resize-none"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Upload Invoice/Receipt copy</label>
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
                      <p className="text-[8.5px] text-zinc-455 font-bold">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={20} className="text-zinc-400" />
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-650 dark:text-zinc-350">
                        Click to upload signed delivery challan or drag & drop files
                      </p>
                      <p className="text-[8.5px] text-zinc-400 font-bold mt-0.5">
                        Supports JPG, PNG, PDF (Max 5MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
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
              className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={receiveMutation.isPending}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {receiveMutation.isPending ? "Confirming..." : "Confirm Receipt & Update Stock"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
