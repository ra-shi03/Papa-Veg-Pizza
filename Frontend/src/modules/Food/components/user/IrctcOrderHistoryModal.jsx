import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Train, ChevronRight, Clock, AlertTriangle, MapPin, Hash, CheckCircle2 } from 'lucide-react';
import { orderAPI } from '@food/api';

/**
 * Checks if an order belongs specifically to Delivery on Train
 */
export function isDeliveryOnTrainOrder(order) {
  if (!order) return false;

  // 1. Explicit service/order type flags
  if (order.isTrainOrder === true || order.isTrain === true) return true;
  const orderType = String(order.orderType || order.deliveryType || order.serviceType || order.deliveryMethod || '').toLowerCase();
  if (orderType === 'train' || orderType === 'delivery_on_train' || orderType === 'irctc') return true;

  // 2. Train details object or PNR
  if (order.trainDetails || order.trainInfo || order.pnr || order.pnrNumber) return true;

  // 3. Search delivery address fields
  const addr = order.deliveryAddress || order.address || {};
  const addrString = typeof addr === 'string'
    ? addr
    : `${addr.street || ''} ${addr.additionalDetails || ''} ${addr.city || ''} ${addr.label || ''} ${addr.address || ''}`;

  const combinedText = `${addrString} ${order.note || ''} ${order.instructions || ''} ${order.specialInstructions || ''}`.toLowerCase();

  if (
    combinedText.includes('train:') ||
    combinedText.includes('irctc') ||
    combinedText.includes('coach:') ||
    combinedText.includes('pnr:') ||
    combinedText.includes('pnr ')
  ) {
    return true;
  }

  return false;
}

/**
 * Parses train journey information out of trainDetails or address string
 */
function parseTrainJourney(order) {
  if (order?.trainDetails && typeof order.trainDetails === 'object') {
    return {
      trainName: order.trainDetails.trainName || order.trainDetails.name || '',
      trainNo: order.trainDetails.trainNo || order.trainDetails.number || '',
      station: order.trainDetails.station || order.trainDetails.stationName || '',
      coach: order.trainDetails.coach || order.trainDetails.coachNo || '',
      seat: order.trainDetails.seat || order.trainDetails.seatNo || '',
      pnr: order.trainDetails.pnr || order.pnr || ''
    };
  }

  const addr = order?.deliveryAddress || order?.address || '';
  const text = typeof addr === 'string'
    ? addr
    : `${addr.street || ''} ${addr.additionalDetails || ''} ${addr.city || ''} ${order?.note || ''}`;

  const trainMatch = text.match(/Train:\s*([^,]+)/i);
  const coachMatch = text.match(/Coach:\s*([^,]+)/i);
  const seatMatch = text.match(/Seat:\s*([^,]+)/i);
  const stationMatch = text.match(/Station:\s*([^,]+)/i);
  const pnrMatch = text.match(/PNR[:\s]*([0-9]{10})/i) || text.match(/\b([0-9]{10})\b/);

  return {
    trainName: trainMatch ? trainMatch[1].trim() : '',
    coach: coachMatch ? coachMatch[1].trim() : '',
    seat: seatMatch ? seatMatch[1].trim() : '',
    station: stationMatch ? stationMatch[1].trim() : '',
    pnr: pnrMatch ? pnrMatch[1].trim() : (order?.pnr || '')
  };
}

