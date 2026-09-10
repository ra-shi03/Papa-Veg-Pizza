import React, { useState, useEffect } from "react";
import { X, Trash2, Plus, AlertCircle, ShoppingBag } from "lucide-react";
import { useCreatePurchaseRequestMutation } from "../hooks/usePurchaseRequests";
import { useStores } from "../hooks/useStock";
import { mockIngredients } from "../mockData";

export default function CreatePurchaseRequestModal({ isOpen, onClose, alertRecord }) {
  const createMutation = useCreatePurchaseRequestMutation();
  const { data: storesResponse } = useStores();
  const stores = storesResponse?.data || [];

  // Form Fields
  const [storeId, setStoreId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [remarks, setRemarks] = useState("");
  
  // Table Items: list of { ingredientId, currentStock, idealStock, requestedQty, unitPrice, total }
  const [items, setItems] = useState([]);
  const [validationError, setValidationError] = useState("");

  // Retrieve stock records to find current stock and ideal stock
  const getStockInfo = (selectedStoreId, selectedIngredientId) => {
    try {
      const cachedStocks = localStorage.getItem("mock_db_inventory_stock");
      const stocksList = cachedStocks ? JSON.parse(cachedStocks) : [];
      const stock = stocksList.find(s => s.storeId === selectedStoreId && s.ingredientId === selectedIngredientId);
      if (stock) {
        return {
          currentStock: stock.currentStock,
          idealStock: stock.idealStock || (stock.reorderLevel * 4),
          unit: stock.unit
        };
      }
    } catch (e) {}

    // Fallback info from ingredients
    const ing = mockIngredients.find(i => i._id === selectedIngredientId);
    return {
      currentStock: 0,
      idealStock: ing ? ing.reorderLevel * 4 : 100,
      unit: ing ? ing.unit : "Units"
    };
  };

  // Populate data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (alertRecord) {
        // Quick mode from Low Stock Alert
        setStoreId(alertRecord.storeId);
        setPriority(alertRecord.severity === "CRITICAL" ? "Urgent" : "High");
        setRemarks(`Auto-generated from low stock alert for ${alertRecord.ingredient?.name}.`);
        
        const stockInfo = getStockInfo(alertRecord.storeId, alertRecord.ingredientId);
        const suggestedQty = Math.max(0, stockInfo.idealStock - alertRecord.currentStock);
        const unitPrice = alertRecord.ingredient?.costPerUnit || 0;

        setItems([
          {
            ingredientId: alertRecord.ingredientId,
            currentStock: alertRecord.currentStock,
            idealStock: stockInfo.idealStock,
            unit: stockInfo.unit,
            requestedQty: suggestedQty,
            unitPrice,
            total: suggestedQty * unitPrice
          }
        ]);
      } else {
        // Standard multi-row mode
        setStoreId(stores[0]?._id || "");
        setPriority("Medium");
        setRemarks("");
        setItems([
          {
            ingredientId: "",
            currentStock: 0,
            idealStock: 0,
            unit: "Units",
            requestedQty: 10,
            unitPrice: 0,
            total: 0
          }
        ]);
      }
      setValidationError("");
    }
  }, [isOpen, alertRecord, stores]);

  // Handle store change in standard mode
  const handleStoreChange = (selectedStoreId) => {
    setStoreId(selectedStoreId);
    // Recalculate stock values for all current items based on new store
    setItems(prev => prev.map(item => {
      if (!item.ingredientId) return item;
      const stockInfo = getStockInfo(selectedStoreId, item.ingredientId);
      const suggestedQty = Math.max(0, stockInfo.idealStock - stockInfo.currentStock);
      return {
        ...item,
        currentStock: stockInfo.currentStock,
        idealStock: stockInfo.idealStock,
        unit: stockInfo.unit,
        requestedQty: suggestedQty,
        total: suggestedQty * item.unitPrice
      };
    }));
  };

  // Handle item change in row
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === "ingredientId") {
        target.ingredientId = value;
        const ing = mockIngredients.find(i => i._id === value);
        const stockInfo = getStockInfo(storeId, value);
        const suggestedQty = Math.max(0, stockInfo.idealStock - stockInfo.currentStock);

        target.currentStock = stockInfo.currentStock;
        target.idealStock = stockInfo.idealStock;
        target.unit = stockInfo.unit;
        target.requestedQty = suggestedQty;
        target.unitPrice = ing ? ing.costPerUnit : 0;
        target.total = suggestedQty * target.unitPrice;
      } else if (field === "requestedQty") {
        const qty = Number(value) || 0;
        target.requestedQty = value;
        target.total = qty * target.unitPrice;
      } else if (field === "unitPrice") {
        const price = Number(value) || 0;
        target.unitPrice = value;
        target.total = Number(target.requestedQty) * price;
      }

      updated[index] = target;
      return updated;
    });
    setValidationError("");
  };

  const addRow = () => {
    setItems(prev => [
      ...prev,
      {
        ingredientId: "",
        currentStock: 0,
        idealStock: 0,
        unit: "Units",
        requestedQty: 10,
        unitPrice: 0,
        total: 0
      }
    ]);
  };

  const deleteRow = (index) => {
    if (items.length === 1 && !alertRecord) {
      setValidationError("A purchase request must contain at least one item.");
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!storeId) {
      setValidationError("Please select a store.");
      return;
    }
    if (items.some(item => !item.ingredientId || Number(item.requestedQty) <= 0)) {
      setValidationError("Please ensure all items have selected ingredients and positive quantities.");
      return;
    }

    createMutation.mutate({
      storeId,
      priority,
      remarks,
      items: items.map(item => ({
        ingredientId: item.ingredientId,
        requestedQty: Number(item.requestedQty),
        unitPrice: Number(item.unitPrice)
      })),
      status: "Pending", // Submit as Pending directly
      requestedBy: "mgr-1" // Simulate standard store manager creator
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <form 
          onSubmit={handleSubmit}
          className="w-full max-w-[1200px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up h-[90vh]"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
                <ShoppingBag size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Create Purchase Request
                </h3>
                <p className="text-[9.5px] text-zinc-450 font-bold mt-0.5">
                  Procure raw materials and toppings for pizza outlets.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Form Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin bg-white dark:bg-zinc-950">
            {/* Header controls (Store, Priority, Remarks) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Select Pizza Store *</label>
                <select
                  value={storeId}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  disabled={!!alertRecord}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none disabled:opacity-60"
                >
                  <option value="" disabled>Select Store Outlet...</option>
                  {stores.map(s => (
                    <option key={s._id} value={s._id}>{s.storeName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Request Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="Additional delivery instructions or notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none"
                />
              </div>
            </div>

            {/* Items Table Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Procurement Items List *</span>
                {!alertRecord && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 rounded-lg flex items-center gap-1 cursor-pointer transition-all text-[10.5px]"
                  >
                    <Plus size={12} /> Add Ingredient Row
                  </button>
                )}
              </div>

              <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden bg-zinc-50/20 dark:bg-zinc-900/10">
                <table className="w-full border-collapse text-left text-xs font-semibold">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] uppercase text-zinc-400 border-b dark:border-zinc-850">
                    <tr>
                      <th className="p-3 w-1/3">Ingredient *</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3">Suggested Qty</th>
                      <th className="p-3">Requested Qty *</th>
                      <th className="p-3">Unit Price (₹)</th>
                      <th className="p-3">Total (₹)</th>
                      {!alertRecord && <th className="p-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {items.map((item, idx) => {
                      const suggested = Math.max(0, item.idealStock - item.currentStock);
                      return (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="p-2">
                            <select
                              value={item.ingredientId}
                              onChange={(e) => handleItemChange(idx, "ingredientId", e.target.value)}
                              disabled={!!alertRecord}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold outline-none disabled:opacity-70"
                            >
                              <option value="" disabled>Select Ingredient...</option>
                              {mockIngredients.map(ing => (
                                <option key={ing._id} value={ing._id}>
                                  {ing.name} ({ing.ingredientCode})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-zinc-800 dark:text-zinc-200 font-mono">
                            {item.ingredientId ? `${item.currentStock} ${item.unit}` : "-"}
                          </td>
                          <td className="p-2 text-zinc-450 font-mono">
                            {item.ingredientId ? `${suggested} ${item.unit}` : "-"}
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Quantity"
                              value={item.requestedQty}
                              onChange={(e) => handleItemChange(idx, "requestedQty", e.target.value)}
                              className="w-24 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-center font-bold text-zinc-800 dark:text-white"
                            />
                          </td>
                          <td className="p-2 font-mono text-zinc-650 dark:text-zinc-300">
                            {item.ingredientId ? `₹${item.unitPrice}` : "-"}
                          </td>
                          <td className="p-2 font-mono text-zinc-850 dark:text-white font-extrabold">
                            {item.ingredientId ? `₹${(item.total || 0).toLocaleString("en-IN")}` : "-"}
                          </td>
                          {!alertRecord && (
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => deleteRow(idx)}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-550 rounded-lg"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Summary Panel */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-150 dark:border-zinc-850 gap-4">
              <div>
                <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Requisition Remarks Summary</span>
                <p className="text-[10px] text-zinc-450 mt-1">
                  Once created, Franchise Administration can review quantities, select suppliers, and generate Purchase Orders.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Total Estimate Value</span>
                <span className="text-lg font-black text-[var(--primary)] block mt-0.5">
                  ₹{calculateGrandTotal().toLocaleString("en-IN")}
                </span>
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
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating Request..." : "Create Request"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
