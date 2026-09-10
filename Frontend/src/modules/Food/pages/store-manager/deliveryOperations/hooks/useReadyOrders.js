import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { initialMockReadyOrders } from "../mockDeliveryData";

const READY_ORDERS_KEY = "pvp_ready_orders";

// Initialize localStorage fallback
const initializeReadyOrdersDb = () => {
  if (!localStorage.getItem(READY_ORDERS_KEY)) {
    localStorage.setItem(READY_ORDERS_KEY, JSON.stringify(initialMockReadyOrders));
  }
};

initializeReadyOrdersDb();

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

        if (apiItems && apiItems.length > 0) {
          return apiItems;
        }
        throw new Error("No orders returned");
      } catch (err) {
        // Local fallback
        let list = getLocalReadyOrders();

        // Filter by search (order number or customer name)
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter((o) => {
            const orderNum = o.orderNumber || "";
            const custName = o.customerName || o.customer?.name || "";
            return (
              orderNum.toLowerCase().includes(q) ||
              custName.toLowerCase().includes(q)
            );
          });
        }

        // Filter by status (waiting, assigned, accepted)
        if (filters.status && filters.status !== "All") {
          list = list.filter((o) => {
            const deliveryStatus = o.deliveryStatus || (o.assignedRiderId || o.deliveryPartnerId ? "assigned" : "waiting");
            return deliveryStatus.toLowerCase() === filters.status.toLowerCase();
          });
        }

        return list;
      }
    }
  });
}
