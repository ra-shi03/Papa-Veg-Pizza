import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Layers, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Search, 
  Check, 
  X,
  Upload,
  UploadCloud,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '@/services/api/axios';
import apiClient from '@/services/api/axios';
import { uploadAPI } from '@/services/api';

export default function SearchConfig() {
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'searchBy' | 'newLaunches' | 'settings'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSyncingAddons, setIsSyncingAddons] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Search Config State
  const [popularSearches, setPopularSearches] = useState([]);
  const [searchByTabs, setSearchByTabs] = useState([]);
  const [newLaunches, setNewLaunches] = useState([]);
  const [toggles, setToggles] = useState({
    isPopularEnabled: true,
    isSearchByEnabled: true,
    isRecentlyViewedEnabled: true,
    isNewLaunchesEnabled: true
  });

  // Available Addon Types & Addons from DB for one-click import
  const [availableAddonTypes, setAvailableAddonTypes] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);

  // Modals / Editors
  const [editingPopular, setEditingPopular] = useState(null); // null or { _id, text, sortOrder, isActive, searchQuery }
  const [editingLaunch, setEditingLaunch] = useState(null); // null or launch obj
  const [editingTab, setEditingTab] = useState(null); // null or tab obj
  const [editingItemInTab, setEditingItemInTab] = useState(null); // { tabIndex, item, itemIndex }

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      let res;
      const t = Date.now();
      try {
        res = await adminClient.get(`/settings/search-config/admin?_t=${t}`);
      } catch {
        res = await apiClient.get(`/settings/search-config/public?_t=${t}`);
      }

      const data = res?.data?.data;
      const cfg = data?.config || data;

      if (cfg) {
        if (Array.isArray(cfg.popularSearches)) {
          setPopularSearches([...cfg.popularSearches].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        }

        // Check if stored tabs still contain initial mock placeholder items
        const isMockTabs = (cfg.searchByTabs || []).some(t => 
          (t.items || []).some(i => i.title === 'Double Cheeseburst' || i.title === 'Cheese Volcano Crust')
        );

        if (Array.isArray(data?.realSearchByTabs) && data.realSearchByTabs.length > 0 && isMockTabs) {
          setSearchByTabs([...data.realSearchByTabs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        } else if (Array.isArray(cfg.searchByTabs) && cfg.searchByTabs.length > 0 && !isMockTabs) {
          setSearchByTabs([...cfg.searchByTabs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        } else {
          // Auto fetch real data of crust, toppings directly from API
          await handleAutoSyncFromAddons(false);
        }

        if (Array.isArray(cfg.newLaunches) && cfg.newLaunches.length > 0) {
          setNewLaunches([...cfg.newLaunches].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        } else {
          setNewLaunches([
            {
              _id: 'launch-1',
              title: 'Paneer Maxxx',
              image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
              searchQuery: 'paneer',
              sortOrder: 1,
              isActive: true
            },
            {
              _id: 'launch-2',
              title: 'Four Cheese Sourdough Pizza',
              image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
              searchQuery: 'cheese',
              sortOrder: 2,
              isActive: true
            },
            {
              _id: 'launch-3',
              title: 'Big Pizza Bonanza',
              image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
              searchQuery: 'pizza',
              sortOrder: 3,
              isActive: true
            }
          ]);
        }
        setToggles({
          isPopularEnabled: cfg.isPopularEnabled !== false,
          isSearchByEnabled: cfg.isSearchByEnabled !== false,
          isRecentlyViewedEnabled: cfg.isRecentlyViewedEnabled !== false,
          isNewLaunchesEnabled: cfg.isNewLaunchesEnabled !== false
        });
      }

      if (data?.availableAddonTypes) setAvailableAddonTypes(data.availableAddonTypes);
      if (data?.availableAddons) setAvailableAddons(data.availableAddons);
    } catch (err) {
      console.warn('Failed to load search config from API, loading defaults', err);
      // Fallback defaults
      setPopularSearches([
        { _id: '1', text: 'Maxxx', sortOrder: 1, isActive: true, searchQuery: 'Maxxx' },
        { _id: '2', text: 'more paneer', sortOrder: 2, isActive: true, searchQuery: 'paneer' },
        { _id: '3', text: 'more chicken', sortOrder: 3, isActive: true, searchQuery: 'chicken' },
        { _id: '4', text: 'Big Big Pizza', sortOrder: 4, isActive: true, searchQuery: 'Big Big Pizza' },
        { _id: '5', text: 'Ultimate Pizza Feast', sortOrder: 5, isActive: true, searchQuery: 'Feast' }
      ]);
      setNewLaunches([
        {
          _id: 'launch-1',
          title: 'Paneer Maxxx',
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
          searchQuery: 'paneer',
          sortOrder: 1,
          isActive: true
        },
        {
          _id: 'launch-2',
          title: 'Four Cheese Sourdough Pizza',
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
          searchQuery: 'cheese',
          sortOrder: 2,
          isActive: true
        },
        {
          _id: 'launch-3',
          title: 'Big Pizza Bonanza',
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
          searchQuery: 'pizza',
          sortOrder: 3,
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const persistFullConfig = async (overrides = {}) => {
    setSaving(true);
    try {
      const payload = {
        popularSearches: overrides.popularSearches ?? popularSearches,
        searchByTabs: overrides.searchByTabs ?? searchByTabs,
        newLaunches: overrides.newLaunches ?? newLaunches,
        ...toggles,
        ...(overrides.toggles ?? {})
      };

      let res;
      try {
        res = await adminClient.put('/settings/search-config', payload);
      } catch {
        res = await apiClient.put('/settings/search-config', payload);
      }

      const savedData = res?.data?.data || payload;

      // Sync to localStorage for immediate reactive frontend update
      localStorage.setItem('pvp_search_config', JSON.stringify(savedData));
      window.dispatchEvent(new Event('pvp_search_config_changed'));

      if (Array.isArray(savedData.newLaunches) && savedData.newLaunches.length > 0) {
        setNewLaunches([...savedData.newLaunches].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      }
      if (Array.isArray(savedData.popularSearches) && savedData.popularSearches.length > 0) {
        setPopularSearches([...savedData.popularSearches].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      }

      toast.success('Changes saved & published to User App!');
      return true;
    } catch (err) {
      toast.error('Failed to save search configuration: ' + (err?.response?.data?.message || err.message));
      console.error(err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    await persistFullConfig();
  };

  // --- POPULAR SEARCHES CONTROLS ---
  const handleAddPopular = () => {
    const nextOrder = popularSearches.length > 0
      ? Math.max(...popularSearches.map(p => p.sortOrder || 0)) + 1
      : 1;
    setEditingPopular({
      _id: `temp-${Date.now()}`,
      text: '',
      sortOrder: nextOrder,
      isActive: true,
      searchQuery: ''
    });
  };

  const handleSavePopularItem = () => {
    if (!editingPopular.text.trim()) {
      toast.error('Tag text is required');
      return;
    }

    const itemToSave = {
      ...editingPopular,
      text: editingPopular.text.trim(),
      searchQuery: (editingPopular.searchQuery && editingPopular.searchQuery.trim()) 
        ? editingPopular.searchQuery.trim() 
        : editingPopular.text.trim(),
      sortOrder: Number(editingPopular.sortOrder) || 1
    };

    const existingIdx = popularSearches.findIndex(p => p._id === itemToSave._id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...popularSearches];
      updated[existingIdx] = itemToSave;
    } else {
      updated = [...popularSearches, itemToSave];
    }
    updated.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    setPopularSearches(updated);
    setEditingPopular(null);
    persistFullConfig({ popularSearches: updated });
  };

  const handleDeletePopular = (id) => {
    const updated = popularSearches.filter(p => p._id !== id);
    setPopularSearches(updated);
    persistFullConfig({ popularSearches: updated });
    toast.success('Tag removed');
  };

  const handleTogglePopularActive = (id) => {
    const updated = popularSearches.map(p => p._id === id ? { ...p, isActive: !p.isActive } : p);
    setPopularSearches(updated);
    persistFullConfig({ popularSearches: updated });
  };

  const handleMovePopular = (index, direction) => {
    const newItems = [...popularSearches];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap items & re-index sortOrder
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    newItems.forEach((item, idx) => {
      item.sortOrder = idx + 1;
    });

    setPopularSearches(newItems);
    persistFullConfig({ popularSearches: newItems });
  };

  // --- SEARCH BY TABS CONTROLS ---
  const handleAddTab = () => {
    const nextOrder = searchByTabs.length > 0 
      ? Math.max(...searchByTabs.map(t => t.sortOrder || 0)) + 1 
      : 1;
    setEditingTab({
      _id: `tab-${Date.now()}`,
      name: '',
      key: '',
      sortOrder: nextOrder,
      isActive: true,
      items: []
    });
  };

  const handleSaveTab = () => {
    if (!editingTab.name.trim()) {
      toast.error('Tab name is required');
      return;
    }

    const tabToSave = {
      ...editingTab,
      name: editingTab.name.trim(),
      key: editingTab.key ? editingTab.key.trim().toLowerCase() : editingTab.name.trim().toLowerCase(),
      sortOrder: Number(editingTab.sortOrder) || 1
    };

    const existingIdx = searchByTabs.findIndex(t => t._id === tabToSave._id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...searchByTabs];
      updated[existingIdx] = tabToSave;
    } else {
      updated = [...searchByTabs, tabToSave];
    }
    updated.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    setSearchByTabs(updated);
    setEditingTab(null);
    persistFullConfig({ searchByTabs: updated });
  };

  const handleDeleteTab = (tabId) => {
    const updated = searchByTabs.filter(t => t._id !== tabId);
    setSearchByTabs(updated);
    persistFullConfig({ searchByTabs: updated });
    toast.success('Tab removed');
  };

  // Helper to map realistic ingredient food thumbnails if addon doesn't have an image
  const getAddonThumbnail = (name, type, existingImage) => {
    if (existingImage && existingImage.trim()) return existingImage.trim();
    const n = (name || '').toLowerCase();
    const t = (type || '').toLowerCase();

    if (n.includes('hand tossed') || t.includes('crust')) {
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('paneer')) {
      return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('capsicum') || n.includes('onion') || n.includes('paprika')) {
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('corn')) {
      return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('mushroom')) {
      return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('olive') || n.includes('jalapeno')) {
      return 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('cheese') || t.includes('cheese')) {
      return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('dip') || n.includes('dip') || t.includes('sauce')) {
      return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
  };

  // Fetch real data of Crusts, Toppings & Addons directly through API
  const handleAutoSyncFromAddons = async (showNotification = true) => {
    setIsSyncingAddons(true);
    try {
      // 1. First attempt: call backend sync endpoint
      try {
        const syncRes = await adminClient.post('/settings/search-config/sync-addons');
        const syncData = syncRes?.data?.data;
        if (Array.isArray(syncData) && syncData.length > 0) {
          setSearchByTabs(syncData);
          if (showNotification) {
            toast.success(`Fetched ${syncData.length} tabs of real Crusts & Toppings directly from database!`);
          }
          return;
        }
      } catch (_) {}

      // 2. Direct API call to fetch live Addons & Addon Types
      let [addonsRes, typesRes] = await Promise.all([
        apiClient.get('/food/admin/addons/public').catch(() => null),
        apiClient.get('/food/admin/addon-types/public').catch(() => null)
      ]);

      const addons = addonsRes?.data?.data || availableAddons || [];
      const types = typesRes?.data?.data || availableAddonTypes || [];

      if (!Array.isArray(addons) || addons.length === 0) {
        if (showNotification) toast.info('No addons found in database.');
        return;
      }

      // Group real addons into tabs by their real type
      const typeMap = {};
      types.forEach(t => {
        const slug = (t.slug || t.name).toLowerCase();
        let displayName = t.name;
        if (!displayName.toLowerCase().endsWith('s')) displayName = `${displayName}s`;
        typeMap[slug] = {
          name: displayName,
          slug: slug,
          sortOrder: t.sortOrder || 1,
          items: []
        };
      });

      addons.forEach(a => {
        if (a.status === 'Inactive') return;
        const rawType = (a.type || 'Other').trim().toLowerCase();
        let targetKey = rawType;
        if (rawType.includes('crust')) targetKey = 'crust';
        else if (rawType.includes('topping')) targetKey = 'topping';
        else if (rawType.includes('dip')) targetKey = 'dip';
        else if (rawType.includes('cheese')) targetKey = 'cheese';

        if (!typeMap[targetKey]) {
          let displayName = a.type ? (a.type.charAt(0).toUpperCase() + a.type.slice(1)) : 'Other';
          if (!displayName.toLowerCase().endsWith('s')) displayName = `${displayName}s`;
          typeMap[targetKey] = {
            name: displayName,
            slug: targetKey,
            sortOrder: Object.keys(typeMap).length + 1,
            items: []
          };
        }

        typeMap[targetKey].items.push({
          title: a.name,
          image: getAddonThumbnail(a.name, a.type, a.image),
          query: a.name,
          sortOrder: typeMap[targetKey].items.length + 1,
          isActive: true
        });
      });

      const builtTabs = Object.values(typeMap)
        .filter(t => t.items.length > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((t, idx) => ({
          _id: `synced-${t.slug}-${Date.now()}`,
          name: t.name,
          key: t.slug,
          sortOrder: idx + 1,
          isActive: true,
          items: t.items
        }));

      if (builtTabs.length > 0) {
        setSearchByTabs(builtTabs);
        if (showNotification) {
          toast.success(`Fetched ${builtTabs.length} tabs of real Crusts & Toppings directly through API!`);
        }
      }
    } catch (e) {
      if (showNotification) toast.error('Failed to fetch real addons through API');
    } finally {
      setIsSyncingAddons(false);
    }
  };

  // Sub-items inside a Tab
  const handleAddItemToTab = (tabIndex) => {
    setEditingItemInTab({
      tabIndex,
      itemIndex: -1,
      item: {
        title: '',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80',
        query: '',
        sortOrder: (searchByTabs[tabIndex]?.items?.length || 0) + 1,
        isActive: true
      }
    });
  };

  const handleSaveItemInTab = () => {
    if (!editingItemInTab?.item?.title.trim()) {
      toast.error('Item title is required');
      return;
    }

    const { tabIndex, itemIndex, item } = editingItemInTab;
    const tab = searchByTabs[tabIndex];
    if (!tab) return;

    const newItems = [...(tab.items || [])];
    const cleaned = {
      ...item,
      title: item.title.trim(),
      query: (item.query && item.query.trim()) ? item.query.trim() : item.title.trim(),
      sortOrder: Number(item.sortOrder) || 1
    };

    if (itemIndex >= 0) {
      newItems[itemIndex] = cleaned;
    } else {
      newItems.push(cleaned);
    }

    newItems.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const updatedTabs = [...searchByTabs];
    updatedTabs[tabIndex] = { ...tab, items: newItems };
    setSearchByTabs(updatedTabs);
    setEditingItemInTab(null);
    persistFullConfig({ searchByTabs: updatedTabs });
  };

  const handleDeleteItemInTab = (tabIndex, itemIndex) => {
    const tab = searchByTabs[tabIndex];
    if (tab && tab.items) {
      const items = tab.items.filter((_, idx) => idx !== itemIndex);
      const updatedTabs = [...searchByTabs];
      updatedTabs[tabIndex] = { ...tab, items };
      setSearchByTabs(updatedTabs);
      persistFullConfig({ searchByTabs: updatedTabs });
    }
  };

  // --- NEW LAUNCHES CONTROLS ---
  const handleAddNewLaunch = () => {
    const nextOrder = newLaunches.length > 0 
      ? Math.max(...newLaunches.map(l => l.sortOrder || 0)) + 1 
      : 1;
    setEditingLaunch({
      _id: `launch-${Date.now()}`,
      title: '',
      subtitle: '',
      image: '',
      badge: '',
      searchQuery: '',
      link: '/user/menu',
      sortOrder: nextOrder,
      isActive: true
    });
  };

  const handleImageFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    // Quick local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingLaunch(prev => prev ? ({ ...prev, localPreview: e.target.result }) : null);
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);
    try {
      let uploadedUrl = null;
      try {
        const res = await uploadAPI.uploadMedia(file, { folder: 'search/new-launches' });
        uploadedUrl = res?.data?.data?.url || res?.data?.url;
      } catch (uploadErr) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'search/new-launches');
        const res = await adminClient.post('/uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrl = res?.data?.data?.url || res?.data?.url;
      }

      if (uploadedUrl) {
        setEditingLaunch(prev => prev ? ({ ...prev, image: uploadedUrl, localPreview: null }) : null);
        toast.success('Poster image uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      if (reader.result) {
        setEditingLaunch(prev => prev ? ({ ...prev, image: reader.result, localPreview: null }) : null);
        toast.info('Using local image preview');
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMoveLaunch = (index, direction) => {
    const newItems = [...newLaunches];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    newItems.forEach((item, idx) => {
      item.sortOrder = idx + 1;
    });

    setNewLaunches(newItems);
    persistFullConfig({ newLaunches: newItems });
  };

  const handleSaveLaunch = async () => {
    const imageToSave = (editingLaunch.image && editingLaunch.image.trim()) || editingLaunch.localPreview;
    if (!imageToSave) {
      toast.error('Please upload a poster image');
      return;
    }

    const cleaned = {
      ...editingLaunch,
      title: editingLaunch.title?.trim() || '',
      subtitle: editingLaunch.subtitle?.trim() || '',
      image: imageToSave,
      badge: editingLaunch.badge?.trim() || '',
      searchQuery: editingLaunch.searchQuery?.trim() || '',
      sortOrder: Number(editingLaunch.sortOrder) || 1
    };
    delete cleaned.localPreview;

    const existingIdx = newLaunches.findIndex(l => String(l._id) === String(cleaned._id));
    let updated;
    if (existingIdx >= 0) {
      updated = [...newLaunches];
      updated[existingIdx] = cleaned;
    } else {
      updated = [...newLaunches, cleaned];
    }
    updated.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    setNewLaunches(updated);
    setEditingLaunch(null);
    await persistFullConfig({ newLaunches: updated });
  };

  const handleDeleteLaunch = (id) => {
    const updated = newLaunches.filter(l => String(l._id) !== String(id));
    setNewLaunches(updated);
    persistFullConfig({ newLaunches: updated });
    toast.success('Launch poster removed');
  };

  const handleToggleLaunchActive = (id) => {
    const updated = newLaunches.map(l => String(l._id) === String(id) ? { ...l, isActive: !l.isActive } : l);
    setNewLaunches(updated);
    persistFullConfig({ newLaunches: updated });
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Search className="w-6 h-6 text-[#EE3A43]" />
            Search Overlay & Discovery Configuration
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Customize the dynamic full-screen Search overlay: Popular tags with sorting, Search By tabs, and Our New Launches banners.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold rounded-xl shadow-sm text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('popular')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'popular'
              ? 'bg-[#EE3A43] text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Popular Searches ({popularSearches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('searchBy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'searchBy'
              ? 'bg-[#EE3A43] text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Search By Tabs ({searchByTabs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('newLaunches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'newLaunches'
              ? 'bg-[#EE3A43] text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Our New Launches ({newLaunches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#EE3A43] text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Visibility Toggles</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: POPULAR SEARCHES (With Sorting & Option to show/hide) */}
      {/* ============================================================== */}
      {activeTab === 'popular' && (
        <div className="space-y-6">
          {/* Info Banner & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#EE3A43]" />
                Popular Trending Tags Management
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Manage which tags appear under "POPULAR" in search overlay. Change the sorting order and toggle active status.
              </p>
            </div>

            <button
              onClick={handleAddPopular}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Popular Tag</span>
            </button>
          </div>

          {/* Live Visual Preview matching user screenshot */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase block mb-3">
              LIVE APP PREVIEW • "POPULAR" SECTION
            </span>
            <div className="flex flex-wrap gap-2.5">
              {popularSearches
                .filter(p => p.isActive)
                .map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-medium shadow-xs"
                  >
                    <span className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400">
                      ↗
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))}
              {popularSearches.filter(p => p.isActive).length === 0 && (
                <p className="text-xs text-zinc-400 italic">No active popular tags.</p>
              )}
            </div>
          </div>

          {/* Tags List Table / Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Configured Tags ({popularSearches.length})
              </span>
              <span className="text-xs text-zinc-400">Use arrow buttons to adjust priority & sort order</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {popularSearches.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    item.isActive ? 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40' : 'bg-zinc-50/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Sort Order Badge */}
                    <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0">
                      #{item.sortOrder || idx + 1}
                    </span>

                    {/* Up/Down buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMovePopular(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMovePopular(idx, 'down')}
                        disabled={idx === popularSearches.length - 1}
                        title="Move Down"
                        className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Tag Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">
                          {item.text}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isActive 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                            : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {item.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Target search query: <span className="font-mono text-zinc-600 dark:text-zinc-300">{item.searchQuery || item.text}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleTogglePopularActive(item._id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        item.isActive
                          ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {item.isActive ? 'Hide' : 'Show'}
                    </button>

                    <button
                      onClick={() => setEditingPopular({ ...item })}
                      className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                      title="Edit tag"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeletePopular(item._id)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                      title="Delete tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {popularSearches.length === 0 && (
                <div className="py-12 text-center text-zinc-400 text-sm">
                  No popular tags configured. Click "Add Popular Tag" to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SEARCH BY TABS (Crusts, Toppings, Flavours, Sub-pills) */}
      {/* ============================================================== */}
      {activeTab === 'searchBy' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#EE3A43]" />
                  "SEARCH BY" Tabs & Sub-Pills Configuration
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Real Addons API
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real Crusts, Toppings & Addons loaded dynamically from your database through the API.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleAutoSyncFromAddons(true)}
                disabled={isSyncingAddons}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                title="Fetch real crusts, toppings and addons through API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAddons ? 'animate-spin' : ''}`} />
                <span>{isSyncingAddons ? 'Fetching Addons...' : 'Fetch Real Addons via API'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddTab}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tab</span>
              </button>
            </div>
          </div>

          {/* Tabs Accordion / List */}
          <div className="space-y-4">
            {searchByTabs.map((tab, tabIdx) => (
              <div
                key={tab._id || tabIdx}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs"
              >
                {/* Tab Header */}
                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                      #{tab.sortOrder || tabIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                        {tab.name}
                        <span className="text-xs text-zinc-400 font-normal">
                          ({tab.items?.length || 0} sub-items)
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono">key: {tab.key}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddItemToTab(tabIdx)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-semibold hover:border-zinc-400 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Sub-Pill</span>
                    </button>

                    <button
                      onClick={() => setEditingTab({ ...tab })}
                      className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                      title="Edit Tab"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteTab(tab._id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                      title="Delete Tab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-Pills Container Preview (Light Blue Bubble matching screenshot) */}
                <div className="p-4">
                  <div className="bg-[#EFF6FF] dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                        Bubble Preview for "{tab.name}"
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(tab.items || []).map((subItem, itemIdx) => (
                        <div
                          key={subItem._id || itemIdx}
                          className="group relative inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xs"
                        >
                          {subItem.image && (
                            <img
                              src={subItem.image}
                              alt={subItem.title}
                              className="w-5 h-5 rounded-md object-cover bg-zinc-100"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {subItem.title}
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            <button
                              onClick={() => setEditingItemInTab({ tabIndex: tabIdx, itemIndex: itemIdx, item: { ...subItem } })}
                              className="p-0.5 text-zinc-400 hover:text-blue-600 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteItemInTab(tabIdx, itemIdx)}
                              className="p-0.5 text-zinc-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!tab.items || tab.items.length === 0) && (
                        <p className="text-xs text-blue-600/70 italic">
                          No sub-pills added to this tab yet. Click "+ Add Sub-Pill" above.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {searchByTabs.length === 0 && (
              <div className="py-12 text-center text-zinc-400 text-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                No tabs configured. Click "Sync from Addons" or "Add Tab" to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: OUR NEW LAUNCHES (Pure Poster Artwork - No Content) */}
      {/* ============================================================== */}
      {activeTab === 'newLaunches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EE3A43]" />
                "Our New Launches" Posters
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Upload promotional poster images for the search discovery carousel. Only the image is shown.
              </p>
            </div>

            <button
              onClick={handleAddNewLaunch}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Poster</span>
            </button>
          </div>

          {/* Cards Grid: Pure Images Only, No Text Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {newLaunches.map((item, idx) => (
              <div
                key={item._id || idx}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs flex flex-col group transition-all ${
                  item.isActive ? '' : 'opacity-60'
                }`}
              >
                {/* Pure Poster Image Container */}
                <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={item.image}
                    alt={`New Launch Poster ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Top Left: Sort Order */}
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-xs">
                    #{item.sortOrder || idx + 1}
                  </div>

                  {/* Top Right: Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-md ${
                      item.isActive 
                        ? 'bg-emerald-500/90 text-white' 
                        : 'bg-zinc-800/90 text-zinc-300'
                    }`}>
                      {item.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Minimal Action Footer: No Text Content */}
                <div className="p-3 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800">
                  {/* Reorder Up/Down */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleMoveLaunch(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveLaunch(idx, 'down')}
                      disabled={idx === newLaunches.length - 1}
                      title="Move Down"
                      className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleLaunchActive(item._id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        item.isActive
                          ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {item.isActive ? 'Hide' : 'Show'}
                    </button>

                    <button
                      onClick={() => setEditingLaunch({ ...item })}
                      className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                      title="Change / Upload Image"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLaunch(item._id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                      title="Delete Poster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {newLaunches.length === 0 && (
            <div className="py-16 text-center text-zinc-400 text-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-1" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">No launch posters uploaded yet.</p>
              <button
                onClick={handleAddNewLaunch}
                className="mt-2 text-xs font-bold px-4 py-2 bg-[#EE3A43] hover:bg-[#d92d36] text-white rounded-xl cursor-pointer"
              >
                Upload First Poster
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: VISIBILITY TOGGLES */}
      {/* ============================================================== */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs max-w-2xl space-y-5">
          <h3 className="font-bold text-base text-zinc-900 dark:text-white">
            Search Overlay Section Toggles
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control which sections are displayed to users when they open the search overlay.
          </p>

          <div className="space-y-4 pt-2">
            {[
              { key: 'isPopularEnabled', label: 'POPULAR Tags Section', desc: 'Shows trending pill tags with diagonal trending arrows.' },
              { key: 'isSearchByEnabled', label: 'SEARCH BY Section', desc: 'Shows Crusts, Toppings & Flavours tabs with visual sub-pills.' },
              { key: 'isRecentlyViewedEnabled', label: 'Recently Viewed by You Section', desc: 'Shows horizontal pizza cards that the user recently inspected.' },
              { key: 'isNewLaunchesEnabled', label: 'Our New Launches Section', desc: 'Shows horizontal poster banners of exciting new menu launches.' }
            ].map(item => (
              <div key={item.key} className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={toggles[item.key]}
                      onChange={(e) => {
                        const updated = { ...toggles, [item.key]: e.target.checked };
                        setToggles(updated);
                        persistFullConfig({ toggles: updated });
                      }}
                      className="sr-only peer"
                    />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EE3A43]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT POPULAR TAG */}
      {/* ============================================================== */}
      {editingPopular && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
              {editingPopular._id && !editingPopular._id.startsWith('temp-') ? 'Edit Popular Tag' : 'Add Popular Tag'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tag Text (Displayed on Pill) *
                </label>
                <input
                  type="text"
                  value={editingPopular.text}
                  onChange={(e) => setEditingPopular({ ...editingPopular, text: e.target.value })}
                  placeholder="e.g. Maxxx, more paneer, Big Big Pizza"
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Search Query (When user clicks)
                </label>
                <input
                  type="text"
                  value={editingPopular.searchQuery}
                  onChange={(e) => setEditingPopular({ ...editingPopular, searchQuery: e.target.value })}
                  placeholder="Defaults to tag text if empty"
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    value={editingPopular.sortOrder}
                    onChange={(e) => setEditingPopular({ ...editingPopular, sortOrder: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingPopular.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingPopular({ ...editingPopular, isActive: e.target.value === 'active' })}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                  >
                    <option value="active">Active (Show)</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setEditingPopular(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePopularItem}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#EE3A43] hover:bg-[#d92d36] text-white shadow-xs cursor-pointer"
              >
                Apply Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT SEARCH BY TAB */}
      {/* ============================================================== */}
      {editingTab && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
              {editingTab._id && !editingTab._id.startsWith('tab-') ? 'Edit Tab' : 'Add Tab'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tab Name *
                </label>
                <input
                  type="text"
                  value={editingTab.name}
                  onChange={(e) => setEditingTab({ ...editingTab, name: e.target.value })}
                  placeholder="e.g. Crusts, Toppings, Flavours"
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    value={editingTab.sortOrder}
                    onChange={(e) => setEditingTab({ ...editingTab, sortOrder: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingTab.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingTab({ ...editingTab, isActive: e.target.value === 'active' })}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setEditingTab(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTab}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#EE3A43] hover:bg-[#d92d36] text-white shadow-xs cursor-pointer"
              >
                Save Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT SUB-PILL IN TAB */}
      {/* ============================================================== */}
      {editingItemInTab && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
              {editingItemInTab.itemIndex >= 0 ? 'Edit Sub-Pill' : 'Add Sub-Pill'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Title (e.g. Double Cheeseburst) *
                </label>
                <input
                  type="text"
                  value={editingItemInTab.item.title}
                  onChange={(e) => setEditingItemInTab({
                    ...editingItemInTab,
                    item: { ...editingItemInTab.item, title: e.target.value }
                  })}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Image Thumbnail
                </label>
                <div className="flex items-center gap-2">
                  {editingItemInTab.item.image && (
                    <img
                      src={editingItemInTab.item.image}
                      alt="Thumbnail preview"
                      className="w-10 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800"
                    />
                  )}
                  <input
                    type="text"
                    value={editingItemInTab.item.image}
                    onChange={(e) => setEditingItemInTab({
                      ...editingItemInTab,
                      item: { ...editingItemInTab.item, image: e.target.value }
                    })}
                    placeholder="https://... or upload"
                    className="flex-1 h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                  />
                  <label className="h-10 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                    <Upload size={14} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadAPI.uploadMedia(file, { folder: 'search/tabs' });
                          const url = res?.data?.data?.url || res?.data?.url;
                          if (url) {
                            setEditingItemInTab(prev => ({
                              ...prev,
                              item: { ...prev.item, image: url }
                            }));
                            toast.success('Thumbnail uploaded successfully!');
                          }
                        } catch (err) {
                          toast.error('Failed to upload thumbnail');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Search Query on Click
                </label>
                <input
                  type="text"
                  value={editingItemInTab.item.query}
                  onChange={(e) => setEditingItemInTab({
                    ...editingItemInTab,
                    item: { ...editingItemInTab.item, query: e.target.value }
                  })}
                  placeholder="Defaults to title if empty"
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setEditingItemInTab(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItemInTab}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#EE3A43] hover:bg-[#d92d36] text-white shadow-xs cursor-pointer"
              >
                Apply Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: UPLOAD / EDIT NEW LAUNCH POSTER (Image Upload Only) */}
      {/* ============================================================== */}
      {editingLaunch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#EE3A43]" />
                {editingLaunch._id && !editingLaunch._id.startsWith('launch-') ? 'Edit Launch Poster' : 'Upload Launch Poster'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingLaunch(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              id="new-launch-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImageFileUpload(e.target.files[0]);
                }
              }}
              disabled={isUploadingImage}
            />

            <div className="space-y-4">
              {/* Image Preview & Upload Dropzone */}
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                  Poster Image (Artwork) * <span className="text-[11px] text-zinc-400 font-normal ml-1">(Aspect Ratio 4:5 — e.g. 800 × 1000 px or 1080 × 1350 px)</span>
                </label>

                {editingLaunch.image || editingLaunch.localPreview ? (
                  <div className="space-y-3">
                    {/* Image Preview Container */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleImageFileUpload(f);
                      }}
                      className={`relative aspect-[4/5] max-h-72 mx-auto rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group shadow-sm bg-zinc-100 dark:bg-zinc-800 ${
                        isDragging 
                          ? 'border-[#EE3A43] ring-4 ring-rose-100 dark:ring-rose-950/50 scale-[1.02]' 
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                      title="Click or drag to change image"
                    >
                      <img
                        src={editingLaunch.localPreview || editingLaunch.image}
                        alt="Uploaded poster preview"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white p-4 text-center">
                        <UploadCloud className="w-8 h-8 text-white" />
                        <span className="text-xs font-bold">Click or drop image to replace</span>
                      </div>

                      {/* Loading state */}
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white z-20">
                          <RefreshCw className="w-7 h-7 animate-spin text-[#EE3A43]" />
                          <span className="text-xs font-bold">Uploading image to server...</span>
                        </div>
                      )}
                    </div>

                    {/* Always visible Upload & Remove Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex-1 py-2.5 px-4 bg-[#EE3A43] hover:bg-[#d92d36] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>Upload / Change Image</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingLaunch(prev => ({ ...prev, image: '', localPreview: null }))}
                        disabled={isUploadingImage}
                        className="py-2.5 px-3 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/30 text-zinc-700 hover:text-rose-600 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Full Upload Dropzone when empty */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleImageFileUpload(f);
                    }}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${
                      isDragging
                        ? 'border-[#EE3A43] bg-rose-50/50 dark:bg-rose-950/20 scale-[1.01]'
                        : isUploadingImage 
                        ? 'border-zinc-300 bg-zinc-50 pointer-events-none' 
                        : 'border-zinc-300 dark:border-zinc-700 hover:border-[#EE3A43] dark:hover:border-[#EE3A43] bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-rose-50/20'
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <RefreshCw className="w-8 h-8 animate-spin text-[#EE3A43]" />
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Uploading poster image...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#EE3A43] flex items-center justify-center mb-3 shadow-2xs">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          Click to browse or drop poster image
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          PNG, JPG, JPEG, WEBP (Recommended 4:5 vertical poster format)
                        </p>
                        <div className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-[#EE3A43] hover:bg-[#d92d36] text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose File to Upload</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Or paste Image URL option */}
              <div className="pt-1">
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                  <span className="bg-white dark:bg-zinc-900 px-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0">
                    Or paste Image URL
                  </span>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                </div>
                <input
                  type="text"
                  value={editingLaunch.image || ''}
                  onChange={(e) => setEditingLaunch({ ...editingLaunch, image: e.target.value, localPreview: null })}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs outline-none focus:border-[#EE3A43]"
                />
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    value={editingLaunch.sortOrder}
                    onChange={(e) => setEditingLaunch({ ...editingLaunch, sortOrder: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingLaunch.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingLaunch({ ...editingLaunch, isActive: e.target.value === 'active' })}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-[#EE3A43]"
                  >
                    <option value="active">Active (Show)</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingLaunch(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLaunch}
                disabled={saving || isUploadingImage || (!editingLaunch.image && !editingLaunch.localPreview)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#EE3A43] hover:bg-[#d92d36] text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving & Publishing...</span>
                  </>
                ) : isUploadingImage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Publish Poster</span>
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
