import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Sparkles, Upload, Package, ClipboardCheck, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSuppliers } from "../hooks/useIngredients";

const CATEGORIES = ["Dough", "Cheese", "Vegetables", "Sauce", "Packaging", "Seasoning", "Other"];
const UNITS = ["Kg", "Gram", "Litre", "Piece", "Pack"];

const ingredientFormSchema = z.object({
  name: z.string().min(1, "Ingredient Name is required"),
  ingredientCode: z.string().min(1, "Ingredient Code is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  sku: z.string().optional().default(""),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  reorderLevel: z.coerce.number().min(0, "Reorder Level must be 0 or more"),
  idealStock: z.coerce.number().min(0, "Ideal Stock must be 0 or more"),
  costPerUnit: z.coerce.number().min(0, "Cost must be a positive number"),
  shelfLife: z.coerce.number().min(0, "Shelf Life must be 0 or more"),
  expiryTracking: z.boolean().default(false),
  supplierId: z.string().min(1, "Supplier selection is required"),
  isDefaultSupplier: z.boolean().default(false)
});

export default function AddIngredientModal({ isOpen, onClose, onSubmit }) {
  const [activeTab, setActiveTab] = useState("basic");
  const { data: suppliersResponse, isLoading: suppliersLoading } = useSuppliers();
  const suppliers = suppliersResponse?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    trigger,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: "",
      ingredientCode: "",
      category: "",
      unit: "",
      sku: "",
      description: "",
      image: "",
      reorderLevel: 0,
      idealStock: 0,
      costPerUnit: 0,
      shelfLife: 0,
      expiryTracking: false,
      supplierId: "",
      isDefaultSupplier: false
    }
  });

  const watchedImage = watch("image");
  const watchedCategory = watch("category");
  const watchedUnit = watch("unit");

  // Auto-generate code when modal opens
  useEffect(() => {
    if (isOpen) {
      const randomCode = `ING-${Math.floor(100 + Math.random() * 900)}`;
      reset({
        name: "",
        ingredientCode: randomCode,
        category: "",
        unit: "",
        sku: "",
        description: "",
        image: "",
        reorderLevel: 0,
        idealStock: 0,
        costPerUnit: 0,
        shelfLife: 0,
        expiryTracking: false,
        supplierId: "",
        isDefaultSupplier: false
      });
      setActiveTab("basic");
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  // Handle media mock upload
  const handleMediaUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.info("Uploading asset image...", { description: "Formatting and compression to WebP." });

    setTimeout(() => {
      const ingredientImages = [
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp", // dough
        "https://images.unsplash.com/photo-1573145959986-a142c6e68ea8?auto=format&fit=crop&w=400&q=80&fm=webp", // cheese
        "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp", // tomato sauce
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80&fm=webp"  // veg
      ];
      const randomImage = ingredientImages[Math.floor(Math.random() * ingredientImages.length)];
      setValue("image", randomImage);
      toast.success("Ingredient image uploaded successfully!");
    }, 850);
  };

  const handleNextTab = async () => {
    // Validate Tab 1 before going to Tab 2
    const isValid = await trigger(["name", "ingredientCode", "category", "unit"]);
    if (isValid) {
      setActiveTab("inventory");
    } else {
      toast.error("Please fill all required basic details correctly.");
    }
  };

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Centering */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[850px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg shadow-sm">
                <Sparkles size={14} />
              </span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Add New Franchise Raw Material Ingredient
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
            
            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 px-4 py-2 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-bold ${
                  activeTab === "basic"
                    ? "bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <ClipboardCheck size={12} />
                Basic Information
              </button>
              <button
                type="button"
                onClick={handleNextTab}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-bold ${
                  activeTab === "inventory"
                    ? "bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <Package size={12} />
                Inventory Settings
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 max-h-[60vh] scrollbar-thin">
              
              {/* TAB 1: BASIC INFORMATION */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Ingredient Name *</label>
                      <input
                        type="text"
                        {...register("name")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        placeholder="e.g. Paneer Cubes"
                      />
                      {errors.name && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Ingredient Code * (Auto-generated)</label>
                      <input
                        type="text"
                        {...register("ingredientCode")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-mono"
                        placeholder="e.g. ING-123"
                      />
                      {errors.ingredientCode && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.ingredientCode.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Category *</label>
                      <select
                        {...register("category")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.category.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Unit *</label>
                      <select
                        {...register("unit")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
                      >
                        <option value="">Select Unit</option>
                        {UNITS.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                      {errors.unit && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.unit.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">SKU (Stock Keeping Unit)</label>
                      <input
                        type="text"
                        {...register("sku")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-mono"
                        placeholder="e.g. CHEESE-MOZ-GP"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Description</label>
                    <textarea
                      rows={3}
                      {...register("description")}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 resize-none font-sans"
                      placeholder="Enter recipe details, crust options, or specialty ingredients."
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-zinc-500 font-bold">Image Upload</label>
                    <div className="p-4 border-2 border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl flex items-center gap-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                      {watchedImage ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          <img src={watchedImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setValue("image", "")}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full hover:scale-105 active:scale-95"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 shrink-0">
                          <Upload size={18} />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          id="ingredient-file-input"
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="ingredient-file-input"
                          className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 text-[9.5px]"
                        >
                          <Upload size={11} />
                          <span>Select Raw Material Banner</span>
                        </label>
                        <p className="text-[8.5px] text-zinc-400 mt-1 font-medium">JPEG, PNG, WebP supported. Max size 200KB.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INVENTORY SETTINGS */}
              {activeTab === "inventory" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">
                        Reorder Level {watchedUnit ? `(${watchedUnit})` : ""} *
                      </label>
                      <input
                        type="number"
                        {...register("reorderLevel")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        placeholder="15"
                      />
                      {errors.reorderLevel && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.reorderLevel.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">
                        Ideal Stock {watchedUnit ? `(${watchedUnit})` : ""} *
                      </label>
                      <input
                        type="number"
                        {...register("idealStock")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        placeholder="60"
                      />
                      {errors.idealStock && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.idealStock.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Cost Per Unit (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-400 font-bold"><DollarSign size={13} className="text-zinc-500 stroke-[2.5]" /></span>
                        <input
                          type="number"
                          step="0.01"
                          {...register("costPerUnit")}
                          className="w-full pl-7 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                          placeholder="480.00"
                        />
                      </div>
                      {errors.costPerUnit && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.costPerUnit.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Shelf Life (Days)</label>
                      <input
                        type="number"
                        {...register("shelfLife")}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        placeholder="30"
                      />
                      {errors.shelfLife && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.shelfLife.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Expiry Tracking</label>
                      <div className="flex items-center h-10 border border-zinc-150 dark:border-zinc-850 rounded-xl bg-zinc-50 dark:bg-zinc-900 px-3 justify-between">
                        <span className="text-zinc-400 font-medium">Enable expiry batch tracking alerts</span>
                        <Controller
                          name="expiryTracking"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="rounded border-zinc-300 dark:border-zinc-700 bg-white w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Preferred Supplier *</label>
                    <select
                      {...register("supplierId")}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.contact})</option>
                      ))}
                    </select>
                    {errors.supplierId && <p className="text-[10px] text-red-650 font-bold mt-0.5">{errors.supplierId.message}</p>}
                  </div>

                  <div className="p-3 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between bg-zinc-50/40 dark:bg-zinc-900/10">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("isDefaultSupplier")}
                        className="rounded border-zinc-300 dark:border-zinc-700 bg-white w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <div>
                        <span className="text-zinc-850 dark:text-zinc-200 font-bold block">Set as Primary Supplier</span>
                        <span className="text-[9.5px] text-zinc-400 font-medium leading-none block mt-0.5">Always route purchase order auto-fills to this provider.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-between bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <div>
                {activeTab === "inventory" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold cursor-pointer transition-colors text-xs text-zinc-500"
                  >
                    Back to Basic Info
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold cursor-pointer transition-colors text-xs text-zinc-500"
                >
                  Cancel
                </button>
                {activeTab === "basic" ? (
                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="px-5 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] text-xs"
                  >
                    Continue to Settings
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] text-xs"
                  >
                    Save Ingredient
                  </button>
                )}
              </div>
            </footer>
          </form>

        </div>
      </div>
    </div>
  );
}
