import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { 
  getLocalWasteLogs, 
  setLocalWasteLogs, 
  getLocalIngredients, 
  setLocalIngredients, 
  getLocalTransactions, 
  setLocalTransactions 
} from "../mockData";

export function useReportWaste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      // payload will be FormData when executing against backend API
      // Let's unpack properties for simulation in case API is down
      const isFormData = payload instanceof FormData;
      
      let ingredientId, quantity, wasteType, reason, remarks, images = [], reportedBy;

      if (isFormData) {
        ingredientId = payload.get("ingredientId");
        quantity = Number(payload.get("quantity"));
        wasteType = payload.get("wasteType");
        reason = payload.get("reason");
        remarks = payload.get("remarks") || "";
        reportedBy = payload.get("reportedBy") || "Aman Verma";
        // Images file handles
        const files = payload.getAll("images[]");
        // Read file handles to base64 for local mock storage
        for (const file of files) {
          if (file instanceof File) {
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(file);
            });
            images.push(base64);
          }
        }
      } else {
        ({ ingredientId, quantity, wasteType, reason, remarks = "", images = [], reportedBy = "Aman Verma" } = payload);
      }
      try {
        const response = await apiClient.post("/waste/report", payload, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
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
        throw new Error(response.data?.message || "Waste report failed on backend");
      } catch (err) {
        console.warn("Backend API unavailable. Saving waste report locally.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        // 1. Get and update ingredient stock
        const ingredients = getLocalIngredients();
        const ingredientIndex = ingredients.findIndex(i => i._id === ingredientId);

        if (ingredientIndex === -1) {
          throw new Error("Ingredient not found in local database");
        }

        const ingredient = ingredients[ingredientIndex];
        const previousStock = ingredient.currentStock;
        const qtyNum = Number(quantity);

        if (qtyNum > previousStock) {
          throw new Error(`Cannot report waste: quantity exceeds current stock (${previousStock} ${ingredient.unit})`);
        }

        const newStock = Math.max(0, previousStock - qtyNum);

        // Determine status
        let status = "available";
        if (newStock <= 0) {
          status = "out_of_stock";
        } else if (newStock <= ingredient.reorderLevel) {
          status = "low_stock";
        }

        // Save updated ingredient
        ingredients[ingredientIndex] = {
          ...ingredient,
          currentStock: Number(newStock.toFixed(2)),
          status,
          updatedAt: new Date().toISOString()
        };
        setLocalIngredients(ingredients);

        // 2. Create waste log
        const estimatedLoss = Number((qtyNum * ingredient.costPerUnit).toFixed(2));
        const wasteLogs = getLocalWasteLogs();
        const newWasteLog = {
          _id: `waste-${Date.now()}`,
          storeId: ingredient.storeId || "st-indore-01",
          ingredientId,
          ingredientName: ingredient.ingredientName,
          quantity: qtyNum,
          wasteType,
          reason,
          reportedBy,
          approvedBy: "",
          estimatedLoss,
          remarks,
          status: "pending",
          images,
          timeline: [
            {
              user: reportedBy,
              action: "reported",
              remarks: reason,
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString()
        };

        wasteLogs.push(newWasteLog);
        setLocalWasteLogs(wasteLogs);

        // 3. Create stock transaction
        const transactions = getLocalTransactions();
        const newTransaction = {
          _id: `txn-${Date.now()}`,
          ingredientId,
          storeId: ingredient.storeId || "st-indore-01",
          type: "stock_out",
          quantity: qtyNum,
          previousStock,
          newStock: Number(newStock.toFixed(2)),
          reason: `Ingredient Waste (${wasteType}): ${reason}`,
          createdBy: reportedBy,
          createdAt: new Date().toISOString()
        };
        transactions.push(newTransaction);
        setLocalTransactions(transactions);

        return {
          success: true,
          message: "Waste reported successfully in local storage database"
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Waste reported successfully");
      queryClient.invalidateQueries({ queryKey: ["waste"] });
      queryClient.invalidateQueries({ queryKey: ["waste-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to report waste");
    }
  });
}
