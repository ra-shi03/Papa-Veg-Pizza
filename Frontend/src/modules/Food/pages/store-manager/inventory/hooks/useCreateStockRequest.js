import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { getLocalStockRequests, setLocalStockRequests, getLocalIngredients } from "../mockData";

export function useCreateStockRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { ingredientId, requestedQty, urgency, reason, notes, requestedBy = "Aman Verma" } = payload;
      
      try {
        const response = await apiClient.post("/stock-requests", {
          ingredientId,
          requestedQty: Number(requestedQty),
          urgency,
          reason,
          notes
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to create request");
      } catch (err) {
        console.warn("Backend API unavailable to create request. Appending locally.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 400));

        const requests = getLocalStockRequests();
        const ingredients = getLocalIngredients();
        
        const ingredient = ingredients.find(i => i._id === ingredientId);
        if (!ingredient) {
          throw new Error("Invalid ingredient selection");
        }

        // Generate serial request number
        const nextNum = String(requests.length + 1).padStart(3, "0");
        const requestNo = `SR-2026-${nextNum}`;

        const newRequest = {
          _id: `req-${Date.now()}`,
          requestNo,
          storeId: ingredient.storeId || "st-indore-01",
          ingredientId,
          ingredientName: ingredient.ingredientName,
          requestedQty: Number(requestedQty),
          approvedQty: 0.0,
          urgency,
          reason,
          requestedBy,
          approvedBy: "",
          status: "pending",
          remarks: notes || "",
          createdAt: new Date().toISOString()
        };

        requests.push(newRequest);
        setLocalStockRequests(requests);

        return {
          success: true,
          message: `Request ${requestNo} raised successfully in offline mode`
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Stock request created successfully");
      
      // Invalidate related query caches
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit stock request");
    }
  });
}
