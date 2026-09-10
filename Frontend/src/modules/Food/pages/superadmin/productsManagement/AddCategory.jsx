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
  Clock,
  Search,
  ArrowLeft,
  ArrowRight,
  FolderTree,
  Lightbulb,
  Image as ImageIcon
} from "lucide-react";

// Pure helper function declared outside component to avoid Temporal Dead Zone (TDZ)
const generateSlugFromName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export default function AddCategory({ isOpen, onClose, category, mode = "add", onSave, existingCategories = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states mapping directly to MongoDB collection structure
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
    description: "",
    image: "",
    icon: "",
    displayOrder: 1,
    status: "Active",
    isVisible: true,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: ""
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form based on selected category and mode
  useEffect(() => {
    if (isOpen) {
      if (category) {
        if (mode === "edit") {
          setFormData({
            ...formData,
            ...category,
            name: category.name || "",
            slug: category.slug || generateSlugFromName(category.name || ""),
            parentId: category.parentId || "",
            description: category.description || "",
            image: category.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=600&h=300&q=80",
            icon: category.icon || "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=80&h=80&q=80",
            displayOrder: category.sortOrder || 1,
            status: category.status || "Active",
            isVisible: category.isVisible !== false,
            metaTitle: category.metaTitle || `${category.name} | Papa Veg Pizza`,
            metaDescription: category.metaDescription || category.description || "",
            metaKeywords: category.metaKeywords || ""
          });
        }
      } else {
        // Reset to default for "add" mode
        setFormData({
          name: "",
          slug: "",
          parentId: "",
          description: "",
          image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=600&h=300&q=80",
          icon: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=80&h=80&q=80",
          displayOrder: 1,
          status: "Active",
          isVisible: true,
          metaTitle: "",
          metaDescription: "",
          metaKeywords: ""
        });
      }
      setCurrentStep(1);
      setHasChanges(false);
      setShowCloseWarning(false);
      setValidationErrors({});
    }
  }, [isOpen, category, mode]);

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

  // Pure validation checker (safe to call during render)
  const checkStepValidity = (step) => {
    if (step === 1) {
      if (!formData.name?.trim()) return false;
      if (!formData.slug?.trim()) return false;
      if (formData.parentId && category && formData.parentId === category.id) return false;
    } else if (step === 3) {
      if (formData.displayOrder < 0) return false;
    }
    return true;
  };

  // State-updating validation (only inside event handlers)
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.name?.trim()) errors.name = "Category Name is required.";
      if (!formData.slug?.trim()) errors.slug = "Slug path is required.";
      if (formData.parentId && category && formData.parentId === category.id) {
        errors.parent = "Category cannot reference itself as a parent.";
      }
    } else if (step === 3) {
      if (formData.displayOrder < 0) errors.priority = "Display order cannot be negative.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
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

  // Filter existing categories to prevent circular assignment
  const selectableParents = existingCategories.filter((c) => !category || c.id !== category.id);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Drawer */}
      <div className="w-full md:w-[640px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        
        {/* Header */}
        <header className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--primary)]" />
              {mode === "edit" ? "Edit Category Settings" : "Create New Category"}
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
              Step {currentStep} of 4: {
                currentStep === 1 ? "Basic Details" :
                currentStep === 2 ? "Icon & Banner Images" :
                currentStep === 3 ? "Display Configurations" : "SEO Metadata"
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

        {/* Stepper Timeline */}
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/30 flex justify-between select-none">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => {
                if (step < currentStep || validateStep(currentStep)) {
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

        {/* Form Content */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 space-y-4">
          
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Gourmet Pizzas"
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
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    placeholder="gourmet-pizzas"
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
                    Parent Category (Optional)
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => handleInputChange("parentId", e.target.value)}
                    className={`w-full h-9 px-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white dark:bg-zinc-900 text-xs font-semibold outline-none ${
                      validationErrors.parent ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    <option value="">None (Top Level)</option>
                    {selectableParents.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.parent && (
                    <p className="text-[9px] font-bold text-red-500">{validationErrors.parent}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Category Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the category, flavor profile, and menu items inclusions..."
                  rows={4}
                  className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none placeholder-zinc-400"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Images Upload */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Icon upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Category Icon (webp)
                  </label>
                  <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-55 dark:bg-zinc-900/50 p-4 rounded-xl text-center group hover:border-[var(--primary)] transition-colors cursor-pointer aspect-square flex flex-col justify-center items-center">
                    <UploadCloud size={24} className="text-zinc-450 group-hover:text-[var(--primary)] mb-1.5" />
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">Drop square icon here</span>
                    <span className="text-[8px] text-zinc-400 mt-1">Recommended: 80x80px WebP</span>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Category Cover Banner (webp)
                  </label>
                  <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-55 dark:bg-zinc-900/50 p-4 rounded-xl text-center group hover:border-[var(--primary)] transition-colors cursor-pointer aspect-square flex flex-col justify-center items-center">
                    <ImageIcon size={24} className="text-zinc-450 group-hover:text-[var(--primary)] mb-1.5" />
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">Drop header banner here</span>
                    <span className="text-[8px] text-zinc-400 mt-1">Recommended: 1200x600px WebP</span>
                  </div>
                </div>

              </div>

              {/* Style Tips */}
              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-150 dark:border-zinc-800 flex items-start gap-2.5">
                <Lightbulb className="text-[var(--primary)] shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">Quality Checklist:</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                    Always request WebP assets where possible. High quality pizza closeups boost mobile app engagement by over 20%.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Display Settings */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Display Priority Order *
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => handleInputChange("displayOrder", parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg outline-none"
                  />
                  <p className="text-[9px] text-zinc-500 italic mt-1">Lowest priority value displays first in app tabs.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Active Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Visible in Storefront</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle visibility on web and mobile client applications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => handleInputChange("isVisible", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]" />
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: SEO Metadata */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                    placeholder="e.g. Best Vegetarian Pizzas in Indore"
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    SEO Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                    placeholder="Describe category listing for search results Google preview snippet..."
                    rows={3}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium rounded-lg outline-none placeholder-zinc-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    SEO Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) => handleInputChange("metaKeywords", e.target.value)}
                    placeholder="indore, bhopal, pizza, gourmet, veg"
                    className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold rounded-lg outline-none"
                  />
                </div>

                {/* Google Search Result Preview */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-950 shadow-inner overflow-hidden">
                  <span className="text-[9px] text-zinc-450 block truncate">
                    https://papavegpizza.com/cat/{formData.slug || "..."}
                  </span>
                  <h4 className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate mt-0.5">
                    {formData.metaTitle || `${formData.name || "Category"} | Catalog`}
                  </h4>
                  <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-relaxed mt-0.5 line-clamp-2">
                    {formData.metaDescription || "Provide an SEO meta description to preview how this category listing appears in Google results."}
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Footer Actions */}
        <footer className="bg-zinc-50 dark:bg-zinc-900/50 p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-lg border border-zinc-305 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-950"
          >
            {currentStep > 1 ? "Back" : "Cancel"}
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && currentStep < 4 && (
              <button
                type="button"
                onClick={handleSave}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold text-xs uppercase tracking-wider px-2 transition-colors"
              >
                Save Draft
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`px-5 py-1.5 rounded-lg text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                currentStep === 4 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[var(--primary)] hover:brightness-110"
              }`}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : currentStep === 4 ? (
                <>
                  <span>Save Category</span>
                  <Check size={12} className="stroke-[3]" />
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
