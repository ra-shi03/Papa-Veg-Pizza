import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Save, Loader2, UploadCloud, LayoutTemplate, SlidersHorizontal, Pizza, BadgePercent,
  Filter, Search, Check, Info, ChevronRight, ChevronDown, X
} from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';

const emptyConfig = {
  topBannerUrl: '',
  bottomBannerUrl: '',
  sectionTitle: '1 PLUS 1 Offer',
  sectionSubtitle: 'Mind boggling offers on selecting any 2 pizzas',
  buttonText: 'Build your Combo',
  isActive: true,
  offerName: '1 PLUS 1 Offer',
  slotCount: 2,
  sizeName: 'Medium',
  eligibleCategoryIds: [],
  eligibleProductIds: [],
  defaultProductIds: [],
  discountType: 'flat',
  discountValue: 0,
  loadingSeconds: 3,
  loadingTitle: 'Building a perfect meal for you!',
  loadingSubtitle: 'You can change anytime',
  includesTitle: 'Combo includes {count} items',
  changeNotice: 'Feel free to change your combo items anytime!',
  exploreText: 'Explore more pizzas & grab up to {maxSave} Off!',
  productDiscounts: [],
  pickerTitle: 'Select a {size} Pizza',
  addButtonText: 'Add Combo',
  showVegFilter: true,
  showNonVegFilter: true,
  showSort: true
};

const TABS = [
  { id: 'landing', label: 'Landing Page', hint: 'Banners & offer card', icon: LayoutTemplate },
  { id: 'builder', label: 'Builder Settings', hint: 'Size, slots & texts', icon: SlidersHorizontal },
  { id: 'pizzas', label: 'Pizza Selection', hint: 'Which pizzas show', icon: Pizza },
  { id: 'pricing', label: 'Pricing & Offers', hint: 'Combo discounts', icon: BadgePercent },
  { id: 'filters', label: 'Picker Filters', hint: 'Veg / Non Veg / Sort', icon: Filter }
];

const PIZZA_SIZES = ['Small', 'Regular', 'Medium', 'Large'];

const idOf = (v) => String(v?._id || v || '');
const rupee = (n) => `₹${Math.round(Number(n) || 0)}`;

const normalize = (d) => ({
  ...d,
  eligibleCategoryIds: (d.eligibleCategoryIds || []).map(idOf),
  eligibleProductIds: (d.eligibleProductIds || []).map(idOf),
  defaultProductIds: (d.defaultProductIds || []).map(idOf),
  productDiscounts: (d.productDiscounts || []).map((x) => ({
    productId: idOf(x.productId),
    discountType: x.discountType === 'percentage' ? 'percentage' : 'flat',
    discountValue: x.discountValue
  }))
});

const inputCls = 'mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE3A43]/30 focus:border-[#EE3A43]';

function Card({ title, description, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-5 pt-5">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 pt-4 pb-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, type = 'text', hint, placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        min={type === 'number' ? 0 : undefined}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </Field>
  );
}

// Sentence with one automatic value in the middle, e.g. "Combo includes [4] items".
// The admin only edits the plain words around it; the automatic value is a fixed chip.
const splitSentence = (value, token) => {
  const text = String(value || '');
  const marker = `{${token}}`;
  const at = text.indexOf(marker);
  if (at === -1) return { before: text, after: '', show: false };
  // Drop any repeated markers left over from earlier edits
  const clean = (t) => t.split(marker).join('').trim();
  return { before: clean(text.slice(0, at)), after: clean(text.slice(at + marker.length)), show: true };
};

