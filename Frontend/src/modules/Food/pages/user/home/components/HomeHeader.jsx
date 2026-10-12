import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { searchAPI } from '@/services/api';

const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http')) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5006/api/v1";
  const origin = apiBase.split('/api/v1')[0];
  return `${origin}${url.startsWith('/') ? url : '/' + url}`;
};

export function HomeHeader({ 
  deliveryAddress, 
  deliveryTime = 30, 
  deliveryLabel = 'mins', 
  categories = [],
  products = [],
  onSearchChange
}) {
  const navigate = useNavigate();

  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ dishes: [], categories: [] });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchContainerRef = useRef(null);

  // Debouncing method: 350ms delay
  useEffect(() => {
    if (!searchValue.trim()) {
      setDebouncedSearch('');
      setSearchResults({ dishes: [], categories: [] });
      setIsSearching(false);
      setIsDropdownOpen(false);
      onSearchChange?.('');
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Execute search when debounced value changes
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults({ dishes: [], categories: [] });
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    const executeSearch = async () => {
      setIsSearching(true);
      try {
        let apiDishes = [];
        try {
          const res = await searchAPI.unifiedSearch({ q: debouncedSearch, limit: 8 });
          if (res?.data?.success && res.data.data?.dishes) {
            apiDishes = res.data.data.dishes.map(d => ({
              id: d._id || d.id,
              title: d.matchedDish || d.name || d.title,
              price: d.price || (d.sizes && d.sizes[0]?.price) || 299,
              image: getMediaUrl(d.matchedDishImage || d.image || (Array.isArray(d.images) && d.images[0])),
              category: d.categoryName || d.category || 'Dish',
              restaurantName: d.restaurantName
            }));
          }
        } catch (_) {}

        const q = debouncedSearch.toLowerCase();
        const localMatches = (products || []).filter(p => 
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        ).map(p => ({
          id: p.id || p._id,
          title: p.title || p.name,
          price: p.price || 299,
          image: p.image || p.imageUrl,
          category: p.category || (categories.find(c => c.id === p.categoryId)?.label) || 'Dish'
        }));

        const combined = [...apiDishes];
        localMatches.forEach(lp => {
          if (!combined.some(c => c.title?.toLowerCase() === lp.title?.toLowerCase())) {
            combined.push(lp);
          }
        });

        const matchedCats = (categories || []).filter(c =>
          (c.label && c.label.toLowerCase().includes(q)) ||
          (c.name && c.name.toLowerCase().includes(q))
        );

        if (isMounted) {
          setSearchResults({ dishes: combined.slice(0, 8), categories: matchedCats });
          setIsDropdownOpen(true);
          onSearchChange?.(debouncedSearch);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    executeSearch();
    return () => { isMounted = false; };
  }, [debouncedSearch, products, categories]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = (searchValue || '').trim();
    if (!query) return;
    setIsDropdownOpen(false);
    navigate(`/food/user/search?q=${encodeURIComponent(query)}`);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setDebouncedSearch('');
    setSearchResults({ dishes: [], categories: [] });
    setIsDropdownOpen(false);
    onSearchChange?.('');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (categories && categories.length > 0) {
      const interval = setInterval(() => {
        setCurrentCatIndex(prev => (prev + 1) % categories.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [categories]);

  return (
    <div 
      className={`w-full pb-3 transition-all duration-300 ${isScrolled ? 'pt-3 shadow-md' : ''}`}
      style={{
        background: 'linear-gradient(to bottom, #B71C1C 0%, #E53935 100%)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ── TOP BAR ────────────────────────── */}
      <motion.div 
        initial={false}
        animate={{ height: isScrolled ? 0 : 'auto', opacity: isScrolled ? 0 : 1 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="w-full px-4 pt-4 pb-3 flex items-center justify-between">
        {/* Left: 30 MINS Block & Delivery Location */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {/* Minutes box (Domino's style dark box, adapted for red theme) */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="shrink-0 flex flex-col items-center justify-center rounded-xl"
            style={{
              width: 52,
              height: 48,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: 'none'
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF', fontFamily: 'Poppins,sans-serif', lineHeight: 1 }}>
              {deliveryTime ?? 30}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins,sans-serif', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: 2 }}>
              {deliveryLabel || 'mins'}
            </span>
          </motion.div>

          {/* Delivery Location Block */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
            className="flex flex-col min-w-0 cursor-pointer"
            onClick={() => navigate('/food/user/delivery-location')}
          >
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', fontFamily: 'Poppins,sans-serif' }}>Delivery at</span>
              <span className="truncate" style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', fontFamily: 'Poppins,sans-serif' }}>
                Home
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#FFFFFF' }}>expand_more</span>
            </div>
            <span className="truncate" style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins,sans-serif' }}>
              {deliveryAddress || 'Select Location'}
            </span>
          </motion.div>
        </div>

        {/* Right: Profile */}
        <div className="flex items-center shrink-0 pl-2">
          {/* Profile */}
          <button
            onClick={() => navigate('/user/profile/create')}
            className="flex items-center justify-center rounded-full border-0 outline-none cursor-pointer"
            style={{
              width: 40, height: 40,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            aria-label="Profile"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#FFFFFF' }}>
              person
            </span>
          </button>
        </div>
        </div>
      </motion.div>

      {/* ── SEARCH BAR + TRAIN BUTTON ── */}
      <div className="px-4 flex items-center gap-2">
        <div className="relative flex-1" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            {/* Search icon */}
            <span
              className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
              style={{ left: 14, fontSize: 20, color: 'var(--muted-gray)' }}
            >
              search
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (debouncedSearch) setIsDropdownOpen(true);
              }}
              onBlur={() => setIsFocused(false)}
              className="w-full border-0 outline-none relative z-10 bg-transparent"
              style={{
                height: 48,
                paddingLeft: 42,
                paddingRight: searchValue ? 40 : 16,
                fontSize: 14,
                fontFamily: 'Poppins,sans-serif',
                fontWeight: 500,
                color: 'var(--primary-gray)'
              }}
            />

            {/* Clear Button */}
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

            {/* Background and dynamic placeholder overlay */}
            <div 
              className="absolute inset-0 pointer-events-none flex items-center overflow-hidden"
              style={{
                borderRadius: 12,
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                paddingLeft: 42,
                paddingRight: 16,
              }}
            >
              {(!isFocused && !searchValue) && (
                <div className="flex items-center gap-1.5 text-[14px] font-medium text-gray-400 w-full" style={{ fontFamily: 'Poppins,sans-serif' }}>
                  <span className="shrink-0">Search for</span>
                  <div className="flex-1 overflow-hidden relative h-5">
                    <AnimatePresence mode="wait">
                      {categories && categories.length > 0 ? (
                        <motion.span
                          key={currentCatIndex}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="font-bold text-gray-700 truncate absolute left-0"
                        >
                          {categories[currentCatIndex]?.label || categories[currentCatIndex]?.name || 'Pizza'}
                        </motion.span>
                      ) : (
                        <span className="font-bold text-gray-700 truncate absolute left-0">Pizza</span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* ── DEBOUNCED SEARCH DROPDOWN ── */}
          <AnimatePresence>
            {isDropdownOpen && (debouncedSearch || isSearching) && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden"
                style={{
                  boxShadow: '0 12px 36px -4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {/* Searching state */}
                {isSearching ? (
                  <div className="flex items-center justify-center gap-2.5 py-7 text-sm text-zinc-500 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin text-[#E53935]" />
                    <span>Searching for "{searchValue}"...</span>
                  </div>
                ) : (
                  <>
                    {/* Matching Categories */}
                    {searchResults.categories && searchResults.categories.length > 0 && (
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                          Categories
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {searchResults.categories.map((cat) => (
                            <button
                              key={cat.id || cat._id}
                              type="button"
                              onClick={() => {
                                setIsDropdownOpen(false);
                                navigate(`/food/user/category/${cat.id || cat.slug || encodeURIComponent(cat.label)}`);
                              }}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-[#B71C1C] dark:text-red-400 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 active:scale-95"
                            >
                              <span>{cat.label || cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Dishes */}
                    {searchResults.dishes && searchResults.dishes.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {searchResults.dishes.map((dish) => (
                          <div
                            key={dish.id}
                            onClick={() => {
                              setIsDropdownOpen(false);
                              if (dish.id) {
                                navigate(`/food/user/product/${dish.id}`);
                              } else {
                                navigate(`/food/user/menu`);
                              }
                            }}
                            className="p-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                          >
                            <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-center">
                              {dish.image ? (
                                <img
                                  src={dish.image}
                                  alt={dish.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <span className="material-symbols-outlined text-zinc-400 text-lg">fastfood</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#B71C1C] transition-colors">
                                {dish.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-extrabold text-[#B71C1C] dark:text-red-400">
                                  ₹{dish.price}
                                </span>
                                {dish.category && (
                                  <span className="text-[10px] text-zinc-400 font-medium truncate">
                                    • {dish.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-zinc-300 group-hover:text-[#B71C1C] text-base transition-colors">
                              chevron_right
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (!searchResults.categories || searchResults.categories.length === 0) && (
                        <div className="py-6 px-4 text-center">
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            No items found for "{debouncedSearch}"
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Press Enter or explore our menu
                          </p>
                        </div>
                      )
                    )}

                    {/* Footer View All Results */}
                    <div
                      onClick={handleSearchSubmit}
                      className="p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-bold text-[#B71C1C] dark:text-red-400 flex items-center gap-1.5 truncate">
                        <span>View all results for "{debouncedSearch || searchValue}"</span>
                      </span>
                      <ArrowRight size={14} className="text-[#B71C1C] dark:text-red-400 shrink-0" />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Deliver on Train Button */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.button
              initial={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0, marginLeft: -8 }}
              animate={{ width: 'auto', opacity: 1, paddingLeft: 12, paddingRight: 12, marginLeft: 0 }}
              exit={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0, marginLeft: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onClick={() => navigate('/food/user/delivery-location', { state: { activeService: 'train' } })}
              className="flex items-center gap-1.5 shrink-0 border-0 outline-none cursor-pointer overflow-hidden whitespace-nowrap"
              style={{
                height: 48,
                borderRadius: 12,
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 22, color: 'var(--primary-gray)' }}>
                train
              </span>
              <span className="flex flex-col text-left shrink-0" style={{ lineHeight: 1.1 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--primary-gray)', fontFamily: 'Poppins,sans-serif' }}>Deliver</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-gray)', fontFamily: 'Poppins,sans-serif' }}>on Train</span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
