import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import useDeliveryBackNavigation from '../../hooks/useDeliveryBackNavigation';

/**
 * PayoutV2 - 1:1 Match with Old Payout UI.
 * Background: #f6e9dc (for consistency with Pocket) or gray-50 (original)
 * Font: Poppins
 */
export const PayoutV2 = () => {
  const goBack = useDeliveryBackNavigation();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [reportingId, setReportingId] = useState(null);
  const [reportNote, setReportNote] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const submitReport = async (id) => {
    if (reportNote.trim().length < 10) {
      toast.error('Please write at least 10 characters (for example which account you checked).');
      return;
    }
    setReportBusy(true);
    try {
      await deliveryAPI.reportPayoutNotReceived(id, reportNote.trim());
      toast.success('Reported. Your franchise will check it.');
      setReportingId(null);
      setReportNote('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Could not report it. Please try again.');
    } finally {
      setReportBusy(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch withdrawal transactions
        const response = await deliveryAPI.getWalletTransactions({ 
          type: 'withdrawal', 
          limit: 100 
        });
        
        if (response?.data?.success) {
          const transactions = response.data.data.transactions || [];
          setWithdrawals(transactions.map(t => ({
            id: t._id || t.id,
            amount: t.amount || 0,
            status: t.status || 'Pending',
            date: new Date(t.date || t.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            processedAt: t.processedAt ? new Date(t.processedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : null,
            failureReason: t.failureReason || null,
            description: t.description || '',
            reference: t.reference || '',
            dispute: t.dispute || null,
            canReportNotReceived: Boolean(t.canReportNotReceived)
          })));
        }
      } catch (err) {
        toast.error('Failed to load payout history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reloadKey]);

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'denied':
      case 'rejected':
      case 'reversed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#f6e9dc] font-poppins pb-24">
      {/* Header (Old Style) */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 safe-top flex items-center gap-4">
        <button
          onClick={goBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Withdrawal History</h1>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-600 text-base">Loading withdrawal history...</p>
          </div>
        ) : withdrawals.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.map((withdrawal, index) => {
              const statusInfo = getStatusInfo(withdrawal.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div
                  key={withdrawal.id || index}
                  className={`bg-white rounded-xl p-4 shadow-sm border ${statusInfo.borderColor} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                      <p className="text-gray-900 text-xl font-bold mb-1">
                        ₹{withdrawal.amount}
                      </p>
                      <p className="text-gray-500 text-[11px] font-medium">
                        Requested: {withdrawal.date}
                      </p>
                      {withdrawal.processedAt && (
                        <p className="text-gray-500 text-[11px] font-medium mt-1">
                          Processed: {withdrawal.processedAt}
                        </p>
                      )}
                      {withdrawal.description && (
                        <p className="text-gray-500 text-[11px] font-medium mt-1">{withdrawal.description}</p>
                      )}
                      {withdrawal.reference && (
                        <p className="text-gray-700 text-[11px] font-bold mt-1">Ref: {withdrawal.reference}</p>
                      )}
                      {withdrawal.failureReason && (
                        <p className="text-red-600 text-[11px] mt-2 font-bold">
                          Reason: {withdrawal.failureReason}
                        </p>
                      )}
                      {withdrawal.dispute?.status === 'open' && (
                        <p className="text-orange-600 text-[11px] mt-2 font-bold">Reported not received: your franchise is checking it.</p>
                      )}
                      {withdrawal.dispute?.status === 'resolved' && withdrawal.dispute.outcome === 'paid_confirmed' && (
                        <p className="text-gray-600 text-[11px] mt-2 font-bold">Checked: payment confirmed. {withdrawal.dispute.resolution}</p>
                      )}
                      {withdrawal.canReportNotReceived && reportingId !== withdrawal.id && (
                        <button
                          onClick={() => { setReportingId(withdrawal.id); setReportNote(''); }}
                          className="mt-2 text-[11px] font-bold text-orange-600 underline"
                        >
                          Not received?
                        </button>
                      )}
                      {reportingId === withdrawal.id && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={reportNote}
                            onChange={(e) => setReportNote(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Which account did you check? (for example: no credit in my account ending 1234)"
                            className="w-full rounded-lg border border-gray-200 p-2 text-xs outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={reportBusy}
                              onClick={() => submitReport(withdrawal.id)}
                              className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold disabled:opacity-50"
                            >
                              {reportBusy ? 'Sending...' : 'Report'}
                            </button>
                            <button onClick={() => setReportingId(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
              <Clock className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-gray-900 text-lg font-bold mb-2">No withdrawal history</p>
            <p className="text-gray-400 text-sm font-medium">
              You haven't made any withdrawal requests yet. Your withdrawal history will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
