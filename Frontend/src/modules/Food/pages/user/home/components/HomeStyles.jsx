import React from 'react';

/**
 * HomeStyles — injects only truly dynamic (JS-value-dependent) overrides.
 * All static theme tokens live in userTheme.css.
 */
export const HomeStyles = ({ isDarkMode }) => (
  <style dangerouslySetInnerHTML={{
    __html: `
      /* ── Page background (dark mode uses solid, light uses subtle gradient) ── */
      .page-wrapper {
        background: ${isDarkMode
          ? '#111111'
          : 'radial-gradient(circle at top left, #FFF4F3 0%, #F8F6F2 40%, #F5F3EF 80%, #F8F6F2 100%)'
        } !important;
        color: ${isDarkMode ? '#e5e2e1' : 'var(--primary-gray)'} !important;
        font-family: 'Poppins', sans-serif !important;
        /* clip does NOT create a scroll container — sticky still works inside */
        overflow-x: clip !important;
      }

      /* ── Glass card dark/light ── */
      .glass-card {
        background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)'} !important;
        backdrop-filter: blur(24px) !important;
        border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(212,210,207,0.5)'} !important;
        box-shadow: ${isDarkMode ? 'none' : '0 4px 16px rgba(0,0,0,0.05)'} !important;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
      }
      .glass-card:hover {
        box-shadow: ${isDarkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.08)'} !important;
      }

      /* ── Scrollbar ── */
      .hide-scrollbar::-webkit-scrollbar { display: none !important; }
      .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }

      /* ── Carousel ── */
      .carousel-track { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1) !important; }

      /* ── Fonts (Poppins throughout) ── */
      .font-headline-lg-mobile, .font-headline-lg, .font-display-lg,
      .font-body-md, .font-label-sm, .font-price-xl {
        font-family: 'Poppins', sans-serif !important;
      }
      .font-headline-lg-mobile { font-size: 20px !important; font-weight: 700 !important; line-height: 1.3 !important; }
      .font-label-sm           { font-size: 12px !important; font-weight: 600 !important; letter-spacing: 0.04em !important; }
      .font-price-xl           { font-size: 22px !important; font-weight: 700 !important; }

      /* ── Spacing ── */
      .px-margin-mobile { padding-left: 20px !important; padding-right: 20px !important; }
      .right-margin-mobile { right: 20px !important; }
      .gap-gutter { gap: 16px !important; }
      .gap-xs { gap: 8px !important; }
      .gap-sm { gap: 12px !important; }
      .mb-xs  { margin-bottom: 8px !important; }
      .mb-md  { margin-bottom: 16px !important; }
      .p-md   { padding: 16px !important; }
      .p-lg   { padding: 24px !important; }
      .space-y-lg > :not([hidden]) ~ :not([hidden]) { margin-top: 20px !important; }

      /* ── Brand colour tokens ── */
      .text-primary   { color: var(--accent-red) !important; }
      .bg-primary     { background-color: var(--accent-red) !important; }
      .border-primary { border-color: var(--accent-red) !important; }
      .text-on-primary { color: #fff !important; }
      .text-on-surface-variant { color: ${isDarkMode ? '#e4beb9' : 'var(--muted-gray)'} !important; }

      /* ── Hover-glow cards ── */
      .hover-glow { transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important; }
      .hover-glow:hover {
        box-shadow: ${isDarkMode
          ? '0 8px 24px rgba(237,47,53,0.18)'
          : '0 12px 28px rgba(237,47,53,0.10)'} !important;
        border-color: ${isDarkMode ? 'rgba(237,47,53,0.25)' : 'rgba(237,47,53,0.18)'} !important;
      }

      /* ── 3D button ── */
      .btn-3d-primary { border-bottom: 2px solid #b71c1c !important; transition: all 0.1s ease !important; }
      .btn-3d-primary:active { border-bottom-width: 0 !important; transform: translateY(2px) !important; }

      /* ── Order method cards ── */
      .order-method-card {
        background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff'} !important;
        border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.10)' : 'var(--border-gray)'} !important;
        border-radius: 14px !important;
        transition: all 0.2s ease !important;
      }
      .order-method-card.active {
        border-color: var(--accent-red) !important;
        background: ${isDarkMode ? 'rgba(237,47,53,0.12)' : 'rgba(237,47,53,0.04)'} !important;
      }
      .order-method-card:active { transform: scale(0.97) !important; }
    `
  }} />
);
