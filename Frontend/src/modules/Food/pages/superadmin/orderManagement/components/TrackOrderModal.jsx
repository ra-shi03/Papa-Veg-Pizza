// TrackOrderModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Navigation, Phone, MapPin, Clock, RefreshCw, Star, Info } from 'lucide-react';
import { getOrderTracking } from '../AllOrdersData';

export default function TrackOrderModal({ isOpen, onClose, orderId }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchTracking();
    }
  }, [isOpen, orderId]);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const data = await getOrderTracking(orderId);
      setTracking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getOrderTracking(orderId);
      setTracking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (!isOpen) return null;

  const stepperStates = [
    'Placed', 'Confirmed', 'Preparing', 'Baking', 'Packed', 'Assigned', 'Out For Delivery', 'Delivered'
  ];

  const getActiveStepIndex = (status) => {
    return stepperStates.indexOf(status);
  };

  const currentStepIdx = tracking ? getActiveStepIndex(tracking.status) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl shadow-xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 select-none flex flex-col text-zinc-800 dark:text-zinc-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              <Navigation size={15} className="text-[var(--primary)] animate-pulse" />
              Live Order Dispatch Radar
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Tracking Order {tracking?.orderNumber || ''}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className={`w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={13} />
            </button>
            <button 
              className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-zinc-400 font-bold tracking-widest uppercase">Connecting to rider GPS...</p>
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto max-h-[80vh]">
            
            {/* Stepper Progress */}
            <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Delivery Progress Stepper</span>
                <span className="text-[10px] text-zinc-650 bg-[var(--primary)]/10 text-[var(--primary)] font-bold px-2 py-0.5 rounded-full">
                  Status: {tracking.status}
                </span>
              </div>

              {/* Stepper Dots & Labels */}
              <div className="relative pt-4 pb-2">
                {/* Connector line */}
                <div className="absolute top-6 left-2 right-2 h-[2px] bg-zinc-200 dark:bg-zinc-805 z-0" />
                <div 
                  className="absolute top-6 left-2 h-[2px] bg-[var(--primary)] z-0 transition-all duration-500" 
                  style={{ width: `${(currentStepIdx / (stepperStates.length - 1)) * 100}%` }}
                />

                <div className="relative z-10 flex justify-between">
                  {stepperStates.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isActive = idx === currentStepIdx;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 text-[8px] font-black transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isActive 
                              ? 'bg-[var(--primary)] border-[var(--primary)] text-white scale-110 shadow shadow-[var(--primary)]/30 animate-pulse' 
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`text-[8px] font-extrabold text-center max-w-[50px] leading-tight truncate ${
                          isActive ? 'text-[var(--primary)] font-black' : isCompleted ? 'text-emerald-600' : 'text-zinc-400'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rider Information card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3.5 rounded-xl flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5 mb-2.5">Allocated Courier Agent</h4>
                  
                  {tracking.rider ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                          {tracking.rider.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{tracking.rider.name}</p>
                          <div className="flex items-center gap-1 bg-yellow-105 text-yellow-700 dark:text-yellow-500 px-1 rounded text-[8px] font-bold w-max mt-0.5">
                            <Star size={9} className="fill-current" /> 4.8 Rating
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-semibold space-y-1.5 text-zinc-500 dark:text-zinc-400">
                        <p className="flex items-center gap-1.5"><Phone size={12} /> {tracking.rider.phone}</p>
                        <p className="flex items-center gap-1.5">🏍️ Vehicle: <span className="font-mono text-zinc-700 dark:text-zinc-300">{tracking.rider.vehicleNumber}</span></p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">Courier assignment in progress...</p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] text-zinc-450 font-bold">
                  <span>Live ETA:</span>
                  <span className="text-orange-500 text-xs font-extrabold flex items-center gap-1">
                    <Clock size={11} /> {tracking.eta}
                  </span>
                </div>
              </div>

              {/* GPS Plotter Preview */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden min-h-[160px] relative flex flex-col justify-between shadow-inner">
                <div className="absolute inset-0 bg-radial-gradient opacity-10 pointer-events-none"></div>
                <div className="p-3 z-10 flex justify-between items-start">
                  <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                    Live GPS Grid
                  </span>
                  <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-800/30 animate-pulse">
                    Connected
                  </span>
                </div>

                {/* Simulated Radar Dot Plot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-zinc-800/40 animate-ping absolute" />
                  <div className="w-16 h-16 rounded-full border border-zinc-800/20 absolute" />
                  {/* Store Coordinate */}
                  <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full border border-white z-10 shadow" style={{ top: '45%', left: '35%' }} title="Store Hub" />
                  {/* Rider Coordinate */}
                  {tracking.rider && (
                    <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white z-20 shadow animate-bounce" style={{ top: '30%', left: '55%' }} title="Rider Location" />
                  )}
                  {/* Customer Coordinate */}
                  <div className="absolute w-2.5 h-2.5 bg-[var(--primary)] rounded-full border border-white z-10 shadow" style={{ top: '65%', left: '70%' }} title="Customer Location" />
                </div>

                <div className="p-2 bg-zinc-900/90 border-t border-zinc-850 z-10 flex justify-between items-center text-[9px] text-zinc-400 font-semibold font-mono">
                  <span>Satellites: 4 Linked</span>
                  <span>Signal: Stable</span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded-lg flex items-center gap-2 text-[10px] text-zinc-500 leading-normal font-semibold">
              <Info size={14} className="text-[var(--primary)] shrink-0" />
              <span>
                Coordinates sync every 15 seconds. Courier telemetry is backed by Google Maps API services. Last coordinate sync: {new Date(tracking.lastUpdated).toLocaleTimeString()}.
              </span>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
          <button 
            className="h-8 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            onClick={onClose}
          >
            Close Radar
          </button>
        </div>

      </div>
    </div>
  );
}
