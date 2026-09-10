import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X, Sparkles, Upload, Package, Landmark } from "lucide-react";
import { addonSchema } from "../addonSchema";
import { addonService } from "../addonService";
import { toast } from "sonner";

export default function AddAddonModal({ isOpen, onClose, onSubmit }) {
  const { data: invResponse } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: () => addonService.getInventoryItems(),
    enabled: isOpen
  });
  const inventoryList = invResponse?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      name: "",
      type: "TOPPING",
      price: 0,
      description: "",
      inventoryItemId: "",
      status: "ACTIVE",
      image: ""
    }
  });

  // Watch form values for live card preview
  const watchedName = watch("name") || "Extra Olive Slices";
  const watchedType = watch("type") || "TOPPING";
  const watchedPrice = watch("price") || 0;
  const watchedDesc = watch("description") || "Traditional toppings to double the flavor.";
  const watchedImage = watch("image");
  const watchedStatus = watch("status");
  const watchedInventoryId = watch("inventoryItemId");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        type: "TOPPING",
        price: 0,
        description: "",
        inventoryItemId: "",
        status: "ACTIVE",
        image: ""
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const simulateUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    toast.info("Uploading asset...", { description: "Formatting image to WebP." });

    setTimeout(() => {
      const addonUnsplash = [
        "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80&fm=webp"
      ];
      const randomUrl = addonUnsplash[Math.floor(Math.random() * addonUnsplash.length)];
      setValue("image", randomUrl);
      toast.success("Add-on image uploaded successfully!");
    }, 900);
  };

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  const selectedInventory = inventoryList.find((i) => i._id === watchedInventoryId);

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[850px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg"><Sparkles size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Add New Add-on Option
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={15} />
            </button>
          </header>

          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 max-h-[75vh] scrollbar-thin">
              
              {/* Form Inputs (Left side) */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Section: Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-zinc-450 font-black uppercase tracking-wider">Basic Add-on Information</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Add-on Name *</label>
                      <input
                        type="text"
                        {...register("name")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        placeholder="e.g. Cheese Burst Crust"
                      />
                      {errors.name && <p className="text-[10px] text-red-650 font-bold">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Add-on Type *</label>
                      <select
                        {...register("type")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer font-bold"
                      >
                        <option value="TOPPING">Topping</option>
                        <option value="CHEESE">Cheese</option>
                        <option value="SAUCE">Sauce</option>
                        <option value="EXTRA">Extra</option>
                      </select>
                      {errors.type && <p className="text-[10px] text-red-650 font-bold">{errors.type.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Description</label>
                    <textarea
                      rows={2}
                      {...register("description")}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 resize-none font-sans"
                      placeholder="e.g. Liquid melted cheese blend filled inside the crust..."
                    />
                    {errors.description && <p className="text-[10px] text-red-650 font-bold">{errors.description.message}</p>}
                  </div>
                </div>

                {/* Section: Pricing */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] text-zinc-450 font-black uppercase tracking-wider">Pricing Configuration</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Price (INR) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-extrabold">₹</span>
                        <input
                          type="number"
                          step="any"
                          {...register("price")}
                          className="w-full pl-7 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                          placeholder="0"
                        />
                      </div>
                      {errors.price && <p className="text-[10px] text-red-650 font-bold">{errors.price.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Currency</label>
                      <input
                        type="text"
                        disabled
                        value="INR (₹)"
                        className="w-full px-3 py-2.5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Inventory Mapping */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] text-zinc-450 font-black uppercase tracking-wider">Inventory Mapping</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Map Ingredients Item</label>
                      <select
                        {...register("inventoryItemId")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer font-bold"
                      >
                        <option value="">Do Not Map (No Stock Tracking)</option>
                        {inventoryList.map((inv) => (
                          <option key={inv._id} value={inv._id}>
                            {inv.name} ({inv.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedInventory && (
                      <div className="p-2 border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl space-y-1 self-end">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Package size={12} />
                          <span className="font-bold text-[9.5px] uppercase">Stock Status</span>
                        </div>
                        <p className="font-black text-zinc-850 dark:text-zinc-200">
                          Stock: <span className={selectedInventory.currentStock <= selectedInventory.lowStockWarning ? "text-amber-600" : "text-emerald-650"}>{selectedInventory.currentStock} {selectedInventory.unit}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Status Config */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] text-zinc-450 font-black uppercase tracking-wider">Availability Status</h4>
                  
                  <div className="flex flex-wrap gap-4">
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="addon-status"
                              checked={field.value === "ACTIVE"}
                              onChange={() => field.onChange("ACTIVE")}
                              className="w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                            <span>Active (Available)</span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="addon-status"
                              checked={field.value === "INACTIVE"}
                              onChange={() => field.onChange("INACTIVE")}
                              className="w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                            <span>Inactive (Hidden)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="addon-status"
                              checked={field.value === "OUT_OF_STOCK"}
                              onChange={() => field.onChange("OUT_OF_STOCK")}
                              className="w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                            <span className="text-red-650">Out of Stock</span>
                          </label>
                        </div>
                      )}
                    />
                  </div>
                </div>

              </div>

              {/* Live Preview (Right side) */}
              <div className="md:col-span-5 space-y-3 bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner flex flex-col justify-center">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400 block text-center">Live Preview Card</span>
                
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-md max-w-xs mx-auto w-full font-bold">
                  <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <img 
                      src={watchedImage || "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=300&q=80"} 
                      alt="Add-on Preview" 
                      className="w-full h-full object-cover"
                    />
                    
                    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white font-black text-[7.5px] px-2 py-0.5 rounded-full uppercase border border-white/5">
                      {watchedType}
                    </span>

                    <span className={`absolute top-2 left-2 px-1.5 py-0.2 border rounded-md text-[7.5px] font-black ${
                      watchedStatus === "ACTIVE" 
                        ? "text-emerald-700 bg-emerald-50 border-emerald-250" 
                        : watchedStatus === "INACTIVE"
                        ? "text-zinc-500 bg-zinc-100 border-zinc-300 dark:bg-zinc-850"
                        : "text-red-700 bg-red-50 border-red-250"
                    }`}>
                      {watchedStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[11.5px] leading-tight text-zinc-900 dark:text-white truncate">{watchedName}</span>
                      <span className="text-[11.5px] font-black text-emerald-650 shrink-0">₹{Number(watchedPrice).toLocaleString("en-IN")}</span>
                    </div>
                    
                    <p className="text-[9.5px] text-zinc-450 leading-relaxed font-medium line-clamp-2">
                      {watchedDesc}
                    </p>
                    
                    {selectedInventory && (
                      <div className="text-[8.5px] text-zinc-400 pt-1.5 border-t border-zinc-100 dark:border-zinc-900 flex justify-between">
                        <span>Mapped Inventory</span>
                        <span className="font-mono">{selectedInventory.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated file upload button */}
                <div className="flex justify-center mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="addon-file-input"
                    onChange={simulateUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="addon-file-input"
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-855 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Upload size={12} />
                    <span>Upload Image Option</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                Create Add-on
              </button>
            </footer>
          </form>

        </div>
      </div>
    </div>
  );
}
