import React, { useState, useEffect } from "react";
import { Input } from "@food/components/ui/input";
import { Search, X } from "lucide-react";

export function SearchInput({ value, onChange, placeholder = "Search ingredients..." }) {
  const [localVal, setLocalVal] = useState(value);

  // Synchronize internal state with outer value changes (e.g. reset filter)
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  // Debouncing effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localVal !== value) {
        onChange(localVal);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localVal, onChange, value]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        className="h-9 px-9 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] bg-white dark:bg-zinc-900 w-full"
      />
      {localVal && (
        <button
          type="button"
          onClick={() => setLocalVal("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
