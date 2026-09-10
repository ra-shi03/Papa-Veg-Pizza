import React, { useMemo } from 'react';

export const formatKey = (key) => {
  if (!key) return '';
  // Convert camelCase or snake_case to Title Case with spaces
  const result = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export function ChangeSummaryTable({ oldVal, newVal, searchFilter = '' }) {
  const allKeys = useMemo(() => {
    const keys = new Set();
    if (oldVal && typeof oldVal === 'object') {
      Object.keys(oldVal).forEach(k => keys.add(k));
    }
    if (newVal && typeof newVal === 'object') {
      Object.keys(newVal).forEach(k => keys.add(k));
    }
    return Array.from(keys);
  }, [oldVal, newVal]);

  // Apply search filtering if provided
  const filteredKeys = useMemo(() => {
    if (!searchFilter.trim()) return allKeys;
    const query = searchFilter.toLowerCase();
    return allKeys.filter(key => {
      const label = formatKey(key).toLowerCase();
      const oldStr = String(oldVal && oldVal[key] !== undefined ? oldVal[key] : '').toLowerCase();
      const newStr = String(newVal && newVal[key] !== undefined ? newVal[key] : '').toLowerCase();
      return label.includes(query) || oldStr.includes(query) || newStr.includes(query);
    });
  }, [allKeys, oldVal, newVal, searchFilter]);

  if (allKeys.length === 0) {
    return (
      <div className="p-3 text-center text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        No properties modified in this log entry
      </div>
    );
  }

  if (filteredKeys.length === 0) {
    return (
      <div className="p-3 text-center text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        No properties matched "{searchFilter}"
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-[9px] font-black uppercase text-zinc-550 dark:text-zinc-400 tracking-wider border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="p-3 w-1/3">Property</th>
            <th className="p-3 text-red-500 w-1/3">Previous Value</th>
            <th className="p-3 text-emerald-600 w-1/3">Updated Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-250 dark:divide-zinc-800 font-semibold text-zinc-800 dark:text-zinc-200">
          {filteredKeys.map(key => {
            const oldRaw = oldVal ? oldVal[key] : undefined;
            const newRaw = newVal ? newVal[key] : undefined;

            const formatVal = (val) => {
              if (val === undefined || val === null) {
                return <span className="text-zinc-400 font-medium italic">(None)</span>;
              }
              if (typeof val === 'boolean') {
                return val ? (
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded text-[9px]">True</span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[9px]">False</span>
                );
              }
              if (Array.isArray(val)) {
                return val.join(', ');
              }
              if (typeof val === 'object') {
                return JSON.stringify(val);
              }
              // Format rupee symbol if key relates to amount/price/fees
              const keyLower = key.toLowerCase();
              if (typeof val === 'number' && (keyLower.includes('price') || keyLower.includes('fee') || keyLower.includes('threshold') || keyLower.includes('value'))) {
                return `₹${val.toLocaleString('en-IN')}`;
              }
              return String(val);
            };

            return (
              <tr key={key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                <td className="p-3 font-bold text-zinc-700 dark:text-zinc-350">{formatKey(key)}</td>
                <td className="p-3 font-mono text-[10px] text-red-500/70 line-through whitespace-pre-wrap">{formatVal(oldRaw)}</td>
                <td className="p-3 font-mono text-[10px] text-emerald-600 font-bold whitespace-pre-wrap">{formatVal(newRaw)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
