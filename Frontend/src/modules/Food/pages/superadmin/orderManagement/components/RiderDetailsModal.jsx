// RiderDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Star, Phone, ShieldCheck, MapPin, Compass, Navigation } from 'lucide-react';
import { getRiderDetailsApi } from '../AllOrdersData';
import { toast } from 'sonner';

export default function RiderDetailsModal({ isOpen, onClose, riderId }) {
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && riderId) {
      fetchRiderDetails();
    }
  }, [isOpen, riderId]);

  const fetchRiderDetails = async () => {
    setLoading(true);
    try {
      const data = await getRiderDetailsApi(riderId);
      setRider(data);
    } catch (err) {
      toast.error('Failed to load rider details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 select-none text-zinc-800 dark:text-zinc-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1">
            <ShieldCheck size={16} className="text-emerald-500" />
            Courier Profile Verification
          </h3>
          <button 
            className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Syncing Fleet Record...</p>
          </div>
        ) : rider ? (
          <div className="p-4 space-y-4">
            
            {/* Header info card */}
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 shrink-0">
                <img 
                  alt={rider.name} 
                  className="w-full h-full object-cover" 
                  src={rider.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                />
              </div>

              <div className="space-y-1 min-w-0">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 truncate">{rider.name}</h4>
                <div className="flex items-center gap-1 bg-yellow-105 text-yellow-700 dark:text-yellow-500 px-1.5 py-0.5 rounded text-[9px] font-bold w-max">
                  <Star size={10} className="fill-current" /> {rider.averageRating} Rating
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase">Rider ID: {rider._id}</p>
              </div>
            </div>

            {/* Rider metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Today's Jobs</span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{rider.todayDeliveries} Deliveries</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Vehicle Class</span>
                <span className="text-sm font-mono text-[var(--primary)] font-bold">{rider.vehicleNumber}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Duty Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {rider.status}
                </span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Speed telemetry</span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{rider.speed} km/h</span>
              </div>
            </div>

            {/* GPS details */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold space-y-2">
              <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">GPS Coordinates</span>
              <div className="flex items-center justify-between font-mono">
                <span className="flex items-center gap-1 text-zinc-500"><MapPin size={12} /> Latitude:</span>
                <span>{rider.lat}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="flex items-center gap-1 text-zinc-500"><Compass size={12} /> Longitude:</span>
                <span>{rider.lng}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-450 border-t border-zinc-200 dark:border-zinc-800/80 pt-1.5">
                <span>Last telemetry ping:</span>
                <span>{rider.lastActiveTime}</span>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="pt-2 flex gap-3 border-t border-zinc-150 dark:border-zinc-800">
              <a 
                href={`tel:${rider.phone}`}
                onClick={() => toast.success(`Simulating call connection to ${rider.name}...`)}
                className="flex-1 bg-[var(--primary)] text-white h-9 rounded-lg text-xs font-bold hover:opacity-90 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone size={13} />
                <span>Call Courier</span>
              </a>
              <button 
                onClick={onClose}
                className="flex-1 border border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 h-9 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        ) : (
          <div className="p-6 text-center text-zinc-400 italic text-xs">Failed to load rider details.</div>
        )}

      </div>
    </div>
  );
}
