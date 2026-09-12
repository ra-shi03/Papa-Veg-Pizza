import React, { useState, useEffect } from "react"
import { Building2, MapPin, Settings, User, X, Check, ArrowRight, ArrowLeft, Navigation } from "lucide-react"
import { toast } from "sonner"
import { adminAPI } from "@food/api"
import apiClient from "@food/api/axios"
import { GoogleMap, useJsApiLoader, Polygon, Marker, useGoogleMap } from "@react-google-maps/api"

// Helper component to trigger bounds fitting when territory/zone changes
function MapBoundsFitter({ territoryCoordinates, zoneCoordinates, hasTerritory }) {
  const map = useGoogleMap();
  useEffect(() => {
    if (map && window.google) {
      if (hasTerritory && territoryCoordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        territoryCoordinates.forEach(c => {
          bounds.extend(new window.google.maps.LatLng(
            parseFloat(c.latitude || c[1]), 
            parseFloat(c.longitude || c[0])
          ));
        });
        map.fitBounds(bounds);
      } else if (!hasTerritory && zoneCoordinates && zoneCoordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        zoneCoordinates.forEach(c => {
          bounds.extend(new window.google.maps.LatLng(
            parseFloat(c.latitude || c[1]), 
            parseFloat(c.longitude || c[0])
          ));
        });
        map.fitBounds(bounds);
      }
    }
  }, [map, territoryCoordinates, zoneCoordinates, hasTerritory]);
  return null;
}

