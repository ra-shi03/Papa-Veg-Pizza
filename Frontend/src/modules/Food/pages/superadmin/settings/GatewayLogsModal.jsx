import React, { useState, useMemo, useEffect } from 'react';
import { adminAPI } from '@food/api';
import { X, Search, Filter, Calendar, AlertCircle, CheckCircle, XCircle, RotateCcw, Copy, Check, Terminal, ExternalLink, RefreshCw, Eye, Download } from 'lucide-react';

export default function GatewayLogsModal({ isOpen, onClose, initialGateway = 'All', gatewayNames = [] }) {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGateway, setSelectedGateway] = useState(initialGateway);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEnv, setSelectedEnv] = useState('All');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState(null);

  // Real online payments recorded by the server (opens fresh every time)
  useEffect(() => {
    if (!isOpen) return;
    setSelectedGateway(initialGateway);
    setSelectedLog(null);
    setRetryResult(null);
    setLoadingLogs(true);
    setLoadError('');
    adminAPI.getPaymentGatewayLogs()
      .then((res) => setLogs(res?.data?.data || []))
      .catch((err) => setLoadError(err?.response?.data?.message || err?.message || 'Could not load the payment logs'))
      .finally(() => setLoadingLogs(false));
  }, [isOpen, initialGateway]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.transactionId.toLowerCase().includes(search.toLowerCase()) ||
        log.orderId.toLowerCase().includes(search.toLowerCase()) ||
        (log.errorDetails && log.errorDetails.toLowerCase().includes(search.toLowerCase()));

      const matchGateway = selectedGateway === 'All' || log.gatewayName === selectedGateway;
      const matchStatus = selectedStatus === 'All' || log.status === selectedStatus;
      const matchEnv = selectedEnv === 'All' || log.environment === selectedEnv;

      return matchSearch && matchGateway && matchStatus && matchEnv;
    });
  }, [logs, search, selectedGateway, selectedStatus, selectedEnv]);

  if (!isOpen) return null;

  // Asks the provider what it says about this payment (read only)
  const handleRetryWebhook = async (log) => {
    setRetrying(true);
    setRetryResult(null);
    try {
      const res = await adminAPI.resyncPaymentGatewayLog(log._id);
      const out = res?.data?.data;
      setRetryResult({ success: Boolean(out?.ok), message: out?.message || 'No answer from the provider' });
    } catch (err) {
      setRetryResult({ success: false, message: err?.response?.data?.message || err?.message || 'Could not reach the provider' });
    } finally {
      setRetrying(false);
    }
  };

  const exportCsv = () => {
    const header = ['Time', 'Transaction ID', 'Order ID', 'Gateway', 'Environment', 'Amount', 'Currency', 'Status', 'Failure reason'];
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredLogs.map((l) => [new Date(l.timestamp).toISOString(), l.transactionId, l.orderId, l.gatewayName, l.environment, l.amount.toFixed(2), l.currency, l.status, l.errorDetails || '']);
    const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyText = (text, type) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    if (type === 'req') {
      setCopiedReq(true);
      setTimeout(() => setCopiedReq(false), 2000);
    } else {
      setCopiedRes(true);
      setTimeout(() => setCopiedRes(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-6xl rounded-xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <Terminal className="text-[var(--primary)] shrink-0" size={18} />
              Payment Gateway Transaction Logs
            </h3>
            <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5 font-semibold">
              Browse API calls, webhook payloads, latency metrics and database synchronization logs
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-black hover:text-black dark:text-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Filter bar */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-wrap gap-2.5 items-center justify-between">
          <div className="flex flex-wrap gap-2.5 items-center flex-1">
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black dark:text-zinc-100" size={13} />
              <input 
                type="text"
                placeholder="Search transaction, order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8.5 pl-8 pr-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100"
              />
            </div>

            {/* Gateway filter */}
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value)}
              className="h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs text-black dark:text-zinc-100 font-bold outline-none"
            >
              <option value="All">All Gateways</option>
              {[...new Set(['Razorpay', ...gatewayNames])].map((name) => <option key={name} value={name}>{name}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs text-black dark:text-zinc-100 font-bold outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Env filter */}
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs text-black dark:text-zinc-100 font-bold outline-none"
            >
              <option value="All">All Environments</option>
              <option value="Sandbox">Sandbox</option>
              <option value="Production">Production</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setSearch(''); setSelectedGateway('All'); setSelectedStatus('All'); setSelectedEnv('All'); }}
              className="h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-zinc-100 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button 
              onClick={exportCsv}
              className="h-8.5 px-3 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Logs List Table */}
          <div className="flex-1 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <AlertCircle className="text-zinc-400 mb-2" size={24} />
                <p className="text-xs font-bold text-black dark:text-zinc-100">{loadingLogs ? 'Loading payments...' : loadError || (logs.length === 0 ? 'No online payments have been made yet.' : 'No logs match your filter criteria.')}</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100 dark:bg-zinc-800/40 sticky top-0 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Transaction ID / Order ID</th>
                    <th className="p-3">Gateway</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredLogs.map((log) => {
                    const isSelected = selectedLog?._id === log._id;
                    return (
                      <tr 
                        key={log._id}
                        onClick={() => { setSelectedLog(log); setRetryResult(null); }}
                        className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors ${
                          isSelected ? 'bg-zinc-100 dark:bg-zinc-800/30' : ''
                        }`}
                      >
                        <td className="p-3 whitespace-nowrap text-[10px] text-black dark:text-zinc-100 font-semibold">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-black dark:text-zinc-100">{log.transactionId}</div>
                          <div className="text-[9px] text-zinc-500 font-semibold">{log.orderId}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-black dark:text-zinc-100">{log.gatewayName}</span>
                          <span className={`ml-1.5 px-1 py-0.2 rounded text-[8px] font-black tracking-wider uppercase border ${
                            log.environment === 'Production' 
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
                              : 'bg-orange-500/10 text-orange-655 border-orange-500/25'
                          }`}>
                            {log.environment}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-black dark:text-zinc-100">
                          {log.currency === 'INR' ? '₹' : '$'}{log.amount.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border inline-flex items-center gap-1 ${
                            log.status === 'Success' 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : log.status === 'Failed' 
                              ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {log.status === 'Success' && <span className="w-1 h-1 rounded-full bg-emerald-500"></span>}
                            {log.status === 'Failed' && <span className="w-1 h-1 rounded-full bg-red-500"></span>}
                            {log.status === 'Pending' && <span className="w-1 h-1 rounded-full bg-amber-500"></span>}
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); setRetryResult(null); }}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-black dark:text-zinc-100 inline-flex items-center gap-1 text-[10px] font-semibold border border-zinc-200 dark:border-zinc-700"
                          >
                            <Eye size={11} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Details Sidebar / Log Viewer */}
          <div className="w-1/2 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-900/20 flex flex-col scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
            {selectedLog ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-black text-black dark:text-zinc-50 uppercase tracking-wider">Log Raw Payload Audit</h4>
                    <p className="text-[10px] text-black dark:text-zinc-100 font-semibold">{selectedLog.transactionId}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-black dark:text-zinc-100"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* API Endpoint & Status Info */}
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-2.5 text-black dark:text-zinc-100">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold">API Route:</span>
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-700/80 px-1.5 py-0.5 rounded text-black dark:text-zinc-100">{selectedLog.apiEndpoint}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold">Response Code:</span>
                    <span className={`font-semibold ${selectedLog.status === 'Success' ? 'text-emerald-600' : 'text-red-500'}`}>{selectedLog.statusCode}</span>
                  </div>
                  {selectedLog.errorDetails && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-md text-[10px] font-bold text-red-650 dark:text-red-400">
                      <span className="block font-black uppercase text-[8.5px] tracking-wider mb-0.5">Failure Reason</span>
                      {selectedLog.errorDetails}
                    </div>
                  )}

                  {/* Webhook Retry Trigger */}
                  {selectedLog.status === 'Failed' && (
                    <div className="pt-1.5 border-t border-zinc-150 dark:border-zinc-700 flex items-center justify-between">
                      <span className="text-[9.5px] text-black dark:text-zinc-100 font-bold">Failed status callback?</span>
                      <button
                        onClick={() => handleRetryWebhook(selectedLog)}
                        disabled={retrying}
                        className="px-2.5 py-1 bg-[var(--primary)] text-white text-[9.5px] font-black rounded hover:opacity-90 transition-all flex items-center gap-1 shrink-0"
                      >
                        {retrying ? <RefreshCw size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                        {retrying ? 'Retrying Webhook...' : 'Retry Webhook Sync'}
                      </button>
                    </div>
                  )}

                  {retryResult && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9.5px] text-emerald-800 dark:text-emerald-400 font-bold mt-2">
                      {retryResult.message}
                    </div>
                  )}
                </div>

                {/* Client-friendly metadata summary */}
                <div className="space-y-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 text-black dark:text-zinc-100 text-xs font-semibold">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-black dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-700 pb-1.5 mb-2">
                    Transaction Details
                  </h5>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10.5px]">
                    <div className="flex flex-col">
                      <span className="opacity-75 text-[9px] uppercase tracking-wider">Transaction ID</span>
                      <span className="font-bold">{selectedLog.transactionId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-75 text-[9px] uppercase tracking-wider">Order ID</span>
                      <span className="font-bold">{selectedLog.orderId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-75 text-[9px] uppercase tracking-wider">Amount</span>
                      <span className="font-bold">₹{selectedLog.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-75 text-[9px] uppercase tracking-wider">Status Code</span>
                      <span className="font-bold">{selectedLog.statusCode}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-75 text-[9px] uppercase tracking-wider">Payment Route</span>
                      <span className="font-bold">{selectedLog.gatewayName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-75 text-[9px] uppercase tracking-wider">Timestamp</span>
                      <span className="font-bold">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Payment Info if success */}
                {selectedLog.status === 'Success' && (
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 text-black dark:text-zinc-100 text-xs font-semibold space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-black dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-700 pb-1.5 mb-2">
                      Customer Payment Instrument
                    </h5>
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10.5px]">
                      <div className="flex flex-col">
                        <span className="opacity-75 text-[9px] uppercase tracking-wider">Channel Type</span>
                        <span className="font-bold">UPI / Card Route</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="opacity-75 text-[9px] uppercase tracking-wider">Signature Verification</span>
                        <span className="text-emerald-600 font-black">Passed</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Terminal className="text-zinc-400 mb-2 opacity-50" size={32} />
                <p className="text-xs font-bold text-black dark:text-zinc-100">Select any transaction row to inspect transaction properties.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-black dark:bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm"
          >
            Close Logs Viewer
          </button>
        </footer>
      </div>
    </div>
  );
}
