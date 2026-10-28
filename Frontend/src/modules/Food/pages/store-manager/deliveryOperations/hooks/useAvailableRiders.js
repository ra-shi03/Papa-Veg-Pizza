import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { STANDALONE_MOCK, failOrMock } from "@/services/api/mockPolicy";
import { initialMockRiders } from "../mockDeliveryData";

const RIDERS_KEY = "pvp_available_riders";

// Initialize localStorage fallback
const initializeRidersDb = () => {
  if (!localStorage.getItem(RIDERS_KEY)) {
    localStorage.setItem(RIDERS_KEY, JSON.stringify(initialMockRiders));
  }
};

initializeRidersDb();

export const getLocalRiders = () => {
  try {
    return JSON.parse(localStorage.getItem(RIDERS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

export const setLocalRiders = (riders) => {
  localStorage.setItem(RIDERS_KEY, JSON.stringify(riders));
};

export default function useAvailableRiders() {
  return useQuery({
    queryKey: ["available-riders"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/delivery/available-riders");
        
        let apiItems = [];
        if (Array.isArray(response.data)) {
          apiItems = response.data;
        } else if (Array.isArray(response.data?.data)) {
          apiItems = response.data.data;
        } else if (Array.isArray(response.data?.riders)) {
          apiItems = response.data.riders;
        }

        // An empty list is a real answer ("no riders free"), never a reason to show sample riders
        if (!STANDALONE_MOCK || apiItems.length > 0) return apiItems;
        throw new Error("No riders returned");
      } catch (err) {
        failOrMock(err, "Could not load riders");
        // Local fallback (only return online riders or all riders, let's return all online/available riders)
        return getLocalRiders();
      }
    }
  });
}
