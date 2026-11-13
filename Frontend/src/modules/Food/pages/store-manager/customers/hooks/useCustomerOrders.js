import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
// 1. Fetch Customer Orders List (Paginated & Filtered)
export function useCustomerOrdersList(filters = {}) {
  return useQuery({
    queryKey: ["customerOrders", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/food/store/customers/orders", {
          params: filters,
        });

        // Backend response wraps it in response.data.data
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        } else if (response.data && response.data.customers) {
          return response.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch Single Customer Profile
export function useCustomerProfile(customerId) {
  return useQuery({
    queryKey: ["customerProfile", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      try {
        const response = await apiClient.get(`/food/store/customers/${customerId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        return response.data;
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    enabled: !!customerId,
  });
}

// 3. Fetch Single Order Details
export function useOrderDetails(orderId) {
  return useQuery({
    queryKey: ["orderDetails", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        const response = await apiClient.get(`/food/store/customers/orders/${orderId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        return response.data;
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    enabled: !!orderId,
  });
}

// 4. Create Refund Mutation
export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      try {
        const response = await apiClient.post(`/store/orders/${orderId}/refund`, { reason });
        return response.data?.data || response.data;
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderDetails", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
      toast.success("Refund request successfully created!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to process refund request");
    }
  });
}
