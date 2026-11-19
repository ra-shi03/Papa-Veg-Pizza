import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Bike, ShoppingBag, Utensils, Train, ChevronRight, Car } from 'lucide-react';
import { useLocationStore } from '@food/store/locationStore';
import { locationAPI } from '@/services/api/location';
import { readSavedCoords } from '@food/utils/savedLocation';
import apiClient from '@/services/api/axios';
import { orderAPI } from '@food/api';
import { TRAIN_TERMS_TITLE, TRAIN_TERMS_SHORT } from '@food/constants/trainDelivery';
import TrainJourneyFields from '@food/components/user/TrainJourneyFields';
import { useTrainStations } from '@food/hooks/useTrainStations';
import { emptyJourney, journeyProblem, saveTrainJourney, TRAIN_LOAD_FAILED } from '@food/utils/trainJourney';

export default function DeliveryLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = useLocationStore((state) => state);
  const currentAddress = locationState.address || (() => { try { return localStorage.getItem("deliveryAddress") || ""; } catch (_) { return ""; } })() || "Location not set";

  const searchParams = new URLSearchParams(location.search);
  const serviceFromQuery = searchParams.get('tab') || searchParams.get('service') || searchParams.get('activeService');
  const [activeService, setActiveService] = useState(location.state?.activeService || serviceFromQuery || 'delivery');

  useEffect(() => {
    const s = location.state?.activeService || serviceFromQuery;
    if (s) {
      setActiveService(s);
    }
  }, [location.state?.activeService, serviceFromQuery]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [storesError, setStoresError] = useState('');
  const [carNumber, setCarNumber] = useState(() => { try { return localStorage.getItem('carNumber') || ''; } catch (_) { return ''; } });
  const [carError, setCarError] = useState('');
  const [radiusKm, setRadiusKm] = useState(null);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [journey, setJourney] = useState(emptyJourney);
  const { info: trainInfo, failed: trainFailed } = useTrainStations(activeService === 'train');
  const trainProblem = trainFailed ? TRAIN_LOAD_FAILED : journeyProblem(journey, trainInfo);
  const [agreed, setAgreed] = useState(false);

  const iconMap = {
    delivery: Bike,
    takeaway: ShoppingBag,
    dinein: Utensils,
    train: Train,
    incar: Car
  };

  // The order methods this customer may use, from the server: the super admin's switches and the stores / franchises
  // each method is limited to, applied to the store that serves the customer's saved location.
  const [orderMethods, setOrderMethods] = useState([]);
  const [methodsState, setMethodsState] = useState('loading'); // loading | ready | error

  const [trainConfig, setTrainConfig] = useState(() => {
    const defaultTrainConfig = {
      bannerTitle: 'Pizza On Your Seat',
      bannerSubtitle: 'We will deliver your favourite Pizza right on your train seat while you travel.',
      formTitle: 'Enter your train details',
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
      window.removeEventListener('homePageConfigUpdated', handleHomeConfigChange);
      window.removeEventListener('storage', handleHomeConfigChange);
    };
  }, []);

  // every method except delivery and train picks a store
  const isStoreMethod = Boolean(activeService) && activeService !== 'delivery' && activeService !== 'train';

  const fetchNearbyStores = async () => {
    setIsLoadingStores(true);
    setStoresError('');
    try {
      // The customer's own saved position; no invented default city.
      const saved = readSavedCoords();
      const lat = Number.isFinite(locationState.lat) ? locationState.lat : saved?.lat;
      const lng = Number.isFinite(locationState.lng) ? locationState.lng : saved?.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setNearbyStores([]);
        setStoresError('Set your location to see stores near you.');
        return;
      }
      const res = await locationAPI.getNearbyStores(lat, lng, '', activeService);
      if (res?.data?.success) {
        setNearbyStores(res.data.data.stores || []);
        setRadiusKm(res.data.data.radiusKm || null);
      } else {
        setNearbyStores([]);
        setStoresError('Could not load nearby stores. Please try again.');
      }
    } catch (err) {
      setNearbyStores([]);
      setStoresError('Could not load nearby stores. Please try again.');
    } finally {
      setIsLoadingStores(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    orderAPI.getOrderMethods()
      .then((methods) => {
        if (cancelled) return;
        const on = methods.filter((m) => m.enabled);
        setOrderMethods(on);
        setMethodsState('ready');
        // a method that is not offered here cannot stay selected
        setActiveService((current) => (on.some((m) => m.id === current) || on.length === 0 ? current : on[0].id));
      })
      .catch(() => { if (!cancelled) setMethodsState('error'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isStoreMethod) fetchNearbyStores();
  }, [activeService]);

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      // same background as the home page
      style={{ background: 'radial-gradient(circle at top left, #FFF4F3 0%, #F8F6F2 40%, #F5F3EF 80%, #F8F6F2 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-zinc-100">
          <ArrowLeft className="w-6 h-6 text-zinc-700" />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Delivery Location</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Order Methods Grid */}
        {methodsState === 'error' && (
          <p className="text-[13px] font-semibold text-[#E53935]">Could not load the order methods. Please check your connection and try again.</p>
        )}
        {methodsState === 'ready' && orderMethods.length === 0 && (
          <p className="text-[13px] font-semibold text-zinc-500">Ordering is not available at your location right now.</p>
        )}
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

        {isStoreMethod && (
          <div className="flex flex-col gap-3">
             {activeService === 'incar' && (
               <div className="flex flex-col gap-1.5">
                 <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Car number</label>
                 <input
                   type="text"
                   value={carNumber}
                   onChange={(e) => { setCarNumber(e.target.value); setCarError(''); }}
                   placeholder="e.g. DL 3C AB 1234"
                   className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-[#E53935]"
                 />
                 {carError && <p className="text-[12px] font-semibold text-[#E53935] ml-1">{carError}</p>}
               </div>
             )}
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
                        if (activeService === 'incar' && !carNumber.trim()) {
                          setCarError('Enter your car number first so the store can find you.');
                          return;
                        }
                        useLocationStore.getState().confirmLocation({
                           address: activeService === 'incar' ? carNumber.trim() : store.storeName,
                           serviceType: activeService,
                           storeId: String(store._id),
                           storeName: store.storeName
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
               <div className="text-center p-8 text-zinc-500 text-sm bg-zinc-50 rounded-2xl border border-zinc-100">
                 {storesError || `No stores${radiusKm ? ` within ${radiusKm} km` : ''} of your location offer this.`}
               </div>
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
              <TrainJourneyFields
                journey={journey}
                onChange={setJourney}
                info={trainInfo}
                failed={trainFailed}
                classes={{
                  label: 'block text-[11px] font-bold text-zinc-500 uppercase tracking-wide ml-1',
                  input: 'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-[14px] font-medium text-zinc-900 outline-none focus:border-[#E53935]',
                  note: 'text-zinc-500 text-[11px] font-medium ml-1',
                  error: 'text-[#E53935] text-[13px] font-semibold',
                }}
              />

              <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#E53935] border-zinc-300 focus:ring-[#E53935]" 
                />
                <span className="text-[12px] font-medium text-zinc-600 leading-snug">
                  I agree to the Train Delivery Terms
                </span>
              </label>

              <button 
                type="button"
                disabled={!!trainProblem || !agreed}
                onClick={() => {
                  if (!trainProblem && agreed) {
                    // Saves the journey and confirms the location too, so the cart opens for the order
                    saveTrainJourney(journey, (details) => useLocationStore.getState().confirmLocation(details));
                    navigate("/user/menu");
                  }
                }}
                className="w-full mt-6 bg-[#E53935] disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-bold py-3.5 rounded-xl text-[14px] transition-all active:scale-[0.98] cursor-pointer"
              >
                Submit
              </button>
            </div>

            {/* T&C */}
            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
              <h4 className="font-extrabold text-zinc-900 text-[13px] mb-3 uppercase tracking-wide">{TRAIN_TERMS_TITLE}</h4>
              <ul className="space-y-3">
                {TRAIN_TERMS_SHORT.map((term, index) => (
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
