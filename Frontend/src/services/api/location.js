import axiosInstance from "./axios";

export const locationAPI = {
  // Mock serviceability check
  checkServiceability: async (lat, lng) => {
    try {
      const response = await axiosInstance.get(`/food/search/serviceability?lat=${lat}&lng=${lng}`);
      return response;
    } catch (error) {
      console.error("Serviceability check failed:", error);
      // Fallback for errors to prevent app from breaking, but properly return false
      return {
        data: {
          success: true,
          data: {
            isServiceable: false,
            storeId: null,
            message: "Unable to verify location. Please try again later."
          }
        }
      };
    }
  },

  // Fetch nearby stores
  getNearbyStores: async (lat, lng) => {
    try {
      const response = await axiosInstance.get(`/food/search/nearby-stores?lat=${lat}&lng=${lng}`);
      return response;
    } catch (error) {
      console.error("Fetching nearby stores failed:", error);
      return { data: { success: true, data: { stores: [] } } };
    }
  },

  // Mock Reverse Geocoding using free nominatim API
  reverseGeocode: async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return {
        formattedAddress: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country,
        pincode: data.address?.postcode,
        lat: data.lat,
        lon: data.lon,
        address: {
          ...data.address,
          lat: data.lat,
          lon: data.lon
        }
      };
    } catch (error) {
      console.error("Geocoding failed:", error);
      throw new Error("Failed to get address from coordinates.");
    }
  },

  // Autocomplete search using nominatim
  searchAddress: async (query) => {
    try {
      if (!query || query.length < 3) return [];
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`); // assuming India, can remove countrycodes if worldwide
      const data = await response.json();
      return data.map(item => ({
        description: item.display_name,
        lat: item.lat,
        lng: item.lon
      }));
    } catch (error) {
      console.error("Autocomplete search failed:", error);
      return [];
    }
  }
};
