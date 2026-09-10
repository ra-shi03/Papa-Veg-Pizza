import React, { useState, useEffect } from "react";
import { X, Search, Check, AlertTriangle, ArrowRight, ArrowLeft, ShieldAlert } from "lucide-react";

// Geographic Hierarchy Mapping dictionary
const GEOGRAPHY_MAPPING = {
  stores: {
    "Vijay Nagar": { franchise: "Indore Central", territory: "Indore", zone: "Madhya Pradesh", region: "Central India" },
    "Scheme 54": { franchise: "Indore Central", territory: "Indore", zone: "Madhya Pradesh", region: "Central India" },
    "MP Nagar": { franchise: "Bhopal Zone", territory: "Bhopal", zone: "Madhya Pradesh", region: "Central India" },
    "Arera Colony": { franchise: "Bhopal Zone", territory: "Bhopal", zone: "Madhya Pradesh", region: "Central India" },
    "Bandra West": { franchise: "Mumbai Premium", territory: "Mumbai", zone: "Maharashtra", region: "West India" },
    "CP Market": { franchise: "Delhi Express", territory: "Delhi", zone: "Delhi NCR", region: "North India" },
    "SG Road": { franchise: "Ahmedabad Local", territory: "Ahmedabad", zone: "Gujarat", region: "West India" },
    "Indiranagar": { franchise: "Bengaluru Central", territory: "Bengaluru", zone: "Karnataka", region: "South India" }
  },
  franchises: {
    "Indore Central": { territory: "Indore", zone: "Madhya Pradesh", region: "Central India" },
    "Bhopal Zone": { territory: "Bhopal", zone: "Madhya Pradesh", region: "Central India" },
    "Mumbai Premium": { territory: "Mumbai", zone: "Maharashtra", region: "West India" },
    "Delhi Express": { territory: "Delhi", zone: "Delhi NCR", region: "North India" },
    "Ahmedabad Local": { territory: "Ahmedabad", zone: "Gujarat", region: "West India" },
    "Bengaluru Central": { territory: "Bengaluru", zone: "Karnataka", region: "South India" }
  },
  territories: {
    "Indore": { zone: "Madhya Pradesh", region: "Central India" },
    "Bhopal": { zone: "Madhya Pradesh", region: "Central India" },
    "Mumbai": { zone: "Maharashtra", region: "West India" },
    "Delhi": { zone: "Delhi NCR", region: "North India" },
    "Ahmedabad": { zone: "Gujarat", region: "West India" },
    "Bengaluru": { zone: "Karnataka", region: "South India" }
  },
  zones: {
    "Madhya Pradesh": { region: "Central India" },
    "Maharashtra": { region: "West India" },
    "Delhi NCR": { region: "North India" },
    "Gujarat": { region: "West India" },
    "Karnataka": { region: "South India" }
  }
};

