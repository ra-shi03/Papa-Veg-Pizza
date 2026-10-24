import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, CloudUpload, ArrowRight, ArrowLeft, Trash2, CheckCircle2, Search, CheckSquare, Square, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadAPI } from "@/services/api";

const STEP_TITLES = {
  create: ["Basic Information", "Meal Items & Choices", "Pricing & Margin calculations", "Validity Period", "Availability Scope", "Publish Profile"],
  edit: ["Basic Information", "Meal Items & Choices", "Pricing Rules", "Validity Timelines", "Availability Mapping", "Update Confirmation"]
};

// Dropdown with a search box inside it. `allLabel` adds a "clear" row; without it the list is pick-only.
function SearchableSelect({ value, onChange, options, placeholder, searchPlaceholder = "Search...", allLabel, className = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const reposition = () => setRect(triggerRef.current?.getBoundingClientRect() || null);
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setRect(triggerRef.current?.getBoundingClientRect() || null);
      setQuery("");
    }
    setOpen(o => !o);
  };

  const select = (v) => {
    onChange(v);
    setOpen(false);
  };

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  // Open upwards when there is not enough room below the trigger
  const openUp = rect && window.innerHeight - rect.bottom < 280 && rect.top > 280;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-left cursor-pointer focus:outline-none ${className}`}
      >
        <span className={`truncate ${selected ? "" : "text-zinc-500"}`}>{selected ? selected.label : placeholder}</span>
        <span className="text-zinc-400 shrink-0">▾</span>
      </button>

      {open && rect && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            left: rect.left,
            width: Math.max(rect.width, 220),
            ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
            zIndex: 120
          }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="relative p-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <Search className="absolute left-3.5 top-3.5 text-zinc-400" size={12} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-7 pr-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-thin">
            {allLabel && !query && (
              <button type="button" onClick={() => select("")} className={`w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${!value ? "font-bold text-[var(--primary)]" : ""}`}>
                {allLabel}
              </button>
            )}
            {filtered.length === 0 && <p className="px-3 py-3 text-[11px] text-zinc-400 italic text-center">No matches</p>}
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => select(o.value)}
                className={`w-full flex items-center justify-between gap-2 text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${o.value === value ? "font-bold text-[var(--primary)]" : ""}`}
              >
                <span className="truncate">{o.label}</span>
                {o.hint && <span className="text-[9px] text-zinc-400 shrink-0">{o.hint}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

let itemKeySeed = 0;
const nextKey = () => `ci_${Date.now()}_${itemKeySeed++}`;

const formatDT = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toFormItems = (items = []) =>
  items.map(it => ({
    key: it._id || nextKey(),
    productId: it.productId || null,
    addonId: it.addonId || null,
    name: it.name || "",
    size: it.size || "",
    quantity: Number(it.quantity) || 1,
    unitPrice: Number(it.unitPrice) || 0,
    choices: (it.choices || []).map(ch => ({ key: ch._id || nextKey(), productId: ch.productId || null, addonId: ch.addonId || null, name: ch.name || "", size: ch.size || "" }))
  }));

const buildInitialState = (combo) => ({
  name: combo?.name || "",
  description: combo?.description || "",
  comboType: combo?.comboType || "meal",
  categoryId: combo?.categoryId || "",
  badge: combo?.badge || "",
  sortOrder: Number(combo?.sortOrder) || 0,
  image: combo?.image || "",
  items: toFormItems(combo?.items),
  pricingMethod: combo?.discountType || "fixed",
  comboPrice: Number(combo?.price) || 0,
  discountPercent: combo?.discountType === "percentage" ? Number(combo?.discountValue) || 0 : 0,
  discountAmount: combo?.discountType === "flat" ? Number(combo?.discountValue) || 0 : 0,
  validFrom: formatDT(combo?.validFrom),
  validTo: formatDT(combo?.validTo),
  weeklyRestrictions: combo?.weeklyRestrictions || [],
  timeWindowStart: combo?.timeWindowStart || "",
  timeWindowEnd: combo?.timeWindowEnd || "",
  applicabilityType: combo?.applicabilityType || "all",
  selectedFranchises: (combo?.applicableFranchises || []).map(String),
  selectedStores: (combo?.applicableStores || []).map(String),
  status: combo?.status || "active"
});

// Only the price field the admin actually types counts towards "unsaved changes"; the other two are derived
const serializeForDirtyCheck = (f) => JSON.stringify({
  ...f,
  comboPrice: f.pricingMethod === "fixed" ? f.comboPrice : null,
  discountPercent: f.pricingMethod === "percentage" ? f.discountPercent : null,
  discountAmount: f.pricingMethod === "flat" ? f.discountAmount : null
});

export default function ComboFormModal({
  mode = "create",
  isOpen,
  onClose,
  combo = null,
  products = [],
  addons = [],
  categories = [],
  franchises = [],
  stores = [],
  onSave
}) {
  const isEdit = mode === "edit";
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => buildInitialState(combo));
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Product picker & custom item drafts
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [pickerSource, setPickerSource] = useState("menu");
  const [customItem, setCustomItem] = useState({ name: "", price: "" });
  const [optionDrafts, setOptionDrafts] = useState({});
  const [storeSearch, setStoreSearch] = useState("");
  const [franchiseSearch, setFranchiseSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      const initial = buildInitialState(isEdit ? combo : null);
      setForm(initial);
      setInitialSnapshot(serializeForDirtyCheck(initial));
      setCurrentStep(1);
      setErrors({});
      setShowExitWarning(false);
      setProdSearch("");
      setProdCategory("");
      setCustomItem({ name: "", price: "" });
      setOptionDrafts({});
      setStoreSearch("");
      setFranchiseSearch("");
    }
  }, [isOpen, combo, isEdit]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const originalTotal = useMemo(
    () => form.items.reduce((acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1), 0),
    [form.items]
  );

  // Keep price, percent and flat discount in sync with the chosen pricing formula
  useEffect(() => {
    setForm(prev => {
      if (prev.pricingMethod === "fixed") {
        const savings = originalTotal > prev.comboPrice ? originalTotal - prev.comboPrice : 0;
        const pct = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
        if (savings === prev.discountAmount && pct === prev.discountPercent) return prev;
        return { ...prev, discountAmount: savings, discountPercent: pct };
      }
      if (prev.pricingMethod === "percentage") {
        const amt = Math.round(originalTotal * (prev.discountPercent / 100));
        const finalPrice = originalTotal - amt;
        if (amt === prev.discountAmount && finalPrice === prev.comboPrice) return prev;
        return { ...prev, discountAmount: amt, comboPrice: finalPrice };
      }
      const pct = originalTotal > 0 ? Math.round((prev.discountAmount / originalTotal) * 100) : 0;
      const finalPrice = Math.max(originalTotal - prev.discountAmount, 0);
      if (pct === prev.discountPercent && finalPrice === prev.comboPrice) return prev;
      return { ...prev, discountPercent: pct, comboPrice: finalPrice };
    });
  }, [form.pricingMethod, form.comboPrice, form.discountPercent, form.discountAmount, originalTotal]);

  if (!isOpen) return null;

  const hasChanges = () => isEdit && initialSnapshot && serializeForDirtyCheck(form) !== initialSnapshot;
  const productById = (id) => products.find(p => p.id === id);
  const catalogEntryFor = (item) => (item.addonId ? addons.find(a => a.id === item.addonId) : productById(item.productId));

  // ----- Items helpers -----
  const updateItem = (key, patch) =>
    set("items", form.items.map(it => (it.key === key ? { ...it, ...patch } : it)));

  const addProductToCombo = (prod) => {
    const firstSize = prod.sizes?.[0];
    set("items", [
      ...form.items,
      {
        key: nextKey(),
        productId: pickerSource === "menu" ? prod.id : null,
        addonId: pickerSource === "addon" ? prod.id : null,
        name: prod.name,
        size: firstSize?.size || "",
        quantity: 1,
        unitPrice: Number(firstSize?.price ?? prod.price) || 0,
        choices: []
      }
    ]);
  };

  const addCustomItem = () => {
    if (!customItem.name.trim()) return;
    set("items", [
      ...form.items,
      { key: nextKey(), productId: null, addonId: null, name: customItem.name.trim(), size: "", quantity: 1, unitPrice: Math.max(parseFloat(customItem.price) || 0, 0), choices: [] }
    ]);
    setCustomItem({ name: "", price: "" });
  };

  const removeItem = (key) => set("items", form.items.filter(it => it.key !== key));

  const moveItem = (index, direction) => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= form.items.length) return;
    const list = [...form.items];
    [list[index], list[nextIndex]] = [list[nextIndex], list[index]];
    set("items", list);
  };

  const changeItemSize = (item, sizeName) => {
    const prod = catalogEntryFor(item);
    const sizeObj = prod?.sizes?.find(s => s.size === sizeName);
    updateItem(item.key, { size: sizeName, unitPrice: sizeObj ? Number(sizeObj.price) || 0 : item.unitPrice });
  };

  const hasChoice = (item, name) => item.choices.some(ch => ch.name.toLowerCase() === name.toLowerCase());

  // Free-text option: not tied to any product, so it can be anything (e.g. Lahori Jeera)
  const addChoice = (item) => {
    const draft = (optionDrafts[item.key] || "").trim();
    if (!draft) return;
    if (hasChoice(item, draft)) {
      toast.error(`"${draft}" is already an option`);
      return;
    }
    updateItem(item.key, { choices: [...item.choices, { key: nextKey(), productId: null, addonId: null, name: draft, size: "" }] });
    setOptionDrafts(prev => ({ ...prev, [item.key]: "" }));
  };

  // Option linked to an existing menu product or add-on / topping
  const addMenuChoice = (item, entry) => {
    if (hasChoice(item, entry.name)) {
      toast.error(`"${entry.name}" is already an option`);
      return;
    }
    const isAddon = entry.kind === "addon";
    updateItem(item.key, { choices: [...item.choices, { key: nextKey(), productId: isAddon ? null : entry.id, addonId: isAddon ? entry.id : null, name: entry.name, size: entry.sizes?.[0]?.size || "" }] });
  };

  const removeChoice = (item, choiceKey) =>
    updateItem(item.key, { choices: item.choices.filter(ch => ch.key !== choiceKey) });

  // ----- Scope helpers -----
  const toggleIn = (field, id) =>
    set(field, form[field].includes(id) ? form[field].filter(x => x !== id) : [...form[field], id]);

  const toggleWeeklyRestriction = (day) => toggleIn("weeklyRestrictions", day);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only images are allowed");
      return;
    }
    setIsUploading(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        set("image", url);
        toast.success("Image uploaded!");
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ----- Validation -----
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!form.name.trim()) newErrors.name = "Combo Name is required.";
      if (!form.comboType) newErrors.comboType = "Combo Type is required.";
    }
    if (step === 2) {
      if (form.items.length === 0) {
        newErrors.products = "At least one item must be included in the combo offer.";
      } else if (form.items.some(it => !it.name.trim())) {
        newErrors.products = "Every item needs a name.";
      }
    }
    if (step === 3) {
      if (form.comboPrice <= 0) newErrors.comboPrice = "Selling price must be greater than zero.";
      if (originalTotal > 0 && form.comboPrice > originalTotal) {
        newErrors.comboPrice = "Final selling price should not exceed the normal sum of items.";
      }
      if (form.discountPercent < 0 || form.discountPercent > 100) {
        newErrors.discountPercent = "Discount percentage must be between 0% and 100%.";
      }
      if (form.discountAmount < 0) newErrors.discountAmount = "Discount amount cannot be negative.";
    }
    if (step === 4) {
      if (form.validFrom && form.validTo && new Date(form.validTo) <= new Date(form.validFrom)) {
        newErrors.validTo = "End validity date/time must be strictly later than start validity.";
      }
      if (Boolean(form.timeWindowStart) !== Boolean(form.timeWindowEnd)) {
        newErrors.timeWindow = "Set both the daily window start and end, or leave both empty.";
      }
    }
    if (step === 5) {
      if (form.applicabilityType === "franchises" && form.selectedFranchises.length === 0) {
        newErrors.franchises = "Please assign at least one franchise.";
      }
      if (form.applicabilityType === "stores" && form.selectedStores.length === 0) {
        newErrors.stores = "Please assign at least one store outlet.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleCloseRequest = () => {
    if (hasChanges()) setShowExitWarning(true);
    else onClose();
  };

  const handleSaveCombo = async (isDraft = false) => {
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        toast.error("Please fix form errors before submitting.");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image,
      badge: form.badge.trim(),
      comboType: form.comboType,
      categoryId: form.categoryId || null,
      sortOrder: Number(form.sortOrder) || 0,
      items: form.items.map(it => ({
        productId: it.productId || null,
        addonId: it.addonId || null,
        name: it.name.trim(),
        size: it.size,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        choices: it.choices.map(ch => ({ productId: ch.productId || null, addonId: ch.addonId || null, name: ch.name, size: ch.size }))
      })),
      price: parseFloat(form.comboPrice) || 0,
      originalPrice: originalTotal,
      discountType: form.pricingMethod,
      discountValue: form.pricingMethod === "percentage" ? parseFloat(form.discountPercent) || 0 : parseFloat(form.discountAmount) || 0,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      weeklyRestrictions: form.weeklyRestrictions,
      timeWindowStart: form.timeWindowStart,
      timeWindowEnd: form.timeWindowEnd,
      applicabilityType: form.applicabilityType,
      applicableFranchises: form.applicabilityType === "franchises" ? form.selectedFranchises : [],
      applicableStores: form.applicabilityType === "stores" ? form.selectedStores : [],
      status: isDraft ? "draft" : form.status
    };

    setIsSaving(true);
    try {
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const pickerList = pickerSource === "menu" ? products : addons;
  const pickerCategoryOptions = pickerSource === "menu"
    ? categories.map(c => ({ value: c.id, label: c.label }))
    : [...new Set(addons.map(a => a.category).filter(Boolean))].map(t => ({ value: t, label: t }));
  const filteredProducts = pickerList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCat = prodCategory ? (pickerSource === "menu" ? String(p.categoryId) === prodCategory : p.category === prodCategory) : true;
    return matchesSearch && matchesCat;
  });
  // Everything a customer-choice option can link to
  const choiceCatalog = [
    ...products.map(p => ({ ...p, kind: "product" })),
    ...addons.map(a => ({ ...a, kind: "addon", category: `Add-on · ${a.category}` }))
  ];

  const inputCls = "px-3 py-2 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]";
  const labelCls = "text-[10px] font-bold text-zinc-400 uppercase tracking-widest";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] transition-opacity duration-300" onClick={handleCloseRequest} />

      {/* Main Drawer Shell */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-zinc-950 shadow-2xl z-[80] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right-5 text-zinc-900 dark:text-zinc-100 select-none">

        {/* Header */}
        <div className="px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-black dark:text-white">{isEdit ? "Modify Combo Profile" : "Create Promotional Combo Offer"}</h3>
              {hasChanges() && (
                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Edited</span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wider">
              Step {currentStep} of 6 — {STEP_TITLES[isEdit ? "edit" : "create"][currentStep - 1]}
            </p>
          </div>
          <button onClick={handleCloseRequest} className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-850 w-full relative">
          <div className="h-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${(currentStep / 6) * 100}%` }} />
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">

          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Combo Offer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Margherita + Cheese Corn & Paneer"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={`${inputCls} ${errors.name ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
                />
                {errors.name && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Shown on the menu card (e.g. 2 Regular Pizzas + 2 Taco / Quesadilla + 1 Coke)."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={`${inputCls} border-zinc-200 dark:border-zinc-800`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Menu Section</label>
                  <SearchableSelect
                    value={form.categoryId}
                    onChange={(v) => set("categoryId", v)}
                    options={categories.map(c => ({ value: c.id, label: c.label }))}
                    placeholder="Not listed on menu"
                    searchPlaceholder="Search sections..."
                    allLabel="Not listed on menu"
                    className="px-2.5 py-2 rounded-lg"
                  />
                  <p className="text-[9px] text-zinc-400 font-semibold">User app shows the combo under this category (e.g. Meal for 2).</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Combo Type *</label>
                  <select
                    value={form.comboType}
                    onChange={(e) => set("comboType", e.target.value)}
                    className="px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="meal">Meal Deal</option>
                    <option value="fixed">Fixed Bundle</option>
                    <option value="bogo">Buy One Get One (BOGO)</option>
                    <option value="seasonal">Seasonal Offer</option>
                    <option value="custom">Custom Bundle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller, Lunch Treat"
                    value={form.badge}
                    onChange={(e) => set("badge", e.target.value)}
                    className={`${inputCls} border-zinc-200 dark:border-zinc-800`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Display Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
                    className={`${inputCls} border-zinc-200 dark:border-zinc-800 font-mono`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Banner Image</label>
                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  {isUploading ? <Loader2 className="text-zinc-400 shrink-0 animate-spin" size={24} /> : <CloudUpload className="text-zinc-400 shrink-0" size={24} />}
                  <p className="text-[11px] text-zinc-500 font-semibold">Upload the meal photo shown on the user menu card.</p>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" id={`${mode}-combo-banner-uploader`} />
                  <label htmlFor={`${mode}-combo-banner-uploader`} className="px-3 py-1 bg-zinc-150 dark:bg-zinc-800 text-[10px] rounded font-bold cursor-pointer border border-zinc-250 dark:border-zinc-750">Choose File</label>
                  {form.image && (
                    <div className="relative w-24 h-14 rounded overflow-hidden border mt-2">
                      <img src={form.image} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => set("image", "")} className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded cursor-pointer">
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Items & Choices */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-[11px] font-bold">
                {[{ id: "menu", label: `Menu Items (${products.length})` }, { id: "addon", label: `Add-ons & Toppings (${addons.length})` }].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setPickerSource(tab.id); setProdCategory(""); setProdSearch(""); }}
                    className={`py-1.5 rounded-md cursor-pointer transition-colors ${pickerSource === tab.id ? "bg-white dark:bg-zinc-800 text-[var(--primary)] shadow-sm" : "text-zinc-500"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 text-zinc-400" size={12} />
                  <input
                    type="text"
                    placeholder={pickerSource === "menu" ? "Search menu..." : "Search add-ons & toppings..."}
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                  />
                </div>
                <SearchableSelect
                  value={prodCategory}
                  onChange={setProdCategory}
                  options={pickerCategoryOptions}
                  placeholder={pickerSource === "menu" ? "All Categories" : "All Types"}
                  searchPlaceholder={pickerSource === "menu" ? "Search categories..." : "Search types..."}
                  allLabel={pickerSource === "menu" ? "All Categories" : "All Types"}
                  className="px-2.5 py-1.5 rounded-lg"
                />
              </div>

              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl max-h-[160px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850 p-1 bg-zinc-50/50 dark:bg-zinc-900/35 scrollbar-thin">
                {filteredProducts.length === 0 && (
                  <p className="text-[11px] text-zinc-400 italic text-center py-4">Nothing matches your search.</p>
                )}
                {filteredProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.image ? <img src={p.image} className="w-6 h-6 rounded object-cover shrink-0" /> : <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 shrink-0" />}
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">{p.name}</span>
                        <span className="text-[9px] text-zinc-400 font-mono">₹{p.price} | {p.category || "Uncategorized"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addProductToCombo(p)}
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold transition-all bg-[var(--primary)] text-white hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      Add Item
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom (non-menu) item, e.g. Coke, Chatpati Chilli Dip */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className={labelCls}>Custom Item (not in menu)</label>
                  <input
                    type="text"
                    placeholder="e.g. Coke, Chatpati Chilli Dip, 3 Potato Crispies"
                    value={customItem.name}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
                    className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="₹ Price"
                  value={customItem.price}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, price: e.target.value }))}
                  className="w-20 px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="px-2.5 py-1.5 border border-[var(--primary)] text-[var(--primary)] rounded-lg text-[10px] font-bold hover:bg-[var(--primary)]/5 cursor-pointer flex items-center gap-1"
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              {/* Selected items builder */}
              <div className="space-y-1.5">
                <h4 className={labelCls}>Selected Components *</h4>

                {form.items.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-6 text-center border border-dashed rounded-xl">No items selected yet. Add menu products or custom items above.</p>
                ) : (
                  <div className="space-y-2">
                    {form.items.map((item, idx) => {
                      const prod = catalogEntryFor(item);
                      const sizes = prod?.sizes || [];
                      return (
                        <div key={item.key} className="border border-zinc-150 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-900/10 space-y-2 text-[11px]">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.key, { name: e.target.value })}
                              className="flex-1 min-w-0 px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 font-bold text-xs"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <button type="button" onClick={() => moveItem(idx, "up")} disabled={idx === 0} className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer">▲</button>
                              <button type="button" onClick={() => moveItem(idx, "down")} disabled={idx === form.items.length - 1} className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer">▼</button>
                              <button type="button" onClick={() => removeItem(item.key)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase">Size</span>
                              {sizes.length > 0 ? (
                                <select
                                  value={item.size}
                                  onChange={(e) => changeItemSize(item, e.target.value)}
                                  className="px-1.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 text-xs"
                                >
                                  {sizes.map(s => <option key={s.size} value={s.size}>{s.size} (₹{s.price})</option>)}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="—"
                                  value={item.size}
                                  onChange={(e) => updateItem(item.key, { size: e.target.value })}
                                  className="px-1.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 text-xs"
                                />
                              )}
                            </label>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase">Qty</span>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateItem(item.key, { quantity: Math.max(parseInt(e.target.value) || 1, 1) })}
                                className="px-1.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded text-center bg-zinc-50 dark:bg-zinc-950 font-bold font-mono text-xs"
                              />
                            </label>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase">Unit Price (₹)</span>
                              <input
                                type="number"
                                min={0}
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.key, { unitPrice: Math.max(parseFloat(e.target.value) || 0, 0) })}
                                className="px-1.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded text-center bg-zinc-50 dark:bg-zinc-950 font-mono text-xs"
                              />
                            </label>
                          </div>

                          {/* Customer choice options */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">
                              Customer Choices {item.choices.length > 0 ? "(customer picks 1)" : "(optional)"}
                            </span>
                            {item.choices.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.choices.map(ch => (
                                  <span key={ch.key} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded font-bold text-[10px]">
                                    {ch.name}
                                    <button type="button" onClick={() => removeChoice(item, ch.key)} className="text-zinc-400 hover:text-red-500 cursor-pointer">
                                      <X size={10} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              <SearchableSelect
                                value=""
                                onChange={(id) => {
                                  const picked = choiceCatalog.find(p => p.id === id);
                                  if (picked) addMenuChoice(item, picked);
                                }}
                                options={choiceCatalog.map(p => ({ value: p.id, label: p.name, hint: p.category }))}
                                placeholder="Pick from menu / add-ons…"
                                searchPlaceholder="Search menu items & add-ons..."
                                className="px-2 py-1 rounded text-[11px]"
                              />
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Or type a custom option (e.g. Lahori Jeera)"
                                  value={optionDrafts[item.key] || ""}
                                  onChange={(e) => setOptionDrafts(prev => ({ ...prev, [item.key]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChoice(item); } }}
                                  className="flex-1 min-w-0 px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 text-[11px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => addChoice(item)}
                                  disabled={!(optionDrafts[item.key] || "").trim()}
                                  className="px-2 py-1 border border-[var(--primary)] text-[var(--primary)] rounded text-[10px] font-bold hover:bg-[var(--primary)]/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                  + Add
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.products && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.products}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Discounts */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3.5 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-inner text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block mb-0.5">Sum of Items (MRP shown struck-through)</span>
                  <p className="text-sm font-black font-mono text-zinc-700 dark:text-zinc-300">₹{originalTotal.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase block mb-0.5">Customer Savings</span>
                  <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">₹{Number(form.discountAmount).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Pricing Formula *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["fixed", "percentage", "flat"].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => set("pricingMethod", method)}
                      className={`py-2 border text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize ${form.pricingMethod === method ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"}`}
                    >
                      {method === "fixed" ? "Fixed Price" : method === "percentage" ? "Percent Off" : "Flat Discount"}
                    </button>
                  ))}
                </div>
              </div>

              {form.pricingMethod === "fixed" && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Selling Combo Price * (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.comboPrice}
                    onChange={(e) => set("comboPrice", Math.max(parseFloat(e.target.value) || 0, 0))}
                    className={`${inputCls} font-bold font-mono ${errors.comboPrice ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
                  />
                </div>
              )}

              {form.pricingMethod === "percentage" && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Discount Percentage * (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => set("discountPercent", Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100))}
                    className={`${inputCls} font-bold font-mono ${errors.discountPercent ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Calculated Final Selling price: <span className="font-bold text-zinc-900 dark:text-zinc-200">₹{form.comboPrice}</span></p>
                  {errors.discountPercent && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.discountPercent}</p>}
                </div>
              )}

              {form.pricingMethod === "flat" && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Flat Discount Value * (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.discountAmount}
                    onChange={(e) => set("discountAmount", Math.max(parseFloat(e.target.value) || 0, 0))}
                    className={`${inputCls} font-bold font-mono ${errors.discountAmount ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Calculated Final Selling price: <span className="font-bold text-zinc-900 dark:text-zinc-200">₹{form.comboPrice}</span></p>
                  {errors.discountAmount && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.discountAmount}</p>}
                </div>
              )}
              {errors.comboPrice && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.comboPrice}</p>}
            </div>
          )}

          {/* STEP 4: Validity & Scheduling */}
          {currentStep === 4 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Valid From (Date & Time)</label>
                  <input
                    type="datetime-local"
                    value={form.validFrom}
                    onChange={(e) => set("validFrom", e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350 focus:outline-none focus:ring-1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Valid To (Date & Time)</label>
                  <input
                    type="datetime-local"
                    value={form.validTo}
                    onChange={(e) => set("validTo", e.target.value)}
                    className={`px-2.5 py-1.5 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350 focus:outline-none focus:ring-1 ${errors.validTo ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
                  />
                  {errors.validTo && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.validTo}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Weekday Restrictions (Optional)</label>
                <div className="flex flex-wrap gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                    const active = form.weeklyRestrictions.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeeklyRestriction(day)}
                        className={`px-3 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${active ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white dark:bg-zinc-900 text-zinc-650 border-zinc-200 dark:border-zinc-800"}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Daily Window Start</label>
                  <input
                    type="time"
                    value={form.timeWindowStart}
                    onChange={(e) => set("timeWindowStart", e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Daily Window End</label>
                  <input
                    type="time"
                    value={form.timeWindowEnd}
                    onChange={(e) => set("timeWindowEnd", e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 font-semibold">Example: Lunch Treats 11:00 AM – 4:00 PM. Outside the window the meal stays visible but cannot be added to cart.</p>
              {errors.timeWindow && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.timeWindow}</p>}
            </div>
          )}

          {/* STEP 5: Store & Franchise applicability */}
          {currentStep === 5 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Scope Applicability *</label>
                <div className="flex flex-col sm:flex-row gap-4 p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-55/30 dark:bg-zinc-900/20 text-xs">
                  {[
                    { id: "all", label: "Available at All Stores" },
                    { id: "franchises", label: "Select Franchises" },
                    { id: "stores", label: "Select Outlets" }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name={`${mode}-applicability`}
                        checked={form.applicabilityType === opt.id}
                        onChange={() => set("applicabilityType", opt.id)}
                        className="text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {form.applicabilityType !== "all" && (() => {
                const isFranchise = form.applicabilityType === "franchises";
                const list = isFranchise ? franchises : stores;
                const search = isFranchise ? franchiseSearch : storeSearch;
                const setSearch = isFranchise ? setFranchiseSearch : setStoreSearch;
                const field = isFranchise ? "selectedFranchises" : "selectedStores";
                const error = isFranchise ? errors.franchises : errors.stores;
                return (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 text-zinc-400" size={12} />
                      <input
                        type="text"
                        placeholder={isFranchise ? "Search franchises..." : "Search outlets..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl max-h-[160px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                      {list.length === 0 && <p className="text-[11px] text-zinc-400 italic text-center py-3">None found.</p>}
                      {list.filter(o => o.name.toLowerCase().includes(search.toLowerCase())).map(o => {
                        const active = form[field].includes(o.id);
                        return (
                          <div
                            key={o.id}
                            onClick={() => toggleIn(field, o.id)}
                            className="flex items-center justify-between p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            <span>{o.name}</span>
                            {active ? <CheckSquare size={14} className="text-[var(--primary)] shrink-0" /> : <Square size={14} className="text-zinc-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {error && <p className="text-[9px] font-bold text-red-500 mt-0.5">{error}</p>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 6: Status */}
          {currentStep === 6 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Publication Status *</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-zinc-750">
                  {[
                    { id: "active", title: "Active immediately", desc: "Visible and valid for purchase by customers." },
                    { id: "draft", title: "Keep as Draft", desc: "Saves combo internally without displaying in-app." },
                    { id: "scheduled", title: "Schedule", desc: "Goes live automatically once Valid From is reached." },
                    { id: "archived", title: "Archived", desc: "Hides combo and prevents future purchases." }
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => set("status", item.id)}
                      className={`p-3 border rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer flex flex-col gap-1 ${form.status === item.id ? "border-[var(--primary)] bg-[var(--primary)]/5 text-zinc-900 dark:text-zinc-100" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {form.status === item.id ? (
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
                {form.status === "scheduled" && !form.validFrom && (
                  <p className="text-[9px] font-bold text-amber-500 mt-0.5">Set a "Valid From" date in step 4 so the combo knows when to go live.</p>
                )}
              </div>

              <div className="p-4 border border-emerald-200 dark:border-emerald-950/20 bg-emerald-500/5 rounded-xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed font-semibold">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Ready to {isEdit ? "update" : "publish"}</h4>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 mt-0.5 leading-snug">
                    {form.items.length} item(s) · ₹{form.comboPrice} {originalTotal > form.comboPrice ? `(MRP ₹${originalTotal})` : ""} · {categories.find(c => c.id === form.categoryId)?.label || "Not listed on menu"}
                  </p>
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
            {!isEdit && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveCombo(true)}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-650 hover:text-[var(--primary)] dark:text-zinc-350 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                Save Draft
              </button>
            )}

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
                disabled={isSaving}
                onClick={() => handleSaveCombo(false)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSaving && <Loader2 size={13} className="animate-spin" />}
                {isEdit ? "Save Changes" : "Publish Combo"}
              </button>
            )}
          </div>
        </div>
      </div>

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
