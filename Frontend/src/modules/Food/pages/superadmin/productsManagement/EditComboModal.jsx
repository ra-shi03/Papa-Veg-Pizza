import React, { useState, useEffect } from "react";
import { X, CloudUpload, ArrowRight, ArrowLeft, Trash2, CheckCircle2, Search, Sparkles, Check, CheckSquare, Square, AlertTriangle } from "lucide-react";

export default function EditComboModal({
  isOpen,
  onClose,
  combo,
  comboItems = [],
  products = [],
  franchises = [],
  stores = [],
  onSave
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [showExitWarning, setShowExitWarning] = useState(false);

  // STEP 1 Fields (Basic Info)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [comboType, setComboType] = useState("fixed");
  const [image, setImage] = useState("");

  // STEP 2 Fields (Product Selection)
  const [selectedItems, setSelectedItems] = useState([]); // Array of { _id, productId, quantity }
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategory, setProdCategory] = useState("");

  // STEP 3 Fields (Pricing & Discounts)
  const [pricingMethod, setPricingMethod] = useState("fixed"); // fixed, percentage, flat
  const [comboPrice, setComboPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // STEP 4 Fields (Validity & Scheduling)
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [weeklyRestrictions, setWeeklyRestrictions] = useState([]); // ['Mon', 'Tue', ...]
  const [timeWindowStart, setTimeWindowStart] = useState("");
  const [timeWindowEnd, setTimeWindowEnd] = useState("");

  // STEP 5 Fields (Store Applicability)
  const [applicabilityType, setApplicabilityType] = useState("all"); // all, franchises, stores
  const [selectedFranchises, setSelectedFranchises] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [franchiseSearch, setFranchiseSearch] = useState("");

  // STEP 6 Fields (Status)
  const [status, setStatus] = useState("active");

  // Initial State Tracking
  const [initialData, setInitialData] = useState({});

  useEffect(() => {
    if (isOpen && combo) {
      setCurrentStep(1);

      // Map comboItems properly
      const prefilledItems = comboItems.map(item => ({
        _id: item._id,
        productId: item.productId,
        quantity: item.quantity
      }));

      // Bind states
      setName(combo.name || "");
      setDescription(combo.description || "");
      setComboType(combo.comboType || "fixed");
      setImage(combo.image || "");
      setSelectedItems(prefilledItems);
      
      const method = combo.discountType || "fixed";
      setPricingMethod(method);
      if (method === "percentage") {
        setDiscountPercent(combo.discountValue || 0);
      } else {
        setDiscountAmount(combo.discountValue || 0);
      }
      setComboPrice(combo.price || 0);

      // Date helper
      const formatDT = (isoStr) => {
        if (!isoStr) return "";
        const d = new Date(isoStr);
        // Returns YYYY-MM-DDTHH:MM
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setValidFrom(formatDT(combo.validFrom));
      setValidTo(formatDT(combo.validTo));
      setWeeklyRestrictions(combo.weeklyRestrictions || []);
      setTimeWindowStart(combo.timeWindowStart || "");
      setTimeWindowEnd(combo.timeWindowEnd || "");
      setApplicabilityType(combo.applicabilityType || "all");
      setSelectedFranchises(combo.applicableFranchises || []);
      setSelectedStores(combo.applicableStores || []);
      setStatus(combo.status || "active");

      // Save initial state fields
      setInitialData({
        name: combo.name || "",
        description: combo.description || "",
        comboType: combo.comboType || "fixed",
        image: combo.image || "",
        selectedItems: JSON.stringify(prefilledItems),
        pricingMethod: method,
        price: combo.price || 0,
        discountValue: combo.discountValue || 0,
        validFrom: combo.validFrom || "",
        validTo: combo.validTo || "",
        applicabilityType: combo.applicabilityType || "all",
        applicableFranchises: JSON.stringify(combo.applicableFranchises || []),
        applicableStores: JSON.stringify(combo.applicableStores || []),
        status: combo.status || "active"
      });

      setErrors({});
      setShowExitWarning(false);
      setProdSearch("");
      setProdCategory("");
      setStoreSearch("");
      setFranchiseSearch("");
    }
  }, [isOpen, combo, comboItems]);

  // Check if form has unsaved modifications
  const hasChanges = () => {
    if (!combo) return false;
    const currentSerializedItems = JSON.stringify(selectedItems.map(i => ({ productId: i.productId, quantity: i.quantity })));
    const initialSerializedItems = JSON.stringify(JSON.parse(initialData.selectedItems || "[]").map(i => ({ productId: i.productId, quantity: i.quantity })));

    const currentFranchises = JSON.stringify(selectedFranchises);
    const initialFranchises = initialData.applicableFranchises || "[]";

    const currentStores = JSON.stringify(selectedStores);
    const initialStores = initialData.applicableStores || "[]";

    return (
      name !== initialData.name ||
      description !== initialData.description ||
      comboType !== initialData.comboType ||
      image !== initialData.image ||
      currentSerializedItems !== initialSerializedItems ||
      pricingMethod !== initialData.pricingMethod ||
      comboPrice !== initialData.price ||
      (pricingMethod === "percentage" ? discountPercent : discountAmount) !== initialData.discountValue ||
      (validFrom ? new Date(validFrom).toISOString() : "") !== (initialData.validFrom ? new Date(initialData.validFrom).toISOString() : "") ||
      (validTo ? new Date(validTo).toISOString() : "") !== (initialData.validTo ? new Date(initialData.validTo).toISOString() : "") ||
      applicabilityType !== initialData.applicabilityType ||
      currentFranchises !== initialFranchises ||
      currentStores !== initialStores ||
      status !== initialData.status
    );
  };

  // Compute original sum of selected products
  const getOriginalTotal = () => {
    return selectedItems.reduce((acc, curr) => {
      const prod = products.find(p => p.id === curr.productId);
      const price = prod ? prod.price : 0;
      return acc + (price * curr.quantity);
    }, 0);
  };

  const originalTotal = getOriginalTotal();

  // Handle dynamic pricing calculation
  useEffect(() => {
    if (pricingMethod === "fixed") {
      const savings = originalTotal > comboPrice ? originalTotal - comboPrice : 0;
      const pct = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
      setDiscountAmount(savings);
      setDiscountPercent(pct);
    } else if (pricingMethod === "percentage") {
      const amt = Math.round(originalTotal * (discountPercent / 100));
      const finalPrice = originalTotal - amt;
      setDiscountAmount(amt);
      setComboPrice(finalPrice);
    } else if (pricingMethod === "flat") {
      const pct = originalTotal > 0 ? Math.round((discountAmount / originalTotal) * 100) : 0;
      const finalPrice = originalTotal - discountAmount;
      setDiscountPercent(pct);
      setComboPrice(finalPrice);
    }
  }, [pricingMethod, comboPrice, discountPercent, discountAmount, originalTotal]);

  if (!isOpen) return null;

  // Toggle products list helper
  const addProductToCombo = (prodId) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.productId === prodId);
      if (exists) {
        return prev;
      }
      return [...prev, { productId: prodId, quantity: 1 }];
    });
  };

  const updateItemQty = (prodId, val) => {
    setSelectedItems(prev =>
      prev.map(item => item.productId === prodId ? { ...item, quantity: Math.max(parseInt(val) || 1, 1) } : item)
    );
  };

  const removeItemFromCombo = (prodId) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== prodId));
  };

  const moveItem = (index, direction) => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= selectedItems.length) return;
    
    setSelectedItems(prev => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return list;
    });
  };

  // Applicability Helpers
  const toggleFranchise = (franchiseName) => {
    setSelectedFranchises(prev =>
      prev.includes(franchiseName) ? prev.filter(f => f !== franchiseName) : [...prev, franchiseName]
    );
  };

  const toggleStore = (storeName) => {
    setSelectedStores(prev =>
      prev.includes(storeName) ? prev.filter(s => s !== storeName) : [...prev, storeName]
    );
  };

  const toggleWeeklyRestriction = (day) => {
    setWeeklyRestrictions(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Image drop simulator
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  // Step validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!name.trim()) newErrors.name = "Combo Name is required.";
      if (!comboType) newErrors.comboType = "Combo Type is required.";
    }
    if (step === 2) {
      if (selectedItems.length === 0) {
        newErrors.products = "At least one product must be included in the combo offer.";
      }
    }
    if (step === 3) {
      if (comboPrice < 0) newErrors.comboPrice = "Selling price cannot be negative.";
      if (comboPrice > originalTotal) {
        newErrors.comboPrice = "Final selling price should not exceed the normal sum of items.";
      }
      if (discountPercent < 0 || discountPercent > 100) {
        newErrors.discountPercent = "Discount percentage must be between 0% and 100%.";
      }
      if (discountAmount < 0) newErrors.discountAmount = "Discount amount cannot be negative.";
    }
    if (step === 4) {
      if (validFrom && validTo) {
        const start = new Date(validFrom);
        const end = new Date(validTo);
        if (end <= start) {
          newErrors.validTo = "End validity date/time must be strictly later than start validity.";
        }
      }
    }
    if (step === 5) {
      if (applicabilityType === "franchises" && selectedFranchises.length === 0) {
        newErrors.franchises = "Please assign at least one franchise.";
      }
      if (applicabilityType === "stores" && selectedStores.length === 0) {
        newErrors.stores = "Please assign at least one store outlet.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCloseRequest = () => {
    if (hasChanges()) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmSave = () => {
    // Validate everything
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
      alert("Please resolve the validation errors first.");
      return;
    }

    const comboPayload = {
      name,
      description,
      image,
      comboType,
      price: parseFloat(comboPrice) || 0,
      discountType: pricingMethod,
      discountValue: pricingMethod === "percentage" ? parseFloat(discountPercent) : parseFloat(discountAmount),
      validFrom: validFrom ? new Date(validFrom).toISOString() : "",
      validTo: validTo ? new Date(validTo).toISOString() : "",
      applicabilityType,
      applicableFranchises: applicabilityType === "franchises" ? selectedFranchises : [],
      applicableStores: applicabilityType === "stores" ? selectedStores : [],
      status
    };

    onSave(comboPayload, selectedItems);
  };

  const categories = ["Pizza", "Garlic Bread", "Desserts", "Beverages"];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.id.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCat = prodCategory ? p.category === prodCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]" onClick={handleCloseRequest} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-zinc-950 shadow-2xl z-[80] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right-5 text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-black dark:text-white">Modify Combo Profile</h3>
              {hasChanges() && (
                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Edited</span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wider">
              Step {currentStep} of 6 — {
                currentStep === 1 ? "Basic Information" :
                currentStep === 2 ? "Product Selection" :
                currentStep === 3 ? "Pricing Rules" :
                currentStep === 4 ? "Validity Timelines" :
                currentStep === 5 ? "Availability Mapping" :
                "Update Confirmation"
              }
            </p>
          </div>
          <button onClick={handleCloseRequest} className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Indicator Progress Bar */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-850 w-full relative">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Combo Offer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Supreme Meal Deal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`px-3 py-2 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${errors.name ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                />
                {errors.name && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the menu bundle for customers."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Combo Type *</label>
                  <select
                    value={comboType}
                    onChange={(e) => setComboType(e.target.value)}
                    className="px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="fixed">Fixed Bundle</option>
                    <option value="bogo">Buy One Get One (BOGO)</option>
                    <option value="meal">Meal Deal</option>
                    <option value="seasonal">Seasonal Offer</option>
                    <option value="custom">Custom Bundle</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Banner Selection</label>
                  <select
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=300&q=80">Solo Pizza Banner</option>
                    <option value="https://images.unsplash.com/photo-1590947132387-155cc02f3212?fm=webp&fit=crop&w=300&q=80">Family feast Banner</option>
                    <option value="https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=300&q=80">Paneer Delights Banner</option>
                    <option value="https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?fm=webp&fit=crop&w=300&q=80">Student Combo Banner</option>
                  </select>
                </div>
              </div>

              {/* Upload Drop mock area */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Image Attachment (WebP Preview)</label>
                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  <CloudUpload className="text-zinc-400 shrink-0" size={24} />
                  <p className="text-[11px] text-zinc-500 font-semibold">Drag & drop WebP banner image here, or select click.</p>
                  <input type="file" onChange={handleImageUpload} accept="image/webp" className="hidden" id="edit-banner-uploader" />
                  <label htmlFor="edit-banner-uploader" className="px-3 py-1 bg-zinc-150 dark:bg-zinc-800 text-[10px] rounded font-bold cursor-pointer border border-zinc-250 dark:border-zinc-750">Choose File</label>
                  {image && (
                    <div className="w-20 h-12 rounded overflow-hidden border mt-2">
                      <img src={image} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Product Selection */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              {/* Product selector filters */}
              <div className="grid grid-cols-2 gap-2 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 text-zinc-400" size={12} />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                  />
                </div>

                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Selection Catalog */}
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl max-h-[160px] overflow-y-auto p-1 divide-y divide-zinc-100 dark:divide-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/35 scrollbar-thin">
                {filteredProducts.map(p => {
                  const alreadySelected = selectedItems.some(item => item.productId === p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <img src={p.image} className="w-6 h-6 rounded object-cover shrink-0" />
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{p.name}</span>
                          <span className="text-[9px] text-zinc-400 font-mono">₹{p.price} | {p.id}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addProductToCombo(p.id)}
                        disabled={alreadySelected}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${alreadySelected ? 'bg-zinc-150 dark:bg-zinc-800 text-zinc-400' : 'bg-[var(--primary)] text-white hover:scale-105 active:scale-95 cursor-pointer'}`}
                      >
                        {alreadySelected ? "Included" : "Add Item"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Selected items list */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Included Products *</h4>
                
                {selectedItems.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-6 text-center border border-dashed rounded-xl">No items selected yet.</p>
                ) : (
                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden text-[11px] bg-white dark:bg-zinc-900/10">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-400 border-b border-zinc-150 dark:border-zinc-800">
                        <tr>
                          <th className="px-3 py-1.5">Item</th>
                          <th className="px-2 py-1.5 text-center w-24">Qty</th>
                          <th className="px-2 py-1.5 text-center w-16">Reorder</th>
                          <th className="px-3 py-1.5 text-right w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                        {selectedItems.map((item, idx) => {
                          const p = products.find(prod => prod.id === item.productId);
                          return (
                            <tr key={item.productId}>
                              <td className="px-3 py-1.5">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-[150px]">{p ? p.name : item.productId}</span>
                                <span className="text-[9px] text-zinc-400 font-mono">₹{p ? p.price : 0} each</span>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => updateItemQty(item.productId, e.target.value)}
                                  className="w-12 px-1 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded text-center bg-zinc-50 dark:bg-zinc-950 font-bold font-mono text-xs"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button type="button" onClick={() => moveItem(idx, "up")} disabled={idx === 0} className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer">▲</button>
                                  <button type="button" onClick={() => moveItem(idx, "down")} disabled={idx === selectedItems.length - 1} className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer">▼</button>
                                </div>
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItemFromCombo(item.productId)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {errors.products && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.products}</p>}
              </div>

            </div>
          )}

          {/* STEP 3: Pricing Rules */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3.5 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-inner text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block mb-0.5">Normal Price sum</span>
                  <p className="text-sm font-black font-mono text-zinc-700 dark:text-zinc-300">₹{originalTotal.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase block mb-0.5">Discount Savings</span>
                  <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">₹{discountAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pricing Formula *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["fixed", "percentage", "flat"].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPricingMethod(method)}
                      className={`py-2 border text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize ${pricingMethod === method ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"}`}
                    >
                      {method === "fixed" ? "Fixed Price" : method === "percentage" ? "Percent Off" : "Flat Discount"}
                    </button>
                  ))}
                </div>
              </div>

              {pricingMethod === "fixed" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Selling Combo Price * (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={comboPrice}
                    onChange={(e) => setComboPrice(Math.max(parseFloat(e.target.value) || 0, 0))}
                    className={`px-3 py-2 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${errors.comboPrice ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  />
                  {errors.comboPrice && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.comboPrice}</p>}
                </div>
              )}

              {pricingMethod === "percentage" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Discount Percentage * (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100))}
                    className={`px-3 py-2 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${errors.discountPercent ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Calculated Final Selling price: <span className="font-bold text-zinc-900 dark:text-zinc-200">₹{comboPrice}</span></p>
                  {errors.discountPercent && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.discountPercent}</p>}
                </div>
              )}

              {pricingMethod === "flat" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Flat Discount Value * (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(parseFloat(e.target.value) || 0, 0))}
                    className={`px-3 py-2 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${errors.discountAmount ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Calculated Final Selling price: <span className="font-bold text-zinc-900 dark:text-zinc-200">₹{comboPrice}</span></p>
                  {errors.discountAmount && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.discountAmount}</p>}
                </div>
              )}

            </div>
          )}

          {/* STEP 4: Validity & Scheduling */}
          {currentStep === 4 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Valid From (Date & Time)</label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 dark:text-zinc-300 focus:outline-none focus:ring-1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Valid To (Date & Time)</label>
                  <input
                    type="datetime-local"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className={`px-2.5 py-1.5 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 dark:text-zinc-300 focus:outline-none focus:ring-1 ${errors.validTo ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  />
                  {errors.validTo && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.validTo}</p>}
                </div>
              </div>

              {/* Day constraints */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Weekday Restrictions (Optional)</label>
                <div className="flex flex-wrap gap-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const active = weeklyRestrictions.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeeklyRestriction(day)}
                        className={`px-3 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${active ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white dark:bg-zinc-900 text-zinc-650 border-zinc-200 dark:border-zinc-800'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Daily Window Start</label>
                  <input
                    type="time"
                    value={timeWindowStart}
                    onChange={(e) => setTimeWindowStart(e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Daily Window End</label>
                  <input
                    type="time"
                    value={timeWindowEnd}
                    onChange={(e) => setTimeWindowEnd(e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-355 focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* STEP 5: Store applicability */}
          {currentStep === 5 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scope Applicability *</label>
                <div className="flex flex-col sm:flex-row gap-4 p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-55/30 dark:bg-zinc-900/20 text-xs font-semibold">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="edit-applicability"
                      checked={applicabilityType === "all"}
                      onChange={() => setApplicabilityType("all")}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    Available at All Stores
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="edit-applicability"
                      checked={applicabilityType === "franchises"}
                      onChange={() => setApplicabilityType("franchises")}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    Select Franchises
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="edit-applicability"
                      checked={applicabilityType === "stores"}
                      onChange={() => setApplicabilityType("stores")}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    Select Outlets
                  </label>
                </div>
              </div>

              {/* Franchise selector */}
              {applicabilityType === "franchises" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-zinc-400" size={12} />
                    <input
                      type="text"
                      placeholder="Search franchises..."
                      value={franchiseSearch}
                      onChange={(e) => setFranchiseSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl max-h-[160px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                    {franchises.filter(f => f.toLowerCase().includes(franchiseSearch.toLowerCase())).map(item => {
                      const active = selectedFranchises.includes(item);
                      return (
                        <div
                          key={item}
                          onClick={() => toggleFranchise(item)}
                          className="flex items-center justify-between p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <span>{item}</span>
                          {active ? (
                            <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
                          ) : (
                            <Square size={14} className="text-zinc-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {errors.franchises && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.franchises}</p>}
                </div>
              )}

              {/* Store selector */}
              {applicabilityType === "stores" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-zinc-400" size={12} />
                    <input
                      type="text"
                      placeholder="Search outlets..."
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl max-h-[160px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                    {stores.filter(s => s.toLowerCase().includes(storeSearch.toLowerCase())).map(item => {
                      const active = selectedStores.includes(item);
                      return (
                        <div
                          key={item}
                          onClick={() => toggleStore(item)}
                          className="flex items-center justify-between p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <span>{item}</span>
                          {active ? (
                            <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
                          ) : (
                            <Square size={14} className="text-zinc-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {errors.stores && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.stores}</p>}
                </div>
              )}

            </div>
          )}

          {/* STEP 6: Status */}
          {currentStep === 6 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Publication Status *</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-zinc-700">
                  {[
                    { id: "active", title: "Active immediately", desc: "Visible and valid for purchase by customers." },
                    { id: "draft", title: "Keep as Draft", desc: "Saves combo internally without displaying in-app." },
                    { id: "scheduled", title: "Schedule", desc: "Registers deal to active automatically on valid dates." },
                    { id: "archived", title: "Archived", desc: "Hides combo and prevents future purchases." }
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => setStatus(item.id)}
                      className={`p-3 border rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer flex flex-col gap-1 ${status === item.id ? "border-[var(--primary)] bg-[var(--primary)]/5 text-zinc-900 dark:text-zinc-100" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {status === item.id ? (
                          <div className="w-3.5 h-3.5 rounded-full border-4 border-[var(--primary)]" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-zinc-350" />
                        )}
                        <span className="font-bold">{item.title}</span>
                      </div>
                      <p className="text-[10px] text-zinc-450 mt-1 font-semibold leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready Confirmation */}
              <div className="p-4 border border-emerald-200 dark:border-emerald-950/20 bg-emerald-500/5 rounded-xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed font-semibold">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Combo validation successful</h4>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 mt-0.5 leading-snug font-semibold">All mandatory attributes, items list, store coverage permissions, and discount margins have been verified and comply with brand rules.</p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCloseRequest}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Next Step
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Unsaved Changes Confirmation Dialog Overlay */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-sm w-full p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 border border-amber-100 dark:border-amber-900/35 flex items-center justify-center mx-auto shrink-0">
              <AlertTriangle size={24} className="stroke-[2.5]" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100">Unsaved Changes</h4>
              <p className="text-[11px] text-zinc-450 dark:text-zinc-400 font-semibold leading-normal">
                You have modified this combo profile. Closing now will discard all unsaved edits. Are you sure you want to discard changes?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowExitWarning(false)}
                className="py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowExitWarning(false);
                  onClose();
                }}
                className="py-1.5 bg-red-650 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
              >
                Discard Edits
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
