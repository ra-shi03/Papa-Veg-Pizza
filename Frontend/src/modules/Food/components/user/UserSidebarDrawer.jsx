import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageCircle } from 'lucide-react';

export default function UserSidebarDrawer({
  isOpen,
  onClose,
  isDarkMode = false,
  onOpenDeliverOnTrain
}) {
  const navigate = useNavigate();

  // User State
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser') || localStorage.getItem('user_user');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('user_authenticated') === 'true' || !!localStorage.getItem('user_accessToken');
  });

  // Modal for Bulk Orders
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Sync user state on open or storage change
  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem('currentUser') || localStorage.getItem('user_user');
        setUser(stored ? JSON.parse(stored) : null);
        setIsLoggedIn(localStorage.getItem('user_authenticated') === 'true' || !!localStorage.getItem('user_accessToken'));
      } catch (_) {}
    };

    if (isOpen) {
      syncUser();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('storage', syncUser);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('storage', syncUser);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigate = (path) => {
    onClose?.();
    if (path) {
      let target = path;
      if (window.location.pathname.startsWith('/food') && !target.startsWith('/food')) {
        target = `/food${target}`;
      }
      navigate(target);
    }
  };

  const handleEditProfile = () => {
    onClose?.();
    handleNavigate('/user/account/profile-details');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('user_accessToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user_user');
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}
    setIsLoggedIn(false);
    setUser(null);
    onClose?.();
    handleNavigate('/user');
  };

  const storedFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const displayName = (isLoggedIn && (user?.name || user?.fullName || storedFullName)) || 'Welcome';
  const displayPhone = isLoggedIn ? user?.phone || user?.mobile || user?.phoneNumber || user?.email || '' : '';

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer Container sliding in from left */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-[82%] max-w-[310px] h-full shadow-2xl flex flex-col font-['Poppins',sans-serif] select-none transition-colors duration-200 ${
              isDarkMode ? 'bg-[#141416] text-white' : 'bg-white text-zinc-900'
            }`}
          >
            {/* Top User Profile Header (Using Papa Veg Red Theme) */}
            <div
              className={`p-4 flex items-center justify-between border-b transition-colors shrink-0 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-950/40 to-zinc-900 border-zinc-800'
                  : 'bg-gradient-to-r from-red-50/90 to-rose-50/50 border-red-100/80'
              }`}
            >
              <div 
                onClick={handleEditProfile}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
              >
                {/* User Avatar Circle */}
                <div className="w-11 h-11 rounded-full bg-[#E53935] text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                  {user?.avatar || user?.photoURL ? (
                    <img 
                      src={user.avatar || user.photoURL} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[24px]">person</span>
                  )}
                </div>

                {/* Name & Phone Number */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate leading-snug text-zinc-900 dark:text-white group-hover:text-[#E53935] transition-colors">
                    {displayName}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                    {displayPhone}
                  </p>
                </div>
              </div>

              {/* Edit Link */}
              <button
                type="button"
                onClick={handleEditProfile}
                className="text-xs font-bold text-[#E53935] hover:text-[#D32F2F] hover:underline cursor-pointer ml-2 px-1 py-0.5 border-0 bg-transparent shrink-0"
              >
                Edit
              </button>
            </div>

            {/* Scrollable List of Sidebar Options */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 py-1 scrollbar-none text-left">
              
              {/* Group 1: Menu, Deals & Offers, Deliver on Train */}
              <div className="py-1">
                {/* Menu */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/menu')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    menu_book
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Menu
                  </span>
                </button>

                {/* Deals & Offers */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/offers')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    confirmation_number
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Deals & Offers
                  </span>
                </button>

                {/* Deliver On Train */}
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    if (onOpenDeliverOnTrain) {
                      onOpenDeliverOnTrain();
                    } else {
                      handleNavigate('/user/deliver-on-train');
                    }
                  }}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    train
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Deliver On Train
                  </span>
                </button>
              </div>

              {/* Group 2: Papa Veg Rewards, Track Order, Order History, Papa Veg Wallet */}
              <div className="py-1">
                {/* Papa Veg Rewards with NEW badge */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/wallet')}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                      card_giftcard
                    </span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      Papa Veg Rewards
                    </span>
                  </div>
                  {/* Badge matching app theme color */}
                  <span className="bg-[#E53935] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                    New
                  </span>
                </button>

                {/* Track Order */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/orders')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 bg-red-50/30 dark:bg-zinc-800/40 hover:bg-red-50/70 dark:hover:bg-zinc-800/70 active:bg-red-100/50 transition-colors cursor-pointer border-0 text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-[#E53935] shrink-0">
                    near_me
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    Track Order
                  </span>
                </button>

                {/* Order History */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/orders')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    history
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Order History
                  </span>
                </button>

                {/* Papa Veg Wallet */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/wallet')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    account_balance_wallet
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Papa Veg Wallet
                  </span>
                </button>
              </div>

              {/* Group 3: Bulk Order */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    groups
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Bulk Order
                  </span>
                </button>
              </div>

              {/* Group 4: Nutritional Information, Terms & Conditions, Contact Us */}
              <div className="py-1">
                {/* Nutritional Information */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/account/nutrition')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    nutrition
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Nutritional Information
                  </span>
                </button>

                {/* Terms & Conditions */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/account/terms')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    description
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Terms & Conditions
                  </span>
                </button>

                {/* Contact Us */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/user/help')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-zinc-700 dark:text-zinc-300 shrink-0">
                    headset_mic
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Contact Us
                  </span>
                </button>
              </div>

              {/* Log Out if authenticated */}
              {isLoggedIn && (
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 text-[#E53935] transition-colors cursor-pointer border-0 bg-transparent text-left"
                  >
                    <span className="material-symbols-outlined text-[22px] text-[#E53935] shrink-0">
                      logout
                    </span>
                    <span className="text-sm font-bold text-[#E53935]">
                      Log Out
                    </span>
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Version Watermark (matches Image 2: v12.3.13) */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 text-right shrink-0">
              <span className="text-zinc-400 dark:text-zinc-500 text-xs font-mono tracking-tight">
                v12.3.13
              </span>
            </div>

          </motion.aside>

          {/* Bulk Order Info Modal */}
          {showBulkModal && (
            <div 
              className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowBulkModal(false)}
            >
              <div 
                className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl space-y-4 text-left border border-zinc-200 dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">groups</span>
                    </span>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      Bulk & Party Orders
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer bg-transparent border-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Planning a birthday, corporate meeting, or family celebration? Enjoy exclusive bulk discounts and prioritized on-time hot delivery for orders above 10 pizzas!
                </p>

                <div className="space-y-2 pt-2">
                  <a
                    href="tel:+919300990940"
                    className="w-full py-2.5 px-4 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 no-underline"
                  >
                    <Phone size={15} />
                    <span>Call Catering Desk (+91 9300990940)</span>
                  </a>

                  <a
                    href="https://wa.me/919300990940?text=Hello%20Papa%20Veg%20Pizza%2C%20I%20want%20to%20inquire%20about%20a%20Bulk%20Party%20Order"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 no-underline"
                  >
                    <MessageCircle size={15} />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(drawerContent, document.body);
}