function AutoValueSentence({ label, help, value, onChange, token, autoLabel, beforePlaceholder, afterPlaceholder, toggleLabel }) {
  const compose = (p) =>
    p.show
      ? [p.before.trim(), `{${token}}`, p.after.trim()].filter(Boolean).join(' ')
      : p.before.trim();
  const [parts, setParts] = useState(() => {
    const parsed = splitSentence(value, token);
    return toggleLabel || parsed.show ? parsed : { ...parsed, show: true };
  });

  // Pick up changes that arrive from outside (e.g. after the settings finish loading)
  useEffect(() => {
    if (value !== compose(parts)) {
      const parsed = splitSentence(value, token);
      setParts(toggleLabel || parsed.show ? parsed : { ...parsed, show: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (patch) => {
    const next = { ...parts, ...patch };
    setParts(next);
    onChange(compose(next));
  };

  // Input that grows with its text, so the words and the automatic value read as one sentence
  const textInput = (key, placeholder) => (
    <span className="relative inline-block">
      <span className="invisible whitespace-pre text-sm">{parts[key] || placeholder}</span>
      <input
        value={parts[key]}
        placeholder={placeholder}
        onChange={(e) => update({ [key]: e.target.value })}
        className="absolute inset-0 w-full bg-transparent border-0 p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
    </span>
  );

  return (
    <div>
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      {help && <span className="block text-xs text-gray-500">{help}</span>}
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-[#EE3A43]/30 focus-within:border-[#EE3A43]">
        {textInput('before', beforePlaceholder)}
        {parts.show && (
          <span title="Filled in automatically" className="px-2 py-0.5 rounded-md bg-gray-100 border border-dashed border-gray-300 text-sm font-semibold text-gray-700 whitespace-nowrap select-none">
            {autoLabel}
          </span>
        )}
        {parts.show && textInput('after', afterPlaceholder)}
      </div>
      {toggleLabel && (
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={parts.show} onChange={(e) => update({ show: e.target.checked })} />
          {toggleLabel}
        </label>
      )}
    </div>
  );
}

function SearchableSelect({ value, options, onChange, placeholder = 'Select', emptyLabel = 'None' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  const choose = (id) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapRef} className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm bg-white text-left cursor-pointer ${
          open ? 'border-[#EE3A43] ring-2 ring-[#EE3A43]/30' : 'border-gray-300'
        }`}
      >
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pizza"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#EE3A43]"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => choose('')}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-gray-500 bg-transparent border-0 cursor-pointer hover:bg-gray-50"
            >
              {emptyLabel}
              {!value && <Check className="w-4 h-4 text-[#EE3A43]" />}
            </button>
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left border-0 cursor-pointer hover:bg-gray-50 ${
                  o.id === value ? 'bg-[#EE3A43]/5 text-[#EE3A43] font-medium' : 'bg-transparent text-gray-800'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.id === value && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">No pizza found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border-0 cursor-pointer transition-colors shrink-0 ${checked ? 'bg-[#EE3A43]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex p-1 bg-gray-100 rounded-lg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm rounded-md border-0 cursor-pointer transition-colors ${
            value === o.value ? 'bg-white text-[#EE3A43] font-semibold shadow-sm' : 'bg-transparent text-gray-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Tip({ children }) {
  return (
    <div className="flex gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-800">
      <Info className="w-4 h-4 shrink-0 mt-px" />
      <div>{children}</div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE3A43]/30 focus:border-[#EE3A43]"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-0 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function ImagePicker({ label, hint, preview, onPick }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <p className="text-xs text-gray-500 mb-2">{hint}</p>
      <label className="group block cursor-pointer border-2 border-dashed border-gray-300 rounded-xl overflow-hidden hover:border-[#EE3A43] transition-colors relative">
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full max-h-56 object-cover" />
            <span className="absolute inset-0 bg-black/45 text-white text-sm font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <UploadCloud className="w-5 h-5" /> Change image
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <UploadCloud className="w-8 h-8 mb-2" />
            <span className="text-sm">Click to upload image</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>
    </div>
  );
}

export default function ComboPageConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('landing');
  const [config, setConfig] = useState(emptyConfig);
  const [files, setFiles] = useState({ topBannerUrl: null, bottomBannerUrl: null });
  const [previews, setPreviews] = useState({ topBannerUrl: '', bottomBannerUrl: '' });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminClient.get('/settings/combo-page');
        if (data?.data) setConfig((prev) => ({ ...prev, ...normalize(data.data) }));
      } catch (error) {
        console.error('Failed to fetch combo page config', error);
        toast.error('Failed to load combo page settings');
      } finally {
        setIsLoading(false);
      }
    })();
    (async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          adminClient.get('/food/admin/category-products/public'),
          adminClient.get('/food/admin/products/public')
        ]);
        setCategories((cRes?.data?.data || []).map((c) => ({ id: idOf(c), label: c.label || c.name })));
        setProducts((pRes?.data?.data || []).map((p) => ({
          id: idOf(p),
          label: p.name,
          categoryId: idOf(p.categoryId),
          vegType: p.vegType,
          sizes: (p.sizes || [])
            .map((x) => ({ name: String(x.size || '').trim(), price: Number(x.price) || 0 }))
            .filter((x) => x.name)
        })));
      } catch (error) {
        console.error('Failed to load categories/products', error);
      }
    })();
  }, []);

  // The sizes the product form offers; a product's other size labels (e.g. "6 PCS") are not pizza sizes
  const sizeKey = String(config.sizeName || '').trim().toLowerCase();
  const sizeOptions = useMemo(() => {
    const known = PIZZA_SIZES.filter((sz) => products.some((p) => p.sizes.some((x) => x.name.toLowerCase() === sz.toLowerCase())));
    // Keep a previously saved size visible even if it is not in the standard list
    const saved = String(config.sizeName || '').trim();
    return saved && !known.some((sz) => sz.toLowerCase() === saved.toLowerCase()) ? [...known, saved] : known;
  }, [products, config.sizeName]);

  // Products that actually have the chosen size, with that size's menu price
  const sizedProducts = useMemo(
    () => products
      .map((p) => ({ ...p, menuPrice: p.sizes.find((s) => s.name.toLowerCase() === sizeKey)?.price }))
      .filter((p) => p.menuPrice !== undefined),
    [products, sizeKey]
  );

  // Same rule the customer app uses: eligible products, else eligible categories, else everything
  const offeredProducts = useMemo(() => {
    if (config.eligibleProductIds.length > 0) return sizedProducts.filter((p) => config.eligibleProductIds.includes(p.id));
    if (config.eligibleCategoryIds.length > 0) return sizedProducts.filter((p) => config.eligibleCategoryIds.includes(p.categoryId));
    return sizedProducts;
  }, [sizedProducts, config.eligibleProductIds, config.eligibleCategoryIds]);

  const matches = (p, q) => !q.trim() || p.label.toLowerCase().includes(q.trim().toLowerCase());

  const getRule = (id) => config.productDiscounts.find((d) => d.productId === id);
  const comboPriceFor = (p) => {
    const rule = getRule(p.id);
    const hasRule = rule && Number(rule.discountValue) > 0;
    const type = hasRule ? rule.discountType : config.discountType;
    const value = Number(hasRule ? rule.discountValue : config.discountValue) || 0;
    const off = type === 'percentage' ? Math.round((p.menuPrice * value) / 100) : value;
    const discount = Math.min(Math.max(0, off), p.menuPrice);
    return { discount, price: p.menuPrice - discount, custom: Boolean(hasRule) };
  };

  const setField = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));
  const toggleId = (key, id) =>
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id]
    }));
  const setRule = (id, patch) =>
    setConfig((prev) => {
      const rest = prev.productDiscounts.filter((d) => d.productId !== id);
      const current = prev.productDiscounts.find((d) => d.productId === id) || { productId: id, discountType: 'flat', discountValue: '' };
      return { ...prev, productDiscounts: [...rest, { ...current, ...patch }] };
    });
  const clearRule = (id) => setConfig((prev) => ({ ...prev, productDiscounts: prev.productDiscounts.filter((d) => d.productId !== id) }));
  const setSlotDefault = (slot, id) =>
    setConfig((prev) => {
      const next = Array.from({ length: Number(prev.slotCount) || 2 }, (_, i) => prev.defaultProductIds[i] || '');
      next[slot] = id;
      return { ...prev, defaultProductIds: next };
    });

  const pickFile = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'combo-page');
    const { data } = await adminClient.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data?.data?.url;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { ...config, defaultProductIds: config.defaultProductIds.filter(Boolean) };
      for (const key of ['topBannerUrl', 'bottomBannerUrl']) {
        if (files[key]) payload[key] = await uploadFile(files[key]);
      }
      const { data } = await adminClient.put('/settings/combo-page', payload);
      setConfig((prev) => ({ ...prev, ...normalize(data?.data || payload) }));
      setFiles({ topBannerUrl: null, bottomBannerUrl: null });
      setPreviews({ topBannerUrl: '', bottomBannerUrl: '' });
      toast.success('Combo page saved successfully!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save combo page');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#EE3A43]" />
      </div>
    );
  }

  const slotCount = Math.min(6, Math.max(1, Number(config.slotCount) || 2));
  const maxSavePreview = Math.max(0, ...offeredProducts.map((p) => comboPriceFor(p).discount));
  const sample = { count: slotCount, size: config.sizeName, maxSave: rupee(maxSavePreview) };
  const topSrc = previews.topBannerUrl || config.topBannerUrl;
  const bottomSrc = previews.bottomBannerUrl || config.bottomBannerUrl;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Combo Page</h1>
          <p className="text-sm text-gray-500 truncate">Everything customers see after tapping Combos in the app</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:block">
            <Toggle label={config.isActive !== false ? 'Live' : 'Hidden'} checked={config.isActive !== false} onChange={(v) => setField('isActive', v)} />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#EE3A43] hover:bg-[#d92d36] text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 border-0 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left shrink-0 cursor-pointer transition-all ${
                active ? 'bg-white border-[#EE3A43] shadow-sm' : 'bg-white/60 border-gray-200 hover:bg-white'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-[#EE3A43] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span>
                <span className={`block text-sm font-semibold ${active ? 'text-[#EE3A43]' : 'text-gray-800'}`}>{i + 1}. {tab.label}</span>
                <span className="block text-xs text-gray-500">{tab.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-5">
        {/* 1. LANDING PAGE */}
        {activeTab === 'landing' && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
            <div className="space-y-5">
              <Card title="Top banner" description="Full-width image at the top of the page.">
                <ImagePicker label="Banner image" hint="Wide image works best (about 2.5:1)." preview={topSrc} onPick={(f) => pickFile('topBannerUrl', f)} />
              </Card>
              <Card title="Offer card" description="The heading and big card customers tap to start building a combo.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField label="Title" value={config.sectionTitle} onChange={(v) => setField('sectionTitle', v)} />
                  <TextField label="Button text" value={config.buttonText} onChange={(v) => setField('buttonText', v)} />
                </div>
                <TextField label="Subtitle" value={config.sectionSubtitle} onChange={(v) => setField('sectionSubtitle', v)} />
                <ImagePicker label="Offer card image" hint="The button is placed on top of this image. It is also used as the banner on the builder page." preview={bottomSrc} onPick={(f) => pickFile('bottomBannerUrl', f)} />
              </Card>
            </div>

            {/* Live preview */}
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Live preview</p>
              <div className="rounded-[28px] border-[6px] border-gray-800 bg-[#F8F6F2] overflow-hidden shadow-lg">
                <div className="h-24 bg-amber-100">
                  {topSrc && <img src={topSrc} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-3 -mt-3 rounded-t-xl bg-[#F8F6F2] relative">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{config.sectionTitle || 'Title'}</p>
                  <p className="text-[10px] text-gray-500 mb-2">{config.sectionSubtitle}</p>
                  <div className="relative rounded-lg overflow-hidden bg-green-800 aspect-square">
                    {bottomSrc && <img src={bottomSrc} alt="" className="w-full h-full object-cover" />}
                    <span className="absolute left-2 bottom-2 flex items-center gap-0.5 bg-[#EE3A43] text-white text-[10px] font-medium px-2.5 py-1 rounded-md">
                      {config.buttonText} <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. BUILDER SETTINGS */}
        {activeTab === 'builder' && (
          <>
            <Card title="Combo rules" description="How the combo is put together.">
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="Offer name" hint="Shown as the combo's name in the cart" value={config.offerName} onChange={(v) => setField('offerName', v)} />
                <div>
                  <span className="text-sm font-semibold text-gray-800">Pizza size</span>
                  <span className="block text-xs text-gray-500">Customers only see pizzas of this size</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sizeOptions.map((sz) => {
                      const on = sz.toLowerCase() === sizeKey;
                      const count = products.filter((p) => p.sizes.some((x) => x.name.toLowerCase() === sz.toLowerCase())).length;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setField('sizeName', sz)}
                          className={`flex flex-col items-start px-4 py-2 rounded-xl border text-left cursor-pointer transition-colors ${
                            on ? 'bg-[#EE3A43] border-[#EE3A43] text-white' : 'bg-white border-gray-300 text-gray-800 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-sm font-semibold">{sz}</span>
                          <span className={`text-[11px] ${on ? 'text-white/80' : 'text-gray-500'}`}>{count} pizza{count === 1 ? '' : 's'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <TextField label="Number of pizzas" type="number" hint="1 to 6 pizzas in one combo" value={config.slotCount} onChange={(v) => setField('slotCount', v)} />
                <TextField label="Loading animation (seconds)" type="number" hint="How long the building animation plays" value={config.loadingSeconds} onChange={(v) => setField('loadingSeconds', v)} />
              </div>
            </Card>

            <Card title="Screen texts" description="Edit the wording on each screen. Grey boxes are filled in automatically, you only change the words around them.">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Loading screen</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField label="Title" value={config.loadingTitle} onChange={(v) => setField('loadingTitle', v)} />
                  <TextField label="Subtitle" value={config.loadingSubtitle} onChange={(v) => setField('loadingSubtitle', v)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Combo screen</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <AutoValueSentence
                    label="Heading"
                    help="The number of pizzas is added automatically"
                    value={config.includesTitle}
                    onChange={(v) => setField('includesTitle', v)}
                    token="count"
                    autoLabel={String(sample.count)}
                    beforePlaceholder="Combo includes"
                    afterPlaceholder="items"
                  />
                  <TextField label="Add button" value={config.addButtonText} onChange={(v) => setField('addButtonText', v)} />
                  <TextField label="Green notice" value={config.changeNotice} onChange={(v) => setField('changeNotice', v)} />
                  <AutoValueSentence
                    label="Explore more line"
                    help="Shown under the pizzas. Clear the text to hide the line"
                    value={config.exploreText}
                    onChange={(v) => setField('exploreText', v)}
                    token="maxSave"
                    autoLabel={sample.maxSave}
                    beforePlaceholder="Explore more pizzas & grab up to"
                    afterPlaceholder="Off!"
                    toggleLabel="Show the biggest saving amount in this line"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Pizza picker</p>
                <AutoValueSentence
                  label="Title"
                  help="The pizza size you chose in Combo rules is added automatically"
                  value={config.pickerTitle}
                  onChange={(v) => setField('pickerTitle', v)}
                  token="size"
                  autoLabel={sample.size}
                  beforePlaceholder="Select a"
                  afterPlaceholder="Pizza"
                />
              </div>
            </Card>
          </>
        )}

        {/* 3. PIZZA SELECTION */}
        {activeTab === 'pizzas' && (
          <>
            <Card title="Which pizzas can customers pick?" description={`${offeredProducts.length} ${config.sizeName} pizza${offeredProducts.length === 1 ? '' : 's'} will be offered with the current choices.`}>
              <Tip>
                Only products that have a <b>{config.sizeName}</b> size are listed. Choose categories for a quick setup, or tick individual pizzas to offer exactly those. Leave both empty to offer every {config.sizeName} pizza.
              </Tip>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Categories {config.eligibleCategoryIds.length > 0 && <span className="text-[#EE3A43]">({config.eligibleCategoryIds.length} selected)</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const on = config.eligibleCategoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleId('eligibleCategoryIds', c.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
                          on ? 'bg-[#EE3A43] border-[#EE3A43] text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {on && <Check className="w-3.5 h-3.5" />}
                        {c.label}
                      </button>
                    );
                  })}
                  {categories.length === 0 && <p className="text-sm text-gray-400">No categories found</p>}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-gray-800">
                    Specific pizzas {config.eligibleProductIds.length > 0 && <span className="text-[#EE3A43]">({config.eligibleProductIds.length} selected)</span>}
                  </p>
                  {config.eligibleProductIds.length > 0 && (
                    <button type="button" onClick={() => setField('eligibleProductIds', [])} className="text-xs text-gray-500 underline bg-transparent border-0 cursor-pointer">Clear</button>
                  )}
                </div>
                <SearchBox value={productSearch} onChange={setProductSearch} placeholder="Search pizzas" />
                <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {sizedProducts.filter((p) => matches(p, productSearch)).map((p) => (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={config.eligibleProductIds.includes(p.id)} onChange={() => toggleId('eligibleProductIds', p.id)} />
                      <span className="flex-1 truncate">{p.label}</span>
                      <span className="text-xs text-gray-500">{rupee(p.menuPrice)}</span>
                    </label>
                  ))}
                  {sizedProducts.length === 0 && <p className="p-3 text-sm text-gray-400">No products have a {config.sizeName} size</p>}
                </div>
              </div>
            </Card>

            <Card title="Pre-selected pizzas" description="What the combo starts with, before the customer taps Change.">
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: slotCount }).map((_, i) => (
                  <div key={i}>
                    <span className="text-sm font-semibold text-gray-800">{`Pizza ${i + 1}`}</span>
                    <SearchableSelect
                      value={config.defaultProductIds[i] || ''}
                      options={offeredProducts}
                      onChange={(id) => setSlotDefault(i, id)}
                      placeholder="Automatic (first available)"
                      emptyLabel="Automatic (first available)"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* 4. PRICING */}
        {activeTab === 'pricing' && (
          <>
            <Card title="Default combo discount" description="Taken off each pizza's menu price. Used for every pizza that has no discount of its own.">
              <div className="flex flex-wrap items-end gap-4">
                <Field label="Discount type">
                  <div className="mt-1">
                    <Segmented
                      value={config.discountType}
                      onChange={(v) => setField('discountType', v)}
                      options={[{ value: 'flat', label: '₹ Flat' }, { value: 'percentage', label: '% Off' }]}
                    />
                  </div>
                </Field>
                <div className="w-40">
                  <TextField label={config.discountType === 'percentage' ? 'Percent off' : 'Rupees off'} type="number" value={config.discountValue} onChange={(v) => setField('discountValue', v)} />
                </div>
              </div>
            </Card>

            <Card title="Per-pizza discounts" description="Give a pizza its own discount, e.g. ₹40 off Margherita and ₹90 off premium pizzas. Blank = default discount.">
              <SearchBox value={ruleSearch} onChange={setRuleSearch} placeholder="Search pizzas" />
              <div className="max-h-[28rem] overflow-y-auto border border-gray-200 rounded-lg">
                <div className="hidden sm:grid grid-cols-[1fr_96px_120px_150px_32px] gap-3 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0 border-b border-gray-200">
                  <span>Pizza</span><span>Menu</span><span>Discount</span><span>Combo price</span><span />
                </div>
                <div className="divide-y divide-gray-100">
                  {offeredProducts.filter((p) => matches(p, ruleSearch)).map((p) => {
                    const rule = getRule(p.id);
                    const calc = comboPriceFor(p);
                    return (
                      <div key={p.id} className="grid sm:grid-cols-[1fr_96px_120px_150px_32px] gap-x-3 gap-y-2 items-center px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm truncate text-gray-900">{p.label}</p>
                          {calc.custom && <span className="inline-block text-[10px] font-semibold text-[#EE3A43] bg-[#EE3A43]/10 rounded px-1.5 py-0.5">Custom</span>}
                        </div>
                        <span className="text-sm text-gray-600">{rupee(p.menuPrice)}</span>
                        <div className="flex gap-1">
                          <select
                            value={rule?.discountType || 'flat'}
                            onChange={(e) => setRule(p.id, { discountType: e.target.value })}
                            className="border border-gray-300 rounded-lg px-1.5 py-1.5 text-sm bg-white"
                          >
                            <option value="flat">₹</option>
                            <option value="percentage">%</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            placeholder="Default"
                            value={rule?.discountValue ?? ''}
                            onChange={(e) => setRule(p.id, { discountValue: e.target.value })}
                            className="w-full min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                          />
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold text-gray-900">{rupee(calc.price)}</span>
                          {calc.discount > 0 && <span className="text-green-700 text-xs ml-1.5">Save {rupee(calc.discount)}</span>}
                        </p>
                        <button
                          type="button"
                          title="Reset to default"
                          onClick={() => clearRule(p.id)}
                          disabled={!rule}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 bg-transparent border-0 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  {offeredProducts.length === 0 && <p className="p-4 text-sm text-gray-400">No pizzas offered yet. Pick pizzas in step 3.</p>}
                </div>
              </div>
              <Tip>The combo price column is a live preview of what customers will see. Remember to press Save changes.</Tip>
            </Card>
          </>
        )}

        {/* 5. FILTERS */}
        {activeTab === 'filters' && (
          <Card title="Pizza picker filters" description="Choose which buttons appear at the top of the Select a pizza screen.">
            <Toggle label="Veg filter" description="Show only vegetarian pizzas" checked={config.showVegFilter !== false} onChange={(v) => setField('showVegFilter', v)} />
            <Toggle label="Non Veg filter" description="Show only non-vegetarian pizzas" checked={config.showNonVegFilter !== false} onChange={(v) => setField('showNonVegFilter', v)} />
            <Toggle label="Sort by" description="Let customers sort by price or name" checked={config.showSort !== false} onChange={(v) => setField('showSort', v)} />
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Preview</p>
              <div className="flex gap-2 flex-wrap bg-gray-100 rounded-xl p-3 min-h-[52px]">
                {config.showVegFilter !== false && <span className="px-3 py-1.5 bg-white rounded-lg text-sm border border-gray-200">🟢 Veg</span>}
                {config.showNonVegFilter !== false && <span className="px-3 py-1.5 bg-white rounded-lg text-sm border border-gray-200">🔺 Non Veg</span>}
                {config.showSort !== false && <span className="px-3 py-1.5 bg-white rounded-lg text-sm border border-gray-200">Sort by ⇅</span>}
                {config.showVegFilter === false && config.showNonVegFilter === false && config.showSort === false && (
                  <span className="text-sm text-gray-400 self-center">The filter row is hidden</span>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
