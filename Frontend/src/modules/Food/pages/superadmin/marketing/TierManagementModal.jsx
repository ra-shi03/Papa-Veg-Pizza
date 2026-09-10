import React, { useState, useEffect } from 'react';
import { X, Award, Edit, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { api } from './LoyaltyData';
import EditTierModal from './EditTierModal';
import { toast } from 'sonner';

export default function TierManagementModal({ isOpen, onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTiers();
    }
  }, [isOpen]);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const data = await api.getTiers();
      setTiers(data);
    } catch (err) {
      toast.error("Failed to load loyalty tiers.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tier) => {
    setToggleLoadingId(tier._id);
    try {
      const updatedStatus = !tier.isActive;
      const res = await api.updateTier(tier._id, { isActive: updatedStatus });
      if (res.success) {
        toast.success(`Tier ${tier.name} status updated successfully!`);
        fetchTiers();
        onSaveSuccess();
      }
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleOpenEdit = (tier) => {
    setSelectedTier(tier);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    fetchTiers();
    onSaveSuccess();
  };

  const formatCurrency = (val) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-[1200px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-800 dark:text-zinc-100 max-h-[90vh]">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[var(--primary)]/10 rounded-lg text-[var(--primary)]">
                <Award size={18} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-black dark:text-white">Loyalty Tiers Management</h2>
                <p className="text-[10px] text-zinc-500 font-medium font-semibold">Define minimum lifetime spends, point multiplier multipliers, and tier privilege benefits.</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto p-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="text-[var(--primary)] animate-spin" />
                <p className="text-xs font-bold text-zinc-450">Loading tier structures...</p>
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner bg-white dark:bg-zinc-900">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Tier</th>
                      <th className="px-5 py-3">Minimum Spend</th>
                      <th className="px-5 py-3">Multiplier</th>
                      <th className="px-5 py-3">Benefits</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 font-medium">
                    {tiers.map((tier) => (
                      <tr 
                        key={tier._id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors"
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                            tier.name.toLowerCase() === 'platinum'
                              ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40'
                              : tier.name.toLowerCase() === 'gold'
                                ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                                : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                          }`}>
                            <Award size={10} className="stroke-[2.5]" />
                            {tier.name}
                          </span>
                        </td>
                        
                        <td className="px-5 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-100 font-mono font-bold">
                          {formatCurrency(tier.minSpent)}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-100 font-mono font-bold">
                          {tier.multiplier}x
                        </td>

                        <td className="px-5 py-4 max-w-[400px]">
                          <div className="flex flex-wrap gap-1.5">
                            {tier.benefits && tier.benefits.map((b, idx) => (
                              <span 
                                key={idx} 
                                className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold border border-zinc-200 dark:border-zinc-750"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tier.isActive 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                          }`}>
                            {tier.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {tier.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleToggleStatus(tier)}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-colors cursor-pointer ${
                                tier.isActive
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-650 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
                              }`}
                              disabled={toggleLoadingId === tier._id}
                            >
                              {toggleLoadingId === tier._id ? (
                                <RefreshCw size={10} className="animate-spin" />
                              ) : tier.isActive ? (
                                'Disable'
                              ) : (
                                'Enable'
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(tier)}
                              className="px-2.5 py-1 text-[10px] font-black bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:border-zinc-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit size={10} />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end">
            <button 
              onClick={onClose}
              className="h-9 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-55 transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Edit Tier Sub-Modal */}
      <EditTierModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tierData={selectedTier}
        onSaveSuccess={handleEditSuccess}
      />
    </>
  );
}
