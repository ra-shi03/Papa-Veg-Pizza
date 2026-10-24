import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

export const DEFAULT_BOTTOM_NAV = [
  { id: 'menu', label: 'Menu', icon: 'local_pizza', iconType: 'material', iconUrl: '', badge: '', link: '/user/menu', enabled: true, sortOrder: 1 },
  { id: 'reorder', label: 'Reorder', icon: 'shopping_bag', iconType: 'material', iconUrl: '', badge: '', link: '/user/order-history', enabled: true, sortOrder: 2 },
  { id: 'big-big', label: 'Big Big', icon: 'local_pizza', iconType: 'material', iconUrl: '', badge: 'NEW', link: '/user/menu?category=wow-4-in-1-pizza', enabled: true, sortOrder: 3 },
  { id: 'combos', label: 'Combos', icon: 'lunch_dining', iconType: 'material', iconUrl: '', badge: '', link: '/user/offers', enabled: true, sortOrder: 4 },
  { id: 'rewards', label: 'Rewards', icon: 'stars', iconType: 'material', iconUrl: '', badge: '', link: '/user/rewards', enabled: true, sortOrder: 5 }
];

export function BottomNavBar({
  navigate,
  triggerToast,
  totalCartCount = 0,
  locationConfirmed = false,
  items = null
}) {
  const location = useLocation();

  // Get active items either from props or localStorage, or default
  const navItems = useMemo(() => {
    let source = items;
    if (!source || !Array.isArray(source) || source.length === 0) {
      try {
        const stored = localStorage.getItem("pvp_home_config");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed?.bottomNav) && parsed.bottomNav.length > 0) {
            source = parsed.bottomNav;
          }
        }
      } catch (_) {}
    }

    if (!source || !Array.isArray(source) || source.length === 0) {
      source = DEFAULT_BOTTOM_NAV;
    }

    return [...source]
      .filter(item => item.enabled !== false)
      .map(item => {
        if (item.id === 'reorder' || item.label?.toLowerCase() === 'reorder') {
          return { ...item, link: '/user/order-history' };
        }
        if ((item.id === 'big-big' || item.label?.toLowerCase() === 'big big' || item.label?.toLowerCase().includes('4 in 1')) && (!item.link || item.link === '/user/menu' || item.link === '/user/menu?search=big')) {
          return { ...item, link: '/user/menu?category=wow-4-in-1-pizza' };
        }
        if (item.id === 'rewards' || item.label?.toLowerCase() === 'rewards' || item.label === '0/600') {
          return { ...item, link: item.link && item.link.startsWith('/user/rewards') ? item.link : '/user/rewards' };
        }
        return item;
      })
      .sort((a, b) => (Number(a.sortOrder) || 1) - (Number(b.sortOrder) || 1));
  }, [items]);

  const currentPath = location.pathname;

  const handleNavClick = (item) => {
    let target = item.link || '/user';
    if (item.id === 'reorder' || item.label?.toLowerCase() === 'reorder') {
      target = '/user/order-history';
    } else if ((item.id === 'big-big' || item.label?.toLowerCase() === 'big big' || item.label?.toLowerCase().includes('4 in 1')) && (!item.link || item.link === '/user/menu' || item.link === '/user/menu?search=big')) {
      target = '/user/menu?category=wow-4-in-1-pizza';
    } else if (item.id === 'rewards' || item.label?.toLowerCase() === 'rewards' || item.label === '0/600' || target === '/user/wallet') {
      target = '/user/rewards';
    }
    // Support relative paths if deployed under /food
    if (window.location.pathname.startsWith('/food') && !target.startsWith('/food')) {
      target = `/food${target}`;
    }

    if (item.id === 'home' || target === '/user' || target === '/food/user') {
      if (currentPath === '/user' || currentPath === '/food/user' || currentPath === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(target);
      }
    } else {
      navigate(target);
    }

    if (triggerToast) {
      triggerToast(`Opening ${item.label}`);
    }
  };

  return (
    <nav 
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 w-full z-50 bg-[#FFFFFF] dark:bg-[#121212] border-t border-zinc-200/80 dark:border-white/5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex justify-around items-center px-1 pb-safe select-none"
      style={{ minHeight: 62, height: 62 }}
    >
      {navItems.map((item) => {
        const itemLink = item.link || '';
        const itemTarget = (window.location.pathname.startsWith('/food') && !itemLink.startsWith('/food')) ? `/food${itemLink}` : itemLink;
        const isCurrentActive =
          currentPath === itemLink ||
          currentPath === itemTarget ||
          (itemLink !== '/user' && itemLink !== '/food/user' && (currentPath.startsWith(itemLink) || currentPath.startsWith(itemTarget))) ||
          (item.id === 'reorder' && (currentPath.includes('/order-history') || currentPath.includes('/orders')));
        const isCartOrOrders = (item.id === 'reorder' || item.id === 'cart' || (item.link || '').includes('cart'));
        const showCartBadge = isCartOrOrders && totalCartCount > 0 && locationConfirmed;

        return (
          <button
            key={item.id || item.label}
            type="button"
            onClick={() => handleNavClick(item)}
            className="flex-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer bg-transparent border-0 outline-none relative py-1 px-0.5 group"
          >
            {/* Optional Top Badge (e.g. "NEW" from screenshot) */}
            {item.badge && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#E53935] text-white text-[8px] font-bold px-1.5 py-[1px] rounded-full uppercase tracking-tighter shadow-2xs leading-none z-10 scale-95 pointer-events-none whitespace-nowrap">
                {item.badge}
              </span>
            )}

            {/* Icon Container */}
            <div className="relative flex items-center justify-center h-7 w-auto min-w-[28px] max-w-[44px]">
              {item.iconType === 'image' && item.iconUrl ? (
                <img 
                  src={item.iconUrl} 
                  alt={item.label} 
                  className={`h-7 w-auto max-w-[42px] object-contain transition-all duration-200 group-hover:scale-110 drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${
                    isCurrentActive ? 'scale-110' : 'scale-100 opacity-100'
                  }`}
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              ) : (
                <span 
                  className={`material-symbols-outlined text-[24px] transition-colors ${
                    isCurrentActive 
                      ? 'text-[#E53935] dark:text-[#E53935] font-semibold' 
                      : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                  }`}
                  style={isCurrentActive ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" }}
                >
                  {item.icon || 'local_pizza'}
                </span>
              )}

              {/* Shopping / Cart count badge */}
              {showCartBadge && (
                <div className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#E53935] text-white rounded-full text-[9px] font-semibold flex items-center justify-center border-2 border-white dark:border-[#121212] shadow-xs animate-scale-in">
                  {totalCartCount}
                </div>
              )}
            </div>

            {/* Label below icon */}
            <span 
              className={`text-[10px] tracking-tight mt-1 transition-colors leading-none truncate max-w-[64px] ${
                isCurrentActive 
                  ? 'font-semibold text-[#E53935] dark:text-[#E53935]' 
                  : 'font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
