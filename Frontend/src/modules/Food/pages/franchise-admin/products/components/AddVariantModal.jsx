import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, AlertCircle } from "lucide-react";
import { variantSchema } from "../productSchema";
import { zuseSaveVariant } from "../hooks/useVariants";
import { toast } from "sonner";

export default function AddVariantModal({ isOpen, onClose, productId, variant = null }) {
  const saveMutation = zuseSaveVariant();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: "",
      size: "Medium",
      price: "",
      servingPersons: 1,
      calories: 0,
      isDefault: false,
      status: true
    }
  });

  // Prepopulate if editing
  useEffect(() => {
    if (variant) {
      reset({
        ...variant,
        price: String(variant.price),
        status: variant.status === "ACTIVE"
      });
    } else {
      reset({
        name: "",
        size: "Medium",
        price: "",
        servingPersons: 1,
        calories: 0,
        isDefault: false,
        status: true
      });
    }
  }, [variant, reset, isOpen]);

  if (!isOpen) return null;

  // Autofill variant name when size changes to make UX fast
  const handleSizeChange = (e) => {
    const size = e.target.value;
    setValue("size", size);
    setValue("name", `${size} Portion`);
  };

  const onSubmit = (data) => {
    const payload = {
      ...data,
      _id: variant?._id, // Pass ID if edit
      productId
    };

    saveMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(variant ? "Variant updated successfully!" : "Variant added successfully!");
        onClose();
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to save variant");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 z-40 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
              {variant ? "Edit Size Variant" : "Add Size Variant"}
            </h4>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={14} />
            </button>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            
            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">Size Category *</label>
              <select
                {...register("size", { onChange: handleSizeChange })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
              >
                <option value="Small">Small Portion (199)</option>
                <option value="Medium">Medium Portion (299)</option>
                <option value="Large">Large Portion (399)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">Variant Label *</label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                placeholder="e.g. Medium Crust"
              />
              {errors.name && <p className="text-[10px] text-red-650 font-bold">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="block text-zinc-500 font-bold">Price (₹) *</label>
                <input
                  type="number"
                  {...register("price")}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-100 font-black text-center"
                  placeholder="e.g. 299"
                />
                {errors.price && <p className="text-[10px] text-red-650 font-bold">{errors.price.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-500 font-bold">Serves *</label>
                <input
                  type="number"
                  {...register("servingPersons")}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-100 text-center font-extrabold"
                  placeholder="2"
                />
                {errors.servingPersons && <p className="text-[10px] text-red-650 font-bold">{errors.servingPersons.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">Calories (Kcal)</label>
              <input
                type="number"
                {...register("calories")}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                placeholder="e.g. 340"
              />
            </div>

            {/* Switches */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-2.5 font-bold">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Set as Default Variant</span>
                <input
                  type="checkbox"
                  {...register("isDefault")}
                  className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Active Status</span>
                <input
                  type="checkbox"
                  {...register("status")}
                  className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || saveMutation.isLoading}
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save size={12} />
                <span>{variant ? "Save Changes" : "Save Variant"}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
