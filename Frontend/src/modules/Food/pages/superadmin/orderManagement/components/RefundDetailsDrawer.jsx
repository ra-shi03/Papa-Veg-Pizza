import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, AlertTriangle, User, CreditCard, 
  ShoppingBag, ClipboardList, Clock, RefreshCw, Eye, ExternalLink, Calendar, Info
} from 'lucide-react';
import { getRefundDetails } from '../RefundRequestsData';
import { toast } from 'sonner';

export default function RefundDetailsDrawer({ 
  isOpen, 
  onClose, 
  refundId, 
  onApprove, 
  onReject 
}) {
  const [refundDetails, setRefundDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [activeTab, setActiveTab] = useState('refundInfo'); // refundInfo, orderSnapshot, customerInfo, timeline

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
  }, [isOpen, refundId]);

  const fetchDetails = async () => {
    if (!refundId) return;
    setLoading(true);
    try {
      const data = await getRefundDetails(refundId);
      setRefundDetails(data);
    } catch (err) {
      toast.error('Failed to load refund details');
    } finally {
      setLoading(false);
    }
  };

  if (!isRendered) return null;

  const getStatusChip = (status) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-750 dark:text-yellow-400 border border-yellow-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Requested
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-755 dark:text-orange-400 border border-orange-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Under Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-755 dark:text-emerald-400 border border-emerald-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Approved
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-755 dark:text-blue-400 border border-blue-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-755 dark:text-green-400 border border-green-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-550"></span> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-755 dark:text-red-400 border border-red-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full lg:w-[80%] bg-zinc-50 dark:bg-zinc-955 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'} text-zinc-800 dark:text-zinc-150 select-none`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <CreditCard size={16} className="text-[var(--primary)]" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>Refund Detail Portal: {refundId}</span>
                {refundDetails && getStatusChip(refundDetails.status)}
              </h2>
              <p className="text-[10px] text-zinc-550 flex items-center gap-1 mt-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
                Reviewing requested items snapshot
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-805 transition-colors text-zinc-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 shrink-0 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'refundInfo', label: 'Refund Details', icon: CreditCard },
            { id: 'orderSnapshot', label: 'Order Snapshot', icon: ShoppingBag },
            { id: 'customerInfo', label: 'Customer Profiling', icon: User },
            { id: 'timeline', label: 'Refund Timeline & Audit', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 border-b-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'border-[var(--primary)] text-[var(--primary)]' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-100'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Attaching Refund Stream...</p>
          </div>
        ) : refundDetails ? (
          /* Scrollable Content Area */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* TAB 1: REFUND INFO */}
            {activeTab === 'refundInfo' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                
                {/* Meta details */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      Refund Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Refund ID:</span><span className="font-mono">{refundDetails.refundNumber}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Order ID:</span><span className="font-mono text-[var(--primary)]">{refundDetails.order?.orderNumber}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Customer Name:</span><span>{refundDetails.customer?.name}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Customer Contact:</span><span>{refundDetails.customer?.phone}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Requested Refund:</span><span className="font-bold text-zinc-900 dark:text-zinc-100">₹{refundDetails.refundAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Gateway Code:</span><span className="text-[var(--primary)]">{refundDetails.payment?.gatewayName}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5 col-span-1 sm:col-span-2"><span className="text-zinc-455">Transaction ID:</span><span className="font-mono">{refundDetails.payment?.transactionId}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5 col-span-1 sm:col-span-2"><span className="text-zinc-455">Requested At:</span><span>{new Date(refundDetails.createdAt).toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>

                  {/* Refund Reason & Attachments */}
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      Refund Claim Reason & Verification Attachments
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl">
                        <p className="text-xs italic font-semibold text-zinc-650 dark:text-zinc-350">"{refundDetails.reason}"</p>
                      </div>
                      
                      <div>
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Submitted Customer Proof</span>
                        <div className="relative max-w-sm aspect-[16/9] bg-zinc-100 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&q=80&w=800&h=450" 
                            alt="Burnt pizza verification proof"
                            className="object-cover w-full h-full opacity-90 transition-opacity hover:opacity-100"
                          />
                          <div className="absolute bottom-2.5 right-2.5 p-1 bg-black/60 rounded-md backdrop-blur text-white flex items-center gap-1 hover:bg-black/80 transition-colors cursor-pointer text-[9px] font-bold">
                            <Eye size={10} /> Full View
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gateway payload and admin notes */}
                <div className="space-y-4">
                  {/* Admin notes */}
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      Internal Admin Notes
                    </h3>
                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl min-h-[60px] text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                      {refundDetails.adminNotes ? refundDetails.adminNotes : 'No internal notes captured for this request.'}
                    </div>
                  </div>

                  {/* Gateway Raw Handshake response */}
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      Gateway Raw Handshake API
                    </h3>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                      {refundDetails.gatewayResponse ? (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(refundDetails.gatewayResponse, null, 2)}</pre>
                      ) : (
                        <span className="text-zinc-500 italic font-semibold">No Gateway handshakes made yet (Awaiting Admin release approval).</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: ORDER SNAPSHOT */}
            {activeTab === 'orderSnapshot' && refundDetails.order && (
              <div className="space-y-4">
                {/* Info Card Layout */}
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                    Original Order Summary: {refundDetails.order.orderNumber}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-zinc-450 block text-[9px] uppercase mb-0.5">Grand Total Paid</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{refundDetails.order.grandTotal.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-450 block text-[9px] uppercase mb-0.5">Coupon Code</span>
                      <span className="text-[var(--primary)] uppercase font-bold">{refundDetails.order.couponApplied || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-450 block text-[9px] uppercase mb-0.5">Order Status</span>
                      <span className={`px-2 py-0.2 rounded text-[9px] uppercase tracking-wider font-bold ${
                        refundDetails.order.orderStatus === 'Cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>{refundDetails.order.orderStatus}</span>
                    </div>
                    <div>
                      <span className="text-zinc-450 block text-[9px] uppercase mb-0.5">Payment Method</span>
                      <span>{refundDetails.order.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Products high density table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Product Items Detail Breakdown</span>
                    <span className="text-[10px] text-zinc-550 font-bold font-mono">Tax: ₹{refundDetails.order.taxAmount.toFixed(2)} | Discount: ₹{refundDetails.order.discount.toFixed(2)} | Delivery: ₹{refundDetails.order.deliveryFee.toFixed(2)}</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 font-bold uppercase tracking-wider text-[9px] text-zinc-400">
                      <tr>
                        <th className="px-4 py-2">Product Name</th>
                        <th className="px-4 py-2">Variant</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-805">
                      {refundDetails.order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/20">
                          <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-bold">{item.product}</td>
                          <td className="px-4 py-3 font-semibold text-zinc-500">{item.variant}</td>
                          <td className="px-4 py-3 text-center font-bold">{item.qty}</td>
                          <td className="px-4 py-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">₹{item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOMER INFO */}
            {activeTab === 'customerInfo' && refundDetails.customer && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-semibold text-xs">
                
                {/* Details card */}
                <div className="md:col-span-2 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex justify-between items-center">
                    <span>Profile Registry</span>
                    <button 
                      type="button" 
                      onClick={() => toast.success('Redirecting to CRM Customer Profile...')}
                      className="text-[var(--primary)] text-[10px] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>CRM File</span>
                      <ExternalLink size={10} />
                    </button>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Full Name:</span><span>{refundDetails.customer.name}</span></div>
                    <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Primary Email:</span><span>{refundDetails.customer.email}</span></div>
                    <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Mobile:</span><span>{refundDetails.customer.phone}</span></div>
                    <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Last Transacted:</span><span>{new Date(refundDetails.customer.lastOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                    <div className="flex justify-between col-span-1 sm:col-span-2 pb-1.5"><span className="text-zinc-455 shrink-0 mr-4">Primary Address:</span><span className="text-right leading-normal">{refundDetails.customer.address}</span></div>
                  </div>
                </div>

                {/* Lifetime spend card */}
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Lifetime Loyalty Spend</span>
                  <div className="text-2xl font-black text-[var(--primary)] mt-1 font-mono">
                    ₹{refundDetails.customer.lifetimeSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 mt-1 block">Completed Orders: {refundDetails.customer.lifetimeOrders} runs</span>
                  <div className="mt-3.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Trust Tier: Elite
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: REFUND TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                  Refund Timeline & Stepper Audit Trails
                </h3>

                <div className="relative pl-6 space-y-5 pt-1">
                  {/* Connecting Line */}
                  <div className="absolute w-[2px] h-[calc(100%-1.5rem)] bg-zinc-200 dark:bg-zinc-800 left-[5px] top-4 z-0"></div>
                  
                  {refundDetails.history.map((node, idx) => {
                    const isLast = idx === refundDetails.history.length - 1;
                    return (
                      <div key={idx} className="relative z-10 flex gap-4 text-xs font-semibold">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                          isLast ? 'bg-[var(--primary)] animate-pulse shadow-sm shadow-[var(--primary)]' : 'bg-emerald-500'
                        }`}></div>

                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.2 rounded text-[9px] uppercase tracking-wider font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-350">
                              {node.status}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {new Date(node.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-medium mt-1">
                            Triggered by: <span className="font-bold text-zinc-800 dark:text-zinc-200">{node.updatedBy}</span> ({node.role})
                          </p>
                          {node.remarks && (
                            <p className="text-[10px] text-zinc-450 italic font-medium mt-1 leading-normal border-l-2 border-zinc-200 dark:border-zinc-800 pl-2">
                              "{node.remarks}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
            <Info size={28} />
            <p className="text-xs font-bold uppercase tracking-widest mt-2">No Refund Dataset Available</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDetails}
              className="h-8 px-3.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Refresh details</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {refundDetails && (refundDetails.status === 'requested' || refundDetails.status === 'under_review') && (
              <>
                <button 
                  onClick={() => onReject(refundDetails)}
                  className="h-8 px-4 border border-red-250 dark:border-red-900/30 text-red-650 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  Reject Request
                </button>
                <button 
                  onClick={() => onApprove(refundDetails)}
                  className="h-8 px-4 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Approve Refund
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="h-8 px-4 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
