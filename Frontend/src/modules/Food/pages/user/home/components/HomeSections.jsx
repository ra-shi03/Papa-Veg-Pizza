import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ── Compact Deal Card (2 cards visible, rest scroll) ────────────────────────
function DealCard({ deal, onClaimDeal, isDarkMode }) {
  const cardBg     = isDarkMode ? '#1c1c1c' : '#ffffff';
  const titleColor = isDarkMode ? '#f5f5f5' : '#1a1a1a';
  const descColor  = isDarkMode ? 'rgba(255,255,255,0.55)' : 'var(--muted-gray)';
  const divColor   = isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0eeeb';

  return (
    <div
      style={{
        flex: '0 0 calc(50vw - 28px)',
        maxWidth: 220,
        background: cardBg,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: isDarkMode
          ? '0 4px 16px rgba(0,0,0,0.3)'
          : '0 2px 12px rgba(0,0,0,0.07)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'var(--border-gray)'}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', height: 130, background: '#34373C' }}>
        {deal.image && (
          <img
            src={deal.image}
            alt={deal.title}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              padding: '6px 0px 14px 0px' 
            }}
          />
        )}
        {/* Gradient so badge reads clearly */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 55%)'
          }}
        />
        {/* Badge */}
        {deal.badge && (
          <div
            style={{
              position: 'absolute', top: 10, left: 10,
              background: 'var(--accent-red)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              fontFamily: 'Poppins,sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 11, color: '#fff' }}
            >
              local_fire_department
            </span>
            {deal.badge}
          </div>
        )}
        {/* Wave separator */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', transform: 'translateY(1px)' }}>
          <svg viewBox="0 0 400 20" preserveAspectRatio="none" style={{ width: '100%', height: 20, display: 'block', fill: cardBg }}>
            <path d="M0,20 C100,0 300,0 400,20 L400,20 L0,20 Z" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title — uniform 2-line height ensures consistent alignment across cards */}
        <h4
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Poppins,sans-serif',
            color: titleColor,
            lineHeight: 1.3,
            margin: 0,
            minHeight: 34,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {deal.title}
        </h4>

        {/* Description — uniform 2-line height */}
        <p
          style={{
            fontSize: 11,
            color: descColor,
            fontFamily: 'Poppins,sans-serif',
            lineHeight: 1.45,
            margin: '4px 0 0',
            minHeight: 32,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {deal.description}
        </p>

        {/* Bottom container pinned to bottom with marginTop: auto */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
          {/* Meta row — accent icons & size pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: divColor,
              borderRadius: 10,
              padding: '5px 8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(237,47,53,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--accent-red)' }}>
                  local_pizza
                </span>
              </div>
              <div>
                <p style={{ fontSize: 8.5, color: descColor, fontFamily: 'Poppins,sans-serif', margin: 0, lineHeight: 1 }}>Size</p>
                <p style={{ fontSize: 10, color: titleColor, fontWeight: 600, fontFamily: 'Poppins,sans-serif', margin: 0, lineHeight: 1.2 }}>{deal.size || 'Medium'}</p>
              </div>
            </div>

            <div
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(237,47,53,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--accent-red)' }}>
                confirmation_number
              </span>
            </div>
          </div>

          {/* Claim Deal button */}
          <button
            onClick={() => onClaimDeal(deal)}
            style={{
              width: '100%',
              height: 36,
              background: 'var(--accent-red)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'Poppins,sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Claim Deal
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#fff' }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Meal For One Card ─────────────────────────────────────────────────────────
function MealForOneCard({ meal, isDarkMode, checkLocation, addToCart, triggerToast }) {
  const [quantity, setQuantity] = useState(0);

  const handleAdd = () => {
    checkLocation(() => {
      setQuantity(1);
      addToCart(meal.id);
      triggerToast('Meal added!');
    });
  };

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
    addToCart(meal.id);
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(0, prev - 1));
  };

  const cardBg = isDarkMode ? '#1c1c1c' : '#ffffff';
  const titleColor = isDarkMode ? '#f5f5f5' : '#1a1a1a';
  const descColor = isDarkMode ? 'rgba(255,255,255,0.55)' : 'var(--muted-gray)';
  
  return (
    <div
      style={{
        flex: '0 0 calc(75vw - 20px)',
        maxWidth: 260,
        background: cardBg,
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: isDarkMode
          ? '0 6px 20px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.06)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s ease'
      }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', height: 150, background: isDarkMode ? '#2a2a2a' : '#f8f8f8', overflow: 'hidden' }}>
        <img
          src={meal.image}
          alt={meal.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        {/* Gradient Overlay for subtle premium feel */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)' }} />
        
        {/* Veg Indicator */}
        {meal.isVeg && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: '#fff', borderRadius: 4, padding: 2, display: 'flex' }}>
            <div style={{ width: 12, height: 12, border: '1px solid #1E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
              <div style={{ width: 6, height: 6, background: '#1E7D32', borderRadius: '50%' }} />
            </div>
          </div>
        )}

        {/* Discount Badge */}
        {meal.discountBadge && (
          <div
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'var(--accent-red)', color: '#fff',
              fontSize: 10, fontWeight: 700, fontFamily: 'Poppins,sans-serif',
              padding: '4px 8px', borderRadius: 8,
              boxShadow: '0 2px 8px rgba(229, 57, 53, 0.4)'
            }}
          >
            {meal.discountBadge}
          </div>
        )}
      </div>

      {/* Content area */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: titleColor, margin: '0 0 4px 0', fontFamily: 'Inter, sans-serif' }}>
          {meal.title}
        </h4>
        <p style={{ fontSize: 12, color: descColor, margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.4, flex: 1 }}>
          {meal.description}
        </p>
        
        {/* Bottom row: Price & Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {meal.originalPrice && (
              <span style={{ fontSize: 11, color: descColor, textDecoration: 'line-through', marginBottom: -2 }}>
                ₹{meal.originalPrice}
              </span>
            )}
            <span style={{ fontSize: 16, fontWeight: 800, color: titleColor, fontFamily: 'Inter, sans-serif' }}>
              ₹{meal.price}
            </span>
          </div>

          <div style={{ minWidth: 80, display: 'flex', justifyContent: 'flex-end' }}>
            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.button
                  key="add"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleAdd}
                  style={{
                    height: 32, padding: '0 16px',
                    background: 'rgba(229, 57, 53, 0.1)',
                    color: 'var(--accent-red)', border: '1px solid var(--accent-red)',
                    borderRadius: 8, fontSize: 12, fontWeight: 700,
                    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  + Add
                </motion.button>
              ) : (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    height: 32, padding: '0 8px',
                    background: 'var(--accent-red)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: '0 2px 8px rgba(229, 57, 53, 0.3)'
                  }}
                >
                  <button onClick={handleDecrement} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                    &minus;
                  </button>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                    {quantity}
                  </span>
                  <button onClick={handleIncrement} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                    +
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Main Export ──────────────────────────────────────────────────────────────
export function HomeSections({
  deals,
  categories,
  products,
  activeCategory,
  favorites,
  isDarkMode,
  checkLocation,
  triggerToast,
  toggleFavorite,
  addToCart,
  dealsRef
}) {
  const navigate = useNavigate();

  const handleClaimDeal = (deal) => {
    checkLocation(() => {
      navigate('/user/deals');
      triggerToast(`Claiming: ${deal.title}`);
    });
  };

  return (
    <>
      {/* ── Hot Deals Section ─────────────────────────────────────────── */}
      <section>
        {/* Header row — items-center shifts View Deals button upward */}
        <div className="px-margin-mobile flex justify-between items-center" style={{ marginBottom: 6 }}>
          <div>
            <h3
              className="font-headline-lg-mobile"
              style={{ color: isDarkMode ? '#fff' : 'var(--primary-gray)', margin: 0 }}
            >
              Hot Deals
            </h3>
            {/* Tagline */}
            <p
              style={{
                fontSize: 11,
                color: 'var(--muted-gray)',
                fontFamily: 'Poppins,sans-serif',
                margin: '2px 0 0',
                fontStyle: 'italic'
              }}
            >
              Great taste. Better value.
            </p>
          </div>
          <button
            onClick={() => {
              checkLocation(() => {
                navigate('/user/deals');
                triggerToast('Opening hot deals...');
              });
            }}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--accent-red)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Poppins,sans-serif',
              cursor: 'pointer',
              padding: 0
            }}
          >
            View Deals
          </button>
        </div>

        {/* Scrollable deal cards — 2 visible at once */}
        <div
          ref={dealsRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            padding: '12px 20px 4px'
          }}
        >
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isDarkMode={isDarkMode}
              onClaimDeal={handleClaimDeal}
            />
          ))}
        </div>
      </section>

      {/* ── Menu Categories ───────────────────────────────────────────── */}
      <section>
        <div className="px-margin-mobile flex justify-between items-end mb-md">
          <h3
            className="font-headline-lg-mobile"
            style={{ color: isDarkMode ? '#fff' : 'var(--primary-gray)' }}
          >
            Menus
          </h3>
          <button
            onClick={() => {
              navigate('/user/menu');
              triggerToast('Opening Menu List...');
            }}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--accent-red)', fontSize: 12, fontWeight: 600,
              fontFamily: 'Poppins,sans-serif', cursor: 'pointer', padding: 0
            }}
          >
            View Menu
          </button>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-sm px-margin-mobile pb-2">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  navigate('/user/menu', { state: { category: cat.id } });
                  triggerToast(`Opening Menu - ${cat.label}`);
                }}
                className="flex flex-col items-center gap-xs"
                style={{ minWidth: 70, cursor: 'pointer' }}
              >
                <div
                  className="flex items-center justify-center transition-all duration-300"
                  style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: isSelected ? 'var(--accent-red)' : (isDarkMode ? '#121212' : '#F9F9FB'),
                    boxShadow: isSelected
                      ? (isDarkMode ? 'inset 4px 4px 8px rgba(0,0,0,0.6), inset -4px -4px 8px rgba(255,255,255,0.1)' : 'inset 4px 4px 8px rgba(0,0,0,0.2), inset -4px -4px 8px rgba(255,255,255,0.4)')
                      : (isDarkMode ? '4px 4px 10px rgba(0,0,0,0.6), -4px -4px 10px rgba(255,255,255,0.05)' : '4px 4px 10px rgba(0, 0, 0, 0.08), -4px -4px 10px rgba(255, 255, 255, 1)'),
                    border: isSelected ? 'none' : (isDarkMode ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(255,255,255,0.5)')
                  }}
                >
                  {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:')) ? (
                    <img 
                      src={cat.icon} 
                      alt={cat.label} 
                      className="w-full h-full object-cover rounded-full" 
                      style={{ 
                        opacity: isSelected ? 0.9 : 1, 
                        filter: isSelected ? 'brightness(1.1)' : 'none',
                        padding: '4px' // Adding slight padding so it doesn't touch edges
                      }}
                    />
                  ) : (
                    <span
                      className="material-symbols-outlined"
                      style={{ color: isSelected ? '#fff' : 'var(--accent-red)' }}
                    >
                      {cat.icon}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11, fontFamily: 'Poppins,sans-serif',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent-red)' : 'var(--muted-gray)'
                  }}
                >
                  {cat.label ? cat.label.charAt(0).toUpperCase() + cat.label.slice(1).toLowerCase() : ''}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Meal for One ────────────────────────────────────────────── */}
      <section>
        <div className="px-margin-mobile flex justify-between items-end mb-md">
          <div>
            <h3
              className="font-headline-lg-mobile"
              style={{ color: isDarkMode ? '#fff' : 'var(--primary-gray)', margin: 0 }}
            >
              Meal for One
            </h3>
            <p
              style={{
                fontSize: 11,
                color: 'var(--muted-gray)',
                fontFamily: 'Poppins,sans-serif',
                margin: '2px 0 0',
                fontStyle: 'italic'
              }}
            >
              Perfect combos made just for you
            </p>
          </div>
          <button
            onClick={() => {
              navigate('/user/menu');
              triggerToast('Opening Combos...');
            }}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--accent-red)', fontSize: 12, fontWeight: 600,
              fontFamily: 'Poppins,sans-serif', cursor: 'pointer', padding: 0
            }}
          >
            View All &rarr;
          </button>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-gutter px-margin-mobile pb-4">
          {[
            {
              id: 'm1',
              title: 'Classic Solo Meal',
              description: 'Pizza + Drink',
              price: 199,
              originalPrice: 249,
              discountBadge: '20% OFF',
              isVeg: true,
              image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80'
            },
            {
              id: 'm2',
              title: 'Cheese Lover Meal',
              description: 'Pizza + Side',
              price: 249,
              originalPrice: null,
              discountBadge: null,
              isVeg: true,
              image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80'
            },
            {
              id: 'm3',
              title: 'Veggie Feast',
              description: 'Pizza + Garlic Bread',
              price: 229,
              originalPrice: 279,
              discountBadge: '₹50 OFF',
              isVeg: true,
              image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80'
            }
          ].map((meal) => {
            return (
              <MealForOneCard
                key={meal.id}
                meal={meal}
                isDarkMode={isDarkMode}
                checkLocation={checkLocation}
                addToCart={addToCart}
                triggerToast={triggerToast}
              />
            );
          })}
        </div>
      </section>

      {/* ── Most Loved ────────────────────────────────────────────────── */}
      <section>
        <div className="px-margin-mobile mb-md">
          <h3
            className="font-headline-lg-mobile"
            style={{ color: isDarkMode ? '#fff' : 'var(--primary-gray)' }}
          >
            Most Loved
          </h3>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar gap-gutter px-margin-mobile pb-4">
          {products.map((product) => {
            const isFav = favorites.includes(product.id);
            return (
              <div
                key={product.id}
                className="glass-card hover-glow"
                style={{
                  minWidth: 185, maxWidth: 185,
                  borderRadius: 16, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.2s ease'
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: 110, overflow: 'hidden', background: '#1a1a1a' }}>
                  <img
                    src={product.image}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '50%', width: 28, height: 28,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 14,
                        color: 'var(--accent-red)',
                        fontVariationSettings: `'FILL' ${isFav ? 1 : 0}`
                      }}
                    >
                      favorite
                    </span>
                  </button>
                </div>

                {/* Info */}
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                    <h4
                      style={{
                        fontSize: 11, fontWeight: 700,
                        fontFamily: 'Poppins,sans-serif',
                        color: isDarkMode ? '#f5f5f5' : 'var(--primary-gray)',
                        lineHeight: 1.3, margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                      }}
                    >
                      {product.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 10, color: '#F59E0B', fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted-gray)', fontFamily: 'Poppins,sans-serif' }}>
                        {product.rating}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 10, color: 'var(--muted-gray)',
                      fontFamily: 'Poppins,sans-serif', margin: 0,
                      lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}
                  >
                    {product.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'Poppins,sans-serif' }}>
                      ₹{product.price}
                    </span>
                    <button
                      onClick={() => checkLocation(() => addToCart(product.id))}
                      style={{
                        height: 26, padding: '0 12px',
                        background: 'var(--accent-red)',
                        color: '#fff', border: 'none', outline: 'none',
                        borderRadius: 999, fontSize: 10, fontWeight: 700,
                        fontFamily: 'Poppins,sans-serif',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
