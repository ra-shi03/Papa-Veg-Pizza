import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { adminAPI } from '@food/api';

// Fees the customer is charged on every order, and the cancellation policy. The server applies exactly these values.
const FIELDS = [
  { key: 'handlingFee', label: 'Handling charge (₹)', hint: 'Flat amount added to every order. GST is charged on it.' },
  { key: 'platformFee', label: 'Platform fee (₹)', hint: 'Flat amount added to every order.' },
  { key: 'packagingFee', label: 'Packaging fee (₹)', hint: 'Flat amount added to every order.' },
  { key: 'deliveryFee', label: 'Delivery fee (₹)', hint: 'Used when no distance range below matches.' },
  { key: 'freeDeliveryThreshold', label: 'Free delivery above (₹)', hint: 'Order subtotal at or above this ships free. 0 turns it off.' },
  { key: 'gstRate', label: 'GST (%)', hint: 'Total rate; shown to customers split equally into CGST and SGST.' },
  { key: 'cancellationFee', label: 'Cancellation fee (₹)', hint: 'Kept from prepaid orders cancelled after the free window. Cash orders are never charged.' },
  { key: 'cancellationFreeMinutes', label: 'Free cancellation window (minutes)', hint: 'Cancelling within this time after ordering costs nothing.' },
];

const blank = Object.fromEntries(FIELDS.map((f) => [f.key, '']));

export default function FeesAndCharges() {
  const [values, setValues] = useState(blank);
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.getFeeSettings()
      .then((res) => {
        const doc = res?.data?.data?.feeSettings;
        if (doc) {
          setValues(Object.fromEntries(FIELDS.map((f) => [f.key, doc[f.key] ?? ''])));
          setRanges(doc.deliveryFeeRanges || []);
        }
      })
      .catch(() => toast.error('Could not load fee settings'))
      .finally(() => setLoading(false));
  }, []);

  const updateRange = (i, key, value) => setRanges((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));

  const save = async () => {
    setSaving(true);
    try {
      const body = Object.fromEntries(FIELDS.map((f) => [f.key, values[f.key] === '' ? null : Number(values[f.key])]));
      body.deliveryFeeRanges = ranges.map((r) => ({ min: Number(r.min), max: Number(r.max), fee: Number(r.fee) }));
      await adminAPI.createOrUpdateFeeSettings(body);
      toast.success('Fees saved. New orders use them immediately.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save fee settings');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-black dark:text-zinc-100';

  return (
    <div className="p-3 md:p-4 pb-16 max-w-[900px] mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4">
      <div>
        <h1 className="text-lg font-bold text-black dark:text-zinc-100">Fees &amp; Charges</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">What customers pay on top of the food, and the cancellation policy. Existing orders keep the cancellation policy they were placed under.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs font-semibold text-black dark:text-zinc-100">{f.label}</span>
            <input type="number" min="0" step="any" disabled={loading} className={input} value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            <span className="text-[11px] text-zinc-500">{f.hint}</span>
          </label>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-black dark:text-zinc-100">Delivery fee by distance (km)</span>
          <button type="button" className="text-xs font-semibold text-primary" onClick={() => setRanges((r) => [...r, { min: '', max: '', fee: '' }])}>+ Add range</button>
        </div>
        {ranges.map((r, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            {['min', 'max', 'fee'].map((k) => (
              <input key={k} type="number" min="0" step="any" placeholder={k === 'fee' ? 'Fee ₹' : `${k} km`} className={input}
                value={r[k]} onChange={(e) => updateRange(i, k, e.target.value)} />
            ))}
            <button type="button" className="text-xs text-rose-600" onClick={() => setRanges((rows) => rows.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={save} disabled={saving || loading}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60">
        <Save size={16} /> {saving ? 'Saving…' : 'Save fees'}
      </button>
    </div>
  );
}
