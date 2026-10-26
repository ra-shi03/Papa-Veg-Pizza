import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, PanelBottom, Sparkles, Timer, X, Search, Check, Wand2, Hand, Pizza, Cookie, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';

const emptyConfig = {
  bottomBar: { enabled: true, showUpsell: true, ctaText: 'View Cart', freeDeliveryText: '' },
  upsell: {
    enabled: true,
    title: 'Complete your order now',
    cartTitle: 'Complete Your Meal With',
    mode: 'auto',
    includeProducts: true,
    includeAddons: true,
    includeToppings: true,
    productCategoryIds: [],
    addonTypes: [],
    pinnedProductIds: [],
    pinnedAddonIds: [],
    excludeProductIds: [],
    excludeAddonIds: [],
    maxItems: 8,
    hideItemsInCart: true,
    showCategoryChips: true,
    frequentlyBoughtEnabled: true,
    minPastOrders: 1
  },
  offer: {
    enabled: false,
    sliderText: 'Slide to unlock Limited Time Offer',
    modalTitle: 'Limited Time Discount for you!',
    buttonText: 'Add & Continue',
    itemType: 'addon',
    productId: '',
    addonId: '',
    sizeName: '',
    offerPrice: 0,
    expiryMinutes: 15,
    minCartValue: 0
  }
};

const TABS = [
  { id: 'bar', label: 'Bottom Bar', hint: 'Shown after Add', icon: PanelBottom },
  { id: 'upsell', label: 'Complete Your Order', hint: 'Suggestion rules', icon: Sparkles },
  { id: 'offer', label: 'Limited Time Offer', hint: 'Slide to unlock', icon: Timer }
];

const idOf = (v) => String(v?._id || v || '');
const rupee = (n) => `₹${Math.round(Number(n) || 0)}`;

const normalize = (d = {}) => {
  const ids = (list) => (list || []).map(idOf);
  return {
    bottomBar: { ...emptyConfig.bottomBar, ...(d.bottomBar || {}) },
    upsell: {
      ...emptyConfig.upsell,
      ...(d.upsell || {}),
      productCategoryIds: ids(d.upsell?.productCategoryIds),
      pinnedProductIds: ids(d.upsell?.pinnedProductIds),
      pinnedAddonIds: ids(d.upsell?.pinnedAddonIds),
      excludeProductIds: ids(d.upsell?.excludeProductIds),
      excludeAddonIds: ids(d.upsell?.excludeAddonIds),
      addonTypes: d.upsell?.addonTypes || []
    },
    offer: {
      ...emptyConfig.offer,
      ...(d.offer || {}),
      productId: idOf(d.offer?.productId),
      addonId: idOf(d.offer?.addonId)
    }
  };
};

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
        onChange={(e) => onChange(type === 'number' ? e.target.value : e.target.value)}
        className={inputCls}
      />
    </Field>
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

