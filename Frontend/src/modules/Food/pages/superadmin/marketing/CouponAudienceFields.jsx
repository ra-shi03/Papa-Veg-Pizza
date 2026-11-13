import React, { useMemo } from 'react';
import { Check } from 'lucide-react';

export const USER_TYPES = [
  { value: 'all', label: 'All Users', hint: 'Every customer can use it' },
  { value: 'new', label: 'New Users', hint: 'Only customers with no earlier order' },
  { value: 'old', label: 'Old Users', hint: 'Only customers who have ordered before' },
];

// The pizza sizes the super admin sets on a product (Product Management > Add Product: Regular / Medium / Large).
// Other size labels in the data (Half, Full, Single, Double, extra-cheese options...) belong to sides and add-ons.
export const PIZZA_SIZES = ['Regular', 'Medium', 'Large'];

const sizeOptions = (products, selected) => {
  const sold = new Set();
  (products || []).forEach((p) =>
    (Array.isArray(p.sizes) ? p.sizes : []).forEach((s) => sold.add(String(typeof s === 'string' ? s : s?.size || '').trim().toLowerCase())),
  );
  // Only sizes that at least one product is sold in; before products load, offer all of them.
  const list = PIZZA_SIZES.filter((size) => sold.size === 0 || sold.has(size.toLowerCase()));
  // keep a size already saved on the coupon so it can still be seen and removed
  (selected || []).forEach((size) => {
    if (!list.some((x) => x.toLowerCase() === String(size).toLowerCase())) list.push(size);
  });
  return list;
};

/** "Who can use it" and "pizza size" rules of a coupon (Applicability step, shared by Create and Edit). */
export default function CouponAudienceFields({ userType, setUserType, applicableSizes, setApplicableSizes, products }) {
  const options = useMemo(() => sizeOptions(products, applicableSizes), [products, applicableSizes]);
  const isOn = (size) => applicableSizes.some((s) => s.toLowerCase() === size.toLowerCase());
  const toggle = (size) =>
    setApplicableSizes((prev) => (isOn(size) ? prev.filter((s) => s.toLowerCase() !== size.toLowerCase()) : [...prev, size]));

  return (
    <div className="space-y-5 pt-5 border-t border-zinc-200 dark:border-zinc-800">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Who can use this coupon</label>
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md">
          {USER_TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setUserType(t.value)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                userType === t.value
                  ? 'bg-white dark:bg-zinc-800 text-[var(--primary)] shadow-sm'
                  : 'text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-250'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">{USER_TYPES.find((t) => t.value === userType)?.hint}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Pizza size</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setApplicableSizes([])}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              applicableSizes.length === 0
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-black dark:text-white'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            All sizes
          </button>
          {options.map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => toggle(size)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isOn(size)
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-black dark:text-white'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850'
              }`}
            >
              {isOn(size) && <Check size={12} className="text-[var(--primary)]" />}
              {size}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">
          {applicableSizes.length === 0
            ? 'The discount works on every size.'
            : `The discount is worked out only on ${applicableSizes.join(' / ')} pizzas in the cart.`}
        </p>
      </div>
    </div>
  );
}
