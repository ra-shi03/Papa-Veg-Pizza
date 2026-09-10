import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, Target, Gift, Volume2, Mail, MessageSquare, 
  Layers, Users, BarChart3, TrendingUp, DollarSign, Loader2, Info
} from 'lucide-react';
import { apiGetCampaignById, apiGetCoupons } from './CampaignData';
import { mockRegions, mockFranchises, mockStores } from './CouponsData';

export default function CampaignDetails({ campaignId, isOpen, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    if (isOpen && campaignId) {
      setLoading(true);
      
      // Fetch Coupons first for mapping
      apiGetCoupons()
        .then(cpns => setCoupons(cpns))
        .catch(() => {});

      // Fetch Campaign details
      apiGetCampaignById(campaignId)
        .then(data => {
          setCampaign(data);
          setLoading(false);
        })
        .catch(err => {
          alert('Error loading campaign details: ' + err.message);
          setLoading(false);
          onClose();
        });
    }
  }, [isOpen, campaignId]);

  // Derived Metrics
  const ctr = useMemo(() => {
    if (!campaign || !campaign.impressions) return 0;
    return parseFloat(((campaign.clicks / campaign.impressions) * 100).toFixed(2));
  }, [campaign]);

  const conversionRate = useMemo(() => {
    if (!campaign || !campaign.clicks) return 0;
    return parseFloat(((campaign.conversions / campaign.clicks) * 100).toFixed(2));
  }, [campaign]);

  // Lookups
  const mappedCoupon = useMemo(() => {
    if (!campaign || !campaign.couponId) return null;
    return coupons.find(c => c._id === campaign.couponId);
  }, [campaign, coupons]);

  const regionNames = useMemo(() => {
    if (!campaign || !campaign.regionIds) return [];
    return mockRegions
      .filter(r => campaign.regionIds.includes(r.id))
      .map(r => r.name);
  }, [campaign]);

  const franchiseNames = useMemo(() => {
    if (!campaign || !campaign.franchiseIds) return [];
    return mockFranchises
      .filter(f => campaign.franchiseIds.includes(f.id))
      .map(f => f.name);
  }, [campaign]);

  const storeNames = useMemo(() => {
    if (!campaign || !campaign.storeIds) return [];
    return mockStores
      .filter(s => campaign.storeIds.includes(s.id))
      .map(s => s.name);
  }, [campaign]);

  const TypeIcon = useMemo(() => {
    if (!campaign) return Layers;
    switch (campaign.type) {
      case 'Push Notification': return Volume2;
      case 'Email': return Mail;
      case 'SMS': return MessageSquare;
      default: return Layers;
    }
  }, [campaign]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full transform transition-all duration-300 animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                  <Target size={14} />
                </span>
                Campaign Details
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">ID: {campaignId}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {loading || !campaign ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              <Loader2 className="w-7 h-7 text-[var(--primary)] animate-spin" />
              <span className="text-xs font-bold text-zinc-500">Loading details...</span>
            </div>
          ) : (
            <>
              {/* Tabs list */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 flex">
                {['Overview', 'Audience', 'Performance'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 text-center py-2.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === tab 
                        ? 'border-[var(--primary)] text-[var(--primary)] bg-white dark:bg-zinc-950/20' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'Overview' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-805">
                      <span className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl shrink-0 mt-0.5">
                        <TypeIcon size={18} />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">{campaign.title}</h4>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-1.5 ${
                          campaign.status === 'Draft' ? 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400' :
                          campaign.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                          campaign.status === 'Running' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          campaign.status === 'Paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Description</span>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold mt-0.5">{campaign.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Campaign Type</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{campaign.type}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Target segment</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{campaign.targetAudience}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Start Date</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{campaign.startDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">End Date</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{campaign.endDate}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Budget Allocation</span>
                          <span className="font-black text-zinc-900 dark:text-zinc-100 mt-0.5 block">₹{(campaign.budget || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Mapped Coupon</span>
                          <span className="mt-0.5 block">
                            {mappedCoupon ? (
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-extrabold">{mappedCoupon.code}</span>
                            ) : (
                              <span className="text-zinc-400">None</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Created By</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5 block">{campaign.createdBy || 'System'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Created At</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5 block">
                            {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AUDIENCE TAB */}
                {activeTab === 'Audience' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-805 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estimated Audience Size</span>
                        <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                          {campaign.impressions ? Math.round(campaign.impressions * 0.82).toLocaleString() : '12,500'} users
                        </h4>
                      </div>
                      <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                        <Users size={16} />
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Customer Segment Target</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-1 block bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                          {campaign.customerSegment || 'All Customers'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Target Regions ({regionNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {regionNames.map((name, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-350">{name}</span>
                          ))}
                          {regionNames.length === 0 && <span className="text-zinc-500 font-semibold italic">All Regions (National)</span>}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Target Franchises ({franchiseNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto">
                          {franchiseNames.map((name, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-350">{name}</span>
                          ))}
                          {franchiseNames.length === 0 && <span className="text-zinc-500 font-semibold italic">All Franchise Units</span>}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Target Stores ({storeNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                          {storeNames.map((name, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-350">{name}</span>
                          ))}
                          {storeNames.length === 0 && <span className="text-zinc-500 font-semibold italic">All Stores</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PERFORMANCE TAB */}
                {activeTab === 'Performance' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      
                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[10px] text-zinc-450 font-bold uppercase block">Impressions</span>
                        <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1">{(campaign.impressions || 0).toLocaleString()}</h5>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[10px] text-zinc-450 font-bold uppercase block">Clicks</span>
                        <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1">{(campaign.clicks || 0).toLocaleString()}</h5>
                        <p className="text-[9px] text-zinc-450 font-bold mt-0.5">CTR: {ctr}%</p>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[10px] text-zinc-450 font-bold uppercase block">Conversions</span>
                        <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1">{(campaign.conversions || 0).toLocaleString()}</h5>
                        <p className="text-[9px] text-zinc-450 font-bold mt-0.5">Rate: {conversionRate}%</p>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[10px] text-zinc-450 font-bold uppercase block">Coupon Redemptions</span>
                        <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1">{(campaign.redemptionsCount || 0).toLocaleString()}</h5>
                      </div>

                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4.5">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold uppercase tracking-wider block">Revenue Generated</span>
                          <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            ₹{(campaign.revenueGenerated || 0).toLocaleString('en-IN')}
                          </h4>
                        </div>
                        <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <DollarSign size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer Actions */}
              <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3.5 shrink-0">
                <button
                  onClick={() => onEdit(campaign._id)}
                  className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 text-center"
                >
                  Edit Campaign Settings
                </button>
                <button
                  onClick={onClose}
                  className="py-2 px-5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
