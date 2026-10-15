import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, 
  Sparkles, Layers, Image as ImageIcon, Check, X, Search,
  AlertCircle, ChevronRight, Package, Tag, MoveUp, MoveDown,
  Upload, CheckCircle2, Grid, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';
import apiClient from '../../../../../services/api/axios';
import { uploadAPI } from '../../../../../services/api';
import { getSectionGradient, THREE_STOP_GRADIENTS } from '../../user/home/components/dynamic/ShowcaseSections';

// Title Case Helper: First letter Uppercase, rest lowercase in each word
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\b[a-z]/g, char => char.toUpperCase())
    .replace(/_([a-z])/g, (_, c) => '_' + c.toUpperCase())
    .replace(/'[A-Z]\b/g, char => char.toLowerCase());
}

const BG_PRESETS = [
  { 
    id: 'brand_red', 
    name: 'Brand Red Theme', 
    subtitle: '0% Top Light Rose • 50% Center Vibrant Red • 100% Bottom Light Rose',
    isTheme: true,
    cssGradient: 'linear-gradient(180deg, #FFF1F3 0%, #EE3A43 50%, #FFF1F3 100%)',
    border: '#FFA3A8',
    textColor: '#991B1B'
  },
  { 
    id: 'festive_blue', 
    name: 'Royal Sapphire Blue', 
    subtitle: '0% Top Light Blue • 50% Center Sapphire Blue • 100% Bottom Light Blue',
    cssGradient: 'linear-gradient(180deg, #EFF6FF 0%, #3B82F6 50%, #EFF6FF 100%)',
    border: '#93C5FD',
    textColor: '#1E3A8A'
  },
  { 
    id: 'warm_cream', 
    name: 'Warm Cream & Gold', 
    subtitle: '0% Top Pale Cream • 50% Center Golden Amber • 100% Bottom Pale Cream',
    cssGradient: 'linear-gradient(180deg, #FEFCE8 0%, #FBBF24 50%, #FEFCE8 100%)',
    border: '#FCD34D',
    textColor: '#78350F'
  },
  { 
    id: 'sunset_orange', 
    name: 'Fiery Sunset Orange', 
    subtitle: '0% Top Light Apricot • 50% Center Sunset Orange • 100% Bottom Light Apricot',
    cssGradient: 'linear-gradient(180deg, #FFF7ED 0%, #FB923C 50%, #FFF7ED 100%)',
    border: '#FB923C',
    textColor: '#9A3412'
  },
  { 
    id: 'golden_glow', 
    name: 'Golden Cheese Burst', 
    subtitle: '0% Top Soft Butter • 50% Center Rich Gold • 100% Bottom Soft Butter',
    cssGradient: 'linear-gradient(180deg, #FEFCE8 0%, #FACC15 50%, #FEFCE8 100%)',
    border: '#FACC15',
    textColor: '#854D0E'
  },
  { 
    id: 'emerald_fresh', 
    name: 'Fresh Garden Emerald', 
    subtitle: '0% Top Soft Mint • 50% Center Fresh Emerald • 100% Bottom Soft Mint',
    cssGradient: 'linear-gradient(180deg, #F0FDF4 0%, #4ADE80 50%, #F0FDF4 100%)',
    border: '#4ADE80',
    textColor: '#166534'
  },
  { 
    id: 'charcoal_luxe', 
    name: 'Midnight Gourmet Noir', 
    subtitle: '0% Top Soft Platinum • 50% Center Sleek Zinc • 100% Bottom Soft Platinum',
    cssGradient: 'linear-gradient(180deg, #FAFAFA 0%, #A1A1AA 50%, #FAFAFA 100%)',
    border: '#A1A1AA',
    textColor: '#27272A'
  }
];

