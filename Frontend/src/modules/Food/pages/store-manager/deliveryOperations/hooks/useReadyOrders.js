import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { throwApiError } from "@/services/api/apiError";


const READY_ORDERS_KEY = "pvp_ready_orders";

// Initialize localStorage fallback


export const getLocalReadyOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(READY_ORDERS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

export const setLocalReadyOrders = (orders) => {
  localStorage.setItem(READY_ORDERS_KEY, JSON.stringify(orders));
};

export default function useReadyOrders(filters = {}) {
  return useQuery({
    queryKey: ["ready-orders", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/orders/ready", {
          params: filters
        });
        
        let apiItems = [];
        if (Array.isArray(response.data)) {
          apiItems = response.data;
        } else if (Array.isArray(response.data?.data)) {
          apiItems = response.data.data;
        } else if (Array.isArray(response.data?.orders)) {
          apiItems = response.data.orders;
        }

        // An empty list is a real answer ("no orders ready"), never a reason to show sample orders
        return apiItems;
        
      } catch (err) {
        throwApiError(err, "Could not load ready orders");
        // Local fallback
        
      }
    }
  });
}
