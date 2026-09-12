import React, { useState, useEffect } from "react";
import { X, Layers, Map, Compass, Activity, ShieldCheck, Milestone, Loader2 } from "lucide-react";
import { GoogleMap, Polygon, useJsApiLoader } from "@react-google-maps/api";
import apiClient from "../../../../../../services/api/axios";

const LIBRARIES = Object.freeze(['geometry', 'places']);

export default function ZoneDetailsDrawer({ isOpen, onClose, zone, onEdit, onAssignTerritory }) {
  const [fetchedZone, setFetchedZone] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    version: "3.64"
  });

  useEffect(() => {
    if (isOpen && zone?.id) {
      // Clear previous fetched data so it instantly reflects the updated `zone` prop
      setFetchedZone(null);
      const fetchZone = async () => {
        setIsLoading(true);
        try {
          const res = await apiClient.get(`/food/admin/zones/${zone.id}`);
          setFetchedZone(res.data.data);
        } catch (error) {
          console.error("Failed to fetch zone details", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchZone();
    } else {
      setFetchedZone(null);
    }
  }, [isOpen, zone]);

  if (!isOpen || !zone) return null;

  const displayData = fetchedZone || zone;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-900 shadow-2xl flex flex-col h-full animate-slideIn">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/20">
              <Layers size={15} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Zone Details</h3>
              <p className="text-[10px] font-bold text-black/60 dark:text-zinc-400 mt-0.5">{displayData.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <p className="text-xs font-bold text-zinc-500 mt-2">Loading data...</p>
            </div>
          ) : null}

          {/* Basic Information */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-black/55 dark:text-zinc-400 uppercase tracking-wider">Basic Information</h4>
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-900 rounded-xl text-xs">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 block uppercase">Zone Name</span>
                <span className="font-bold text-black dark:text-zinc-100">{displayData.name}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-zinc-500 block uppercase">Parent Region</span>
                <span className="font-bold text-black dark:text-zinc-100">{displayData.regionName}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                <span className="text-[9px] font-bold text-zinc-500 block uppercase">Description</span>
                <p className="font-semibold text-black/80 dark:text-zinc-300 mt-0.5 leading-relaxed">
                  {displayData.description || "Operational zone coordinating delivery routing, franchise coverage and local store logistics."}
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                <span className="text-[9px] font-bold text-zinc-500 block uppercase">Created Date</span>
                <span className="font-bold text-black dark:text-zinc-100">{displayData.createdDate || "2026-02-10"}</span>
              </div>
              <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                <span className="text-[9px] font-bold text-zinc-500 block uppercase">Status</span>
                <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                  displayData.status === "Active"
                    ? "bg-emerald-550/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400"
                }`}>
                  {displayData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Summary */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-black/55 dark:text-zinc-400 uppercase tracking-wider">Operational Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Territories</span>
                  <p className="text-sm font-black text-black dark:text-zinc-100 mt-0.5">{displayData.territoriesCount || 0}</p>
                </div>
                <Milestone className="text-zinc-400" size={16} />
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Franchises</span>
                  <p className="text-sm font-black text-black dark:text-zinc-100 mt-0.5">{displayData.franchisesCount || 0}</p>
                </div>
                <Compass className="text-zinc-400" size={16} />
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Stores</span>
                  <p className="text-sm font-black text-black dark:text-zinc-100 mt-0.5">{displayData.storesCount || 0}</p>
                </div>
                <Map className="text-zinc-400" size={16} />
              </div>
            </div>
          </div>

          {/* Geographic Boundary */}
          {displayData.coordinates && displayData.coordinates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-black/55 dark:text-zinc-400 uppercase tracking-wider">Geographic Boundary</h4>
              <div className="h-[200px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-900 relative">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={{ lat: displayData.coordinates[0].latitude, lng: displayData.coordinates[0].longitude }}
                    zoom={11}
                    options={{ disableDefaultUI: true, gestureHandling: 'greedy', zoomControl: true }}
                  >
                    <Polygon
                      path={displayData.coordinates.map(c => ({ lat: c.latitude, lng: c.longitude }))}
                      options={{
                        fillColor: "var(--primary)",
                        fillOpacity: 0.2,
                        strokeWeight: 2,
                        strokeColor: "var(--primary)",
                      }}
                    />
                  </GoogleMap>
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-zinc-100 dark:bg-zinc-900 text-[10px] text-zinc-500 font-bold">
                    Loading Map...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex flex-col gap-2 shrink-0 select-none">
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => onEdit(displayData)}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer text-center"
            >
              Edit Zone
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
