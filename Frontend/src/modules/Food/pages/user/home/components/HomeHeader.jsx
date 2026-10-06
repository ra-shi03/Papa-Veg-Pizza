import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function HomeHeader({ deliveryAddress, deliveryTime = 30, deliveryLabel = 'mins', categories = [] }) {
  const navigate = useNavigate();

  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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
      className="w-full pb-3"
      style={{
        background: 'linear-gradient(to bottom, #B71C1C 0%, #E53935 100%)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ── TOP BAR ────────────────────────── */}
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

      {/* ── SEARCH BAR + TRAIN BUTTON ── */}
      <div className="px-4 flex items-center gap-2">
        <div className="relative flex-1">
          {/* Search icon */}
          <span
            className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 z-10"
            style={{ left: 14, fontSize: 20, color: 'var(--muted-gray)' }}
          >
            search
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full border-0 outline-none relative z-10 bg-transparent"
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
        </div>
        
        {/* Deliver on Train Button */}
        <button
          onClick={() => navigate('/food/user/delivery-location', { state: { activeService: 'train' } })}
          className="flex items-center gap-1.5 shrink-0 px-3 border-0 outline-none cursor-pointer"
          style={{
            height: 48,
            borderRadius: 12,
            background: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary-gray)' }}>
            train
          </span>
          <span className="flex flex-col text-left" style={{ lineHeight: 1.1 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--primary-gray)', fontFamily: 'Poppins,sans-serif' }}>Deliver</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-gray)', fontFamily: 'Poppins,sans-serif' }}>on Train</span>
          </span>
        </button>
      </div>
    </div>
  );
}
