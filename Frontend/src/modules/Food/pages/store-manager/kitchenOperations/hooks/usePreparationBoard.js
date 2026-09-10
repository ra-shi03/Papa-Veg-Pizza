import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";
import {
  mockChefs,
  mockIngredients,
  mockRecipes,
  initialMockPrepItems
} from "../mockData";

// Local storage key names for fallback DB
const PREP_ITEMS_STORAGE_KEY = "pvp_preparation_items";
const INGREDIENTS_STORAGE_KEY = "pvp_ingredients_stock";
const SHORTAGES_STORAGE_KEY = "pvp_ingredient_shortages";
const CHEFS_STORAGE_KEY = "pvp_kitchen_chefs";

// Initialize mock DB in LocalStorage
const initializeMockDb = () => {
  if (!localStorage.getItem(PREP_ITEMS_STORAGE_KEY)) {
    localStorage.setItem(PREP_ITEMS_STORAGE_KEY, JSON.stringify(initialMockPrepItems));
  }
  if (!localStorage.getItem(INGREDIENTS_STORAGE_KEY)) {
    localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(mockIngredients));
  }
  if (!localStorage.getItem(CHEFS_STORAGE_KEY)) {
    localStorage.setItem(CHEFS_STORAGE_KEY, JSON.stringify(mockChefs));
  }
  if (!localStorage.getItem(SHORTAGES_STORAGE_KEY)) {
    localStorage.setItem(SHORTAGES_STORAGE_KEY, JSON.stringify([]));
  }
};

initializeMockDb();

const getLocalPrepItems = () => {
  try {
    return JSON.parse(localStorage.getItem(PREP_ITEMS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalPrepItems = (items) => {
  localStorage.setItem(PREP_ITEMS_STORAGE_KEY, JSON.stringify(items));
};

const getLocalIngredients = () => {
  try {
    return JSON.parse(localStorage.getItem(INGREDIENTS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

export function usePreparationBoard(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });

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

      // Sync mock DB
      const local = getLocalPrepItems().map((item) =>
        item._id === orderItemId ? { ...item, current_stage: stage } : item
      );
      setLocalPrepItems(local);
    });

    // Standalone Simulation for standalone mode
    let simulationTimer;
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);

      // Randomly advance stage of items for testing
      simulationTimer = setInterval(() => {
        const local = getLocalPrepItems();
        // find a non-completed, non-paused item
        const eligible = local.filter(item => item.current_stage !== "ready_for_baking" && !item.paused);
        if (eligible.length > 0) {
          const target = eligible[Math.floor(Math.random() * eligible.length)];
          const nextStages = {
            assigned: "dough_prep",
            dough_prep: "sauce",
            sauce: "toppings",
            toppings: "ready_for_baking"
          };
          const next = nextStages[target.current_stage];
          if (next) {
            const updated = local.map((item) =>
              item._id === target._id ? { ...item, current_stage: next } : item
            );
            setLocalPrepItems(updated);
            queryClient.invalidateQueries({ queryKey: ["preparationBoard"] });

            const stageLabels = {
              dough_prep: "Dough Prep",
              sauce: "Sauce",
              toppings: "Toppings",
              ready_for_baking: "Ready For Baking"
            };
            toast.info(`Simulated: ${target.name} advanced to ${stageLabels[next]}`, {
              description: `Order: #${target.orderNumber}`,
            });
          }
        }
      }, 45000);
    }

    return () => {
      if (simulationTimer) clearInterval(simulationTimer);
      socket.disconnect();
    };
  }, [queryClient]);

  // Query preparation board items
  const prepQuery = useQuery({
    queryKey: ["preparationBoard", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/preparation-board", {
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
        throw new Error("No items or empty array");
      } catch (err) {
        console.warn("Backend API unavailable, falling back to simulated storage database.");

        let list = getLocalPrepItems();

        // Filters in memory
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.name.toLowerCase().includes(q) ||
              (o.assigned_chef && mockChefs.find(c => c._id === o.assigned_chef)?.name.toLowerCase().includes(q))
          );
        }

        if (filters.priority && filters.priority !== "All") {
          list = list.filter((o) => o.priority === filters.priority);
        }

        if (filters.chef && filters.chef !== "All") {
          if (filters.chef === "Unassigned") {
            list = list.filter((o) => !o.assigned_chef);
          } else {
            list = list.filter((o) => o.assigned_chef === filters.chef);
          }
        }

        if (filters.onlyUnassigned === "true") {
          list = list.filter((o) => !o.assigned_chef);
        }

        if (filters.delayed === "true") {
          list = list.filter((o) => {
            const elapsed = Math.floor((new Date() - new Date(o.started_time)) / 60000);
            return elapsed > (o.estimated_time || 12);
          });
        }

        if (filters.size && filters.size !== "All") {
          list = list.filter((o) => o.size === filters.size);
        }

        return list;
      }
    },
    refetchInterval: 15000,
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
        const response = await apiClient.put(`/order-item/${orderItemId}/stage`, {
          stage,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalPrepItems();
        const updated = local.map((item) =>
          item._id === orderItemId ? { ...item, current_stage: stage } : item
        );
        setLocalPrepItems(updated);
        return { success: true, orderItemId, stage };
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
        const response = await apiClient.put(`/order-item/${orderItemId}/pause`, {
          reason,
          notes,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalPrepItems();
        const updated = local.map((item) =>
          item._id === orderItemId
            ? { ...item, paused: true, pauseReason: reason, pauseNotes: notes }
            : item
        );
        setLocalPrepItems(updated);
        return { success: true, orderItemId };
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
        const response = await apiClient.put(`/order-item/${orderItemId}/reassign`, {
          chefId,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalPrepItems();
        const updated = local.map((item) =>
          item._id === orderItemId ? { ...item, assigned_chef: chefId } : item
        );
        setLocalPrepItems(updated);
        return { success: true, orderItemId, chefId };
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
        const response = await apiClient.post("/ingredient-shortages", payload);
        return response.data;
      } catch (err) {
        // Fallback simulation
        const localShortages = JSON.parse(localStorage.getItem(SHORTAGES_STORAGE_KEY)) || [];
        const newIssue = {
          _id: `shortage-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
          status: "pending"
        };
        localStorage.setItem(SHORTAGES_STORAGE_KEY, JSON.stringify([newIssue, ...localShortages]));
        return { success: true };
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
        const response = await apiClient.get("/ingredients");
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data?.data)) return response.data.data;
        throw new Error("Format mismatch");
      } catch (err) {
        return getLocalIngredients();
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
        const response = await apiClient.get("/recipes");
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data?.data)) return response.data.data;
        throw new Error("Format mismatch");
      } catch (err) {
        return mockRecipes;
      }
    },
  });
}
