import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";
import { mockChefs, initialMockOrders } from "../mockData";

// Local storage key names (shares order database with incoming orders to demonstrate flow)
const ORDERS_STORAGE_KEY = "pvp_incoming_orders";
const CHEFS_STORAGE_KEY = "pvp_kitchen_chefs";

// Initialize mock database in localStorage
const initializeMockDb = () => {
  const existingOrdersStr = localStorage.getItem(ORDERS_STORAGE_KEY);
  let existingOrders = [];
  if (existingOrdersStr) {
    try {
      existingOrders = JSON.parse(existingOrdersStr) || [];
    } catch (e) {
      existingOrders = [];
    }
  }

  // Check if there are any kitchen-specific orders (confirmed, queued, preparing)
  const hasKitchenOrders = existingOrders.some((o) =>
    ["confirmed", "queued", "preparing"].includes(o.status)
  );

  if (!hasKitchenOrders) {
    // Merge to ensure we have mock data with confirmed, queued, preparing statuses
    const merged = [...initialMockOrders];
    existingOrders.forEach((o) => {
      if (!merged.some((m) => m._id === o._id)) {
        merged.push(o);
      }
    });
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(merged));
  }

  if (!localStorage.getItem(CHEFS_STORAGE_KEY)) {
    localStorage.setItem(CHEFS_STORAGE_KEY, JSON.stringify(mockChefs));
  }
};

initializeMockDb();

const getLocalOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalOrders = (orders) => {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

const getLocalChefs = () => {
  try {
    return JSON.parse(localStorage.getItem(CHEFS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalChefs = (chefs) => {
  localStorage.setItem(CHEFS_STORAGE_KEY, JSON.stringify(chefs));
};

export function useKitchenQueue(filters = {}, page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize socket.io connection
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
    socket.on("new_order_received", (newOrder) => {
      toast.info(`New Order ${newOrder.orderNumber || newOrder._id} received!`, {
        description: `Items: ${newOrder.items?.length || 0} | Status: ${newOrder.status}`,
      });
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });

      // Sync mock DB if using mock fallback
      const local = getLocalOrders();
      if (!local.some((o) => o._id === newOrder._id)) {
        setLocalOrders([newOrder, ...local]);
      }
    });

    socket.on("order_accepted", ({ orderId, status }) => {
      toast.success(`Order accepted in kitchen!`, {
        description: `Order ID: ${orderId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });

      // Sync mock DB
      const local = getLocalOrders().map((o) =>
        o._id === orderId ? { ...o, status: status || "queued", queueEntryTime: new Date().toISOString() } : o
      );
      setLocalOrders(local);
    });

    socket.on("order_assigned", ({ orderId, chefId }) => {
      const chefs = getLocalChefs();
      const chef = chefs.find((c) => c._id === chefId);
      toast.info(`Chef assigned!`, {
        description: `${chef ? chef.name : "A chef"} assigned to order ${orderId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });

      // Sync mock DB
      const local = getLocalOrders().map((o) =>
        o._id === orderId ? { ...o, assigned_chef: chefId } : o
      );
      setLocalOrders(local);
    });

    // Standalone Mock Socket Simulation
    let simulationTimer;
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);

      simulationTimer = setInterval(() => {
        const local = getLocalOrders();
        // If there's a confirmed order, let's simulate a new order received if queue is small
        if (local.length < 15) {
          const nextNum = 1050 + Math.floor(Math.random() * 500);
          const orderId = `sim-${Date.now()}`;
          const names = ["Rohan Malhotra", "Karan Johar", "Vikram Singh", "Priya Nair", "Aditya Sharma", "Sunita Rao"];
          const selectedName = names[Math.floor(Math.random() * names.length)];
          const newSimOrder = {
            _id: orderId,
            orderNumber: `PVP-${nextNum}`,
            customerId: `cust-${nextNum}`,
            customer: {
              name: selectedName,
              phone: `+91 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
              email: `${selectedName.toLowerCase().replace(" ", ".")}@gmail.com`,
              deliveryAddress: {
                houseNumber: `G-${Math.floor(Math.random() * 100 + 1)}`,
                street: "Palasia Road",
                landmark: "Near Square",
                city: "Indore",
                pincode: "452001",
                notes: "Call me before ring."
              }
            },
            storeId: "store-indore-01",
            status: "confirmed",
            createdAt: new Date().toISOString(),
            queueEntryTime: null,
            expectedReadyTime: new Date(Date.now() + 25 * 60000).toISOString(),
            sla_minutes: 20,
            priority: Math.random() > 0.7 ? (Math.random() > 0.5 ? "VIP" : "EXPRESS") : "NORMAL",
            paymentStatus: "paid",
            paymentMethod: Math.random() > 0.5 ? "ONLINE" : "COD",
            transactionId: `TXN-${Math.floor(Math.random() * 10000000000)}`,
            grandTotal: 340 + Math.floor(Math.random() * 600),
            assigned_chef: null,
            specialInstructions: Math.random() > 0.5 ? "Make it spicy. Cut in 8 slices." : "",
            timeline: [
              { status: "Placed", time: new Date(Date.now() - 5 * 60000).toISOString() },
              { status: "Confirmed", time: new Date().toISOString() }
            ],
            items: [
              {
                orderItemId: `oi-${orderId}-1`,
                productId: "prod-001",
                name: "Farmhouse Pizza",
                quantity: 1,
                size: "Medium",
                crust: "New Hand Tossed",
                toppings: ["Onions", "Capsicum"],
                unitPrice: 290,
                subtotal: 290,
                specialInstructions: ""
              }
            ]
          };

          const updated = [newSimOrder, ...local];
          setLocalOrders(updated);
          queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
          toast.info(`New Order ${newSimOrder.orderNumber} received (Simulated Socket)!`, {
            description: `Customer: ${newSimOrder.customer.name} | Total: ₹${newSimOrder.grandTotal}`,
          });
        }
      }, 50000);
    }

    return () => {
      if (simulationTimer) clearInterval(simulationTimer);
      socket.disconnect();
    };
  }, [queryClient]);

  // Main React Query Fetch
  const queueQuery = useQuery({
    queryKey: ["kitchenQueue", filters, page, limit],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/kitchen/queue", {
          params: { page, limit, ...filters },
        });

        let apiOrders = [];
        let pagination = null;
        if (response.data && Array.isArray(response.data.orders)) {
          apiOrders = response.data.orders;
          pagination = response.data.pagination;
        } else if (response.data?.data && Array.isArray(response.data.data.orders)) {
          apiOrders = response.data.data.orders;
          pagination = response.data.data.pagination;
        }

        if (apiOrders && apiOrders.length > 0) {
          return {
            orders: apiOrders,
            pagination: pagination || {
              total: apiOrders.length,
              page,
              limit,
              totalPages: 1
            }
          };
        }
        throw new Error("No active orders in API, falling back to mock data");
      } catch (err) {
        console.warn("Backend API unavailable, falling back to simulated storage database.");

        let list = getLocalOrders();

        // Perform filtering in-memory
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.customer.name.toLowerCase().includes(q) ||
              o.customer.phone.toLowerCase().includes(q)
          );
        }

        if (filters.status && filters.status !== "All") {
          list = list.filter((o) => o.status === filters.status);
        } else {
          // Default filter: only confirmed, queued, preparing
          list = list.filter((o) => ["confirmed", "queued", "preparing"].includes(o.status));
        }

        if (filters.priority && filters.priority !== "All") {
          list = list.filter((o) => o.priority === filters.priority);
        }

        if (filters.assignedChef && filters.assignedChef !== "All") {
          if (filters.assignedChef === "Unassigned") {
            list = list.filter((o) => !o.assigned_chef);
          } else {
            list = list.filter((o) => o.assigned_chef === filters.assignedChef);
          }
        }

        if (filters.paymentMethod && filters.paymentMethod !== "All") {
          list = list.filter((o) => o.paymentMethod === filters.paymentMethod);
        }

        if (filters.unassigned === "true") {
          list = list.filter((o) => !o.assigned_chef);
        }

        if (filters.delayed === "true") {
          list = list.filter((o) => {
            if (!o.queueEntryTime) return false;
            const waitingTime = Math.floor((new Date() - new Date(o.queueEntryTime)) / 60000);
            return waitingTime > (o.sla_minutes || 20);
          });
        }

        // Pagination calculations
        const total = list.length;
        const startIndex = (page - 1) * limit;
        const paginatedList = list.slice(startIndex, startIndex + limit);

        return {
          orders: paginatedList,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
    },
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000, // polling fallback every 30s
  });

  return {
    ...queueQuery,
    socketConnected,
  };
}

// Fetch all available chefs
export function useChefs() {
  return useQuery({
    queryKey: ["kitchenChefs"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/staff", {
          params: { role: "chef" },
        });
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data?.data)) return response.data.data;
        throw new Error("Format mismatch");
      } catch (err) {
        return getLocalChefs().filter((s) => s.role === "chef" && s.status === "active");
      }
    },
  });
}

// Accept Order Mutation
export function useAcceptOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId) => {
      try {
        const response = await apiClient.put(`/orders/${orderId}/accept`, {
          status: "queued",
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalOrders();
        const updated = local.map((o) =>
          o._id === orderId
            ? {
                ...o,
                status: "queued",
                queueEntryTime: new Date().toISOString(),
                timeline: [
                  ...o.timeline,
                  { status: "Queue Entry", time: new Date().toISOString() },
                ],
              }
            : o
        );
        setLocalOrders(updated);
        return { success: true, orderId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      toast.success("Order accepted and queued successfully!");
    },
    onError: () => {
      toast.error("Failed to accept order");
    },
  });
}

// Assign Chef Mutation
export function useAssignChef() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, chefId }) => {
      try {
        const response = await apiClient.put(`/orders/${orderId}/assign-chef`, {
          chefId,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalOrders();
        const updatedOrders = local.map((o) =>
          o._id === orderId ? { ...o, assigned_chef: chefId } : o
        );
        setLocalOrders(updatedOrders);

        // Update chef workload
        const chefs = getLocalChefs();
        const updatedChefs = chefs.map((c) =>
          c._id === chefId ? { ...c, currentWorkload: c.currentWorkload + 1 } : c
        );
        setLocalChefs(updatedChefs);

        return { success: true, orderId, chefId };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenChefs"] });
      toast.success("Chef assigned to order successfully!");
    },
    onError: () => {
      toast.error("Failed to assign chef");
    },
  });
}

// Reject Item Mutation
export function useRejectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, itemIds, reason, notifyCustomer }) => {
      try {
        const response = await apiClient.post("/orders/item-reject", {
          orderId,
          itemIds,
          reason,
          notifyCustomer,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalOrders();
        const updated = local.map((o) => {
          if (o._id === orderId) {
            // Filter out or mark items as rejected
            const updatedItems = o.items.filter((item) => !itemIds.includes(item.orderItemId));
            const subtotal = updatedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
            return {
              ...o,
              items: updatedItems,
              grandTotal: subtotal > 0 ? subtotal + 50 : 0, // subtotal + taxes/charges
              specialInstructions: `${o.specialInstructions ? o.specialInstructions + " | " : ""}Rejected Items: ${itemIds.join(", ")} (Reason: ${reason})`,
            };
          }
          return o;
        });
        setLocalOrders(updated);
        return { success: true, orderId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      toast.success("Items rejected and order updated!");
    },
    onError: () => {
      toast.error("Failed to reject items");
    },
  });
}

// Update Order Status (e.g. Mark Preparing, Start Preparation, Cancel Order)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      try {
        const response = await apiClient.put(`/orders/${orderId}`, {
          status,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalOrders();
        const updated = local.map((o) => {
          if (o._id === orderId) {
            const timelineLabel =
              status === "preparing"
                ? "Preparation Started"
                : status === "baking"
                ? "Baking Started"
                : status === "packaging"
                ? "Packaging Started"
                : status === "ready_for_pickup"
                ? "Ready for Pickup"
                : status === "cancelled"
                ? "Cancelled"
                : status;

            // Avoid duplicating timeline logs
            const timelineExists = o.timeline.some((t) => t.status === timelineLabel);
            const newTimeline = timelineExists
              ? o.timeline
              : [...o.timeline, { status: timelineLabel, time: new Date().toISOString() }];

            return {
              ...o,
              status,
              timeline: newTimeline,
            };
          }
          return o;
        });
        setLocalOrders(updated);
        return { success: true, orderId, status };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      toast.success(`Order status updated to "${variables.status}"`);
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });
}
