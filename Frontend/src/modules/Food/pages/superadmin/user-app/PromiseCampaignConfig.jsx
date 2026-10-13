import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, Plus, Trash2, Edit2, Save, ExternalLink, 
  Check, X, Eye, Zap, Moon, Gift, Truck, Box, Bike, 
  Flame, Heart, ShieldCheck, Sparkles, Wheat, Star,
  Info, RefreshCw, Bold
} from 'lucide-react';
import { adminClient } from '../../../../../services/api/axios';
import { toast } from 'sonner';
import { renderFormattedText } from '@food/utils/formatText';

const AVAILABLE_ICONS = [
  { name: 'Award', icon: Award, label: 'Award / Medal' },
  { name: 'Zap', icon: Zap, label: 'Surge / Energy' },
  { name: 'Moon', icon: Moon, label: 'Late Night' },
  { name: 'Gift', icon: Gift, label: 'Rewards / Offer' },
  { name: 'Truck', icon: Truck, label: 'Delivery Expert' },
  { name: 'Box', icon: Box, label: 'Packaging' },
  { name: 'Bike', icon: Bike, label: 'Rider / Free Delivery' },
  { name: 'Flame', icon: Flame, label: 'Freshly Baked' },
  { name: 'Heart', icon: Heart, label: 'Pure Veg / Love' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Quality / Safe' },
  { name: 'Sparkles', icon: Sparkles, label: 'Nutrients / Magic' },
  { name: 'Wheat', icon: Wheat, label: 'Wheat Crust' },
  { name: 'Star', icon: Star, label: 'Star Rating' }
];

const ICON_MAP = AVAILABLE_ICONS.reduce((acc, curr) => {
  acc[curr.name] = curr.icon;
  return acc;
}, {});

export default function PromiseCampaignConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTabId, setActiveTabId] = useState('lowest-pricing');

  // Form State
  const [header, setHeader] = useState({
    title: 'Papa Veg Promise',
    subtitle: 'Where **quality food** meets **honest prices**!',
    tagline: '100% Pure Vegetarian Delight',
    stars: '★★',
    orderButtonText: 'Order Now',
    badgeText: 'Promise',
    showBadge: true
  });

  const [tickerItems, setTickerItems] = useState([]);
  const [tabs, setTabs] = useState([]);

  // Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    id: '',
    title: '',
    description: '',
    icon: 'Award',
    isActive: true
  });

  // Ticker Modal States
  const [tickerModalOpen, setTickerModalOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState(null);
  const [tickerForm, setTickerForm] = useState({
    id: '',
    heading: '',
    tagline: '',
    isActive: true
  });

  const subtitleInputRef = useRef(null);
  const tickerTaglineInputRef = useRef(null);

  const handleMakeSubtitleBold = () => {
    const input = subtitleInputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentVal = header.subtitle || '';

    if (start !== end) {
      const selected = currentVal.substring(start, end);
      const isAlreadyBold = selected.startsWith('**') && selected.endsWith('**');
      const replacement = isAlreadyBold ? selected.slice(2, -2) : `**${selected}**`;
      const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
      setHeader({ ...header, subtitle: newVal });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start + replacement.length);
      }, 0);
    } else {
      const newVal = currentVal.substring(0, start) + '**bold text**' + currentVal.substring(end);
      setHeader({ ...header, subtitle: newVal });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, start + 11);
      }, 0);
    }
  };

  const handleMakeTickerTaglineBold = () => {
    const input = tickerTaglineInputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentVal = tickerForm.tagline || '';

    if (start !== end) {
      const selected = currentVal.substring(start, end);
      const isAlreadyBold = selected.startsWith('**') && selected.endsWith('**');
      const replacement = isAlreadyBold ? selected.slice(2, -2) : `**${selected}**`;
      const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
      setTickerForm({ ...tickerForm, tagline: newVal });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start + replacement.length);
      }, 0);
    } else {
      const newVal = currentVal.substring(0, start) + '**bold text**' + currentVal.substring(end);
      setTickerForm({ ...tickerForm, tagline: newVal });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, start + 11);
      }, 0);
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await adminClient.get('/settings/promise-campaign');
      const data = res?.data?.data || res?.data;
      if (data) {
        if (data.header) {
          setHeader(prev => ({
            ...prev,
            ...data.header,
            badgeText: data.header.badgeText !== undefined ? data.header.badgeText : 'Promise',
            showBadge: data.header.showBadge !== undefined ? data.header.showBadge : true
          }));
        }
        if (data.tickerItems) setTickerItems(data.tickerItems);
        if (data.tabs && data.tabs.length > 0) {
          setTabs(data.tabs);
          if (!data.tabs.some(t => t.id === activeTabId)) {
            setActiveTabId(data.tabs[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load promise campaign config:', err);
      toast.error('Failed to load Promise Campaign settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        header,
        tickerItems,
        tabs,
        isActive: true
      };
      await adminClient.put('/settings/promise-campaign', payload);
      toast.success('Promise Campaign saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Open item modal for add/edit
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        id: item.id,
        title: item.title,
        description: item.description,
        icon: item.icon || 'Award',
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setItemForm({
        id: `item-${Date.now()}`,
        title: '',
        description: '',
        icon: 'Award',
        isActive: true
      });
    }
    setItemModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!itemForm.description.trim()) {
      toast.error('Description is required.');
      return;
    }

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      let newItems = [...(tab.items || [])];
      if (editingItem) {
        newItems = newItems.map(it => it.id === editingItem.id ? { ...it, ...itemForm } : it);
      } else {
        newItems.push({
          ...itemForm,
          order: newItems.length
        });
      }
      return { ...tab, items: newItems };
    }));

    setItemModalOpen(false);
    toast.success(editingItem ? 'Promise item updated!' : 'Promise item added!');
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm('Are you sure you want to delete this promise feature?')) return;
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        items: (tab.items || []).filter(it => it.id !== itemId)
      };
    }));
    toast.success('Item removed. Click Save Content to persist.');
  };

  const handleToggleItemActive = (itemId) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        items: (tab.items || []).map(it => it.id === itemId ? { ...it, isActive: !it.isActive } : it)
      };
    }));
  };

  // Ticker items management
  const handleOpenTickerModal = (ticker = null) => {
    if (ticker) {
      setEditingTicker(ticker);
      setTickerForm({
        id: ticker.id,
        heading: ticker.heading || header.title || 'Papa Veg Promise',
        tagline: ticker.tagline || ticker.heading || '',
        isActive: ticker.isActive !== false
      });
    } else {
      setEditingTicker(null);
      setTickerForm({
        id: `tick-${Date.now()}`,
        heading: header.title || 'Papa Veg Promise',
        tagline: '',
        isActive: true
      });
    }
    setTickerModalOpen(true);
  };

  const handleSaveTicker = () => {
    if (!tickerForm.tagline.trim()) {
      toast.error('Tagline text is required.');
      return;
    }
    const finalSlide = {
      ...tickerForm,
      heading: tickerForm.heading || header.title || 'Papa Veg Promise'
    };
    if (editingTicker) {
      setTickerItems(prev => prev.map(t => t.id === editingTicker.id ? { ...t, ...finalSlide } : t));
    } else {
      setTickerItems(prev => [...prev, finalSlide]);
    }
    setTickerModalOpen(false);
    toast.success(editingTicker ? 'Tagline slide updated!' : 'Tagline slide added!');
  };

  const handleDeleteTicker = (tickId) => {
    setTickerItems(prev => prev.filter(t => t.id !== tickId));
    toast.success('Slider item removed.');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Top Header & Save Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white">Promise Campaign Management</h1>
              <p className="text-xs text-zinc-500 font-medium">
                Configure Papa Veg Promise guarantees, pricing &amp; quality pledges, and rotating menu slider banners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/user/promise"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Eye size={14} />
            View User Page
          </a>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-black hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[var(--primary)]/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Section 1: Page Header & Brand Text */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Promise Page Header Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Campaign Title</label>
            <input 
              type="text" 
              value={header.title || ''}
              onChange={(e) => setHeader({ ...header, title: e.target.value })}
              className="w-full h-9 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 bg-zinc-50/50 dark:bg-zinc-950 text-xs font-bold focus:border-[var(--primary)] outline-none" 
              placeholder="e.g. Papa Veg Promise"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Subtitle / Tagline</label>
              <button
                type="button"
                onClick={handleMakeSubtitleBold}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-xs"
                title="Select text in the input and click to bold (**word**)"
              >
                <Bold size={11} className="stroke-[3]" />
                <span>Bold Selection</span>
              </button>
            </div>
            <input 
              ref={subtitleInputRef}
              type="text" 
              value={header.subtitle || ''}
              onChange={(e) => setHeader({ ...header, subtitle: e.target.value })}
              className="w-full h-9 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 bg-zinc-50/50 dark:bg-zinc-950 text-xs font-semibold focus:border-[var(--primary)] outline-none" 
              placeholder="e.g. Where **quality food** meets **honest prices**!"
            />
            {/* Live Formatted Subtitle Preview */}
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 overflow-hidden">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 shrink-0">Live Preview:</span>
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                {renderFormattedText(header.subtitle || "Where **quality food** meets **honest prices**!")}
              </span>
            </div>
          </div>

          {/* Promise Badge Text & Visibility Toggle */}
          <div className="space-y-2.5 p-3.5 bg-zinc-50/70 dark:bg-zinc-950/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  Promise Header Badge
                </label>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Displays next to "{header.title || 'Papa Veg Promise'}" on the user promise page.
                </p>
              </div>

              {/* Toggle Switch (Visible / Hidden) */}
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold ${header.showBadge !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                  {header.showBadge !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => setHeader(prev => ({ ...prev, showBadge: prev.showBadge === false ? true : false }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    header.showBadge !== false ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                  }`}
                  role="switch"
                  aria-checked={header.showBadge !== false}
                  title="Toggle Badge Visibility"
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Badge Text</label>
                <input
                  type="text"
                  value={header.badgeText ?? 'Promise'}
                  onChange={(e) => setHeader({ ...header, badgeText: e.target.value })}
                  disabled={header.showBadge === false}
                  className="w-full h-9 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 bg-white dark:bg-zinc-900 text-xs font-bold focus:border-[var(--primary)] outline-none disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800"
                  placeholder="e.g. Promise"
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Live Badge Preview</label>
                <div className="h-9 flex items-center px-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-2">
                  <span className="text-xs font-black text-[var(--primary,#E53935)] truncate">
                    {header.title || 'Papa Veg Promise'}
                  </span>
                  {header.showBadge !== false && (header.badgeText || 'Promise') ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#169B45]/15 text-[#169B45] border border-[#169B45]/30 shadow-xs shrink-0">
                      <Sparkles size={11} className="text-[#169B45] fill-[#169B45]/30" />
                      <span className="text-[9px] font-black uppercase tracking-wider">
                        {header.badgeText || 'Promise'}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 italic">(Badge hidden)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Menu Page Dynamic Slider Ticker */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">
              Menu Page Campaign Ticker ({tickerItems.length} active slides)
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              These rotating taglines slide on <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">/user/menu</code> under the fixed "{header.title || 'Papa Veg Promise'}" header.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenTickerModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add Slide
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tickerItems.map((tick, index) => (
            <div 
              key={tick.id}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col justify-between gap-3 relative group"
            >
              <div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                  ★ Sliding Tagline #{index + 1}
                </span>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-snug">
                  {renderFormattedText(tick.tagline || tick.heading)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => handleOpenTickerModal(tick)}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Edit slide"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTicker(tick.id)}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded text-rose-500 transition-colors cursor-pointer"
                  title="Delete slide"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Promise Category Tabs & Features CRUD */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Promise Tabs &amp; Features Details</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Manage the cards displayed under each category tab on the user promise page.</p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenItemModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-sm w-fit"
          >
            <Plus size={15} /> Add Promise Card
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          {tabs.map((tab) => {
            const isSelected = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-[var(--primary)] text-white shadow-sm' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {tab.name} ({tab.items?.length || 0})
              </button>
            );
          })}
        </div>

        {/* Tab Badge Subtitle Customization */}
        {currentTab && (
          <div className="space-y-1.5 p-3.5 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
              Center Medal Badge Heading for "{currentTab.name}"
            </label>
            <input 
              type="text" 
              value={currentTab.badgeText || ''}
              onChange={(e) => {
                const val = e.target.value;
                setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, badgeText: val } : t));
              }}
              className="w-full h-8 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 bg-white dark:bg-zinc-900 text-xs font-bold focus:border-[var(--primary)] outline-none" 
              placeholder="e.g. Only on the Papa Veg Pizza App!"
            />
          </div>
        )}

        {/* Promise Feature Items Table / Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentTab?.items?.map((item) => {
              const IconComp = ICON_MAP[item.icon] || Award;
              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    item.isActive !== false 
                      ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                      : 'bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
                  }`}
                >
                  {/* Icon Badge */}
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <IconComp size={22} />
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-black text-zinc-900 dark:text-white truncate">{item.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleItemActive(item.id)}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded cursor-pointer ${
                            item.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-600'
                          }`}
                        >
                          {item.isActive !== false ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-1">{item.description}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => handleOpenItemModal(item)}
                        className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-[var(--primary)] flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(!currentTab?.items || currentTab.items.length === 0) && (
            <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Award size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-bold text-zinc-500">No promise items added to this tab yet.</p>
              <button
                type="button"
                onClick={() => handleOpenItemModal()}
                className="mt-3 text-xs font-black text-[var(--primary)] hover:underline cursor-pointer"
              >
                + Add your first promise item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Item Modal (Add / Edit Promise Card) */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                {editingItem ? 'Edit Promise Item' : `Add Promise Item to ${currentTab?.name}`}
              </h3>
              <button onClick={() => setItemModalOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-zinc-500">Item Title *</label>
                <input 
                  type="text" 
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  placeholder="e.g. No Weather Surge"
                  className="w-full h-9 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 bg-zinc-50/50 dark:bg-zinc-950 text-xs font-bold outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-zinc-500">Description *</label>
                <textarea 
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="e.g. Rain or Storm, our prices stay the same"
                  rows={2}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950 text-xs font-medium outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-zinc-500">Select Icon Symbol</label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950">
                  {AVAILABLE_ICONS.map((ic) => {
                    const IconElem = ic.icon;
                    const isPicked = itemForm.icon === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, icon: ic.name })}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 text-center cursor-pointer transition-all border ${
                          isPicked 
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <IconElem size={16} />
                        <span className="text-[8px] font-bold leading-none truncate w-full">{ic.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={itemForm.isActive}
                  onChange={(e) => setItemForm({ ...itemForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[var(--primary)] rounded cursor-pointer"
                />
                Active (Visible to users)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveItem}
                className="px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-black hover:opacity-90 cursor-pointer"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticker Slide Modal */}
      {tickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                {editingTicker ? 'Edit Sliding Tagline' : 'Add Sliding Tagline'}
              </h3>
              <button onClick={() => setTickerModalOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-zinc-500">Tagline / Guarantee Text *</label>
                  <button
                    type="button"
                    onClick={handleMakeTickerTaglineBold}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-xs"
                    title="Select text in the input and click to bold (**word**)"
                  >
                    <Bold size={11} className="stroke-[3]" />
                    <span>Bold Selection</span>
                  </button>
                </div>
                <input 
                  ref={tickerTaglineInputRef}
                  type="text" 
                  value={tickerForm.tagline}
                  onChange={(e) => setTickerForm({ ...tickerForm, tagline: e.target.value })}
                  placeholder="e.g. 100% Pure Vegetarian & 0% Preservatives"
                  className="w-full h-9 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 bg-zinc-50/50 dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)]"
                />
                {/* Live Preview */}
                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 shrink-0">Live Preview:</span>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                    {renderFormattedText(tickerForm.tagline || "e.g. 100% Pure Vegetarian")}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium mt-1 leading-snug">
                  Only the tagline rotates in the menu banner under the fixed "{header.title || 'Papa Veg Promise'}" campaign heading.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                type="button"
                onClick={() => setTickerModalOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveTicker}
                className="px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-black hover:opacity-90 cursor-pointer"
              >
                Save Slide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

