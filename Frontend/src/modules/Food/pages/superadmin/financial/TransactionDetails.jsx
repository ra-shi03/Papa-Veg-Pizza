import React, { useState, useEffect } from 'react';
import { 
  X, Landmark, CreditCard, FileText, ShoppingBag, 
  ExternalLink, User, Calendar, AlertTriangle, CheckCircle, 
  Clock, XCircle, Copy, ChevronDown, ChevronRight, Search, 
  Download, ArrowRight, CornerDownRight, History 
} from 'lucide-react';
import { useTransactionDetails } from './hooks/useTransactionQuery';
import { toast } from 'sonner';

export default function TransactionDetails({ isOpen, onClose, id }) {
  const { data: details, loading, error, refetch } = useTransactionDetails(id);
  const [expandedSections, setExpandedSections] = useState({
    gatewayResponse: true,
    requestPayload: false,
    responsePayload: false
  });
  
  // Local state for webhooks search and pagination
  const [webhookSearch, setWebhookSearch] = useState('');
  const [webhookPage, setWebhookPage] = useState(1);
  const webhooksPerPage = 3;

  // Local state for webhook expandable row details
  const [expandedWebhookId, setExpandedWebhookId] = useState(null);

  // Reset states on open/id change
  useEffect(() => {
    if (isOpen) {
      setWebhookSearch('');
      setWebhookPage(1);
      setExpandedWebhookId(null);
      setExpandedSections({
        gatewayResponse: true,
        requestPayload: false,
        responsePayload: false
      });
      if (refetch) refetch();
    }
  }, [isOpen, id]);

  if (!isOpen) return null;

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyJSON = (data, label) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Captured':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15';
      case 'Authorized':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15';
      case 'Failed':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15';
      case 'Refunded':
        return 'bg-zinc-550/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/15';
      default:
        return 'bg-zinc-150 text-zinc-750 dark:bg-zinc-850 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-705';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
      case 'Captured':
        return <CheckCircle size={13} className="text-emerald-500" />;
      case 'Authorized':
        return <Clock size={13} className="text-blue-500" />;
      case 'Pending':
        return <Clock size={13} className="text-amber-500" />;
      case 'Failed':
        return <XCircle size={13} className="text-rose-500" />;
      case 'Refunded':
        return <AlertTriangle size={13} className="text-zinc-650 dark:text-zinc-400" />;
      default:
        return <Clock size={13} className="text-zinc-400" />;
    }
  };

  // Webhooks filter & paginate
  const webhooks = details?.webhookLogs || [];
  const filteredWebhooks = webhooks.filter(w => 
    w.event.toLowerCase().includes(webhookSearch.toLowerCase()) ||
    w.response.toLowerCase().includes(webhookSearch.toLowerCase())
  );
  const totalWebhookPages = Math.ceil(filteredWebhooks.length / webhooksPerPage) || 1;
  const paginatedWebhooks = filteredWebhooks.slice((webhookPage - 1) * webhooksPerPage, webhookPage * webhooksPerPage);

  // JSON viewer render
  const renderJSONViewer = (data, expandedKey, label) => {
    const isExpanded = expandedSections[expandedKey];
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-zinc-50 dark:bg-zinc-950/20">
        <div 
          onClick={() => toggleSection(expandedKey)}
          className="px-4 py-2.5 bg-zinc-100/60 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center cursor-pointer select-none"
        >
          <span className="text-[11px] font-bold text-zinc-750 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {label}
          </span>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleCopyJSON(data, label)}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Copy JSON Payload"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
        {isExpanded && (
          <pre className="p-4 text-[10px] font-mono text-zinc-800 dark:text-zinc-300 overflow-x-auto custom-scrollbar max-h-[160px] leading-relaxed bg-zinc-950/5 text-black dark:text-zinc-300 select-all whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  // Skeleton view
  const renderSkeleton = () => (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
        <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
      </div>
      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
    </div>
  );

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-[1400px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Landmark size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-extrabold text-black dark:text-white">
                  Audit Ledger Trace: <span className="font-mono text-zinc-550 dark:text-zinc-400">{id}</span>
                </h3>
                {details?.transactionInfo && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${getStatusBadge(details.transactionInfo.status)}`}>
                    {getStatusIcon(details.transactionInfo.status)}
                    {details.transactionInfo.status}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                Inspect gateway payloads, webhook receipts, retry logs, and operational workflow timelines
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-805 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Section */}
        {loading || !details ? renderSkeleton() : (
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar space-y-6">
            
            {/* Grid 1: Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Section 1: Transaction Information */}
              <div className="p-5 border border-zinc-200 dark:border-zinc-805 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                  <CreditCard className="text-[var(--primary)] shrink-0" size={16} />
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Section 1: Transaction Information
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Transaction ID</span>
                    <p className="font-mono font-bold text-zinc-900 dark:text-white truncate">{details.transactionInfo.transactionId}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Gateway Txn ID</span>
                    <p className="font-mono font-bold text-zinc-900 dark:text-white truncate" title={details.transactionInfo.gatewayTransactionId}>
                      {details.transactionInfo.gatewayTransactionId || '—'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Reference No</span>
                    <p className="font-mono font-bold text-zinc-900 dark:text-white truncate" title={details.transactionInfo.referenceId}>
                      {details.transactionInfo.referenceId || '—'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Ledger Amount</span>
                    <p className="font-black text-[var(--primary)] font-mono text-sm">₹{details.transactionInfo.amount?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Gateway Provider</span>
                    <span className="inline-block mt-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-955/20 border border-blue-150 px-2 py-0.2 rounded font-mono">
                      {details.transactionInfo.gateway}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Payment Method</span>
                    <p className="font-extrabold text-zinc-800 dark:text-white">{details.transactionInfo.paymentMethod}</p>
                  </div>
                  <div className="space-y-0.5 col-span-2 sm:col-span-3">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Authorization Timestamp</span>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} className="text-zinc-450" />
                      {details.transactionInfo.createdAt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Order Information */}
              <div className="p-5 border border-zinc-200 dark:border-zinc-805 rounded-2xl bg-zinc-50/40 dark:bg-zinc-955/10 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                    <ShoppingBag className="text-[var(--primary)] shrink-0" size={16} />
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Section 2: Order & Customer Origin
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs mt-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Order Reference</span>
                      <p className="font-mono font-bold text-zinc-900 dark:text-white truncate">{details.orderInfo.orderNumber}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Customer</span>
                      <p className="font-extrabold text-zinc-900 dark:text-white truncate flex items-center gap-1">
                        <User size={11} className="text-zinc-400" />
                        {details.orderInfo.customerName || 'Walk-in'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Franchise Node</span>
                      <p className="font-bold text-zinc-850 dark:text-zinc-300 truncate">{details.orderInfo.franchiseName || 'N/A'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Store Branch</span>
                      <p className="font-bold text-zinc-850 dark:text-zinc-300 truncate">{details.orderInfo.storeName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850/80 flex justify-end">
                  <button 
                    onClick={() => toast.info(`Navigating to order details for ${details.orderInfo.orderNumber}`)}
                    className="h-8 px-3.5 border border-zinc-250 dark:border-zinc-800 text-zinc-750 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    View Order
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>

            </div>

            {/* Section 6: Error Messages (Only if Failed) */}
            {details.transactionInfo.status === 'Failed' && (
              <div className="p-4 border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-955/20 rounded-2xl flex items-start gap-3 shadow-inner">
                <AlertTriangle className="text-rose-550 mt-0.5 shrink-0 animate-pulse" size={20} />
                <div className="space-y-2 text-xs">
                  <h5 className="font-bold text-rose-700 dark:text-rose-455 uppercase tracking-wider text-[10px]">
                    Section 6: Gateway Clearance Failure Audit
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[9.5px] text-rose-500/70 font-bold uppercase">Error Code</span>
                      <p className="font-mono font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                        {details.responsePayload.error_code || 'GATEWAY_DECLINE'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-rose-500/70 font-bold uppercase">Failure Reason</span>
                      <p className="font-semibold text-rose-800 dark:text-rose-350 mt-0.5">
                        {details.responsePayload.error_description || details.transactionInfo.errorMessage || 'Unknown checkout issue.'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-rose-500/70 font-bold uppercase">Suggested Reconciliation</span>
                      <p className="font-semibold text-rose-800 dark:text-rose-350 mt-0.5 italic">
                        Verify customer wallet balance or trigger retry.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid 2: Timelines & Payloads */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Section 9: Timeline */}
              <div className="lg:col-span-1 p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/20 dark:bg-zinc-950/5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <History className="text-[var(--primary)] shrink-0" size={16} />
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Section 9: Timeline Trace
                  </h4>
                </div>

                <div className="relative pl-6 space-y-5 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-800">
                  {details.timeline?.map((step, idx) => {
                    const isFailedNode = step.step === 'Failed' || details.transactionInfo.status === 'Failed' && step.step === 'Authorized' && !details.timeline[idx+1];
                    return (
                      <div key={idx} className="relative text-xs">
                        {/* Bullet */}
                        <div className={`absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-white dark:bg-zinc-900 transition-all flex items-center justify-center ${
                          step.done
                            ? isFailedNode 
                              ? 'border-rose-500 text-rose-500 bg-rose-50 dark:bg-rose-955'
                              : 'border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-955'
                            : 'border-zinc-300 dark:border-zinc-700'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            step.done 
                              ? isFailedNode ? 'bg-rose-500' : 'bg-emerald-500' 
                              : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}></div>
                        </div>

                        <p className={`font-bold uppercase text-[9.5px] tracking-wider ${
                          step.done 
                            ? isFailedNode ? 'text-rose-550' : 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-zinc-400'
                        }`}>
                          {step.step}
                        </p>
                        
                        {step.date ? (
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5 leading-normal">
                            {step.date} <span className="text-zinc-400 dark:text-zinc-650">• {step.user}</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-zinc-350 dark:text-zinc-650 font-semibold italic mt-0.5">Pending Action</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payload JSON Viewers (Sections 3, 4, 5) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <FileText className="text-[var(--primary)] shrink-0" size={16} />
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Gateway JSON Payload Explorer
                  </h4>
                </div>

                {/* Section 3: Gateway Response */}
                {renderJSONViewer(details.gatewayResponse, 'gatewayResponse', 'Section 3: Gateway Response Payload')}

                {/* Section 4: Request Payload */}
                {renderJSONViewer(details.requestPayload, 'requestPayload', 'Section 4: Request Parameter Payload')}

                {/* Section 5: Response Payload */}
                {renderJSONViewer(details.responsePayload, 'responsePayload', 'Section 5: Final Response Payload (Collapsible)')}
              </div>

            </div>

            {/* Grid 3: Webhooks & Retry Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Section 7: Webhook Logs */}
              <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/20 dark:bg-zinc-950/5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Section 7: Gateway Webhook Logs
                  </h4>
                  <div className="relative w-full sm:w-44">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search webhooks..."
                      value={webhookSearch}
                      onChange={(e) => { setWebhookSearch(e.target.value); setWebhookPage(1); }}
                      className="w-full pl-8 pr-2 h-7 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 rounded-lg text-[10px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                    />
                  </div>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
                    <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
                      <tr>
                        <th className="px-3 py-2">Event Code</th>
                        <th className="px-3 py-2">Timestamp</th>
                        <th className="px-3 py-2 text-right">Payload Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
                      {paginatedWebhooks.length > 0 ? (
                        paginatedWebhooks.map((w) => (
                          <React.Fragment key={w.id}>
                            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                              <td className="px-3 py-2 text-[10px] font-mono text-[var(--primary)]">{w.event}</td>
                              <td className="px-3 py-2 text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-mono">{w.timestamp}</td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => setExpandedWebhookId(expandedWebhookId === w.id ? null : w.id)}
                                  className="text-[10px] font-bold text-blue-550 hover:underline cursor-pointer"
                                >
                                  {expandedWebhookId === w.id ? 'Hide payload' : 'Expand'}
                                </button>
                              </td>
                            </tr>
                            {expandedWebhookId === w.id && (
                              <tr>
                                <td colSpan="3" className="px-3 py-2 bg-zinc-950/10 dark:bg-zinc-950/40">
                                  <pre className="text-[9px] font-mono text-zinc-650 dark:text-zinc-400 whitespace-pre-wrap select-all max-h-[100px] overflow-y-auto">
                                    {w.response}
                                  </pre>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-3 py-6 text-center text-zinc-400 italic">
                            No matching webhook events recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalWebhookPages > 1 && (
                  <div className="flex justify-end gap-1.5 items-center pt-1">
                    <button
                      onClick={() => setWebhookPage(p => Math.max(1, p - 1))}
                      disabled={webhookPage === 1}
                      className="p-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 text-black dark:text-white cursor-pointer shrink-0"
                    >
                      <X size={10} />
                    </button>
                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                      {webhookPage} of {totalWebhookPages}
                    </span>
                    <button
                      onClick={() => setWebhookPage(p => Math.min(totalWebhookPages, p + 1))}
                      disabled={webhookPage === totalWebhookPages}
                      className="p-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 text-black dark:text-white cursor-pointer shrink-0"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Section 8: Retry History */}
              <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/20 dark:bg-zinc-950/5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Section 8: Reconciliation Retry History
                  </h4>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
                    <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
                      <tr>
                        <th className="px-3 py-2">Count</th>
                        <th className="px-3 py-2">Reason Code</th>
                        <th className="px-3 py-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
                      {details.retryHistory && details.retryHistory.length > 0 ? (
                        details.retryHistory.map((r) => (
                          <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                            <td className="px-3 py-2 text-[10px] font-mono text-[var(--primary)]"># {r.retryCount}</td>
                            <td className="px-3 py-2 text-[10px] text-zinc-850 dark:text-zinc-250 font-bold">{r.retryReason}</td>
                            <td className="px-3 py-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">{r.createdAt}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-3 py-6 text-center text-zinc-400 italic">
                            No reconciliation retries logged for this ledger item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.8 bg-zinc-900 hover:brightness-110 text-white dark:bg-white dark:text-black text-xs font-bold rounded-lg shadow active:scale-95 transition-all cursor-pointer"
          >
            Close Audit explorer
          </button>
        </div>

      </div>
    </div>
  );
}
