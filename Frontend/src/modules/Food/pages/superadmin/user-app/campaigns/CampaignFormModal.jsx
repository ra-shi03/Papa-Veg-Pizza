
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Trash2, Plus, Search, Image as ImageIcon, Loader2, Star, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../../services/api/axios';
import { uploadAPI } from '../../../../../../services/api';

export default function CampaignFormModal({ isOpen, onClose, initialData, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoImage: '',
    bannerImage: '',
    heading: '',
    tagline: '',
    gradientFrom: '',
    gradientTo: '',
    items: [],
    isActive: true,
    startDate: '',
    endDate: ''
  });

  const [products, setProducts] = useState([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        items: initialData.items || []
      });
    }
    fetchProducts();
  }, [initialData]);

  const fetchProducts = async () => {
    try {
      const res = await adminClient.get('/food/admin/products');
      setProducts(res?.data?.data || []);
    } catch (err) {
      console.error('Failed to load products');
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (!initialData) {
      setFormData(prev => ({ 
        ...prev, 
        name: val, 
        slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') 
      }));
    } else {
      setFormData(prev => ({ ...prev, name: val }));
    }
  };

  const handleUpload = async (file, type) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingBanner(true);

    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setFormData(prev => ({ ...prev, [type === 'logo' ? 'logoImage' : 'bannerImage']: url }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingBanner(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.logoImage) {
      toast.error('Name, slug, and logo are required');
      return;
    }

    setIsSaving(true);
    const payload = {
      ...formData,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      items: formData.items.map((item, idx) => ({ ...item, sortOrder: idx }))
    };

    try {
      if (initialData?._id) {
        await adminClient.put(`/dynamic-home/campaigns/${initialData._id}`, payload);
        toast.success('Campaign updated');
      } else {
        await adminClient.post('/dynamic-home/campaigns', payload);
        toast.success('Campaign created');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const addProduct = (product) => {
    if (formData.items.find(i => i.product === product._id || i.product?._id === product._id)) {
      toast.error('Product already added');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: product._id, // Will just be ID to save, but for UI we might need full object
          _productDetails: product, // Temp for UI
          badgeText: '',
          overrideImage: '',
          overrideToppingsText: '',
          defaultVariant: { sizeName: '', crustName: '' },
          isActive: true
        }
      ]
    }));
    setProductSearch('');
  };

  
  const moveItem = (idx, dir) => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === formData.items.length - 1) return;
    setFormData(prev => {
      const newItems = [...prev.items];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      const temp = newItems[idx];
      newItems[idx] = newItems[swapIdx];
      newItems[swapIdx] = temp;
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (idx) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItem = (idx, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      if (field.includes('.')) {
        const [obj, key] = field.split('.');
        newItems[idx] = { ...newItems[idx], [obj]: { ...newItems[idx][obj], [key]: value } };
      } else {
        newItems[idx] = { ...newItems[idx], [field]: value };
      }
      return { ...prev, items: newItems };
    });
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  // Setup preview items correctly (initialData items populate the product)
  const previewItems = formData.items.map(item => {
    const prod = item._productDetails || (typeof item.product === 'object' ? item.product : products.find(p => p._id === item.product));
    if (!prod) return null;
    return {
      ...item,
      product: prod
    };
  }).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative w-full max-w-6xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl flex flex-col lg:flex-row min-h-[600px] my-auto overflow-hidden animate-fadeIn">
        
        {/* Left: Form */}
        <div className="flex-1 flex flex-col max-h-[80vh] overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {initialData ? 'Edit Campaign' : 'Create Campaign'}
            </h2>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <form id="campaignForm" onSubmit={handleSave} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Heading</label>
                  <input
                    type="text"
                    value={formData.heading}
                    onChange={e => setFormData(prev => ({ ...prev, heading: e.target.value.replace(/\$/g, '₹').replace(/\b[rR][sS]\b\.?\s?/g, '₹').replace(/\b[rR]upees?\b\s?/gi, '₹') }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                    placeholder="e.g. In 3 exciting flavours"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={e => setFormData(prev => ({ ...prev, tagline: e.target.value.replace(/\$/g, '₹').replace(/\b[rR][sS]\b\.?\s?/g, '₹').replace(/\b[rR]upees?\b\s?/gi, '₹') }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                    placeholder="e.g. The ultimate loaded Paneer feast!"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>
            </div>

            {/* Assets & Colors */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">Assets & Theme</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Logo Image *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.logoImage}
                      onChange={e => setFormData(prev => ({ ...prev, logoImage: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                      required
                    />
                    <input type="file" ref={logoInputRef} onChange={e => handleUpload(e.target.files[0], 'logo')} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo} className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium flex items-center gap-1">
                      {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Banner Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.bannerImage}
                      onChange={e => setFormData(prev => ({ ...prev, bannerImage: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                    />
                    <input type="file" ref={bannerInputRef} onChange={e => handleUpload(e.target.files[0], 'banner')} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={isUploadingBanner} className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium flex items-center gap-1">
                      {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Background Gradient From</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.gradientFrom || '#1a1a1a'}
                      onChange={e => setFormData(prev => ({ ...prev, gradientFrom: e.target.value }))}
                      className="w-10 h-10 p-1 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.gradientFrom}
                      onChange={e => setFormData(prev => ({ ...prev, gradientFrom: e.target.value }))}
                      placeholder="#1a1a1a"
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Background Gradient To</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.gradientTo || '#000000'}
                      onChange={e => setFormData(prev => ({ ...prev, gradientTo: e.target.value }))}
                      className="w-10 h-10 p-1 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.gradientTo}
                      onChange={e => setFormData(prev => ({ ...prev, gradientTo: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Items Manager */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">Campaign Items</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search and add products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                />
                {productSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.slice(0,10).map(p => (
                      <div key={p._id} onClick={() => addProduct(p)} className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                        <img src={p.image} className="w-8 h-8 rounded object-cover" />
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-zinc-500 ml-auto">₹{p.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-4">
                {formData.items.map((item, idx) => {
                  const prod = item._productDetails || (typeof item.product === 'object' ? item.product : products.find(p => p._id === item.product));
                  return (
                    <div key={idx} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 relative group">
                      <div className="flex gap-3">

                        <div className="flex flex-col gap-1 items-center self-start border-r border-zinc-200 dark:border-zinc-700 pr-3 mr-1">
                          <button type="button" onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"><ArrowUp size={14} /></button>
                          <span className="text-xs font-bold text-zinc-400">{idx + 1}</span>
                          <button type="button" onClick={() => moveItem(idx, 'down')} disabled={idx === formData.items.length - 1} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"><ArrowDown size={14} /></button>
                        </div>

                        <img src={prod?.image} className="w-12 h-12 rounded object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold">{prod?.name}</h4>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <input
                              type="text"
                              value={item.badgeText}
                              onChange={e => updateItem(idx, 'badgeText', e.target.value)}
                              placeholder="Badge (e.g. MUST TRY)"
                              className="px-2 py-1 border rounded text-xs dark:bg-zinc-900 dark:border-zinc-700"
                            />
                            <input
                              type="text"
                              value={item.overrideToppingsText}
                              onChange={e => updateItem(idx, 'overrideToppingsText', e.target.value)}
                              placeholder="Override description"
                              className="px-2 py-1 border rounded text-xs dark:bg-zinc-900 dark:border-zinc-700"
                            />
                            <input
                              type="text"
                              value={item.defaultVariant.sizeName}
                              onChange={e => updateItem(idx, 'defaultVariant.sizeName', e.target.value)}
                              placeholder="Default Size"
                              className="px-2 py-1 border rounded text-xs dark:bg-zinc-900 dark:border-zinc-700"
                            />
                            <input
                              type="text"
                              value={item.defaultVariant.crustName}
                              onChange={e => updateItem(idx, 'defaultVariant.crustName', e.target.value)}
                              placeholder="Default Crust"
                              className="px-2 py-1 border rounded text-xs dark:bg-zinc-900 dark:border-zinc-700"
                            />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeItem(idx)} className="p-1.5 self-start text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-900 rounded-md shadow-sm border border-zinc-200">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="hidden lg:flex w-96 flex-col bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 relative">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center z-10">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
               Live Preview
            </h3>
            <button
              type="submit"
              form="campaignForm"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
            {/* Mobile Mockup */}
            <div className="w-[375px] h-[700px] bg-white dark:bg-[#121212] rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border-[8px] border-zinc-900 overflow-y-auto overflow-x-hidden relative">
              {/* Campaign Render Logic (Mocking HomeSections.jsx campaign block) */}
              <div 
                className="w-full relative pb-6"
                style={{
                  background: formData.gradientFrom && formData.gradientTo ? `linear-gradient(to bottom, ${formData.gradientFrom}, ${formData.gradientTo})` : '#1a1a1a'
                }}
              >
                {formData.bannerImage && (
                  <div className="w-full h-[220px] relative">
                    <img src={formData.bannerImage} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  </div>
                )}
                
                <div className="px-4 relative -mt-10 z-10">
                  {formData.logoImage && (
                    <img src={formData.logoImage} className="h-16 w-auto object-contain mx-auto drop-shadow-xl" />
                  )}
                  {formData.heading && (
                    <h2 className="text-center text-white text-xl font-black mt-2 leading-tight tracking-tight">{formData.heading}</h2>
                  )}
                  {formData.tagline && (
                    <div className="text-center mt-2">
                      <span className="inline-block bg-[var(--accent-red)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {formData.tagline}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex overflow-x-auto gap-4 px-4 mt-6 pb-2 hide-scrollbar">
                  {previewItems.map((item, idx) => {
                    const isVeg = item.product.vegType === 'veg';
                    return (
                      <div key={idx} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-lg flex-shrink-0 w-[240px] flex flex-col">
                        <div className="relative h-[160px] bg-zinc-100 dark:bg-zinc-800">
                          <img src={item.overrideImage || item.product.image} className="w-full h-full object-cover" />
                          {item.badgeText && (
                            <span className="absolute top-2 left-2 bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
                              {item.badgeText}
                            </span>
                          )}
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                            <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{item.product.name}</h4>
                          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-snug">
                            {item.overrideToppingsText || item.product.description}
                          </p>
                          <div className="mt-3 flex justify-between items-center">
                            <div>
                              <span className="text-sm font-bold text-zinc-900 dark:text-white">₹{item.product.price}</span>
                              <div className="text-[10px] text-zinc-500">
                                {item.defaultVariant.sizeName || 'Regular'} | {item.defaultVariant.crustName || 'New Hand Tossed'}
                              </div>
                            </div>
                            <button className="bg-white border border-green-600 text-green-600 font-bold text-[12px] px-4 py-1.5 rounded-md hover:bg-green-50 shadow-sm uppercase">
                              Add +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {previewItems.length === 0 && (
                    <div className="w-[240px] h-[160px] border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center text-white/50 text-sm">
                      Add products...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
