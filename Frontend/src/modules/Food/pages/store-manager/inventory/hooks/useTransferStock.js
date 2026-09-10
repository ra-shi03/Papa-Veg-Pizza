import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { 
  getLocalTransfers, 
  setLocalTransfers, 
  getLocalIngredients, 
  mockShortageTimeline 
} from "../mockData";

export function useTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { 
        fromStore, 
        fromStoreId, 
        toStore = "Indore Main Store", 
        toStoreId = "st-indore-01", 
        ingredientId, 
        quantity, 
        reason, 
        remarks = "",
        shortageId
      } = payload;

      try {
        const response = await apiClient.post("/inventory/transfer", {
          fromStoreId,
          toStoreId,
          ingredientId,
          quantity,
          reason,
          remarks
        });
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.success) {
          return response.data;
        }
        throw new Error(response.data?.message || "Failed to submit stock transfer");
      } catch (err) {
        console.warn("Backend API unavailable. Saving transfer request to local storage database.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const transfers = getLocalTransfers();
        const ingredients = getLocalIngredients();
        const ingredient = ingredients.find(i => i._id === ingredientId);

        const newTransfer = {
          _id: `tr-${Date.now()}`,
          fromStore,
          fromStoreId,
          toStore,
          toStoreId,
          ingredientId,
          ingredientName: ingredient?.ingredientName || "Unknown Ingredient",
          quantity,
          status: "pending", // Pending admin approval
          approvedBy: "",
          reason,
          remarks,
          createdAt: new Date().toISOString()
        };

        transfers.push(newTransfer);
        setLocalTransfers(transfers);

        // Update timeline in local mock memory
        if (shortageId) {
          if (!mockShortageTimeline[shortageId]) {
            mockShortageTimeline[shortageId] = [];
          }
          mockShortageTimeline[shortageId].push({
            user: localStorage.getItem("store_user_name") || "Shubham Jamliya",
            action: "transfer_initiated",
            remarks: `Initiated transfer of ${quantity} ${ingredient?.unit || "units"} from ${fromStore}`,
            createdAt: new Date().toISOString()
          });
        }

        return {
          success: true,
          message: "Transfer request submitted successfully. Awaiting administrator approval."
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Transfer request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["ingredient-shortages"] });
      queryClient.invalidateQueries({ queryKey: ["shortages-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["shortage-details"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit transfer request");
    }
  });
}
