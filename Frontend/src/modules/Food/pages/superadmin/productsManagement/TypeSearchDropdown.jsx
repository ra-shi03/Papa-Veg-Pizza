import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Tag, Plus, X } from "lucide-react";
import { adminClient } from "@/services/api/axios";
import { ICON_MAP } from "./AddTypeModal";

export default function TypeSearchDropdown({
  value,
  onChange,
  typesList = [],
  placeholder = "Select add-on type...",
  className = "",
  onSelectCrustHandTossed
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState(typesList || []);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typesList && typesList.length > 0) {
      setTypes(typesList);
    } else {
      setLoading(true);
      adminClient
        .get("/food/admin/addon-types")
        .then((res) => {
          if (res?.data?.success && Array.isArray(res.data.data)) {
            setTypes(res.data.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load types in dropdown:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [typesList]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredTypes = types.filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = (typeof t === "string" ? t : t.name || "").toLowerCase();
    const slug = (typeof t === "string" ? "" : t.slug || "").toLowerCase();
    const desc = (typeof t === "string" ? "" : t.description || "").toLowerCase();
    return name.includes(q) || slug.includes(q) || desc.includes(q);
  });

  const selectedTypeObj = types.find((t) => {
    const name = typeof t === "string" ? t : t.name;
    return (name || "").toLowerCase() === (value || "").toLowerCase();
  });

  const SelectedIcon =
    selectedTypeObj && typeof selectedTypeObj === "object" && selectedTypeObj.icon
      ? ICON_MAP[selectedTypeObj.icon] || Tag
      : Tag;

  const handleSelect = (typeName) => {
    onChange(typeName);
    setIsOpen(false);
    setSearch("");
    if (onSelectCrustHandTossed && (typeName || "").toLowerCase() === "crust") {
      onSelectCrustHandTossed();
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
          isOpen
            ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {value ? (
            <>
              {selectedTypeObj && typeof selectedTypeObj === "object" ? (
                <div
                  className={`p-1 rounded-md border shrink-0 ${
                    selectedTypeObj.color ||
                    "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30"
                  }`}
                >
                  <SelectedIcon size={13} className="stroke-[2.5]" />
                </div>
              ) : (
                <Tag size={13} className="text-zinc-400 shrink-0" />
              )}
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {value}
              </span>
            </>
          ) : (
            <span className="text-xs text-zinc-400 font-medium truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[var(--primary)]" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Types List */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1 divide-y divide-zinc-50 dark:divide-zinc-800/40">
            {loading ? (
              <div className="py-4 text-center text-xs text-zinc-400 font-medium">
                Loading types...
              </div>
            ) : filteredTypes.length > 0 ? (
              filteredTypes.map((t) => {
                const typeName = typeof t === "string" ? t : t.name;
                const isSelected = (value || "").toLowerCase() === (typeName || "").toLowerCase();
                const IconComponent =
                  typeof t === "object" && t.icon ? ICON_MAP[t.icon] || Tag : Tag;
                const color =
                  typeof t === "object" && t.color
                    ? t.color
                    : "text-indigo-500 bg-indigo-50 border-indigo-200";

                return (
                  <button
                    key={typeof t === "string" ? t : t._id || t.slug || typeName}
                    type="button"
                    onClick={() => handleSelect(typeName)}
                    className={`w-full px-3 py-2 flex items-center justify-between rounded-lg text-left transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-orange-50/70 dark:bg-orange-950/30 text-[var(--primary)] font-bold"
                        : "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`p-1 rounded-md border shrink-0 ${color}`}>
                        <IconComponent size={12} className="stroke-[2.5]" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold block leading-tight">{typeName}</span>
                        {typeof t === "object" && t.description && (
                          <span className="text-[10px] text-zinc-400 font-medium truncate block max-w-[200px]">
                            {t.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-[var(--primary)] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-zinc-400 mb-2">No existing types found for "{search}"</p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(search.trim())}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus size={12} />
                    Use "{search.trim()}" as custom type
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

