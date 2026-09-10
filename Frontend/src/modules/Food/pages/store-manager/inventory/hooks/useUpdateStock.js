import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { 
  getLocalIngredients, 
  setLocalIngredients, 
  getLocalTransactions, 
  setLocalTransactions 
} from "../mockData";

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { ingredientId, type, quantity, reason, notes, updatedBy = "Shubham Jamliya" } = payload;
      
      try {
        const response = await apiClient.post("/inventory/update-stock", {
          ingredientId,
          type,
          quantity: Number(quantity),
          reason,
          notes
        });

        if (response.data && response.data.success) {
          return response.data;
        }
        
        throw new Error(response.data?.message || "Stock update failed on backend");
      } catch (err) {
        console.warn("Backend API unavailable for stock update. Executing update on local database.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get local ingredients list
        const ingredients = getLocalIngredients();
        const ingredientIndex = ingredients.findIndex(i => i._id === ingredientId);

        if (ingredientIndex === -1) {
          throw new Error("Ingredient not found in local database");
        }

        const ingredient = ingredients[ingredientIndex];
        const previousStock = ingredient.currentStock;
        let newStock = previousStock;

        // Perform calculation based on transaction type
        const qtyNum = Number(quantity);
        if (type === "stock_in") {
          newStock = previousStock + qtyNum;
        } else if (type === "stock_out") {
          newStock = Math.max(0, previousStock - qtyNum);
        } else if (type === "adjustment") {
          newStock = Math.max(0, qtyNum);
        }

        // Determine new status
        let status = "available";
        if (newStock <= 0) {
          status = "out_of_stock";
        } else if (newStock <= ingredient.reorderLevel) {
          status = "low_stock";
        }

        // Update ingredient object
        const updatedIngredient = {
          ...ingredient,
          currentStock: Number(newStock.toFixed(2)),
          status,
          lastUpdatedBy: updatedBy,
          updatedAt: new Date().toISOString()
        };

        ingredients[ingredientIndex] = updatedIngredient;
        setLocalIngredients(ingredients);

        // Insert transaction record
        const transactions = getLocalTransactions();
        const newTransaction = {
          _id: `txn-${Date.now()}`,
          ingredientId,
          storeId: ingredient.storeId,
          type,
          quantity: qtyNum,
          previousStock,
          newStock: Number(newStock.toFixed(2)),
          reason: reason + (notes ? ` (Notes: ${notes})` : ""),
          createdBy: updatedBy,
          createdAt: new Date().toISOString()
        };

        transactions.push(newTransaction);
        setLocalTransactions(transactions);

        return {
          success: true,
          message: "Stock updated successfully in local storage database"
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Stock updated successfully");
      
      // Invalidate queries to refresh components
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-details"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update stock");
    }
  });
}
