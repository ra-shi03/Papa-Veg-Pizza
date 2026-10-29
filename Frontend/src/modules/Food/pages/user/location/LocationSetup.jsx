import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Navigation, AlertCircle, Settings, X, Plus, ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { locationAPI } from "@/services/api/location";
import { userAPI } from "@/services/api/userApiModule";
import { useLocationStore } from "@food/store/locationStore";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";
import noAddressesImg from "@/assets/no-addresses.png";

export default function LocationSetup() {
  const navigate = useNavigate();
  const locationState = useLocation().state || {};
  // Opened from the cart ("change location"): go back there once the new location is confirmed
  const afterConfirmPath = typeof locationState.from === "string" && /cart|checkout/.test(locationState.from) ? locationState.from : "/food/user";

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [status, setStatus] = useState(() => (locationState?.mode === "my_addresses" ? "my_addresses" : "checking")); // checking, prompt, manual, map, saving, not_serviceable, add_address, my_addresses
  const [address, setAddress] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 22.7196, lng: 75.8577 });
  const [addressType, setAddressType] = useState("Home");
  const [flatNumber, setFlatNumber] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("Block, 3rd floor, Corporate House, 307 B, Regal Cir, beside DA...");
  const [addressName, setAddressName] = useState("");
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const mapRef = useRef(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [permissionState, setPermissionState] = useState("");

  const mapContainerRef = useRef(null);

  // Initialize and check permissions on mount
  useEffect(() => {
    if (locationState.mode === 'my_addresses') {
      setStatus("my_addresses");
    } else if (locationState.mode === 'manual') {
      setStatus("manual");
    } else if (afterConfirmPath !== "/food/user") {
      // Changing location from the cart: let the user choose instead of silently re-using the GPS position
      setStatus("prompt");
    } else if (locationState.autoCheck === true) {
      fetchCurrentLocation(false);
    } else {
      checkPermissionAndAutoFetch();
    }
    fetchSavedAddresses();
  }, [locationState.mode]);

  const fetchSavedAddresses = async () => {
    setLoadingAddresses(true);
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true";
    if (isAuthenticated) {
      try {
        const res = await userAPI.getAddresses();
        const addrs = res?.data?.data?.addresses || res?.data?.addresses || [];
        setSavedAddresses(addrs);
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    } else {
      setLoadingAddresses(false);
    }
  };

  const checkPermissionAndAutoFetch = async () => {
    if (!navigator.geolocation) {
      setStatus("prompt");
      return;
    }
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setPermissionState(result.state);
      
      if (result.state === "granted") {
        // Automatically fetch and route to Home/Profile
        fetchCurrentLocation(true);
      } else {
        setStatus("prompt");
      }

      result.onchange = () => {
        setPermissionState(result.state);
        if (result.state === "granted" && status === "prompt") {
          fetchCurrentLocation(true);
        }
      };
    } catch (e) {
      // Fallback for browsers that don't support permissions.query well
      setStatus("prompt");
    }
  };

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await locationAPI.searchAddress(searchQuery);
        setSuggestions(results || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSuggestionSelect = async (suggestion) => {
    setSearchQuery(suggestion.description);
    setSuggestions([]);
    setStatus("saving");
    try {
      const lat = parseFloat(suggestion.lat);
      const lng = parseFloat(suggestion.lng);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinates from search result");
      }

      const serviceResponse = await locationAPI.checkServiceability(lat, lng);
      const { isServiceable, storeId, message } = serviceResponse.data.data;
      if (isServiceable) {
        const addr = suggestion.description;
        localStorage.setItem("user_location", JSON.stringify({ address: addr, lat, lng }));
        localStorage.setItem("user_storeId", storeId);
        
        useLocationStore.getState().confirmLocation({
          address: addr,
          serviceType: "delivery",
          lat,
          lng
        });
        
        localStorage.setItem("customer_has_visited", "true");
        navigate(afterConfirmPath, { replace: true });
      } else {
        setErrorMessage(message);
        setStatus("not_serviceable");
      }
    } catch(err) {
      setStatus("manual");
      setErrorMessage("Error checking serviceability.");
    }
  };

  const fetchCurrentLocation = (isAuto = false) => {
    if (!isAuto) setStatus("checking");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode
          const addressData = await locationAPI.reverseGeocode(latitude, longitude);
          
          // Check serviceability
          const serviceResponse = await locationAPI.checkServiceability(latitude, longitude);
          const { isServiceable, storeId, message } = serviceResponse.data.data;

          if (isServiceable) {
            // Save location and store ID
            localStorage.setItem("user_location", JSON.stringify({
              lat: latitude,
              lng: longitude,
              address: addressData.formattedAddress
            }));
            localStorage.setItem("user_storeId", storeId);
            
            // Save for Home page header and store via Zustand
            useLocationStore.getState().confirmLocation({
              address: addressData.formattedAddress,
              serviceType: "delivery",
              lat: latitude,
              lng: longitude
            });
            
            // Go to home
            localStorage.setItem("customer_has_visited", "true");
            navigate(afterConfirmPath, { replace: true });
          } else {
            setErrorMessage(message);
            setStatus("not_serviceable");
          }
        } catch (error) {
          console.error(error);
          setErrorMessage("Failed to identify address. Please try manual search.");
          setStatus("manual");
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setErrorMessage("Please turn on GPS and allow location access.");
        setStatus(permissionState === "denied" ? "manual" : "prompt");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSavedAddressSelect = async (addr) => {
    setStatus("saving");
    try {
      const lng = addr.location?.coordinates?.[0] || addr.longitude;
      const lat = addr.location?.coordinates?.[1] || addr.latitude;
      
      if (!lat || !lng) {
        setErrorMessage("Coordinates missing for this address.");
        setStatus("not_serviceable");
        return;
      }

      // Check Serviceability
      const serviceResponse = await locationAPI.checkServiceability(lat, lng);
      const { isServiceable, storeId, message } = serviceResponse.data.data;

      if (!isServiceable) {
        setErrorMessage(message);
        setStatus("not_serviceable");
        return;
      }

      // If serviceable, save to local storage & store, then navigate
      const fullAddressString = `${addr.additionalDetails ? addr.additionalDetails + ', ' : ''}${addr.street}`;
      localStorage.setItem("user_location", JSON.stringify({ address: fullAddressString, lat, lng }));
      localStorage.setItem("user_storeId", storeId);
      
      useLocationStore.getState().confirmLocation({
        address: fullAddressString,
        serviceType: "delivery",
        lat,
        lng
      });
      
      localStorage.setItem("customer_has_visited", "true");
      navigate(afterConfirmPath, { replace: true });
    } catch(err) {
      setStatus("manual");
      setErrorMessage("Error selecting saved address.");
    }
  };

  const handleManualSearchSelect = async () => {
    if (!flatNumber.trim()) {
      toast.error("Please enter Building / House / Flat / Floor No");
      return;
    }

    if (isForSomeoneElse) {
      if (!recipientName.trim()) {
        toast.error("Recipient name is required");
        return;
      }
      if (!recipientPhone.trim()) {
        toast.error("Recipient number is required");
        return;
      }
      const digitsOnly = recipientPhone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        toast.error("Please enter a valid 10-digit recipient number");
        return;
      }
    }

    setStatus("saving");
    try {
      const lat = mapCenter.lat;
      const lng = mapCenter.lng;

      // 1. Check Serviceability (optional for profile address management)
      let storeId = null;
      try {
        const serviceResponse = await locationAPI.checkServiceability(lat, lng);
        if (serviceResponse?.data?.data) {
          const { isServiceable, storeId: sId, message } = serviceResponse.data.data;
          storeId = sId;
          if (!isServiceable && locationState.mode !== "my_addresses") {
            setErrorMessage(message);
            setStatus("not_serviceable");
            return;
          }
        }
      } catch (svcErr) {
        if (locationState.mode !== "my_addresses") {
          throw svcErr;
        }
      }

      const parts = detailedAddress.split(',').map(s => s.trim());
      const statePart = parts.length > 1 ? parts[parts.length - 1].replace(/\d+/g, '').trim() : "Unknown";
      const cityPart = parts.length > 2 ? parts[parts.length - 2] : "Unknown";

      const addressObj = {
        label: addressType || "Home",
        street: detailedAddress,
        additionalDetails: flatNumber,
        city: cityPart || "Unknown",
        state: statePart || "Unknown",
        latitude: lat,
        longitude: lng,
        isForSomeoneElse: !!isForSomeoneElse,
        recipientName: isForSomeoneElse ? recipientName.trim() : "",
        recipientPhone: isForSomeoneElse ? recipientPhone.trim() : "",
        phone: isForSomeoneElse ? recipientPhone.trim() : ""
      };

      // 2. Save API (if authenticated)
      const isAuthenticated = localStorage.getItem("user_authenticated") === "true";
      if (isAuthenticated) {
        try {
          if (editingAddressId) {
            await userAPI.updateAddress(editingAddressId, addressObj);
            setEditingAddressId(null);
          } else {
            await userAPI.addAddress(addressObj);
          }
        } catch (e) {
          console.error("Failed to save address to user account", e);
        }
      }

      // If user came from My Addresses / Profile management
      if (locationState.mode === "my_addresses") {
        toast.success(editingAddressId ? "Address updated successfully" : "Address saved successfully");
        setEditingAddressId(null);
        await fetchSavedAddresses();
        setStatus("my_addresses");
        return;
      }

      // 3. Save to localStorage & Store (so Header picks it up)
      const fullAddressString = `${flatNumber ? flatNumber + ', ' : ''}${detailedAddress}`;
      localStorage.setItem("user_location", JSON.stringify({ 
        address: fullAddressString, 
        lat, 
        lng,
        isForSomeoneElse: !!isForSomeoneElse,
        recipientName: isForSomeoneElse ? recipientName.trim() : "",
        recipientPhone: isForSomeoneElse ? recipientPhone.trim() : ""
      }));
      if (storeId) {
        localStorage.setItem("user_storeId", storeId);
      }
      
      useLocationStore.getState().confirmLocation({
        address: fullAddressString,
        serviceType: "delivery",
        lat,
        lng
      });
      
      localStorage.setItem("customer_has_visited", "true");
      navigate(afterConfirmPath, { replace: true });

    } catch(err) {
      setStatus("manual");
      setErrorMessage("Error processing address.");
    }
  };

  const handleEditAddress = (addr) => {
    const id = addr._id || addr.id;
    setEditingAddressId(id);
    setAddressType(addr.label || "Home");
    setAddressName(addr.label || "");
    setDetailedAddress(addr.street || "");
    setFlatNumber(addr.additionalDetails || "");
    setIsForSomeoneElse(!!addr.isForSomeoneElse);
    setRecipientName(addr.recipientName || "");
    setRecipientPhone(addr.recipientPhone || addr.phone || "");
    if (addr.location && addr.location.coordinates) {
      setMapCenter({ lat: addr.location.coordinates[1], lng: addr.location.coordinates[0] });
    }
    setStatus("add_address");
  };

  const handleDeleteAddress = async (addrId, e) => {
    e.stopPropagation();
    try {
      await userAPI.deleteAddress(addrId);
      setSavedAddresses(prev => prev.filter(a => (a._id || a.id) !== addrId));
      toast.success("Address removed successfully");
    } catch (err) {
      console.error("Failed to delete address", err);
      toast.error("Failed to delete address");
    }
  };

  const openSettings = () => {
    alert("Please open your browser/device settings to enable location permissions.");
  };

  // UI Renderers
  if (status === "checking" || status === "saving") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 relative overflow-hidden">
        {/* Map grid background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative flex items-center justify-center w-40 h-40 mb-2">
          {/* Pulsing Radar Rings */}
          <motion.div
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-16 h-16 bg-[#E53935]/30 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.75 }}
            className="absolute w-16 h-16 bg-[#E53935]/30 rounded-full"
          />
          
          {/* Rotating Dashed Circle (Targeting) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute w-24 h-24 border-[2px] border-dashed border-[#E53935]/40 rounded-full"
          />
          
          {/* Animated Pin Dropping/Floating */}
          <motion.div
            animate={{ y: [-8, 0, -8], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 text-[#E53935] drop-shadow-xl"
          >
            <MapPin className="w-14 h-14" fill="currentColor" />
          </motion.div>
        </div>
        
        {/* Text Container */}
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center z-10"
        >
          <h2 className="text-[22px] font-extrabold text-zinc-900 mb-1">
            {status === "saving" ? "Confirming Location" : "Locating You"}
          </h2>
          <p className="text-[13px] text-zinc-500 font-medium">
            {status === "saving" ? "Verifying delivery serviceability..." : "Pinpointing exact coordinates..."}
          </p>
        </motion.div>
      </div>
    );
  }

  if (status === "prompt") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center bg-white px-6 pt-24 text-center">
        <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mb-8">
          <MapPin className="w-16 h-16 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">What's your exact location?</h2>
        <p className="text-zinc-500 mb-10 px-4">
          Allow location access for exact delivery and faster address filling.
        </p>
        
        {permissionState === "denied" ? (
          <button 
            onClick={openSettings}
            className="w-full h-14 bg-zinc-900 text-white font-bold rounded-xl mb-4 flex items-center justify-center gap-2"
          >
            <Settings className="w-5 h-5" /> Open App Settings
          </button>
        ) : (
          <button 
            onClick={() => fetchCurrentLocation(false)}
            className="w-full h-14 bg-red-600 text-white font-bold rounded-xl mb-4 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
          >
            <Navigation className="w-5 h-5" /> Allow Location Access
          </button>
        )}

        <button 
          onClick={() => setStatus("manual")}
          className="text-red-600 font-bold p-4 hover:bg-red-50 rounded-lg transition-colors"
        >
          Enter Location Manually
        </button>
      </div>
    );
  }

  if (status === "not_serviceable") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center bg-white px-6 pt-32 text-center relative">
        <button 
          onClick={() => setStatus("manual")}
          className="absolute top-6 left-6 p-2 rounded-full bg-zinc-100"
        >
          <X className="w-5 h-5 text-zinc-600" />
        </button>

        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Out of Delivery Area</h2>
        <p className="text-zinc-500 mb-8">{errorMessage}</p>
        <button 
          onClick={() => setStatus("manual")}
          className="w-full h-14 bg-zinc-900 text-white font-bold rounded-xl"
        >
          Change Location
        </button>
      </div>
    );
  }

  if (status === "my_addresses") {
    const handleBackFromMyAddresses = () => {
      // If user came specifically from a checkout or cart flow
      if (
        locationState.from &&
        (locationState.from.includes("cart") || locationState.from.includes("checkout"))
      ) {
        const backTarget = locationState.from.startsWith("/food")
          ? locationState.from
          : `/food${locationState.from}`;
        navigate(backTarget);
        return;
      }

      // Default back navigation is always User Profile Details (never loop back into help or address)
      const profilePath = window.location.pathname.startsWith("/food")
        ? "/food/user/account/profile-details"
        : "/user/account/profile-details";
      navigate(profilePath);
    };

    return (
      <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 flex flex-col font-['Poppins',sans-serif]">
        {/* Top Header */}
        <div className="h-14 border-b border-gray-150 dark:border-zinc-800 px-4 flex items-center gap-3 bg-white dark:bg-zinc-900 sticky top-0 z-20">
          <button
            type="button"
            onClick={handleBackFromMyAddresses}
            className="p-1.5 -ml-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-[17px] font-bold text-zinc-900 dark:text-white m-0">My Addresses</h1>
        </div>

        {/* Content */}
        {loadingAddresses ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
            <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400">Loading addresses...</p>
          </div>
        ) : savedAddresses.length === 0 ? (
          /* Empty State (1st Image) */
          <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10 text-center">
            <img
              src={noAddressesImg}
              alt="No saved addresses"
              className="w-32 sm:w-36 h-auto object-contain mb-4 select-none drop-shadow-xs"
            />
            <h2 className="text-[19px] sm:text-xl font-bold text-zinc-900 dark:text-white mb-1 tracking-tight">
              No saved addresses found!
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs leading-normal">
              Add your first address to get started
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingAddressId(null);
                setAddressType("Home");
                setFlatNumber("");
                setAddressName("");
                setIsForSomeoneElse(false);
                setRecipientName("");
                setRecipientPhone("");
                setStatus("add_address");
              }}
              className="w-full max-w-sm h-12 bg-[#E53935] hover:bg-[#d92d36] text-white font-bold text-sm tracking-wide rounded-xl shadow-md shadow-red-500/25 active:scale-[0.98] transition-all cursor-pointer border-0"
              style={{ backgroundColor: "var(--accent-red, #EE3A43)" }}
            >
              Add Address
            </button>
          </div>
        ) : (
          /* Saved Addresses List */
          <div className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col pb-24">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Saved Addresses ({savedAddresses.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressType("Home");
                  setFlatNumber("");
                  setAddressName("");
                  setIsForSomeoneElse(false);
                  setRecipientName("");
                  setRecipientPhone("");
                  setStatus("add_address");
                }}
                className="text-xs font-bold text-[#E53935] flex items-center gap-1 active:opacity-75 cursor-pointer bg-transparent border-0"
              >
                <Plus className="w-4 h-4" /> Add Address
              </button>
            </div>

            <div className="space-y-3">
              {savedAddresses.map((addr) => {
                const addrId = addr._id || addr.id;
                return (
                  <div
                    key={addrId}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 text-[var(--accent-red,#EE3A43)] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[15px] text-zinc-900 dark:text-white capitalize m-0">
                          {addr.label || "Address"}
                        </h3>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-[#E53935] dark:bg-red-950 dark:text-red-300">
                            Default
                          </span>
                        )}
                      </div>
                      {addr.additionalDetails && (
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-1 line-clamp-1 m-0">
                          {addr.additionalDetails}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed m-0">
                        {addr.street || [addr.city, addr.state].filter(Boolean).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditAddress(addr)}
                        className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer bg-transparent border-0"
                        aria-label="Edit address"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteAddress(addrId, e)}
                        className="p-2 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer bg-transparent border-0"
                        aria-label="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressType("Home");
                  setFlatNumber("");
                  setAddressName("");
                  setIsForSomeoneElse(false);
                  setRecipientName("");
                  setRecipientPhone("");
                  setStatus("add_address");
                }}
                className="w-full h-12 bg-[#E53935] hover:bg-[#d92d36] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 active:scale-[0.98] transition-all cursor-pointer border-0"
                style={{ backgroundColor: "var(--accent-red, #EE3A43)" }}
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "add_address") {
    const handleMapDragEnd = async () => {
      if (mapRef.current) {
        const newCenter = mapRef.current.getCenter();
        const lat = newCenter.lat();
        const lng = newCenter.lng();
        setMapCenter({ lat, lng });
        
        try {
          const geocoder = new window.google.maps.Geocoder();
          const res = await geocoder.geocode({ location: { lat, lng } });
          if (res.results && res.results[0]) {
            setDetailedAddress(res.results[0].formatted_address);
          }
        } catch (err) {
          console.error("Geocoding map center failed", err);
        }
      }
    };

    return (
      <div className="min-h-[100dvh] bg-zinc-50 flex flex-col relative">
        {/* Map Section */}
        <div className="relative h-[38vh] w-full bg-[#e8eaed] overflow-hidden">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={16}
              options={{ disableDefaultUI: true, zoomControl: false }}
              onLoad={map => { mapRef.current = map; }}
              onDragEnd={handleMapDragEnd}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-medium">Loading Map...</div>
          )}
          
          <button 
            type="button"
            onClick={() => {
              if (locationState.mode === "my_addresses") {
                setStatus("my_addresses");
              } else {
                setStatus("manual");
              }
            }} 
            className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md z-10 active:scale-90 cursor-pointer border-0"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-800" />
          </button>
          
          {/* Center Pin & Tooltip */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
            <div className="bg-[#1e2022] text-white text-[11px] px-4 py-2.5 rounded-lg shadow-xl text-center whitespace-nowrap mb-1 relative pointer-events-auto">
              <span className="font-bold">Order wil be delivered here</span><br/>
              <span className="text-zinc-300 font-medium mt-0.5 inline-block">Place the pin accurately on the map</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e2022] rotate-45"></div>
            </div>
            <MapPin className="w-9 h-9 text-zinc-800 mt-2 drop-shadow-md" fill="currentColor" />
          </div>
          
          <button className="absolute bottom-6 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md active:scale-90 z-10">
            <Navigation className="w-5 h-5 text-zinc-800" />
          </button>
        </div>

        {/* Form Section */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 z-10 p-5 flex flex-col shadow-[0_-4px_15px_rgba(0,0,0,0.05)] overflow-y-auto">
          {/* Aligned Location Header */}
          <div className="mb-5 pt-1">
            <p className="text-[11px] text-zinc-500 mb-1.5 font-medium">Your Location</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MapPin className="w-5 h-5 text-[#E53935] shrink-0" fill="currentColor" />
                <h3 className="text-[17px] font-bold text-[#1a202c] truncate m-0">
                  {addressType || "Home"}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setStatus("manual")}
                className="text-[#0288D1] font-bold text-[13px] tracking-wide active:opacity-70 bg-transparent border-0 cursor-pointer shrink-0"
              >
                Change
              </button>
            </div>
            <p className="text-[13px] text-zinc-500 mt-1 pl-[30px] leading-tight line-clamp-1 m-0">
              {detailedAddress || "Regal Circle, South Tukoganj"}
            </p>
          </div>

          <div className="space-y-4 flex-1">
            <input 
              type="text" 
              placeholder="Building / House / Flat / Floor No*" 
              value={flatNumber}
              onChange={e => setFlatNumber(e.target.value)}
              className="w-full h-14 px-4 border border-zinc-300 rounded-xl focus:border-zinc-500 outline-none placeholder:text-zinc-400 font-medium"
            />
            
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-zinc-500">Address</label>
              <textarea 
                rows="2"
                value={detailedAddress}
                onChange={e => setDetailedAddress(e.target.value)}
                placeholder="Block, 3rd floor, Corporate House..."
                className="w-full p-4 pt-3 border border-zinc-300 rounded-xl focus:border-zinc-500 outline-none text-[14px] text-zinc-800 font-medium resize-none"
              />
            </div>

            <div>
              <p className="text-[12px] text-zinc-500 mb-2 font-medium">Save this address as</p>
              <div className="flex gap-2 flex-wrap">
                {["Home", "Office"].map(type => (
                  <button 
                    key={type}
                    type="button"
                    onClick={() => {
                      setAddressType(type);
                    }}
                    className={`px-4 h-[38px] rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${addressType === type ? "border-[#0288D1] text-[#0288D1] bg-[#0288D1]/5 font-bold" : "border-zinc-200 text-zinc-700 bg-white"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div 
              className="flex items-center gap-3 pt-1 cursor-pointer select-none" 
              onClick={() => setIsForSomeoneElse(!isForSomeoneElse)}
            >
              <div 
                className={`w-11 h-6 rounded-full flex items-center px-[2px] transition-colors duration-300 ${isForSomeoneElse ? 'bg-[#4CAF50]' : 'bg-zinc-400'}`}
              >
                <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isForSomeoneElse ? 'translate-x-[20px]' : 'translate-x-0'}`} />
              </div>
              <span className="text-[14px] font-medium text-zinc-700">Ordering for someone else</span>
            </div>

            <AnimatePresence>
              {isForSomeoneElse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden pt-1"
                >
                  <input 
                    type="text" 
                    placeholder="Recipient Name*" 
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full h-14 px-4 border border-zinc-300 rounded-xl focus:border-zinc-500 outline-none placeholder:text-zinc-400 font-medium text-[14px]"
                  />
                  <input 
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="Recipient Number*" 
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value.replace(/[^0-9+\s-]/g, ''))}
                    className="w-full h-14 px-4 border border-zinc-300 rounded-xl focus:border-zinc-500 outline-none placeholder:text-zinc-400 font-medium text-[14px]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="button"
            onClick={handleManualSearchSelect}
            className="w-full h-[52px] bg-[#E53935] hover:bg-red-700 text-white font-bold text-[15px] uppercase tracking-wide rounded-xl mt-6 shadow-lg shadow-red-500/30 active:scale-[0.98] transition-transform cursor-pointer border-0"
            style={{ backgroundColor: "var(--accent-red, #EE3A43)" }}
          >
            Save Address
          </button>
        </div>
      </div>
    );
  }

  // Manual Search & Map Pin state
  return (
    <div className="min-h-[100dvh] bg-zinc-50 flex flex-col">
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setStatus("prompt")} className="p-2 -ml-2 rounded-full hover:bg-zinc-100">
            <X className="w-6 h-6 text-zinc-700" />
          </button>
          <h1 className="text-lg font-bold">Search Location</h1>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search for area, street name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-zinc-100 border-transparent focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {suggestions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden mb-6">
            {suggestions.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => handleSuggestionSelect(s)}
                className="w-full text-left p-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 flex items-start gap-3"
              >
                <MapPin className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-zinc-800">{s.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button 
              onClick={() => fetchCurrentLocation(false)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-zinc-100 mb-6"
            >
          <Navigation className="w-5 h-5 text-red-600" />
          <div className="text-left flex-1">
            <h3 className="font-bold text-red-600">Use Current Location</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Using GPS</p>
          </div>
        </button>

        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3 px-1">Saved Addresses</h3>
        <div className="space-y-3 mb-8">
          {savedAddresses.map((addr) => (
            <div key={addr._id} onClick={() => handleSavedAddressSelect(addr)} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-zinc-100 active:scale-95 transition-transform cursor-pointer group">
              <div className="mt-1">
                {addr.label === "Home" ? <MapPin className="w-5 h-5 text-[#E53935]" fill="currentColor" /> : <MapPin className="w-5 h-5 text-zinc-400" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-900">{addr.label}</h4>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{addr.street}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }} className="p-2 text-zinc-400 hover:text-blue-500 bg-zinc-50 rounded-full transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleDeleteAddress(addr._id, e)} className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-50 rounded-full transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => { setEditingAddressId(null); setStatus("add_address"); }} className="flex items-center gap-2 text-sm font-bold text-red-600 px-2 py-3 active:opacity-70">
            <Plus className="w-4 h-4" /> Add New Address
          </button>
        </div>
          </>
        )}
      </div>

      {/* Mock Map Bottom Sheet for pin dragging could go here, for now confirm button */}
      {searchQuery && suggestions.length === 0 && (
        <div className="p-4 bg-white border-t border-zinc-100 mt-auto">
          <button onClick={handleManualSearchSelect} className="w-full h-14 bg-red-600 text-white font-bold rounded-xl shadow-lg">
            Confirm Location
          </button>
        </div>
      )}
    </div>
  );
}
