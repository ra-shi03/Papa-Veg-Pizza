// ViewOrderDrawer.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Info, User, Pizza, CreditCard, Store, Truck, Clock, 
  MapPin, Phone, Mail, Globe, Calendar, CheckCircle2, AlertCircle, 
  ChevronRight, Printer, RotateCcw, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { getOrderDetails, getOrderStatusLogs } from '../AllOrdersData';

export default function ViewOrderDrawer({ 
  isOpen, 
  onClose, 
  orderId, 
  onCancelClick, 
  onRefundClick, 
  onTrackClick, 
  onPrintClick,
  userRole = 'Super Admin' // Mock role for permission based buttons
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Sync drawer open transition
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      fetchDetails();
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, orderId]);

  const fetchDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderDetails(orderId);
      const logs = await getOrderStatusLogs(orderId);
      setOrder(data);
      setTimeline(logs);
    } catch (err) {
      setError(err.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  if (!isRendered) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Details', icon: Info },
    { id: 'customer', label: 'Customer', icon: User },
    { id: 'products', label: 'Products', icon: Pizza },
    { id: 'payment', label: 'Payments', icon: CreditCard },
    { id: 'store', label: 'Store Details', icon: Store },
    { id: 'delivery', label: 'Delivery Info', icon: Truck },
    { id: 'timeline', label: 'Status Timeline', icon: Clock }
  ];

  // Helper for status badges
  const getStatusBadge = (status) => {
    const statusColors = {
      Placed: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
      Confirmed: 'bg-indigo-150 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      Preparing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Baking: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      Packed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      Assigned: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      'Out For Delivery': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      Cancelled: 'bg-red-105 text-red-600 dark:bg-red-950/20 dark:text-red-400'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[status] || 'bg-zinc-100 text-zinc-700'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const payColors = {
      Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      Pending: 'bg-yellow-100 text-yellow-750 dark:bg-yellow-900/30 dark:text-yellow-400',
      Failed: 'bg-red-105 text-red-655 dark:bg-red-950/20 dark:text-red-400',
      Refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${payColors[status] || 'bg-zinc-100 text-zinc-700'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  // Permission Checks (e.g. Super Admin role can perform everything)
  const canCancel = userRole === 'Super Admin' || userRole === 'Franchise Manager';
  const canRefund = userRole === 'Super Admin';
  const canTrack = true;
  const canPrint = true;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full lg:w-[80%] bg-zinc-50 dark:bg-zinc-950 shadow-2xl z-[80] transform transition-transform duration-300 ease-in-out flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'} text-zinc-800 dark:text-zinc-150 select-none`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50">
              Order {order?.orderNumber || 'Loading...'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 sm:mt-0">
              {order && getStatusBadge(order.orderStatus)}
              {order && getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDetails} 
              title="Refresh"
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>
            <button 
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white dark:bg-zinc-900 border-b border-zinc-250 dark:border-zinc-800 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex px-3 gap-1 py-1 min-w-max">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[var(--primary)] text-white shadow-sm font-black' 
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-250'
                  }`}
                >
                  <TabIcon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body - Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {loading ? (
            /* Loading skeletons */
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-zinc-200 dark:bg-zinc-900 rounded-xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-32 bg-zinc-200 dark:bg-zinc-900 rounded-xl"></div>
                <div className="h-32 bg-zinc-200 dark:bg-zinc-900 rounded-xl"></div>
              </div>
              <div className="h-40 bg-zinc-200 dark:bg-zinc-900 rounded-xl"></div>
            </div>
          ) : error ? (
            /* Error display */
            <div className="p-8 text-center text-red-500 flex flex-col items-center justify-center gap-2">
              <AlertCircle size={36} />
              <p className="font-bold text-sm">{error}</p>
              <button 
                onClick={fetchDetails} 
                className="mt-2 text-xs font-bold px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Tab content views */
            <>
              {/* TAB 1: BASIC DETAILS */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-3 shadow-sm">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Metadata</h3>
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between"><span className="text-zinc-450">Order ID:</span><span className="font-mono">{order.orderNumber}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-450">Date:</span><span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-450">Order Type:</span><span className="text-[var(--primary)] font-bold">{order.orderType}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-450">Channel:</span><span>App / Website</span></div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-3 shadow-sm">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Campaigns & Promos</h3>
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between"><span className="text-zinc-450">Coupon Code:</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{order.couponCode || 'None Applied'}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-450">Discount Amount:</span><span className="font-mono text-emerald-600 dark:text-emerald-400">-₹{order.discountAmount}</span></div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-3 shadow-sm md:col-span-2 lg:col-span-1">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Kitchen Instructions</h3>
                    <p className="text-xs italic text-zinc-600 dark:text-zinc-400 leading-normal">
                      {order.specialInstructions || '"No special instructions provided by customer."'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOMER INFORMATION */}
              {activeTab === 'customer' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-lg border border-[var(--primary)]/20">
                        {order.customer.name?.substring(0, 2).toUpperCase() || 'CU'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 truncate">{order.customer.name}</h4>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Customer Record</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-150 dark:border-zinc-800 text-xs font-semibold flex-1">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Phone size={14} className="shrink-0" />
                        <span>{order.customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{order.customer.email}</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                        <MapPin size={14} className="shrink-0 mt-0.5" />
                        <span className="leading-snug">{order.customer.address}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <span>Lat: {order.customer.lat}</span>
                        <span>Lng: {order.customer.lng}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-3 shadow-sm flex flex-col min-h-[200px]">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Customer Delivery Coordinates Map</h3>
                      <button 
                        onClick={() => window.open(`https://maps.google.com/?q=${order.customer.lat},${order.customer.lng}`, '_blank')}
                        className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        <Globe size={12} /> View on Google Maps
                      </button>
                    </div>
                    {/* Map Placeholder */}
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 relative flex items-center justify-center select-none min-h-[160px]">
                      <div className="absolute inset-0 bg-radial-gradient opacity-10 pointer-events-none"></div>
                      <div className="text-center space-y-1.5 p-4 z-10">
                        <MapPin size={28} className="mx-auto text-[var(--primary)] animate-bounce" />
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Customer Location Plot</p>
                        <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold max-w-[280px] mx-auto">
                          {order.customer.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-205 dark:border-zinc-800">
                        <tr>
                          <th className="px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider">Product Description</th>
                          <th className="px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-center">Variant</th>
                          <th className="px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-center">Qty</th>
                          <th className="px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-right">Unit Price</th>
                          <th className="px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-right">Tax (GST)</th>
                          <th className="px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {order.items?.map((item) => (
                          <tr key={item._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{item.productName}</td>
                            <td className="px-4 py-2.5 text-center font-semibold text-zinc-500">{item.variant || 'Standard'}</td>
                            <td className="px-4 py-2.5 text-center font-mono font-bold">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-zinc-400">₹{item.taxAmount.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">₹{item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-full sm:w-[320px] bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 p-4 rounded-xl space-y-2 shadow-sm text-xs font-semibold">
                      <div className="flex justify-between text-zinc-450">
                        <span>Items Subtotal:</span>
                        <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-450">
                        <span>CGST + SGST (5%):</span>
                        <span className="font-mono">₹{order.taxAmount.toFixed(2)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Discount Applied ({order.couponCode || 'Promo'}):</span>
                          <span className="font-mono">-₹{order.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-450 pb-2 border-b border-zinc-150 dark:border-zinc-800">
                        <span>Delivery & Handling Fee:</span>
                        <span className="font-mono">₹{order.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-sm">
                        <span className="font-bold text-zinc-900 dark:text-zinc-50">Grand Total:</span>
                        <span className="font-black text-[var(--primary)] font-mono">₹{order.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENT DETAILS */}
              {activeTab === 'payment' && (
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Payment Transaction Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Gateway Transaction ID</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">{order.payment.txnId || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Payment Processor / Gateway</span>
                      <span>{order.payment.gateway || 'Cash On Delivery'}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Payment Method</span>
                      <span className="text-[var(--primary)] font-bold">{order.paymentMethod}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Settled Date & Time</span>
                      <span>{order.payment.time !== 'N/A' ? `${new Date(order.payment.time).toLocaleDateString()} ${new Date(order.payment.time).toLocaleTimeString()}` : 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Refund Status Reference</span>
                      <span className="text-blue-500 font-bold">{order.payment.refundStatus || 'No Refund'}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Refunded Amount</span>
                      <span className="font-mono text-blue-500 font-bold">₹{(order.payment.refundAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: STORE DETAILS */}
              {activeTab === 'store' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-3 shadow-sm">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Franchise & Outlet Profile</h3>
                    
                    <div className="space-y-2.5 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-zinc-455">Franchise Group:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{order.franchise.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-455">Franchise City Scope:</span>
                        <span>{order.franchise.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-455">Pizza Store Name:</span>
                        <span className="text-[var(--primary)] font-bold">{order.store.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-455">Store Timing Hours:</span>
                        <span>{order.store.timings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-455">Average Preparation ETA:</span>
                        <span className="text-orange-500 font-bold">{order.store.prepEta}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-3 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Store Manager Contact</h3>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-150 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold text-xs shrink-0">
                          {order.store.manager?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{order.store.manager}</p>
                          <p className="text-[9px] text-zinc-400">Head Store Manager</p>
                        </div>
                      </div>
                      <div className="text-xs font-semibold space-y-2 pt-2">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Phone size={13} />
                          <span>{order.store.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-zinc-500">
                          <MapPin size={13} className="shrink-0 mt-0.5" />
                          <span>{order.store.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DELIVERY INFORMATION */}
              {activeTab === 'delivery' && (
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 space-y-4 shadow-sm">
                  {order.orderType === 'Pickup' ? (
                    <div className="p-8 text-center text-zinc-500 space-y-2">
                      <AlertTriangle size={32} className="mx-auto text-amber-500" />
                      <p className="font-bold text-sm">Customer Takeaway Order</p>
                      <p className="text-[10px] text-zinc-400 leading-normal max-w-[320px] mx-auto">
                        This order was placed as a Self-Pickup / Takeaway. No delivery fleet assignment is required for this transaction.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            {order.deliveryPartner.name?.substring(0, 2).toUpperCase() || 'RI'}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">{order.deliveryPartner.name || 'Not Allocated'}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Allocated Delivery Rider</p>
                          </div>
                        </div>

                        {order.deliveryPartner.name && (
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold">
                              OTP Pin: 9028
                            </span>
                          </div>
                        )}
                      </div>

                      {order.deliveryPartner.name ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Contact Number</span>
                            <span className="flex items-center gap-1"><Phone size={12} /> {order.deliveryPartner.phone}</span>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Vehicle Number</span>
                            <span>{order.deliveryPartner.vehicleNumber}</span>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Fleet Job Status</span>
                            <span className="text-emerald-500 font-bold">Active Delivery Run</span>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Delivery Distance</span>
                            <span>2.4 km (Hub to customer)</span>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Estimated Transit Duration</span>
                            <span>14 mins</span>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Assigned At</span>
                            <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 bg-zinc-50/50 dark:bg-zinc-950/20">
                          <p className="text-xs font-bold text-zinc-500">Delivery Fleet Allocation Pending</p>
                          <p className="text-[10px] text-zinc-400 max-w-[320px] mx-auto">
                            The kitchen is prepping this order. No delivery courier has been auto-dispatched or manually allocated yet.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 7: ORDER STATUS TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Status Audit Trail logs</h3>

                  <div className="relative pl-6 space-y-6">
                    <div className="absolute w-[2px] h-[calc(100%-1.5rem)] bg-zinc-200 dark:bg-zinc-800 left-[5px] top-4 z-0"></div>
                    
                    {timeline.map((node, index) => {
                      const isLast = index === timeline.length - 1;
                      return (
                        <div key={node._id} className="relative z-10 flex gap-4 text-xs font-semibold">
                          <div className={`absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 z-10 shadow-sm ${
                            isLast ? 'bg-[var(--primary)] animate-ping-slow' : 'bg-emerald-500'
                          }`}></div>
                          {isLast && (
                            <div className="absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border bg-[var(--primary)] z-10" />
                          )}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                                isLast ? 'bg-[var(--primary)] text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>{node.status}</span>
                              <span className="text-[10px] font-mono text-zinc-400">{new Date(node.createdAt).toLocaleDateString()} {new Date(node.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-[11px] text-zinc-800 dark:text-zinc-200">
                              Updated By: <span className="font-bold text-[var(--primary)]">{node.updatedBy}</span> ({node.role})
                            </div>
                            {node.remarks && (
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-450 italic mt-0.5 font-medium">Remarks: "{node.remarks}"</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            {/* Permission badge */}
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-full px-2 py-0.5 flex items-center gap-1">
              <ShieldCheck size={12} /> System Admin Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            {order && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered' && (
              <>
                {canCancel && (
                  <button 
                    onClick={() => onCancelClick(order)}
                    className="h-8 px-3.5 rounded-lg border border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    Cancel Order
                  </button>
                )}
              </>
            )}

            {order && order.paymentStatus === 'Paid' && (
              <>
                {canRefund && (
                  <button 
                    onClick={() => onRefundClick(order)}
                    className="h-8 px-3.5 rounded-lg border border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Initiate Refund
                  </button>
                )}
              </>
            )}

            {order && order.orderType === 'Delivery' && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
              <>
                {canTrack && (
                  <button 
                    onClick={() => onTrackClick(order)}
                    className="h-8 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Track Live
                  </button>
                )}
              </>
            )}

            {canPrint && (
              <button 
                onClick={() => onPrintClick(order)}
                className="h-8 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Invoice</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="h-8 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
