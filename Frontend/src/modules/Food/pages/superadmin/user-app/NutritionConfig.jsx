import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, Plus, Search, X, Pencil, Trash2, Apple, Wand2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';

// Super admin: everything the customer app's Nutrition Information page shows (page copy + one row per menu item).

const COMMON_ALLERGENS = ['Gluten', 'Dairy', 'Soy', 'Mustard', 'Nuts', 'Peanuts', 'Sesame', 'Celery'];
const CATEGORIES = ['Pizzas', 'Sides', 'Pasta', 'Burgers', 'Desserts', 'Beverages'];

const NUMBERS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Total carbs', unit: 'g' },
  { key: 'fiber', label: 'Dietary fiber', unit: 'g' },
  { key: 'sugars', label: 'Sugars', unit: 'g' },
  { key: 'totalFat', label: 'Total fat', unit: 'g' },
  { key: 'satFat', label: 'Saturated fat', unit: 'g' },
  { key: 'transFat', label: 'Trans fat', unit: 'g' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: '% DV' },
  { key: 'iron', label: 'Iron', unit: '% DV' }
];

const emptyItem = {
  name: '', description: '', category: 'Pizzas', image: '', productId: '', servingSize: '',
  ...Object.fromEntries(NUMBERS.map((n) => [n.key, ''])),
  allergens: [], isActive: true
};

const inputCls = 'mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE3A43]/30 focus:border-[#EE3A43]';
const idOf = (v) => String(v?._id || v || '');
const errorText = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || fallback;

