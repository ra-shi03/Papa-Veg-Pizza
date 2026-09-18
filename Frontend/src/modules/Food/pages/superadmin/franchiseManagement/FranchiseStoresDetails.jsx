import React, { useState, useEffect } from "react";
import { X, Info, Phone, Mail, MapPin, User, ShieldAlert, Award, Star, Clock, Truck, BarChart2, AlertTriangle, CheckCircle, Ban, Edit2 } from "lucide-react";
import { adminAPI } from "@food/api";

export default function FranchiseStoresDetails({
  isOpen,
  onClose,
  store,
  onEdit,
  onReassignManager,
  onChangeFranchise,
  onViewAnalytics,
  onSuspendActivate
}) {
  if (!isOpen) return null;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && store?.id) {
      setLoading(true);
      adminAPI.getStoreById(store.id).then(res => {
        setDetails(res.data.data);
      }).catch(err => {
        console.error("Failed to fetch store details", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, store]);

  const getFulfillmentModeString = () => {
    const modes = details?.fulfillmentModes || [];
    if (modes.length === 0) return "Delivery & Takeaway";
    return modes.map(m => m.charAt(0) + m.slice(1).toLowerCase().replace('_', ' ')).join(' & ');
  };

  // Custom fallback mock data if store lacks specific fields
  const displayStore = {
    id: details?.code || store?.id || "PV-INC-084",
    name: details?.storeName || store?.name || "Connaught Place Central",
    franchise: details?.franchiseName || store?.franchise || "Papa Veg Pizza India",
    status: details?.isActive !== undefined ? (details.isActive ? 'Active' : 'Closed') : (store?.status || "Active"),
    phone: details?.phone || store?.phone || "+91 98765 43210",
    email: details?.email || store?.email || "cp.central@papaveg.com",
    openingTime: store?.openingTime || "11:00 AM",
    closingTime: store?.closingTime || "11:30 PM",
    createdDate: details?.createdAt ? new Date(details.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (store?.createdDate || "14 May 2022"),
    address: details?.address || store?.location || "No. 456, Connaught Place, New Delhi",
    country: "India",
    state: details?.state || store?.state || "Delhi",
    city: details?.city || store?.city || "New Delhi",
    region: details?.regionId?.name || details?.franchiseRegion || store?.region || "North India",
    zone: details?.zoneId?.name || details?.franchiseZone || store?.zone || "Zone A",
    territory: details?.territoryId?.name || store?.territory || "Connaught Place",
    latitude: details?.latitude || store?.latitude || "28.6304",
    longitude: details?.longitude || store?.longitude || "77.2177",
    manager: details?.managerName || store?.manager || "Rahul Sharma",
    managerEmail: details?.managerEmail || "N/A",
    managerPhone: details?.managerPhone || "N/A",
    franchiseOwnerName: details?.franchiseOwnerName || "Unknown",
    franchiseEmail: details?.franchiseEmail || "N/A",
    franchisePhone: details?.franchisePhone || "N/A",
    kitchenStaffCount: 14,
    deliveryPartnerCount: 9,
    ordersToday: store?.liveOrders || 24,
    pendingOrders: 5,
    deliveredOrders: 18,
    cancelledOrders: 1,
    revenueToday: store?.revenue || "₹ 14,250",
    avgPrepTime: "14 mins",
    totalSkus: 84,
    healthyItems: 72,
    lowStockItems: 10,
    outOfStockItems: 2,
    deliveryRadius: "5.5 km",
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Side Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full sm:w-[450px] lg:w-[480px] bg-zinc-50 dark:bg-zinc-950 z-50 shadow-2xl transition-transform duration-300 flex flex-col border-l border-zinc-200 dark:border-zinc-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-start shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                {displayStore.name}
              </h2>
              <span className="bg-red-500/10 text-red-650 dark:text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/30 font-mono">
                {displayStore.id}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${displayStore.status === 'Active' ? 'bg-emerald-500' :
                displayStore.status === 'Closed' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
              <span className="uppercase">{displayStore.status} Store</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide ${details?.approvalStatus === 'APPROVED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {details?.approvalStatus || store?.approval || 'APPROVED'}
              </span>
            </div>
          </div>
          <button
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-full text-zinc-500 transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content (3 Cards) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
          
          {/* Card 1: Store Details */}
          <section className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-4 shadow-sm ${loading ? 'opacity-50' : ''}`}>
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <Info size={13} className="text-red-650" />
              Store Details {loading && <span className="animate-pulse ml-1 text-red-500">Loading...</span>}
            </h3>
            
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Store Code</p>
                <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{details?.code || store?.id || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Store Name</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{details?.storeName || store?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Store Type</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{getFulfillmentModeString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Opening Date</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{details?.createdAt ? new Date(details.createdAt).toLocaleDateString('en-GB') : "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Store Number</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{details?.phone || store?.phone || "N/A"}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Store Location</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {details?.address || store?.location || "N/A"}, {details?.city || store?.city}, {details?.state || store?.state}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Region & Zone</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.region} - {displayStore.zone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Territory</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.territory}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-2">Documents</p>
              <div className="space-y-2">
                {details?.documents?.length > 0 ? (
                  details.documents.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-100 dark:border-zinc-800">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{doc.type.replace('_', ' ')}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${doc.isVerified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {doc.isVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No documents available.</p>
                )}
              </div>
            </div>
          </section>

          {/* Card 2: Franchise Details */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <Award size={13} className="text-red-650" />
              Franchise Details
            </h3>
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Franchise Name</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.franchise}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Franchise Owner Name</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.franchiseOwnerName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Franchise Number</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.franchisePhone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Franchise Mail</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">{displayStore.franchiseEmail}</p>
              </div>
            </div>
          </section>

          {/* Card 3: Manager Details */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <User size={13} className="text-red-650" />
              Manager Details
            </h3>
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Manager Name</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.manager}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Manager Email</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">{displayStore.managerEmail}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Manager Number</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.managerPhone}</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
