import React, { useState, useEffect, useRef, useCallback } from "react"
import { Search, MapPin, Loader2, X, Check, Navigation } from "lucide-react"
import { Loader } from "@googlemaps/js-api-loader"

// Indian States and Union Territories list for instant search & offline fallback
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
]

// Major Indian cities with their mapped state for instant search & offline fallback
const INDIAN_CITIES = [
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Jabalpur", state: "Madhya Pradesh" },
  { city: "Gwalior", state: "Madhya Pradesh" },
  { city: "Ujjain", state: "Madhya Pradesh" },
  { city: "Sagar", state: "Madhya Pradesh" },
  { city: "Dewas", state: "Madhya Pradesh" },
  { city: "Satna", state: "Madhya Pradesh" },
  { city: "Ratlam", state: "Madhya Pradesh" },
  { city: "Rewa", state: "Madhya Pradesh" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Thane", state: "Maharashtra" },
  { city: "Nashik", state: "Maharashtra" },
  { city: "Aurangabad", state: "Maharashtra" },
  { city: "Solapur", state: "Maharashtra" },
  { city: "Kolhapur", state: "Maharashtra" },
  { city: "Navi Mumbai", state: "Maharashtra" },
  { city: "Delhi", state: "Delhi" },
  { city: "New Delhi", state: "Delhi" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Mysuru", state: "Karnataka" },
  { city: "Hubballi", state: "Karnataka" },
  { city: "Mangaluru", state: "Karnataka" },
  { city: "Belagavi", state: "Karnataka" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Warangal", state: "Telangana" },
  { city: "Nizamabad", state: "Telangana" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Coimbatore", state: "Tamil Nadu" },
  { city: "Madurai", state: "Tamil Nadu" },
  { city: "Tiruchirappalli", state: "Tamil Nadu" },
  { city: "Salem", state: "Tamil Nadu" },
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Surat", state: "Gujarat" },
  { city: "Vadodara", state: "Gujarat" },
  { city: "Rajkot", state: "Gujarat" },
  { city: "Bhavnagar", state: "Gujarat" },
  { city: "Jamnagar", state: "Gujarat" },
  { city: "Gandhinagar", state: "Gujarat" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Jodhpur", state: "Rajasthan" },
  { city: "Kota", state: "Rajasthan" },
  { city: "Bikaner", state: "Rajasthan" },
  { city: "Ajmer", state: "Rajasthan" },
  { city: "Udaipur", state: "Rajasthan" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Howrah", state: "West Bengal" },
  { city: "Durgapur", state: "West Bengal" },
  { city: "Asansol", state: "West Bengal" },
  { city: "Siliguri", state: "West Bengal" },
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Kanpur", state: "Uttar Pradesh" },
  { city: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Agra", state: "Uttar Pradesh" },
  { city: "Meerut", state: "Uttar Pradesh" },
  { city: "Varanasi", state: "Uttar Pradesh" },
  { city: "Prayagraj", state: "Uttar Pradesh" },
  { city: "Bareilly", state: "Uttar Pradesh" },
  { city: "Aligarh", state: "Uttar Pradesh" },
  { city: "Moradabad", state: "Uttar Pradesh" },
  { city: "Noida", state: "Uttar Pradesh" },
  { city: "Gorakhpur", state: "Uttar Pradesh" },
  { city: "Patna", state: "Bihar" },
  { city: "Gaya", state: "Bihar" },
  { city: "Bhagalpur", state: "Bihar" },
  { city: "Muzaffarpur", state: "Bihar" },
  { city: "Chandigarh", state: "Chandigarh" },
  { city: "Ludhiana", state: "Punjab" },
  { city: "Amritsar", state: "Punjab" },
  { city: "Jalandhar", state: "Punjab" },
  { city: "Patiala", state: "Punjab" },
  { city: "Gurugram", state: "Haryana" },
  { city: "Faridabad", state: "Haryana" },
  { city: "Panipat", state: "Haryana" },
  { city: "Karnal", state: "Haryana" },
  { city: "Ranchi", state: "Jharkhand" },
  { city: "Jamshedpur", state: "Jharkhand" },
  { city: "Dhanbad", state: "Jharkhand" },
  { city: "Raipur", state: "Chhattisgarh" },
  { city: "Bhilai", state: "Chhattisgarh" },
  { city: "Bilaspur", state: "Chhattisgarh" },
  { city: "Bhubaneswar", state: "Odisha" },
  { city: "Cuttack", state: "Odisha" },
  { city: "Rourkela", state: "Odisha" },
  { city: "Guwahati", state: "Assam" },
  { city: "Silchar", state: "Assam" },
  { city: "Kochi", state: "Kerala" },
  { city: "Thiruvananthapuram", state: "Kerala" },
  { city: "Kozhikode", state: "Kerala" },
  { city: "Thrissur", state: "Kerala" },
  { city: "Dehradun", state: "Uttarakhand" },
  { city: "Haridwar", state: "Uttarakhand" },
  { city: "Panaji", state: "Goa" },
  { city: "Margao", state: "Goa" },
  { city: "Srinagar", state: "Jammu and Kashmir" },
  { city: "Jammu", state: "Jammu and Kashmir" },
  { city: "Shimla", state: "Himachal Pradesh" },
  { city: "Dharamshala", state: "Himachal Pradesh" }
]

// Singleton promise for Google Maps JS API script loading
let googleMapsLoaderPromise = null

function loadGoogleMapsAPI() {
  if (typeof window !== "undefined" && window.google?.maps?.places) {
    return Promise.resolve(window.google)
  }
  if (!googleMapsLoaderPromise) {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
    const loader = new Loader({
      apiKey: key,
      version: "weekly",
      libraries: ["places"]
    })
    googleMapsLoaderPromise = loader.load().catch((err) => {
      console.warn("[GooglePlacesLocationInput] Google Maps loader failed, will use local dataset fallback:", err?.message)
      googleMapsLoaderPromise = null
      return null
    })
  }
  return googleMapsLoaderPromise
}

export default function GooglePlacesLocationInput({
  label,
  name,
  value = "",
  onChange,
  onSelectPlace,
  placeholder,
  error,
  required = false,
  searchType = "(cities)", // '(cities)' or 'administrative_area_level_1'
  align = "left" // 'left' or 'right' dropdown alignment
}) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasGoogleMaps, setHasGoogleMaps] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const autocompleteServiceRef = useRef(null)
  const geocoderRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Initialize Google Maps Places Autocomplete Service
  useEffect(() => {
    let isMounted = true
    loadGoogleMapsAPI().then((google) => {
      if (!isMounted || !google?.maps?.places) return
      try {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
        geocoderRef.current = new google.maps.Geocoder()
        setHasGoogleMaps(true)
      } catch (err) {
        console.warn("[GooglePlacesLocationInput] Service initialization error:", err)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [])

  // Fallback local search when Google Maps API is unavailable or returns 0 results
  const searchLocalFallback = useCallback(
    (query) => {
      const q = query.trim().toLowerCase()
      if (searchType === "(cities)") {
        const matches = INDIAN_CITIES.filter(
          (item) => item.city.toLowerCase().includes(q) || item.state.toLowerCase().includes(q)
        ).slice(0, 8)

        return matches.map((item) => ({
          id: `local-${item.city}-${item.state}`,
          name: item.city,
          secondary: `${item.state}, India`,
          state: item.state,
          source: "database"
        }))
      } else {
        const matches = INDIAN_STATES.filter((state) => state.toLowerCase().includes(q)).slice(0, 8)

        return matches.map((state) => ({
          id: `local-state-${state}`,
          name: state,
          secondary: "State / Union Territory, India",
          state,
          source: "database"
        }))
      }
    },
    [searchType]
  )

  // Query suggestions from Google Maps API or fallback
  const fetchSuggestions = useCallback(
    (query) => {
      if (!query || query.trim().length === 0) {
        // Show top suggestions when empty on focus
        const defaultSuggestions = searchLocalFallback("")
        setSuggestions(defaultSuggestions)
        setIsOpen(defaultSuggestions.length > 0)
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      if (autocompleteServiceRef.current && window.google?.maps?.places?.PlacesServiceStatus) {
        const request = {
          input: query,
          types: searchType === "(cities)" ? ["(cities)"] : ["administrative_area_level_1"],
          componentRestrictions: { country: "in" }
        }

        autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
          setIsSearching(false)
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions &&
            predictions.length > 0
          ) {
            const items = predictions.map((p) => {
              const mainText =
                p.structured_formatting?.main_text || p.terms?.[0]?.value || p.description
              const secondaryText = p.structured_formatting?.secondary_text || ""

              // Attempt to extract state from secondary text (e.g., "Madhya Pradesh, India")
              let extractedState = ""
              if (secondaryText) {
                const parts = secondaryText.split(",").map((s) => s.trim())
                if (parts.length > 0 && parts[0] !== "India") {
                  extractedState = parts[0]
                }
              }

              return {
                id: p.place_id,
                name: mainText,
                secondary: secondaryText,
                full: p.description,
                state: extractedState,
                placeId: p.place_id,
                source: "google"
              }
            })
            setSuggestions(items)
            setIsOpen(true)
            setHighlightedIndex(-1)
          } else {
            // Fallback to local dataset
            const fallbackResults = searchLocalFallback(query)
            setSuggestions(fallbackResults)
            setIsOpen(fallbackResults.length > 0)
            setHighlightedIndex(-1)
          }
        })
      } else {
        // No Google Maps service: use local fallback immediately
        const fallbackResults = searchLocalFallback(query)
        setSuggestions(fallbackResults)
        setIsOpen(fallbackResults.length > 0)
        setIsSearching(false)
        setHighlightedIndex(-1)
      }
    },
    [searchType, searchLocalFallback]
  )

  // Debounced search trigger on text change
  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e)
    }
    const text = e.target.value

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(text)
    }, 220)
  }

  // Handle focus: show suggestions
  const handleFocus = () => {
    fetchSuggestions(value)
  }

  // Clear input
  const handleClear = (e) => {
    e.stopPropagation()
    if (onChange) {
      onChange({ target: { name, value: "" } })
    }
    setSuggestions([])
    setIsOpen(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Handle suggestion selection
  const handleSelect = (item) => {
    let resolvedState = item.state || ""

    // Asynchronously refine state using Geocoder if available for Google Places
    if (item.placeId && geocoderRef.current && searchType === "(cities)") {
      try {
        geocoderRef.current.geocode({ placeId: item.placeId }, (results, status) => {
          if (status === "OK" && results?.[0]?.address_components) {
            const stateComp = results[0].address_components.find((c) =>
              c.types.includes("administrative_area_level_1")
            )
            if (stateComp?.long_name) {
              resolvedState = stateComp.long_name
              if (onSelectPlace) {
                onSelectPlace({
                  name: item.name,
                  city: item.name,
                  state: resolvedState,
                  raw: item
                })
              }
            }
          }
        })
      } catch (err) {
        console.warn("[GooglePlacesLocationInput] Geocode error:", err)
      }
    }

    if (onChange) {
      onChange({ target: { name, value: item.name } })
    }

    if (onSelectPlace) {
      onSelectPlace({
        name: item.name,
        city: item.name,
        state: resolvedState,
        raw: item
      })
    }

    setIsOpen(false)
    setSuggestions([])
    setHighlightedIndex(-1)
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault()
        handleSelect(suggestions[highlightedIndex])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input container with Search option */}
      <div className="relative flex items-center">
        {/* Left search icon indicator */}
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none transition-colors" />

        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          placeholder={placeholder || `Search ${label}`}
          className={`w-full pl-10 pr-9 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all ${
            error
              ? "border-red-500 bg-red-50/20 text-gray-900"
              : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
          }`}
        />

        {/* Right side: Loading spinner or Clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {/* Suggestion Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div
          className={`absolute z-50 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden min-w-[280px] sm:min-w-full max-w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-top-1 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Header pill */}
          <div className="px-3 py-1.5 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasGoogleMaps ? "bg-emerald-500" : "bg-blue-400"}`} />
              {hasGoogleMaps ? "Google Maps Suggestions" : "Popular Suggestions"}
            </span>
            <span className="text-[9px] text-gray-400 font-normal">Click to select</span>
          </div>

          {/* List items */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
            {suggestions.map((item, index) => {
              const isSelected = highlightedIndex === index
              return (
                <div
                  key={item.id || index}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2.5 cursor-pointer flex items-center gap-2.5 transition-colors ${
                    isSelected ? "bg-green-50 text-green-900" : "hover:bg-gray-50 text-gray-800"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-gray-900">
                      {item.name}
                    </p>
                    {item.secondary && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {item.secondary}
                      </p>
                    )}
                  </div>

                  {item.state && searchType === "(cities)" && (
                    <span className="text-[9px] bg-green-100/70 text-green-800 font-semibold px-1.5 py-0.5 rounded shrink-0 hidden sm:inline-block">
                      Auto-fill state
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[9px] text-gray-400">
              {hasGoogleMaps ? "Powered by Google Maps Places API" : "Type to filter results"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

