import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from "@food/context/CartContext";
import { useEffect, useRef, useState } from 'react';

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

/**
 * AddToCartAnimation Component
 * 
 * A self-contained component that handles:
 * - Fly-to-cart animation when products are added
 * - Bounce-out animation when products are removed
 * - Pulse animation on cart changes
 * - "View cart" button display at bottom center
 * 
 * This component automatically integrates with the CartContext and
 * listens for cart changes to trigger appropriate animations.
 */
export default function AddToCartAnimation({
  bottomOffset = 96,
  pillClassName = '',
  hideOnPages = true,
  linkTo = '/food/user/cart',
  dynamicBottom = null,
}) {
  const { items, itemCount, total, lastAddEvent, lastRemoveEvent } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const linkRef = useRef(null);
  
  const [removedAnim, setRemovedAnim] = useState(null);
  const [flyingAnim, setFlyingAnim] = useState(null);
  const buttonControls = useAnimationControls();

  // Hide pill on cart pages, order pages, and account page (if enabled)
  const iscartPage = location.pathname === '/cart' ||
    location.pathname === '/user/cart' ||
    location.pathname.startsWith('/cart/') ||
    location.pathname.startsWith('/user/cart/');
  const isOrderPage = location.pathname.startsWith('/orders/');
  const isAccountPage = location.pathname === '/account';
  const shouldHidePill = hideOnPages && (iscartPage || isOrderPage || isAccountPage);

  // Handle removal animation when product is removed
  useEffect(() => {
    if (lastRemoveEvent && lastRemoveEvent.sourcePosition && linkRef.current) {
      const { product, sourcePosition } = lastRemoveEvent;

      // Store the sourcePosition immediately to prevent it from being lost
      const savedSourcePosition = { ...sourcePosition };
      const savedProduct = { ...product };

      // Wait a bit to ensure pill is rendered
      setTimeout(() => {
        if (linkRef.current) {
          const pillRect = linkRef.current.getBoundingClientRect();
          // Start position: center of the pill (where thumbnails are)
          const startX = pillRect.left + 16; // Approximate position of first thumbnail
          const startY = pillRect.top + pillRect.height / 2; // Vertical center of pill

          // Calculate current viewport position accounting for scroll changes
          const getScrollX = () => {
            if (window.scrollX !== undefined) return window.scrollX
            if (window.pageXOffset !== undefined) return window.pageXOffset
            if (document.documentElement && document.documentElement.scrollLeft !== undefined) {
              return document.documentElement.scrollLeft
            }
            if (document.body && document.body.scrollLeft !== undefined) {
              return document.body.scrollLeft
            }
            return 0
          }

          const getScrollY = () => {
            if (window.scrollY !== undefined) return window.scrollY
            if (window.pageYOffset !== undefined) return window.pageYOffset
            if (document.documentElement && document.documentElement.scrollTop !== undefined) {
              return document.documentElement.scrollTop
            }
            if (document.body && document.body.scrollTop !== undefined) {
              return document.body.scrollTop
            }
            return 0
          }

          const currentScrollX = getScrollX()
          const currentScrollY = getScrollY()

          // Determine target position
          let targetX, targetY

          if (savedSourcePosition.viewportX !== undefined && savedSourcePosition.viewportY !== undefined) {
            const scrollDeltaX = currentScrollX - (savedSourcePosition.scrollX || 0)
            const scrollDeltaY = currentScrollY - (savedSourcePosition.scrollY || 0)
            targetX = savedSourcePosition.viewportX - scrollDeltaX
            targetY = savedSourcePosition.viewportY - scrollDeltaY
          } else {
            targetX = savedSourcePosition.x - currentScrollX
            targetY = savedSourcePosition.y - currentScrollY
          }

          // Calculate thumbnail center offset (16px = half of 32px thumbnail)
          const thumbnailCenterOffset = 16;
          const left = startX - thumbnailCenterOffset;
          const top = startY - thumbnailCenterOffset;
          const deltaX = targetX - startX;
          const deltaY = targetY - startY;

          setRemovedAnim({
            product: savedProduct,
            left,
            top,
            deltaX,
            deltaY,
            id: Date.now()
          });
        }
      }, 10);
    }
  }, [lastRemoveEvent]);

  // Handle fly-to-cart animation when product is added
  useEffect(() => {
    if (lastAddEvent && lastAddEvent.sourcePosition && linkRef.current) {
      const { product, sourcePosition } = lastAddEvent;

      // Store the sourcePosition immediately to prevent it from being lost
      const savedSourcePosition = { ...sourcePosition };
      const savedProduct = { ...product };

      // Wait a bit longer to ensure pill is fully rendered and in position
      setTimeout(() => {
        if (linkRef.current) {
          const pillRect = linkRef.current.getBoundingClientRect();
          // Target position: center of the pill (viewport-relative)
          const endX = pillRect.left + pillRect.width / 2; // Horizontal center of pill
          const endY = pillRect.top + pillRect.height / 2; // Vertical center of pill

          // Calculate current viewport position accounting for scroll changes
          const getScrollX = () => {
            if (window.scrollX !== undefined) return window.scrollX
            if (window.pageXOffset !== undefined) return window.pageXOffset
            if (document.documentElement && document.documentElement.scrollLeft !== undefined) {
              return document.documentElement.scrollLeft
            }
            if (document.body && document.body.scrollLeft !== undefined) {
              return document.body.scrollLeft
            }
            return 0
          }

          const getScrollY = () => {
            if (window.scrollY !== undefined) return window.scrollY
            if (window.pageYOffset !== undefined) return window.pageYOffset
            if (document.documentElement && document.documentElement.scrollTop !== undefined) {
              return document.documentElement.scrollTop
            }
            if (document.body && document.body.scrollTop !== undefined) {
              return document.body.scrollTop
            }
            return 0
          }

          const currentScrollX = getScrollX()
          const currentScrollY = getScrollY()

          // Determine source position
          let sourceX, sourceY

          if (savedSourcePosition.viewportX !== undefined && savedSourcePosition.viewportY !== undefined) {
            const scrollDeltaX = currentScrollX - (savedSourcePosition.scrollX || 0)
            const scrollDeltaY = currentScrollY - (savedSourcePosition.scrollY || 0)
            sourceX = savedSourcePosition.viewportX - scrollDeltaX
            sourceY = savedSourcePosition.viewportY - scrollDeltaY
          } else {
            sourceX = savedSourcePosition.x - currentScrollX
            sourceY = savedSourcePosition.y - currentScrollY
          }

          // Calculate thumbnail center offset (16px = half of 32px thumbnail)
          const thumbnailCenterOffset = 16;
          const left = sourceX - thumbnailCenterOffset;
          const top = sourceY - thumbnailCenterOffset;
          const deltaX = endX - sourceX;
          const deltaY = endY - sourceY;

          setFlyingAnim({
            product: savedProduct,
            left,
            top,
            deltaX,
            deltaY,
            id: Date.now()
          });
        }
      }, 150); // Increased delay to ensure pill animation completes
    }
  }, [lastAddEvent]);

  // Pulse animation when cart changes (but not on removal or fly-to-cart)
  useEffect(() => {
    if (itemCount > 0 && !removedAnim && !flyingAnim && !lastRemoveEvent) {
      buttonControls.start({
        scale: [1, 1.08, 1.0, 1.04, 1.0],
        boxShadow: [
          '0 4px 12px rgba(126, 56, 102, 0.3)',
          '0 10px 25px rgba(126, 56, 102, 0.4)',
          '0 4px 12px rgba(126, 56, 102, 0.3)',
          '0 6px 16px rgba(126, 56, 102, 0.35)',
          '0 4px 12px rgba(126, 56, 102, 0.3)'
        ],
        transition: {
          duration: 0.6,
          times: [0, 0.25, 0.58, 0.75, 1],
          ease: 'easeInOut'
        }
      });
    }
  }, [itemCount, total, removedAnim, flyingAnim, lastRemoveEvent, buttonControls]);

  // Get up to 3 most recently added items for thumbnails
  const safeItems = Array.isArray(items) ? items : [];
  const thumbnailItems = safeItems
    .slice(-3)
    .reverse()
    .filter((item) => item && typeof item === 'object');

  return (
    <>
      {/* Removed product thumbnail - flying back to source */}
      {removedAnim && (
        <motion.div
          key={`remove-${removedAnim.id}`}
          className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0 shadow-lg"
          style={{
            position: 'fixed',
            left: removedAnim.left,
            top: removedAnim.top,
            zIndex: 1000,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
          animate={{
            x: removedAnim.deltaX,
            y: removedAnim.deltaY,
            scale: [1, 1.3, 1.1, 0.9, 0.85, 0.7, 0],
            rotate: -360,
            opacity: [1, 1, 1, 1, 0.85, 0.7, 0],
          }}
          transition={{
            x: { type: 'spring', stiffness: 120, damping: 14, mass: 0.8 },
            y: { type: 'spring', stiffness: 120, damping: 14, mass: 0.8 },
            scale: { duration: 0.8, times: [0, 0.15, 0.55, 0.7, 0.8, 0.9, 1] },
            rotate: { duration: 0.6, ease: 'easeInOut' },
            opacity: { duration: 0.8, times: [0, 0.15, 0.55, 0.7, 0.8, 0.9, 1] },
          }}
          onAnimationComplete={() => setRemovedAnim(null)}
        >
          {removedAnim.product?.imageUrl ? (
            <img
              src={removedAnim.product.imageUrl}
              alt={removedAnim.product.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400 text-xs font-semibold rounded-full">
              {removedAnim.product?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </motion.div>
      )}

      {/* Flying product thumbnail - going to cart */}
      {flyingAnim && (
        <motion.div
          key={`fly-${flyingAnim.id}`}
          className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0 shadow-lg"
          style={{
            position: 'fixed',
            left: flyingAnim.left,
            top: flyingAnim.top,
            zIndex: 1000,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
          animate={{
            x: flyingAnim.deltaX,
            y: flyingAnim.deltaY,
            scale: [1, 1.3, 1.1, 0.9, 0.85, 0.7, 0],
            rotate: 360,
            opacity: [1, 1, 1, 1, 0.85, 0.7, 0],
          }}
          transition={{
            x: { type: 'spring', stiffness: 120, damping: 14, mass: 0.8 },
            y: { type: 'spring', stiffness: 120, damping: 14, mass: 0.8 },
            scale: { duration: 0.8, times: [0, 0.15, 0.55, 0.7, 0.8, 0.9, 1] },
            rotate: { duration: 0.6, ease: 'easeInOut' },
            opacity: { duration: 0.8, times: [0, 0.15, 0.55, 0.7, 0.8, 0.9, 1] },
          }}
          onAnimationComplete={() => setFlyingAnim(null)}
        >
          {flyingAnim.product?.imageUrl ? (
            <img
              src={flyingAnim.product.imageUrl}
              alt={flyingAnim.product.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400 text-xs font-semibold rounded-full">
              {flyingAnim.product?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {itemCount > 0 && !shouldHidePill && (
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.8 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{ y: 60, opacity: 0, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position: 'fixed',
              bottom: dynamicBottom ? undefined : `${bottomOffset || 20}px`,
              pointerEvents: 'auto',
            }}
            className={`left-0 right-0 z-[9999] flex justify-center px-4 pb-4 md:pb-6 transition-all duration-300 ease-in-out bg-transparent ${dynamicBottom || ''}`}
          >
            <motion.button
              ref={linkRef}
              animate={buttonControls}
              initial={{ scale: 1, boxShadow: '0 4px 12px rgba(126, 56, 102, 0.3)' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                debugLog('View cart clicked, navigating to:', linkTo);
                navigate(linkTo);
              }}
              className={`bg-gradient-to-r from-[#55254b] via-[#7e3866] to-[#55254b] text-white rounded-full shadow-xl shadow-[#7e3866]/30 px-3 py-2 flex items-center gap-2 hover:from-[#55254b] hover:via-[#7e3866] hover:to-[#55254b] transition-all duration-300 pointer-events-auto border border-[#7e3866]/30 backdrop-blur-sm cursor-pointer ${pillClassName}`}
            >
              {/* Left: Product thumbnails */}
              <div className="flex items-center -space-x-4">
                {thumbnailItems.map((item, idx) => (
                  <motion.div
                    key={item?.product?.id || item?.id || `thumb-${idx}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: idx * 0.1,
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                    }}
                    className="w-7 h-7 rounded-full border-2 border-white/90 overflow-hidden bg-white flex-shrink-0 shadow-md"
                  >
                    {item?.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item?.product?.name || 'Item'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400 text-xs font-semibold">
                        {item?.product?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Middle: Text */}
              <motion.div
                className="flex flex-col"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <span className="text-xs font-bold leading-tight drop-shadow-sm">View cart</span>
                <span className="text-[10px] opacity-95 leading-tight font-medium">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </motion.div>

              {/* Right: Arrow icon */}
              <motion.div
                className="ml-auto bg-white/25 rounded-full p-1 backdrop-blur-sm"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

