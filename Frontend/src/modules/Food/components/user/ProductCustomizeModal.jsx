import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import apiClient from '@/services/api/axios';

const DEFAULT_CRUST_OPTIONS = [
  {
    name: "New Hand Tossed",
    description: "Fresh Dough, Flavourful Edges",
    price: 0,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=120&auto=format&fit=crop&q=80"
  },
  {
    name: "Fresh Garlic Crust",
    description: "Fresh Dough, Flavourful Edges",
    price: 20,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&auto=format&fit=crop&q=80"
  },
  {
    name: "Thin Crust",
    description: "Fresh Dough, Flavourful Edges",
    price: 20,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&auto=format&fit=crop&q=80"
  },
  {
    name: "Herby Crust",
    description: "Fresh Dough, Flavourful Edges",
    price: 20,
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=120&auto=format&fit=crop&q=80"
  }
];

export default function ProductCustomizeModal({
  isOpen,
  onClose,
  item,
  onAddToCart,
  allAddons = [],
  isDarkMode = false
}) {
  const [addonsList, setAddonsList] = useState(allAddons);
  const [selectedSizeOption, setSelectedSizeOption] = useState({ name: "Regular", price: 299, description: "Serves 1 person only" });
  const [selectedCrust, setSelectedCrust] = useState("New Hand Tossed");
  const [selectedToppingsList, setSelectedToppingsList] = useState([]);
  const [selectedMealOptions, setSelectedMealOptions] = useState([]);
  const [selectedExtraCheese, setSelectedExtraCheese] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Fetch public addons if not provided
  useEffect(() => {
    if (allAddons && allAddons.length > 0) {
      setAddonsList(allAddons);
      return;
    }
    const fetchAddons = async () => {
      try {
        const stored = localStorage.getItem('pvp_addons');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAddonsList(parsed);
          }
        }
        const res = await apiClient.get('/food/admin/addons/public');
        const data = res?.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setAddonsList(data);
        }
      } catch (_) {}
    };
    if (isOpen) {
      fetchAddons();
    }
  }, [isOpen, allAddons]);

  // Normalize product sizes
  const parsedSizes = useMemo(() => {
    if (!item) return [{ name: "Regular", size: "Regular", price: 299, description: "Serves 1 person only" }];

    const rawProduct = item.rawProduct || item;
    const rawSizes = rawProduct.sizes || item.sizes;

    if (Array.isArray(rawSizes) && rawSizes.length > 0) {
      return rawSizes.map((s, idx) => {
        const sizeName = typeof s === 'string' ? s : (s.name || s.size || (idx === 0 ? 'Regular' : idx === 1 ? 'Medium' : 'Large'));
        const sizePrice = typeof s === 'string' ? Number(item.price) || 0 : (Number(s.price) || Number(item.price) || 0);
        const sizeOriginalPrice = typeof s === 'string' ? null : (Number(s.originalPrice) || Number(s.mrp) || null);
        const sizeSaveAmount = typeof s === 'string' ? 0 : (Number(s.saveAmount) || (sizeOriginalPrice > sizePrice ? sizeOriginalPrice - sizePrice : 0));
        const sizeDesc = (typeof s === 'object' && s.description) ? s.description : `${sizeName} Size`;
        return {
          name: sizeName,
          size: sizeName,
          price: sizePrice,
          originalPrice: (sizeOriginalPrice && sizeOriginalPrice > sizePrice) ? sizeOriginalPrice : null,
          saveAmount: sizeSaveAmount,
          description: sizeDesc
        };
      });
    }

    // Fallback: derive 3 standard sizes based on base price
    const base = Number(item.price) || 299;
    return [
      { name: "Regular", size: "Regular", price: base, originalPrice: item.originalPrice || null, saveAmount: item.saveAmount || 0, description: "Regular Size" },
      { name: "Medium", size: "Medium", price: Math.round(base * 1.74), originalPrice: null, saveAmount: 0, description: "Medium Size" },
      { name: "Large", size: "Large", price: Math.round(base * 2.1), originalPrice: null, saveAmount: 0, description: "Large Size" }
    ];
  }, [item]);

  // Reset state on open or item change
  useEffect(() => {
    if (isOpen && item) {
      document.body.style.overflow = 'hidden';
      const initialSize = parsedSizes[0] || { name: "Regular", price: Number(item.price) || 299, description: "Serves 1 person only" };
      setSelectedSizeOption(initialSize);
      setSelectedCrust(item.defaultCrust || item.crust || "New Hand Tossed");
      setSelectedToppingsList([]);
      setSelectedMealOptions([]);
      setSelectedExtraCheese(false);
      setQuantity(1);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, item, parsedSizes]);

  // Assigned Addons
  const currentItemAddons = useMemo(() => {
    if (!item) return [];
    const raw = item.rawProduct || item;
    const tops = raw.toppings || item.toppings || [];
    if (!Array.isArray(tops) || tops.length === 0) return [];

    return tops.map(t => {
      if (typeof t === 'object' && t && (t._id || t.name)) return t;
      const found = (addonsList || []).find(a => (a._id === t || a.id === t || a.name === t));
      return found || (typeof t === 'string' ? { _id: t, name: t, type: 'topping', prices: [] } : t);
    }).filter(Boolean);
  }, [item, addonsList]);

  // Helper to get size-adjusted addon price
  const getAddonPriceForSize = (addon, sizeName = "Regular") => {
    if (!addon) return 0;
    const isHandTossed = addon.isDefault ||
      (addon.name || '').toLowerCase().includes('hand tossed') ||
      addon.name === (item?.defaultCrust || 'New Hand Tossed');
    if (isHandTossed) return 0;

    if (Array.isArray(addon.prices) && addon.prices.length > 0) {
      const matched = addon.prices.find(p => (p.size || '').toLowerCase() === (sizeName || '').toLowerCase());
      if (matched && typeof matched.price === 'number') return matched.price;
      return Number(addon.prices[0].price) || 0;
    }
    const basePrice = Number(addon.price) || 20;
    if ((sizeName || '').toLowerCase().includes('med')) return basePrice > 0 ? basePrice + 10 : 0;
    if ((sizeName || '').toLowerCase().includes('large')) return basePrice > 0 ? basePrice + 20 : 0;
    return basePrice;
  };

  // Available crusts
  const currentItemCrusts = useMemo(() => {
    if (!item || item.showCrust === false) return [];
    const raw = item.rawProduct || item;

    let crusts = [];
    if (Array.isArray(raw.crusts) && raw.crusts.length > 0) {
      crusts = raw.crusts
        .map(c => (typeof c === 'object' && c ? c : (addonsList || []).find(a => (a._id === c || a.id === c))))
        .filter(Boolean);
    }

    if (crusts.length === 0) {
      const fromProduct = currentItemAddons.filter(a => (a.type || '').toLowerCase().includes('crust'));
      if (fromProduct.length > 0) crusts = fromProduct;
    }

    if (crusts.length === 0) {
      const dbCrusts = (addonsList || []).filter(a => (a.type || '').toLowerCase().includes('crust'));
      if (dbCrusts.length > 0) {
        crusts = dbCrusts;
      } else {
        crusts = DEFAULT_CRUST_OPTIONS;
      }
    }

    const defaultCrustName = (item?.defaultCrust || "New Hand Tossed").toLowerCase();
    return [...crusts].sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();
      const aIsDefault = a.isDefault || aName === defaultCrustName || aName.includes("hand tossed");
      const bIsDefault = b.isDefault || bName === defaultCrustName || bName.includes("hand tossed");
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      return 0;
    });
  }, [item, currentItemAddons, addonsList]);

  // Available toppings
  const currentItemToppings = useMemo(() => {
    return currentItemAddons.filter(a => (a.type || '').toLowerCase().includes('topping'));
  }, [currentItemAddons]);

  // Available dips
  const currentItemDips = useMemo(() => {
    return currentItemAddons.filter(a => !(a.type || '').toLowerCase().includes('crust') && !(a.type || '').toLowerCase().includes('topping'));
  }, [currentItemAddons]);

  // Calculate dynamic total price
  const calculateTotalPrice = () => {
    if (!item) return 0;
    let base = Number(selectedSizeOption.price) || Number(item.price) || 0;

    // Crust price
    const matchedCrust = currentItemCrusts.find(c => c.name === selectedCrust);
    if (matchedCrust) {
      base += getAddonPriceForSize(matchedCrust, selectedSizeOption.name);
    }

    // Extra cheese
    if (selectedExtraCheese) {
      const cheeseAddon = (addonsList || []).find(a => (a.name || '').toLowerCase().includes('extra cheese'));
      base += cheeseAddon ? getAddonPriceForSize(cheeseAddon, selectedSizeOption.name) : 50;
    }

    // Toppings
    selectedToppingsList.forEach(tName => {
      const matched = currentItemToppings.find(t => t.name === tName);
      if (matched) {
        base += getAddonPriceForSize(matched, selectedSizeOption.name);
      } else {
        base += 45;
      }
    });

    // Dips
    selectedMealOptions.forEach(dName => {
      const matched = currentItemDips.find(d => d.name === dName);
      if (matched) {
        base += getAddonPriceForSize(matched, selectedSizeOption.name);
      } else {
        base += 30;
      }
    });

    return base * (quantity || 1);
  };

  const handleAddCustomized = () => {
    if (!item) return;
    const toppingsKey = selectedToppingsList.sort().join("-");
    const mealsKey = selectedMealOptions.sort().join("-");
    const customizedKey = `${item.id}-${selectedSizeOption.name}-${selectedCrust}-${selectedExtraCheese ? 'cheese' : 'no'}-${toppingsKey}-${mealsKey}`;

    const customizedDetails = {
      ...item,
      id: item.id,
      customizedKey,
      title: `${item.title || item.name} (${selectedSizeOption.name})`,
      price: calculateTotalPrice() / (quantity || 1),
      description: `Size: ${selectedSizeOption.name}${selectedCrust ? ', Crust: ' + selectedCrust : ''}${selectedToppingsList.length > 0 ? ', Toppings: ' + selectedToppingsList.join(', ') : ''}${selectedMealOptions.length > 0 ? ', Extras: ' + selectedMealOptions.join(', ') : ''}`,
      customized: true,
      selectedSize: selectedSizeOption.name,
      toppings: selectedToppingsList,
      meals: selectedMealOptions,
      crust: selectedCrust,
      extraCheese: selectedExtraCheese
    };

    if (onAddToCart) {
      onAddToCart(customizedDetails, quantity);
    }
    onClose();
  };

  if (!isOpen || !item) return null;

  const itemTitle = (item.title || item.name || '').toUpperCase();
  const toppingsDesc = item.toppingsSummary || item.description || (item.rawProduct && item.rawProduct.description) || "Toppings: Mozzarella Cheese • Fresh Herbs";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white dark:bg-[#18181a] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transition-colors duration-300 font-['Poppins',sans-serif] animate-slide-up">
        
        {/* Header: Sticky Top with Veg Icon, Title, Toppings summary, and Close button */}
        <div className="bg-white dark:bg-[#1f1f22] px-5 py-4 flex items-start justify-between border-b border-zinc-200/70 dark:border-white/5 shrink-0">
          <div className="flex items-start gap-2.5 text-left min-w-0 pr-2">
            <span className="w-4 h-4 border-[1.5px] border-emerald-600 p-[1.5px] rounded-[3px] flex items-center justify-center bg-transparent shrink-0 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-zinc-900 dark:text-white truncate">
                {itemTitle}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 font-medium">
                {toppingsDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer bg-transparent border-0 outline-none transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left scrollbar-none">
          
          {/* 1. Change Size Section (Reference Image 3: side-by-side selectable cards with checkmarks & discounts) */}
          {parsedSizes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2.5">
                Change Size
              </h4>
              <div className={`grid ${parsedSizes.length > 2 ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
                {parsedSizes.map(sizeObj => {
                  const isSelected = selectedSizeOption.name === sizeObj.name;
                  const hasDiscount = sizeObj.originalPrice && Number(sizeObj.originalPrice) > Number(sizeObj.price);
                  const savings = sizeObj.saveAmount || (hasDiscount ? Number(sizeObj.originalPrice) - Number(sizeObj.price) : 0);

                  return (
                    <div
                      key={sizeObj.name}
                      onClick={() => setSelectedSizeOption(sizeObj)}
                      className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-zinc-800 dark:border-white bg-zinc-50/80 dark:bg-zinc-800/60 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      {/* Checkmark circle badge */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#0066CC] dark:bg-[#3B82F6] text-white flex items-center justify-center shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-zinc-900 dark:text-white">
                          {sizeObj.name}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                            ₹{sizeObj.price}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-zinc-400 line-through">
                              ₹{sizeObj.originalPrice}
                            </span>
                          )}
                        </div>
                        {hasDiscount && savings > 0 && (
                          <span className="inline-block mt-1 bg-[#169B45] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
                            Save ₹{savings}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-tight">
                        {sizeObj.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Change Crust Section (Image 3: crust cards with image, desc, size-based price and checkmark) */}
          {currentItemCrusts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2.5">
                Change Crust
              </h4>
              <div className="space-y-2.5">
                {currentItemCrusts.map(crust => {
                  const isSelected = selectedCrust === crust.name;
                  const crustPrice = getAddonPriceForSize(crust, selectedSizeOption.name);
                  const crustImg = crust.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80";

                  return (
                    <div
                      key={crust.name || crust._id}
                      onClick={() => setSelectedCrust(crust.name)}
                      className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? "border-zinc-800 dark:border-white bg-zinc-50/80 dark:bg-zinc-800/60 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <img 
                        src={crustImg} 
                        alt={crust.name} 
                        className="w-12 h-12 rounded-xl object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                          {crust.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight line-clamp-1">
                          {crust.description || (crust.name.includes("Burst") ? "Crust overflowing with molten liquid..." : "Fresh Dough, Flavourful Edges")}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end justify-center min-w-[48px]">
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#0066CC] dark:bg-[#3B82F6] text-white flex items-center justify-center shadow-xs mb-1">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                        <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                          {crustPrice > 0 ? `+ ₹${crustPrice}` : "₹0"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Customizable Toppings Section */}
          {currentItemToppings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Toppings
                </h4>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {selectedToppingsList.length > 0 ? `${selectedToppingsList.length} selected` : "Optional add-ons"}
                </span>
              </div>
              <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-3 shadow-xs border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {currentItemToppings.map(top => {
                  const isSelected = selectedToppingsList.includes(top.name);
                  const topPrice = getAddonPriceForSize(top, selectedSizeOption.name);

                  return (
                    <div
                      key={top.name || top._id}
                      onClick={() => {
                        setSelectedToppingsList(prev => 
                          prev.includes(top.name)
                            ? prev.filter(t => t !== top.name)
                            : [...prev, top.name]
                        );
                      }}
                      className="flex items-center justify-between cursor-pointer py-2.5 first:pt-1 last:pb-1 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-3.5 h-3.5 border-[1.5px] border-emerald-600 p-[1.5px] rounded-[3px] flex items-center justify-center bg-transparent shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                        </span>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {top.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          + ₹{topPrice}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? "bg-[#0066CC] dark:bg-[#3B82F6] border-[#0066CC] dark:border-[#3B82F6] text-white" 
                            : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400"
                        }`}>
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Dips & Extras Section */}
          {currentItemDips.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Dips & Extras
                </h4>
              </div>
              <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-3 shadow-xs border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {currentItemDips.map(dip => {
                  const isSelected = selectedMealOptions.includes(dip.name);
                  const dipPrice = getAddonPriceForSize(dip, selectedSizeOption.name);

                  return (
                    <div
                      key={dip.name || dip._id}
                      onClick={() => {
                        setSelectedMealOptions(prev =>
                          prev.includes(dip.name)
                            ? prev.filter(d => d !== dip.name)
                            : [...prev, dip.name]
                        );
                      }}
                      className="flex items-center justify-between cursor-pointer py-2.5 first:pt-1 last:pb-1 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {dip.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          + ₹{dipPrice}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? "bg-[#0066CC] dark:bg-[#3B82F6] border-[#0066CC] dark:border-[#3B82F6] text-white" 
                            : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400"
                        }`}>
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Sticky Bottom Footer (matching Image 3) */}
        <div className="bg-white dark:bg-[#1f1f22] p-4 border-t border-zinc-200/80 dark:border-white/5 shrink-0 space-y-2">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 text-left truncate font-medium">
            {selectedSizeOption.name} {selectedCrust ? `| ${selectedCrust}` : ""}
            {selectedToppingsList.length > 0 && ` • ${selectedToppingsList.length} Toppings`}
          </div>
          <button
            type="button"
            onClick={handleAddCustomized}
            className="w-full h-12 bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.99] text-white font-semibold text-sm tracking-wide rounded-xl shadow-lg shadow-[#E53935]/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none border-0"
          >
            <span>₹{calculateTotalPrice()}</span>
            <span className="opacity-60">|</span>
            <span>Add</span>
            <span className="text-base leading-none font-semibold">+</span>
          </button>
        </div>

      </div>
    </div>
  );
}

