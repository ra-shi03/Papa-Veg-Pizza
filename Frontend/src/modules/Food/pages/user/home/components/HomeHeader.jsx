import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';

export function HomeHeader({ 
  deliveryAddress, 
  deliveryTime = 30, 
  deliveryLabel = 'mins', 
  categories = [],
  searchValue: propSearchValue = '',
  onSearchChange,
  onClearSearch,
  onOpenSidebar
}) {
  const navigate = useNavigate();

  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState(propSearchValue || '');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setSearchValue(propSearchValue || '');
  }, [propSearchValue]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange?.(val);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearchChange?.('');
    onClearSearch?.();
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
  };

  const handleNavigateToSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    let target = '/user/search';
    if (window.location.pathname.startsWith('/food') && !target.startsWith('/food')) {
      target = `/food${target}`;
    }
    navigate(target);
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

  const searchInputRef = useRef(null);
  const isSearchActive = Boolean(searchValue && searchValue.trim());

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      const len = searchInputRef.current.value.length;
      searchInputRef.current.focus();
      try {
        searchInputRef.current.setSelectionRange(len, len);
      } catch (_) {}
    }
  }, [isSearchActive]);

  return (
    <div 
      className={`w-full transition-all duration-300 ${
        isSearchActive 
          ? 'py-2 shadow-xs bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800' 
          : (isScrolled ? 'pt-3 pb-3 shadow-md' : 'pb-3')
      }`}
      style={{
        background: isSearchActive ? undefined : 'linear-gradient(to bottom, #B71C1C 0%, #E53935 100%)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {isSearchActive ? (
        /* ── SEARCH HEADER MATCHING IMAGE 2 ── */
        <div className="w-full px-3 py-1 flex items-center gap-2.5">
          {/* Back button to exit search */}
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-90 shrink-0 cursor-pointer border-0 bg-transparent flex items-center justify-center"
            aria-label="Back to home"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Search Input Box */}
          <div className="relative flex-1">
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                value={searchValue}
                onChange={handleInputChange}
                placeholder="Search pizzas, burgers..."
                className="w-full h-10 px-3.5 pr-9 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-medium outline-none border border-zinc-300 dark:border-zinc-700 focus:border-[#E53935] shadow-xs"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-500 hover:bg-zinc-600 text-white flex items-center justify-center cursor-pointer border-0 p-0 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* ── TOP BAR (30 mins & delivery address) ── */}
          <motion.div 
            initial={false}
            animate={{ height: isScrolled ? 0 : 'auto', opacity: isScrolled ? 0 : 1 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="w-full px-4 pt-4 pb-3 flex items-center justify-between">
              {/* Left: 30 MINS Block & Delivery Location */}
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
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
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSidebar) {
                      onOpenSidebar();
                    } else {
                      navigate('/user/profile/create');
                    }
                  }}
                  className="flex items-center justify-center rounded-full border-0 outline-none cursor-pointer active:scale-95 transition-transform"
                  style={{
                    width: 40, height: 40,
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  aria-label="Open Sidebar Menu"
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
            <div 
              onClick={handleNavigateToSearch}
              className="relative flex-1 cursor-pointer"
            >
              <div className="relative w-full">
                <span
                  className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                  style={{ left: 14, fontSize: 20, color: 'var(--muted-gray)' }}
                >
                  search
                </span>
                <input
                  type="text"
                  readOnly
                  onClick={handleNavigateToSearch}
                  onFocus={handleNavigateToSearch}
                  className="w-full border-0 outline-none relative z-10 bg-transparent cursor-pointer"
                  style={{
                    height: 48,
                    paddingLeft: 42,
                    paddingRight: 16,
                    fontSize: 14,
                    fontFamily: 'Poppins,sans-serif',
                    fontWeight: 500,
                    color: 'var(--primary-gray)'
                  }}
                />

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
                </div>
              </div>
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
        </>
      )}
    </div>
  );
}
