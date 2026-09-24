import React from "react";
import { useNavigate } from "react-router-dom";

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
                  className="glass-card flex items-center justify-center transition-all duration-300"
                  style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: isSelected ? 'var(--accent-red)' : undefined
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: isSelected ? '#fff' : 'var(--accent-red)' }}
                  >
                    {cat.icon}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11, fontFamily: 'Poppins,sans-serif',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent-red)' : 'var(--muted-gray)'
                  }}
                >
                  {cat.label}
                </span>
              </div>
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
