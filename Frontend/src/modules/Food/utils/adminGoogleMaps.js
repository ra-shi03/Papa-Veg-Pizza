// One set of Google Maps loader options for every admin screen (territories, zones, franchises, stores).
// The loader keeps a single script per page: screens that asked for different libraries or versions under the same
// id made the map blank once another admin screen had loaded the script first. All of them use this object.
export const ADMIN_GOOGLE_MAPS_LOADER = Object.freeze({
  id: "google-map-script",
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  libraries: Object.freeze(["geometry", "places"]),
})
