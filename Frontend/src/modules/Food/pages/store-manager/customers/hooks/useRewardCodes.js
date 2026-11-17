import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";

const unwrap = (res) => res?.data?.data;
const message = (err) => err?.response?.data?.message || err?.response?.data?.error || err?.message || "Something went wrong";

/** A customer's wallet, points and reward codes (store manager, for customers of their own store). */
export function useCustomerWalletRewards(customerId, enabled = true) {
  return useQuery({
    queryKey: ["customerWalletRewards", customerId],
    queryFn: async () => unwrap(await apiClient.get(`/food/store/rewards/customers/${customerId}`)),
    enabled: !!customerId && enabled,
    staleTime: 5000,
  });
}

/** Look up a 6-digit reward code the customer showed. */
export async function lookupRewardCode(code) {
  return unwrap(await apiClient.get(`/food/store/rewards/codes/${code}`)).redemption;
}

export function useConfirmRewardCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code) => unwrap(await apiClient.post(`/food/store/rewards/codes/${code}/confirm`, {})).redemption,
    onSuccess: () => {
      toast.success("Reward handed over");
      queryClient.invalidateQueries({ queryKey: ["customerWalletRewards"] });
    },
    onError: (err) => toast.error(message(err)),
  });
}

export function useCancelRewardCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, reason }) => unwrap(await apiClient.post(`/food/store/rewards/codes/${code}/cancel`, { reason })).redemption,
    onSuccess: () => {
      toast.success("Code cancelled. The points went back to the customer.");
      queryClient.invalidateQueries({ queryKey: ["customerWalletRewards"] });
    },
    onError: (err) => toast.error(message(err)),
  });
}

export const rewardCodeError = message;