// Multi-select with search and removable chips.
function MultiPicker({ label, hint, options, value, onChange, placeholder = 'Search…' }) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(value), [value]);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => !selected.has(o.id) && (!q || o.label.toLowerCase().includes(q))).slice(0, 8);
  }, [options, query, selected]);

  return (
    <Field label={label} hint={hint}>
      <div className="mt-1 flex flex-wrap gap-2">
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 bg-[#EE3A43]/10 text-[#EE3A43] text-xs font-semibold rounded-full pl-3 pr-1.5 py-1">
            {byId.get(id)?.label || 'Unknown item'}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== id))} className="border-0 bg-transparent cursor-pointer text-[#EE3A43] p-0.5 flex">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-gray-400 py-1">Nothing selected</span>}
      </div>
      <div className="relative mt-2">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`${inputCls} !mt-0 pl-9`}
        />
      </div>
      {query && (
        <div className="mt-1 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
          {matches.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No matches</p>}
          {matches.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange([...value, o.id]); setQuery(''); }}
              className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-50 border-0 cursor-pointer flex justify-between"
            >
              <span>{o.label}</span>
              {o.hint && <span className="text-xs text-gray-400">{o.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

function ChipSelect({ label, hint, options, value, onChange }) {
  const selected = new Set(value);
  const toggle = (id) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.length === 0 && <span className="text-xs text-gray-400">Nothing to choose from yet</span>}
        {options.map((o) => {
          const on = selected.has(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                on ? 'bg-[#EE3A43] text-white border-[#EE3A43]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Big clickable tile used for on/off choices.
function ChoiceTile({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border-2 p-3 cursor-pointer transition-colors w-full ${
        active ? 'border-[#EE3A43] bg-[#EE3A43]/5' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${active ? 'text-[#EE3A43]' : 'text-gray-500'}`} />
        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${active ? 'bg-[#EE3A43] text-white' : 'border border-gray-300'}`}>
          {active && <Check className="w-3 h-3" strokeWidth={3} />}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold text-gray-900">{title}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </button>
  );
}

// Visual picker: tap items to add / remove them. Scrolls inside its own box so the page stays short.
function ItemPicker({ items, selectedIds, onToggle }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const selected = new Set(selectedIds);
  const filtered = items.filter((i) => (kind === 'all' || i.kind === kind) && (!query.trim() || i.label.toLowerCase().includes(query.trim().toLowerCase())));
  const kinds = [{ id: 'all', label: 'All' }, { id: 'product', label: 'Products' }, { id: 'addon', label: 'Add-ons' }, { id: 'topping', label: 'Toppings' }];
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items…" className={`${inputCls} !mt-0 pl-9`} />
        </div>
        <div className="inline-flex p-1 bg-gray-100 rounded-lg shrink-0">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`px-3 py-1.5 text-xs rounded-md border-0 cursor-pointer ${kind === k.id ? 'bg-white text-[#EE3A43] font-semibold shadow-sm' : 'bg-transparent text-gray-600'}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 max-h-80 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {filtered.length === 0 && <p className="col-span-full text-sm text-gray-400 py-6 text-center">No items found</p>}
        {filtered.map((i) => {
          const on = selected.has(i.id);
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onToggle(i)}
              className={`relative text-left rounded-xl border-2 overflow-hidden cursor-pointer bg-white transition-colors ${on ? 'border-[#EE3A43]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="h-16 bg-gray-100">
                {i.image && <img src={i.image} alt="" className="w-full h-full object-cover" loading="lazy" />}
              </div>
              {on && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#EE3A43] text-white flex items-center justify-center">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-900 line-clamp-1">{i.label}</p>
                <p className="text-[11px] text-gray-500">{i.hint} · {i.group}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// What the customer will see, as a small strip.
function UpsellPreview({ title, items, mode }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
      <p className="text-sm font-bold text-gray-900">{title || 'Complete your order now'}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500 mt-2">
          {mode === 'manual' ? 'Pick at least one item below — nothing will be shown until you do.' : 'Items are chosen automatically from your rules and customers’ order history.'}
        </p>
      ) : (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {items.slice(0, 8).map((i) => (
            <div key={i.id} className="shrink-0 w-24 rounded-lg bg-white border border-gray-200 overflow-hidden">
              <div className="h-12 bg-gray-100">{i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}</div>
              <p className="px-1.5 pt-1 text-[11px] font-semibold line-clamp-1">{i.label}</p>
              <p className="px-1.5 pb-1 text-[11px] text-gray-500">{i.hint}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CartConfig() {
  const [config, setConfig] = useState(emptyConfig);
  const [tab, setTab] = useState('bar');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [addons, setAddons] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminClient.get('/settings/cart-config');
        if (data?.data) setConfig(normalize(data.data));
      } catch (error) {
        console.error('Failed to fetch cart config', error);
        toast.error('Failed to load cart settings');
      } finally {
        setIsLoading(false);
      }
    })();
    (async () => {
      try {
        const [cRes, pRes, aRes] = await Promise.all([
          adminClient.get('/food/admin/category-products/public'),
          adminClient.get('/food/admin/products/public'),
          adminClient.get('/food/admin/addons/public')
        ]);
        setCategories((cRes?.data?.data || []).map((c) => ({ id: idOf(c), label: c.label || c.name })));
        setProducts((pRes?.data?.data || []).map((p) => ({
          id: idOf(p),
          label: p.name,
          hint: rupee(p.price),
          image: p.image || '',
          kind: 'product',
          group: p.categoryId?.label || p.categoryId?.name || 'Products',
          sizes: (p.sizes || []).map((s) => String(s.size || '').trim()).filter(Boolean)
        })));
        const addonList = Array.isArray(aRes?.data?.data) ? aRes.data.data : [];
        setAddons(addonList
          .filter((a) => !/crust/i.test(a.type || ''))
          .map((a) => {
            const price = (a.prices || []).find((x) => /^default$|^regular$/i.test(x.size)) || (a.prices || [])[0];
            return {
              id: idOf(a), label: a.name, hint: rupee(price?.price), type: a.type, image: a.image || '',
              kind: /topping/i.test(a.type || '') ? 'topping' : 'addon', group: a.type || 'Add-ons'
            };
          }));
      } catch (error) {
        console.error('Failed to load catalogue for cart config', error);
      }
    })();
  }, []);

  const setSection = (section, key, value) =>
    setConfig((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

  const addonTypeOptions = useMemo(
    () => [...new Set(addons.map((a) => String(a.type || '').trim()).filter(Boolean))].map((t) => ({ id: t, label: t })),
    [addons]
  );
  const offerProduct = products.find((p) => p.id === config.offer.productId);
  const offerAddon = addons.find((a) => a.id === config.offer.addonId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...config,
        upsell: { ...config.upsell, maxItems: Number(config.upsell.maxItems) || 8, minPastOrders: Number(config.upsell.minPastOrders) || 1 },
        offer: {
          ...config.offer,
          offerPrice: Number(config.offer.offerPrice) || 0,
          expiryMinutes: Number(config.offer.expiryMinutes) || 15,
          minCartValue: Number(config.offer.minCartValue) || 0
        }
      };
      const { data } = await adminClient.put('/settings/cart-config', payload);
      setConfig(normalize(data?.data || payload));
      toast.success('Cart settings saved successfully!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save cart settings');
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

  const { bottomBar, upsell, offer } = config;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Cart & Upsell</h1>
          <p className="text-sm text-gray-500 truncate">Bottom bar, “Complete your order” suggestions and the limited time offer</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#EE3A43] hover:bg-[#d92d36] text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 border-0 cursor-pointer shrink-0"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-left border cursor-pointer shrink-0 ${
                active ? 'bg-white border-[#EE3A43] shadow-sm' : 'bg-white/60 border-gray-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#EE3A43]' : 'text-gray-500'}`} />
              <span>
                <span className={`block text-sm font-semibold ${active ? 'text-[#EE3A43]' : 'text-gray-800'}`}>{t.label}</span>
                <span className="block text-xs text-gray-500">{t.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-5">
        {tab === 'bar' && (
          <Card title="Bottom bar" description="The View Cart bar appears on the menu as soon as a customer adds an item">
            <Toggle label="Show View Cart bar" description="Item count, total and View Cart button" checked={bottomBar.enabled} onChange={(v) => setSection('bottomBar', 'enabled', v)} />
            <Toggle label="Show “Complete your order” under the added pizza" description="Suggestions appear right below the pizza card the customer added" checked={bottomBar.showUpsell} onChange={(v) => setSection('bottomBar', 'showUpsell', v)} />
            <TextField label="Button text" value={bottomBar.ctaText} onChange={(v) => setSection('bottomBar', 'ctaText', v)} />
            <TextField label="Free delivery message" hint="Optional line above the button, e.g. Congratulations! FREE Delivery unlocked" value={bottomBar.freeDeliveryText} onChange={(v) => setSection('bottomBar', 'freeDeliveryText', v)} />
          </Card>
        )}

        {tab === 'upsell' && (() => {
          const catalogue = [...products, ...addons];
          const pickedIds = [...upsell.pinnedProductIds, ...upsell.pinnedAddonIds];
          const pickedItems = pickedIds.map((id) => catalogue.find((c) => c.id === id)).filter(Boolean);
          const togglePicked = (item) => {
            const key = item.kind === 'product' ? 'pinnedProductIds' : 'pinnedAddonIds';
            const list = upsell[key];
            setSection('upsell', key, list.includes(item.id) ? list.filter((x) => x !== item.id) : [...list, item.id]);
          };
          const manual = upsell.mode === 'manual';
          return (
            <>
              <div className="grid lg:grid-cols-2 gap-5">
                <Card title="Section" description="Used under added pizzas on the menu and on the cart page">
                  <Toggle label="Enable “Complete your order”" checked={upsell.enabled} onChange={(v) => setSection('upsell', 'enabled', v)} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <TextField label="Menu title" value={upsell.title} onChange={(v) => setSection('upsell', 'title', v)} />
                    <TextField label="Cart page title" value={upsell.cartTitle} onChange={(v) => setSection('upsell', 'cartTitle', v)} />
                    <TextField label="Max items shown" type="number" value={upsell.maxItems} onChange={(v) => setSection('upsell', 'maxItems', v)} />
                  </div>
                  <div className="space-y-3">
                    <Toggle label="Hide items already in cart" checked={upsell.hideItemsInCart} onChange={(v) => setSection('upsell', 'hideItemsInCart', v)} />
                    <Toggle label="Category chips on cart page" checked={upsell.showCategoryChips} onChange={(v) => setSection('upsell', 'showCategoryChips', v)} />
                  </div>
                </Card>

                <Card title="What should customers see?" description="You decide how recommendations are chosen">
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceTile icon={Wand2} title="Automatic" description="Smart rules + past orders" active={!manual} onClick={() => setSection('upsell', 'mode', 'auto')} />
                    <ChoiceTile icon={Hand} title="Hand-picked" description="Only items I choose" active={manual} onClick={() => setSection('upsell', 'mode', 'manual')} />
                  </div>
                  <UpsellPreview title={upsell.title} items={manual ? pickedItems : []} mode={upsell.mode} />
                </Card>
              </div>

              {manual ? (
                <Card title={`Choose items to recommend (${pickedItems.length} selected)`} description="Tap an item to add or remove it. Customers see them in this order, with items already in their cart hidden.">
                  <ItemPicker items={catalogue} selectedIds={pickedIds} onToggle={togglePicked} />
                  {pickedItems.length > 0 && (
                    <button type="button" onClick={() => { setSection('upsell', 'pinnedProductIds', []); setSection('upsell', 'pinnedAddonIds', []); }} className="text-xs font-semibold text-[#EE3A43] bg-transparent border-0 cursor-pointer p-0">
                      Clear selection
                    </button>
                  )}
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-5">
                  <Card title="Where suggestions come from" description="Tap to include or leave out">
                    <div className="grid grid-cols-3 gap-3">
                      <ChoiceTile icon={Pizza} title="Products" active={upsell.includeProducts} onClick={() => setSection('upsell', 'includeProducts', !upsell.includeProducts)} />
                      <ChoiceTile icon={Cookie} title="Add-ons" description="Dips, cheese" active={upsell.includeAddons} onClick={() => setSection('upsell', 'includeAddons', !upsell.includeAddons)} />
                      <ChoiceTile icon={Layers} title="Toppings" active={upsell.includeToppings} onClick={() => setSection('upsell', 'includeToppings', !upsell.includeToppings)} />
                    </div>
                    <ChipSelect label="Only these product categories" hint="None selected = all categories" options={categories} value={upsell.productCategoryIds} onChange={(v) => setSection('upsell', 'productCategoryIds', v)} />
                    <ChipSelect label="Only these add-on types" hint="None selected = all types" options={addonTypeOptions} value={upsell.addonTypes} onChange={(v) => setSection('upsell', 'addonTypes', v)} />
                  </Card>

                  <div className="space-y-5">
                    <Card title="Returning customers" description="New customers see your pinned items first, then a mix. Returning customers see what they and others usually order together.">
                      <Toggle label="Frequently bought together" description="Rank from past orders" checked={upsell.frequentlyBoughtEnabled} onChange={(v) => setSection('upsell', 'frequentlyBoughtEnabled', v)} />
                      <TextField label="Past orders needed" type="number" value={upsell.minPastOrders} onChange={(v) => setSection('upsell', 'minPastOrders', v)} />
                    </Card>
                    <Card title={`Pinned first (${pickedItems.length})`} description="Always shown to new customers before anything else">
                      <ItemPicker items={catalogue} selectedIds={pickedIds} onToggle={togglePicked} />
                    </Card>
                  </div>

                  <Card title="Never suggest" description="Hide specific items from recommendations">
                    <MultiPicker label="Products" options={products} value={upsell.excludeProductIds} onChange={(v) => setSection('upsell', 'excludeProductIds', v)} placeholder="Search products…" />
                    <MultiPicker label="Add-ons / toppings" options={addons} value={upsell.excludeAddonIds} onChange={(v) => setSection('upsell', 'excludeAddonIds', v)} placeholder="Search add-ons…" />
                  </Card>
                </div>
              )}
            </>
          );
        })()}

        {tab === 'offer' && (
          <>
            <Card title="Limited time offer" description="Customers slide a bar on the cart page to reveal one discounted item with a countdown">
              <Toggle label="Enable offer" checked={offer.enabled} onChange={(v) => setSection('offer', 'enabled', v)} />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="Slider text" value={offer.sliderText} onChange={(v) => setSection('offer', 'sliderText', v)} />
                <TextField label="Popup title" value={offer.modalTitle} onChange={(v) => setSection('offer', 'modalTitle', v)} />
                <TextField label="Button text" value={offer.buttonText} onChange={(v) => setSection('offer', 'buttonText', v)} />
                <TextField label="Expires after (minutes)" type="number" value={offer.expiryMinutes} onChange={(v) => setSection('offer', 'expiryMinutes', v)} />
                <TextField label="Minimum cart value (₹)" type="number" hint="0 = always available" value={offer.minCartValue} onChange={(v) => setSection('offer', 'minCartValue', v)} />
              </div>
            </Card>
            <Card title="Offer item" description="The item and the price it is sold at while the offer is live">
              <Field label="Item type">
                <select value={offer.itemType} onChange={(e) => setSection('offer', 'itemType', e.target.value)} className={inputCls}>
                  <option value="addon">Add-on / topping</option>
                  <option value="product">Product</option>
                </select>
              </Field>
              {offer.itemType === 'product' ? (
                <>
                  <Field label="Product">
                    <select value={offer.productId} onChange={(e) => setSection('offer', 'productId', e.target.value)} className={inputCls}>
                      <option value="">Select a product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </Field>
                  {offerProduct?.sizes?.length > 0 && (
                    <Field label="Size">
                      <select value={offer.sizeName} onChange={(e) => setSection('offer', 'sizeName', e.target.value)} className={inputCls}>
                        <option value="">Cheapest size</option>
                        {offerProduct.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  )}
                </>
              ) : (
                <Field label="Add-on">
                  <select value={offer.addonId} onChange={(e) => setSection('offer', 'addonId', e.target.value)} className={inputCls}>
                    <option value="">Select an add-on</option>
                    {addons.map((a) => <option key={a.id} value={a.id}>{a.label} ({a.type})</option>)}
                  </select>
                </Field>
              )}
              <TextField label="Offer price (₹)" type="number" value={offer.offerPrice} onChange={(v) => setSection('offer', 'offerPrice', v)} />
              {(offerProduct || offerAddon) && (
                <p className="text-xs text-gray-500">
                  Selected: <span className="font-semibold text-gray-700">{(offerProduct || offerAddon).label}</span> at {rupee(offer.offerPrice)}
                </p>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
