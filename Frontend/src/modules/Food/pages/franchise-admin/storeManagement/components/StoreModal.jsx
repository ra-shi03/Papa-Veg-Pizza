import React, { useState, useEffect } from "react"
import { Building2, MapPin, Settings, User, X, Check, ArrowRight, ArrowLeft } from "lucide-react"
import { adminAPI } from "@food/api"

export default function StoreModal({ isOpen, onClose, onConfirm, store = null }) {
  const isEdit = !!store
  const [step, setStep] = useState(1)
  const [managers, setManagers] = useState([])
  const [loadingManagers, setLoadingManagers] = useState(false)

  // Form State
  const [storeName, setStoreName] = useState("")
  const [storeCode, setStoreCode] = useState("")
  const [storeType, setStoreType] = useState("Regular")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  // Address State
  const [addressLine1, setAddressLine1] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")
  const [latitude, setLatitude] = useState(22.7196)
  const [longitude, setLongitude] = useState(75.8763)

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

      if (store) {
        setStoreName(store.storeName || "")
        setStoreCode(store.storeCode || "")
        setStoreType(store.storeType || "Regular")
        setPhone(store.phone || "")
        setEmail(store.email || "")

        setAddressLine1(store.address?.line1 || "")
        setCity(store.address?.city || "")
        setState(store.address?.state || "")
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
        setStoreType("Regular")
        setPhone("")
        setEmail("")

        setAddressLine1("")
        setCity("")
        setState("")
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

  // Interactive Mock Map Click Handler
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Simulate latitude & longitude calculations based on Indore area bounds
    const simulatedLat = (22.8 - (y / rect.height) * 0.15).toFixed(4)
    const simulatedLng = (75.8 + (x / rect.width) * 0.15).toFixed(4)
    
    setLatitude(parseFloat(simulatedLat))
    setLongitude(parseFloat(simulatedLng))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!storeName || !storeCode || !phone || !email) {
        alert("Please fill in all required basic fields.")
        return
      }
    } else if (step === 2) {
      if (!addressLine1 || !city || !state || !pincode) {
        alert("Please fill in all address details.")
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
      phone,
      email,
      address: {
        line1: addressLine1,
        city,
        state,
        pincode,
        coordinates: [longitude, latitude]
      },
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
                      <option value="Regular">Regular</option>
                      <option value="Express">Express</option>
                      <option value="Cloud Kitchen">Cloud Kitchen</option>
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
              </div>
            )}

            {/* STEP 2: Address & Google Map Picker */}
            {step === 2 && (
              <div className="grid grid-cols-12 gap-5">
                {/* Form Fields */}
                <div className="col-span-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Address Line 1 *
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
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Indore"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Madhya Pradesh"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
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

                {/* Mock Interactive Map Picker */}
                <div className="col-span-7 flex flex-col">
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Click Map to Place Pin
                  </span>
                  <div
                    onClick={handleMapClick}
                    className="relative flex-1 min-h-[220px] rounded-2xl border border-slate-250 dark:border-slate-800 bg-slate-900 overflow-hidden cursor-crosshair group select-none shadow-inner"
                  >
                    {/* SVG Mock Map Layout */}
                    <svg className="w-full h-full opacity-30 stroke-slate-700 fill-none" viewBox="0 0 100 100">
                      <path d="M 0 10 Q 30 15 50 30 T 100 20" strokeWidth="0.8" />
                      <path d="M 10 0 Q 30 40 40 70 T 80 100" strokeWidth="0.8" />
                      <path d="M 0 50 Q 50 60 70 50 T 100 80" strokeWidth="0.8" />
                      <circle cx="50" cy="50" r="10" strokeWidth="0.4" strokeDasharray="2,2" />
                      <circle cx="50" cy="50" r="25" strokeWidth="0.4" strokeDasharray="2,2" />
                    </svg>

                    {/* Central Grid Map Labels */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 text-[10px] font-bold text-slate-600 dark:text-slate-500 pointer-events-none">
                      <div className="flex justify-between">
                        <span>Indore Central Grid</span>
                        <span>Palasia Area</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vijay Nagar Sector</span>
                        <span>Rajwada Block</span>
                      </div>
                    </div>

                    {/* Draggable Red Marker */}
                    <div
                      className="absolute w-8 h-8 pointer-events-none transition-all duration-300 ease-out"
                      style={{
                        left: `${((longitude - 75.8) / 0.15) * 100}%`,
                        top: `${((22.8 - latitude) / 0.15) * 100}%`,
                        transform: "translate(-50%, -100%)"
                      }}
                    >
                      <MapPin className="w-8 h-8 text-primary fill-red-500/30 filter drop-shadow animate-bounce" />
                      <div className="w-2.5 h-1 bg-black/40 rounded-full mx-auto -mt-0.5 filter blur-xs" />
                    </div>
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

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Max Orders Per Hour
                      </label>
                      <span className="text-xs font-bold text-primary">{maxOrdersHour} orders</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      step={5}
                      value={maxOrdersHour}
                      onChange={(e) => setMaxOrdersHour(parseInt(e.target.value))}
                      className="w-full accent-primary bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Max Kitchen Capacity
                      </label>
                      <span className="text-xs font-bold text-primary">{maxKitchenCapacity}% capacity</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={10}
                      value={maxKitchenCapacity}
                      onChange={(e) => setMaxKitchenCapacity(parseInt(e.target.value))}
                      className="w-full accent-primary bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
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
