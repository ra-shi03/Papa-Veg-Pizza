import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Info, Trash2 } from "lucide-react";
import { GoogleMap, useJsApiLoader, Polygon } from "@react-google-maps/api";

const LIBRARIES = Object.freeze(['geometry', 'places']);

export default function EditZoneModal({ isOpen, onClose, onSubmit, regions = [], existingZones = [], editZone }) {
  const [zoneName, setZoneName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [coordinates, setCoordinates] = useState([]);
  const [error, setError] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [mapZoom, setMapZoom] = useState(4);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    version: "3.64"
  });

  useEffect(() => {
    if (!isLoaded || !zoneName.trim() || coordinates.length > 0) return;
    const timeoutId = setTimeout(() => {
      const geocoder = new window.google.maps.Geocoder();
      // Appending India context to get better results
      geocoder.geocode({ address: zoneName.trim() + ", India" }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setMapCenter({ lat: loc.lat(), lng: loc.lng() });
          setMapZoom(12);
        }
      });
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [zoneName, isLoaded, coordinates.length]);

  const polygonRef = useRef(null);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCoordinates(prev => [...prev, { latitude: lat, longitude: lng }]);
  }, []);

  const onPolygonLoad = useCallback((polygon) => {
    polygonRef.current = polygon;
  }, []);

  const onPolygonEdit = useCallback(() => {
    if (polygonRef.current) {
      const path = polygonRef.current.getPath();
      const newCoords = [];
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i);
        newCoords.push({ latitude: latLng.lat(), longitude: latLng.lng() });
      }
      setCoordinates(newCoords);
    }
  }, []);

  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current = null;
    }
    setCoordinates([]);
  };

  useEffect(() => {
    if (editZone) {
      setZoneName(editZone.name || "");
      setRegionId(editZone.regionId || "");
      setDescription(editZone.description || "");
      setStatus(editZone.status || "Active");
      setCoordinates([...(editZone.coordinates || [])]);
    }
    setError("");
  }, [editZone, isOpen, regions]);

  if (!isOpen || !editZone) return null;

  const handleSave = () => {
    setError("");
    const trimmedName = zoneName.trim();

    if (!trimmedName) {
      setError("Zone name is required.");
      return;
    }
    if (!regionId) {
      setError("Valid region selection is required.");
      return;
    }
    if (coordinates.length < 3) {
      setError("Please draw a valid zone boundary (polygon) on the map.");
      return;
    }

    // Check duplicate (exclude current zone)
    const isDuplicate = existingZones.some(
      (z) =>
        z.name.toLowerCase() === trimmedName.toLowerCase() &&
        z.regionId === regionId &&
        z.id !== editZone.id
    );

    if (isDuplicate) {
      const parentRegion = regions.find((r) => r.id === regionId);
      setError(`Zone "${trimmedName}" already exists in region "${parentRegion?.name || regionId}".`);
      return;
    }

    const selectedRegion = regions.find((r) => r.id === regionId);

    onSubmit({
      ...editZone,
      name: trimmedName,
      regionId,
      regionName: selectedRegion ? selectedRegion.name : "",
      description,
      status: status,
      coordinates
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm lg:pl-[280px]" id="edit-zone-modal">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">
              Edit Zone
            </h3>
            <p className="text-[10px] font-bold text-[var(--primary)] mt-0.5">
              Modifying {editZone.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {editZone.storesCount > 0 && regionId !== editZone.regionId && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex gap-2">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400">
                Warning: Reassigning parent region. Ensure associated territories remain consistent with new region.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="zoneName" className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Zone Name *</label>
                <input
                  id="zoneName"
                  name="zoneName"
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Mumbai Central, Pune West"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="regionId" className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Select Region *</label>
                <select
                  id="regionId"
                  name="regionId"
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                >
                  <option value="" disabled>Select parent region</option>
                  {regions.filter(r => r.status === "Active" || r.id === regionId).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain territories covered (e.g. Andheri, Bandra, Juhu)..."
                  rows={3}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="status" className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Status</label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Right Column: Map */}
            <div className="space-y-1 flex flex-col h-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">
                  Zone Boundary *
                </span>
                {coordinates.length > 0 && (
                  <button 
                    onClick={clearPolygon}
                    className="text-[9px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={10} />
                    Clear Map
                  </button>
                )}
              </div>
              <div className="flex-1 min-h-[250px] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 relative">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={coordinates.length > 0 ? { lat: coordinates[0].latitude, lng: coordinates[0].longitude } : mapCenter}
                    zoom={coordinates.length > 0 ? 10 : mapZoom}
                    options={{ disableDefaultUI: true, gestureHandling: 'greedy', zoomControl: true }}
                    onClick={onMapClick}
                  >
                    {coordinates.length > 0 && (
                      <Polygon
                        onLoad={onPolygonLoad}
                        onMouseUp={onPolygonEdit}
                        onDragEnd={onPolygonEdit}
                        paths={coordinates.map(c => ({ lat: c.latitude, lng: c.longitude }))}
                        options={{
                          fillColor: "var(--primary)",
                          fillOpacity: 0.2,
                          strokeWeight: 2,
                          strokeColor: "var(--primary)",
                          clickable: true,
                          editable: true,
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
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between gap-3 select-none">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