export default function IrctcOrderHistoryModal({
  isOpen,
  onClose,
  isDarkMode = false
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trainOrders, setTrainOrders] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const loadOrders = async () => {
      const collected = [];
      const seenIds = new Set();

      const addOrder = (raw) => {
        if (!raw) return;
        const id = String(raw.orderId || raw.order_id || raw._id || raw.id || '');
        if (id && seenIds.has(id)) return;
        if (id) seenIds.add(id);

        if (isDeliveryOnTrainOrder(raw)) {
          collected.push(raw);
        }
      };

      // 1. Read from local storage (pvp_train_orders and userOrders)
      try {
        const pvpTrainOrders = JSON.parse(localStorage.getItem('pvp_train_orders') || '[]');
        if (Array.isArray(pvpTrainOrders)) {
          pvpTrainOrders.forEach(addOrder);
        }
      } catch (_) {}

      try {
        const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
        if (Array.isArray(userOrders)) {
          userOrders.forEach(addOrder);
        }
      } catch (_) {}

      // 2. Fetch from Backend API only if user is logged in with valid token
      const userToken = localStorage.getItem('user_accessToken') || localStorage.getItem('accessToken');
      const isAuthenticated = localStorage.getItem('user_authenticated') === 'true' || Boolean(userToken);

      if (userToken && isAuthenticated) {
        try {
          const res = await orderAPI.getOrders({ limit: 100, page: 1 });
          const apiOrders = res?.data?.data?.orders || res?.data?.orders || (Array.isArray(res?.data?.data) ? res.data.data : []);
          if (Array.isArray(apiOrders)) {
            apiOrders.forEach(addOrder);
          }
        } catch (_) {
          // Backend failure or expired token is safe; fallback to local
        }
      }

      if (isMounted) {
        // Sort newest first
        collected.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setTrainOrders(collected);
        setLoading(false);
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className={`relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden font-['Poppins',sans-serif] transition-colors duration-200 ${
            isDarkMode ? 'bg-[#18181A] text-white' : 'bg-white text-zinc-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            /* Loading State */
            <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[260px]">
              <div className="w-10 h-10 border-3 border-[#E53935] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Checking your IRCTC orders...
              </p>
            </div>
          ) : trainOrders.length === 0 ? (
            /* ── EMPTY STATE: EXACT REPRODUCTION OF USER IMAGE 2 ── */
            <div className="px-6 pt-8 pb-7 flex flex-col items-center text-center">
              {/* Warning Triangle Icon Matching Screenshot */}
              <div className="flex items-center justify-center text-[#E53935]">
                <svg
                  className="w-16 h-16 text-[#E53935]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="font-bold text-[18px] text-zinc-900 dark:text-white mt-4">
                No Orders Found
              </h3>

              {/* Subtitle */}
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium text-center mt-1.5 leading-relaxed max-w-[280px]">
                Looks like you haven't placed any orders with IRCTC yet.
              </p>

              {/* Big Red OK Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-[#E53935] hover:bg-[#D32F2F] active:bg-[#B71C1C] text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] mt-6 shadow-sm cursor-pointer border-0 outline-none"
              >
                OK
              </button>
            </div>
          ) : (
            /* ── TRAIN ORDERS LIST: SHOWN WHEN CUSTOMER HAS TRAIN ORDERS ── */
            <>
              {/* Header */}
              <div
                className={`px-5 py-4 flex items-center justify-between border-b shrink-0 ${
                  isDarkMode ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-100 bg-zinc-50/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center">
                    <Train size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                      IRCTC Order History
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {trainOrders.length} {trainOrders.length === 1 ? 'train order' : 'train orders'} found
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-colors cursor-pointer bg-transparent border-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable List */}
              <div className="p-4 space-y-3.5 overflow-y-auto max-h-[68vh] scrollbar-none text-left">
                {trainOrders.map((order, idx) => {
                  const orderId = order.orderId || order.order_id || order._id || order.id || `IRCTC-${idx + 1}`;
                  const journey = parseTrainJourney(order);
                  const status = String(order.orderStatus || order.status || 'confirmed').toLowerCase();
                  const total = order.pricing?.total ?? order.total ?? order.amount ?? 0;
                  const items = Array.isArray(order.items) ? order.items : [];

                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Recently Placed';

                  const isDelivered = status === 'delivered' || status === 'completed';
                  const isCancelled = status.includes('cancel');

                  return (
                    <div
                      key={orderId || idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDarkMode
                          ? 'bg-zinc-900/90 border-zinc-800'
                          : 'bg-white border-zinc-200/80 shadow-xs'
                      }`}
                    >
                      {/* Top Bar: Order ID, Date, Status */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                          <span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                            #{orderId}
                          </span>
                          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                            {dateStr}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Journey / Train Details Banner */}
                      <div
                        className={`mt-2.5 p-2.5 rounded-xl flex flex-col gap-1 text-[11px] ${
                          isDarkMode ? 'bg-zinc-800/60' : 'bg-red-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-[#E53935]">
                          <Train size={14} className="shrink-0" />
                          <span>{journey.trainName || 'Express Train'}</span>
                          {journey.pnr && (
                            <span className="text-zinc-500 font-medium text-[10px] ml-auto">
                              PNR: {journey.pnr}
                            </span>
                          )}
                        </div>

                        {(journey.station || journey.coach || journey.seat) && (
                          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 text-[10px] font-medium pt-0.5">
                            {journey.station && (
                              <span>Station: <strong className="text-zinc-800 dark:text-zinc-200">{journey.station}</strong></span>
                            )}
                            {journey.coach && (
                              <span>Coach: <strong className="text-zinc-800 dark:text-zinc-200">{journey.coach}</strong></span>
                            )}
                            {journey.seat && (
                              <span>Seat: <strong className="text-zinc-800 dark:text-zinc-200">{journey.seat}</strong></span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Items Ordered */}
                      {items.length > 0 && (
                        <div className="mt-2.5 space-y-1">
                          {items.map((it, i) => (
                            <div key={i} className="flex justify-between text-xs text-zinc-700 dark:text-zinc-300">
                              <span className="truncate pr-2">
                                {it.quantity || 1}x {it.name || it.title || 'Pizza Item'}
                              </span>
                              <span className="font-semibold shrink-0">
                                ₹{it.price ? it.price * (it.quantity || 1) : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer: Total & Track Button */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Paid</span>
                          <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                            ₹{total}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            let target = `/user/orders/${orderId}`;
                            if (window.location.pathname.startsWith('/food') && !target.startsWith('/food')) {
                              target = `/food${target}`;
                            }
                            navigate(target);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 text-xs font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer border-0"
                        >
                          <span>Track Order</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Close Bar */}
              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-xs text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer border-0"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

