import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, AlertTriangle, User, Store, CreditCard, 
  ShoppingBag, ClipboardList, Clock, RefreshCw, Eye, ExternalLink, 
  Calendar, Info, HelpCircle, MessageSquare, Image, Film, FileText, Send, Trash2
} from 'lucide-react';
import { getDisputeDetails, postInternalNote } from '../DisputesData';
import { toast } from 'sonner';

export default function ViewDisputeDrawer({ 
  isOpen, 
  onClose, 
  disputeId, 
  onAssign, 
  onResolve, 
  onEscalate,
  onCloseDispute
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [activeTab, setActiveTab] = useState('general'); // general, participants, orderSnapshot, evidence, chatHistory, timeline, internalNotes
  
  // Internal Notes State
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState(null);

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
  }, [isOpen, disputeId]);

  const fetchDetails = async () => {
    if (!disputeId) return;
    setLoading(true);
    try {
      const data = await getDisputeDetails(disputeId);
      setDetails(data);
    } catch (err) {
      toast.error('Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const handlePostNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !details) return;

    setIsSubmittingNote(true);
    try {
      const response = await postInternalNote(details._id, newNote);
      if (response.success) {
        setDetails(prev => ({
          ...prev,
          notes: [...prev.notes, response.note]
        }));
        setNewNote('');
        toast.success('Internal notes saved');
      }
    } catch (err) {
      toast.error('Failed to post note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (!isRendered) return null;

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Low': return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200';
      case 'Medium': return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
      case 'Critical': return 'bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse';
      default: return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-750 dark:text-red-400 border border-red-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Open
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-755 dark:text-blue-400 border border-blue-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Assigned
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-755 dark:text-indigo-400 border border-indigo-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Investigating
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-755 dark:text-orange-400 border border-orange-200/50 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Escalated
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-755 dark:text-emerald-400 border border-emerald-200/50 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-150 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 border border-zinc-250 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Closed
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

      {/* Drawer Container */}
      <div 
        className={`fixed inset-y-0 right-0 w-full lg:w-[85%] bg-zinc-50 dark:bg-zinc-955 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'} text-zinc-800 dark:text-zinc-150 select-none`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-[var(--primary)]" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>Dispute Resolution Hub: {disputeId}</span>
                {details && getStatusChip(details.status)}
              </h2>
              <p className="text-[10px] text-zinc-550 flex items-center gap-1 mt-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
                Investigation SLA Active
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

        {/* Tab Selection */}
        <div className="px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'general', label: 'General Details', icon: Info },
            { id: 'participants', label: 'Participants', icon: User },
            { id: 'orderSnapshot', label: 'Order Snapshot', icon: ShoppingBag },
            { id: 'evidence', label: 'Evidence Gallery', icon: Image },
            { id: 'chatHistory', label: 'Chat History', icon: MessageSquare },
            { id: 'timeline', label: 'Dispute Steppers', icon: Clock },
            { id: 'internalNotes', label: 'Internal Notes', icon: ClipboardList }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 border-b-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'border-b-[var(--primary)] text-[var(--primary)]' 
                    : 'border-b-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-100'
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
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Attaching Dispute Diagnostic Stream...</p>
          </div>
        ) : details ? (
          /* Tab contents */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* TAB 1: GENERAL DETAILS */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 space-y-4">
                  
                  {/* General Profile fields */}
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3 text-xs font-semibold">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      Conflict Metadata Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Dispute ID:</span><span className="font-mono">{details.disputeNumber}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Order Number:</span><span className="font-mono text-[var(--primary)]">{details.order?.orderNumber}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Raised By:</span><span>{details.customer?.name} ({details.raisedByRole})</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Dispute Type:</span><span className="text-red-650 dark:text-red-400">{details.type}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5">
                        <span className="text-zinc-455">Ticket Priority:</span>
                        <span className={`px-2 py-0.2 rounded text-[9px] uppercase tracking-wider font-bold ${getPriorityBadge(details.priority)}`}>
                          {details.priority}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Assigned Agent:</span><span>{details.assignedTo || 'Unassigned'}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">SLA Deadline:</span><span className="text-orange-500 font-bold">{details.deadline ? new Date(details.deadline).toLocaleString('en-IN') : 'N/A'}</span></div>
                      <div className="flex justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-1.5"><span className="text-zinc-455">Raised Date:</span><span>{new Date(details.createdAt).toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>

                  {/* Dispute Description */}
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      Issue Description
                    </h3>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-850">
                      {details.description}
                    </p>
                  </div>

                </div>

                {/* Resolution Summary Side Card */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3 text-xs font-semibold">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      Resolution Summary
                    </h3>
                    {details.status === 'resolved' ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                          <div className="flex justify-between"><span className="text-zinc-455">Resolution:</span><span className="text-emerald-600 font-bold">{details.resolutionType}</span></div>
                          <p className="text-[10px] text-zinc-500 italic mt-1 font-medium">"{details.resolutionNotes}"</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-450 italic font-semibold">
                        This conflict ticket has not been resolved yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS */}
            {activeTab === 'participants' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                {/* Customer card */}
                {details.customer && (
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex items-center gap-1">
                        <User size={12} /> Customer Profile
                      </h4>
                      <div className="space-y-1.5">
                        <p className="text-zinc-900 dark:text-zinc-50 font-bold">{details.customer.name}</p>
                        <p className="text-zinc-500">{details.customer.phone}</p>
                        <p className="text-zinc-500 truncate" title={details.customer.email}>{details.customer.email}</p>
                        <p className="text-[10px] text-zinc-400 font-medium leading-normal">{details.customer.address}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toast.info('Navigating to Customer Profile')}
                      className="mt-4 w-full py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-700 dark:text-zinc-300 hover:text-[var(--primary)] rounded-lg font-bold transition-all text-[11px] cursor-pointer"
                    >
                      View Customer File
                    </button>
                  </div>
                )}

                {/* Store card */}
                {details.store && (
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex items-center gap-1">
                        <Store size={12} /> Store Outlet
                      </h4>
                      <div className="space-y-1.5">
                        <p className="text-zinc-900 dark:text-zinc-50 font-bold">{details.store.name}</p>
                        <p className="text-zinc-500">Manager: {details.store.manager}</p>
                        <p className="text-zinc-500">{details.store.phone}</p>
                        <p className="text-[10px] text-zinc-400 font-medium leading-normal">{details.store.address}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toast.info('Navigating to Store Profile')}
                      className="mt-4 w-full py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-700 dark:text-zinc-300 hover:text-[var(--primary)] rounded-lg font-bold transition-all text-[11px] cursor-pointer"
                    >
                      View Store File
                    </button>
                  </div>
                )}

                {/* Rider card */}
                {details.rider && (
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex items-center gap-1">
                        <User size={12} /> Delivery Partner
                      </h4>
                      <div className="space-y-1.5">
                        <p className="text-zinc-900 dark:text-zinc-50 font-bold">{details.rider.name}</p>
                        <p className="text-zinc-500">{details.rider.phone}</p>
                        <p className="text-zinc-500 font-mono">Veh: {details.rider.vehicleNumber}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toast.info('Navigating to Rider Profile')}
                      className="mt-4 w-full py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-700 dark:text-zinc-300 hover:text-[var(--primary)] rounded-lg font-bold transition-all text-[11px] cursor-pointer"
                    >
                      View Rider File
                    </button>
                  </div>
                )}

                {/* Franchise card */}
                {details.franchise && (
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex items-center gap-1">
                        <Store size={12} /> Franchise Entity
                      </h4>
                      <div className="space-y-1.5">
                        <p className="text-zinc-900 dark:text-zinc-50 font-bold">{details.franchise.name}</p>
                        <p className="text-zinc-500">Owner: {details.franchise.owner}</p>
                        <p className="text-zinc-500">{details.franchise.phone}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toast.info('Navigating to Franchise Profile')}
                      className="mt-4 w-full py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-700 dark:text-zinc-300 hover:text-[var(--primary)] rounded-lg font-bold transition-all text-[11px] cursor-pointer"
                    >
                      View Franchise File
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ORDER SNAPSHOT */}
            {activeTab === 'orderSnapshot' && details.order && (
              <div className="space-y-4">
                {/* Summary card */}
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3 text-xs font-semibold">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                    Order Snapshot: {details.order.orderNumber}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><span className="text-zinc-400 block text-[9px] uppercase">Grand Total</span><span className="font-bold font-mono">₹{details.order.grandTotal.toFixed(2)}</span></div>
                    <div><span className="text-zinc-400 block text-[9px] uppercase">Coupon Applied</span><span className="text-[var(--primary)] font-bold">{details.order.couponApplied}</span></div>
                    <div><span className="text-zinc-400 block text-[9px] uppercase">Payment Status</span><span>{details.order.paymentStatus} ({details.order.paymentMethod})</span></div>
                    <div><span className="text-zinc-400 block text-[9px] uppercase">Order Status</span><span>{details.order.orderStatus}</span></div>
                    <div className="col-span-2 md:col-span-4"><span className="text-zinc-400 block text-[9px] uppercase">Delivery Address</span><span className="leading-normal block mt-0.5">{details.order.deliveryAddress}</span></div>
                  </div>
                </div>

                {/* Items table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Products Breakdown</span>
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
                      {details.order.items.map((item, idx) => (
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

            {/* TAB 4: EVIDENCE GALLERY */}
            {activeTab === 'evidence' && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                  Dispute Evidence & Photo Proofs
                </h3>
                
                {!details.evidence || details.evidence.length === 0 ? (
                  <div className="text-center py-8 text-zinc-450 italic font-semibold">
                    No files or attachments have been uploaded for verification yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold">
                    {details.evidence.map((file) => (
                      <div key={file._id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950">
                        {file.category === 'Images' ? (
                          <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 overflow-hidden group">
                            <img 
                              src={file.url} 
                              alt={file.name} 
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setLightboxImg(file.url)}
                                className="p-1.5 bg-white dark:bg-zinc-900 rounded-full text-zinc-800 dark:text-zinc-200 hover:scale-105 transition-all cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[4/3] bg-zinc-200 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-450 p-4 text-center">
                            <FileText size={32} className="mb-2" />
                            <span className="font-bold truncate max-w-full">{file.name}</span>
                          </div>
                        )}
                        
                        <div className="p-3 space-y-1.5 border-t border-zinc-200 dark:border-zinc-850">
                          <div className="flex justify-between"><span className="text-[10px] uppercase text-zinc-400">{file.category}</span><span className="font-mono text-[10px] text-zinc-500">{file.size}</span></div>
                          <p className="text-[10px] text-zinc-400 truncate">Uploaded by: {file.uploadedBy}</p>
                          <button 
                            onClick={() => toast.success(`Simulating download of ${file.name}`)}
                            className="w-full mt-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Download Proof file
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CHAT HISTORY */}
            {activeTab === 'chatHistory' && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex flex-col h-[450px] overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={13} /> Active Dispute Chat Log
                  </span>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Active Session</span>
                </div>

                {/* Messages Box */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
                  {details.messages.map((msg) => {
                    const isAdmin = msg.role === 'Admin' || msg.role === 'Agent';
                    return (
                      <div key={msg._id} className={`flex flex-col max-w-[70%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <span className="text-[9px] font-bold text-zinc-400 mb-0.5">{msg.sender} ({msg.role})</span>
                        <div className={`p-2.5 rounded-2xl text-xs font-semibold ${
                          isAdmin 
                            ? 'bg-[var(--primary)] text-white rounded-tr-none' 
                            : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-850'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-400 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated chat input */}
                <div className="p-3 border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 shrink-0 flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type response payload to customer & store channels..."
                    className="flex-1 h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value;
                        if (!val.trim()) return;
                        setDetails(prev => ({
                          ...prev,
                          messages: [
                            ...prev.messages,
                            { _id: `MSG-${Date.now()}`, sender: 'Shubham Jamliya', role: 'Admin', message: val, timestamp: new Date().toISOString() }
                          ]
                        }));
                        e.currentTarget.value = '';
                        toast.success('Support broadcast payload sent');
                      }
                    }}
                  />
                  <button 
                    onClick={() => toast.info('Press Enter in the text field to dispatch')}
                    className="h-9 w-9 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                  Resolution Timelines & Stepper Audit Trails
                </h3>

                <div className="relative pl-6 space-y-5 pt-1">
                  <div className="absolute w-[2px] h-[calc(100%-1.5rem)] bg-zinc-200 dark:bg-zinc-800 left-[5px] top-4 z-0"></div>
                  
                  {details.logs.map((log, idx) => {
                    const isLast = idx === details.logs.length - 1;
                    return (
                      <div key={idx} className="relative z-10 flex gap-4 text-xs font-semibold">
                        <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                          isLast ? 'bg-[var(--primary)] animate-pulse shadow-sm shadow-[var(--primary)]' : 'bg-emerald-500'
                        }`}></div>

                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.2 rounded text-[9px] uppercase tracking-wider font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-350">
                              {log.status}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {new Date(log.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-medium mt-1">
                            Triggered by: <span className="font-bold text-zinc-800 dark:text-zinc-200">{log.changedBy}</span> ({log.role})
                          </p>
                          {log.remarks && (
                            <p className="text-[10px] text-zinc-455 italic font-medium mt-1 leading-normal border-l-2 border-zinc-200 dark:border-zinc-800 pl-2">
                              "{log.remarks}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 7: INTERNAL NOTES */}
            {activeTab === 'internalNotes' && (
              <div className="space-y-4">
                {/* Notes Input Area */}
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                    Add Confidential Note (Internal Admins Only)
                  </h3>
                  <form onSubmit={handlePostNote} className="space-y-2">
                    <textarea 
                      rows="3"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add investigation updates, private feedback, or agent task directives..."
                      className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500"
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={isSubmittingNote || !newNote.trim()}
                        className="h-8 px-4 bg-[var(--primary)] hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        Save internal note
                      </button>
                    </div>
                  </form>
                </div>

                {/* Notes Records */}
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                    Confidential Notes Log
                  </h3>
                  {!details.notes || details.notes.length === 0 ? (
                    <div className="text-center py-6 text-zinc-450 italic font-semibold">
                      No internal notes recorded for this conflict ticket.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {details.notes.map((note) => (
                        <div key={note._id} className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-zinc-400">
                            <span className="font-bold">{note.createdBy} ({note.role})</span>
                            <span className="font-mono">{new Date(note.createdTime).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-350 font-semibold leading-relaxed whitespace-pre-wrap">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
            <Info size={28} />
            <p className="text-xs font-bold uppercase tracking-widest mt-2">Dispute snapshot not available</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDetails}
              className="h-8 px-3.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Refresh diagnosis</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {details && details.status !== 'closed' && details.status !== 'resolved' && (
              <>
                <button 
                  onClick={() => onAssign(details)}
                  className="h-8 px-4 border border-zinc-250 dark:border-zinc-850 text-zinc-705 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  Allocate Agent
                </button>
                <button 
                  onClick={() => onEscalate(details)}
                  className="h-8 px-4 border border-orange-250 dark:border-orange-900/30 text-orange-650 dark:text-orange-400 rounded-lg text-xs font-bold hover:bg-orange-50 dark:hover:bg-orange-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  Escalate Dispute
                </button>
                <button 
                  onClick={() => onResolve(details)}
                  className="h-8 px-4 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Resolve Dispute
                </button>
              </>
            )}
            {details && details.status === 'resolved' && (
              <button 
                onClick={() => onCloseDispute(details)}
                className="h-8 px-4 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
              >
                Close Ticket
              </button>
            )}
            <button 
              onClick={onClose}
              className="h-8 px-4 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              Close Drawer
            </button>
          </div>
        </div>

      </div>

      {/* Image Lightbox Viewer Overlay */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur z-[200] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-zinc-800 shadow-2xl">
            <img src={lightboxImg} alt="Lightbox evidence details" className="object-contain w-full h-full" />
            <button 
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 p-1 bg-black/50 hover:bg-black/80 rounded-full text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
