import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";
import { initialMockOrders, initialMockStaff } from "../mockData";

// Local storage key names for fallback mock db
const ORDERS_STORAGE_KEY = "pvp_incoming_orders";
const STAFF_STORAGE_KEY = "pvp_kitchen_staff";

// Initialize mock DB in localStorage if it doesn't exist
const initializeMockDb = () => {
  if (!localStorage.getItem(ORDERS_STORAGE_KEY)) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialMockOrders));
  }
  if (!localStorage.getItem(STAFF_STORAGE_KEY)) {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(initialMockStaff));
  }
};

initializeMockDb();

// Helper to get items from local storage
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

const getLocalStaff = () => {
  try {
    return JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalStaff = (staff) => {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
};

export function useIncomingOrders(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize socket.io connection
  useEffect(() => {
    // Attempt connection with fallback options
    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      toast.success("Real-time orders feed connected!");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      toast.warning("Real-time feed disconnected. Reconnecting...");
    });

    // Real-Time Socket Listeners
    socket.on("orderCreated", (newOrder) => {
      // Refresh React Query cache
      queryClient.setQueryData(["incomingOrders"], (oldOrders = []) => {
        if (oldOrders.some((o) => o._id === newOrder._id)) return oldOrders;
        toast.info(`New Order ${newOrder.orderNumber} received!`, {
          description: `Value: ₹${newOrder.grandTotal} | ${newOrder.orderType}`,
        });
        return [newOrder, ...oldOrders];
      });

      // Sync mock DB if using mock fallback
      const local = getLocalOrders();
      if (!local.some((o) => o._id === newOrder._id)) {
        setLocalOrders([newOrder, ...local]);
      }
    });

    socket.on("orderAccepted", ({ orderId }) => {
      queryClient.setQueryData(["incomingOrders"], (oldOrders = []) => {
        return oldOrders.filter((o) => o._id !== orderId);
      });
      // Sync mock DB
      const local = getLocalOrders().filter((o) => o._id !== orderId);
      setLocalOrders(local);
    });

    socket.on("orderCancelled", ({ orderId }) => {
      queryClient.setQueryData(["incomingOrders"], (oldOrders = []) => {
        return oldOrders.filter((o) => o._id !== orderId);
      });
      // Sync mock DB
      const local = getLocalOrders().filter((o) => o._id !== orderId);
      setLocalOrders(local);
    });

    socket.on("paymentVerified", ({ orderId, status }) => {
      queryClient.setQueryData(["incomingOrders"], (oldOrders = []) => {
        return oldOrders.map((o) =>
          o._id === orderId
            ? { ...o, paymentStatus: "paid", status: "payment_verified" }
            : o
        );
      });
      // Sync mock DB
      const local = getLocalOrders().map((o) =>
        o._id === orderId
          ? { ...o, paymentStatus: "paid", status: "payment_verified" }
          : o
      );
      setLocalOrders(local);
      toast.success(`Payment verified for Order ID: ${orderId}`);
    });

    // Simulation Timer for standalone mock behavior (VITE_STANDALONE_MOCK === "true")
    let simulationTimer;
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      // Simulate socket connection
      setSocketConnected(true);

      simulationTimer = setInterval(() => {
        // Randomly emit a new order simulation
        const randomNames = ["Arjun Mehta", "Kavya Nair", "Suresh Kumar", "Priya Patel", "Vikram Malhotra"];
        const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
        const nextNum = 10240 + Math.floor(Math.random() * 1000);
        const orderId = `sim-${Date.now()}`;
        const newSimOrder = {
          _id: orderId,
          orderNumber: `PVP-${nextNum}`,
          customerId: `cust-${nextNum}`,
          customer: {
            name: randomName,
            phone: `+91 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
            email: `${randomName.toLowerCase().replace(" ", ".")}@pvp.in`,
            loyaltyPoints: Math.floor(Math.random() * 500),
            previousOrdersCount: Math.floor(Math.random() * 20)
          },
          storeId: "st-indore-01",
          status: Math.random() > 0.4 ? "payment_verified" : "awaiting_confirmation",
          createdAt: new Date().toISOString(),
          orderType: Math.random() > 0.5 ? "delivery" : "pickup",
          priority: Math.random() > 0.8 ? "urgent" : "normal",
          orderSource: ["Website", "Android", "iOS", "Swiggy", "Zomato", "POS"][Math.floor(Math.random() * 6)],
          paymentStatus: Math.random() > 0.3 ? "paid" : "pending",
          paymentMethod: Math.random() > 0.5 ? "Online" : "COD",
          deliveryAddress: {
            houseNumber: `A-${Math.floor(Math.random() * 100 + 1)}`,
            street: "M.G. Road",
            landmark: "Near Main Square",
            city: "Indore",
            pincode: "452001",
            notes: "Please call before delivery.",
            googleMapsLink: "https://maps.google.com/?q=22.7196,75.8577"
          },
          items: [
            {
              productId: "prod-001",
              name: "Double Cheese Margherita Pizza",
              image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=300&fm=webp",
              quantity: 1,
              size: "Medium",
              variant: "Pan Crust",
              unitPrice: 220,
              subtotal: 220,
              customizations: {
                crustType: "Pan Crust",
                cheeseLevel: "Normal",
                extraToppings: [],
                removeIngredients: [],
                specialInstructions: ""
              }
            }
          ],
          couponId: "",
          subtotal: 220,
          discountAmount: 0,
          taxes: 11.00,
          deliveryCharges: 35.00,
          packingCharges: 15.00,
          grandTotal: 281.00
        };

        // Emit new order to React Query cache
        queryClient.setQueryData(["incomingOrders"], (oldOrders = []) => {
          if (oldOrders.some((o) => o.orderNumber === newSimOrder.orderNumber)) return oldOrders;
          return [newSimOrder, ...oldOrders];
        });

        // Sync local storage
        const local = getLocalOrders();
        setLocalOrders([newSimOrder, ...local]);

        toast.info(`New Order ${newSimOrder.orderNumber} received (Simulated Socket)!`, {
          description: `Name: ${newSimOrder.customer.name} | Total: ₹${newSimOrder.grandTotal}`,
        });

      }, 45000); // simulation interval
    }

    return () => {
      if (simulationTimer) clearInterval(simulationTimer);
      socket.disconnect();
    };
  }, [queryClient]);

  // Main React Query Fetch
  const ordersQuery = useQuery({
    queryKey: ["incomingOrders", filters],
    queryFn: async () => {
      try {
        // Try real API call
        const response = await apiClient.get("/orders", {
          params: { status: "payment_verified,awaiting_confirmation", ...filters }
        });

        // Detect mock adapter stub fallback
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        // Validate structure and return array
        if (response.data && Array.isArray(response.data.orders)) {
          return response.data.orders;
        }
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data?.data && Array.isArray(response.data.data.orders)) {
          return response.data.data.orders;
        }
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }

        throw new Error("Format mismatch or empty response");
      } catch (err) {
        console.warn("Backend API unavailable or format mismatched. Falling back to high-fidelity simulated local database.");
        // Fallback to local storage
        let list = getLocalOrders();
        
        // Apply Filters locally
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(o => 
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.customer.phone.toLowerCase().includes(q)
          );
        }

        if (filters.priority && filters.priority !== "All") {
          list = list.filter(o => o.priority === filters.priority.toLowerCase());
        }

        if (filters.orderType && filters.orderType !== "All") {
          list = list.filter(o => o.orderType === filters.orderType.toLowerCase());
        }

        if (filters.paymentMethod && filters.paymentMethod !== "All") {
          list = list.filter(o => {
            if (filters.paymentMethod === "Online") return o.paymentMethod === "Online";
            return o.paymentMethod === "COD";
          });
        }

        if (filters.orderSource && filters.orderSource !== "All") {
          list = list.filter(o => o.orderSource === filters.orderSource);
        }

        if (filters.scheduled && filters.scheduled !== "All") {
          list = list.filter(o => {
            const isScheduled = !!o.scheduledTime;
            return filters.scheduled === "Scheduled" ? isScheduled : !isScheduled;
          });
        }

        // Filter by Date (Today, Yesterday, Custom)
        if (filters.dateRange && filters.dateRange !== "All") {
          const now = new Date();
          const todayStr = now.toDateString();
          
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();

          list = list.filter(o => {
            const orderDate = new Date(o.createdAt);
            const orderDateStr = orderDate.toDateString();
            if (filters.dateRange === "Today") {
              return orderDateStr === todayStr;
            } else if (filters.dateRange === "Yesterday") {
              return orderDateStr === yesterdayStr;
            }
            return true; // Custom Range (fallback)
          });
        }

        // Return orders sorted by createdAt descending
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },
    staleTime: 5000,
  });

  return {
    ...ordersQuery,
    socketConnected
  };
}

// Hook to fetch active supervisors for assignment
export function useActiveSupervisors(searchQuery = "") {
  return useQuery({
    queryKey: ["activeSupervisors", searchQuery],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/staff", {
          params: { role: "kitchen_supervisor", status: "active", q: searchQuery }
        });

        // Detect mock adapter stub fallback
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        if (response.data && Array.isArray(response.data.staff)) {
          return response.data.staff;
        }
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data?.data && Array.isArray(response.data.data.staff)) {
          return response.data.data.staff;
        }
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }

        throw new Error("Format mismatch or empty response");
      } catch (err) {
        // Fallback to localStorage supervisors
        let list = getLocalStaff().filter(s => s.role === "kitchen_supervisor" && s.status === "active");
        if (searchQuery) {
          list = list.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        return list;
      }
    }
  });
}

// Mutation to accept order
export function useAcceptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, payload }) => {
      try {
        // If standalone mock is running, skip API call to prevent getting stubbed success
        if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
          throw new Error("Stand-alone mock simulation");
        }

        const response = await apiClient.patch(`/orders/${orderId}/accept`, payload);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        return response.data;
      } catch (err) {
        console.warn("Backend API unavailable. Processing acceptance simulation locally.");
        
        // Simulate local DB update
        const orders = getLocalOrders();
        const acceptedOrder = orders.find(o => o._id === orderId);
        
        if (!acceptedOrder) throw new Error("Order not found");
        
        // Remove from incoming orders list
        setLocalOrders(orders.filter(o => o._id !== orderId));

        // Increment active orders for the assigned supervisor
        if (payload.kitchenSupervisorId) {
          const staff = getLocalStaff();
          const updatedStaff = staff.map(s => {
            if (s._id === payload.kitchenSupervisorId) {
              return { ...s, currentActiveOrders: (s.currentActiveOrders || 0) + 1 };
            }
            return s;
          });
          setLocalStaff(updatedStaff);
        }

        // Return updated order payload
        return {
          ...acceptedOrder,
          status: "confirmed",
          acceptedAt: new Date().toISOString(),
          estimatedPreparationTime: payload.estimatedPreparationTime,
          kitchenSupervisorId: payload.kitchenSupervisorId,
          priority: payload.priority,
          notes: payload.notes
        };
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["incomingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["activeSupervisors"] });
      
      toast.success("Order accepted successfully", {
        description: `Order ${data.orderNumber || "PVP"} has been sent to kitchen.`
      });
    },
    onError: (err) => {
      toast.error("Failed to accept order: " + err.message);
    }
  });
}

// Mutation to reject order
export function useRejectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, payload }) => {
      try {
        // If standalone mock is running, skip API call to prevent getting stubbed success
        if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
          throw new Error("Stand-alone mock simulation");
        }

        const response = await apiClient.patch(`/orders/${orderId}/reject`, payload);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        return response.data;
      } catch (err) {
        console.warn("Backend API unavailable. Processing rejection simulation locally.");
        
        // Simulate local DB update
        const orders = getLocalOrders();
        const rejectedOrder = orders.find(o => o._id === orderId);
        
        if (!rejectedOrder) throw new Error("Order not found");
        
        // Remove from incoming orders list
        setLocalOrders(orders.filter(o => o._id !== orderId));

        // Return cancelled details
        return {
          ...rejectedOrder,
          status: "cancelled",
          cancelReason: payload.cancelReason,
          refundStatus: payload.initiateRefund ? "initiated" : "not_applicable"
        };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incomingOrders"] });
      toast.success("Order cancelled successfully", {
        description: `Order ${data.orderNumber} status changed to Cancelled.`
      });
    },
    onError: (err) => {
      toast.error("Failed to cancel order: " + err.message);
    }
  });
}