export default function CreateUpdatePricingModal({ isOpen, onClose, rule, productsList = [], onSave }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // STEP 1 Fields (Product Selection)
  const [productId, setProductId] = useState("");
  const [variant, setVariant] = useState("Medium");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [prodSearch, setProdSearch] = useState("");

  // STEP 2 Fields (Pricing Setup)
  const [basePrice, setBasePrice] = useState(0);
  const [effectivePrice, setEffectivePrice] = useState(0);
  const [currency, setCurrency] = useState("INR");

  // STEP 3 Fields (Geographic Overrides)
  const [regionId, setRegionId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [territoryId, setTerritoryId] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [storeId, setStoreId] = useState("");

  const [geoSearch, setGeoSearch] = useState({
    region: "", zone: "", territory: "", franchise: "", store: ""
  });

  // STEP 4 Fields (Effective timelines)
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  // STEP 5 Fields (Publish Status)
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setProdSearch("");
      setGeoSearch({ region: "", zone: "", territory: "", franchise: "", store: "" });

      if (rule) {
        // Edit Mode Prefill
        setProductId(rule.productId || "");
        setVariant(rule.variant || "Medium");
        setCategory(rule.category || "");
        setSku(rule.productId || "");
        setBasePrice(rule.basePrice || 0);
        setEffectivePrice(rule.effectivePrice || 0);
        setCurrency(rule.currency || "INR");
        setRegionId(rule.regionId || "");
        setZoneId(rule.zoneId || "");
        setTerritoryId(rule.territoryId || "");
        setFranchiseId(rule.franchiseId || "");
        setStoreId(rule.storeId || "");
        
        // Date helpers
        const formatDT = (dateStr) => {
          if (!dateStr) return "";
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return "";
          const pad = (n) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setValidFrom(formatDT(rule.validFrom));
        setValidTo(formatDT(rule.validTo));
        setStatus(rule.status || "active");
      } else {
        // Add Mode Reset
        setProductId("");
        setVariant("Medium");
        setCategory("");
        setSku("");
        setBasePrice(0);
        setEffectivePrice(0);
        setCurrency("INR");
        setRegionId("");
        setZoneId("");
        setTerritoryId("");
        setFranchiseId("");
        setStoreId("");
        setValidFrom("");
        setValidTo("");
        setStatus("active");
      }
    }
  }, [isOpen, rule]);

  // Handle dependent auto-filling on Product select
  useEffect(() => {
    if (productId) {
      const prod = productsList.find(p => p.id === productId);
      if (prod) {
        setCategory(prod.category || "");
        setSku(prod.id || "");
        // If BasePrice is unset, prefill from catalog
        if (basePrice === 0) {
          const rawPrice = parseFloat((prod.price || "0").replace(/[^\d.]/g, "")) || 0;
          setBasePrice(rawPrice);
          setEffectivePrice(rawPrice);
        }
      }
    }
  }, [productId, productsList]);

  // Geographies selections changes
  const handleStoreChange = (storeName) => {
    setStoreId(storeName);
    if (storeName && GEOGRAPHY_MAPPING.stores[storeName]) {
      const inherit = GEOGRAPHY_MAPPING.stores[storeName];
      setFranchiseId(inherit.franchise);
      setTerritoryId(inherit.territory);
      setZoneId(inherit.zone);
      setRegionId(inherit.region);
    }
  };

  const handleFranchiseChange = (franchiseName) => {
    setFranchiseId(franchiseName);
    setStoreId(""); // Reset lower level override
    if (franchiseName && GEOGRAPHY_MAPPING.franchises[franchiseName]) {
      const inherit = GEOGRAPHY_MAPPING.franchises[franchiseName];
      setTerritoryId(inherit.territory);
      setZoneId(inherit.zone);
      setRegionId(inherit.region);
    }
  };

  const handleTerritoryChange = (territoryName) => {
    setTerritoryId(territoryName);
    setFranchiseId("");
    setStoreId("");
    if (territoryName && GEOGRAPHY_MAPPING.territories[territoryName]) {
      const inherit = GEOGRAPHY_MAPPING.territories[territoryName];
      setZoneId(inherit.zone);
      setRegionId(inherit.region);
    }
  };

  const handleZoneChange = (zoneName) => {
    setZoneId(zoneName);
    setTerritoryId("");
    setFranchiseId("");
    setStoreId("");
    if (zoneName && GEOGRAPHY_MAPPING.zones[zoneName]) {
      const inherit = GEOGRAPHY_MAPPING.zones[zoneName];
      setRegionId(inherit.region);
    }
  };

  if (!isOpen) return null;

  // Derive calculated metrics
  const difference = basePrice - effectivePrice;
  const discountAmount = Math.max(0, difference);
  const discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

  // Validation per step
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!productId) newErrors.productId = "Product selection is required.";
      if (!variant) newErrors.variant = "Variant size selection is required.";
    }
    if (step === 2) {
      if (basePrice < 0) newErrors.basePrice = "Base Price must be 0 or greater.";
      if (effectivePrice < 0) newErrors.effectivePrice = "Override Price must be 0 or greater.";
      if (!currency) newErrors.currency = "Currency is required.";
    }
    if (step === 3) {
      // Geographic is optional (global pricing if empty), so no strict errors.
    }
    if (step === 4) {
      if (validFrom && validTo) {
        if (new Date(validTo) <= new Date(validFrom)) {
          newErrors.validTo = "Effective To date/time must be later than Effective From.";
        }
      }
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

  const handleSubmit = (actionStatus) => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      alert("Please resolve validation flags before publishing.");
      return;
    }

    const payload = {
      productId,
      variant,
      category,
      basePrice,
      effectivePrice,
      currency,
      regionId,
      zoneId,
      territoryId,
      franchiseId,
      storeId,
      validFrom,
      validTo,
      status: actionStatus || status
    };

    onSave?.(payload, rule ? "edit" : "add");
    onClose();
  };

  // Geography options lists
  const regionOptions = ["Central India", "West India", "North India", "South India", "East India"];
  const zoneOptions = ["Madhya Pradesh", "Maharashtra", "Delhi NCR", "Gujarat", "Karnataka"];
  const territoryOptions = ["Indore", "Bhopal", "Mumbai", "Delhi", "Ahmedabad", "Bengaluru"];
  const franchiseOptions = ["Indore Central", "Bhopal Zone", "Mumbai Premium", "Delhi Express", "Ahmedabad Local", "Bengaluru Central"];
  const storeOptions = ["Vijay Nagar", "Scheme 54", "MP Nagar", "Arera Colony", "Bandra West", "CP Market", "SG Road", "Indiranagar"];

  // Filtered dropdown lists for Step 1 Product Selector
  const filteredProducts = productsList.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]" onClick={onClose} />

      {/* Drawer Container */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-zinc-955 shadow-2xl z-[80] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right-5 text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-black dark:text-white">
                {rule ? "Edit Pricing Override Rule" : "Create Global Pricing Override"}
              </h3>
            </div>
            <p className="text-[9px] text-zinc-400 font-bold mt-1 uppercase tracking-wider">
              Step {currentStep} of 5 — {
                currentStep === 1 ? "Product Identification" :
                currentStep === 2 ? "Pricing Calculations" :
                currentStep === 3 ? "Geographic overrides scope" :
                currentStep === 4 ? "Validity Ranges" :
                "Publish configurations"
              }
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar Indicator */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-850 w-full relative">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Form Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* STEP 1: Product Selection */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              {/* Product selector Searchable Dropdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Product *</label>
                  {errors.productId && <span className="text-[9px] font-bold text-red-500">{errors.productId}</span>}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-zinc-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search master catalog by name or SKU..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900/40 focus:outline-none"
                  />
                </div>

                <div className="border border-zinc-150 dark:border-zinc-850 rounded-lg max-h-[140px] overflow-y-auto p-1.5 bg-zinc-50/50 dark:bg-zinc-950/25 divide-y divide-zinc-100 dark:divide-zinc-850 scrollbar-thin">
                  {filteredProducts.map(p => {
                    const isSelected = productId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setProductId(p.id);
                          setProdSearch("");
                        }}
                        className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer hover:bg-zinc-105 dark:hover:bg-zinc-900 ${isSelected ? 'bg-[var(--primary)]/5 font-semibold text-[var(--primary)]' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={p.image} className="w-6 h-6 rounded object-cover shrink-0" />
                          <span>{p.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">{p.id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Variant Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Variant Option *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Regular", "Medium", "Large"].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVariant(v)}
                      className={`py-1.5 border text-xs font-bold rounded-lg transition-colors cursor-pointer ${variant === v ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50'}`}
                    >
                      {v} size
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto filled info */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Auto-filled Category</label>
                  <input
                    type="text"
                    disabled
                    value={category || "—"}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SKU (Read-only)</label>
                  <input
                    type="text"
                    disabled
                    value={sku || "—"}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-mono font-bold"
                  />
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Pricing */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="grid grid-cols-3 gap-2.5">
                {/* Base price */}
                <div className="flex flex-col gap-1 col-span-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Base Price *</label>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>

                {/* Override price */}
                <div className="flex flex-col gap-1 col-span-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Override Price *</label>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={effectivePrice}
                    onChange={(e) => setEffectivePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>

                {/* Currency */}
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Currency *</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 font-bold focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Live Calculations Indicators */}
              <div className="grid grid-cols-3 gap-2.5 bg-zinc-50 dark:bg-zinc-900/50 p-3.5 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-inner text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block mb-0.5">Discount Amount</span>
                  <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">₹{discountAmount}</p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block mb-0.5">Discount Percent</span>
                  <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{discountPercent}%</p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block mb-0.5">Price difference</span>
                  <p className={`text-sm font-black font-mono ${difference >= 0 ? 'text-zinc-650' : 'text-rose-500'}`}>
                    ₹{Math.abs(difference)} {difference >= 0 ? "Lower" : "Higher"}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Geographic overrides scope */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex items-start gap-2 text-[10px] text-zinc-500 font-semibold leading-relaxed">
                <ShieldAlert size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                <p>
                  * Global pricing applies by default if no override levels are set. Lower override selections take precedence (e.g. Store level override takes priority over Region/Zone level overrides).
                </p>
              </div>

              {/* Region */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Region Scope override</label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 focus:outline-none"
                >
                  <option value="">Global / Select Region</option>
                  {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Zone */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Zone Scope override</label>
                <select
                  value={zoneId}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 focus:outline-none"
                >
                  <option value="">Select Zone</option>
                  {zoneOptions.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>

              {/* Territory */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Territory Scope override</label>
                <select
                  value={territoryId}
                  onChange={(e) => handleTerritoryChange(e.target.value)}
                  className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 focus:outline-none"
                >
                  <option value="">Select Territory</option>
                  {territoryOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Franchise */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Franchise Scope override</label>
                <select
                  value={franchiseId}
                  onChange={(e) => handleFranchiseChange(e.target.value)}
                  className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 focus:outline-none"
                >
                  <option value="">Select Franchise</option>
                  {franchiseOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Store Outlet */}
              <div className="flex flex-col gap-1 bg-[var(--primary)]/5 p-3 rounded-lg border border-[var(--primary)]/10">
                <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">Specific Outlet Override (Store)</label>
                <select
                  value={storeId}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  className="px-2 py-2 border border-[var(--primary)]/20 rounded-lg text-xs bg-white dark:bg-zinc-950 text-zinc-755 focus:outline-none text-[var(--primary)] font-bold"
                >
                  <option value="">Global/Applies Higher Scope</option>
                  {storeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

            </div>
          )}

          {/* STEP 4: Effective Timelines */}
          {currentStep === 4 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Effective From (Date & Time)</label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 dark:text-zinc-300 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Effective To (Date & Time)</label>
                    {errors.validTo && <span className="text-[9px] font-bold text-red-500">{errors.validTo}</span>}
                  </div>
                  <input
                    type="datetime-local"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className={`px-2.5 py-1.5 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-755 dark:text-zinc-300 focus:outline-none ${errors.validTo ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  />
                </div>
              </div>

              {/* Derived status info banner */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800 rounded-xl text-xs font-semibold">
                <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider mb-1">Derived Runtime status</span>
                {(() => {
                  if (!validFrom) return <span className="text-emerald-500 font-bold">Active (Immediate / Permanent)</span>;
                  const now = new Date();
                  const start = new Date(validFrom);
                  const end = validTo ? new Date(validTo) : null;
                  
                  if (now < start) {
                    return <span className="text-blue-500 font-bold">Scheduled (Starts: {start.toLocaleString()})</span>;
                  }
                  if (end && now > end) {
                    return <span className="text-red-500 font-bold">Expired (Ended: {end.toLocaleString()})</span>;
                  }
                  return <span className="text-emerald-500 font-bold">Active (Currently Running)</span>;
                })()}
              </div>

            </div>
          )}

          {/* STEP 5: Publish Status */}
          {currentStep === 5 && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Override Status Option *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "active", label: "Active Override", desc: "Live and applied on checkouts" },
                    { key: "scheduled", label: "Scheduled", desc: "Pending start date trigger" },
                    { key: "draft", label: "Save Draft", desc: "Unpublished pricing rule mock" },
                    { key: "archived", label: "Archived", desc: "Soft-deleted historical reference" }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setStatus(item.key)}
                      className={`p-3 border text-left rounded-xl transition-all cursor-pointer ${status === item.key ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50/50'}`}
                    >
                      <span className="text-xs font-extrabold block">{item.label}</span>
                      <span className="text-[9px] text-zinc-450 font-normal block mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review summary cards */}
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850">
                  Rule Configurations Summary
                </div>
                <div className="p-3 space-y-2.5 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-zinc-450">Target SKU:</span>
                    <span className="text-zinc-800 dark:text-zinc-250">{productId} ({variant})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450">Pricing overrides:</span>
                    <span className="text-emerald-600 font-bold">₹{effectivePrice} (Base: ₹{basePrice})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450">Geographic Scope:</span>
                    <span className="text-zinc-800 dark:text-zinc-250">
                      {storeId ? `Store: ${storeId}` : franchiseId ? `Franchise: ${franchiseId}` : "Global / Master"}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-between gap-2.5">
          {currentStep > 1 ? (
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-955 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} /> Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-955 cursor-pointer"
            >
              Cancel
            </button>
          )}

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              Next Step <ArrowRight size={13} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("draft")}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-755 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors bg-white dark:bg-zinc-950 cursor-pointer"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit("active")}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Publish Override
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
