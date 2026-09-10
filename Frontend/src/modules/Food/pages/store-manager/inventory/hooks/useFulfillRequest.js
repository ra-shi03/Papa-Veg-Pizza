import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { 
  getLocalStockRequests, 
  setLocalStockRequests,
  getLocalIngredients,
  setLocalIngredients,
  getLocalTransactions,
  setLocalTransactions
} from "../mockData";

export function useFulfillRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { requestId, deliveredQty, remarks, fulfilledBy = "Shubham Jamliya" } = payload;

      try {
        const response = await apiClient.patch("/stock-requests/fulfill", {
          requestId,
          deliveredQty: Number(deliveredQty),
          remarks
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to fulfill request");
      } catch (err) {
        console.warn("Backend API unavailable for stock fulfillment. Simulating locally.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const requests = getLocalStockRequests();
        const requestIndex = requests.findIndex(r => r._id === requestId);

        if (requestIndex === -1) {
          throw new Error("Stock request not found");
        }

        const request = requests[requestIndex];
        if (request.status === "fulfilled") {
          throw new Error("Request is already fulfilled");
        }

        // Get local ingredients list to check and update stock
        const ingredients = getLocalIngredients();
        const ingredientIndex = ingredients.findIndex(i => i._id === request.ingredientId);

        if (ingredientIndex === -1) {
          throw new Error("Ingredient not found in inventory");
        }

        const ingredient = ingredients[ingredientIndex];
        const previousStock = ingredient.currentStock;
        const qtyNum = Number(deliveredQty);

        // Enforce validation to prevent negative stock results
        if (previousStock - qtyNum < 0) {
          throw new Error(`Insufficient stock. Current stock is ${previousStock} ${ingredient.unit}, cannot fulfill ${qtyNum} ${ingredient.unit}.`);
        }

        const newStock = previousStock - qtyNum;

        // Determine new status of the ingredient
        let ingStatus = "available";
        if (newStock <= 0) {
          ingStatus = "out_of_stock";
        } else if (newStock <= ingredient.reorderLevel) {
          ingStatus = "low_stock";
        }

        // Update ingredient object
        const updatedIngredient = {
          ...ingredient,
          currentStock: Number(newStock.toFixed(2)),
          status: ingStatus,
          lastUpdatedBy: fulfilledBy,
          updatedAt: new Date().toISOString()
        };

        ingredients[ingredientIndex] = updatedIngredient;
        setLocalIngredients(ingredients);

        // Insert transaction record for the stock decrease
        const transactions = getLocalTransactions();
        const newTransaction = {
          _id: `txn-${Date.now()}`,
          ingredientId: request.ingredientId,
          storeId: ingredient.storeId,
          type: "stock_out",
          quantity: qtyNum,
          previousStock,
          newStock: Number(newStock.toFixed(2)),
          reason: `Stock Request Fulfillment (${request.requestNo})` + (remarks ? `: ${remarks}` : ""),
          createdBy: fulfilledBy,
          createdAt: new Date().toISOString()
        };

        transactions.push(newTransaction);
        setLocalTransactions(transactions);

        // Perform local update for request status
        const updatedRequest = {
          ...request,
          status: "fulfilled",
          deliveredQty: qtyNum, // store delivered quantity
          remarks: remarks || "Fulfilled in offline mode",
          approvedBy: request.approvedBy || fulfilledBy, // ensure approvedBy is filled
          updatedAt: new Date().toISOString()
        };

        requests[requestIndex] = updatedRequest;
        setLocalStockRequests(requests);

        return {
          success: true,
          message: `Request ${request.requestNo} fulfilled successfully`
        };
      }
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Request fulfilled");
      
      // Invalidate queries to refresh tables, stats, and inventory
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock-request-details", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (error) => {
      toast.error(error.message || "Fulfillment failed");
    }
  });
}
