import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Recenter component that pans/zooms to the rider's position programmatically
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.panTo(center);
    }
  }, [center, map]);
  return null;
}

export default function TrackingMap({ store = {}, customer = {}, rider = {} }) {
  const storePos = store.latitude && store.longitude ? [parseFloat(store.latitude), parseFloat(store.longitude)] : null;
  const customerPos = customer.latitude && customer.longitude ? [parseFloat(customer.latitude), parseFloat(customer.longitude)] : null;
  const riderPos = rider.latitude && rider.longitude ? [parseFloat(rider.latitude), parseFloat(rider.longitude)] : null;

  // Icons using SVGs and divIcon (avoiding 450/Vite bundle image issue)
  const storeIcon = L.divIcon({
    html: `<div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shadow-lg animate-pulse">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>`,
    className: "custom-leaflet-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const customerIcon = L.divIcon({
    html: `<div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </div>`,
    className: "custom-leaflet-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const riderIcon = L.divIcon({
    html: `<div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-xl ring-4 ring-amber-100 dark:ring-amber-950/40">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>`,
    className: "custom-leaflet-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const defaultCenter = storePos || customerPos || [22.7432, 75.8970];

  return (
    <div className="relative w-full h-full min-h-[350px] md:min-h-[450px] rounded-2.5xl overflow-hidden border border-slate-100 dark:border-zinc-800">
      {/* Telemetry HUD overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm text-left text-[10px] space-y-1">
        <div className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[8px] border-b border-slate-150/40 pb-1">Rider Telemetry</div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 font-bold">Speed:</span>
          <span className="font-black text-slate-800 dark:text-zinc-200">{rider.speed || 0} km/h</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 font-bold">Updated:</span>
          <span className="font-black text-slate-800 dark:text-zinc-200 font-mono">
            {rider.lastUpdated ? new Date(rider.lastUpdated).toLocaleTimeString("en-IN") : "Just now"}
          </span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-0 relative select-none"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark:opacity-85 dark:contrast-125 dark:brightness-90"
        />

        {storePos && (
          <Marker position={storePos} icon={storeIcon}>
            <Popup>
              <div className="text-xs font-bold">PVP Outlet (Store)</div>
            </Popup>
          </Marker>
        )}

        {customerPos && (
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>
              <div className="text-xs font-bold">{customer.name || "Customer"}</div>
            </Popup>
          </Marker>
        )}

        {riderPos && (
          <Marker position={riderPos} icon={riderIcon}>
            <Popup>
              <div className="text-xs font-bold">{rider.name || "Rider"}</div>
            </Popup>
          </Marker>
        )}

        {/* Draw polyline route */}
        {riderPos && customerPos && (
          <Polyline
            positions={[riderPos, customerPos]}
            color="rgb(245, 158, 11)"
            weight={3}
            dashArray="5, 10"
            className="animate-pulse"
          />
        )}

        {/* Auto-recenter map when rider moves */}
        {riderPos && <RecenterMap center={riderPos} />}
      </MapContainer>
    </div>
  );
}