export default function StoreModal({ isOpen, onClose, onConfirm, store = null }) {
  const isEdit = !!store
  const [step, setStep] = useState(1)
  const [managers, setManagers] = useState([])
  const [loadingManagers, setLoadingManagers] = useState(false)

  // Form State
  const [storeName, setStoreName] = useState("")
  const [storeCode, setStoreCode] = useState("")
  const [storeType, setStoreType] = useState("DELIVERY_CARRYOUT")
  const [fulfillmentModes, setFulfillmentModes] = useState(["Delivery", "Takeaway"])
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  // Address State
  const [addressLine1, setAddressLine1] = useState("")
  const [regionName, setRegionName] = useState("")
  const [zoneName, setZoneName] = useState("")
  const [territoryId, setTerritoryId] = useState("")
  const [territories, setTerritories] = useState([])
  const [pincode, setPincode] = useState("")
  const [latitude, setLatitude] = useState(22.7196)
  const [longitude, setLongitude] = useState(75.8763)
  const [zoneCoordinates, setZoneCoordinates] = useState([])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  })

  // Manager & Capacity State
  const [managerId, setManagerId] = useState("")
  const [maxOrdersHour, setMaxOrdersHour] = useState(60)
  const [maxKitchenCapacity, setMaxKitchenCapacity] = useState(100)
  const [status, setStatus] = useState("Active")

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      
      // Fetch Managers for Step 3
      setLoadingManagers(true)
      adminAPI.getStoreManagers()
        .then((res) => {
          setManagers(res?.data?.data || [])
        })
        .catch(() => setManagers([]))
        .finally(() => setLoadingManagers(false))

      // Fetch Franchise context & Territories
      Promise.allSettled([
        adminAPI.getMyFranchise(),
        apiClient.get('/food/admin/territories'),
        apiClient.get('/food/admin/zones'),
        apiClient.get('/food/admin/regions'),
        adminAPI.getStores()
      ]).then(([franchiseResult, territoriesResult, zonesResult, regionsResult, storesResult]) => {
        const rawFranchiseData = franchiseResult.status === 'fulfilled' ? franchiseResult.value?.data?.data : null;
        const franchise = rawFranchiseData?.franchise || rawFranchiseData;

        const extractArray = (res) => {
          if (res.status !== 'fulfilled') return [];
          if (Array.isArray(res.value?.data?.data)) return res.value.data.data;
          if (Array.isArray(res.value?.data)) return res.value.data;
          return [];
        };
        
        if (franchise) {
          const franchiseZoneId = typeof franchise.zoneId === 'object' ? franchise.zoneId?._id || franchise.zoneId?.id : franchise.zoneId;
          const franchiseRegionId = typeof franchise.regionId === 'object' ? franchise.regionId?._id || franchise.regionId?.id : franchise.regionId;
          
          const allZones = extractArray(zonesResult);
          const allRegions = extractArray(regionsResult);
          
          const currentZone = allZones.find(z => (z.id || z._id) === franchiseZoneId);
          const currentRegion = allRegions.find(r => (r.id || r._id) === franchiseRegionId);
          
          setRegionName(currentRegion?.name || franchise.regionId?.name || franchise.regionId || "Unknown");
          setZoneName(currentZone?.name || franchise.zoneId?.name || franchise.zoneId || "Unknown");
          
          const allTerritories = extractArray(territoriesResult);
          const existingStores = extractArray(storesResult);

          
          // Find territoryIds of existing stores (ignore the current store being edited)
          const occupiedTerritoryIds = existingStores
             .filter(s => s._id !== store?._id && s.id !== store?.id)
             .map(s => s.territoryId || s.address?.territoryId)
             .filter(Boolean);

          console.log("Franchise Zone ID:", franchiseZoneId);
          console.log("All Territories:", allTerritories);

          const filtered = allTerritories.filter(t => {
             const tZoneId = typeof t.zoneId === 'object' ? t.zoneId._id || t.zoneId.id : t.zoneId;
             const isSameZone = String(tZoneId) === String(franchiseZoneId);
             const isActive = t.status === "Active";
             const tId = t.id || t._id;
             const isNotOccupied = !occupiedTerritoryIds.includes(tId);
             
             // Debug log
             console.log(`Territory ${t.name}: Zone Match=${isSameZone}(${tZoneId}), Active=${isActive}(${t.status}), NotOccupied=${isNotOccupied}`);
             
             return isSameZone && isActive && isNotOccupied;
          });
          
          // If filtered is empty but there are territories, maybe just show them all for debugging
          setTerritories(filtered.length > 0 ? filtered : allTerritories.map(t => ({...t, name: `[DEBUG] ${t.name} (Z:${t.zoneId} S:${t.status})`})));

          if (currentZone && currentZone.coordinates) {
             setZoneCoordinates(currentZone.coordinates);
          } else {
             setZoneCoordinates([]);
          }
        }
      }).catch(console.error);

      if (store) {
        setStoreName(store.storeName || "")
        setStoreCode(store.storeCode || "")
        setStoreType(store.storeType || "DELIVERY_CARRYOUT")
        setFulfillmentModes(store.fulfillmentModes || ["Delivery", "Takeaway"])
        setPhone(store.phone || "")
        setEmail(store.email || "")

        setAddressLine1(store.address?.line1 || "")
        setTerritoryId(store.territoryId || store.address?.territoryId || "")
        setPincode(store.address?.pincode || "")
        setLatitude(store.address?.coordinates?.[1] || 22.7196)
        setLongitude(store.address?.coordinates?.[0] || 75.8763)

        setManagerId(store.managerId || "")
        setMaxOrdersHour(store.maxOrdersHour || 60)
        setMaxKitchenCapacity(store.maxKitchenCapacity || 100)
        setStatus(store.status || "Active")
      } else {
        setStoreName("")
        setStoreCode("")
        setStoreType("DELIVERY_CARRYOUT")
        setFulfillmentModes(["Delivery", "Takeaway"])
        setPhone("")
        setEmail("")

        setAddressLine1("")
        setTerritoryId("")
        setPincode("")
        setLatitude(22.7196)
        setLongitude(75.8763)

        setManagerId("")
        setMaxOrdersHour(60)
        setMaxKitchenCapacity(100)
        setStatus("Active")
      }
    }
  }, [store, isOpen])

  if (!isOpen) return null

  const handleFetchLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
          
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat: position.coords.latitude, lng: position.coords.longitude } }, (results, status) => {
              if (status === "OK" && results[0]) {
                const addressComponents = results[0].address_components
                setAddressLine1(results[0].formatted_address)
                
                const pin = addressComponents.find(c => c.types.includes("postal_code"))
                if (pin) setPincode(pin.long_name)
              }
            })
          }
        },
        (error) => {
          console.error("Error fetching location:", error)
          alert("Unable to fetch location. Please ensure location permissions are granted.")
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  const handleGoogleMapClick = (e) => {
    if (e.latLng) {
      setLatitude(e.latLng.lat())
      setLongitude(e.latLng.lng())
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!storeName || !storeCode || !phone || !email) {
        alert("Please fill in all required basic fields.")
        return
      }
    } else if (step === 2) {
      if (!addressLine1 || !territoryId || !pincode) {
        alert("Please fill in all address details, including territory.")
        return
      }
    }
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!managerId) {
      alert("Please select a store manager.")
      return
    }

    const payload = {
      storeName,
      storeCode,
      storeType,
      fulfillmentModes,
      phone,
      email,
      address: {
        line1: addressLine1,
        city: regionName, // Fallback mappings for old fields
        state: zoneName,
        pincode,
        coordinates: [longitude, latitude]
      },
      territoryId,
      managerId,
      maxOrdersHour,
      maxKitchenCapacity,
      status,
      currentCapacity: status === "Active" ? 25 : 0
    }

    onConfirm(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden transition-all scale-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Store Details" : "Add New Store"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEdit ? "Modify configuration settings for this outlet" : "Launch a new store location under the franchise"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center justify-between w-full max-w-md mx-auto">
            {[
              { num: 1, label: "Basic Info", icon: Building2 },
              { num: 2, label: "Address", icon: MapPin },
              { num: 3, label: "Configs", icon: Settings }
            ].map((s) => {
              const Icon = s.icon
              const isActive = step === s.num
              const isPassed = step > s.num
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                      isActive
                        ? "bg-primary text-white border-primary ring-4 ring-primary/20"
                        : isPassed
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isPassed ? <Check className="w-4.5 h-4.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isActive ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.num < 3 && <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800 mx-2" />}
                </div>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Steps Content */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            
            {/* STEP 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Papa Veg Pizza - Vijay Nagar"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Store Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PVP-IND-02"
                      value={storeCode}
                      onChange={(e) => setStoreCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Store Type *
                    </label>
                    <select
                      value={storeType}
                      onChange={(e) => setStoreType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="DELIVERY_CARRYOUT">Delivery & Carryout</option>
                      <option value="DINE_IN">Dine-In</option>
                      <option value="EXPRESS">Express</option>
                      <option value="KIOSK">Kiosk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98260XXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. outlet@papaveg.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Supported Orders (Fulfillment Modes) *
                  </label>
                  <div className="flex gap-6">
                    {["Delivery", "Takeaway", "Dine-In"].map((mode) => (
                      <label key={mode} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={fulfillmentModes.includes(mode)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFulfillmentModes((prev) => [...prev, mode])
                            } else {
                              setFulfillmentModes((prev) => prev.filter((m) => m !== mode))
                            }
                          }}
                          className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary focus:ring-offset-0 bg-slate-50 dark:bg-slate-900 cursor-pointer transition-colors"
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {mode}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Address & Google Map Picker */}
            {step === 2 && (
              <div className="grid grid-cols-12 gap-5">
                {/* Form Fields */}
                <div className="col-span-5 space-y-4">
                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <span>Address Line 1 *</span>
                      <button
                        type="button"
                        onClick={handleFetchLocation}
                        className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-bold bg-primary/10 px-2 py-0.5 rounded-full transition-colors"
                      >
                        <Navigation size={10} />
                        Fetch Location
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shop 5, Ground Floor, Shekhar Central"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Region *
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={regionName}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none opacity-80 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Zone *
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={zoneName}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none opacity-80 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Territory *
                    </label>
                    <select
                      required
                      value={territoryId}
                      onChange={(e) => setTerritoryId(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Territory</option>
                      {territories.map((t) => (
                        <option key={t.id || t._id} value={t.id || t._id}>
                          {t.name || t.territoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 452001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Latitude</span>
                      <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">{latitude}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Longitude</span>
                      <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">{longitude}</span>
                    </div>
                  </div>
                </div>

                {/* Real Google Map Picker */}
                <div className="col-span-7 flex flex-col">
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Click Map to Place Pin
                  </span>
                  <div className="relative flex-1 min-h-[220px] rounded-2xl border border-slate-250 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-inner">
                    {isLoaded ? (
                      (() => {
                        const selectedTerritory = territories.find(t => (t.id || t._id) === territoryId)
                        const territoryCoordinates = selectedTerritory?.coordinates || []
                        const hasTerritory = territoryCoordinates.length > 0;
                        
                        // We need a tiny internal component to use the GoogleMap instance via useEffect if we aren't tracking it in parent state
                        // Or we can just use the onLoad pattern with a ref
                        
                        return (
                          <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={{ lat: latitude, lng: longitude }}
                            zoom={13}
                            options={{ disableDefaultUI: true, gestureHandling: 'greedy', zoomControl: true }}
                            onClick={handleGoogleMapClick}
                            onLoad={(map) => {
                              // Initial load bounds
                              if (hasTerritory && window.google) {
                                const bounds = new window.google.maps.LatLngBounds();
                                territoryCoordinates.forEach(c => {
                                  bounds.extend(new window.google.maps.LatLng(
                                    parseFloat(c.latitude || c[1]), 
                                    parseFloat(c.longitude || c[0])
                                  ));
                                });
                                map.fitBounds(bounds);
                              } else if (zoneCoordinates && zoneCoordinates.length > 0 && window.google) {
                                const bounds = new window.google.maps.LatLngBounds();
                                zoneCoordinates.forEach(c => {
                                  bounds.extend(new window.google.maps.LatLng(
                                    parseFloat(c.latitude || c[1]), 
                                    parseFloat(c.longitude || c[0])
                                  ));
                                });
                                map.fitBounds(bounds);
                              }
                              // Attach to window so we can trigger it from outside, or store it
                              window.__storeModalMap = map;
                            }}
                          >
                            {/* Hidden functional component to trigger bounds changes */}
                            <MapBoundsFitter 
                              territoryCoordinates={territoryCoordinates} 
                              zoneCoordinates={zoneCoordinates} 
                              hasTerritory={hasTerritory} 
                            />
                            {!hasTerritory && zoneCoordinates && zoneCoordinates.length > 0 && (
                              <Polygon
                                paths={zoneCoordinates.map(c => ({ lat: parseFloat(c.latitude || c[1]), lng: parseFloat(c.longitude || c[0]) }))}
                                options={{
                                  fillColor: "var(--primary)",
                                  fillOpacity: 0.15,
                                  strokeWeight: 2,
                                  strokeColor: "var(--primary)",
                                  clickable: false,
                                  editable: false,
                                  draggable: false,
                                }}
                              />
                            )}
                            {hasTerritory && (
                              <Polygon
                                paths={territoryCoordinates.map(c => ({ lat: parseFloat(c.latitude || c[1]), lng: parseFloat(c.longitude || c[0]) }))}
                                options={{
                                  fillColor: "#10b981",
                                  fillOpacity: 0.25,
                                  strokeWeight: 2,
                                  strokeColor: "#059669",
                                  clickable: false,
                                  editable: false,
                                  draggable: false,
                                }}
                              />
                            )}
                            <Marker 
                              position={{ lat: latitude, lng: longitude }}
                              draggable={true}
                              onDragEnd={(e) => {
                                if (e.latLng) {
                                  setLatitude(e.latLng.lat())
                                  setLongitude(e.latLng.lng())
                                }
                              }}
                            />
                          </GoogleMap>
                        )
                      })()
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-[10px] text-slate-500 font-bold">
                        Loading Map...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Assign Manager, Capacity & Status */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Assign Store Manager *
                    </label>
                    <select
                      required
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      disabled={loadingManagers}
                    >
                      <option value="">-- Choose Manager --</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Initial Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>


              </div>
            )}

          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-855">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 text-white bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold shadow-md transition-all"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold shadow-md transition-all"
                >
                  {isEdit ? "Save Changes" : "Create Store"}
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}
