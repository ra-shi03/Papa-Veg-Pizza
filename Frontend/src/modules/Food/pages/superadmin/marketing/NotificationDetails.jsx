import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, Target, Smartphone, Mail, MessageSquare, 
  Layers, Users, BarChart3, TrendingUp, Loader2, Info, Bell 
} from 'lucide-react';
import { apiGetNotificationById } from './NotificationData';
import { mockRegions, mockFranchises } from './CouponsData';

export default function NotificationDetails({ notificationId, isOpen, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && notificationId) {
      setLoading(true);
      apiGetNotificationById(notificationId)
        .then(data => {
          setNotification(data);
          setLoading(false);
        })
        .catch(err => {
          alert('Error loading details: ' + err.message);
          setLoading(false);
          onClose();
        });
    }
  }, [isOpen, notificationId]);

  // Derived Metrics
  const openRate = useMemo(() => {
    if (!notification || !notification.deliveredCount) return 0;
    return parseFloat(((notification.openedCount / notification.deliveredCount) * 100).toFixed(2));
  }, [notification]);

  const successRate = useMemo(() => {
    if (!notification || !notification.sentCount) return 0;
    return parseFloat(((notification.deliveredCount / notification.sentCount) * 100).toFixed(2));
  }, [notification]);

  const failedCount = useMemo(() => {
    if (!notification) return 0;
    return (notification.sentCount - notification.deliveredCount) || 0;
  }, [notification]);

  const regionNames = useMemo(() => {
    if (!notification || !notification.regionIds) return [];
    return mockRegions
      .filter(r => notification.regionIds.includes(r.id))
      .map(r => r.name);
  }, [notification]);

  const franchiseNames = useMemo(() => {
    if (!notification || !notification.franchiseIds) return [];
    return mockFranchises
      .filter(f => notification.franchiseIds.includes(f.id))
      .map(f => f.name);
  }, [notification]);

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
                  <Bell size={14} />
                </span>
                Notification Details
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">ID: {notificationId}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {loading || !notification ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              <Loader2 className="w-7 h-7 text-[var(--primary)] animate-spin" />
              <span className="text-xs font-bold text-zinc-500">Loading details...</span>
            </div>
          ) : (
            <>
              {/* Tabs list */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 flex select-none">
                {['Overview', 'Delivery Analytics', 'Audience'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 text-center py-2.5 text-[10.5px] font-bold border-b-2 transition-all ${
                      activeTab === tab 
                        ? 'border-b-[var(--primary)] text-[var(--primary)] bg-white dark:bg-zinc-950/20' 
                        : 'border-b-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300'
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
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    
                    {notification.image && (
                      <div className="w-full h-36 rounded-2xl overflow-hidden border border-zinc-205 dark:border-zinc-805">
                        <img src={notification.image} className="w-full h-full object-cover" alt="Banner Preview" />
                      </div>
                    )}

                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-805">
                      <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-snug">{notification.title}</h4>
                      <p className="text-zinc-700 dark:text-zinc-350 leading-relaxed font-semibold mt-2">{notification.message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Channels</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{notification.type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Status</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold mt-1.5 ${
                          notification.status === 'Draft' ? 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800' :
                          notification.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10' :
                          notification.status === 'Processing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10' :
                          notification.status === 'Sent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' :
                          'bg-red-100 text-red-700 dark:bg-red-500/10'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Audience Mode</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{notification.audienceType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Schedule Date</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                          {new Date(notification.scheduleAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Created By</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-350 mt-0.5 block">{notification.createdBy || 'System'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Created At</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-350 mt-0.5 block">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DELIVERY TAB */}
                {activeTab === 'Delivery Analytics' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[10px] text-zinc-450 font-bold block">Sent Count</span>
                        <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1">{(notification.sentCount || 0).toLocaleString()}</h5>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[10px] text-zinc-450 font-bold block">Delivered Count</span>
                        <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1">{(notification.deliveredCount || 0).toLocaleString()}</h5>
                        <p className="text-[9px] text-zinc-450 font-bold mt-0.5">Delivery Rate: {successRate}%</p>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[10px] text-zinc-450 font-bold block">Opened Count</span>
                        <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1">{(notification.openedCount || 0).toLocaleString()}</h5>
                        <p className="text-[9px] text-zinc-455 font-bold mt-0.5">Open Rate: {openRate}%</p>
                      </div>

                      <div className="bg-rose-50/50 dark:bg-red-950/10 p-3 rounded-xl border border-red-500/10">
                        <span className="text-[10px] text-red-500 font-bold block">Failed Count</span>
                        <h5 className="text-sm font-black text-red-650 dark:text-red-400 mt-1">{(failedCount).toLocaleString()}</h5>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold uppercase tracking-wider block">Overall Success Rate</span>
                        <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{successRate}%</h4>
                      </div>
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                        <TrendingUp size={18} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. AUDIENCE TAB */}
                {activeTab === 'Audience' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-805 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total Target Users</span>
                        <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                          {(notification.sentCount || 12500).toLocaleString()} recipients
                        </h4>
                      </div>
                      <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                        <Users size={16} />
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Regions Targeting ({regionNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {regionNames.map((name, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-350">{name}</span>
                          ))}
                          {regionNames.length === 0 && <span className="text-zinc-500 font-semibold italic">All Regions (National)</span>}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Franchises ({franchiseNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1 max-h-28 overflow-y-auto">
                          {franchiseNames.map((name, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-350">{name}</span>
                          ))}
                          {franchiseNames.length === 0 && <span className="text-zinc-500 font-semibold italic">All Franchise Units</span>}
                        </div>
                      </div>

                      {notification.customerIds && notification.customerIds.length > 0 && (
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Target Customer IDs ({notification.customerIds.length})</span>
                          <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl bg-zinc-50/50">
                            {notification.customerIds.map(id => (
                              <span key={id} className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded border text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{id}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3.5 shrink-0 select-none">
                {notification.status === 'Scheduled' && (
                  <button
                    onClick={() => onEdit(notification._id)}
                    className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 text-center"
                  >
                    Edit Notification
                  </button>
                )}
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
