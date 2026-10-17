import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Layers,
  Tag,
  DollarSign,
  Loader2,
  Edit,
  AlertCircle
} from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { adminClient } from "@/services/api/axios";

export default function AddonsDetails({
  isOpen,
  onClose,
  addonId,
  initialData = null,
  onEdit
}) {
  const [addon, setAddon] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && addonId) {
      fetchAddonDetails(addonId);
    } else if (isOpen && initialData) {
      setAddon(initialData);
    } else {
      setAddon(null);
      setError(null);
    }
  }, [isOpen, addonId]);

  const fetchAddonDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminClient.get(`/food/admin/addons/${id}`);
      if (res?.data?.success && res.data.data) {
        setAddon(res.data.data);
      } else {
        throw new Error(res?.data?.message || "Failed to load addon details");
      }
    } catch (err) {
      console.error("Error fetching addon by id:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch addon details");
      toast.error("Failed to fetch addon details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Add-on Details
                {addon?.status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      addon.status === "Active"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                    }`}
                  >
                    {addon.status}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                View toppings and add-on configuration details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                Loading add-on details...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Failed to load add-on</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">{error}</p>
              <button
                onClick={() => fetchAddonDetails(addonId)}
                className="mt-2 px-4 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          ) : addon ? (
            <>
              {/* Hero Banner with Image & Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shrink-0 shadow-sm flex items-center justify-center">
                  {addon.image ? (
                    <img
                      src={addon.image}
                      alt={addon.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-400 text-xs gap-1">
                      <Tag className="w-6 h-6 stroke-1" />
                      <span>No image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {addon.name}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                    <span className="px-2.5 py-0.5 bg-zinc-200/80 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-md capitalize">
                      {addon.type || "Standard"}
                    </span>
                    {addon.isDefault && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        Default Base Option
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        addon.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                      }`}
                    >
                      Status: {addon.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Specifications Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Pricing & Size Variations
                </h4>

                {addon.prices && addon.prices.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {addon.prices.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 shadow-xs flex flex-col justify-between"
                      >
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 capitalize">
                          {p.size || "Default Size"}
                        </span>
                        <div className={`text-lg font-black mt-1 ${Number(p.price || 0) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                          {Number(p.price || 0) === 0 ? "₹0.00 (Free)" : `₹${Number(p.price || 0).toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Price:</span>{" "}
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      ₹{Number(addon.price || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Detailed Attributes Table */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Add-on Details
                </h4>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  <div className="flex justify-between p-3">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Add-on Name</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{addon.name}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Add-on Type</span>
                    <span className="font-semibold capitalize text-zinc-800 dark:text-zinc-200">{addon.type}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Status</span>
                    <span className={`font-bold ${addon.status === "Active" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {addon.status}
                    </span>
                  </div>
                  {addon.description && (
                    <div className="flex flex-col gap-1 p-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">Description</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{addon.description}</span>
                    </div>
                  )}
                  {addon.category && (
                    <div className="flex justify-between p-3">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">Category</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{addon.category}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Created Date
                    </span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {addon.createdAt ? dayjs(addon.createdAt).format("DD MMMM YYYY, hh:mm A") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Last Updated
                    </span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {addon.updatedAt ? dayjs(addon.updatedAt).format("DD MMMM YYYY, hh:mm A") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
          {addon && onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(addon);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Add-on
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
