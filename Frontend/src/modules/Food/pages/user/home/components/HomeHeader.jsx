import React from 'react';
import { useNavigate } from 'react-router-dom';

export function HomeHeader({ deliveryAddress }) {
  const navigate = useNavigate();

  return (
    <>
      {/* ── TOP BAR — scrolls away with the page ────────────────────────── */}
      <div
        className="w-full px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ background: 'var(--secondary-off-white)' }}
      >
        {/* Left: 30-min bubble + delivery address */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {/* 30-min neumorphic circle */}
          <div
            className="shrink-0 flex flex-col items-center justify-center rounded-full"
            style={{
              width: 48,
              height: 48,
              background: '#EEECEA',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.08), -3px -3px 8px rgba(255,255,255,0.9)'
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary-gray)', fontFamily: 'Poppins,sans-serif', lineHeight: 1 }}>
              30
            </span>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--muted-gray)', fontFamily: 'Poppins,sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              mins
            </span>
          </div>

          {/* Delivery label + address */}
          <div className="flex flex-col min-w-0">
            <span
              className="flex items-center gap-0.5"
              style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'Poppins,sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              Delivery to
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>expand_more</span>
            </span>
            <span
              className="truncate"
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-gray)', fontFamily: 'Poppins,sans-serif' }}
            >
              {deliveryAddress || 'Select Location'}
            </span>
          </div>
        </div>

        {/* Right: Bell + Profile — neumorphic round buttons */}
        <div className="flex items-center gap-3 shrink-0 pl-2">
          {/* Notification bell */}
          <button
            onClick={() => navigate('/user/notifications')}
            className="relative flex items-center justify-center rounded-full border-0 outline-none cursor-pointer"
            style={{
              width: 44, height: 44,
              background: '#EEECEA',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.08), -3px -3px 8px rgba(255,255,255,0.9)'
            }}
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-gray)' }}>
              notifications
            </span>
            {/* Red dot */}
            <span
              className="absolute rounded-full"
              style={{ top: 10, right: 11, width: 8, height: 8, background: 'var(--accent-red)', border: '2px solid #EEECEA' }}
            />
          </button>

          {/* Profile */}
          <button
            onClick={() => navigate('/user/profile/create')}
            className="flex items-center justify-center rounded-full border-0 outline-none cursor-pointer"
            style={{
              width: 44, height: 44,
              background: '#EEECEA',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.08), -3px -3px 8px rgba(255,255,255,0.9)'
            }}
            aria-label="Profile"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-gray)' }}>
              person
            </span>
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR — sticky: stays at top once top-bar scrolls away ── */}
      {/*
          position: sticky + top: 0 works because:
          1. The parent (.page-wrapper) uses overflow-x: clip (not hidden)
          2. clip does NOT create a new scroll context, so sticky is respected
      */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--secondary-off-white)',
          padding: '8px 16px 12px'
        }}
      >
        <div className="relative w-full">
          {/* Search icon */}
          <span
            className="material-symbols-outlined absolute top-1/2 -translate-y-1/2"
            style={{ left: 16, fontSize: 18, color: 'var(--muted-gray)' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search for pizza, burger, pasta..."
            className="w-full border-0 outline-none"
            style={{
              height: 46,
              paddingLeft: 44,
              paddingRight: 20,
              borderRadius: 999,
              background: '#EEECEA',
              boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.07), inset -2px -2px 5px rgba(255,255,255,0.85)',
              fontSize: 13,
              fontFamily: 'Poppins,sans-serif',
              fontWeight: 500,
              color: 'var(--primary-gray)'
            }}
          />
        </div>
      </div>
    </>
  );
}