function Card({ title, description, action, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-5 pt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 pt-4 pb-5">{children}</div>
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

function ItemEditor({ item, products, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...emptyItem, ...item, allergens: item.allergens || [] }));
  const [customAllergen, setCustomAllergen] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const isNew = !item._id;

  const linkProduct = (productId) => {
    const p = products.find((x) => x.id === productId);
    setForm((prev) => ({
      ...prev,
      productId,
      ...(p ? { name: prev.name || p.name, image: prev.image || p.image, description: prev.description || p.description } : {})
    }));
  };

  const toggleAllergen = (a) => set('allergens', form.allergens.includes(a) ? form.allergens.filter((x) => x !== a) : [...form.allergens, a]);
  const addCustomAllergen = () => {
    const a = customAllergen.trim();
    if (a && !form.allergens.some((x) => x.toLowerCase() === a.toLowerCase())) set('allergens', [...form.allergens, a]);
    setCustomAllergen('');
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    const payload = {
      name: form.name.trim(), description: form.description, category: form.category, image: form.image,
      productId: form.productId, servingSize: form.servingSize, allergens: form.allergens, isActive: form.isActive,
      ...Object.fromEntries(NUMBERS.map((n) => [n.key, Number(form[n.key]) || 0]))
    };
    setSaving(true);
    try {
      const { data } = isNew
        ? await adminClient.post('/settings/nutrition/items', payload)
        : await adminClient.put(`/settings/nutrition/items/${item._id}`, payload);
      toast.success(isNew ? 'Item added' : 'Item updated');
      onSaved(data?.data);
    } catch (error) {
      toast.error(errorText(error, 'Could not save the item'));
    } finally {
      setSaving(false);
    }
  };

  const allergenOptions = [...new Set([...COMMON_ALLERGENS, ...form.allergens])];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col"
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{isNew ? 'Add nutrition item' : `Edit ${item.name}`}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 border-0 bg-transparent cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <Field label="Menu product (optional)" hint="Links the row to a product and fills the name, image and description">
            <select value={form.productId} onChange={(e) => linkProduct(e.target.value)} className={inputCls}>
              <option value="">Not linked</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Paneer Tikka Pizza" required />
            </Field>
            <Field label="Category">
              <input list="nutrition-categories" value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls} placeholder="Pizzas" />
              <datalist id="nutrition-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Serving size">
              <input value={form.servingSize} onChange={(e) => set('servingSize', e.target.value)} className={inputCls} placeholder="1 slice (105g)" />
            </Field>
            <Field label="Image URL">
              <input value={form.image} onChange={(e) => set('image', e.target.value)} className={inputCls} placeholder="https://…" />
            </Field>
          </div>

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={inputCls} />
          </Field>

          <div>
            <p className="text-sm font-semibold text-gray-800">Per serving</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {NUMBERS.map((n) => (
                <label key={n.key} className="block">
                  <span className="text-xs font-medium text-gray-600">{n.label}</span>
                  <div className="relative">
                    <input
                      type="number" min="0" step="any" inputMode="decimal"
                      value={form[n.key]}
                      onChange={(e) => set(n.key, e.target.value)}
                      className={`${inputCls} pr-12`}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-[11px] text-gray-400">{n.unit}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">Allergens</p>
            <p className="text-xs text-gray-500">Customers can hide items that contain these</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {allergenOptions.map((a) => {
                const on = form.allergens.includes(a);
                return (
                  <button
                    key={a} type="button" onClick={() => toggleAllergen(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${on ? 'bg-[#EE3A43] text-white border-[#EE3A43]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={customAllergen}
                onChange={(e) => setCustomAllergen(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAllergen(); } }}
                className={`${inputCls} !mt-0`}
                placeholder="Other allergen"
              />
              <button type="button" onClick={addCustomAllergen} className="px-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer hover:bg-gray-50">Add</button>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4 accent-[#EE3A43]" />
            <span className="text-sm font-semibold text-gray-800">Show in the customer app</span>
          </label>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#EE3A43] text-white text-sm font-semibold border-0 cursor-pointer flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Add item' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NutritionConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState({ headline: '', intro: '', allergenNote: '', disclaimer: '' });
  const [savingPage, setSavingPage] = useState(false);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const { data } = await adminClient.get('/settings/nutrition/admin');
      setPage(data?.data?.page || page);
      setItems(data?.data?.items || []);
      setLoadError('');
    } catch (error) {
      setLoadError(errorText(error, 'Failed to load nutrition information'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    (async () => {
      try {
        const { data } = await adminClient.get('/food/admin/products/public');
        setProducts((data?.data || []).map((p) => ({ id: idOf(p), name: p.name, image: p.image || '', description: p.description || '' })));
      } catch (error) {
        console.error('Failed to load products for nutrition config', error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => [...new Set([...CATEGORIES, ...items.map((i) => i.category).filter(Boolean)])], [items]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => `${i.name} ${i.category}`.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const savePage = async () => {
    setSavingPage(true);
    try {
      const { data } = await adminClient.put('/settings/nutrition/page', page);
      setPage(data?.data || page);
      toast.success('Page text saved');
    } catch (error) {
      toast.error(errorText(error, 'Could not save the page text'));
    } finally {
      setSavingPage(false);
    }
  };

  const addStarter = async () => {
    setSeeding(true);
    try {
      const { data } = await adminClient.post('/settings/nutrition/items/starter', {});
      const added = data?.data?.added || 0;
      toast.success(added ? `${added} starter items added` : 'Starter items are already there');
      await load();
    } catch (error) {
      toast.error(errorText(error, 'Could not add starter items'));
    } finally {
      setSeeding(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      const { data } = await adminClient.put(`/settings/nutrition/items/${item._id}`, { isActive: !item.isActive });
      setItems((prev) => prev.map((i) => (i._id === item._id ? data.data : i)));
      toast.success(item.isActive ? 'Hidden from the app' : 'Shown in the app');
    } catch (error) {
      toast.error(errorText(error, 'Could not update the item'));
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from the nutrition page?`)) return;
    try {
      await adminClient.delete(`/settings/nutrition/items/${item._id}`);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      toast.success('Item deleted');
    } catch (error) {
      toast.error(errorText(error, 'Could not delete the item'));
    }
  };

  const onSaved = (saved) => {
    if (saved?._id) {
      setItems((prev) => (prev.some((i) => i._id === saved._id) ? prev.map((i) => (i._id === saved._id ? saved : i)) : [...prev, saved]));
    }
    setEditing(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#EE3A43]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <p className="text-sm text-red-600 font-semibold">{loadError}</p>
        <button onClick={() => { setIsLoading(true); load(); }} className="mt-3 px-4 py-2 rounded-lg bg-[#EE3A43] text-white text-sm font-semibold border-0 cursor-pointer">Try again</button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Nutrition Info</h1>
          <p className="text-sm text-gray-500 truncate">Calories, macros and allergens shown on the customer app's Nutrition Information page</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EE3A43] text-white text-sm font-semibold border-0 cursor-pointer hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <Card
          title="Page text"
          description="The heading and notes around the items"
          action={(
            <button onClick={savePage} disabled={savingPage} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer hover:bg-gray-50 disabled:opacity-60">
              {savingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save text
            </button>
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Heading">
              <input value={page.headline || ''} onChange={(e) => setPage({ ...page, headline: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Intro">
              <input value={page.intro || ''} onChange={(e) => setPage({ ...page, intro: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Allergen note" hint="Shown on every item">
              <textarea rows={2} value={page.allergenNote || ''} onChange={(e) => setPage({ ...page, allergenNote: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Daily value disclaimer" hint="Shown under the nutrition label">
              <textarea rows={2} value={page.disclaimer || ''} onChange={(e) => setPage({ ...page, disclaimer: e.target.value })} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card
          title={`Items (${items.length})`}
          description="Hidden items stay here but are not shown in the app"
          action={items.length > 0 && (
            <div className="relative w-56 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items" className={`${inputCls} !mt-0 pl-9`} />
            </div>
          )}
        >
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#EE3A43]/10 flex items-center justify-center">
                <Apple className="w-6 h-6 text-[#EE3A43]" />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">No nutrition items yet</p>
              <p className="text-sm text-gray-500">The customer app shows an empty page until you add some.</p>
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={addStarter} disabled={seeding} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer hover:bg-gray-50 disabled:opacity-60">
                  {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Add starter items
                </button>
                <button onClick={() => setEditing({})} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EE3A43] text-white text-sm font-semibold border-0 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add item
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                    <th className="px-5 py-2 font-semibold">Item</th>
                    <th className="px-3 py-2 font-semibold">Serving</th>
                    <th className="px-3 py-2 font-semibold text-right">Kcal</th>
                    <th className="px-3 py-2 font-semibold text-right">Protein</th>
                    <th className="px-3 py-2 font-semibold text-right">Carbs</th>
                    <th className="px-3 py-2 font-semibold text-right">Fat</th>
                    <th className="px-3 py-2 font-semibold">Allergens</th>
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item._id} className={`border-b border-gray-100 ${item.isActive ? '' : 'opacity-50'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {item.image
                            ? <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" />
                            : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Apple className="w-4 h-4 text-gray-400" /></div>}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category}{item.isActive ? '' : ' · Hidden'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{item.servingSize || '—'}</td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">{item.calories}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{item.protein}g</td>
                      <td className="px-3 py-3 text-right text-gray-600">{item.carbs}g</td>
                      <td className="px-3 py-3 text-right text-gray-600">{item.totalFat}g</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(item.allergens || []).map((a) => <span key={a} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">{a}</span>)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => toggleActive(item)} title={item.isActive ? 'Hide from app' : 'Show in app'} className="p-2 rounded-lg hover:bg-gray-100 border-0 bg-transparent cursor-pointer text-gray-500">
                            {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setEditing(item)} title="Edit" className="p-2 rounded-lg hover:bg-gray-100 border-0 bg-transparent cursor-pointer text-gray-500">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(item)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 border-0 bg-transparent cursor-pointer text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-500">No items match “{query}”</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {editing && (
        <ItemEditor
          item={editing}
          products={products}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
