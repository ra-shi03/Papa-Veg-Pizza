import React from 'react';
import { motion } from 'framer-motion';

const CHEVRON = (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: 16, color: 'var(--muted-gray)', flexShrink: 0 }}
  >
    chevron_right
  </span>
);

export function OrderMethods({
  orderMethods,
  activeService,
  setActiveService,
  setShowMapModal,
  setShowStoreModal,
  setShowCarModal,
  setShowTrainModal,
  triggerToast,
  isDarkMode
}) {
  const enabled = orderMethods.filter(m => m.enabled);

  const handleClick = (service) => {
    if (service.id === 'delivery')  { setShowMapModal(true);   return; }
    if (service.id === 'takeaway')  { setShowStoreModal(true); return; }
    if (service.id === 'incar')     { setShowCarModal(true);   return; }
    if (service.id === 'train')     { setShowTrainModal(true); return; }
    setActiveService(service.id);
    triggerToast(`Switched to ${service.label}`);
  };

  return (
    <section>
      {/* Subtitle */}
      <p className="px-margin-mobile" style={{ fontSize: 12, color: 'var(--muted-gray)', fontFamily: 'Poppins,sans-serif', marginBottom: 12 }}>
        Select Delivery or Takeaway to see local deals
      </p>

      {/* Always flex — 2 cards take full width, extras scroll right */}
      <div
        className="hide-scrollbar"
        style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px' }}
      >
        {enabled.map((service, index) => {
          const isSelected = activeService === service.id;

          // Shared card background & border — NO colour difference between active/inactive
          const cardBg     = isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff';
          const cardBorder = isDarkMode ? 'rgba(255,255,255,0.10)' : 'var(--border-gray)';

          // Icon bubble — always accent colour
          const iconBg    = isDarkMode ? 'rgba(237,47,53,0.18)' : 'rgba(237,47,53,0.10)';
          const iconColor = 'var(--accent-red)';

          // Label colour — dark when selected, muted otherwise
          const labelColor = isSelected
            ? (isDarkMode ? '#ffffff' : 'var(--primary-gray)')
            : (isDarkMode ? 'rgba(255,255,255,0.75)' : 'var(--primary-gray)');

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
              onClick={() => handleClick(service)}
              style={{
                // Each card = (100% - gap) / 2  →  exactly 2 cards on screen
                flex: '0 0 calc(50% - 6px)',
                maxWidth: 220,
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'opacity 0.15s ease'
              }}
            >
              {/* Icon bubble */}
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: iconColor }}
                >
                  {service.icon}
                </span>
              </div>

              {/* Label */}
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Poppins,sans-serif',
                  color: labelColor,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {service.label}
              </span>

              {CHEVRON}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
