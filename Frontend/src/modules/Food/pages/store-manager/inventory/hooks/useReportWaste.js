import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

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
        reportedBy = payload.get("reportedBy") || "—";
        // Images file handles
        const files = payload.getAll("images[]");
        // Read file handles to base64 for local storage
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
        ({ ingredientId, quantity, wasteType, reason, remarks = "", images = [], reportedBy } = payload);
      }
      try {
        const response = await apiClient.post(`${INV}/waste/report`, payload, {
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
        throwApiError(err);
        
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
