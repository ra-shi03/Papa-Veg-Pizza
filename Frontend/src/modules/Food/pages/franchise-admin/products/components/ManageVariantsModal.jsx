import React, { useState } from "react";
import { X, Layers, Plus, Pencil, Trash2, HelpCircle, ShieldAlert } from "lucide-react";
import { useVariants, zuseDeleteVariant } from "../hooks/useVariants";
import AddVariantModal from "./AddVariantModal";
import { toast } from "sonner";

export default function ManageVariantsModal({ isOpen, onClose, product }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch variants using React Query
  const { data: variants, isLoading } = useVariants(product?._id);
  const deleteMutation = zuseDeleteVariant();

  if (!isOpen || !product) return null;

  const handleOpenAdd = () => {
    setSelectedVariant(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (v) => {
    setSelectedVariant(v);
    setShowAddModal(true);
  };

  const handleDelete = (vId) => {
    if (window.confirm("Are you sure you want to delete this variant?")) {
      deleteMutation.mutate(
        { id: vId, productId: product._id },
        {
          onSuccess: () => {
            toast.success("Variant deleted successfully!");
          },
          onError: () => {
            toast.error("Failed to delete variant");
          }
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-700 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg"><Layers size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Manage Variants: {product.name}
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Product Size variants</p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all text-[10px]"
              >
                <Plus size={11} />
                <span>Add Variant</span>
              </button>
            </div>

            {/* Variants table */}
            <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px] font-bold">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-850 text-zinc-450 uppercase text-[9px] font-black tracking-wider">
                    <th className="px-4 py-2">Variant Name</th>
                    <th className="px-3 py-2 text-center">Size</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-center">Default</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-750 dark:text-zinc-300">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400 animate-pulse font-extrabold">
                        Syncing variants data...
                      </td>
                    </tr>
                  ) : !variants || variants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Layers className="mx-auto text-zinc-300 dark:text-zinc-700 w-8 h-8 stroke-[1.2] mb-2" />
                        <p className="font-extrabold text-zinc-850 dark:text-zinc-200">No Custom Variants Found</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">This product will only sell at its default base price of ₹{product.basePrice}.</p>
                      </td>
                    </tr>
                  ) : (
                    variants.map((v) => (
                      <tr key={v._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{v.name}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{v.size}</td>
                        <td className="px-3 py-2.5 text-right font-black text-zinc-900 dark:text-zinc-100">₹{v.price}</td>
                        <td className="px-3 py-2.5 text-center">
                          {v.isDefault ? (
                            <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900 rounded font-black text-[9px]">
                              Yes ✔
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-medium text-[9px] italic">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black ${
                            v.status === "ACTIVE" 
                              ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/10" 
                              : "text-zinc-450 bg-zinc-100"
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(v)}
                              className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-900 cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDelete(v._id)}
                              className="p-1 rounded text-red-650 hover:bg-red-50 dark:hover:bg-zinc-900 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm cursor-pointer text-xs"
            >
              Done Managing
            </button>
          </footer>

        </div>
      </div>

      {/* Embedded Sub-Modal: Add/Edit Variant */}
      <AddVariantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        productId={product._id}
        variant={selectedVariant}
      />
    </div>
  );
}
