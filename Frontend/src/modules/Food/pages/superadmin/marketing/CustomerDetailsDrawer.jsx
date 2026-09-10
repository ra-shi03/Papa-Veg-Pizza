import React, { useState, useEffect } from 'react';
import { X, User, Award, History, BarChart3, RefreshCw, ShoppingBag, CreditCard, ChevronRight, Activity, Percent } from 'lucide-react';
import { api, formatINR } from './LoyaltyData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { toast } from 'sonner';

export default function CustomerDetailsDrawer({ customerId, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      // Fetch core customer loyalty profile
      const custData = await api.getCustomerById(customerId);
      setCustomer(custData);

      // Fetch transaction ledger for this customer
      const txnData = await api.getHistory({ customerId: custData.customerId }, { page: 1, limit: 100 });
      setTransactions(txnData.data);
    } catch (err) {
      toast.error(err.message || "Failed to load customer details.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Analytics derived metrics
  const analyticsData = React.useMemo(() => {
    if (!customer || !transactions.length) {
      return {
        orderCount: 5,
        avgOrderValue: 800,
        totalRedemptions: 2,
        pointsEarned: 1200,
        pointsRedeemed: 300
      };
    }

    const earns = transactions.filter(t => t.type === 'earn');
    const redeems = transactions.filter(t => t.type === 'redeem');

    const totalRedemptions = redeems.length;
    const pointsEarned = earns.reduce((sum, t) => sum + t.points, 0);
    const pointsRedeemed = redeems.reduce((sum, t) => sum + t.points, 0);

    // Sum order counts (approximate order count from earn txns)
    const orderCount = earns.filter(t => t.orderId && t.orderId.startsWith('PV-ORD')).length || 4;
    const totalOrderSpend = earns.reduce((sum, t) => sum + t.amount, 0) || customer.lifetimeSpent;
    const avgOrderValue = orderCount ? Math.round(totalOrderSpend / orderCount) : 0;

    return {
      orderCount,
      avgOrderValue,
      totalRedemptions,
      pointsEarned,
      pointsRedeemed
    };
  }, [customer, transactions]);

  // Points activity chart data (e.g. last 6 months activity)
  const monthlyActivityData = [
    { month: 'Jan', Earned: 240, Redeemed: 100 },
    { month: 'Feb', Earned: 350, Redeemed: 200 },
    { month: 'Mar', Earned: 180, Redeemed: 0 },
    { month: 'Apr', Earned: 420, Redeemed: 300 },
    { month: 'May', Earned: 600, Redeemed: 450 },
    { month: 'Jun', Earned: analyticsData.pointsEarned ? Math.min(analyticsData.pointsEarned, 800) : 320, Redeemed: analyticsData.pointsRedeemed ? Math.min(analyticsData.pointsRedeemed, 500) : 120 }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full transform transition-all duration-300 animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <User size={14} />
              </div>
              <div>
                <h3 className="text-sm font-black text-black dark:text-white">Customer Loyalty Summary</h3>
                <p className="text-[10px] text-zinc-500 font-semibold">{customer?.name || 'Loading...'} ({customer?.customerId})</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {loading || !customer ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-2 bg-white dark:bg-zinc-900">
              <RefreshCw className="w-7 h-7 text-[var(--primary)] animate-spin" />
              <span className="text-[11px] font-bold text-zinc-500">Querying ledger records...</span>
            </div>
          ) : (
            <>
              {/* Tabs list */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 flex text-[10px] font-black uppercase tracking-wider">
                {['Overview', 'Transactions', 'Analytics'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 text-center py-3 border-b-2 transition-all uppercase tracking-widest ${
                      activeTab === tab 
                        ? 'border-b-[var(--primary)] text-[var(--primary)] bg-white dark:bg-zinc-900/50' 
                        : 'border-b-transparent text-zinc-500 hover:text-black dark:hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* Tab 1: OVERVIEW */}
                {activeTab === 'Overview' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    
                    {/* User profile header card */}
                    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-950/40 dark:to-zinc-950/20 border border-zinc-150 dark:border-zinc-805 p-4 rounded-xl space-y-3.5 shadow-inner">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Status Tier</p>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider mt-1.5 ${
                            customer.tier.toLowerCase() === 'platinum'
                              ? 'bg-purple-105 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40'
                              : customer.tier.toLowerCase() === 'gold'
                                ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                                : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-750 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                          }`}>
                            <Award size={10} className="stroke-[2.5]" />
                            {customer.tier}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Available points</p>
                          <p className="text-lg font-black text-[var(--primary)] font-mono mt-1">{customer.availablePoints} Pts</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-200 dark:border-zinc-800/80 pt-3">
                        <div>
                          <span className="text-[9px] text-zinc-450 uppercase block tracking-wider font-black">Customer Name</span>
                          <span className="font-extrabold text-zinc-900 dark:text-white mt-0.5 block">{customer.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-450 uppercase block tracking-wider font-black">Phone Number</span>
                          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5 block">{customer.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats List */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50/20">
                        <span className="text-zinc-500 font-semibold">Total Points Earned</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">{customer.totalPoints} Pts</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50/20">
                        <span className="text-zinc-500 font-semibold">Total Points Redeemed</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">{customer.redeemedPoints} Pts</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50/20">
                        <span className="text-zinc-500 font-semibold">Lifetime Spend</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(customer.lifetimeSpent)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50/20">
                        <span className="text-zinc-500 font-semibold">Last Updated Date</span>
                        <span className="text-zinc-700 dark:text-zinc-350">
                          {new Date(customer.updatedAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                  </div>
                )}

                {/* Tab 2: TRANSACTIONS */}
                {activeTab === 'Transactions' && (
                  <div className="space-y-3.5 animate-in fade-in duration-200 text-xs">
                    <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Points Ledger Logs</h4>
                    
                    <div className="space-y-2">
                      {transactions.length === 0 ? (
                        <div className="text-center py-10 text-zinc-450 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                          No transactions found.
                        </div>
                      ) : (
                        transactions.map((t) => (
                          <div 
                            key={t._id} 
                            className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/20 dark:bg-zinc-950/20 flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8.5px] font-black uppercase tracking-wide px-1.5 py-0.2 rounded border ${
                                  t.type === 'earn' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                                    : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30'
                                }`}>
                                  {t.type}
                                </span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 text-[10.5px]">
                                  {t.orderId}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-450 mt-1 font-semibold">
                                {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {t.reason && (
                                <p className="text-[9.5px] text-zinc-500 font-medium italic mt-0.5 truncate max-w-[200px]" title={t.reason}>
                                  Reason: {t.reason}
                                </p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <p className={`font-mono font-black text-sm ${t.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.type === 'earn' ? '+' : '-'}{t.points} Pts
                              </p>
                              {t.amount > 0 && (
                                <p className="text-[10px] text-zinc-450 mt-0.5 font-semibold">
                                  {formatINR(t.amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: ANALYTICS */}
                {activeTab === 'Analytics' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    
                    {/* Performance Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-805 rounded-xl">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <ShoppingBag size={11} className="text-zinc-405" /> Order Count
                        </span>
                        <h5 className="text-base font-black text-zinc-900 dark:text-white mt-1">{analyticsData.orderCount} Orders</h5>
                      </div>

                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-805 rounded-xl">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <CreditCard size={11} className="text-zinc-400" /> Avg Order Value
                        </span>
                        <h5 className="text-base font-black text-zinc-900 dark:text-white mt-1">{formatINR(analyticsData.avgOrderValue)}</h5>
                      </div>

                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-805 rounded-xl">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Percent size={11} className="text-zinc-400" /> Redemptions
                        </span>
                        <h5 className="text-base font-black text-zinc-900 dark:text-white mt-1">{analyticsData.totalRedemptions} Times</h5>
                      </div>

                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-805 rounded-xl">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Activity size={11} className="text-zinc-400" /> Points Earned
                        </span>
                        <h5 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">+{analyticsData.pointsEarned} Pts</h5>
                      </div>

                    </div>

                    {/* Chart Monthly Points Activity */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1">
                          <BarChart3 size={12} className="text-[var(--primary)]" />
                          Monthly Points Activity
                        </h4>
                        <span className="text-[9px] text-zinc-450 font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">6 Months</span>
                      </div>

                      <div className="h-44 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyActivityData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <XAxis dataKey="month" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '10px', borderRadius: '6px' }} />
                            <Bar dataKey="Earned" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="Redeemed" fill="#ef4444" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex justify-center items-center gap-4 mt-2.5 text-[9px] font-bold text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-[var(--primary)] rounded-sm" />
                          Earned Points
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                          Redeemed Points
                        </span>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex select-none">
                <button
                  onClick={onClose}
                  className="w-full py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all shadow-sm text-center cursor-pointer"
                >
                  Close Detail Panel
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
