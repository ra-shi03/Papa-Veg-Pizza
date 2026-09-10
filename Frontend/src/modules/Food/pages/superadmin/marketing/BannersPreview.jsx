import React, { useState } from 'react';
import { 
  X, Monitor, Tablet, Smartphone, Layers, Eye, Calendar, MapPin, 
  ChevronLeft, ChevronRight, MessageSquare, Heart, Star
} from 'lucide-react';
import { mockRegions, mockFranchises } from './CouponsData';

export default function BannersPreview({ banner, isOpen, onClose }) {
  const [deviceMode, setDeviceMode] = useState('Desktop'); // 'Desktop' | 'Tablet' | 'Mobile' | 'Popup' | 'Offer'

  if (!isOpen || !banner) return null;

  // Formatting date range helper
  const formatDateRange = () => {
    if (!banner.startDate || !banner.endDate) return 'N/A';
    const start = new Date(banner.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const end = new Date(banner.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Visibility tags helper
  const getRegionsList = () => {
    if (!banner.regionIds || banner.regionIds.length === 0) return 'All India (National)';
    return mockRegions.filter(r => banner.regionIds.includes(r.id)).map(r => r.name).join(', ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 text-white border border-zinc-800 rounded-2xl max-w-[1100px] w-full h-[650px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <header className="px-5 py-3.5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Visual Banner Simulator</h3>
            <h2 className="text-sm font-black text-white mt-0.5">{banner.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Simulator Grid */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          
          {/* Main simulator canvas */}
          <div className="flex-1 bg-zinc-950 p-6 flex flex-col justify-center items-center overflow-y-auto min-h-0 relative select-none">
            
            {/* View Mode Selectors */}
            <div className="absolute top-4 bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex gap-1 z-20">
              {[
                { mode: 'Desktop', label: 'Desktop slider', icon: Monitor },
                { mode: 'Tablet', label: 'Tablet view', icon: Tablet },
                { mode: 'Mobile', label: 'Mobile feed', icon: Smartphone },
                { mode: 'Popup', label: 'App Popup', icon: Layers },
                { mode: 'Offer', label: 'Offer card', icon: Eye }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = deviceMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    onClick={() => setDeviceMode(item.mode)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                      isSelected 
                        ? 'bg-[var(--primary)] text-white shadow-md' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulated mock wrapper */}
            <div className="w-full flex justify-center items-center mt-10">

              {/* DESKTOP PREVIEW */}
              {deviceMode === 'Desktop' && (
                <div className="w-full max-w-[750px] aspect-[21/9] border-4 border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 shadow-xl relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent z-10"></div>
                  <img src={banner.image} className="absolute inset-0 w-full h-full object-cover" alt="Desktop slider mockup" />
                  
                  <div className="relative z-20 h-full p-8 flex flex-col justify-center items-start text-white max-w-sm space-y-2">
                    <span className="bg-[var(--primary)] text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                      {banner.bannerType}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black leading-tight">{banner.title}</h3>
                    <p className="text-[10px] opacity-75 font-medium leading-relaxed">Attributed Category redirection. Order now and get swift delivery.</p>
                    <button className="bg-[var(--primary)] hover:opacity-90 transition-opacity text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg">
                      Order Now
                    </button>
                  </div>
                  
                  {/* Slider controls mock */}
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white z-20"><ChevronLeft size={14} /></button>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white z-20"><ChevronRight size={14} /></button>
                </div>
              )}

              {/* TABLET PREVIEW */}
              {deviceMode === 'Tablet' && (
                <div className="w-[450px] aspect-[4/3] border-[6px] border-zinc-800 rounded-[24px] overflow-hidden bg-zinc-900 shadow-xl relative flex flex-col justify-between p-3">
                  <div className="absolute inset-x-0 top-0 h-4 bg-zinc-900 flex justify-center items-center"><div className="w-12 h-1.5 bg-zinc-800 rounded-full"></div></div>
                  <div className="flex-1 relative rounded-xl overflow-hidden mt-2 flex items-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent z-10"></div>
                    <img src={banner.image} className="absolute inset-0 w-full h-full object-cover" alt="Tablet mockup" />
                    
                    <div className="relative z-20 p-6 text-white space-y-2 max-w-[250px]">
                      <span className="bg-[var(--primary)] px-2 py-0.5 rounded text-[7.5px] font-black uppercase">EXCLUSIVE DEAL</span>
                      <h3 className="text-sm font-black leading-snug">{banner.title}</h3>
                      <button className="bg-[var(--primary)] text-white text-[9px] font-bold px-3 py-1 rounded-full shadow">Order Now</button>
                    </div>
                  </div>
                  <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mt-2"></div>
                </div>
              )}

              {/* MOBILE PREVIEW */}
              {deviceMode === 'Mobile' && (
                <div className="w-[240px] h-[370px] border-[5px] border-zinc-850 rounded-[32px] overflow-hidden bg-zinc-900 shadow-xl relative flex flex-col justify-between p-2">
                  <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-zinc-900 rounded-full z-10"></div>
                  
                  {/* Phone Screen body */}
                  <div className="flex-1 relative rounded-xl overflow-hidden mt-3.5 flex flex-col justify-end p-3.5">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10"></div>
                    <img src={banner.image} className="absolute inset-0 w-full h-full object-cover" alt="Mobile mockup" />
                    
                    <div className="relative z-20 text-white space-y-1.5 text-left w-full">
                      <span className="inline-block px-1.5 py-0.5 bg-[var(--primary)] text-[7px] font-extrabold uppercase rounded">{banner.bannerType.replace(' Banner', '')}</span>
                      <h4 className="text-xs font-black leading-tight">{banner.title}</h4>
                      <button className="bg-[var(--primary)] text-white text-[7.5px] font-bold px-3 py-1 rounded-full w-full shadow-md">Claim Deal</button>
                    </div>
                  </div>

                  <div className="w-12 h-0.5 bg-white/30 rounded-full mx-auto mt-1"></div>
                </div>
              )}

              {/* POPUP PREVIEW */}
              {deviceMode === 'Popup' && (
                <div className="w-[240px] h-[370px] border-[5px] border-zinc-850 rounded-[32px] overflow-hidden bg-zinc-900 shadow-xl relative flex flex-col justify-between p-2">
                  <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-zinc-900 rounded-full z-10"></div>
                  
                  {/* Phone Screen body with Popup backdrop */}
                  <div className="flex-1 relative rounded-xl overflow-hidden mt-3.5 bg-black/45 p-4 flex flex-col justify-center items-center">
                    
                    {/* Popup window */}
                    <div className="bg-white text-zinc-900 rounded-xl overflow-hidden shadow-2xl w-full max-w-[190px] relative animate-in zoom-in-90 duration-300 flex flex-col">
                      <button className="absolute right-2 top-2 w-4.5 h-4.5 bg-black/60 rounded-full text-white flex items-center justify-center text-[8px] z-20"><X size={8} /></button>
                      <div className="h-20 w-full relative">
                        <img src={banner.image} className="w-full h-full object-cover" alt="Popup cover" />
                      </div>
                      <div className="p-2.5 text-center space-y-1.5">
                        <h5 className="text-[9.5px] font-black leading-tight text-zinc-900">{banner.title}</h5>
                        <p className="text-[7.5px] text-zinc-500 font-semibold leading-normal">Exclusive offer linked. Tap below to redeem.</p>
                        <button className="bg-[var(--primary)] text-white text-[7.5px] font-bold py-1 px-3.5 rounded-full shadow-sm w-full">Claim Offer</button>
                      </div>
                    </div>

                  </div>

                  <div className="w-12 h-0.5 bg-white/30 rounded-full mx-auto mt-1"></div>
                </div>
              )}

              {/* OFFER PREVIEW */}
              {deviceMode === 'Offer' && (
                <div className="w-[300px] border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group flex flex-col">
                  <div className="h-32 w-full relative">
                    <img src={banner.image} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" alt="Offer Banner" />
                    <span className="absolute top-2 left-2 bg-[var(--primary)] text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow">
                      {banner.bannerType}
                    </span>
                  </div>
                  <div className="p-3 text-left space-y-1.5">
                    <h4 className="text-xs font-black text-white">{banner.title}</h4>
                    <p className="text-[9.5px] text-zinc-450 font-semibold leading-relaxed">
                      Redirection: Triggering {banner.redirectType} ({banner.redirectId}) display details inside active scopes.
                    </p>
                    <div className="flex justify-between items-center border-t border-zinc-800 pt-2 text-[9px] font-bold text-zinc-400">
                      <span>Priority: {banner.priority}</span>
                      <span className="text-[var(--primary)] uppercase">Claim Coupon</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Simulator Sidebar Info (Right Side) */}
          <div className="w-full md:w-[320px] bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 p-5 space-y-5 text-xs text-zinc-300 select-none shrink-0 overflow-y-auto">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-800 flex items-center gap-1.5">
              <Layers size={14} className="text-[var(--primary)]" /> Banner Properties
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[9.5px] text-zinc-500 font-bold uppercase block">Redirection Target</span>
                <span className="font-bold text-white mt-1 block flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-zinc-800 text-[9.5px] text-zinc-300 font-extrabold uppercase rounded border border-zinc-700">
                    {banner.redirectType}
                  </span>
                  <span className="truncate">{banner.redirectId}</span>
                </span>
              </div>

              <div>
                <span className="text-[9.5px] text-zinc-500 font-bold uppercase block">Display Priority</span>
                <span className="font-bold text-white mt-1 block flex items-center gap-2">
                  <span className="w-16 bg-zinc-800 h-2 rounded overflow-hidden relative inline-block">
                    <span className="absolute top-0 left-0 bg-[var(--primary)] h-full" style={{ width: `${banner.priority}%` }}></span>
                  </span>
                  <span>{banner.priority} Weight</span>
                </span>
              </div>

              <div>
                <span className="text-[9.5px] text-zinc-500 font-bold uppercase block">Schedule Duration</span>
                <span className="font-semibold text-zinc-200 mt-1 block flex items-center gap-1.5">
                  <Calendar size={13} className="text-[var(--primary)] shrink-0" />
                  {formatDateRange()}
                </span>
              </div>

              <div>
                <span className="text-[9.5px] text-zinc-500 font-bold uppercase block">Visibility Boundaries</span>
                <span className="font-semibold text-zinc-200 mt-1 block flex items-start gap-1.5">
                  <MapPin size={13} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span>{getRegionsList()}</span>
                </span>
              </div>
            </div>

            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 space-y-1.5 text-[10px] text-zinc-450 leading-relaxed font-semibold">
              <p>
                💡 Live preview utilizes exact viewport dimension ratios matching iPad, iPhone 14, and HD displays to check visual alignments.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex justify-end shrink-0 select-none">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Close Preview
          </button>
        </footer>

      </div>
    </div>
  );
}
