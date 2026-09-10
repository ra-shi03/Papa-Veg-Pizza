import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Sparkles, AlertCircle, Upload, Trash2, HelpCircle, Leaf, Flame, Pizza, Store, ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { productSchema } from "../productSchema";
import { mockCategories, mockTaxCategories } from "../mockProducts";
import { useStores } from "@food/pages/franchise-admin/orders/ordersQuery";
import { toast } from "sonner";

export default function AddProductWizard({ isOpen, onClose, onSubmit, initialData = null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const { data: storesList } = useStores();

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      sku: "",
      shortDescription: "",
      description: "",
      productType: "VEG",
      preparationTime: 15,
      calories: 0,
      spiceLevel: 1,
      image: "",
      galleryImages: [],
      basePrice: "",
      taxCategory: "gst-5",
      isFeatured: false,
      isBestSeller: false,
      isCustomizable: false,
      status: "ACTIVE",
      displayOrder: 1,
      storesAvailability: []
    }
  });

  // Watch form values for live preview card
  const watchedName = watch("name") || "Cheesy Margherita Burst";
  const watchedPrice = watch("basePrice") || 0;
  const watchedCategory = watch("categoryId");
  const watchedType = watch("productType");
  const watchedBestSeller = watch("isBestSeller");
  const watchedFeatured = watch("isFeatured");
  const watchedImage = watch("image");
  const watchedPrepTime = watch("preparationTime");
  const watchedSpiceLevel = watch("spiceLevel");

  // Prepopulate when in Edit Mode
  useEffect(() => {
    if (initialData) {
      // Map database store overrides to form values
      const storesAvailability = storesList?.map((store) => {
        const override = initialData.pricing?.find((sp) => sp.storeId === store.storeId);
        return {
          storeId: store.storeId,
          available: override ? override.status === "ACTIVE" : true,
          overridePrice: override ? override.price : initialData.basePrice
        };
      }) || [];

      reset({
        ...initialData,
        storesAvailability
      });
    } else {
      // Reset to defaults in Add mode
      reset({
        name: "",
        categoryId: "",
        sku: "",
        shortDescription: "",
        description: "",
        productType: "VEG",
        preparationTime: 15,
        calories: 0,
        spiceLevel: 1,
        image: "",
        galleryImages: [],
        basePrice: "",
        taxCategory: "gst-5",
        isFeatured: false,
        isBestSeller: false,
        isCustomizable: false,
        status: "ACTIVE",
        displayOrder: 1,
        storesAvailability: storesList?.map((s) => ({ storeId: s.storeId, available: true, overridePrice: "" })) || []
      });
    }
    setCurrentStep(1);
  }, [initialData, reset, storesList, isOpen]);

  if (!isOpen) return null;

  // Auto-generate Slug when Name Changes (Step 1)
  const handleNameChange = (e) => {
    const name = e.target.value;
    setValue("name", name);
    // Generate simple slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setValue("slug", slug);
  };

  // Mock uploader simulation
  const simulateUpload = (type, files) => {
    if (!files || files.length === 0) return;
    toast.info("Uploading image...", { description: "Compressing to WebP and uploading to CDN." });
    
    setTimeout(() => {
      // Generate some pizza unsplash links for testing
      const pizzaUnsplash = [
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=400&q=80&fm=webp",
        "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80&fm=webp"
      ];
      const randomUrl = pizzaUnsplash[Math.floor(Math.random() * pizzaUnsplash.length)];

      if (type === "thumbnail") {
        setValue("image", randomUrl);
        toast.success("Thumbnail updated successfully!");
      } else {
        const currentGallery = watch("galleryImages") || [];
        setValue("galleryImages", [...currentGallery, randomUrl]);
        toast.success("Gallery image added successfully!");
      }
    }, 1000);
  };

  const getCategoryName = (catId) => {
    return mockCategories.find((c) => c.id === catId)?.name || "Pizza";
  };

  const handleNextStep = async () => {
    // Validate current step fields before progressing
    let fieldsToValidate = [];
    if (currentStep === 1) {
      fieldsToValidate = ["name", "categoryId", "sku", "shortDescription", "description"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["productType", "preparationTime", "calories", "spiceLevel"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["image"];
    } else if (currentStep === 4) {
      fieldsToValidate = ["basePrice", "taxCategory"];
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  const steps = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Product Type" },
    { num: 3, label: "Images" },
    { num: 4, label: "Pricing & Preview" },
    { num: 5, label: "Store Availability" }
  ];

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Main Modal container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[1000px] h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-700 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg"><Sparkles size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                {initialData ? "Edit Pizza Product" : "Add New Pizza Product"}
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Step Progress Bar */}
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/10 dark:bg-zinc-950/20">
            <div className="flex items-center justify-between relative max-w-xl mx-auto">
              {/* Connector line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-zinc-200 dark:bg-zinc-800 z-0" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--primary)] z-0 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((s) => {
                const active = currentStep >= s.num;
                const current = currentStep === s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center z-10">
                    <button
                      onClick={() => setCurrentStep(s.num)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border transition-all ${
                        current
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] ring-4 ring-[var(--primary)]/20"
                          : active
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      {s.num}
                    </button>
                    <span className={`text-[8.5px] mt-1 font-bold ${active ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Wizard Body */}
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              
              {/* STEP 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Step 1: Basic Pizza details</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Product Name *</label>
                    <input
                      type="text"
                      {...register("name", { onChange: handleNameChange })}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200"
                      placeholder="e.g. Tandoori Paneer Overloaded"
                    />
                    {errors.name && <p className="text-[10px] text-red-650 font-bold">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Category *</label>
                    <select
                      {...register("categoryId")}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {mockCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-[10px] text-red-650 font-bold">{errors.categoryId.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">SKU Code (Auto-generates if blank)</label>
                    <input
                      type="text"
                      {...register("sku")}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200 font-mono"
                      placeholder="e.g. PVP-PANEER-02"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Short Description (App summary)</label>
                    <input
                      type="text"
                      {...register("shortDescription")}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200"
                      placeholder="e.g. Fresh cottage cheese baked with red paprika and tandoori gravy."
                    />
                    {errors.shortDescription && <p className="text-[10px] text-red-650 font-bold">{errors.shortDescription.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Detailed Description (Web details)</label>
                    <textarea
                      rows={3}
                      {...register("description")}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200 resize-none font-sans"
                      placeholder="Enter recipe details, crust options, or specialty ingredients."
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Product Type & Kitchen Info */}
              {currentStep === 2 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Step 2: Dietary & Kitchen info</h4>
                  
                  {/* Dietary Radio Cards */}
                  <div className="space-y-2">
                    <label className="block text-zinc-500 font-bold">Food Dietary Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      <Controller
                        name="productType"
                        control={control}
                        render={({ field }) => (
                          <>
                            <button
                              type="button"
                              onClick={() => field.onChange("VEG")}
                              className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                                field.value === "VEG"
                                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 font-black"
                                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-400"
                              }`}
                            >
                              <Leaf size={16} className="fill-current text-emerald-500" />
                              <span>VEG</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange("NON_VEG")}
                              className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                                field.value === "NON_VEG"
                                  ? "border-rose-500 bg-rose-500/5 text-rose-600 font-black"
                                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-400"
                              }`}
                            >
                              <Flame size={16} className="fill-current text-rose-500" />
                              <span>NON_VEG</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange("EGG")}
                              className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                                field.value === "EGG"
                                  ? "border-yellow-500 bg-yellow-500/5 text-yellow-600 font-black"
                                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-400"
                              }`}
                            >
                              <Pizza size={16} className="fill-current text-yellow-500" />
                              <span>CONTAINS EGG</span>
                            </button>
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Preparation Time (Minutes) *</label>
                      <input
                        type="number"
                        {...register("preparationTime")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200"
                        placeholder="e.g. 15"
                      />
                      {errors.preparationTime && <p className="text-[10px] text-red-650 font-bold">{errors.preparationTime.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Calories (Kcal)</label>
                      <input
                        type="number"
                        {...register("calories")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200"
                        placeholder="e.g. 320"
                      />
                    </div>
                  </div>

                  {/* Spice Level Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold">
                      <label className="text-zinc-500">Spice Intensity Level (1 - 5)</label>
                      <span className="text-[var(--primary)] font-black">Level {watchedSpiceLevel}</span>
                    </div>
                    <Controller
                      name="spiceLevel"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="w-full accent-[var(--primary)] cursor-ew-resize bg-zinc-200 dark:bg-zinc-800 h-2 rounded-lg"
                        />
                      )}
                    />
                    <div className="flex justify-between text-[9px] text-zinc-450 font-bold uppercase">
                      <span>Mild (Margherita)</span>
                      <span>Spicy (Chicken Tikka)</span>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 3: Images Uploader */}
              {currentStep === 3 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Step 3: Media upload</h4>
                  
                  {/* Thumbnail */}
                  <div className="p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                    <label className="block text-zinc-500 font-bold">Primary Thumbnail Image *</label>
                    <div className="flex items-center gap-4">
                      {watchedImage ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                          <img src={watchedImage} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setValue("image", "")}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:scale-105 active:scale-95 shadow-md"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 flex-shrink-0">
                          <Upload size={18} />
                          <span className="text-[8px] mt-1 font-bold">NO IMAGE</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => simulateUpload("thumbnail", e.target.files)}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <label 
                          htmlFor="thumbnail-upload" 
                          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 text-[10px]"
                        >
                          <Upload size={12} />
                          <span>Upload WebP Photo</span>
                        </label>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-1 leading-normal">
                          Recommendation: Square WebP format, 400x400 pixels. Max size 200KB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div className="p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                    <label className="block text-zinc-500 font-bold">Gallery Photos (App carousel)</label>
                    
                    <div className="grid grid-cols-4 gap-3">
                      {(watch("galleryImages") || []).map((imgUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50">
                          <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = watch("galleryImages") || [];
                              setValue("galleryImages", curr.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:scale-105 active:scale-95 shadow-md z-10"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload box placeholder */}
                      <label className="border border-dashed border-zinc-200 dark:border-zinc-850 hover:bg-zinc-55/10 rounded-xl aspect-square flex flex-col items-center justify-center text-zinc-450 cursor-pointer transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => simulateUpload("gallery", e.target.files)}
                          className="hidden"
                        />
                        <Upload size={18} />
                        <span className="text-[8px] mt-1 font-bold">ADD PHOTO</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Pricing & Real-Time Product Preview */}
              {currentStep === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">
                  
                  {/* Left Column Form inputs */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Step 4: Pricing & Toggles</h4>
                    
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Base Price (INR ₹) *</label>
                      <input
                        type="number"
                        {...register("basePrice")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-black"
                        placeholder="e.g. 299"
                      />
                      {errors.basePrice && <p className="text-[10px] text-red-650 font-bold">{errors.basePrice.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Tax Category *</label>
                      <select
                        {...register("taxCategory")}
                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
                      >
                        {mockTaxCategories.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Visibility switches */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3 font-bold">
                      <span className="text-[9px] uppercase font-bold text-zinc-450 block">Configuration Flags</span>
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Featured Product</span>
                        <input
                          type="checkbox"
                          {...register("isFeatured")}
                          className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Best Seller Badge</span>
                        <input
                          type="checkbox"
                          {...register("isBestSeller")}
                          className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Customizable (Variants/Add-ons)</span>
                        <input
                          type="checkbox"
                          {...register("isCustomizable")}
                          className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Right Column: Live Card Preview */}
                  <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner">
                    <span className="text-[9.5px] uppercase font-bold text-zinc-400 block text-center">Live Preview Card</span>
                    
                    {/* Simulated Pizza product card */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-md max-w-xs mx-auto group">
                      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
                        <img 
                          src={watchedImage || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80"} 
                          alt="Live Preview" 
                          className="w-full h-full object-cover"
                        />
                        {watchedBestSeller && (
                          <span className="absolute top-2 right-2 bg-orange-500 text-white font-black text-[7.5px] px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5">
                            <Sparkles size={8} />
                            <span>BEST SELLER</span>
                          </span>
                        )}
                        <span className={`absolute top-2 left-2 px-1.5 py-0.2 border rounded-md text-[7.5px] font-black ${
                          watchedType === "VEG" 
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                            : watchedType === "NON_VEG" 
                              ? "text-rose-700 bg-rose-50 border-rose-200" 
                              : "text-yellow-700 bg-yellow-50 border-yellow-250"
                        }`}>
                          {watchedType}
                        </span>
                      </div>
                      
                      <div className="p-3 space-y-1.5 font-bold">
                        <p className="text-[9px] text-zinc-400 font-semibold uppercase">{getCategoryName(watchedCategory)}</p>
                        <p className="text-[11px] text-zinc-900 dark:text-white truncate leading-tight">{watchedName}</p>
                        
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">₹{watchedPrice}</p>
                          <p className="text-[8.5px] text-zinc-450 flex items-center gap-0.5">
                            <Clock size={10} />
                            <span>{watchedPrepTime} mins</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 5: Franchise Stores Availability Checklist */}
              {currentStep === 5 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Step 5: Store Pricing & Status</h4>
                      <p className="text-[9px] text-zinc-400 font-bold mt-0.5">Assign product overrides to specific franchise stores</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {storesList?.map((store, index) => {
                      const availName = `storesAvailability.${index}.available`;
                      const priceName = `storesAvailability.${index}.overridePrice`;
                      const storeIdName = `storesAvailability.${index}.storeId`;

                      // Initialize storeId field
                      setValue(storeIdName, store.storeId);

                      const isAvailable = watch(availName) !== false;

                      return (
                        <div 
                          key={store.storeId} 
                          className={`p-3 border rounded-xl flex items-center justify-between gap-4 transition-colors ${
                            isAvailable 
                              ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50/20" 
                              : "border-zinc-150 dark:border-zinc-900/50 bg-zinc-950/5 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-450"><Store size={14} /></div>
                            <div className="min-w-0">
                              <p className="text-[11.5px] font-black text-zinc-850 dark:text-zinc-200 truncate">
                                {store.storeName.replace("Papa Veg Pizza - ", "")}
                              </p>
                              <p className="text-[8.5px] text-zinc-400 font-semibold mt-0.5 truncate">
                                Delhi-NCR Region
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            {/* Available toggle switch */}
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <span className="text-[9px] font-bold text-zinc-400">Available</span>
                              <input
                                type="checkbox"
                                {...register(availName)}
                                className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                              />
                            </label>

                            {/* Price input (Disabled if not available) */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-zinc-400 font-bold">₹</span>
                              <input
                                type="number"
                                disabled={!isAvailable}
                                {...register(priceName)}
                                className="w-16 px-1.5 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-[10.5px] font-black text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
                                placeholder={watch("basePrice") || "Price"}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Wizard Navigation Footer controls */}
            <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0 text-xs">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>Save Specifications</span>
                </button>
              )}
            </footer>

          </form>

        </div>
      </div>
    </div>
  );
}
