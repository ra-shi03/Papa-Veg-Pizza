import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";
import apiClient from "@/services/api/axios";



const KITCHEN = "/food/store/kitchen";
const INVENTORY = "/food/store/inventory";


// Local storage key names for fallback DB






export function usePreparationBoard(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = storeSocket();   // the store panel's one signed-in socket

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Real-Time Socket Listeners
    socket.on("preparation_started", ({ orderItemId, name }) => {
      toast.info("Preparation started!", {
        description: `Pizza "${name}" is now in preparation board`,
      });
      queryClient.invalidateQueries({ queryKey: ["preparationBoard"] });
    });

    socket.on("preparation_stage_changed", ({ orderItemId, name, stage }) => {
      const stageLabels = {
        dough_prep: "Dough Prep",
        sauce: "Sauce",
        toppings: "Toppings",
        ready_for_baking: "Ready For Baking"
      };
      toast.success(`Pizza stage advanced!`, {
        description: `"${name}" moved to ${stageLabels[stage] || stage} stage`,
      });
      queryClient.invalidateQueries({ queryKey: ["preparationBoard"] });
    });

    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Query preparation board items
  const prepQuery = useQuery({
    queryKey: ["preparationBoard", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/preparation-board`, {
          params: filters,
        });
        
        let apiItems = [];
        if (Array.isArray(response.data)) {
          apiItems = response.data;
        } else if (Array.isArray(response.data?.items)) {
          apiItems = response.data.items;
        } else if (Array.isArray(response.data?.data)) {
          apiItems = response.data.data;
        }

        if (apiItems && apiItems.length > 0) {
          return apiItems;
        }
        return apiItems;
        
      } catch (err) {
        throw err;
        
      }
    },
    refetchInterval: 60000,   // safety net: changes arrive over the live socket
  });

  return {
    ...prepQuery,
    socketConnected,
  };
}

// Move item stage mutation
export function useMoveStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, stage }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/order-item/${orderItemId}/stage`, {
          stage,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["preparationBoard"] });
      const stageLabels = {
        dough_prep: "Dough Prep",
        sauce: "Sauce",
        toppings: "Toppings",
        ready_for_baking: "Ready For Baking"
      };
      toast.success(`Stage updated to ${stageLabels[variables.stage] || variables.stage}`);
    },
    onError: () => {
      toast.error("Failed to update preparation stage");
    },
  });
}

// Pause item preparation mutation
export function usePausePreparation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, reason, notes }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/order-item/${orderItemId}/pause`, {
          reason,
          notes,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preparationBoard"] });
      toast.success("Pizza preparation paused successfully.");
    },
    onError: () => {
      toast.error("Failed to pause pizza preparation");
    },
  });
}

// Reassign chef mutation
export function useReassignChef() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, chefId }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/order-item/${orderItemId}/reassign`, {
          chefId,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preparationBoard"] });
      toast.success("Chef reassigned to pizza item successfully!");
    },
    onError: () => {
      toast.error("Failed to reassign chef");
    },
  });
}

// Report ingredient shortages mutation
export function useIngredientIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post(`${INVENTORY}/ingredient-shortages`, payload);
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      toast.success("Ingredient shortage reported successfully.");
    },
    onError: () => {
      toast.error("Failed to report ingredient issue");
    },
  });
}

// Fetch all ingredients
export function useIngredients() {
  return useQuery({
    queryKey: ["ingredientsStock"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INVENTORY}/ingredients`);
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data?.data)) return response.data.data;
        throw new Error("Format mismatch");
      } catch (err) {
        throw err;
        
      }
    },
  });
}

// Fetch recipes
export function useRecipes() {
  return useQuery({
    queryKey: ["recipesList"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INVENTORY}/recipes`);
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data?.data)) return response.data.data;
        throw new Error("Format mismatch");
      } catch (err) {
        throw err;
        
      }
    },
  });
}
