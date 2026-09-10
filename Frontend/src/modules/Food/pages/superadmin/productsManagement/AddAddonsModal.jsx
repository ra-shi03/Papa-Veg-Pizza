import React, { useState, useEffect } from "react";
import { X, CloudUpload, ArrowRight, ArrowLeft, Trash2, CheckCircle2, Search, Sparkles, Check, CheckSquare, Square } from "lucide-react";

export default function AddAddonsModal({
  isOpen,
  onClose,
  products = [],
  categories = [],
  onSave
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // STEP 1 Fields
  const [name, setName] = useState("");
  const [type, setType] = useState("topping");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);

  // STEP 2 Fields
  const [price, setPrice] = useState(0);
  const [isVegan, setIsVegan] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(3);
  const [defaultQuantity, setDefaultQuantity] = useState(0);
  const [isRequired, setIsRequired] = useState(false);
  const [isAvailableByDefault, setIsAvailableByDefault] = useState(false);

  // STEP 3 Fields (Media)
  const [image, setImage] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // STEP 4 Fields (Availability)
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [prodSearch, setProdSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");

  // STEP 5 Fields (Status)
  const [status, setStatus] = useState("active");
  const [visibleInApp, setVisibleInApp] = useState(true);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setName("");
      setType("topping");
      setDescription("");
      setDisplayOrder(1);
      setPrice(0);
      setIsVegan(false);
      setMaxQuantity(3);
      setDefaultQuantity(0);
      setIsRequired(false);
      setIsAvailableByDefault(false);
      setImage("");
      setSelectedCategories([]);
      setSelectedProducts([]);
      setStatus("active");
      setVisibleInApp(true);
      setErrors({});
      setProdSearch("");
      setCatSearch("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Multi-select Category Helpers
  const toggleCategory = (catName) => {
    setSelectedCategories(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  // Multi-select Product Helpers
  const toggleProduct = (prodId) => {
    setSelectedProducts(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  // Image upload simulator
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  // Step validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!name.trim()) newErrors.name = "Add-on Name is required.";
      if (!type) newErrors.type = "Add-on Type is required.";
    }
    if (step === 2) {
      if (price < 0) newErrors.price = "Price must be greater than or equal to ₹0.";
      if (maxQuantity < 1) newErrors.maxQuantity = "Maximum Quantity must be at least 1.";
      if (defaultQuantity < 0) newErrors.defaultQuantity = "Default Quantity must be at least 0.";
      if (defaultQuantity > maxQuantity) newErrors.defaultQuantity = "Default Quantity cannot exceed Maximum Quantity.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = (isDraft = false) => {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1); // Jump back to validation failure
      return;
    }

    const payload = {
      name,
      type,
      price: parseFloat(price) || 0,
      isVeg: true,
      isVegan,
      maxQuantity: parseInt(maxQuantity) || 1,
      defaultQuantity: parseInt(defaultQuantity) || 0,
      isRequired,
      isAvailableByDefault,
      image: image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80",
      description,
      displayOrder: parseInt(displayOrder) || 1,
      status: isDraft ? "inactive" : status,
      visibleInApp,
      selectedCategories,
      selectedProducts
    };

    onSave?.(payload);
    onClose();
  };

  // Filter Categories & Products lists based on search queries
  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredProductsList = products.filter(prod =>
    prod.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    prod.category.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Add New Add-on</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Configure menu customization options.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-550"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30">
          <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-400 mb-1">
            <span>
              {currentStep === 1 && "Step 1 — Basic Information"}
              {currentStep === 2 && "Step 2 — Pricing & Rules"}
              {currentStep === 3 && "Step 3 — Media Assets"}
              {currentStep === 4 && "Step 4 — Availability Options"}
              {currentStep === 5 && "Step 5 — Publish Status"}
            </span>
            <span>Step {currentStep} of 5</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-1 flex-1 rounded-full transition-all duration-350 ${
                  currentStep >= stepNum ? "bg-[var(--primary)]" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Form Scroll Body */}
        <div className="p-4 overflow-y-auto flex-1 hide-scrollbar space-y-4">
          
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Add-on Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Extra Paneer Tikka Cubes"
                  className={`w-full h-9 px-3 border rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-white dark:bg-zinc-900 ${
                    errors.name ? "border-red-500" : "border-zinc-250 dark:border-zinc-700"
                  }`}
                />
                {errors.name && <p className="text-[9px] font-bold text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-9 px-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] font-semibold"
                  >
                    <option value="topping">Topping</option>
                    <option value="extra cheese">Extra Cheese</option>
                    <option value="sauce">Sauce</option>
                    <option value="dip">Dip</option>
                    <option value="crust">Crust</option>
                    <option value="seasoning">Seasoning</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Display Order Priority</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold outline-none focus:border-[var(--primary)] font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize description for customer app selection card..."
                  className="w-full p-2.5 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-xs outline-none focus:border-[var(--primary)] font-medium resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Pricing & Rules */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Price per Portion (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={`w-full h-9 pl-7 pr-3 border rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-white dark:bg-zinc-900 ${
                        errors.price ? "border-red-500" : "border-zinc-250 dark:border-zinc-700"
                      }`}
                    />
                  </div>
                  {errors.price && <p className="text-[9px] font-bold text-red-500 mt-1">{errors.price}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Classification Type</label>
                  <div className="flex bg-zinc-50 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 h-9">
                    <button
                      type="button"
                      onClick={() => setIsVegan(false)}
                      className={`flex-1 text-[10px] font-black uppercase rounded transition-all flex items-center justify-center gap-1 ${
                        !isVegan ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-500"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white border border-green-600 shrink-0" />
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVegan(true)}
                      className={`flex-1 text-[10px] font-black uppercase rounded transition-all flex items-center justify-center gap-1 ${
                        isVegan ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-500"
                      }`}
                    >
                      🌱 Vegan
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Max Quantity Allowed *</label>
                  <input
                    type="number"
                    min="1"
                    value={maxQuantity}
                    onChange={(e) => setMaxQuantity(e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold outline-none focus:border-[var(--primary)] font-mono"
                  />
                  {errors.maxQuantity && <p className="text-[9px] font-bold text-red-500 mt-1">{errors.maxQuantity}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Default Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={defaultQuantity}
                    onChange={(e) => setDefaultQuantity(e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold outline-none focus:border-[var(--primary)] font-mono"
                  />
                  {errors.defaultQuantity && <p className="text-[9px] font-bold text-red-500 mt-1">{errors.defaultQuantity}</p>}
                </div>
              </div>

              {/* Requirement Checkboxes */}
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <label className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 bg-zinc-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                  <div>
                    <p className="text-[10px] font-bold">Mandatory Choice?</p>
                    <p className="text-[8px] text-zinc-400">Forces customer selection</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 bg-zinc-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailableByDefault}
                    onChange={(e) => setIsAvailableByDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                  <div>
                    <p className="text-[10px] font-bold">Available by Default?</p>
                    <p className="text-[8px] text-zinc-400">Pre-selects in basket options</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Media Upload */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Add-on Image</label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative min-h-[160px] ${
                  dragOver
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {image ? (
                  /* Preview state with Replace / Remove crop actions */
                  <div className="w-full flex flex-col items-center gap-3">
                    <img
                      src={image}
                      alt="Topping Preview"
                      className="w-20 h-20 rounded-lg object-cover shadow border border-zinc-200 dark:border-zinc-800"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                      <label className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-zinc-700 dark:text-zinc-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors">
                        Replace
                        <input type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Crop support is triggered! (Cropping simulation overlay)")}
                        className="px-2.5 py-1 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded text-[10px] font-bold transition-all"
                      >
                        Crop Image
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty upload zone */
                  <>
                    <div className="w-11 h-11 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                      <CloudUpload size={22} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold">Drag & Drop Image or Click to Browse</p>
                      <p className="text-[9px] text-zinc-400 mt-1">Accept WebP, PNG, JPEG formats up to 4MB</p>
                    </div>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Availability */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Categories linkage */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Compatible Categories</label>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search compatible categories..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-[11px] font-semibold outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-[80px] overflow-y-auto">
                  {filteredCategories.map(cat => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-2 py-1 text-[10px] font-black rounded border transition-all flex items-center gap-1 ${
                          isSelected
                            ? "bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)]"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550"
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products linkage */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Available Products *</label>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search products by title..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-[11px] font-semibold outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                
                <div className="max-h-[140px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-150 dark:divide-zinc-850 bg-white dark:bg-zinc-900 scrollbar-thin">
                  {filteredProductsList.map(prod => {
                    const isSelected = selectedProducts.includes(prod.id);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleProduct(prod.id)}
                        className="w-full p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckSquare size={14} className="text-[var(--primary)]" fill="var(--primary)" color="white" />
                          ) : (
                            <Square size={14} className="text-zinc-400" />
                          )}
                          <span className="font-bold">{prod.name}</span>
                        </div>
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1 text-zinc-400 rounded">
                          {prod.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* STEP 5: Status */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Publish Status</p>
                  <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Toggle catalog visibility</p>
                </div>
                
                <div className="flex bg-white dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {["active", "inactive"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded transition-all ${
                        status === st
                          ? st === "active"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-zinc-500 text-white shadow-sm"
                          : "text-zinc-500"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Visible in Customer App</p>
                  <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Allow checkout additions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visibleInApp}
                    onChange={(e) => setVisibleInApp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]" />
                </label>
              </div>

              {/* Review summary info */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-lg text-xs leading-relaxed border border-zinc-150 dark:border-zinc-850">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Ready to register: {name || "Untitled Addon"}</span>
                </div>
                <p className="text-[10px] text-zinc-650 dark:text-zinc-400">
                  Classified as <strong className="text-zinc-800 dark:text-white capitalize">{type} ({isVegan ? "Vegan" : "Veg"})</strong>, priced at <strong>₹{price}</strong> per unit with display order priority <strong>#{displayOrder}</strong>. Assigned to {selectedProducts.length} product(s).
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={12} />
                Back
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
              >
                Next
                <ArrowRight size={12} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-3 py-1.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-bold text-xs rounded-lg transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-4 py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  Save Add-on
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
