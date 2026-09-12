import React, { useState, useEffect, useMemo } from "react";
import { GoogleMap, Polygon, useJsApiLoader } from "@react-google-maps/api";
import {
  X,
  MapPin,
  Building,
  Hash,
  Activity,
  Layers,
  Store,
  DollarSign,
  TrendingUp,
  Percent,
  Compass,
  ArrowRight,
  User,
  Sliders,
  Calendar,
  ExternalLink,
  Map,
  Loader2
} from "lucide-react";
import apiClient from "../../../../../../services/api/axios";

const LIBRARIES = Object.freeze(['geometry', 'places']);

export default function TerritoryDetails({
  isOpen,
  onClose,
  territory,
  franchises,
  onEdit,
  onStatusToggle
}) {
  if (!isOpen || !territory) return null;

  // Search inside postal code chips
  const [postalSearch, setPostalSearch] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    version: "3.64"
  });

  const [detailedTerritory, setDetailedTerritory] = useState(null);
  const [zoneCoordinates, setZoneCoordinates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate polygon paths and map center
  const { polygonPaths, mapCenter } = useMemo(() => {
    const coords = (detailedTerritory || territory)?.coordinates || [];
    const paths = coords.map(c => ({ lat: c.latitude, lng: c.longitude }));
    const center = paths.length > 0 ? paths[0] : { lat: 20.5937, lng: 78.9629 }; // Default India center
    return { polygonPaths: paths, mapCenter: center };
  }, [detailedTerritory, territory]);

  useEffect(() => {
    if (isOpen && territory?.id) {
      const fetchDetails = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.get(`/food/admin/territories/${territory.id}`);
          const detailed = response.data.data;
          setDetailedTerritory(detailed);
          
          const zoneId = typeof detailed.zoneId === 'object' ? (detailed.zoneId._id || detailed.zoneId.id) : detailed.zoneId;
          if (zoneId) {
            const zonesRes = await apiClient.get('/food/admin/zones');
            const currentZone = (zonesRes?.data?.data || []).find(z => (z.id || z._id) === zoneId);
            if (currentZone && currentZone.coordinates) {
              setZoneCoordinates(currentZone.coordinates);
            }
          }
        } catch (error) {
          console.error("Failed to fetch territory details", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, territory?.id]);

  const displayTerritory = detailedTerritory || territory;

  // Filter postal codes based on search input
  const filteredPostalCodes = (displayTerritory.postalCodes || []).filter((code) =>
    code.includes(postalSearch)
  );

  return (
    <>
      {/* Drawer backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[65] transition-opacity duration-300"
      />

      {/* Drawer body container */}
      <aside className="fixed inset-y-0 right-0 z-[66] w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out select-none animate-slideOver">
        {/* Header section */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Compass className="text-[var(--primary)] shrink-0" size={18} />
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">
                Territory Details
              </h2>
              <span className="text-[9px] font-bold text-zinc-500">{territory.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-500 hover:text-black dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable details wrapper */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          )}
          
          {/* Section 1 – Basic Information */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-black dark:text-zinc-100 leading-tight">
                {displayTerritory.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                  displayTerritory.status === "Active"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450"
                }`}
              >
                {displayTerritory.status}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-zinc-500 leading-relaxed">
              {displayTerritory.description || "No description provided for this operational boundary."}
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold border-t border-zinc-100 dark:border-zinc-900 pt-2 bg-zinc-50/50 dark:bg-zinc-900/20 p-2 rounded-lg">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Created: {displayTerritory.createdAt || displayTerritory.createdDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity size={12} />
                <span>Last Updated: Today</span>
              </div>
            </div>
          </div>

          {/* Section 2 – Geographic Hierarchy */}
          <div className="border-t border-zinc-150 dark:border-zinc-900 pt-3 space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Geographic Hierarchy
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg text-black dark:text-zinc-250 border border-zinc-150 dark:border-zinc-850">
              <span className="text-zinc-500 dark:text-zinc-400">India</span>
              <ArrowRight size={10} className="text-zinc-400" />
              <span className="text-zinc-500 dark:text-zinc-400">{territory.regionName}</span>
              <ArrowRight size={10} className="text-zinc-400" />
              <span className="text-zinc-500 dark:text-zinc-400">{territory.zoneName}</span>
              <ArrowRight size={10} className="text-zinc-400" />
              <span className="font-bold text-[var(--primary)]">{displayTerritory.name}</span>
            </div>
          </div>

          {/* Section 3 – Assigned Franchise */}
          <div className="border-t border-zinc-150 dark:border-zinc-900 pt-3 space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Assigned Franchise
            </h4>
            {displayTerritory.franchisesData && displayTerritory.franchisesData.length > 0 ? (
              <div className="space-y-2">
                {displayTerritory.franchisesData.map((franchise) => (
                  <div key={franchise._id} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-black dark:text-zinc-100">
                        {franchise.name}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500">{franchise.franchiseCode}</p>
                      <div className="flex items-center gap-2 text-[9px] font-medium text-zinc-500">
                        <div className="flex items-center gap-1">
                          <User size={11} />
                          <span>Mgr: {franchise.ownerName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Store size={11} />
                          <span>Stores: {franchise.totalStores || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                <span className="text-[10px] font-bold text-amber-500">Unassigned Territory</span>
                <p className="text-[9px] text-zinc-500 mt-1">
                  Assign a franchise to start mapping stores and routing orders.
                </p>
              </div>
            )}
          </div>

          {/* Section 4 – Covered Postal Codes */}
          <div className="border-t border-zinc-150 dark:border-zinc-900 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Covered Postal Codes ({(territory.postalCodes || []).length})
              </h4>
              <input
                id="postalSearch"
                name="postalSearch"
                type="text"
                value={postalSearch}
                onChange={(e) => setPostalSearch(e.target.value)}
                placeholder="Find PIN..."
                className="w-24 p-1 text-[9px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded outline-none text-black dark:text-zinc-100"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg">
              {filteredPostalCodes.length > 0 ? (
                filteredPostalCodes.map((code) => (
                  <span
                    key={code}
                    className="px-2 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-[10px] font-black text-black dark:text-zinc-200 shadow-sm"
                  >
                    {code}
                  </span>
                ))
              ) : (
                <span className="text-[9px] text-zinc-500 font-bold p-1">No matching PIN codes.</span>
              )}
            </div>
          </div>



          {/* Section 7 – Delivery Coverage */}
          <div className="border-t border-zinc-150 dark:border-zinc-900 pt-3 space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Delivery Coverage Map
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg">
                <span>Radius: {displayTerritory.deliveryRadiusKm || 5} km</span>
                <span>Exclusive Geofence Boundary</span>
              </div>

              {/* Real Google Map Visualization */}
              <div className="h-40 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 relative">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={polygonPaths.length > 0 ? polygonPaths[0] : (zoneCoordinates && zoneCoordinates.length > 0 ? { lat: parseFloat(zoneCoordinates[0].latitude || zoneCoordinates[0][1]), lng: parseFloat(zoneCoordinates[0].longitude || zoneCoordinates[0][0]) } : mapCenter)}
                    zoom={polygonPaths.length > 0 ? 12 : (zoneCoordinates && zoneCoordinates.length > 0 ? 10 : 4)}
                    options={{ disableDefaultUI: true, gestureHandling: 'cooperative', zoomControl: true }}
                  >
                    {zoneCoordinates && zoneCoordinates.length > 0 && (
                      <Polygon
                        paths={zoneCoordinates.map(c => ({ lat: parseFloat(c.latitude || c[1]), lng: parseFloat(c.longitude || c[0]) }))}
                        options={{
                          fillColor: "#9ca3af",
                          fillOpacity: 0.2,
                          strokeWeight: 2,
                          strokeColor: "#9ca3af",
                          clickable: false,
                          editable: false,
                          draggable: false,
                          zIndex: 0,
                        }}
                      />
                    )}
                    {polygonPaths.length > 0 && (
                      <Polygon
                        paths={polygonPaths}
                        options={{
                          fillColor: "var(--primary)",
                          fillOpacity: 0.2,
                          strokeWeight: 2,
                          strokeColor: "var(--primary)",
                          clickable: false,
                          editable: false,
                          draggable: false,
                          zIndex: 1,
                        }}
                      />
                    )}
                  </GoogleMap>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-[10px] text-zinc-500 font-bold">
                    Loading Map...
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-white/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 rounded px-1 text-[8px] font-bold text-zinc-500 z-10 select-none">
                  {displayTerritory.name} Bounds
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex flex-wrap gap-2 justify-end select-none">
          <button
            onClick={() => onEdit(displayTerritory)}
            className="flex-1 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 text-black dark:text-zinc-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1 shadow-sm"
          >
            <Sliders size={12} />
            <span>EDIT</span>
          </button>

          <button
            onClick={() => onStatusToggle(displayTerritory)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer shadow-sm ${
              displayTerritory.status === "Active"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {displayTerritory.status === "Active" ? "DEACTIVATE" : "ACTIVATE"}
          </button>
        </div>
      </aside>
    </>
  );
}
