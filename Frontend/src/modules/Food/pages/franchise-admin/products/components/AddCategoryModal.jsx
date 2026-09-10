import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Sparkles, Upload, Trash2, Grid, Star, Power } from "lucide-react";
import * as Icons from "lucide-react";
import { categorySchema } from "../categorySchema";
import { toast } from "sonner";

const AVAILABLE_ICONS = ["Pizza", "Flame", "Cookie", "GlassWater", "Layers", "ShoppingBag", "Coffee", "Grape", "IceCream", "Grid"];

export default function AddCategoryModal({ isOpen, onClose, onSubmit, parentCategories = [] }) {
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parentCategory: "",
      displayOrder: 1,
      isFeatured: false,
      status: "ACTIVE",
      image: "",
      icon: "Grid"
    }
  });

  // Watch form values for live preview
  const watchedName = watch("name") || "Cheesy Delight Category";
  const watchedSlug = watch("slug") || "cheesy-delight";
  const watchedDesc = watch("description") || "Traditional pizzas loaded with double melted cheese.";
  const watchedImage = watch("image");
  const watchedIcon = watch("icon") || "Grid";
  const watchedFeatured = watch("isFeatured");
  const watchedStatus = watch("status");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        slug: "",
        description: "",
        parentCategory: "",
        displayOrder: parentCategories.length + 1,
        isFeatured: false,
        status: "ACTIVE",
        image: "",
        icon: "Grid"
      });
    }
  }, [isOpen, reset, parentCategories]);

  if (!isOpen) return null;

  // Auto-generate slug when name changes
  const handleNameChange = (e) => {
    const name = e.target.value;
    setValue("name", name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setValue("slug", slug);
  };

  const simulateUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    toast.info("Uploading category media...", { description: "Formatting asset to WebP." });

    setTimeout(() => {
      const pizzaUnsplash = [
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1573145959986-a142c6e68ea8?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80&fm=webp"
      ];
      const randomUrl = pizzaUnsplash[Math.floor(Math.random() * pizzaUnsplash.length)];
      setValue("image", randomUrl);
      toast.success("Category visual loaded successfully!");
    }, 1000);
  };

  const renderIcon = (iconName) => {
    const LucideIcon = Icons[iconName] || Grid;
    return <LucideIcon size={14} />;
  };

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[850px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg"><Sparkles size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Add New Pizza Catalog Category
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 max-h-[75vh] scrollbar-thin">
              
              {/* Form Inputs (Left side) */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Section: Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Basic Category Specifications</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Category Name *</label>
                      <input
                        type="text"
                        {...register("name", { onChange: handleNameChange })}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        placeholder="e.g. Garlic Breads"
                      />
                      {errors.name && <p className="text-[10px] text-red-650 font-bold">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Slug URL (Auto-generated)</label>
                      <input
                        type="text"
                        {...register("slug")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-mono"
                        placeholder="e.g. garlic-breads"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Description (Summary)</label>
                    <textarea
                      rows={2}
                      {...register("description")}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 resize-none font-sans"
                      placeholder="Summary descriptions for customer applications..."
                    />
                    {errors.description && <p className="text-[10px] text-red-650 font-bold">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Parent Category</label>
                      <select
                        {...register("parentCategory")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
                      >
                        <option value="">None (Root Category)</option>
                        {parentCategories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Display Order Index *</label>
                      <input
                        type="number"
                        {...register("displayOrder")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        placeholder="1"
                      />
                      {errors.displayOrder && <p className="text-[10px] text-red-650 font-bold">{errors.displayOrder.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Section: Visual Assets */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Visual Assets</h4>
                  
                  {/* Thumbnail Selector */}
                  <div className="p-3.5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
                    {watchedImage ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                        <img src={watchedImage} alt="Category Thumbnail" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setValue("image", "")}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full hover:scale-105 active:scale-95"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 flex-shrink-0">
                        <Upload size={14} />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="category-file-input"
                        onChange={simulateUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="category-file-input"
                        className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1 text-[9.5px]"
                      >
                        <Upload size={10} />
                        <span>Select Category Banner</span>
                      </label>
                      <p className="text-[8.5px] text-zinc-450 mt-0.5 font-medium leading-none">Square WebP format, max 200KB.</p>
                    </div>
                  </div>

                  {/* Icon Selector Grid */}
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Category Display Icon</label>
                    <div className="flex flex-wrap gap-2">
                      <Controller
                        name="icon"
                        control={control}
                        render={({ field }) => (
                          <>
                            {AVAILABLE_ICONS.map((ico) => (
                              <button
                                type="button"
                                key={ico}
                                onClick={() => field.onChange(ico)}
                                className={`p-2 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                  field.value === ico
                                    ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm"
                                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-450 hover:text-zinc-650"
                                }`}
                                title={ico}
                              >
                                {renderIcon(ico)}
                              </button>
                            ))}
                          </>
                        )}
                      />
                    </div>
                  </div>

                </div>

                {/* Section: Settings */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Flags & Config</h4>
                  
                  <div className="p-3 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center justify-between font-bold gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="p-1 bg-purple-500/10 text-purple-600 rounded-lg"><Star size={12} className="fill-current" /></span>
                      <span className="text-zinc-650 dark:text-zinc-300">Feature this category on home dashboard carousel</span>
                      <input
                        type="checkbox"
                        {...register("isFeatured")}
                        className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer border-l border-zinc-150 dark:border-zinc-800 pl-4 shrink-0">
                      <span className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg"><Power size={12} /></span>
                      <span className="text-zinc-650 dark:text-zinc-300">Status Active</span>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value === "ACTIVE"}
                            onChange={(e) => field.onChange(e.target.checked ? "ACTIVE" : "INACTIVE")}
                            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        )}
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* Live Preview (Right side) */}
              <div className="md:col-span-5 space-y-3 bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner flex flex-col justify-center">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400 block text-center">Live Preview Card</span>
                
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-md max-w-xs mx-auto w-full">
                  <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <img 
                      src={watchedImage || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80"} 
                      alt="Category Preview" 
                      className="w-full h-full object-cover"
                    />
                    
                    {watchedFeatured && (
                      <span className="absolute top-2 right-2 bg-purple-500 text-white font-black text-[7.5px] px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                        <Star size={8} className="fill-current" />
                        <span>FEATURED</span>
                      </span>
                    )}

                    <span className={`absolute top-2 left-2 px-1.5 py-0.2 border rounded-md text-[7.5px] font-black ${
                      watchedStatus === "ACTIVE" 
                        ? "text-emerald-700 bg-emerald-50 border-emerald-250" 
                        : "text-zinc-500 bg-zinc-100 border-zinc-300 dark:bg-zinc-850"
                    }`}>
                      {watchedStatus}
                    </span>
                  </div>
                  
                  <div className="p-3.5 space-y-1.5 font-bold">
                    <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white truncate">
                      {renderIcon(watchedIcon)}
                      <span className="text-[11.5px] leading-tight">{watchedName}</span>
                    </div>
                    
                    <p className="text-[9px] text-zinc-450 leading-relaxed font-medium line-clamp-2">
                      {watchedDesc}
                    </p>
                    
                    <div className="text-[8px] text-zinc-400 font-mono tracking-tighter pt-0.5 border-t border-zinc-100 dark:border-zinc-900">
                      /{watchedSlug}
                    </div>
                  </div>
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
                Create Category
              </button>
            </footer>
          </form>

        </div>
      </div>
    </div>
  );
}
