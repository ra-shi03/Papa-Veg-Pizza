import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, Plus, Trash2, Check, Loader2, ChevronDown } from "lucide-react";
import { adminClient } from "@/services/api/axios";
import { uploadAPI } from "@/services/api";
import { toast } from "sonner";

export default function AddProducts({ isOpen, onClose, product, mode = "add", onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [addonsList, setAddonsList] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [stores, setStores] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isToppingsOpen, setIsToppingsOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    sectionId: "",
    id: "",
    _id: "",
    shortDescription: "",
    description: "",
    image: "",
    price: "",
    status: "Active",
    franchiseIds: [],
    storeIds: [],
    toppings: [],
    sizes: [{ size: "", price: "", description: "" }]
  });

  // Fetch categories, franchises when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchFranchises();
      
      if (product && mode !== "add") {
        setFormData({
          id: product.id || "",
          _id: product._id || "",
          name: product.name || "",
          categoryId: product.categoryId || "",
          sectionId: product.sectionId || "",
          shortDescription: product.shortDescription || "",
          description: product.description || "",
          image: product.image || product.icon || "",
          price: product.price || "",
          status: product.status || "Active",
          franchiseIds: product.franchiseIds || [],
          storeIds: product.storeIds || [],
          toppings: Array.isArray(product.toppings) ? product.toppings : (typeof product.toppings === 'string' ? product.toppings.split(",").map(t => t.trim()).filter(Boolean) : []),
          sizes: product.sizes && product.sizes.length ? product.sizes : [{ size: "", price: "", description: "" }]
        });
        fetchStores(product.franchiseId || "");
      } else {
        setFormData({
          id: "",
          _id: "",
          name: "",
          categoryId: "",
          sectionId: "",
          shortDescription: "",
          description: "",
          image: "",
          price: "",
          status: "Active",
          franchiseIds: [],
          storeIds: [],
          toppings: [],
          sizes: [{ size: "", price: "", description: "" }]
        });
        fetchStores("");
      }
      fetchAddons();
    }
  }, [isOpen, product, mode]);

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

  const fetchSections = async (catId) => {
    if (!catId) {
      setSections([]);
      return;
    }
    try {
      const res = await adminClient.get(`/food/admin/sections?categoryId=${catId}`);
      if (res?.data?.data) {
        setSections(res.data.data);
      }
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    fetchSections(formData.categoryId);
  }, [formData.categoryId]);

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
      return;
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

  const handleAddSize = () => setFormData(prev => ({ ...prev, sizes: [...prev.sizes, { size: "", price: "", description: "" }] }));
  const handleRemoveSize = (index) => setFormData(prev => ({
    ...prev,
    sizes: prev.sizes.filter((_, i) => i !== index)
  }));
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = value;
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Filter out empty sizes and format toppings
    const cleanedData = {
      ...formData,
      sizes: formData.sizes.filter(s => s.size.trim())
    };

    // Calculate base price from sizes if available
    cleanedData.price = cleanedData.sizes.length > 0 ? Number(cleanedData.sizes[0].price) || 0 : 0;

    // Clean up empty ObjectIds that MongoDB will reject
    if (!cleanedData.id) delete cleanedData.id;
    if (!cleanedData._id) delete cleanedData._id;
    if (!cleanedData.categoryId) delete cleanedData.categoryId;
    if (!cleanedData.sectionId) delete cleanedData.sectionId;

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
              
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Category *</label>
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value, sectionId: ''})} className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]">
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Section / Collection *</label>
                <select required value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]">
                  <option value="">Select Section</option>
                  {sections.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 outline-none focus:border-[var(--primary)]">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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

          {/* Image */}
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


          {/* Toppings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">Toppings</h3>
            
            <div className="relative">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Toppings</label>
              
              <div 
                onClick={() => setIsToppingsOpen(!isToppingsOpen)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent dark:border-zinc-700 cursor-pointer flex justify-between items-center focus:border-[var(--primary)]"
              >
                <span className={formData.toppings.length === 0 ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100 line-clamp-1"}>
                  {formData.toppings.length === 0 
                    ? "Select Toppings" 
                    : formData.toppings.map(id => addonsList.find(a => a._id === id)?.name || id).join(", ")}
                </span>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isToppingsOpen ? "rotate-180" : ""}`} />
              </div>

              {isToppingsOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {addonsList.map(addon => {
                    const isSelected = formData.toppings.includes(addon._id);
                    return (
                      <div 
                        key={addon._id}
                        onClick={() => {
                          const newToppings = isSelected
                            ? formData.toppings.filter(t => t !== addon._id)
                            : [...formData.toppings, addon._id];
                          setFormData({...formData, toppings: newToppings});
                        }}
                        className="px-3 py-2 flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-zinc-300 dark:border-zinc-600'}`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{addon.name}</span>
                      </div>
                    );
                  })}
                  {addonsList.length === 0 && (
                    <div className="px-3 py-4 text-sm text-center text-zinc-500">No toppings available</div>
                  )}
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

          {/* Sizes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Sizes & Pricing</h3>
              <button type="button" onClick={handleAddSize} className="text-[var(--primary)] flex items-center gap-1 text-xs font-semibold hover:underline">
                <Plus size={14} /> Add Size
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.sizes.map((sizeObj, index) => (
                <div key={index} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 relative">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Size Name</label>
                      <select value={sizeObj.size} onChange={(e) => handleSizeChange(index, 'size', e.target.value)} className="w-full px-2.5 py-1.5 border rounded-md text-sm bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)]">
                        <option value="">Select Size</option>
                        <option value="Small">Small</option>
                        <option value="Regular">Regular</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Price</label>
                      <input type="number" step="0.01" value={sizeObj.price} onChange={(e) => handleSizeChange(index, 'price', e.target.value)} className="w-full px-2.5 py-1.5 border rounded-md text-sm bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)]" placeholder="e.g. 399" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description</label>
                    <input type="text" value={sizeObj.description} onChange={(e) => handleSizeChange(index, 'description', e.target.value)} className="w-full px-2.5 py-1.5 border rounded-md text-sm bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:border-[var(--primary)]" placeholder="e.g. Serves 2 people" />
                  </div>
                  
                  <button type="button" onClick={() => handleRemoveSize(index)} className="absolute -top-2 -right-2 bg-white dark:bg-zinc-950 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-full p-1 shadow-sm transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {formData.sizes.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-2">No sizes added.</p>
              )}
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
