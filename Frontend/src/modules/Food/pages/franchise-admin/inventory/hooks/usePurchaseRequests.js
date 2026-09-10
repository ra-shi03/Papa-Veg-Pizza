import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { purchaseRequestService, subscribeToPRChanges } from "../services/purchaseRequestService";
import { toast } from "sonner";

export function usePurchaseRequestsQuery(params = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToPRChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request-details"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["purchase-requests", params],
    queryFn: () => purchaseRequestService.getRequests(params),
    placeholderData: (prev) => prev
  });
}

export function usePurchaseRequestDetailsQuery(id) {
  return useQuery({
    queryKey: ["purchase-request-details", id],
    queryFn: () => purchaseRequestService.getRequestById(id),
    enabled: !!id
  });
}

export function useCreatePurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => purchaseRequestService.createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request-details"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      toast.success("Purchase request created successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create purchase request");
    }
  });
}

export function useApprovePurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => purchaseRequestService.approveRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request-details"] });
      toast.success("Purchase request approved successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to approve request");
    }
  });
}

export function useRejectPurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => purchaseRequestService.rejectRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request-details"] });
      toast.success("Purchase request rejected successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reject request");
    }
  });
}

export function useReceivePurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => purchaseRequestService.markReceived(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request-details"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      toast.success("Goods received and inventory updated successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to receive goods");
    }
  });
}
