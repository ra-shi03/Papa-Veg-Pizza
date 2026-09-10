import React, { useState } from "react";
import { X, Edit3, Package, Layers, ClipboardList, TrendingDown, AlertOctagon, Calendar, Power } from "lucide-react";
import {
  useIngredientDetails,
  useIngredientStocks,
  usePurchaseOrders,
  useConsumptionHistory,
  useExpiryBatches
} from "../hooks/useIngredients";

export default function IngredientDetailsDrawer({ isOpen, onClose, ingredientId, onEditClick }) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: detailsResponse, isLoading: detailsLoading } = useIngredientDetails(ingredientId);
  const ingredient = detailsResponse?.data;

  const { data: stocksResponse, isLoading: stocksLoading } = useIngredientStocks(ingredientId);
  const stocks = stocksResponse?.data || [];

  const { data: purchaseOrdersResponse, isLoading: poLoading } = usePurchaseOrders(ingredientId);
  const purchaseOrders = purchaseOrdersResponse?.data || [];

  const { data: consumptionResponse, isLoading: consumptionLoading } = useConsumptionHistory(ingredientId);
  const consumption = consumptionResponse?.data || [];

  const { data: batchesResponse, isLoading: batchesLoading } = useExpiryBatches(ingredientId);
  const batches = batchesResponse?.data || [];

  if (!isOpen) return null;

  const handleEdit = () => {
    onClose();
    onEditClick(ingredientId);
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-40 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer slide-out */}
      <div className="absolute inset-0 z-50 flex animate-slide-in">
        <div className="w-full h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
          
          {/* Drawer Header */}
          {detailsLoading ? (
            <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
              <span className="font-bold">Retrieving Details...</span>
              <button onClick={onClose} className="p-1.5 text-zinc-400"><X size={16} /></button>
            </header>
          ) : ingredient ? (
            <>
              <header className="p-4 border-b border-zinc-150 dark:border-zinc-855 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 dark:border-zinc-800 shrink-0">
                      <img src={ingredient.image} alt={ingredient.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                          {ingredient.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          ingredient.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-150 text-zinc-500 border-zinc-350 dark:bg-zinc-800"
                        }`}>
                          {ingredient.status}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">
                        Code: {ingredient.ingredientCode} {ingredient.sku && `• SKU: ${ingredient.sku}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleEdit}
                      className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-650 dark:text-zinc-250 cursor-pointer"
                      title="Edit Ingredient"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-thin text-[10px]">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap font-bold ${
                      activeTab === "overview"
                        ? "bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("stock")}
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap font-bold ${
                      activeTab === "stock"
                        ? "bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    Stock Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("purchases")}
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap font-bold ${
                      activeTab === "purchases"
                        ? "bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    Purchases
                  </button>
                  <button
                    onClick={() => setActiveTab("consumption")}
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap font-bold ${
                      activeTab === "consumption"
                        ? "bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    Consumption
                  </button>
                  {ingredient.expiryTracking && (
                    <button
                      onClick={() => setActiveTab("expiry")}
                      className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap font-bold ${
                        activeTab === "expiry"
                          ? "bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-800"
                      }`}
                    >
                      Expiry Batches
                    </button>
                  )}
                </div>
              </header>

              {/* Body Panel */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin dark:text-zinc-300 bg-white dark:bg-zinc-950">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {/* General Specs Card */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 space-y-3">
                      <h4 className="text-[10px] text-zinc-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                        <Package size={13} />
                        General Catalog Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-3.5 pt-1 text-zinc-650 dark:text-zinc-300">
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Category</span>
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[11.5px] mt-0.5">{ingredient.category}</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Unit Metric</span>
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[11.5px] mt-0.5">{ingredient.unit}</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Supplier Partner</span>
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[11.5px] mt-0.5">{ingredient.supplierName}</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Cost Price</span>
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[11.5px] mt-0.5 text-emerald-650">₹{ingredient.costPerUnit} / {ingredient.unit}</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Shelf Life Duration</span>
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[11.5px] mt-0.5">{ingredient.shelfLife || 0} Days</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Expiry Tracking</span>
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[11.5px] mt-0.5">
                            {ingredient.expiryTracking ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Catalog Created</span>
                          <p className="font-extrabold text-zinc-500 text-[10px] mt-0.5">{new Date(ingredient.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Catalog Updated</span>
                          <p className="font-extrabold text-zinc-500 text-[10px] mt-0.5">{new Date(ingredient.updatedAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description Card */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 space-y-1.5">
                      <span className="text-[9.5px] uppercase font-bold text-zinc-400">Description</span>
                      <p className="leading-relaxed text-zinc-600 dark:text-zinc-350">
                        {ingredient.description || "No description cataloged for this raw material ingredient."}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. STOCK SUMMARY TAB */}
                {activeTab === "stock" && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] text-zinc-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Layers size={13} />
                      Store-wise Realtime Inventory Stocks
                    </h4>
                    {stocksLoading ? (
                      <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
                    ) : stocks.length > 0 ? (
                      <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[9px] uppercase text-zinc-400">
                              <th className="p-3 font-bold">Store</th>
                              <th className="p-3 font-bold">Current Stock</th>
                              <th className="p-3 font-bold">Reorder Level</th>
                              <th className="p-3 font-bold text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                            {stocks.map((s, idx) => (
                              <tr
                                key={idx}
                                className={`transition-all font-semibold ${
                                  s.status === "Critical" || s.stock < s.reorder
                                    ? "bg-red-500/5 dark:bg-red-950/10 text-red-650"
                                    : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                                }`}
                              >
                                <td className="p-3 font-bold">{s.store}</td>
                                <td className="p-3">
                                  {s.stock} {ingredient.unit}
                                </td>
                                <td className="p-3">
                                  {s.reorder} {ingredient.unit}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                                    s.status === "Healthy"
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                                      : s.status === "Low Stock"
                                      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                                      : "bg-red-100 text-red-600 dark:bg-red-950/30"
                                  }`}>
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-450">
                        No stock records recorded for this ingredient.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PURCHASES TAB */}
                {activeTab === "purchases" && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] text-zinc-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <ClipboardList size={13} />
                      Recent Purchase Orders History
                    </h4>
                    {poLoading ? (
                      <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
                    ) : purchaseOrders.length > 0 ? (
                      <div className="space-y-2.5">
                        {purchaseOrders.map((po) => (
                          <div
                            key={po._id}
                            className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <p className="font-extrabold text-zinc-900 dark:text-white">{po.poNumber}</p>
                              <p className="text-[9px] text-zinc-450 mt-0.5">Supplier: {po.supplierName}</p>
                              <p className="text-[8.5px] text-zinc-400 font-mono mt-0.5">Date: {new Date(po.receivedDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-zinc-900 dark:text-white">Qty: {po.quantity} • ₹{po.rate}</p>
                              <p className="text-[9.5px] font-black text-emerald-650 mt-0.5">₹{po.amount}</p>
                              <span className="text-[8px] px-1.5 py-0.2 rounded font-black bg-emerald-50 text-emerald-700 uppercase mt-0.5 inline-block">
                                {po.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-450">
                        No purchase orders recorded in log database.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. CONSUMPTION TAB */}
                {activeTab === "consumption" && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] text-zinc-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <TrendingDown size={13} />
                      Raw Material Order Consumption History
                    </h4>
                    {consumptionLoading ? (
                      <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
                    ) : consumption.length > 0 ? (
                      <div className="space-y-3 text-zinc-650 dark:text-zinc-350">
                        {consumption.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-zinc-150 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-900 space-y-1.5"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-black text-zinc-900 dark:text-white">{c.store}</span>
                              <span className="text-[8.5px] font-mono text-zinc-400 flex items-center gap-1">
                                <Calendar size={10} />
                                {c.date}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-[8px] text-zinc-400 uppercase block">Orders Filled</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-250">{c.orderCount} Orders</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-zinc-400 uppercase block">Consumed Qty</span>
                                <span className="font-bold text-[var(--primary)]">{c.consumedQty}</span>
                              </div>
                            </div>
                            <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 text-[9.5px]">
                              <span className="text-zinc-405 font-bold">Used In: </span>
                              <span className="text-zinc-500 font-semibold">{c.products}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-450">
                        No consumption records processed.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. EXPIRY TAB */}
                {activeTab === "expiry" && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] text-zinc-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <AlertOctagon size={13} />
                      Active Expiry Batch Allocations
                    </h4>
                    {batchesLoading ? (
                      <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
                    ) : batches.length > 0 ? (
                      <div className="space-y-2.5">
                        {batches.map((b, idx) => (
                          <div
                            key={idx}
                            className={`p-3 border rounded-xl flex items-center justify-between ${
                              b.status === "EXPIRED"
                                ? "bg-red-500/5 border-red-200 text-red-650"
                                : b.status === "NEAR EXPRIY"
                                ? "bg-amber-500/5 border-amber-200 text-amber-600"
                                : "bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div>
                              <p className="font-extrabold">{b.batchNumber}</p>
                              <p className="text-[9.5px] font-medium mt-0.5">Mfg: {b.mfgDate} • Exp: {b.expiryDate}</p>
                              <p className="text-[8.5px] font-mono mt-0.5">Quantity: {b.quantity} {ingredient.unit}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-[11px]">
                                {b.daysRemaining < 0
                                  ? `Expired ${Math.abs(b.daysRemaining)}d ago`
                                  : b.daysRemaining === 0
                                  ? "Expires Today"
                                  : `${b.daysRemaining} days left`}
                              </p>
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase mt-0.5 inline-block ${
                                b.status === "EXPIRED"
                                  ? "bg-red-100 text-red-700"
                                  : b.status === "NEAR EXPRIY"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}>
                                {b.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-450">
                        No batch items traced in cache.
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <AlertOctagon size={28} className="text-zinc-350" />
              <p className="font-bold text-zinc-450">Unable to retrieve details.</p>
            </div>
          )}

          {/* Drawer Footer */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 dark:bg-zinc-850 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm cursor-pointer text-xs"
            >
              Close Drawer
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
