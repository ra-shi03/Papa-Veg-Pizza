import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  UploadCloud,
  Plus,
  Trash2,
  Check,
  Loader2,
  ChevronDown,
  Search,
  Disc,
  Sparkles,
  Droplets,
  Flame,
  Tag,
  Layers,
  CheckSquare
} from "lucide-react";
import { adminClient } from "@/services/api/axios";
import { uploadAPI } from "@/services/api";
import { toast } from "sonner";

export default function AddProducts({ isOpen, onClose, product, mode = "add", onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [addonsList, setAddonsList] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [stores, setStores] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isToppingsOpen, setIsToppingsOpen] = useState(false);
  const [selectedTypeTab, setSelectedTypeTab] = useState("all");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [addonSearch, setAddonSearch] = useState("");
  const categoryDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    id: "",
    _id: "",
    badge: "",
    originalPrice: "",
    discount: "",
    discountType: "percentage", // "percentage" | "flat"
    price: "",
    saveAmount: 0,
    shortDescription: "",
    description: "",
    image: "",
    status: "Active",
    franchiseIds: [],
    storeIds: [],
    toppings: [],
    defaultCrust: "New Hand Tossed",
    showCrust: true,
    crusts: [],
    sizes: [
      { size: "Regular", price: "", originalPrice: "", discount: "", discountType: "percentage", saveAmount: 0, description: "Serves 1 person only" },
      { size: "Medium", price: "", originalPrice: "", discount: "", discountType: "percentage", saveAmount: 0, description: "Just right for 1-2 people" },
      { size: "Large", price: "", originalPrice: "", discount: "", discountType: "percentage", saveAmount: 0, description: "Serves 3-4 people" }
    ]
  });

  // Fetch categories, franchises when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchFranchises();
      
      if (product && mode !== "add") {
        const rawSizes = product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : [];
        let initializedSizes = [];
        if (rawSizes.length > 0) {
          initializedSizes = rawSizes.map(s => {
            const orig = Number(s.originalPrice) || (s.mrp ? Number(s.mrp) : (Number(s.price) || 0));
            const pr = Number(s.price) || 0;
            let disc = Number(s.discount) || 0;
            const discType = s.discountType || "percentage";
            let save = Number(s.saveAmount) || 0;
            if (orig > pr && !save) {
              save = orig - pr;
            }
            if (orig > pr && !disc) {
              disc = discType === "percentage" ? Math.round((save / orig) * 100) : save;
            }
            return {
              size: s.size || "",
              price: pr > 0 ? pr : (product.price || ""),
              originalPrice: orig > 0 ? orig : (product.originalPrice || ""),
              discount: disc > 0 ? disc : (product.discount || ""),
              discountType: discType,
              saveAmount: save > 0 ? save : (product.saveAmount || 0),
              description: s.description || ""
            };
          });
        } else {
          const baseOrig = Number(product.originalPrice) || Number(product.mrp) || Number(product.price) || "";
          const basePrice = product.price || "";
          const baseDisc = product.discount || "";
          const baseDiscType = product.discountType || "percentage";
          const baseSave = Number(product.saveAmount) || (Number(baseOrig) > Number(basePrice) ? Number(baseOrig) - Number(basePrice) : 0);
          initializedSizes = [
            { size: "Regular", price: basePrice, originalPrice: baseOrig, discount: baseDisc, discountType: baseDiscType, saveAmount: baseSave, description: "Serves 1 person only" }
          ];
        }

        const primarySize = initializedSizes.find(s => s.size?.toLowerCase() === "regular") || initializedSizes[0] || {};

        setFormData({
          id: product.id || "",
          _id: product._id || "",
          name: product.name || "",
          categoryId: product.categoryId?._id || product.categoryId?.id || product.categoryId || "",
          badge: product.badge || "",
          originalPrice: primarySize.originalPrice ?? product.originalPrice ?? "",
          discount: primarySize.discount ?? product.discount ?? "",
          discountType: primarySize.discountType ?? product.discountType ?? "percentage",
          price: primarySize.price ?? product.price ?? "",
          saveAmount: primarySize.saveAmount ?? product.saveAmount ?? 0,
          shortDescription: product.shortDescription || "",
          description: product.description || "",
          image: product.image || product.icon || "",
          status: product.status || "Active",
          franchiseIds: product.franchiseIds || [],
          storeIds: product.storeIds || [],
          toppings: Array.isArray(product.toppings) ? product.toppings.map(t => (typeof t === 'object' ? (t._id || t.id) : t)).filter(Boolean) : (typeof product.toppings === 'string' ? product.toppings.split(",").map(t => t.trim()).filter(Boolean) : []),
          defaultCrust: product.defaultCrust || "New Hand Tossed",
          showCrust: product.showCrust !== undefined ? Boolean(product.showCrust) : true,
          crusts: Array.isArray(product.crusts) ? product.crusts.map(c => (typeof c === 'object' ? (c._id || c.id) : c)).filter(Boolean) : [],
          sizes: initializedSizes
        });
        fetchStores(product.franchiseId || "");
      } else {
        setFormData({
          id: "",
          _id: "",
          name: "",
          categoryId: "",
          badge: "",
          originalPrice: "",
          discount: "",
          discountType: "percentage",
          price: "",
          saveAmount: 0,
          shortDescription: "",
          description: "",
          image: "",
          status: "Active",
          franchiseIds: [],
          storeIds: [],
          toppings: [],
          defaultCrust: "New Hand Tossed",
          showCrust: true,
          crusts: [],
          sizes: [
            { size: "Regular", price: "", originalPrice: "", discount: "", discountType: "percentage", saveAmount: 0, description: "Serves 1 person only" },
            { size: "Medium", price: "", originalPrice: "", discount: "", discountType: "percentage", saveAmount: 0, description: "Just right for 1-2 people" },
            { size: "Large", price: "", originalPrice: "", discount: "", discountType: "percentage", saveAmount: 0, description: "Serves 3-4 people" }
          ]
        });
        fetchStores("");
      }
      fetchAddons();
    }
  }, [isOpen, product, mode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await adminClient.get("/food/admin/category-products");
      if (res?.data?.data) {
        setCategories(res.data.data.filter(c => c.type === "Category"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
    }
  };

  const fetchAddons = async () => {
    try {
      const res = await adminClient.get("/food/admin/addons");
      if (res?.data?.data) {
        setAddonsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFranchises = async () => {
    try {
      const res = await adminClient.get("/food/admin/franchises");
      if (res?.data?.data) {
        setFranchises(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStores = async (franchiseId) => {
    try {
      const endpoint = franchiseId 
        ? `/food/admin/stores?franchiseId=${franchiseId}` 
        : `/food/admin/stores`;
      const res = await adminClient.get(endpoint);
      if (res?.data?.data) {
        const storesData = Array.isArray(res.data.data) ? res.data.data : (res.data.data.stores || []);
        setStores(storesData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFranchiseChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, franchiseIds: val ? [val] : [], storeIds: [] });
    fetchStores(val);
  };

  const handleStoreChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, storeIds: val ? [val] : [] });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only images are allowed");
    }
    setIsUploading(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setFormData(prev => ({ ...prev, image: url }));
        toast.success("Image uploaded!");
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const crustAddons = useMemo(() => {
    const list = addonsList.filter(a => (a.type || "").toLowerCase().includes("crust"));
    if (list.length > 0) {
      return [...list].sort((a, b) => {
        const aDef = a.isDefault || a.name?.toLowerCase().includes("hand tossed");
        const bDef = b.isDefault || b.name?.toLowerCase().includes("hand tossed");
        if (aDef && !bDef) return -1;
        if (!aDef && bDef) return 1;
        return 0;
      });
    }
    return [
      { name: "New Hand Tossed", price: 0, isDefault: true }
    ];
  }, [addonsList]);

  // Group addons dynamically by their exact type (Crust, Toppings, Dips, Extra Cheese, and any custom types)
  const groupedAddons = useMemo(() => {
    const filtered = addonSearch.trim()
      ? addonsList.filter(a => a.name?.toLowerCase().includes(addonSearch.toLowerCase().trim()))
      : addonsList;

    const standardTypeMeta = {
      "crust": { label: "Crusts", icon: Disc, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
      "topping": { label: "Toppings", icon: Sparkles, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
      "dip": { label: "Dips & Sauces", icon: Droplets, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
      "extra cheese": { label: "Extra Cheese", icon: Flame, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" }
    };

    const typeOrder = ["crust", "topping", "dip", "extra cheese"];
    const groupsMap = {};

    filtered.forEach(addon => {
      const rawType = (addon.type || "Topping").trim();
      const normType = rawType.toLowerCase();
      const nameLower = (addon.name || "").toLowerCase();

      let groupKey = normType;
      if (normType.includes("crust")) {
        groupKey = "crust";
      } else if (normType.includes("cheese") || nameLower.includes("cheese")) {
        groupKey = "extra cheese";
      } else if (normType.includes("dip") || normType.includes("sauce")) {
        groupKey = "dip";
      } else if (normType.includes("topping")) {
        groupKey = "topping";
      }

      if (!groupsMap[groupKey]) {
        const meta = standardTypeMeta[groupKey] || {
          label: rawType.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          icon: Tag,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20"
        };
        groupsMap[groupKey] = {
          key: groupKey,
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          items: []
        };
      }
      groupsMap[groupKey].items.push(addon);
    });

    // Ensure standard types appear even if empty when not searching
    if (!addonSearch.trim()) {
      typeOrder.forEach(key => {
        if (!groupsMap[key]) {
          const meta = standardTypeMeta[key];
          groupsMap[key] = {
            key,
            label: meta.label,
            icon: meta.icon,
            color: meta.color,
            items: []
          };
        }
      });
    }

    // Sort: standard types in defined order, then any custom types alphabetically
    return Object.values(groupsMap).sort((a, b) => {
      const idxA = typeOrder.indexOf(a.key);
      const idxB = typeOrder.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [addonsList, addonSearch]);

  const displayedGroups = useMemo(() => {
    if (selectedTypeTab === "all") return groupedAddons;
    return groupedAddons.filter(g => g.key === selectedTypeTab);
  }, [groupedAddons, selectedTypeTab]);

  // Size-wise Pricing & Discount handler (Image 3)
  const handleSizePricingChange = (index, field, value) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      const target = { ...newSizes[index] };

      let orig = field === "originalPrice" ? value : target.originalPrice;
      let disc = field === "discount" ? value : target.discount;
      let discType = field === "discountType" ? value : (target.discountType || "percentage");
      let price = field === "price" ? value : target.price;
      let saveAmount = target.saveAmount || 0;

      const numOrig = parseFloat(orig) || 0;
      const numDisc = parseFloat(disc) || 0;
      const numPrice = parseFloat(price) || 0;

      if (field === "originalPrice" || field === "discount" || field === "discountType") {
        if (numOrig > 0 && numDisc > 0) {
          if (discType === "percentage") {
            const calculatedSavings = Math.round((numOrig * Math.min(100, Math.max(0, numDisc))) / 100);
            saveAmount = calculatedSavings;
            price = Math.max(0, numOrig - calculatedSavings);
          } else {
            const calculatedSavings = Math.min(numOrig, Math.max(0, numDisc));
            saveAmount = calculatedSavings;
            price = Math.max(0, numOrig - calculatedSavings);
          }
        } else if (numOrig > 0 && numPrice > 0 && numOrig >= numPrice) {
          saveAmount = Math.max(0, numOrig - numPrice);
        } else if (numOrig > 0 && !disc) {
          saveAmount = 0;
          if (field === "originalPrice" && !target.price) {
            price = numOrig;
          }
        }
      } else if (field === "price") {
        if (numOrig > 0 && numPrice > 0 && numOrig >= numPrice) {
          saveAmount = Math.max(0, numOrig - numPrice);
          if (discType === "percentage") {
            disc = Math.round((saveAmount / numOrig) * 100);
          } else {
            disc = saveAmount;
          }
        } else {
          saveAmount = 0;
        }
      } else if (field === "size" || field === "description") {
        target[field] = value;
      }

      target.originalPrice = orig;
      target.discount = disc;
      target.discountType = discType;
      target.price = price;
      target.saveAmount = saveAmount;
      newSizes[index] = target;

      // Sync primary size to top level
      const primary = newSizes.find(s => s.size?.toLowerCase() === "regular") || newSizes[0] || {};
      return {
        ...prev,
        sizes: newSizes,
        price: primary.price || prev.price,
        originalPrice: primary.originalPrice || prev.originalPrice,
        discount: primary.discount || prev.discount,
        discountType: primary.discountType || prev.discountType,
        saveAmount: primary.saveAmount || prev.saveAmount
      };
    });
  };

  const handleAddSize = () => setFormData(prev => ({ 
    ...prev, 
    sizes: [...prev.sizes, { size: "", price: "", originalPrice: "", discount: "", discountType: "percentage", saveAmount: 0, description: "" }] 
  }));

  const handleRemoveSize = (index) => setFormData(prev => {
    const newSizes = prev.sizes.filter((_, i) => i !== index);
    const primary = newSizes.find(s => s.size?.toLowerCase() === "regular") || newSizes[0] || {};
    return {
      ...prev,
      sizes: newSizes,
      price: primary.price || prev.price,
      originalPrice: primary.originalPrice || prev.originalPrice,
      discount: primary.discount || prev.discount,
      discountType: primary.discountType || prev.discountType,
      saveAmount: primary.saveAmount || prev.saveAmount
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Filter out empty sizes
    const cleanedSizes = formData.sizes
      .filter(s => s.size && s.size.trim())
      .map(s => {
        const pr = Number(s.price) || 0;
        const orig = Number(s.originalPrice) || pr;
        const disc = Number(s.discount) || 0;
        const discType = s.discountType || "percentage";
        const save = Number(s.saveAmount) || Math.max(0, orig - pr);
        return {
          size: s.size.trim(),
          price: pr,
          originalPrice: orig,
          discount: disc,
          discountType: discType,
          saveAmount: save,
          description: s.description ? s.description.trim() : ""
        };
      });

    const primarySize = cleanedSizes.find(s => s.size.toLowerCase() === "regular") || cleanedSizes[0] || {};
    const finalPrice = primarySize.price || Number(formData.price) || 0;
    const finalOriginalPrice = primarySize.originalPrice || finalPrice;
    const finalDiscount = primarySize.discount || 0;
    const finalDiscountType = primarySize.discountType || "percentage";
    const finalSaveAmount = primarySize.saveAmount || Math.max(0, finalOriginalPrice - finalPrice);

    const cleanedData = {
      ...formData,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      discount: finalDiscount,
      discountType: finalDiscountType,
      saveAmount: finalSaveAmount,
      badge: formData.badge ? formData.badge.trim() : "",
      sizes: cleanedSizes,
      toppings: formData.toppings,
      defaultCrust: formData.defaultCrust || "New Hand Tossed",
      showCrust: formData.showCrust !== undefined ? Boolean(formData.showCrust) : true,
      crusts: formData.crusts || []
    };

    // Clean up empty ObjectIds that MongoDB will reject
    if (!cleanedData.id) delete cleanedData.id;
    if (!cleanedData._id) delete cleanedData._id;
    if (!cleanedData.categoryId) delete cleanedData.categoryId;

    try {
      await onSave(cleanedData, mode);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {mode === "add" ? "Add New Product" : mode === "edit" ? "Edit Product" : "Clone Product"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-8">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Product Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]" placeholder="e.g. Farmhouse Pizza" />
              </div>
              
              <div className="relative" ref={categoryDropdownRef}>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Category *</label>
                <div 
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 cursor-pointer flex justify-between items-center focus:border-[var(--primary)]"
                >
                  <span className={!formData.categoryId ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100 line-clamp-1"}>
                    {formData.categoryId ? (categories.find(c => (c._id || c.id) === formData.categoryId)?.label || "Select Category") : "Select Category"}
                  </span>
                  <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                </div>

                {isCategoryOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                      <Search size={16} className="text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Search category..." 
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none text-zinc-800 dark:text-zinc-200"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {categories.filter(c => c.label?.toLowerCase().includes(categorySearch.toLowerCase())).map(c => {
                        const isSelected = formData.categoryId === (c._id || c.id);
                        return (
                          <div 
                            key={c._id || c.id}
                            onClick={() => {
                              setFormData({...formData, categoryId: c._id || c.id});
                              setIsCategoryOpen(false);
                              setCategorySearch("");
                            }}
                            className={`px-3 py-2 flex items-center justify-between cursor-pointer ${isSelected ? 'bg-zinc-50 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                          >
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{c.label}</span>
                            {isSelected && <Check size={14} className="text-[var(--primary)]" />}
                          </div>
                        );
                      })}
                      {categories.filter(c => c.label?.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-4 text-sm text-center text-zinc-500">No categories found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Product Badge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Product Badge
                  </label>
                  {formData.badge && (
                    <span className="bg-[#E53935] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-xs">
                      {formData.badge}
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={formData.badge} 
                  onChange={e => setFormData({...formData, badge: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]" 
                  placeholder="e.g. NEW, Bestseller, 20% OFF" 
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-zinc-400 font-medium">Quick suggestions:</span>
                  {["NEW", "Bestseller", "Trending", "Hot", "Customisable"].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, badge: prev.badge === tag ? "" : tag }))}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        formData.badge === tag
                          ? "bg-[#E53935] text-white border-[#E53935]"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Short Description</label>
              <input type="text" value={formData.shortDescription} onChange={e => setFormData({...formData, shortDescription: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]" placeholder="Brief summary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Description</label>
              <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]" placeholder="Detailed description..." />
            </div>
          </div>

          {/* Product Image */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">Product Image</h3>
            <div className="flex gap-4 items-center">
              {formData.image ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData({...formData, image: ""})} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={12}/></button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-900">
                  <UploadCloud size={24} />
                </div>
              )}
              <div className="flex-1">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-zinc-200 transition">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {formData.image ? "Change Image" : "Upload Image"}
                </button>
              </div>
            </div>
          </div>

          {/* Sizes & Pricing Matrix (Image 3: Size-wise MRP, Discount, Selling Price & Save Banner) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Sizes & Pricing</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Configure per-size MRP, discounts, and selling price.</p>
              </div>
              <button type="button" onClick={handleAddSize} className="text-[var(--primary)] flex items-center gap-1 text-xs font-semibold hover:underline cursor-pointer">
                <Plus size={14} /> Add Size
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.sizes.map((sizeObj, index) => {
                const sizeOrig = Number(sizeObj.originalPrice) || 0;
                const sizeSell = Number(sizeObj.price) || 0;
                const sizeSavings = sizeObj.saveAmount || (sizeOrig > sizeSell ? sizeOrig - sizeSell : 0);

                return (
                  <div key={index} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/40 relative space-y-4 shadow-2xs">
                    {/* Top Size Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                          Size {index + 1}:
                        </span>
                        <select 
                          value={sizeObj.size} 
                          onChange={(e) => handleSizePricingChange(index, 'size', e.target.value)} 
                          className="px-2.5 py-1.5 border rounded-lg text-sm font-semibold bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)]"
                        >
                          <option value="">Select Size</option>
                          <option value="Regular">Regular</option>
                          <option value="Medium">Medium</option>
                          <option value="Large">Large</option>
                          <option value="Small">Small</option>
                        </select>
                      </div>
                      {formData.sizes.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSize(index)} 
                          className="text-rose-500 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove Size"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Image 3 layout: Original Price (MRP) | Discount (% Off / ₹ Flat) | Final Selling Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {/* Original Price / MRP */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Original Price (MRP) ₹ *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={sizeObj.originalPrice || ""}
                          onChange={(e) => handleSizePricingChange(index, "originalPrice", e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)] font-semibold"
                          placeholder="e.g. 299"
                        />
                        <span className="text-[10px] text-zinc-400 mt-1 block">Regular MRP before discount</span>
                      </div>

                      {/* Discount */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Discount
                          </label>
                          <div className="flex rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => handleSizePricingChange(index, "discountType", "percentage")}
                              className={`px-2 py-0.5 transition-colors cursor-pointer ${
                                (sizeObj.discountType || "percentage") === "percentage" 
                                  ? "bg-[#D32F2F] text-white" 
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              % Off
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSizePricingChange(index, "discountType", "flat")}
                              className={`px-2 py-0.5 transition-colors cursor-pointer ${
                                sizeObj.discountType === "flat" 
                                  ? "bg-[#D32F2F] text-white" 
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              ₹ Flat
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={sizeObj.discountType === "percentage" ? "100" : undefined}
                            value={sizeObj.discount || ""}
                            onChange={(e) => handleSizePricingChange(index, "discount", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)] font-semibold pr-7"
                            placeholder={sizeObj.discountType === "flat" ? "e.g. 50" : "e.g. 20"}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                            {sizeObj.discountType === "flat" ? "₹" : "%"}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 block">
                          {sizeObj.discountType === "flat" ? "Flat amount off MRP" : "Percentage off MRP"}
                        </span>
                      </div>

                      {/* Final Selling Price */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Final Selling Price ₹ *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={sizeObj.price || ""}
                          onChange={(e) => handleSizePricingChange(index, "price", e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)] font-bold text-zinc-900 dark:text-white"
                          placeholder="e.g. 249"
                        />
                        <span className="text-[10px] text-zinc-400 mt-1 block">Final price customer pays</span>
                      </div>
                    </div>

                    {/* Live Save Banner matching Image 3 */}
                    {(Number(sizeObj.originalPrice) > 0 || Number(sizeObj.price) > 0) && (
                      <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#169B45] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                            Save ₹{sizeSavings}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Customer Saves: <span className="text-emerald-600 dark:text-emerald-400">₹{sizeSavings}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span className="text-zinc-400 line-through">MRP: ₹{sizeObj.originalPrice || 0}</span>
                          <span className="text-zinc-400 font-bold">➔</span>
                          <span className="text-zinc-950 dark:text-white font-black text-sm">Pay: ₹{sizeObj.price || 0}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                        Size Description
                      </label>
                      <input 
                        type="text" 
                        value={sizeObj.description || ""} 
                        onChange={(e) => handleSizePricingChange(index, 'description', e.target.value)} 
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)]" 
                        placeholder="e.g. Serves 1 person only" 
                      />
                    </div>
                  </div>
                );
              })}
              {formData.sizes.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-2">No sizes added.</p>
              )}
            </div>
          </div>

          {/* Crust Customization & Default Crust Option */}
          <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-50/40 dark:bg-amber-950/20 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Disc size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Crust Customization & Default Crust
                  </h3>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                    Set the default crust for this product (e.g. Hand Tossed at ₹0) and control crust visibility.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer self-start sm:self-center select-none bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-2xs">
                <input
                  type="checkbox"
                  checked={formData.showCrust}
                  onChange={(e) => setFormData(prev => ({ ...prev, showCrust: e.target.checked }))}
                  className="w-4 h-4 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer"
                />
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Show Crust Option
                </span>
              </label>
            </div>

            {formData.showCrust && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-amber-500/15">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Default Crust (Pre-selected) *
                  </label>
                  <select
                    value={formData.defaultCrust || "New Hand Tossed"}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultCrust: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 outline-none focus:border-[var(--primary)] font-bold text-zinc-900 dark:text-white"
                  >
                    {crustAddons.map(c => {
                      const isHandTossed = c.name?.toLowerCase().includes("hand tossed") || c.isDefault;
                      const defaultPrice = c.prices?.[0]?.price ?? (c.price ?? 0);
                      return (
                        <option key={c.name} value={c.name}>
                          {c.name} {isHandTossed ? "(₹0 Default Base • Free)" : `(+₹${defaultPrice})`}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                    Pre-selected automatically in customization modal with ₹0 extra price.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category Display Scope
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                    <span className="truncate">
                      {categories.find(c => (c._id || c.id) === formData.categoryId)?.label || "Selected Category"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      Crust Enabled
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                    User app customization modal will display the "Change Crust" section.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Toppings / Add-ons by Type with Checkbox Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={16} className="text-[var(--primary)]" />
                  Toppings & Add-ons by Type
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Select which crusts, toppings, dips, and extra cheese can be chosen for this product using checkboxes.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-full">
                  {formData.toppings.length} Assigned
                </span>
                {addonsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = addonsList.map(a => a._id || a.id).filter(Boolean);
                      const isAllAssigned = allIds.length > 0 && allIds.every(id => formData.toppings.includes(id));
                      setFormData(prev => ({
                        ...prev,
                        toppings: isAllAssigned ? [] : allIds
                      }));
                    }}
                    className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer border border-[var(--primary)]/30 px-2.5 py-1 rounded-lg transition-colors hover:bg-[var(--primary)]/5"
                  >
                    {addonsList.length > 0 && addonsList.every(a => formData.toppings.includes(a._id || a.id)) ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>
            </div>

            {/* Type tabs & Search Bar */}
            <div className="space-y-2.5">
              {/* Type Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedTypeTab("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedTypeTab === "all"
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Layers size={13} />
                  All Types ({addonsList.length})
                </button>
                {groupedAddons.map(g => {
                  const Icon = g.icon;
                  const count = g.items.length;
                  const isSelected = selectedTypeTab === g.key;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setSelectedTypeTab(g.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <Icon size={13} />
                      {g.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search filter for toppings */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search add-on name..."
                  value={addonSearch}
                  onChange={(e) => setAddonSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            {/* Type-wise categories */}
            <div className="space-y-4">
              {displayedGroups.map(group => {
                const groupTitle = group.label;
                const addonsInGroup = group.items;
                const Icon = group.icon;
                const selectedInGroup = addonsInGroup.filter(a => {
                  const id = a._id || a.id;
                  return formData.toppings.includes(id) || formData.toppings.includes(a.name);
                });
                const allSelected = addonsInGroup.length > 0 && selectedInGroup.length === addonsInGroup.length;

                const handleSelectAllGroup = () => {
                  const groupIds = addonsInGroup.map(a => a._id || a.id).filter(Boolean);
                  if (allSelected) {
                    setFormData(prev => ({
                      ...prev,
                      toppings: prev.toppings.filter(id => !groupIds.includes(id))
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      toppings: Array.from(new Set([...prev.toppings, ...groupIds]))
                    }));
                  }
                };

                return (
                  <div key={group.key} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md border ${group.color} shrink-0`}>
                          <Icon size={13} className="stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          {groupTitle}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {selectedInGroup.length} of {addonsInGroup.length} selected
                        </span>
                      </div>
                      {addonsInGroup.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllGroup}
                          className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {addonsInGroup.map(addon => {
                        const addonId = addon._id || addon.id;
                        const isSelected = formData.toppings.includes(addonId) || formData.toppings.includes(addon.name);
                        const defaultPrice = addon.prices?.[0]?.price ?? (addon.price ?? 0);

                        return (
                          <label
                            key={addonId}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-zinc-900 dark:text-white ring-1 ring-[var(--primary)]/20 font-semibold"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    toppings: isSelected
                                      ? prev.toppings.filter(id => id !== addonId && id !== addon.name)
                                      : [...prev.toppings, addonId]
                                  }));
                                }}
                                className="w-4 h-4 rounded text-[var(--primary)] accent-[var(--primary)] focus:ring-[var(--primary)]/20 border-zinc-300 dark:border-zinc-700 cursor-pointer shrink-0"
                              />
                              {addon.image ? (
                                <img src={addon.image} alt={addon.name} className="w-6 h-6 rounded object-cover shrink-0 border border-zinc-200 dark:border-zinc-800" />
                              ) : (
                                <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-[10px] text-zinc-400 font-bold">
                                  {addon.name?.charAt(0) || "T"}
                                </div>
                              )}
                              <span className="text-xs truncate">{addon.name}</span>
                              {addon.isDefault && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
                              {Number(defaultPrice) > 0 ? `+₹${defaultPrice}` : "Free"}
                            </span>
                          </label>
                        );
                      })}
                      {addonsInGroup.length === 0 && (
                        <p className="text-xs text-zinc-400 italic col-span-2 py-1">No items found for {groupTitle}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {displayedGroups.length === 0 && (
                <div className="py-6 text-center text-zinc-400 text-xs">
                  No add-on types found matching "{addonSearch}".
                </div>
              )}
            </div>
          </div>

          {/* Availability (Franchises & Stores) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">Availability</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Franchise</label>
                <select 
                  value={formData.franchiseIds.length > 0 ? formData.franchiseIds[0] : ""} 
                  onChange={handleFranchiseChange} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]"
                >
                  <option value="">All Franchises (Global)</option>
                  {franchises.map(f => (
                    <option key={f._id || f.id} value={f._id || f.id}>{f.franchiseName || f.name || f.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Select Store</label>
                <select 
                  value={formData.storeIds.length > 0 ? formData.storeIds[0] : ""} 
                  onChange={handleStoreChange} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]"
                >
                  <option value="">All Stores</option>
                  {stores.length > 0 ? (
                    stores.map(store => (
                      <option key={store._id || store.id} value={store._id || store.id}>{store.storeName || store.name}</option>
                    ))
                  ) : (
                    <option disabled value="">No stores found for this selection.</option>
                  )}
                </select>
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
