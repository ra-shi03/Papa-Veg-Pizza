import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle, HelpCircle, FileSpreadsheet, FileText, CheckCircle2, History } from 'lucide-react';
import { useRetryTransaction, useExportTransactions } from '../hooks/useTransactionQuery';

// -------------------------------------------------------------
// RETRY PAYMENT RECONCILIATION MODAL
// -------------------------------------------------------------
export function RetryModal({ isOpen, onClose, id, amount, customerName, onSuccess }) {
  const { retryTransaction, loading } = useRetryTransaction();
  const [reason, setReason] = useState('Network Error');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState('');

  if (!isOpen) return null;

  const handleRetrySubmit = async () => {
    if (!remarks.trim()) {
      setErrors('Audit remarks are mandatory for reconciliation logging');
      return;
    }
    setErrors('');
    const success = await retryTransaction(id, reason, remarks);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-805">
          <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
            <RefreshCw className="text-amber-500 animate-spin-slow" size={18} />
            Reconcile Retry Transaction
          </h4>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="my-4 p-3 bg-amber-50 dark:bg-amber-955/20 rounded-xl border border-amber-100 dark:border-amber-900/35 flex items-start gap-2">
          <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
          <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold leading-normal">
            This action will trigger payment reconciliation with the gateway logs and update balances.
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-zinc-500">Transaction ID:</span>
              <span className="font-extrabold text-zinc-900 dark:text-white font-mono">{id}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-zinc-200/50 dark:border-zinc-850">
              <span className="font-semibold text-zinc-500">Customer Name:</span>
              <span className="font-bold text-zinc-900 dark:text-white">{customerName}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-zinc-200/50 dark:border-zinc-850">
              <span className="font-semibold text-zinc-500">Amount:</span>
              <span className="font-black text-[var(--primary)] font-mono">₹{amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Retry Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
            >
              <option value="Network Error">Network Error</option>
              <option value="Gateway Timeout">Gateway Timeout</option>
              <option value="Webhook Failure">Webhook Failure</option>
              <option value="Manual Retry">Manual Retry</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Internal Remarks / Logs</label>
            <textarea
              rows={3}
              placeholder="State remarks regarding retry check..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none text-black dark:text-white"
            ></textarea>
            {errors && <span className="text-[10px] text-rose-550 font-bold">{errors}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-3 border-t border-zinc-150 dark:border-zinc-800 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.8 border border-zinc-250 dark:border-zinc-805 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleRetrySubmit}
            disabled={loading}
            className="px-4 py-1.8 bg-[var(--primary)] hover:brightness-110 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            Retry Reconcile
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// AUDIT LOGS OVERVIEW MODAL
// -------------------------------------------------------------
const MOCK_AUDIT_LOGS = [
  { date: '2026-06-18 10:22', action: 'Payment Captured', user: 'System Webhook', remarks: 'Razorpay webhook payment.captured processed' },
  { date: '2026-06-18 09:15', action: 'Refund Processed', user: 'Admin Rashi', remarks: 'Approved customer compensation refund for cancellation' },
  { date: '2026-06-18 08:45', action: 'Manual Retry Triggered', user: 'SuperAdmin Ajay', remarks: 'Triggered reconciliation retry for failed Stripe txn' },
  { date: '2026-06-17 18:30', action: 'Wallet Credit Captured', user: 'CashFree API', remarks: 'Wallet top-up processed successfully' },
  { date: '2026-06-17 14:10', action: 'Settlement Cleared', user: 'Finance Batch', remarks: 'Weekly franchise clearance released' },
  { date: '2026-06-16 19:20', action: 'Coupon Adjustment', user: 'Admin Rashi', remarks: 'Settled store coupon reimbursement' }
];

export function AuditLogsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-[750px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-805">
          <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
            <History className="text-[var(--primary)]" size={18} />
            Ledger Audit Log History
          </h4>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="py-4 overflow-x-auto">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
              <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Action Code</th>
                  <th className="px-4 py-2.5">Authorized User</th>
                  <th className="px-4 py-2.5">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
                {MOCK_AUDIT_LOGS.map((log, index) => (
                  <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <td className="px-4 py-2.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">{log.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] font-extrabold">{log.user}</td>
                    <td className="px-4 py-2.5 text-[10px] text-zinc-550 dark:text-zinc-400 leading-relaxed">{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-150 dark:border-zinc-800">
          <button 
            onClick={onClose}
            className="px-5 py-1.8 bg-zinc-900 hover:brightness-110 text-white dark:bg-white dark:text-black text-xs font-bold rounded-lg shadow active:scale-95 transition-all cursor-pointer"
          >
            Close Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MASTER LEDGER EXPORT MODAL
// -------------------------------------------------------------
export function ExportModal({ isOpen, onClose, filters }) {
  const { exportTransactions, exportLoading } = useExportTransactions();
  const [format, setFormat] = useState('excel');
  const [dateRange, setDateRange] = useState('Month');
  const [status, setStatus] = useState('All');
  const [gateway, setGateway] = useState('All');

  if (!isOpen) return null;

  const handleExportSubmit = async () => {
    const exportFilters = {
      ...filters,
      status: status === 'All' ? filters?.status || 'All' : status,
      gateway: gateway === 'All' ? filters?.gateway || 'All' : gateway
    };
    const success = await exportTransactions(format, exportFilters);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-[440px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-805">
          <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={18} />
            Configure Ledger Export
          </h4>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Format selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Target Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFormat('excel')}
                className={`py-2 px-3 border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${format === 'excel' ? 'border-emerald-500 bg-emerald-50/10 text-emerald-600 dark:text-emerald-450' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'}`}
              >
                <FileSpreadsheet size={18} />
                <span className="text-[10px] font-bold">CSV / Excel</span>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`py-2 px-3 border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${format === 'pdf' ? 'border-rose-500 bg-rose-50/10 text-rose-600 dark:text-rose-450' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'}`}
              >
                <FileText size={18} />
                <span className="text-[10px] font-bold">PDF Statement</span>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`py-2 px-3 border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${format === 'csv' ? 'border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-450' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'}`}
              >
                <FileText size={18} />
                <span className="text-[10px] font-bold">Plain CSV</span>
              </button>
            </div>
          </div>

          {/* Date presets selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Date Timeline Preset</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
            >
              <option value="Today">Today</option>
              <option value="Week">Past 7 Days</option>
              <option value="Month">Past Month</option>
              <option value="Year">Past Year</option>
              <option value="All">Complete History</option>
            </select>
          </div>

          {/* Status override */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Filter Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed Only</option>
              <option value="Failed">Failed Only</option>
              <option value="Refunded">Refunded Only</option>
              <option value="Pending">Pending Only</option>
            </select>
          </div>

          {/* Gateway override */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Filter Gateway</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
            >
              <option value="All">All Gateways</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Stripe">Stripe</option>
              <option value="Paytm">Paytm</option>
              <option value="CashFree">CashFree</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-3 border-t border-zinc-150 dark:border-zinc-800 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.8 border border-zinc-250 dark:border-zinc-805 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleExportSubmit}
            disabled={exportLoading}
            className="px-4 py-1.8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {exportLoading ? 'Processing...' : 'Export Statement'}
          </button>
        </div>
      </div>
    </div>
  );
}
