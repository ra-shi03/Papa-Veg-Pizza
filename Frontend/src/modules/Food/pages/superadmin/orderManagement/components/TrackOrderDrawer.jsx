// TrackOrderDrawer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Navigation, Phone, MapPin, Clock, RefreshCw, Star, Info, 
  Compass, ShieldCheck, HeartHandshake, Battery, Radio, User, Store,
  DollarSign, CreditCard, ChevronRight, MessageSquare, ListCollapse, Printer,
  Truck
} from 'lucide-react';
import { getLiveOrderTracking, getOrderStatusLogs, getLiveEventsStream } from '../AllOrdersData';
import { toast } from 'sonner';

export default function TrackOrderDrawer({ 
  isOpen, 
  onClose, 
  orderId,
  onViewCustomer,
  onViewRider,
  onPrintInvoice,
  onOpenDetails
}) {
  const [tracking, setTracking] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [liveCoords, setLiveCoords] = useState({ lat: 19.0680, lng: 72.8250, distance: '1.2 km', eta: '8 mins' });

  const eventStreamRef = useRef(null);

  // Sync drawer open transition
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      fetchTrackingData();
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, orderId]);

  // Simulated Socket.IO live coordinate updates
  useEffect(() => {
    if (!isVisible || !tracking || !tracking.rider) return;

    // Set initial coordinates
    setLiveCoords({
      lat: tracking.rider.lat,
      lng: tracking.rider.lng,
      distance: tracking.rider.distanceRemaining,
      eta: tracking.rider.eta
    });

    const interval = setInterval(() => {
      // Simulate rider moving closer to customer
      setLiveCoords(prev => {
        const custLat = tracking.customer.lat;
        const custLng = tracking.customer.lng;
        
        // Move 10% closer to customer
        const nextLat = prev.lat + (custLat - prev.lat) * 0.1;
        const nextLng = prev.lng + (custLng - prev.lng) * 0.1;
        
        // Parse ETA and distance
        const currEta = parseInt(prev.eta);
        const nextEta = currEta > 1 ? `${currEta - 1} mins` : 'Arrived';
        const currDist = parseFloat(prev.distance);
        const nextDist = currDist > 0.1 ? `${(currDist - 0.15).toFixed(2)} km` : '0 km';

        // Add Socket.IO location updated event to stream
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setEvents(evtList => [
          { 
            id: `ev-socket-${Date.now()}`, 
            event: 'riderLocationUpdated', 
            time: timeNow, 
            user: tracking.rider.name, 
            role: 'Rider GPS Telemetry' 
          },
          ...evtList
        ]);

        return {
          lat: nextLat,
          lng: nextLng,
          distance: nextDist,
          eta: nextEta
        };
      });
    }, 4500); // Trigger every 4.5 seconds

    return () => clearInterval(interval);
  }, [isVisible, tracking]);

  // Auto scroll event stream to top on new event
  useEffect(() => {
    if (eventStreamRef.current) {
      eventStreamRef.current.scrollTop = 0;
    }
  }, [events]);

  const fetchTrackingData = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await getLiveOrderTracking(orderId);
      const logs = await getOrderStatusLogs(orderId);
      const initialEvents = await getLiveEventsStream(orderId);
      setTracking(data);
      setTimeline(logs);
      setEvents(initialEvents);
    } catch (err) {
      toast.error('Failed to load active tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = () => {
    toast.success('Emitting socket coordinate ping request...');
    fetchTrackingData();
  };

  if (!isRendered) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div 
        className={`fixed inset-y-0 right-0 w-full lg:w-[80%] bg-zinc-50 dark:bg-zinc-955 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'} text-zinc-800 dark:text-zinc-150 select-none`}
      >
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <Radio size={16} className="text-red-500 animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                Live Dispatch Center: Order {tracking?.orderNumber || ''}
              </h2>
              <p className="text-[10px] text-zinc-550 flex items-center gap-1.5 mt-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Socket.IO Telemetry Connected
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-805 transition-colors text-zinc-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Attaching Dispatch Stream...</p>
          </div>
        ) : (
          /* Split View Container */
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 overflow-hidden">
            
            {/* LEFT COLUMN: TIMELINE & INFO */}
            <div className="overflow-y-auto p-4 space-y-4 border-r border-zinc-200 dark:border-zinc-800 scrollbar-thin">
              
              {/* Order Progress Timeline */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">Preparation Progress Timeline</h3>
                
                <div className="relative pl-6 space-y-4 pt-1">
                  <div className="absolute w-[2px] h-[calc(100%-1.5rem)] bg-zinc-200 dark:bg-zinc-800 left-[5px] top-4 z-0"></div>
                  
                  {timeline.map((node, idx) => {
                    const isLast = idx === timeline.length - 1;
                    return (
                      <div key={node._id} className="relative z-10 flex gap-4 text-xs font-semibold">
                        <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                          isLast ? 'bg-[var(--primary)] animate-pulse' : 'bg-emerald-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-0.2 rounded text-[9px] uppercase tracking-wider font-bold ${
                              isLast ? 'bg-[var(--primary)] text-white' : 'bg-emerald-500/10 text-emerald-600'
                            }`}>{node.status}</span>
                            <span className="text-[9px] text-zinc-400 font-mono">{new Date(node.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Updated by: {node.updatedBy} ({node.role})</p>
                          {node.remarks && (
                            <p className="text-[9px] text-zinc-400 italic mt-0.5">Remarks: "{node.remarks}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Information Card */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">Order Metadata Profile</h3>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold">
                  <div className="flex justify-between"><span className="text-zinc-450">Order Number:</span><span className="font-mono">{tracking.orderNumber}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-455">Order Type:</span><span className="text-[var(--primary)]">{tracking.orderType}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-455">Franchise:</span><span>{tracking.franchise?.name}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-455">Store Outlet:</span><span className="text-[var(--primary)]">{tracking.store?.name}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-455">Grand Total:</span><span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">₹{tracking.grandTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-455">Payment Method:</span><span>{tracking.paymentMethod}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-455">Created Time:</span><span>{new Date(tracking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-455">Target Delivery:</span><span className="text-orange-500">{tracking.expectedDeliveryTime}</span></div>
                  
                  {tracking.delayMinutes > 0 && (
                    <div className="flex justify-between col-span-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-red-650 font-bold">
                      <span>Telemetry Delay Warning:</span>
                      <span>{tracking.delayMinutes} Mins Delayed</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: RADAR MAP & COURIER ACTIVE FEED */}
            <div className="overflow-y-auto p-4 space-y-4 scrollbar-thin">
              
              {/* Live Location Map Visual */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm space-y-3 flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Dispatch Route Map</h3>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <Radio size={10} className="animate-pulse" /> Live Ping: Active
                  </span>
                </div>

                {/* Map Graphics Canvas */}
                <div className="h-[220px] bg-zinc-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-zinc-850 select-none shadow-inner">
                  <div className="absolute inset-0 bg-radial-gradient opacity-10 pointer-events-none"></div>
                  
                  {/* Mock map details */}
                  <div className="absolute top-[35%] left-[20%] z-10 flex flex-col items-center">
                    <div className="bg-[var(--primary)] text-white p-1 rounded-full border border-white shadow-md">
                      <Store size={12} />
                    </div>
                    <span className="text-[8px] bg-white text-zinc-900 px-1 rounded shadow border mt-0.5 font-bold">Outlet Hub</span>
                  </div>

                  {/* Rider Coordinate dot */}
                  {tracking.rider && (
                    <div className="absolute z-20 flex flex-col items-center transition-all duration-1000" style={{ 
                      top: `${35 + (liveCoords.lat - tracking.store.lat) * 2000}%`,
                      left: `${20 + (liveCoords.lng - tracking.store.lng) * 2000}%`
                    }}>
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg animate-bounce">
                        <Truck size={12} />
                      </div>
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded shadow border mt-0.5">{tracking.rider.name}</span>
                    </div>
                  )}

                  <div className="absolute bottom-[25%] right-[25%] z-10 flex flex-col items-center">
                    <div className="bg-blue-600 text-white p-1 rounded-full border border-white shadow-md">
                      <User size={12} />
                    </div>
                    <span className="text-[8px] bg-white text-zinc-900 px-1 rounded shadow border mt-0.5 font-bold">Client Drop</span>
                  </div>

                  {/* Route Polyline mock lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 20 35 L 50 52 L 75 75" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="3" strokeDasharray="5, 5" />
                  </svg>
                  
                  <div className="absolute bottom-2 left-2 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded text-[9px] text-zinc-400 font-mono">
                    Coords: {liveCoords.lat.toFixed(4)}, {liveCoords.lng.toFixed(4)}
                  </div>
                </div>

                {/* Map Information Panel */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold grid grid-cols-2 gap-y-2 gap-x-4">
                  <div className="col-span-2 border-b border-zinc-150 dark:border-zinc-800 pb-1.5 flex justify-between items-center">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Map Telemetry Info</span>
                    <span className="text-[10px] text-orange-500 font-bold">Traffic Index: Moderate</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase">Remaining Distance</span>
                    <span>{liveCoords.distance}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase">Travel Duration</span>
                    <span className="text-emerald-500 font-bold">{liveCoords.eta}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase">Rider Current Speed</span>
                    <span>{tracking.rider ? `${tracking.rider.speed} km/h` : '0 km/h'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase">Heading Direction</span>
                    <span>East-South-East</span>
                  </div>
                </div>
              </div>

              {/* Live Event Stream activity feed */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex flex-col h-[180px]">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5 shrink-0">Live Socket Event Activity Stream</h3>
                
                <div 
                  ref={eventStreamRef}
                  className="flex-1 overflow-y-auto space-y-2 mt-2 pr-1 scrollbar-thin"
                >
                  {events.map((evt) => (
                    <div key={evt.id} className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-805 flex justify-between items-center text-[10px] font-semibold transition-all hover:bg-white dark:hover:bg-zinc-905">
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-[var(--primary)] font-mono block">{evt.event}</span>
                        <span className="text-zinc-800 dark:text-zinc-300 truncate block mt-0.5">{evt.role}: {evt.user}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 shrink-0 ml-2">{evt.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Footer actions */}
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefreshLocation}
              className="h-8 px-3.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Ping GPS</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {tracking?.customer && (
              <button 
                onClick={() => onViewCustomer(tracking.customer._id)}
                className="h-8 px-3 rounded-lg border border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <User size={13} />
                <span>Customer</span>
              </button>
            )}

            {tracking?.rider && (
              <button 
                onClick={() => onViewRider(tracking.rider._id)}
                className="h-8 px-3 rounded-lg border border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Truck size={13} />
                <span>Rider Info</span>
              </button>
            )}

            <button 
              onClick={() => onOpenDetails(tracking)}
              className="h-8 px-3 rounded-lg border border-zinc-250 dark:border-zinc-700 text-zinc-705 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Details Drawer
            </button>

            <button 
              onClick={() => onPrintInvoice(tracking)}
              className="h-8 px-3 rounded-lg border border-zinc-250 dark:border-zinc-700 text-zinc-705 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Printer size={13} />
              <span>Invoice</span>
            </button>

            <button 
              onClick={onClose}
              className="h-8 px-4 bg-zinc-800 hover:bg-zinc-705 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
