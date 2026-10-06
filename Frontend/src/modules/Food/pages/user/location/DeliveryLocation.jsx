import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Bike, ShoppingBag, Utensils, Train, ChevronRight, Car } from 'lucide-react';
import { useLocationStore } from '@food/store/locationStore';
import { locationAPI } from '@/services/api/location';
import apiClient from '@/services/api/axios';

export default function DeliveryLocation() {
  const navigate = useNavigate();
  const locationState = useLocationStore((state) => state);
  const currentAddress = locationState.address || "Regal Circle, South Tukoganj";

  const [activeService, setActiveService] = useState('delivery');
  const [nearbyStores, setNearbyStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [pnr, setPnr] = useState('');
  const [agreed, setAgreed] = useState(false);

  const iconMap = {
    delivery: Bike,
    takeaway: ShoppingBag,
    dinein: Utensils,
    train: Train,
    incar: Car
  };

  const defaultMethodsTemplate = [
    { id: 'delivery', label: 'Delivery', enabled: true },
    { id: 'takeaway', label: 'Takeaway', enabled: true },
    { id: 'dinein', label: 'Dine-in', enabled: true },
    { id: 'train', label: 'Deliver on train', enabled: true },
    { id: 'incar', label: 'In-Car', enabled: false }
  ];

  const [orderMethods, setOrderMethods] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_order_methods");
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = defaultMethodsTemplate.map(def => {
          const found = parsed.find(p => p.id === def.id);
          return found ? { ...def, enabled: found.enabled, label: found.label } : def;
        });
        return merged.filter(m => m.enabled);
      }
    } catch (e) {
      console.error("Failed to parse order methods", e);
    }
    return defaultMethodsTemplate.filter(m => m.enabled);
  });

  const [trainConfig, setTrainConfig] = useState(() => {
    const defaultTrainConfig = {
      bannerTitle: 'Pizza On Your Seat',
      bannerSubtitle: 'We will deliver your favourite Pizza right on your train seat while you travel.',
      formTitle: 'Enter PNR to get started',
      terms: [
        'Ordering is only allowed for stations which are catered by us and are ahead by 2 hours or more.',
        'Delivery is available only between 12:00 and 23:00 hours. The order would get cancelled if train reaches selected station outside of these operational hours.',
        'Cancellation is only permitted within 2 hours of actual arrival at station.'
      ]
    };
    try {
      const stored = localStorage.getItem("pvp_home_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.trainConfig) {
          return {
            bannerTitle: parsed.trainConfig.bannerTitle || defaultTrainConfig.bannerTitle,
            bannerSubtitle: parsed.trainConfig.bannerSubtitle || defaultTrainConfig.bannerSubtitle,
            formTitle: parsed.trainConfig.formTitle || defaultTrainConfig.formTitle,
            terms: parsed.trainConfig.terms && parsed.trainConfig.terms.length > 0 ? parsed.trainConfig.terms : defaultTrainConfig.terms
          };
        }
      }
    } catch(e) {}
    return defaultTrainConfig;
  });

  useEffect(() => {
    const handleOrderMethodsChange = (e) => {
      let parsed = [];
      if (e.type === 'pvp_order_methods_changed') {
        parsed = e.detail;
      } else if (e.key === 'pvp_order_methods' && e.newValue) {
        parsed = JSON.parse(e.newValue);
      } else {
        const stored = localStorage.getItem("pvp_order_methods");
        if (stored) parsed = JSON.parse(stored);
      }

      if (parsed && parsed.length > 0) {
        const merged = defaultMethodsTemplate.map(def => {
          const found = parsed.find(p => p.id === def.id);
          return found ? { ...def, enabled: found.enabled, label: found.label } : def;
        });
        setOrderMethods(merged.filter(m => m.enabled));
      }
    };

    window.addEventListener('pvp_order_methods_changed', handleOrderMethodsChange);
    window.addEventListener('storage', handleOrderMethodsChange);

    const handleHomeConfigChange = (e) => {
      let parsed = null;
      if (e.type === 'homePageConfigUpdated') {
        parsed = e.detail;
      } else if (e && e.key === 'pvp_home_config' && e.newValue) {
        parsed = JSON.parse(e.newValue);
      } else {
        const stored = localStorage.getItem("pvp_home_config");
        if (stored) parsed = JSON.parse(stored);
      }
      if (parsed) {
        if (parsed.trainConfig) {
          setTrainConfig(prev => ({
            bannerTitle: parsed.trainConfig.bannerTitle || prev.bannerTitle,
            bannerSubtitle: parsed.trainConfig.bannerSubtitle || prev.bannerSubtitle,
            formTitle: parsed.trainConfig.formTitle || prev.formTitle,
            terms: parsed.trainConfig.terms && parsed.trainConfig.terms.length > 0 ? parsed.trainConfig.terms : prev.terms
          }));
        }
        if (Array.isArray(parsed.orderMethods)) {
          const defaultMethods = [
            { id: 'delivery', label: 'Delivery', enabled: true },
            { id: 'takeaway', label: 'Takeaway', enabled: true },
            { id: 'dinein', label: 'Dine-in', enabled: true },
            { id: 'train', label: 'Deliver on train', enabled: true },
            { id: 'incar', label: 'In-Car', enabled: false }
          ];
          const merged = defaultMethods.map(def => {
            const found = parsed.orderMethods.find(p => p.id === def.id);
            return found ? { ...def, enabled: found.enabled, label: found.label } : def;
          });
          setOrderMethods(merged.filter(m => m.enabled));
          localStorage.setItem("pvp_order_methods", JSON.stringify(merged));
        }
      }
    };

    const fetchServerConfig = async () => {
      try {
        const res = await apiClient.get('/settings/home-page');
        if (res?.data?.data) {
          localStorage.setItem("pvp_home_config", JSON.stringify(res.data.data));
          handleHomeConfigChange({ type: 'homePageConfigUpdated', detail: res.data.data });
        }
      } catch (err) {
        console.warn("Failed to fetch home page config from server", err);
      }
    };

    fetchServerConfig();
    handleHomeConfigChange({});

    window.addEventListener('homePageConfigUpdated', handleHomeConfigChange);
    window.addEventListener('storage', handleHomeConfigChange);

    return () => {
      window.removeEventListener('pvp_order_methods_changed', handleOrderMethodsChange);
      window.removeEventListener('storage', handleOrderMethodsChange);
      window.removeEventListener('homePageConfigUpdated', handleHomeConfigChange);
      window.removeEventListener('storage', handleHomeConfigChange);
    };
  }, []);

  const fetchNearbyStores = async () => {
    setIsLoadingStores(true);
    try {
      // Default to Indore coords if lat/lng are missing
      const lat = locationState.lat || 22.7196;
      const lng = locationState.lng || 75.8577;
      
      const res = await locationAPI.getNearbyStores(lat, lng);
      if (res?.data?.success) {
        setNearbyStores(res.data.data.stores || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStores(false);
    }
  };

  useEffect(() => {
    if (activeService === 'takeaway' || activeService === 'dinein' || activeService === 'incar') {
      fetchNearbyStores();
    }
  }, [activeService]);

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-zinc-100">
          <ArrowLeft className="w-6 h-6 text-zinc-700" />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Delivery Location</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Order Methods Grid */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 pt-2 -mt-2 -mx-4 px-4">
          {orderMethods.map((method) => {
            const IconComponent = iconMap[method.id] || Bike;
            const isActive = method.id === activeService;
            return (
              <div 
                key={method.id}
                onClick={() => setActiveService(method.id)}
                className={`shrink-0 min-w-[104px] px-2 h-[84px] flex flex-col items-center justify-center rounded-[22px] border cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-[#E53935] border-[#E53935] text-white shadow-[0_8px_20px_rgba(229,57,53,0.3)]' 
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm'
                }`}
              >
                <IconComponent 
                  className={`w-7 h-7 mb-1.5 ${isActive ? 'text-white' : 'text-zinc-600'}`} 
                  strokeWidth={1.5}
                />
                <span className="text-[11px] font-extrabold tracking-tight text-center leading-tight">
                  {method.label}
                </span>
              </div>
            );
          })}
        </div>

        {activeService !== 'train' && (
          <div>
            <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Your Location</h2>
            <div className="bg-zinc-50/50 rounded-2xl p-4 flex items-center justify-between border border-zinc-100 shadow-sm">
              <span className="text-zinc-700 text-[14px] font-medium truncate pr-4">
                {currentAddress}
              </span>
              <button 
                onClick={() => navigate('/food/user/location/setup', { state: { mode: 'manual' } })}
                className="text-[#E53935] font-bold text-sm tracking-tight whitespace-nowrap active:opacity-70"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {activeService === 'delivery' && (
          <>
            {/* Seamless Delivery Banner */}
            <div className="bg-[#E53935] rounded-3xl p-4 flex items-center justify-between mt-2 shadow-[0_10px_25px_rgba(229,57,53,0.25)] relative overflow-hidden gap-3">
              <div className="flex items-center gap-3 relative z-10 flex-1">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <MapPin className="text-white w-5 h-5" strokeWidth={2} />
                </div>
                <p className="text-white text-[11px] sm:text-xs font-semibold leading-snug tracking-tight">
                  Give us your exact location for seamless delivery
                </p>
              </div>
              <button 
                onClick={() => navigate('/food/user/location/setup', { state: { autoCheck: true } })}
                className="shrink-0 border-[1.5px] border-white/90 rounded-xl px-3 py-2 text-white text-[10px] sm:text-[11px] font-extrabold tracking-tight hover:bg-white/10 active:bg-white/20 transition-colors relative z-10 whitespace-nowrap"
              >
                Use Current Location
              </button>
              {/* Subtle background decoration */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
            </div>
          </>
        )}

        {(activeService === 'takeaway' || activeService === 'dinein' || activeService === 'incar') && (
          <div className="flex flex-col gap-3">
             <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nearby Stores</h2>
             {isLoadingStores ? (
               <div className="text-center p-8 text-zinc-500 text-sm animate-pulse font-medium bg-zinc-50 rounded-2xl border border-zinc-100">Finding nearest stores...</div>
             ) : nearbyStores.length > 0 ? (
               nearbyStores.map((store) => (
                 <div key={store._id} className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm flex items-center justify-between hover:border-zinc-300 transition-colors">
                   <div className="flex-1 overflow-hidden pr-3">
                     <h3 className="font-bold text-zinc-800 text-[14px] truncate">{store.storeName}</h3>
                     <p className="text-zinc-500 text-[12px] mt-0.5 truncate">{store.address}</p>
                     <p className="text-[#E53935] text-[11px] font-bold mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {store.distanceKm.toFixed(1)} km away
                     </p>
                   </div>
                   <button 
                     onClick={() => {
                        useLocationStore.getState().confirmLocation({
                           address: store.storeName,
                           serviceType: activeService,
                           lat: store.latitude,
                           lng: store.longitude
                        });
                        navigate('/food/user');
                     }}
                     className="bg-[#E53935] text-white px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 hover:bg-red-700 active:scale-95 transition-all shadow-[0_4px_12px_rgba(229,57,53,0.2)]"
                   >
                     Select
                   </button>
                 </div>
               ))
             ) : (
               <div className="text-center p-8 text-zinc-500 text-sm bg-zinc-50 rounded-2xl border border-zinc-100">No nearby stores found.</div>
             )}
          </div>
        )}

        {activeService === 'train' && (
          <div className="flex flex-col gap-4 animate-fadeIn pb-6">
            {/* Train Banner */}
            <div className="bg-[#E53935]/10 rounded-2xl border border-[#E53935]/20 overflow-hidden flex flex-col">
              <div className="p-4 pb-2 relative z-10">
                <h3 className="text-[#E53935] font-black text-[13px] tracking-wide uppercase mb-1">{trainConfig.bannerTitle}</h3>
                <p className="text-zinc-700 text-[12px] font-medium leading-relaxed max-w-[85%]">
                  {trainConfig.bannerSubtitle}
                </p>
              </div>
              <div className="w-full h-40 relative overflow-hidden rounded-b-2xl mt-2">
                <img 
                  src="/train_delivery_banner.jpg" 
                  alt="Delivery boy riding parallel to a train" 
                  className="w-full h-full object-cover object-center opacity-90 mix-blend-darken scale-110"
                />
              </div>
            </div>

            {/* PNR Form */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm">
              <h4 className="font-bold text-zinc-900 text-[14px] mb-4">{trainConfig.formTitle}</h4>
              <input
                type="text"
                placeholder="Enter 10 digit PNR"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#E53935] focus:bg-white transition-colors"
              />
              <p className="text-[#2e7d32] text-[11px] font-semibold mt-2 ml-1">Valid PNR Number is Mandatory</p>

              <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#E53935] border-zinc-300 focus:ring-[#E53935]" 
                />
                <span className="text-[12px] font-medium text-zinc-600 leading-snug">
                  I agree to the IRCTC Ordering Terms & Conditions
                </span>
              </label>

              <button 
                disabled={pnr.length !== 10 || !agreed}
                className="w-full mt-6 bg-[#E53935] disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-bold py-3.5 rounded-xl text-[14px] transition-all active:scale-[0.98]"
              >
                Submit
              </button>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm flex items-center justify-between cursor-pointer active:bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Train className="w-5 h-5 text-zinc-700" />
                </div>
                <span className="font-bold text-zinc-900 text-[13px] tracking-wide">IRCTC ORDER HISTORY</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>

            {/* T&C */}
            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
              <h4 className="font-extrabold text-zinc-900 text-[13px] mb-3 uppercase tracking-wide">IRCTC T&C</h4>
              <ul className="space-y-3">
                {trainConfig.terms.map((term, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                    <span className="text-[11.5px] font-medium text-zinc-600 leading-relaxed">
                      {term}
                    </span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/food/user/train-terms')}
                className="text-[#E53935] text-[12px] font-bold mt-4 w-full text-center"
              >
                Read More &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
