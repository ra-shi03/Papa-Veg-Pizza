import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  CheckCircle,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  Check,
  Percent,
  Sliders,
  Flame,
  Clock
} from "lucide-react";

// Pure helper function declared outside the component to avoid Temporal Dead Zone (TDZ) and scoping issues
const generateSlugFromName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export default function AddProducts({ isOpen, onClose, product, mode = "add", onSave }) {
  // Mode can be: "add", "edit", "clone"
  const [currentStep, setCurrentStep] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states mapping to MongoDB columns
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    categoryId: "Signature Pizzas",
    description: "",
    shortDescription: "",
    tags: "",
    displayOrder: 1,
    vegType: "veg",
    productType: "simple",
    preparationTime: 15,
    calories: 340,
    taxCategory: "12",
    defaultPrice: 249,
    status: "Active",
    variants: [
      { name: "Regular", size: "7 inch", price: 249, weight: "280g", serving: "1-2 Servings", sku: "", barcode: "", status: "Active" }
    ],
    customization: {
      allowToppings: true,
      allowCrust: true,
      allowCheese: true,
      allowSauce: true,
      allowHalfAndHalf: false,
      maxAddons: 5
    },
    availability: "all",
    selectedFranchises: [],
    selectedStores: []
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form based on product and mode
  useEffect(() => {
    if (isOpen) {
      if (product) {
        if (mode === "edit") {
          setFormData({
            ...formData,
            ...product, // Spread product early so it doesn't overwrite default arrays/objects with undefined
            name: product.name || "",
            slug: product.slug || generateSlugFromName(product.name || ""),
            sku: product.id || "",
            categoryId: product.category || "Signature Pizzas",
            defaultPrice: parseFloat(product.price?.replace(/[^\d.]/g, "")) || 249,
            status: product.status || "Active",
            variants: product.variants || formData.variants || [
              { name: "Regular", size: "7 inch", price: 249, weight: "280g", serving: "1-2 Servings", sku: "", barcode: "", status: "Active" }
            ],
            customization: product.customization || formData.customization || {
              allowToppings: true,
              allowCrust: true,
              allowCheese: true,
              allowSauce: true,
              allowHalfAndHalf: false,
              maxAddons: 5
            },
            selectedFranchises: product.selectedFranchises || formData.selectedFranchises || [],
            selectedStores: product.selectedStores || formData.selectedStores || []
          });
        } else if (mode === "clone") {
          setFormData({
            ...formData,
            ...product, // Spread product early
            name: `${product.name} (Clone)` || "",
            slug: `${generateSlugFromName(product.name || "")}-clone`,
            sku: `${product.id}-CLONED`,
            categoryId: product.category || "Signature Pizzas",
            defaultPrice: parseFloat(product.price?.replace(/[^\d.]/g, "")) || 249,
            status: "Draft",
            variants: (product.variants || [
              { name: "Regular", size: "7 inch", price: 249, weight: "280g", serving: "1-2 Servings", sku: "", barcode: "", status: "Active" }
            ]).map((v) => ({
              ...v,
              sku: v.sku ? `${v.sku}-CLONED` : ""
            })),
            customization: product.customization || formData.customization || {
              allowToppings: true,
              allowCrust: true,
              allowCheese: true,
              allowSauce: true,
              allowHalfAndHalf: false,
              maxAddons: 5
            },
            selectedFranchises: product.selectedFranchises || formData.selectedFranchises || [],
            selectedStores: product.selectedStores || formData.selectedStores || [],
            id: undefined, // remove actual id
            _id: undefined
          });
        }
      } else {
        // Reset to default for "add" mode
        setFormData({
          name: "",
          slug: "",
          sku: "",
          categoryId: "Signature Pizzas",
          description: "",
          shortDescription: "",
          tags: "",
          displayOrder: 1,
          vegType: "veg",
          productType: "simple",
          preparationTime: 15,
          calories: 340,
          taxCategory: "12",
          defaultPrice: 249,
          status: "Active",
          variants: [
            { name: "Regular", size: "7 inch", price: 249, weight: "280g", serving: "1-2 Servings", sku: "", barcode: "", status: "Active" }
          ],
          customization: {
            allowToppings: true,
            allowCrust: true,
            allowCheese: true,
            allowSauce: true,
            allowHalfAndHalf: false,
            maxAddons: 5
          },
          availability: "all",
          selectedFranchises: [],
          selectedStores: []
        });
      }
      setCurrentStep(1);
      setHasChanges(false);
      setShowCloseWarning(false);
      setValidationErrors({});
    }
  }, [isOpen, product, mode]);

  if (!isOpen) return null;

  const handleInputChange = (field, val) => {
    setHasChanges(true);
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === "name" && mode !== "edit") {
        updated.slug = generateSlugFromName(val);
      }
      return updated;
    });
  };

  const handleCustomizationChange = (field, val) => {
    setHasChanges(true);
    setFormData((prev) => ({
      ...prev,
      customization: {
        ...prev.customization,
        [field]: val
      }
    }));
  };

  // Variants handlers
  const handleVariantChange = (index, field, val) => {
    setHasChanges(true);
    setFormData((prev) => {
      const newVariants = [...(prev.variants || [])];
      if (newVariants[index]) {
        newVariants[index] = { ...newVariants[index], [field]: val };
      }
      return { ...prev, variants: newVariants };
    });
  };

  const addVariantRow = () => {
    setHasChanges(true);
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { name: "New Variant", size: "10 inch", price: prev.defaultPrice, weight: "400g", serving: "2-3 Servings", sku: "", barcode: "", status: "Active" }
      ]
    }));
  };

  const removeVariantRow = (index) => {
    if (!formData.variants || formData.variants.length <= 1) return;
    setHasChanges(true);
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index)
    }));
  };

  const duplicateVariantRow = (index) => {
    setHasChanges(true);
    setFormData((prev) => {
      const source = prev.variants?.[index];
      if (!source) return prev;
      return {
        ...prev,
        variants: [
          ...(prev.variants || []),
          { ...source, name: `${source.name} (Copy)`, sku: source.sku ? `${source.sku}-COPY` : "" }
        ]
      };
    });
  };

  // Pure validation checker to be called during render (avoids infinite re-renders)
  const checkStepValidity = (step) => {
    if (step === 1) {
      if (!formData.name.trim()) return false;
      if (!formData.slug.trim()) return false;
      if (!formData.sku.trim()) return false;
      if (!formData.categoryId) return false;
    } else if (step === 3) {
      if (formData.defaultPrice < 0) return false;
      if (formData.preparationTime <= 0) return false;
      if (formData.calories < 0) return false;
    } else if (step === 4 && formData.productType === "variants") {
      let valid = true;
      formData.variants?.forEach((v) => {
        if (!v.name?.trim()) valid = false;
        if (v.price < 0) valid = false;
      });
      if (!valid) return false;
    } else if (step === 5) {
      if ((formData.customization?.maxAddons ?? 0) < 0) return false;
    }
    return true;
  };

  // Validation rules that also update state (to be called inside event handlers only)
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.name.trim()) errors.name = "Product Name is required.";
      if (!formData.slug.trim()) errors.slug = "Slug path is required.";
      if (!formData.sku.trim()) errors.sku = "Product SKU code is required.";
      if (!formData.categoryId) errors.category = "Please select a category.";
    } else if (step === 3) {
      if (formData.defaultPrice < 0) errors.price = "Price cannot be negative.";
      if (formData.preparationTime <= 0) errors.prepTime = "Prep time must be greater than 0.";
      if (formData.calories < 0) errors.calories = "Calories cannot be negative.";
    } else if (step === 4 && formData.productType === "variants") {
      formData.variants?.forEach((v, i) => {
        if (!v.name?.trim()) errors[`varName_${i}`] = "Variant name is required.";
        if (v.price < 0) errors[`varPrice_${i}`] = "Price cannot be negative.";
      });
    } else if (step === 5) {
      if ((formData.customization?.maxAddons ?? 0) < 0) errors.addons = "Max add-ons cannot be negative.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < 7) {
      // Skip variants step if simple product type selected
      if (currentStep === 3 && formData.productType === "simple") {
        setCurrentStep(5); // skip Step 4
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 5 && formData.productType === "simple") {
        setCurrentStep(3); // skip Step 4 backwards
      } else {
        setCurrentStep((prev) => prev - 1);
      }
    } else {
      handleCloseRequest();
    }
  };

  const handleCloseRequest = () => {
    if (hasChanges) {
      setShowCloseWarning(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSave?.(formData, mode);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal/Drawer Container */}
      <div className="w-full md:w-[680px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        
        {/* Header */}
        <header className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--primary)]" />
              {mode === "edit" ? "Edit Product Details" : mode === "clone" ? "Clone Catalog Product" : "Create New Product"}
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
              Step {currentStep} of 7: {
                currentStep === 1 ? "Basic Details" :
                currentStep === 2 ? "Featured & Gallery Images" :
                currentStep === 3 ? "Configurations" :
                currentStep === 4 ? "Product Sizes & Variants" :
                currentStep === 5 ? "Toppings & Crust Rules" :
                currentStep === 6 ? "Franchise Availability" : "Review & Publish"
              }
            </p>
          </div>
          <button
            onClick={handleCloseRequest}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-855 rounded-full transition-colors text-zinc-500"
          >
            <X size={18} />
          </button>
        </header>

        {/* Progress Timeline Header */}
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/30 flex justify-between select-none">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
            <button
              key={step}
              onClick={() => {
                if (step < currentStep || validateStep(currentStep)) {
                  // If simple type, prevent clicking step 4
                  if (step === 4 && formData.productType === "simple") return;
                  setCurrentStep(step);
                }
              }}
              disabled={step > currentStep && !checkStepValidity(currentStep)}
              className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] transition-all border ${
                currentStep === step
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm scale-110"
                  : step < currentStep
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
              }`}
            >
              {step < currentStep ? <Check size={10} /> : step}
            </button>
          ))}
        </div>

        {/* Content canvas */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 space-y-4">
          
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Paneer Tikka Supreme"
                  className={`w-full h-9 px-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white dark:bg-zinc-900 text-xs font-semibold outline-none transition-all ${
                    validationErrors.name ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-[9px] font-bold text-red-500">{validationErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Auto-generated Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    placeholder="paneer-tikka-supreme"
                    className={`w-full h-9 px-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white dark:bg-zinc-900 text-xs font-mono outline-none transition-all ${
                      validationErrors.slug ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  />
                  {validationErrors.slug && (
                    <p className="text-[9px] font-bold text-red-500">{validationErrors.slug}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Product SKU Code *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      placeholder="PP-V-PNE-005"
                      className={`w-full h-9 px-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white dark:bg-zinc-900 text-xs font-mono outline-none transition-all ${
                        validationErrors.sku ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange("sku", `PP-V-${Math.floor(100000 + Math.random() * 900000)}`)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded hover:bg-[var(--primary)]/20"
                    >
                      Generate
                    </button>
                  </div>
                  {validationErrors.sku && (
                    <p className="text-[9px] font-bold text-red-500">{validationErrors.sku}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Catalog Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange("categoryId", e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
                  >
                    <option>Signature Pizzas</option>
                    <option>Classic Pizzas</option>
                    <option>Sides & Bread</option>
                    <option>Beverages</option>
                    <option>Desserts & Sweets</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Display Layout Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => handleInputChange("displayOrder", parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Short Tagline Description
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  placeholder="e.g. Traditional Paneer chunks marinated in spicy tikka paste and cheese."
                  rows={2}
                  className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none placeholder-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Full Catalog Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the product taste profile, toppings mix, and serving details..."
                  rows={4}
                  className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none placeholder-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Search Tag Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="Paneer, Spicy, Chef Special, Signature"
                  className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none placeholder-zinc-400"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Images Upload */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Featured Product Banner Image
                </label>
                <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-55 dark:bg-zinc-900/50 p-6 rounded-xl text-center group hover:border-[var(--primary)] transition-colors cursor-pointer overflow-hidden">
                  <input type="file" className="hidden" id="featured_uploader" />
                  <label htmlFor="featured_uploader" className="cursor-pointer flex flex-col items-center justify-center">
                    <UploadCloud size={32} className="text-zinc-450 group-hover:text-[var(--primary)] transition-colors mb-2" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Drag or click to upload Featured Banner</span>
                    <span className="text-[10px] text-zinc-550 mt-1">Recommended resolution: 800x600 PNG or JPEG</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Gallery Upload Grid
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="aspect-square border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-[var(--primary)] text-zinc-450">
                    <Plus size={20} />
                  </div>
                  {[
                    "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=150&q=80"
                  ].map((url, i) => (
                    <div key={i} className="aspect-square relative rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden group">
                      <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Product Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Dietary Classification
                  </label>
                  <div className="flex gap-2">
                    {["veg", "vegan", "non-veg"].map((diet) => (
                      <label key={diet} className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="vegType"
                          value={diet}
                          checked={formData.vegType === diet}
                          onChange={(e) => handleInputChange("vegType", e.target.value)}
                          className="hidden peer"
                        />
                        <div className="h-9 border border-zinc-300 dark:border-zinc-700 rounded-lg flex items-center justify-center font-bold text-xs peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]/5 text-zinc-650 dark:text-zinc-350 peer-checked:text-[var(--primary)] capitalize transition-all select-none">
                          {diet}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Product Type
                  </label>
                  <div className="flex gap-2">
                    {[
                      { type: "simple", label: "Simple Product" },
                      { type: "variants", label: "Variant Based" }
                    ].map((pt) => (
                      <label key={pt.type} className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value={pt.type}
                          checked={formData.productType === pt.type}
                          onChange={(e) => handleInputChange("productType", e.target.value)}
                          className="hidden peer"
                        />
                        <div className="h-9 border border-zinc-300 dark:border-zinc-700 rounded-lg flex items-center justify-center font-bold text-xs peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]/5 text-zinc-655 dark:text-zinc-350 peer-checked:text-[var(--primary)] transition-all select-none">
                          {pt.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Prep Time (minutes) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => handleInputChange("preparationTime", parseInt(e.target.value) || 15)}
                      className={`w-full h-9 pl-3 pr-8 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white dark:bg-zinc-900 text-xs font-semibold outline-none ${
                        validationErrors.prepTime ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    />
                    <Clock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Calorie Count *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => handleInputChange("calories", parseInt(e.target.value) || 0)}
                      className={`w-full h-9 pl-3 pr-8 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white dark:bg-zinc-900 text-xs font-semibold outline-none ${
                        validationErrors.calories ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    />
                    <Flame size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Tax GST Category
                  </label>
                  <select
                    value={formData.taxCategory}
                    onChange={(e) => handleInputChange("taxCategory", e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
                  >
                    <option value="5">GST 5% Standard</option>
                    <option value="12">GST 12% Premium</option>
                    <option value="18">GST 18% Luxuries</option>
                    <option value="0">GST Exempt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Default Base Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">₹</span>
                    <input
                      type="number"
                      value={formData.defaultPrice}
                      onChange={(e) => handleInputChange("defaultPrice", parseFloat(e.target.value) || 0)}
                      className={`w-full h-9 pl-7 pr-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white dark:bg-zinc-900 text-xs font-bold outline-none ${
                        validationErrors.price ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    />
                  </div>
                  {validationErrors.price && (
                    <p className="text-[9px] font-bold text-red-500">{validationErrors.price}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Initial Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* STEP 4: Variants Table (Visible only if productType is variants) */}
          {currentStep === 4 && formData.productType === "variants" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">
                  Product Multi-sizes & Weights
                </h4>
                <button
                  type="button"
                  onClick={addVariantRow}
                  className="bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Variant Size
                </button>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto bg-white dark:bg-zinc-900">
                <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40">
                    <tr>
                      <th className="px-2.5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                      <th className="px-2.5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-20">Size</th>
                      <th className="px-2.5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-20">Price (₹)</th>
                      <th className="px-2.5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-16">Weight</th>
                      <th className="px-2.5 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SKU Override</th>
                      <th className="px-2.5 py-2 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                    {formData.variants?.map((v, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-2.5 py-2">
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => handleVariantChange(i, "name", e.target.value)}
                            placeholder="e.g. Medium"
                            className="w-full h-8 px-2 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-950 text-xs font-semibold rounded outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-2">
                          <input
                            type="text"
                            value={v.size}
                            onChange={(e) => handleVariantChange(i, "size", e.target.value)}
                            placeholder="10 inch"
                            className="w-full h-8 px-2 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-955 text-xs rounded outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-2">
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => handleVariantChange(i, "price", parseFloat(e.target.value) || 0)}
                            className="w-full h-8 px-2 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-955 text-xs font-bold rounded outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-2">
                          <input
                            type="text"
                            value={v.weight}
                            onChange={(e) => handleVariantChange(i, "weight", e.target.value)}
                            placeholder="450g"
                            className="w-full h-8 px-2 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-955 text-xs rounded outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-2">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleVariantChange(i, "sku", e.target.value)}
                            placeholder="Auto SKU"
                            className="w-full h-8 px-2 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-955 text-xs font-mono rounded outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-2 text-right flex items-center justify-end gap-1.5 h-12">
                          <button
                            type="button"
                            onClick={() => duplicateVariantRow(i)}
                            title="Duplicate row"
                            className="p-1 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeVariantRow(i)}
                            disabled={formData.variants?.length <= 1}
                            title="Delete variant"
                            className="p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* STEP 5: Customizations & Switches */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-3.5">
                {[
                  { key: "allowToppings", label: "Allow Customers to Add Extra Toppings" },
                  { key: "allowCrust", label: "Allow Custom Crust Options (Cheese Burst, Thin Crust)" },
                  { key: "allowCheese", label: "Allow Extra Cheese Selection" },
                  { key: "allowSauce", label: "Allow Pizza Sauce Customizations" },
                  { key: "allowHalfAndHalf", label: "Allow Half & Half Selection (split toppings)" }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {item.label}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.customization?.[item.key]}
                        onChange={(e) => handleCustomizationChange(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--primary)]" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Maximum Allowable Add-ons (cap limit)
                </label>
                <input
                  type="number"
                  value={formData.customization?.maxAddons}
                  onChange={(e) => handleCustomizationChange("maxAddons", parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-28 h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
                />
              </div>

            </div>
          )}

          {/* STEP 6: Franchise/Store Availability */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-150 block">
                  Availability Rules
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {[
                    { val: "all", label: "Available in All Stores" },
                    { val: "franchise", label: "Selected Franchises" },
                    { val: "store", label: "Selected Store Branches" }
                  ].map((opt) => (
                    <label key={opt.val} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="availability"
                        value={opt.val}
                        checked={formData.availability === opt.val}
                        onChange={(e) => handleInputChange("availability", e.target.value)}
                        className="hidden peer"
                      />
                      <div className="h-10 border border-zinc-300 dark:border-zinc-700 rounded-lg flex items-center justify-center font-bold text-xs peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]/5 text-zinc-650 dark:text-zinc-350 peer-checked:text-[var(--primary)] transition-all select-none px-3 text-center">
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Franchise selector */}
              {formData.availability === "franchise" && (
                <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Assign to Franchises (search & multi-select)
                  </label>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50 space-y-2 max-h-48 overflow-y-auto">
                    {[
                      { id: "f1", name: "Indore Central (HQ)" },
                      { id: "f2", name: "Bhopal Zone" },
                      { id: "f3", name: "Ujjain Branch" }
                    ].map((f) => (
                      <label key={f.id} className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{f.name}</span>
                        <input
                          type="checkbox"
                          checked={formData.selectedFranchises?.includes(f.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              selectedFranchises: isChecked
                                ? [...(prev.selectedFranchises || []), f.id]
                                : (prev.selectedFranchises || []).filter((id) => id !== f.id)
                            }));
                          }}
                          className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stores selector */}
              {formData.availability === "store" && (
                <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Assign to Specific Store Locations
                  </label>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50 space-y-2 max-h-48 overflow-y-auto">
                    {[
                      { id: "s1", name: "Papa Veg Indore - Scheme 54" },
                      { id: "s2", name: "Papa Veg Indore - Vijay Nagar" },
                      { id: "s3", name: "Papa Veg Bhopal - MP Nagar" },
                      { id: "s4", name: "Papa Veg Ujjain - Nanakheda" }
                    ].map((s) => (
                      <label key={s.id} className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{s.name}</span>
                        <input
                          type="checkbox"
                          checked={formData.selectedStores?.includes(s.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              selectedStores: isChecked
                                ? [...(prev.selectedStores || []), s.id]
                                : (prev.selectedStores || []).filter((id) => id !== s.id)
                            }));
                          }}
                          className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 7: Review & Publish Summary */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200 select-none">
              
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/15 rounded-xl flex items-start gap-2.5">
                <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-805">Ready to Publish</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Please review the summary configuration details of the catalog product.</p>
                </div>
              </div>

              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900/50 space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="text-zinc-500 font-semibold">Product Name:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{formData.name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="text-zinc-500 font-semibold">SKU Code / Slug:</span>
                  <span className="font-mono text-[10px] text-zinc-800 dark:text-zinc-100">{formData.sku} / {formData.slug}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="text-zinc-500 font-semibold">Base price:</span>
                  <span className="font-bold text-[var(--primary)]">₹{formData.defaultPrice}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="text-zinc-500 font-semibold">Product Type:</span>
                  <span className="font-bold capitalize">{formData.productType === "variants" ? `${formData.variants?.length || 0} Variants` : "Simple Pizza"}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="text-zinc-500 font-semibold">Dietary Classification:</span>
                  <span className="font-bold uppercase tracking-wider text-green-600">{formData.vegType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Store Coverage availability:</span>
                  <span className="font-bold uppercase tracking-wider">{formData.availability === "all" ? "All Stores" : formData.availability === "franchise" ? "Franchises" : "Specific Stores"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Modify Publish Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

            </div>
          )}

        </main>

        {/* Footer Actions */}
        <footer className="bg-zinc-50 dark:bg-zinc-900/50 p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="px-4 py-1.5 h-9 rounded-lg border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-350 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {currentStep > 1 ? "Back" : "Cancel"}
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && currentStep < 7 && (
              <button
                type="button"
                onClick={() => {
                  handleInputChange("status", "Draft");
                  handleSave();
                }}
                className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-bold text-[10px] uppercase tracking-wider hover:underline transition-colors px-3 py-1.5"
              >
                Save Draft
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-5 py-1.5 h-9 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : currentStep === 7 ? (
                <span>Publish Product</span>
              ) : (
                <>
                  <span>Next Step</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </footer>

        {/* Warn Close Dialog Overlay */}
        {showCloseWarning && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center space-y-4 shadow-2xl">
              <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-955/20 border border-rose-250 dark:border-rose-900/35 flex items-center justify-center text-rose-500 mx-auto">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Discard Unsaved Changes?</h4>
                <p className="text-[10px] text-zinc-500 mt-1">You have unsaved changes that will be lost permanently.</p>
              </div>
              <div className="flex justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCloseWarning(false)}
                  className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-350 font-bold text-[10px] rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseWarning(false);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow-md"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
