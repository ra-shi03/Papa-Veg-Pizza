import React from "react";
import { X, Info, Phone, Mail, MapPin, User, ShieldAlert, Award, Star, Clock, Truck, BarChart2, AlertTriangle, CheckCircle, Ban, Edit2 } from "lucide-react";

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

  // Custom fallback mock data if store lacks specific fields
  const displayStore = {
    id: store?.id || "PV-INC-084",
    name: store?.name || "Connaught Place Central",
    franchise: store?.franchise || "Papa Veg Pizza India",
    status: store?.status || "Active",
    phone: store?.phone || "+91 98765 43210",
    email: store?.email || "cp.central@papaveg.com",
    openingTime: store?.openingTime || "11:00 AM",
    closingTime: store?.closingTime || "11:30 PM",
    createdDate: store?.createdDate || "14 May 2022",
    address: store?.location || "No. 456, Connaught Place, New Delhi",
    country: "India",
    state: store?.state || "Delhi",
    city: store?.city || "New Delhi",
    region: store?.region || "North India",
    zone: store?.zone || "Zone A",
    territory: store?.territory || "Connaught Place",
    latitude: store?.latitude || "28.6304",
    longitude: store?.longitude || "77.2177",
    manager: store?.owner || "Rahul Sharma",
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
              <span>•</span>
              <span>Manager: {displayStore.manager}</span>
            </div>
          </div>
          <button
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-full text-zinc-500 transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content (6 Sections) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">

          {/* Section 1 – Basic Information */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={13} className="text-red-650" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Store Code</p>
                <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Franchise Mappings</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.franchise}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Contact Number</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.phone}</p>
              </div>
              {displayStore.email && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Manager Email</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">{displayStore.email}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Business Hours</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.openingTime} - {displayStore.closingTime}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Created Date</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.createdDate}</p>
              </div>
            </div>
          </section>

          {/* Section 2 – Address */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={13} className="text-red-650" />
              Store Address &amp; Location
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Full Address</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">City / State</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.city}, {displayStore.state}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Country</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.country}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Region / Zone</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.region} ({displayStore.zone})</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Territory</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.territory}</p>
                </div>
              </div>
              {/* Static Map Preview */}
              <div className="w-full h-32 rounded-lg overflow-hidden border border-zinc-250 dark:border-zinc-750 relative bg-zinc-100 dark:bg-zinc-950">
                <img
                  className="w-full h-full object-cover"
                  alt="Static Map Location"
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&fm=webp"
                />
                <div className="absolute top-2 left-2 bg-white/95 dark:bg-zinc-900/95 px-2 py-0.5 rounded shadow-sm border border-zinc-200 dark:border-zinc-800 text-[9px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <MapPin size={10} className="text-red-650" />
                  <span>Lat: {displayStore.latitude}° N, Lng: {displayStore.longitude}° E</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 – Assigned Personnel */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-red-650" />
              Assigned Personnel
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-red-650 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {displayStore.manager.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider">Store Manager</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.manager}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50 text-center">
                  <p className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Kitchen Staff</p>
                  <p className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{displayStore.kitchenStaffCount}</p>
                </div>
                <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-955/50 text-center">
                  <p className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Delivery Partners</p>
                  <p className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{displayStore.deliveryPartnerCount}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 – Operational Metrics */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 size={13} className="text-red-650" />
              Operational Metrics
            </h3>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-[8px] font-bold text-zinc-450 uppercase tracking-wider">Today's Orders</p>
                <p className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.ordersToday}</p>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-[8px] font-bold text-zinc-450 uppercase tracking-wider">Pending / Prep</p>
                <p className="text-base font-black text-orange-600 mt-0.5">{displayStore.pendingOrders}</p>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-[8px] font-bold text-zinc-450 uppercase tracking-wider">Revenue Today</p>
                <p className="text-base font-black text-emerald-600 mt-0.5">{displayStore.revenueToday}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
              <div className="flex justify-between items-center py-1 border-b border-zinc-150 dark:border-zinc-850">
                <span className="text-zinc-500 font-semibold">Delivered Orders</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{displayStore.deliveredOrders}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-150 dark:border-zinc-850">
                <span className="text-zinc-500 font-semibold">Prep Speed (Avg)</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{displayStore.avgPrepTime}</span>
              </div>
            </div>
          </section>

          {/* Section 5 – Inventory Summary */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-red-650" />
              Inventory Summary
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Total Supervised SKUs</span>
                <span className="font-black text-zinc-900 dark:text-zinc-100">{displayStore.totalSkus}</span>
              </div>

              {/* Progress Bar of Stock status */}
              <div className="space-y-1.5 pt-1">
                <div>
                  <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500 mb-0.5">
                    <span>Healthy Stock</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{displayStore.healthyItems} items (85%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500 mb-0.5">
                    <span>Low Stock</span>
                    <span className="text-amber-600 dark:text-amber-400">{displayStore.lowStockItems} items (12%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500 mb-0.5">
                    <span>Out of Stock</span>
                    <span className="text-rose-600 dark:text-rose-455">{displayStore.outOfStockItems} items (3%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '3%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 – Delivery Information */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={13} className="text-red-650" />
              Delivery Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Delivery Radius</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayStore.deliveryRadius}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Operational Status</p>
                <span className="inline-flex items-center px-1.5 py-0.5 mt-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 rounded text-[9px] font-bold uppercase tracking-wide">
                  Active
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Geo-coordinates Point</p>
                <p className="font-mono text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5">
                  Point([{displayStore.longitude}, {displayStore.latitude}])
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Drawer Action Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => onEdit(store || displayStore)}
            className="flex-1 min-w-[90px] py-1.5 bg-red-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <Edit2 size={12} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onReassignManager(store || displayStore)}
            className="flex-1 min-w-[110px] py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-lg transition-colors"
          >
            <span>Reassign Mgr</span>
          </button>
          <button
            onClick={() => onChangeFranchise(store || displayStore)}
            className="flex-1 min-w-[110px] py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-lg transition-colors"
          >
            <span>Franchise</span>
          </button>
          <button
            onClick={() => onViewAnalytics(store || displayStore)}
            className="flex-1 min-w-[90px] py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-lg transition-colors"
          >
            <span>Analytics</span>
          </button>
          <button
            onClick={() => onSuspendActivate(store || displayStore)}
            className={`w-full py-1.5 text-xs font-bold rounded-lg border transition-colors ${displayStore.status === 'Active'
              ? 'border-rose-300 hover:bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:hover:bg-rose-955/20'
              : 'border-emerald-300 hover:bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:hover:bg-emerald-955/20'
              }`}
          >
            {displayStore.status === 'Active' ? 'Suspend Location' : 'Activate Location'}
          </button>
        </div>
      </div>
    </>
  );
}
