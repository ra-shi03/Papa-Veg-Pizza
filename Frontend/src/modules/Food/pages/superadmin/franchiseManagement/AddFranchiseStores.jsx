import React, { useState, useEffect } from "react";
import { X, Check, MapPin, Upload, ArrowRight, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

export default function AddFranchiseStores({ isOpen, onClose, store, onSave }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const isEditMode = !!store;

  // Form states
  const [storeName, setStoreName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [franchise, setFranchise] = useState("");
  const [storeManager, setStoreManager] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [zone, setZone] = useState("");
  const [territory, setTerritory] = useState("");
  const [latitude, setLatitude] = useState("22.7196");
  const [longitude, setLongitude] = useState("75.8577");
  const [openingTime, setOpeningTime] = useState("10:00");
  const [closingTime, setClosingTime] = useState("23:00");
  const [contactNumber, setContactNumber] = useState("");
  const [status, setStatus] = useState("Active");

  // On store change (for editing)
  useEffect(() => {
    if (store) {
      setStoreName(store.name || "");
      setStoreCode(store.id || "");
      setFranchise(store.franchise || "Papa Veg Pizza India");
      setStoreManager(store.owner || "");
      setAddress(store.location || "");
      setCountry("India");
      setState(store.state || "Madhya Pradesh");
      setCity(store.city || "Indore");
      setRegion(store.region || "West India");
      setZone(store.zone || "Zone B");
      setTerritory(store.territory || "Bholaram Ustad Marg");
      setLatitude(store.latitude || "22.7196");
      setLongitude(store.longitude || "75.8577");
      setOpeningTime(store.openingTime || "11:00");
      setClosingTime(store.closingTime || "23:00");
      setContactNumber(store.phone?.replace("+91 ", "") || "");
      setStatus(store.status || "Active");
    } else {
      // Reset to defaults
      setStoreName("");
      setStoreCode("");
      setFranchise("");
      setStoreManager("");
      setAddress("");
      setState("");
      setCity("");
      setRegion("");
      setZone("");
      setTerritory("");
      setLatitude("22.7196");
      setLongitude("75.8577");
      setOpeningTime("10:00");
      setClosingTime("23:00");
      setContactNumber("");
      setStatus("Active");
    }
    setCurrentStep(1);
  }, [store, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    // Basic step validations
    if (currentStep === 1) {
      if (!storeName || !storeCode || !franchise || !storeManager) {
        toast.error("Please fill in all required fields *");
        return;
      }
    }
    if (currentStep === 2) {
      if (!address || !state || !city || !region || !zone || !territory) {
        toast.error("Please fill in all address parameters *");
        return;
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!contactNumber) {
      toast.error("Contact number is required *");
      return;
    }
    
    // Simulate MongoDB Point storage schema
    const newStoreObj = {
      id: storeCode,
      name: storeName,
      franchise,
      owner: storeManager,
      location: address,
      state,
      city,
      region,
      zone,
      territory,
      phone: `+91 ${contactNumber}`,
      status,
      revenue: store?.revenue || "₹ 0",
      liveOrders: store?.liveOrders || 0,
      liveOrdersStatus: store?.liveOrdersStatus || "N/A",
      openingTime,
      closingTime,
      latitude,
      longitude,
      locationGeo: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    };

    if (onSave) {
      onSave(newStoreObj);
    }
    toast.success(isEditMode ? "Store updated successfully" : "New store registered successfully");
    onClose();
  };

  const handleMapPickerClick = () => {
    // Mock location updates
    const randomLat = (22.7 + Math.random() * 0.1).toFixed(4);
    const randomLng = (75.8 + Math.random() * 0.1).toFixed(4);
    setLatitude(randomLat);
    setLongitude(randomLng);
    toast.info(`Pin dropped at Madhya Pradesh: ${randomLat}° N, ${randomLng}° E`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 lg:pl-[280px]">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[85vh] md:h-[580px] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-55 dark:bg-zinc-950 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {isEditMode ? "Edit Franchise Store" : "Register Franchise Store"}
            </h3>
            <p className="text-zinc-500 text-[10px] font-semibold mt-0.5">
              {isEditMode ? "Update details for an existing location in India." : "Onboard a new location to the Papa Veg network."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between overflow-x-auto scrollbar-none shrink-0">
          {[
            { step: 1, label: "Basic Details" },
            { step: 2, label: "Address & Zone" },
            { step: 3, label: "Coordinates" },
            { step: 4, label: "Operating Info" }
          ].map((s, idx) => (
            <div key={s.step} className={`flex items-center gap-2 ${idx < 3 ? 'flex-1' : ''} relative min-w-max pr-3`}>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] transition-all duration-300
                  ${currentStep > s.step ? 'bg-red-650 border-red-650 text-white' :
                    currentStep === s.step ? 'text-red-650 border-red-650' :
                      'text-zinc-400 border-zinc-300 dark:border-zinc-700'}`
                }
              >
                {currentStep > s.step ? <Check size={12} strokeWidth={3} /> : s.step}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${currentStep >= s.step ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
                {s.label}
              </span>
              {idx < 3 && (
                <div className="h-[1px] w-4 md:flex-1 bg-zinc-200 dark:bg-zinc-850 mx-2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Wizard Steps Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-zinc-900">
          
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <section className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Store Name *</label>
                  <input 
                    value={storeName} 
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg focus:ring-1 focus:ring-red-500/20 focus:border-red-650 outline-none text-black dark:text-white" 
                    placeholder="e.g. Papa Veg Pizza Indore" 
                    type="text" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Store Unique Code *</label>
                  <input 
                    value={storeCode} 
                    onChange={(e) => !isEditMode && setStoreCode(e.target.value)}
                    disabled={isEditMode}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg focus:ring-1 focus:ring-red-500/20 focus:border-red-650 outline-none font-mono text-black dark:text-white disabled:opacity-60" 
                    placeholder="PV-IND-001" 
                    type="text" 
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-semibold">Franchise Enterprise *</label>
                  <select 
                    value={franchise}
                    onChange={(e) => setFranchise(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg focus:ring-1 focus:ring-red-500/20 focus:border-red-650 outline-none text-black dark:text-white cursor-pointer"
                  >
                    <option value="">Select Franchise...</option>
                    <option value="Papa Veg Pizza North India">Papa Veg Pizza North India</option>
                    <option value="Papa Veg Pizza MP & Central">Papa Veg Pizza MP &amp; Central</option>
                    <option value="Papa Veg Pizza Western Hub">Papa Veg Pizza Western Hub</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-semibold">Store Manager *</label>
                  <select 
                    value={storeManager}
                    onChange={(e) => setStoreManager(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg focus:ring-1 focus:ring-red-500/20 focus:border-red-650 outline-none text-black dark:text-white cursor-pointer"
                  >
                    <option value="">Select Store Manager...</option>
                    <option value="Rahul Sharma">Rahul Sharma</option>
                    <option value="Priya Mehra">Priya Mehra</option>
                    <option value="Vikram Singh">Vikram Singh</option>
                    <option value="Aniket Deshpande">Aniket Deshpande</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <section className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Physical Street Address *</label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg focus:ring-1 focus:ring-red-500/20 focus:border-red-650 outline-none text-black dark:text-white resize-none" 
                  placeholder="Bholaram Ustad Marg Indore, MP" 
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Country</label>
                  <input 
                    value={country} 
                    disabled 
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">State *</label>
                  <select 
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setCity("");
                    }}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-black dark:text-white outline-none"
                  >
                    <option value="">Select State...</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">City *</label>
                  <select 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-black dark:text-white outline-none"
                  >
                    <option value="">Select City...</option>
                    {state === "Madhya Pradesh" && <option value="Indore">Indore</option>}
                    {state === "Madhya Pradesh" && <option value="Bhopal">Bhopal</option>}
                    {state === "Maharashtra" && <option value="Mumbai">Mumbai</option>}
                    {state === "Maharashtra" && <option value="Pune">Pune</option>}
                    {state === "Delhi" && <option value="New Delhi">New Delhi</option>}
                    {state === "Karnataka" && <option value="Bengaluru">Bengaluru</option>}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Region *</label>
                  <select 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-black dark:text-white outline-none"
                  >
                    <option value="">Select Region...</option>
                    <option value="North India">North India</option>
                    <option value="West India">West India</option>
                    <option value="South India">South India</option>
                    <option value="East India">East India</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Zone *</label>
                  <select 
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-black dark:text-white outline-none"
                  >
                    <option value="">Select Zone...</option>
                    <option value="Zone A">Zone A</option>
                    <option value="Zone B">Zone B</option>
                    <option value="Zone C">Zone C</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Territory *</label>
                  <select 
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-black dark:text-white outline-none"
                  >
                    <option value="">Select Territory...</option>
                    <option value="Bholaram Ustad Marg">Bholaram Ustad Marg</option>
                    <option value="Connaught Place">Connaught Place</option>
                    <option value="Bandra West">Bandra West</option>
                    <option value="Indiranagar">Indiranagar</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Coordinates */}
          {currentStep === 3 && (
            <section className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="md:col-span-2 space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Latitude *</label>
                    <input 
                      value={latitude} 
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg outline-none text-black dark:text-white" 
                      placeholder="e.g., 22.7196" 
                      type="text" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Longitude *</label>
                    <input 
                      value={longitude} 
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full h-8.5 px-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg outline-none text-black dark:text-white" 
                      placeholder="e.g., 75.8577" 
                      type="text" 
                    />
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] text-zinc-500">
                    <p className="font-bold uppercase mb-1">MongoDB Location Format</p>
                    <pre className="font-mono text-[9px] dark:text-zinc-300">
{`{
  "location": {
    "type": "Point",
    "coordinates": [${longitude}, ${latitude}]
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="md:col-span-1 flex flex-col justify-end">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Map Picker</label>
                  <div 
                    onClick={handleMapPickerClick}
                    className="w-full h-44 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center cursor-pointer hover:border-red-650 transition-all group"
                  >
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                      alt="Map view"
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&fm=webp"
                    />
                    <div className="z-10 bg-white/95 dark:bg-zinc-900/95 p-2 rounded shadow-lg border border-zinc-250 dark:border-zinc-750 flex flex-col items-center">
                      <MapPin className="text-red-650 animate-bounce" size={16} fill="currentColor" />
                      <span className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200 uppercase mt-1">Pin Drop</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 4: Business Details */}
          {currentStep === 4 && (
            <section className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Business Operating Hours</label>
                  <div className="flex items-center gap-2">
                    <input 
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="flex-1 h-8.5 px-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-black dark:text-white outline-none text-xs" 
                      type="time" 
                    />
                    <span className="text-zinc-500 text-xs">to</span>
                    <input 
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="flex-1 h-8.5 px-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-black dark:text-white outline-none text-xs" 
                      type="time" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contact Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">+91</span>
                    <input 
                      value={contactNumber} 
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full h-8.5 pl-10 pr-3 text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg focus:ring-1 focus:ring-red-500/20 focus:border-red-650 outline-none text-black dark:text-white" 
                      placeholder="9876543210" 
                      type="tel" 
                    />
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Onboarding Status</label>
                  <div className="flex gap-4 p-2 bg-zinc-55 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    {["Active", "Closed", "Suspended"].map((s) => (
                      <label key={s} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="statusRadio"
                          value={s}
                          checked={status === s}
                          onChange={() => setStatus(s)}
                          className="text-red-650 focus:ring-red-650"
                        />
                        <span className={`text-[10px] font-bold uppercase ${
                          s === "Active" ? "text-emerald-600 dark:text-emerald-400" :
                          s === "Closed" ? "text-amber-600 dark:text-amber-400" :
                          "text-rose-600 dark:text-rose-455"
                        }`}>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button
              className={`px-4 h-8.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-all ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              disabled={currentStep === 1}
              onClick={handlePrev}
            >
              Previous
            </button>
            <button
              className="px-4 h-8.5 rounded-lg text-zinc-500 font-bold text-xs hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
              onClick={() => {
                toast.success("Draft saved successfully");
                onClose();
              }}
            >
              Save Draft
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 h-8.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            {currentStep < totalSteps ? (
              <button
                className="px-5 h-8.5 bg-zinc-850 dark:bg-zinc-750 text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                onClick={handleNext}
              >
                <span>Next</span>
                <ArrowRight size={12} />
              </button>
            ) : (
              <button
                className="px-5 h-8.5 bg-red-650 text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                onClick={handleSubmit}
              >
                <span>{isEditMode ? "Save Changes" : "Create Store"}</span>
                <BadgeCheck size={12} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