export default function ShowcaseSectionsConfig() {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  // Categories & Products state for dynamic selection
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isLoadingCategoryProducts, setIsLoadingCategoryProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Logo upload state
  const logoFileInputRef = useRef(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    subtitle: '',
    logoUrl: '',
    badgeText: '',
    bgStyle: 'brand_red',
    bgColor: '',
    isActive: true,
    products: []
  });

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'products'
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSections();
    fetchCategories();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      let res;
      try {
        res = await adminClient.get('/settings/showcase-sections/admin');
      } catch {
        res = await apiClient.get('/settings/showcase-sections');
      }

      if (res?.data?.success && Array.isArray(res.data.data)) {
        setSections(res.data.data);
        try {
          localStorage.setItem('pvp_showcase_sections', JSON.stringify(res.data.data));
          window.dispatchEvent(new CustomEvent('showcaseSectionsUpdated', { detail: res.data.data }));
        } catch (_) {}
        return res.data.data;
      }
    } catch (err) {
      console.error('Error fetching showcase sections:', err);
      toast.error('Failed to load showcase sections');
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const fetchCategories = async () => {
    try {
      const res = await adminClient.get('/food/admin/category-products');
      const list = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
      const validCats = list.filter(c => c.status !== 'Inactive' && c.type !== 'Product');
      setCategories(validCats);
      if (validCats.length > 0 && !selectedCategory) {
        setSelectedCategory(validCats[0]);
      }
    } catch (err) {
      console.warn('Could not fetch categories:', err);
    }
  };

  // When selected category changes, automatically fetch products for that category
  useEffect(() => {
    if (selectedCategory) {
      fetchProductsForCategory(selectedCategory._id || selectedCategory.id || selectedCategory.label);
    }
  }, [selectedCategory]);

  const fetchProductsForCategory = async (catId) => {
    setIsLoadingCategoryProducts(true);
    try {
      const res = await adminClient.get('/food/admin/products', {
        params: { category: catId }
      });
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setCategoryProducts(list);
    } catch (err) {
      console.warn('Could not fetch products for category:', err);
      setCategoryProducts([]);
    } finally {
      setIsLoadingCategoryProducts(false);
    }
  };

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        name: toTitleCase(section.name || ''),
        title: toTitleCase(section.title || ''),
        subtitle: toTitleCase(section.subtitle || ''),
        logoUrl: section.logoUrl || '',
        badgeText: toTitleCase(section.badgeText || ''),
        bgStyle: section.bgStyle || 'brand_red',
        bgColor: section.bgColor || '',
        isActive: section.isActive !== undefined ? section.isActive : true,
        products: (section.products || []).map(p => ({
          product: p.product?._id || p.product || p.productId || null,
          customTitle: toTitleCase(p.customTitle || p.title || p.product?.name || ''),
          customDescription: toTitleCase(p.customDescription || p.description || p.product?.description || ''),
          customImage: p.customImage || p.image || p.product?.image || '',
          customPrice: p.customPrice || p.price || p.product?.price || 0,
          customOriginalPrice: p.customOriginalPrice || p.originalPrice || p.product?.originalPrice || 0,
          customSaveText: toTitleCase(p.customSaveText || p.saveText || ''),
          sizeCrustText: toTitleCase((p.sizeCrustText || 'Regular | New Hand Tossed').replace(/\s*>\s*$/, '')),
          buttonText: toTitleCase(p.buttonText || 'Add +'),
          badge: toTitleCase(p.badge || ''),
          vegType: p.vegType || 'veg'
        }))
      });
    } else {
      setEditingSection(null);
      setFormData({
        name: '',
        title: '',
        subtitle: '',
        logoUrl: '',
        badgeText: '',
        bgStyle: 'brand_red',
        bgColor: '',
        isActive: true,
        products: []
      });
    }
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setFormData(prev => ({ ...prev, logoUrl: url }));
        toast.success('Header logo uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo image');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleToggleProduct = (product) => {
    const prodId = product._id;
    const isAlreadySelected = formData.products.some(p => p.product === prodId);

    if (isAlreadySelected) {
      // Remove product
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.product !== prodId)
      }));
      toast.info(`Removed "${product.name}"`);
    } else {
      // Add product (Auto-formatted to Title Case)
      const newItem = {
        product: prodId,
        customTitle: toTitleCase(product.name || ''),
        customDescription: toTitleCase(product.shortDescription || product.description || ''),
        customImage: product.image || '',
        customPrice: product.price || 0,
        customOriginalPrice: product.originalPrice || 0,
        customSaveText: product.discount ? `Save ₹${product.discount}` : '',
        sizeCrustText: 'Regular | New Hand Tossed',
        buttonText: 'Add +',
        badge: toTitleCase(product.badge || ''),
        vegType: product.vegType || 'veg'
      };

      setFormData(prev => ({
        ...prev,
        products: [...prev.products, newItem]
      }));
      toast.success(`Selected "${toTitleCase(product.name)}"`);
    }
  };


  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await adminClient.patch(`/settings/showcase-sections/${id}/toggle`);
      if (res?.data?.success) {
        toast.success(res.data.message || 'Status updated');
        setSections(prev => prev.map(s => s._id === id ? { ...s, isActive: !currentStatus } : s));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this showcase section?')) return;
    try {
      const res = await adminClient.delete(`/settings/showcase-sections/${id}`);
      if (res?.data?.success) {
        toast.success('Showcase section deleted');
        setSections(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete section');
    }
  };

  const handleMoveSection = async (index, direction) => {
    const newSections = [...sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Update sortOrder
    const items = newSections.map((sec, idx) => ({ id: sec._id, sortOrder: idx + 1 }));
    setSections(newSections);

    try {
      await adminClient.patch('/settings/showcase-sections/reorder', { items });
      toast.success('Section order updated');
    } catch (err) {
      console.error(err);
      fetchSections(); // revert
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Display Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: toTitleCase(formData.name.trim() || formData.title.trim()),
        title: toTitleCase(formData.title.trim()),
        subtitle: toTitleCase(formData.subtitle.trim()),
        logoUrl: formData.logoUrl.trim(),
        badgeText: toTitleCase(formData.badgeText.trim()),
        bgStyle: formData.bgStyle || 'brand_red',
        bgColor: typeof formData.bgColor === 'string' ? formData.bgColor.trim() : '',
        isActive: formData.isActive,
        products: formData.products.map(p => ({
          product: p.product || null,
          customTitle: toTitleCase(p.customTitle || p.title || ''),
          customDescription: toTitleCase(p.customDescription || p.description || ''),
          customImage: p.customImage || p.image || '',
          customPrice: Number(p.customPrice || p.price || 0),
          customOriginalPrice: Number(p.customOriginalPrice || p.originalPrice || 0),
          badge: toTitleCase(p.badge || ''),
          sizeCrustText: toTitleCase((p.sizeCrustText || 'Regular | New Hand Tossed').replace(/\s*>\s*$/, '')),
          buttonText: toTitleCase(p.buttonText || 'Add +'),
          customSaveText: toTitleCase(p.customSaveText || ''),
          vegType: p.vegType || 'veg'
        }))
      };

      let res;
      const isCustomId = editingSection && (!editingSection._id || String(editingSection._id).startsWith('sec-'));

      if (editingSection && !isCustomId) {
        try {
          res = await adminClient.put(`/settings/showcase-sections/${editingSection._id}`, payload);
        } catch (adminErr) {
          console.warn('adminClient.put failed, trying apiClient fallback:', adminErr);
          try {
            res = await apiClient.put(`/settings/showcase-sections/${editingSection._id}`, payload);
          } catch (apiErr) {
            console.warn('apiClient.put failed, trying post:', apiErr);
            res = await adminClient.post('/settings/showcase-sections', payload);
          }
        }
      } else {
        try {
          res = await adminClient.post('/settings/showcase-sections', payload);
        } catch (adminErr) {
          console.warn('adminClient.post failed, trying apiClient fallback:', adminErr);
          try {
            res = await apiClient.post('/settings/showcase-sections', payload);
          } catch (apiErr) {
            console.warn('apiClient.post failed, trying put:', apiErr);
            if (editingSection?._id) {
              res = await adminClient.put(`/settings/showcase-sections/${editingSection._id}`, payload);
            }
          }
        }
      }

      // Merge saved payload or returned data
      const savedDoc = res?.data?.data || {
        ...payload,
        _id: editingSection?._id || ('sec-' + Date.now())
      };

      // Realtime local sync
      const nextList = editingSection
        ? sections.map(s => (s._id === editingSection._id || s.name === editingSection.name) ? { ...s, ...savedDoc } : s)
        : [...sections, savedDoc];

      setSections(nextList);
      try {
        localStorage.setItem('pvp_showcase_sections', JSON.stringify(nextList));
        window.dispatchEvent(new CustomEvent('showcaseSectionsUpdated', { detail: nextList }));
      } catch (_) {}

      toast.success(editingSection ? 'Showcase section updated successfully' : 'Showcase section created successfully');
      setIsModalOpen(false);

      // Fetch in background to reconcile DB IDs
      fetchSections();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter(c => 
    (c.label || c.name || '').toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filtered products for current category
  const filteredProducts = categoryProducts.filter(p =>
    (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  // Check if all filtered products in current category are selected
  const areAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => 
    formData.products.some(fp => fp.product === p._id)
  );

  const handleToggleSelectAll = () => {
    if (areAllSelected) {
      // Deselect all filtered products in this category
      const currentCategoryProductIds = new Set(filteredProducts.map(p => p._id));
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => !currentCategoryProductIds.has(p.product))
      }));
      toast.info(`Deselected all products in ${selectedCategory?.label || 'category'}`);
    } else {
      // Select all filtered products in this category
      const existingProductIds = new Set(formData.products.map(p => p.product));
      const newItemsToAdd = filteredProducts
        .filter(p => !existingProductIds.has(p._id))
        .map(product => ({
          product: product._id,
          customTitle: toTitleCase(product.name || ''),
          customDescription: toTitleCase(product.shortDescription || product.description || ''),
          customImage: product.image || '',
          customPrice: product.price || 0,
          customOriginalPrice: product.originalPrice || 0,
          customSaveText: product.discount ? `Save ₹${product.discount}` : '',
          sizeCrustText: 'Regular | New Hand Tossed',
          buttonText: 'Add +',
          badge: toTitleCase(product.badge || ''),
          vegType: product.vegType || 'veg'
        }));

      setFormData(prev => ({
        ...prev,
        products: [...prev.products, ...newItemsToAdd]
      }));
      toast.success(`Selected all ${filteredProducts.length} products`);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-[var(--accent-red,#EE3A43)]">
              <Sparkles size={18} />
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-[var(--accent-red,#EE3A43)]">
              Dynamic Home Page Collections
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Showcase Sections
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Create and organize dynamic product spotlights (e.g., Paneer Max, 6 in 1 Big Big Pizza, Combo Bonanza) shown below the coupon section on the user app home page.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-red,#EE3A43)] hover:bg-[#d92d35] text-white rounded-xl text-sm font-semibold shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} />
          Create New Section
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Showcase Sections</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{sections.length}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Active on Home Page</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {sections.filter(s => s.isActive).length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <Eye size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Linked Products</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {sections.reduce((acc, s) => acc + (s.products?.length || 0), 0)}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <Package size={22} />
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white dark:bg-zinc-900 p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-500 font-medium">Loading showcase sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <Sparkles className="w-12 h-12 text-zinc-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No Showcase Sections Found</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1 mb-4">
              Get started by creating dynamic spotlight sections like Paneer Maxxx, 6 in 1 Big Big Pizza, or Combo Bonanza to display below the coupons.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[var(--accent-red,#EE3A43)] text-white text-sm font-semibold rounded-xl hover:opacity-90 cursor-pointer"
            >
              + Create First Section
            </button>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section._id}
              className={`bg-white dark:bg-zinc-900 rounded-2xl border ${
                section.isActive 
                  ? 'border-zinc-200 dark:border-zinc-800' 
                  : 'border-zinc-200/50 dark:border-zinc-800/50 opacity-75'
              } p-5 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700 relative overflow-hidden`}
            >
              {/* Top Accent Gradient Bar representing the active section gradient */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5" 
                style={{ background: getSectionGradient(section, false) }} 
              />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                {/* Section Info Header */}
                <div className="flex items-start gap-4">
                  {/* Order controls */}
                  <div className="flex flex-col gap-1 items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    <button
                      onClick={() => handleMoveSection(index, -1)}
                      disabled={index === 0}
                      className="p-0.5 hover:text-black dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <span>#{index + 1}</span>
                    <button
                      onClick={() => handleMoveSection(index, 1)}
                      disabled={index === sections.length - 1}
                      className="p-0.5 hover:text-black dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  {/* Logo or Badge Preview */}
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 p-1">
                    {section.logoUrl ? (
                      <img src={section.logoUrl} alt={toTitleCase(section.name)} className="max-w-full max-h-full object-contain" />
                    ) : section.badgeText ? (
                      <span className="text-[10px] font-black tracking-tight text-center text-red-600 leading-tight">
                        {toTitleCase(section.badgeText)}
                      </span>
                    ) : (
                      <Sparkles size={20} className="text-zinc-400" />
                    )}
                  </div>

                  {/* Section Titles */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-zinc-900 dark:text-white text-lg">
                        {toTitleCase(section.title)}
                      </h3>
                      {section.badgeText && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
                          {toTitleCase(section.badgeText)}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                        {toTitleCase(section.name)}
                      </span>

                      {/* Active Gradient Indicator Pill */}
                      <span 
                        className="text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-black/10 flex items-center gap-1.5 shadow-2xs"
                        style={{ background: getSectionGradient(section, false) }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full border border-black/20 shrink-0" 
                          style={{ background: section.bgColor || (BG_PRESETS.find(p => p.id === section.bgStyle)?.border || '#EE3A43') }} 
                        />
                        <span className="text-zinc-900 font-semibold text-[10px]">
                          {section.bgStyle === 'custom' 
                            ? `Gradient: ${section.bgColor || '#EE3A43'}` 
                            : (BG_PRESETS.find(p => p.id === section.bgStyle)?.name || 'Theme Red')}
                        </span>
                      </span>
                    </div>
                    {section.subtitle && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {toTitleCase(section.subtitle)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => handleToggleActive(section._id, section.isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      section.isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {section.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {section.isActive ? 'Active on Home' : 'Hidden'}
                  </button>

                  <button
                    onClick={() => handleOpenModal(section)}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                    title="Edit Section"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDeleteSection(section._id)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Linked Products Preview Strip */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Linked Products ({section.products?.length || 0})
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    Horizontal scroll preview on mobile
                  </span>
                </div>

                {section.products && section.products.length > 0 ? (
                  <div className="flex overflow-x-auto gap-3 pb-2 pt-1 hide-scrollbar">
                    {section.products.map((p, pIdx) => {
                      const displayTitle = toTitleCase(p.customTitle || p.title || p.product?.name || 'Product');
                      const displayPrice = p.customPrice || p.price || p.product?.price || 0;
                      const displayImg = p.customImage || p.image || p.product?.image || '';
                      const displaySave = toTitleCase(p.customSaveText || p.saveText || '');

                      return (
                        <div
                          key={pIdx}
                          className="w-48 shrink-0 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-2.5 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col justify-between"
                        >
                          <div>
                            <div className="w-full h-24 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700 mb-2 relative">
                              {displayImg ? (
                                <img src={displayImg} alt={displayTitle} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">No Image</div>
                              )}
                              {displaySave && (
                                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white">
                                  {displaySave}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {displayTitle}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                              {toTitleCase(p.customDescription || p.description || p.sizeCrustText || 'Standard Crust')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white">
                              ₹{displayPrice}
                            </span>
                            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded">
                              {toTitleCase(p.buttonText || 'Add +')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic py-2">
                    No products linked yet. Click Edit to link products from your catalog.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {editingSection ? 'Edit Showcase Section' : 'Create Showcase Section'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure the collection title, logo badge, and link featured products.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 gap-6 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-[var(--accent-red,#EE3A43)] text-[var(--accent-red,#EE3A43)]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                1. Section Details & Style
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'products'
                    ? 'border-[var(--accent-red,#EE3A43)] text-[var(--accent-red,#EE3A43)]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                2. Categories & Linked Products
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  {formData.products.length} selected
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'details' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Internal Name / Identifier *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paneer Maxxx, 6 In 1, Combo Bonanza"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onBlur={(e) => setFormData(prev => ({ ...prev, name: toTitleCase(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Badge Text (e.g. "Paneer Maxxx" / "6 In 1")
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paneer Maxxx or 6 In 1"
                        value={formData.badgeText}
                        onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                        onBlur={(e) => setFormData(prev => ({ ...prev, badgeText: toTitleCase(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Public Display Heading *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. In 3 Exciting Flavours / Big Big Pizza"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        onBlur={(e) => setFormData(prev => ({ ...prev, title: toTitleCase(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Display Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. The Ultimate Loaded Paneer Feast!"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        onBlur={(e) => setFormData(prev => ({ ...prev, subtitle: toTitleCase(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Header Logo URL with Upload Option */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Header Logo / Badge (Upload image or enter URL)
                    </label>
                    <input 
                      type="file" 
                      ref={logoFileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden" 
                    />

                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="https://example.com/logo.png or click Upload"
                          value={formData.logoUrl}
                          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 shrink-0 cursor-pointer transition-colors shadow-sm"
                        >
                          {isUploadingLogo ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload size={15} />
                          )}
                          <span>{isUploadingLogo ? 'Uploading...' : 'Upload Image'}</span>
                        </button>
                      </div>

                      {formData.logoUrl && (
                        <div className="relative group w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center shrink-0">
                          <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logoUrl: '' })}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md text-xs hover:bg-red-600 cursor-pointer"
                            title="Remove Logo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Background Style Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Section Background Gradient (3-Stop Domino's Style)
                        </label>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Linear CSS gradient that uses 3 color stops: lighter colors at 0% and 100%, and bright vibrant color locked at 50%.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {BG_PRESETS.map((preset) => {
                        const isSelected = formData.bgStyle === preset.id && !formData.bgColor;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => setFormData({ ...formData, bgStyle: preset.id, bgColor: '' })}
                            style={{ background: preset.cssGradient }}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[96px] shadow-xs relative ${
                              isSelected
                                ? 'border-[var(--accent-red,#EE3A43)] ring-2 ring-red-500/30 scale-[1.01]'
                                : 'border-black/10 dark:border-white/10 hover:border-zinc-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <p className="text-xs font-bold leading-tight flex items-center gap-1.5" style={{ color: preset.textColor }}>
                                  {preset.name}
                                </p>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-[var(--accent-red,#EE3A43)] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Check size={10} strokeWidth={3} />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] leading-snug font-medium text-zinc-700 dark:text-zinc-200">
                                {preset.subtitle}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-1">
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-black/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200">
                                0% Light • 50% Bright • 100% Light
                              </span>
                              {preset.isTheme && (
                                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-[var(--accent-red,#EE3A43)] text-white shadow-xs">
                                  ★ Theme
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom 3-Stop Color Picker */}
                    <div className="mt-3.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                            Or Choose a Custom Color
                          </span>
                          {formData.bgColor && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                              Custom Color Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Automatically generates the 3-stop linear gradient: lighter at 0% & 100%, with your bright color at 50%.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Native Color Picker */}
                        <div className="relative flex items-center">
                          <input
                            type="color"
                            value={formData.bgColor ? (formData.bgColor.startsWith('#') ? formData.bgColor : '#' + formData.bgColor) : '#EE3A43'}
                            onInput={(e) => setFormData(prev => ({ ...prev, bgColor: e.target.value, bgStyle: 'custom' }))}
                            onChange={(e) => setFormData(prev => ({ ...prev, bgColor: e.target.value, bgStyle: 'custom' }))}
                            className="w-10 h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0.5 bg-white shadow-2xs"
                            title="Pick a custom color"
                          />
                        </div>

                        {/* Editable Hex Code Input */}
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={7}
                            placeholder="#EE3A43"
                            value={formData.bgColor || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => ({ 
                                ...prev, 
                                bgColor: val, 
                                bgStyle: val.trim() ? 'custom' : 'brand_red' 
                              }));
                            }}
                            className="w-24 px-2.5 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none focus:border-red-500 shadow-2xs text-center"
                          />
                        </div>

                        {/* Reset to Theme Button */}
                        {formData.bgColor && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, bgColor: '', bgStyle: 'brand_red' }));
                              toast.info('Reset to Brand Red Theme');
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/70 text-[var(--accent-red,#EE3A43)] dark:text-red-400 border border-red-200 dark:border-red-800/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                            title="Reset to Brand Red Theme"
                          >
                            <RotateCcw size={13} className="shrink-0" />
                            <span>Reset to Theme</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Gradient Preview Box */}
                    <div 
                      className="mt-3.5 p-3.5 rounded-xl border border-black/10 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-all"
                      style={{ background: getSectionGradient(formData, false) }}
                    >
                      <div>
                        <span className="text-xs font-bold text-zinc-900 block">
                          Live Gradient Preview (User App Home Page)
                        </span>
                        <p className="text-[11px] text-zinc-700 font-medium m-0">
                          0% Top Light Shade • 50% Center Bright Color (Set by Superadmin) • 100% Bottom Light Shade (180° Vertical)
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/90 text-zinc-900 shadow-xs border border-black/10 shrink-0">
                        {formData.bgStyle === 'custom' 
                          ? (formData.bgColor || '#EE3A43') 
                          : (BG_PRESETS.find(p => p.id === formData.bgStyle)?.name || 'Theme Red')}
                      </span>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isActiveToggle"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded cursor-pointer accent-red-600"
                    />
                    <label htmlFor="isActiveToggle" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                      Activate this section immediately on User Home Page
                    </label>
                  </div>
                </div>
              ) : (
                /* ── TAB 2: CATEGORY SECTION ABOVE PRODUCT SECTION ── */
                <div className="space-y-6">
                  {/* Selected Products Summary Bar */}
                  <div className="bg-red-50/70 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200/80 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-red-600 dark:text-red-400" />
                        <span className="text-xs font-bold text-red-950 dark:text-red-200 uppercase tracking-wider">
                          Selected Products for this Section ({formData.products.length})
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Select a category below, then click any product card to add or remove it from this showcase.
                      </p>
                    </div>

                    {formData.products.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1 hide-scrollbar">
                        {formData.products.map((p, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-red-200 dark:border-zinc-700 shrink-0 shadow-xs"
                          >
                            <span className="truncate max-w-[110px]">{toTitleCase(p.customTitle)}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleProduct({ _id: p.product, name: p.customTitle })}
                              className="text-zinc-400 hover:text-red-500 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── 1. CATEGORY SECTION (PLACED ABOVE PRODUCT SECTION) ── */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Grid size={16} className="text-[var(--accent-red,#EE3A43)]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                          Select Category
                        </h3>
                        <span className="text-xs text-zinc-500 font-normal">
                          (Click any category to view and choose its products)
                        </span>
                      </div>

                      {/* Category Search Filter */}
                      <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-2.5 top-2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Filter categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Category Cards Carousel / Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                      {filteredCategories.map((cat) => {
                        const isCatSelected = selectedCategory?._id === cat._id;
                        // Count how many products from this category are selected
                        const selectedCountFromThisCat = formData.products.filter(p => {
                          const matchingProd = categoryProducts.find(cp => cp._id === p.product);
                          return matchingProd && (matchingProd.categoryId?._id === cat._id || matchingProd.categoryId === cat._id);
                        }).length;

                        return (
                          <div
                            key={cat._id}
                            onClick={() => setSelectedCategory(cat)}
                            className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 relative ${
                              isCatSelected
                                ? 'bg-red-50/60 dark:bg-red-950/40 border-[var(--accent-red,#EE3A43)] shadow-sm'
                                : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                          >
                            {/* Category Icon / Image */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                              {cat.icon && cat.icon.startsWith('http') ? (
                                <img src={cat.icon} alt={cat.label} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={18} className="text-zinc-500 dark:text-zinc-300" />
                              )}
                            </div>

                            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate w-full">
                              {toTitleCase(cat.label || cat.name)}
                            </span>

                            {/* Badge if products from this category are selected */}
                            {selectedCountFromThisCat > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--accent-red,#EE3A43)] text-white shadow-xs">
                                {selectedCountFromThisCat}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── 2. PRODUCT SECTION (PLACED BELOW CATEGORY SECTION) ── */}
                  <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Package size={16} className="text-[var(--accent-red,#EE3A43)]" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                            Products in {selectedCategory ? `"${toTitleCase(selectedCategory.label || selectedCategory.name)}"` : 'Category'}
                          </h3>
                          <span className="text-xs text-zinc-500 font-normal">
                            ({filteredProducts.length} items available)
                          </span>
                        </div>

                        {/* SELECT ALL OPTION */}
                        {filteredProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                              areAllSelected
                                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-[var(--accent-red,#EE3A43)]'
                                : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                              areAllSelected 
                                ? 'bg-[var(--accent-red,#EE3A43)] border-[var(--accent-red,#EE3A43)] text-white' 
                                : 'border-zinc-400 dark:border-zinc-600 bg-transparent'
                            }`}>
                              {areAllSelected && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span>{areAllSelected ? 'Deselect All' : 'Select All'}</span>
                          </button>
                        )}
                      </div>

                      {/* Search products in this category */}
                      <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-2.5 top-2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search products in category..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Product Cards Grid */}
                    {isLoadingCategoryProducts ? (
                      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-zinc-500 font-medium">Fetching products for category...</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-400 italic">
                          No products found in this category.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.map((prod) => {
                          const isSelected = formData.products.some(p => p.product === prod._id);

                          return (
                            <div
                              key={prod._id}
                              onClick={() => handleToggleProduct(prod)}
                              className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none relative ${
                                isSelected
                                  ? 'bg-red-50/50 dark:bg-red-950/30 border-[var(--accent-red,#EE3A43)] shadow-sm'
                                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                              }`}
                            >
                              {/* Selection Checkmark Bubble */}
                              <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-[var(--accent-red,#EE3A43)] text-white shadow-xs' 
                                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400 border border-zinc-200 dark:border-zinc-600'
                              }`}>
                                {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                              </div>

                              <div>
                                {/* Product Image */}
                                <div className="w-full h-28 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-700 mb-2 relative">
                                  {prod.image ? (
                                    <img src={prod.image} alt={toTitleCase(prod.name)} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                                      No Image
                                    </div>
                                  )}

                                  {prod.badge && (
                                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 backdrop-blur-xs text-white">
                                      {toTitleCase(prod.badge)}
                                    </span>
                                  )}
                                </div>

                                {/* Veg Indicator & Title */}
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="w-3 h-3 rounded border-[1.5px] border-emerald-500 bg-emerald-950/60 flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  </div>
                                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {toTitleCase(prod.name)}
                                  </h4>
                                </div>

                                {prod.shortDescription && (
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
                                    {toTitleCase(prod.shortDescription)}
                                  </p>
                                )}
                              </div>

                              {/* Price & Selection Pill */}
                              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-700/60 mt-1">
                                <div>
                                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    ₹{prod.price}
                                  </span>
                                  {prod.originalPrice > prod.price && (
                                    <span className="text-[10px] text-zinc-400 line-through ml-1">
                                      ₹{prod.originalPrice}
                                    </span>
                                  )}
                                </div>

                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                                  isSelected 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                                }`}>
                                  {isSelected ? 'Selected' : 'Select'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-red,#EE3A43)] hover:bg-[#d92d35] text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {editingSection ? 'Save Changes' : 'Create Section'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
