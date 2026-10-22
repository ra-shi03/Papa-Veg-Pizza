import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2,
  Loader2,
  Plus,
  Edit,
  Upload,
  Eye,
  X,
  Search,
  ArrowUpDown,
  Layers,
  CheckCircle,
  XCircle,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient, { adminClient } from '@/services/api/axios';
import { uploadAPI } from '@/services/api';

const PRESET_BORDER_COLORS = [
  { label: 'Default Grey', value: '#E4E4E7' },
  { label: 'Red / Tomato', value: '#E53935' },
  { label: 'Amber / Cheddar', value: '#F59E0B' },
  { label: 'Emerald / Fresh', value: '#10B981' },
  { label: 'Royal Blue', value: '#3B82F6' },
  { label: 'Purple / Plum', value: '#8B5CF6' },
  { label: 'Hot Pink', value: '#EC4899' },
  { label: 'Dark Charcoal', value: '#27272A' },
];

export default function CategoriesManagement() {
  const [menus, setMenus] = useState([]);
  const [isMenusModalOpen, setIsMenusModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm] = useState({ id: '', label: '', badge: '', icon: '', borderColor: '#E4E4E7', type: 'Category', status: 'Active', sort: 0 });
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewCategory, setViewCategory] = useState(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
    badgedCategories: 0,
    withIconCategories: 0,
    addedThisMonth: 0,
  });
  
  const menuImageInputRef = useRef(null);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);

  useEffect(() => {
    fetchCategoryProducts();
    fetchStats();
  }, [sort]);

  const fetchStats = async () => {
    try {
      const response = await adminClient.get('/food/admin/category-products/stats');
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.warn('Failed to load category stats from API, calculating fallback:', err);
    }
  };

  const fetchCategoryProducts = async (currentSearch = search) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (sort) params.append('sort', sort);
      if (currentSearch) params.append('search', currentSearch);
      
      const response = await adminClient.get(`/food/admin/category-products?${params.toString()}`);
      if (response?.data?.data) {
        // Map _id to id for frontend compatibility
        const mapped = response.data.data.map(item => ({ ...item, id: item._id || item.id }));
        setMenus(mapped);
      }
    } catch (err) {
      console.error('Failed to load category products:', err);
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }
    setIsUploadingMenuImage(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setMenuForm(prev => ({ ...prev, icon: url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingMenuImage(false);
      if (menuImageInputRef.current) menuImageInputRef.current.value = '';
    }
  };

  const handleOpenMenuModal = (menu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({ 
        ...menu, 
        badge: menu.badge || '', 
        borderColor: menu.borderColor || '#E4E4E7',
        sort: menu.sort ?? 0 
      });
    } else {
      setEditingMenu(null);
      setMenuForm({ 
        id: '', 
        label: '', 
        badge: '', 
        icon: '', 
        borderColor: '#E4E4E7', 
        type: 'Category', 
        status: 'Active', 
        sort: 0 
      });
    }
    setIsMenusModalOpen(true);
  };

  const handleViewMenu = async (id) => {
    setIsViewModalOpen(true);
    setIsLoadingView(true);
    try {
      const res = await adminClient.get(`/food/admin/category-products/${id}`);
      if (res?.data?.data) {
        const item = res.data.data;
        setViewCategory({ ...item, id: item._id || item.id });
      }
    } catch (err) {
      toast.error('Failed to load category details');
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleSaveMenu = async () => {
    if (!menuForm.label) {
      toast.error('Please provide a label');
      return;
    }
    
    setIsSaving(true);
    try {
      let res;
      if (editingMenu) {
        res = await adminClient.patch(`/food/admin/category-products/${editingMenu.id}`, menuForm);
      } else {
        res = await adminClient.post('/food/admin/category-products', menuForm);
      }
      
      if (res?.data?.success) {
        toast.success(editingMenu ? 'Category updated!' : 'Category added!');
        try {
          localStorage.removeItem('pvp_categories');
          window.dispatchEvent(new Event('pvp_categories_changed'));
        } catch (_) {}
        setIsMenusModalOpen(false);
        fetchCategoryProducts();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await adminClient.delete(`/food/admin/category-products/${id}`);
      toast.success('Category deleted!');
      try {
        localStorage.removeItem('pvp_categories');
        window.dispatchEvent(new Event('pvp_categories_changed'));
      } catch (_) {}
      fetchCategoryProducts();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshingStats(true);
    try {
      await Promise.all([fetchCategoryProducts(search), fetchStats()]);
      toast.success('Refreshed categories and stats');
    } catch (err) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshingStats(false);
    }
  };

  const filteredMenus = menus.filter((menu) => {
    if (statusFilter === 'ACTIVE') return menu.status?.toLowerCase() === 'active';
    if (statusFilter === 'INACTIVE') return menu.status?.toLowerCase() === 'inactive';
    if (statusFilter === 'BADGED') return Boolean(menu.badge && menu.badge.trim() !== '');
    if (statusFilter === 'WITH_ICON') return Boolean(menu.icon && menu.icon.trim() !== '');
    return true;
  });

  const kpiCards = [
    {
      id: 'ALL',
      title: 'Total Categories',
      value: stats.totalCategories,
      subtitle: 'All items',
      icon: Layers,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40',
      activeBorder: 'ring-2 ring-orange-500 border-orange-500',
    },
    {
      id: 'ACTIVE',
      title: 'Active',
      value: stats.activeCategories,
      subtitle: `${stats.totalCategories > 0 ? Math.round((stats.activeCategories / stats.totalCategories) * 100) : 0}% active`,
      icon: CheckCircle,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
    },
    {
      id: 'INACTIVE',
      title: 'Inactive',
      value: stats.inactiveCategories,
      subtitle: `${stats.totalCategories > 0 ? Math.round((stats.inactiveCategories / stats.totalCategories) * 100) : 0}% inactive`,
      icon: XCircle,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40',
      activeBorder: 'ring-2 ring-rose-500 border-rose-500',
    },
    {
      id: 'BADGED',
      title: 'Badged / Promo',
      value: stats.badgedCategories,
      subtitle: 'Featured tags',
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
      activeBorder: 'ring-2 ring-amber-500 border-amber-500',
    },
    {
      id: 'WITH_ICON',
      title: 'With Media',
      value: stats.withIconCategories,
      subtitle: 'Images & icons',
      icon: ImageIcon,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40',
      activeBorder: 'ring-2 ring-sky-500 border-sky-500',
    },
    {
      id: 'MONTH',
      title: 'Added This Month',
      value: stats.addedThisMonth,
      subtitle: 'Current period',
      icon: Calendar,
      color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/40',
      activeBorder: '',
    },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Categories Directory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage the dynamic menus (categories) shown on the user app home page.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshingStats}
            title="Refresh categories and stats"
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors text-sm shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingStats ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => handleOpenMenuModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> ADD CATEGORY
          </button>
        </div>
      </div>

      {/* KPI Cards Grid with API Integration */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isSelected = statusFilter === card.id;
          const isClickable = card.id !== 'MONTH';

          return (
            <div
              key={card.title}
              onClick={() => {
                if (!isClickable) return;
                setStatusFilter(prev => (prev === card.id ? 'ALL' : card.id));
              }}
              role={isClickable ? 'button' : undefined}
              className={`relative bg-white dark:bg-zinc-900 rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
              } ${
                isSelected && card.id !== 'ALL'
                  ? card.activeBorder
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate pr-1">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {card.value}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                  <span>{card.subtitle}</span>
                  {isSelected && card.id !== 'ALL' && (
                    <span className="text-[10px] font-semibold text-primary uppercase">Filtered</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchCategoryProducts(search);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors"
            >
              <span>Clear Filter ({statusFilter})</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ArrowUpDown className="w-4 h-4 text-zinc-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow bg-transparent"
          >
            <option value="">Sort By...</option>
            <option value="sort_asc">Custom Sort Order (Asc)</option>
            <option value="sort_desc">Custom Sort Order (Desc)</option>
            <option value="date_asc">Oldest First</option>
            <option value="date_desc">Newest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
            <p className="text-zinc-500 mt-2">Loading categories...</p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              {statusFilter !== 'ALL'
                ? `No categories found for "${statusFilter}" filter.`
                : 'No categories added yet.'}
            </p>
            {statusFilter !== 'ALL' ? (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="mt-3 text-[var(--primary)] hover:underline text-sm font-semibold"
              >
                Clear filter
              </button>
            ) : (
              <button
                onClick={() => handleOpenMenuModal()}
                className="mt-4 text-[var(--primary)] hover:underline text-sm font-semibold"
              >
                Add your first category
              </button>
            )}
          </div>
        ) : (
          filteredMenus.map((menu) => (
            <div key={menu.id} className="relative group border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm flex flex-col p-5 hover:shadow-md transition-all">
              {menu.badge && (
                <span className="absolute top-2.5 left-2.5 z-10 bg-[#E53935] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight shadow-xs">
                  {menu.badge}
                </span>
              )}
              <span className="absolute top-2.5 right-2.5 z-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs">
                Sort: {menu.sort ?? 0}
              </span>
              <div className="flex flex-col items-center text-center">
                <div 
                  className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full w-20 h-20 mb-3 overflow-hidden shrink-0 shadow-sm border-[3px] transition-all"
                  style={{ borderColor: menu.borderColor || '#E4E4E7' }}
                >
                  {menu.icon && (menu.icon.startsWith('http') || menu.icon.startsWith('data:')) ? (
                    <img src={menu.icon} alt={menu.label} className="w-full h-full object-cover p-2" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-[var(--primary)]">{menu.icon}</span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{menu.label}</h3>
                <div className="flex items-center gap-1.5 mt-1 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full border border-zinc-200/80 dark:border-zinc-700/60">
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" 
                    style={{ backgroundColor: menu.borderColor || '#E4E4E7' }} 
                  />
                  <span className="text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-300 uppercase">
                    {menu.borderColor || '#E4E4E7'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate w-full px-2" title={menu.icon}>{menu.icon}</p>
              </div>
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-20">
                <button onClick={() => handleViewMenu(menu.id)} className="p-2.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 shadow-sm transition-transform hover:scale-110">
                  <Eye className="w-5 h-5" />
                </button>
                <button onClick={() => handleOpenMenuModal(menu)} className="p-2.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 shadow-sm transition-transform hover:scale-110">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteMenu(menu.id)} className="p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm transition-transform hover:scale-110">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Menus Modal */}
      {isMenusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-5">
              {editingMenu ? 'Edit Category' : 'Add Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Label</label>
                <input
                  type="text"
                  value={menuForm.label}
                  onChange={e => setMenuForm({ ...menuForm, label: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                  placeholder="e.g. Pizza"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Badge / Tag (e.g. NEW, NEW FLAVOURS, UPTO ₹1000 OFF)</label>
                <input
                  type="text"
                  value={menuForm.badge || ''}
                  onChange={e => setMenuForm({ ...menuForm, badge: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                  placeholder="e.g. NEW, NEW FLAVOURS, UPTO ₹1000 OFF"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Image / Icon URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={menuForm.icon}
                    onChange={e => setMenuForm({ ...menuForm, icon: e.target.value })}
                    className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                    placeholder="https://... or Material Icon Name"
                  />
                  <input
                    type="file"
                    ref={menuImageInputRef}
                    onChange={handleMenuImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => menuImageInputRef.current?.click()}
                    disabled={isUploadingMenuImage}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
                  >
                    {isUploadingMenuImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </button>
                </div>
              </div>

              {/* Border Color (Dynamic per category) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Border Color (Per Category)
                  </label>
                  <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase">
                    {menuForm.borderColor || '#E4E4E7'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-10 h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden relative shrink-0 cursor-pointer shadow-xs"
                    style={{ backgroundColor: menuForm.borderColor || '#E4E4E7' }}
                  >
                    <input 
                      type="color"
                      value={menuForm.borderColor || '#E4E4E7'}
                      onChange={e => setMenuForm({ ...menuForm, borderColor: e.target.value })}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      title="Choose custom color"
                    />
                  </div>
                  <input
                    type="text"
                    value={menuForm.borderColor || '#E4E4E7'}
                    onChange={e => setMenuForm({ ...menuForm, borderColor: e.target.value })}
                    className="flex-1 px-3 py-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                    placeholder="#E4E4E7"
                  />
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, borderColor: '#E4E4E7' })}
                    className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Preset color swatches */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-zinc-400 mr-1 font-medium">Presets:</span>
                  {PRESET_BORDER_COLORS.map(c => {
                    const isSelected = (menuForm.borderColor || '#E4E4E7').toLowerCase() === c.value.toLowerCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setMenuForm({ ...menuForm, borderColor: c.value })}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-2 scale-110 shadow-xs' : 'border-zinc-300 dark:border-zinc-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Circle */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-full border-2 shadow-sm flex items-center justify-center overflow-hidden bg-zinc-100 shrink-0 transition-all relative"
                  style={{ borderColor: menuForm.borderColor || '#E4E4E7' }}
                >
                  {menuForm.icon && (menuForm.icon.startsWith('http') || menuForm.icon.startsWith('data:')) ? (
                    <img src={menuForm.icon} alt={menuForm.label} className="w-full h-full object-cover scale-[1.15]" />
                  ) : (
                    <span className="material-symbols-outlined text-zinc-400 text-xl">
                      {menuForm.icon || 'fastfood'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Category Live Border Preview</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    Circle border will render in {menuForm.borderColor || '#E4E4E7'} on user app.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  value={menuForm.status || 'Active'}
                  onChange={e => setMenuForm({ ...menuForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Sort Order (Optional)</label>
                <input
                  type="number"
                  value={menuForm.sort ?? 0}
                  onChange={e => setMenuForm({ ...menuForm, sort: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsMenusModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMenu}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Category Details
              </h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {isLoadingView ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
                <p className="text-zinc-500 mt-2">Loading details...</p>
              </div>
            ) : viewCategory ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div 
                    className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full w-24 h-24 mb-4 overflow-hidden shrink-0 shadow-md border-4 transition-all"
                    style={{ borderColor: viewCategory.borderColor || '#E4E4E7' }}
                  >
                    {viewCategory.icon && (viewCategory.icon.startsWith('http') || viewCategory.icon.startsWith('data:')) ? (
                      <img src={viewCategory.icon} alt={viewCategory.label || viewCategory.name} className="w-full h-full object-cover p-2" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-[var(--primary)]">{viewCategory.icon}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">{viewCategory.label || viewCategory.name}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 break-all px-4 text-center">{viewCategory.icon}</p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewCategory.id}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700 pb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Border Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-black/15 shadow-xs" style={{ backgroundColor: viewCategory.borderColor || '#E4E4E7' }} />
                      <span className="text-sm font-medium font-mono text-zinc-900 dark:text-zinc-100 uppercase">{viewCategory.borderColor || '#E4E4E7'}</span>
                    </div>
                  </div>
                  {viewCategory.badge && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Badge / Tag</span>
                      <span className="text-xs font-black uppercase text-white bg-[#E53935] px-2 py-0.5 rounded-full">{viewCategory.badge}</span>
                    </div>
                  )}
                  {viewCategory.description && (
                    <div className="flex flex-col border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewCategory.description}</span>
                    </div>
                  )}
                  {viewCategory.type && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewCategory.type}</span>
                    </div>
                  )}
                  {viewCategory.status && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
                      <span className={`text-sm font-bold ${viewCategory.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>{viewCategory.status}</span>
                    </div>
                  )}
                  {viewCategory.sort !== undefined && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sort Order</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewCategory.sort}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500">
                Could not load details.
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
