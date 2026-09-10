import React, { useState, useEffect } from 'react';
import { X, Landmark, FileText, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, AlertTriangle, User, Calendar, CreditCard, ArrowRight, Download } from 'lucide-react';
import { usePayoutDetails } from '../hooks/usePayoutQuery';

export default function ViewPayoutModal({ isOpen, onClose, id }) {
  const { data: payout, loading, error, refetch } = usePayoutDetails(id);
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 4;

  // Reset page when ID changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLogPage(1);
      if (refetch) refetch();
    }
  }, [isOpen, id]);

  if (!isOpen) return null;

  // Loading state skeleton
  const renderSkeleton = () => (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
      
      {/* Stepper Skeleton */}
      <div className="flex justify-between items-center py-4 px-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 w-16 rounded"></div>
          </div>
        ))}
      </div>

      {/* Two Column details skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 w-1/3 rounded"></div>
          <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 w-1/3 rounded"></div>
          <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
        </div>
      </div>

      {/* Logs Table Skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 w-1/4 rounded"></div>
        <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
      </div>
    </div>
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Processing':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'Pending Approval':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Failed':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case 'Rejected':
        return 'bg-zinc-550/10 text-zinc-600 dark:text-zinc-400 border border-zinc-550/20';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={14} className="text-emerald-500" />;
      case 'Processing':
        return <Clock size={14} className="text-blue-500 animate-spin" />;
      case 'Pending Approval':
        return <Clock size={14} className="text-amber-500" />;
      case 'Failed':
        return <AlertTriangle size={14} className="text-rose-500" />;
      case 'Rejected':
        return <XCircle size={14} className="text-zinc-500" />;
      default:
        return <Clock size={14} className="text-zinc-550" />;
    }
  };

  // Pagination helper
  const allLogs = payout?.logs || [];
  const totalLogPages = Math.ceil(allLogs.length / logsPerPage) || 1;
  const paginatedLogs = allLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-[1200px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
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
                  Payout Voucher: <span className="font-mono text-zinc-500 dark:text-zinc-400">{id}</span>
                </h3>
                {payout && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${getStatusBadgeClass(payout.status)}`}>
                    {getStatusIcon(payout.status)}
                    {payout.status}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                Audit trace ledger, bank routing records, and life-cycle workflow logs
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Section */}
        {loading || !payout ? renderSkeleton() : (
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar space-y-6">
            
            {/* Top Overview Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Amount Disbursed</span>
                <p className="text-lg font-black text-[var(--primary)] font-mono">₹{payout.amount?.toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Payout Method</span>
                <p className="text-xs font-extrabold text-zinc-800 dark:text-white mt-0.5">{payout.payoutMethod || 'Bank NEFT'}</p>
              </div>
              <div className="space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Reference No</span>
                <p className="text-xs font-extrabold text-zinc-800 dark:text-white font-mono mt-0.5 truncate" title={payout.referenceNo}>{payout.referenceNo || 'REF-N/A'}</p>
              </div>
              <div className="space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Created Date</span>
                <p className="text-xs font-extrabold text-zinc-800 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <Calendar size={12} className="text-zinc-450" />
                  {payout.createdAt}
                </p>
              </div>
            </div>

            {/* Lifecycle Timeline Stepper */}
            <div className="p-4 bg-white dark:bg-zinc-950/10 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
              <h4 className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4">
                Payout Workflow Milestones
              </h4>
              
              <div className="relative flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-2">
                {/* Connector Line (Desktop) */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10 hidden md:block"></div>
                
                {payout.timeline?.map((step, idx) => {
                  let isCurrentStep = false;
                  let isFailedStep = false;
                  
                  // Check current status mapping to flag anomalies in stepper
                  if (payout.status === 'Pending Approval' && step.step === 'Pending Approval') isCurrentStep = true;
                  if (payout.status === 'Processing' && step.step === 'Processing') isCurrentStep = true;
                  if (payout.status === 'Completed' && step.step === 'Completed') isCurrentStep = true;
                  if (payout.status === 'Failed' && step.step === 'Processing') {
                    isFailedStep = true;
                  }
                  if (payout.status === 'Rejected' && step.step === 'Approved') {
                    isFailedStep = true;
                  }

                  return (
                    <div key={idx} className="flex md:flex-col items-center gap-3 md:gap-2 w-full md:text-center z-10">
                      {/* Step Circle */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all duration-300 ${
                        step.done 
                          ? isFailedStep 
                            ? 'bg-rose-50 border-rose-500 text-rose-500 dark:bg-rose-950/20' 
                            : 'bg-emerald-50 border-emerald-500 text-emerald-500 dark:bg-emerald-950/20'
                          : isCurrentStep 
                            ? 'bg-blue-50 border-blue-500 text-blue-500 dark:bg-blue-950/20 animate-pulse'
                            : 'bg-zinc-100 border-zinc-300 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                      }`}>
                        {step.done ? (
                          isFailedStep ? <X size={14} /> : <CheckCircle size={14} />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Step Labels */}
                      <div className="flex flex-col md:items-center">
                        <span className={`text-[11px] font-extrabold ${
                          isFailedStep 
                            ? 'text-rose-550' 
                            : step.done 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : isCurrentStep 
                                ? 'text-blue-550' 
                                : 'text-zinc-500'
                        }`}>
                          {isFailedStep 
                            ? payout.status === 'Rejected' ? 'Rejected' : 'Failed' 
                            : step.step}
                        </span>
                        
                        {step.date ? (
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                            {step.date} • {step.user || 'System'}
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-350 dark:text-zinc-650 font-semibold mt-0.5">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Beneficiary Bank Details Card */}
              <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                  <CreditCard className="text-[var(--primary)] shrink-0" size={16} />
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Beneficiary Bank Account
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Node Name</span>
                    <p className="font-extrabold text-zinc-900 dark:text-white truncate">{payout.beneficiary?.name || 'Central Outlet'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Beneficiary Type</span>
                    <span className="inline-block mt-0.5 text-[9px] font-extrabold text-[var(--primary)] bg-[var(--primary)]/5 px-2 py-0.5 rounded border border-[var(--primary)]/10 font-mono capitalize">
                      {payout.beneficiary?.type}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Account Holder Name</span>
                    <p className="font-bold text-zinc-850 dark:text-zinc-200 truncate">{payout.beneficiary?.owner || payout.beneficiary?.name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Contact Number</span>
                    <p className="font-semibold text-zinc-850 dark:text-zinc-200">{payout.beneficiary?.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Account Number</span>
                    <p className="font-mono font-bold text-zinc-900 dark:text-white">{payout.beneficiary?.bankAccount || 'XXXX XXXX XXXX'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">IFSC Routing Code</span>
                    <p className="font-mono font-bold text-zinc-900 dark:text-white">{payout.beneficiary?.ifscCode || 'IFSC-CODE'}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Clearance & Attachments */}
              <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                    <FileText className="text-[var(--primary)] shrink-0" size={16} />
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Clearance Info & Invoices
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Clearance ID (UTR)</span>
                      <p className="font-mono font-bold text-zinc-900 dark:text-white truncate" title={payout.utrNumber}>{payout.utrNumber || 'Awaiting Generation'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Transaction Status ID</span>
                      <p className="font-mono font-bold text-zinc-900 dark:text-white truncate" title={payout.transactionId}>{payout.transactionId || 'Pending Settlement'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Initiated By</span>
                      <p className="font-semibold text-zinc-850 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
                        <User size={11} className="text-zinc-450" />
                        {payout.initiatedBy || 'SuperAdmin'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Approving Officer</span>
                      <p className="font-semibold text-zinc-850 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
                        <User size={11} className="text-zinc-450" />
                        {payout.approvedBy || 'Pending Officer Approval'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-2">Attached Documents</span>
                  <div className="flex flex-wrap gap-2 max-h-[85px] overflow-y-auto custom-scrollbar">
                    {payout.attachments && payout.attachments.length > 0 ? (
                      payout.attachments.map((file, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-[var(--primary)] transition-colors text-[10px] font-semibold text-zinc-700 dark:text-zinc-350 cursor-pointer"
                        >
                          <FileText size={12} className="text-[var(--primary)] shrink-0" />
                          <span className="truncate max-w-[100px]">{file.name || `Invoice_${idx + 1}.pdf`}</span>
                          <button 
                            type="button"
                            title="Download attachment file" 
                            className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-[var(--primary)] shrink-0 cursor-pointer"
                          >
                            <Download size={11} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-semibold italic">
                        No verification invoices uploaded with this payout voucher request.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
            </div>

            {/* Internal Audit Remarks */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 rounded-2xl text-xs space-y-1.5">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Internal Clearance Remarks</span>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                "{payout.remarks || 'No internal remarks configured for this voucher split.'}"
              </p>
            </div>

            {/* Audit Logs Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2 shrink-0">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  Audit Activity logs
                </h4>
                <span className="text-[10px] font-bold text-zinc-450">
                  Showing {paginatedLogs.length} of {allLogs.length} transitions
                </span>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/30 font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="px-4 py-2.5">Date & Time</th>
                      <th className="px-4 py-2.5">Action Code</th>
                      <th className="px-4 py-2.5">Performed By</th>
                      <th className="px-4 py-2.5">Remarks / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                          <td className="px-4 py-2.5 text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-mono">{log.date}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[10px] font-bold">{log.performedBy}</td>
                          <td className="px-4 py-2.5 text-[10px] text-zinc-550 dark:text-zinc-400 leading-normal">{log.remarks || 'Cleared'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-zinc-400 italic">
                          No audit trace logs recorded for this payout request.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Logs Pagination Controller */}
              {totalLogPages > 1 && (
                <div className="flex justify-end gap-2 items-center pt-2">
                  <button
                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                    disabled={logPage === 1}
                    className="p-1 rounded border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 text-black dark:text-white cursor-pointer shrink-0"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                    Page {logPage} of {totalLogPages}
                  </span>
                  <button
                    onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                    disabled={logPage === totalLogPages}
                    className="p-1 rounded border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 text-black dark:text-white cursor-pointer shrink-0"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
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
            Close Voucher
          </button>
        </div>

      </div>
    </div>
  );
}
