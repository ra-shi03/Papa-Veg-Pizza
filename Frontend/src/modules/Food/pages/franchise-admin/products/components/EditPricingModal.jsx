import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, AlertCircle, ShoppingBag, Pizza, Info, Tag, Calendar, Sparkles } from "lucide-react";
import { pricingSchema } from "../pricingSchema";
import { useUpdateStorePricing } from "../hooks/useStorePricing";
import { toast } from "sonner";

export default function EditPricingModal({ isOpen, onClose, pricing = null }) {
  const updateMutation = useUpdateStorePricing();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      smallPrice: 0,
      mediumPrice: 0,
      largePrice: 0,
      deliveryPrice: 0,
      takeawayPrice: 0,
      dineInPrice: 0,
      specialPrice: 0,
      startDate: "",
      endDate: "",
      availability: "AVAILABLE",
      status: "ACTIVE"
    }
  });

  // Watch form values for Live Preview Comparison
  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (pricing) {
      reset({
        smallPrice: pricing.smallPrice || 0,
        mediumPrice: pricing.mediumPrice || 0,
        largePrice: pricing.largePrice || 0,
        deliveryPrice: pricing.deliveryPrice || 0,
        takeawayPrice: pricing.takeawayPrice || 0,
        dineInPrice: pricing.dineInPrice || pricing.mediumPrice || 0,
        specialPrice: pricing.specialPrice || 0,
        startDate: pricing.startDate || "",
        endDate: pricing.endDate || "",
        availability: pricing.availability || "AVAILABLE",
        status: pricing.status || "ACTIVE"
      });
    }
  }, [pricing, reset, isOpen]);

  if (!isOpen || !pricing) return null;

  const onSubmit = (data) => {
    // Add audit reason
    const payload = {
      ...data,
      reason: data.specialPrice > 0 ? "Promotional price set" : "Manual override update"
    };

    updateMutation.mutate(
      { id: pricing._id, data: payload },
      {
        onSuccess: () => {
          toast.success("Pricing updated successfully!");
          onClose();
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to update pricing rules.");
        }
      }
    );
  };

  // Helper to compute difference
  const getDiff = (newVal, oldVal) => {
    const diff = Number(newVal || 0) - Number(oldVal || 0);
    if (diff > 0) return { text: `+₹${diff}`, class: "text-emerald-600 font-extrabold" };
    if (diff < 0) return { text: `-₹${Math.abs(diff)}`, class: "text-rose-600 font-extrabold" };
    return { text: "No change", class: "text-zinc-400 font-bold" };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-scale-up text-zinc-750 dark:text-zinc-350 font-semibold max-h-[90vh]">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Edit Store Pricing
              </h4>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 scrollbar-thin">
            
            {/* Form Fields: Two Columns */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Store & Product Information (Readonly) */}
              <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8.5px] text-zinc-400 uppercase font-semibold block mb-0.5">Store Outlet</span>
                  <p className="text-zinc-850 dark:text-white font-extrabold text-xs">{pricing.storeName}</p>
                  <p className="text-[9px] text-zinc-400 font-mono tracking-tight font-bold">{pricing.storeCode}</p>
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-400 uppercase font-semibold block mb-0.5">Catalog Product</span>
                  <p className="text-zinc-850 dark:text-white font-extrabold text-xs">{pricing.productName}</p>
                  <p className="text-[9px] text-zinc-400 font-mono tracking-tight font-bold">SKU: {pricing.productSku}</p>
                </div>
              </div>

              {/* Variant Pricing Overrides */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-zinc-400">
                  <Pizza size={12} />
                  <span>Variant Pricing</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Small Price (₹)</label>
                    <input
                      type="number"
                      {...register("smallPrice")}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-white font-black text-center"
                    />
                    {errors.smallPrice && <p className="text-[9px] text-red-650 font-bold">{errors.smallPrice.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Medium Price (₹)</label>
                    <input
                      type="number"
                      {...register("mediumPrice")}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-white font-black text-center"
                    />
                    {errors.mediumPrice && <p className="text-[9px] text-red-650 font-bold">{errors.mediumPrice.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Large Price (₹)</label>
                    <input
                      type="number"
                      {...register("largePrice")}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-white font-black text-center"
                    />
                    {errors.largePrice && <p className="text-[9px] text-red-650 font-bold">{errors.largePrice.message}</p>}
                  </div>
                </div>
              </div>

              {/* Order Type Pricing Overrides */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-zinc-400">
                  <ShoppingBag size={12} />
                  <span>Order Type Pricing</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Delivery (₹)</label>
                    <input
                      type="number"
                      {...register("deliveryPrice")}
                      className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-white font-bold text-center"
                    />
                    {errors.deliveryPrice && <p className="text-[9px] text-red-650 font-bold">{errors.deliveryPrice.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Takeaway (₹)</label>
                    <input
                      type="number"
                      {...register("takeawayPrice")}
                      className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-white font-bold text-center"
                    />
                    {errors.takeawayPrice && <p className="text-[9px] text-red-650 font-bold">{errors.takeawayPrice.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Dine-in (₹)</label>
                    <input
                      type="number"
                      {...register("dineInPrice")}
                      className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-white font-bold text-center"
                    />
                    {errors.dineInPrice && <p className="text-[9px] text-red-650 font-bold">{errors.dineInPrice.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Special (₹)</label>
                    <input
                      type="number"
                      {...register("specialPrice")}
                      className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-white font-bold text-center"
                    />
                    {errors.specialPrice && <p className="text-[9px] text-red-650 font-bold">{errors.specialPrice.message}</p>}
                  </div>
                </div>
              </div>

              {/* Promotion Validity Period */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-zinc-400">
                  <Calendar size={12} />
                  <span>Promotion Period</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Start Date</label>
                    <input
                      type="date"
                      {...register("startDate")}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">End Date</label>
                    <input
                      type="date"
                      {...register("endDate")}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none text-slate-500"
                    />
                    {errors.endDate && <p className="text-[9px] text-red-650 font-bold">{errors.endDate.message}</p>}
                  </div>
                </div>
              </div>

              {/* Rule Availability and Active Status Toggles */}
              <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold mb-1">Availability Status</label>
                  <select
                    {...register("availability")}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="PROMOTION ACTIVE">Promotion Active</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold mb-1">Override Status</label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <option value="ACTIVE">Active Rule</option>
                    <option value="INACTIVE">Inactive Rule</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Live Preview Sidecard */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 sticky top-0">
                <div className="flex items-center gap-1.5 text-[9.5px] uppercase font-bold text-zinc-400">
                  <Tag size={13} />
                  <span>Live Price Comparison</span>
                </div>

                <div className="divide-y divide-zinc-150 dark:divide-zinc-800 space-y-3 font-semibold text-zinc-650 dark:text-zinc-350">
                  {/* Small */}
                  <div className="pt-3 first:pt-0 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-zinc-800 dark:text-zinc-200">Small Variant</p>
                      <p className="text-[10px] text-zinc-400 font-bold font-mono">₹{pricing.smallPrice} → ₹{watchedValues.smallPrice || 0}</p>
                    </div>
                    <span className={getDiff(watchedValues.smallPrice, pricing.smallPrice).class}>
                      {getDiff(watchedValues.smallPrice, pricing.smallPrice).text}
                    </span>
                  </div>

                  {/* Medium */}
                  <div className="pt-3 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-zinc-800 dark:text-zinc-200">Medium Variant</p>
                      <p className="text-[10px] text-zinc-400 font-bold font-mono">₹{pricing.mediumPrice} → ₹{watchedValues.mediumPrice || 0}</p>
                    </div>
                    <span className={getDiff(watchedValues.mediumPrice, pricing.mediumPrice).class}>
                      {getDiff(watchedValues.mediumPrice, pricing.mediumPrice).text}
                    </span>
                  </div>

                  {/* Large */}
                  <div className="pt-3 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-zinc-800 dark:text-zinc-200">Large Variant</p>
                      <p className="text-[10px] text-zinc-400 font-bold font-mono">₹{pricing.largePrice} → ₹{watchedValues.largePrice || 0}</p>
                    </div>
                    <span className={getDiff(watchedValues.largePrice, pricing.largePrice).class}>
                      {getDiff(watchedValues.largePrice, pricing.largePrice).text}
                    </span>
                  </div>

                  {/* Delivery */}
                  <div className="pt-3 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-zinc-700 dark:text-zinc-300 text-[10.5px]">Delivery Channel</p>
                      <p className="text-[9.5px] text-zinc-400 font-bold font-mono">₹{pricing.deliveryPrice} → ₹{watchedValues.deliveryPrice || 0}</p>
                    </div>
                    <span className={getDiff(watchedValues.deliveryPrice, pricing.deliveryPrice).class}>
                      {getDiff(watchedValues.deliveryPrice, pricing.deliveryPrice).text}
                    </span>
                  </div>

                  {/* Takeaway */}
                  <div className="pt-3 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-zinc-700 dark:text-zinc-300 text-[10.5px]">Takeaway Channel</p>
                      <p className="text-[9.5px] text-zinc-400 font-bold font-mono">₹{pricing.takeawayPrice} → ₹{watchedValues.takeawayPrice || 0}</p>
                    </div>
                    <span className={getDiff(watchedValues.takeawayPrice, pricing.takeawayPrice).class}>
                      {getDiff(watchedValues.takeawayPrice, pricing.takeawayPrice).text}
                    </span>
                  </div>

                  {/* Special */}
                  <div className="pt-3 flex justify-between items-center border-t-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div>
                      <p className="font-extrabold text-primary text-[10.5px]">Special Price Campaign</p>
                      <p className="text-[9.5px] text-zinc-400 font-bold font-mono">₹{pricing.specialPrice || 0} → ₹{watchedValues.specialPrice || 0}</p>
                    </div>
                    <span className={getDiff(watchedValues.specialPrice, pricing.specialPrice).class}>
                      {getDiff(watchedValues.specialPrice, pricing.specialPrice).text}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/35 rounded-xl flex items-start gap-2 text-blue-750 dark:text-blue-400 text-[10px] leading-relaxed">
                  <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  <span>Changes will be instantly applied across outlets and recorded in the audit trail database.</span>
                </div>
              </div>
            </div>

          </form>

          {/* Footer Actions */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl font-bold cursor-pointer transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || updateMutation.isLoading}
              className="px-5 py-2 bg-primary hover:bg-primary/95 text-white font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Save size={12} />
              <span>Apply Pricing Rules</span>
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
