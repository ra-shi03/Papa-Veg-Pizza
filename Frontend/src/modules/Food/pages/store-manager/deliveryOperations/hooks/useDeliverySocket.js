import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";

export default function useDeliverySocket(trackedOrderId = null) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);
  const simulationIntervalRef = useRef(null);
  const simStepRef = useRef({}); // Track steps per orderId

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

    // Handle location updates
    const handleLocationUpdate = ({ orderId, latitude, longitude, speed, timestamp }) => {
      // Update tracking query data
      queryClient.setQueryData(["tracking", orderId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          rider: {
            ...oldData.rider,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            speed: speed !== undefined ? speed : oldData.rider?.speed,
            lastUpdated: timestamp || new Date().toISOString()
          }
        };
      });
    };

    // Handle delivery status/progress updates
    const handleDeliveryProgress = ({ orderId, deliveryStatus }) => {
      // Invalidate live deliveries list
      queryClient.invalidateQueries({ queryKey: ["live-deliveries"] });

      // Update tracking query data directly
      queryClient.setQueryData(["tracking", orderId], (oldData) => {
        if (!oldData) return oldData;
        const newTimeline = { ...oldData.timeline };
        const nowStr = new Date().toISOString();

        if (deliveryStatus === "accepted") newTimeline.acceptedAt = nowStr;
        else if (deliveryStatus === "picked_up") newTimeline.pickupAt = nowStr;
        else if (deliveryStatus === "out_for_delivery") newTimeline.outForDeliveryAt = nowStr;
        else if (deliveryStatus === "delivered") newTimeline.deliveredAt = nowStr;

        // Also update status badge in table list
        queryClient.setQueryData(["live-deliveries"], (oldList) => {
          if (!Array.isArray(oldList)) return oldList;
          return oldList.map(item => {
            if (item.orderId === orderId) {
              return {
                ...item,
                deliveryStatus,
                eta: deliveryStatus === "delivered" ? "Delivered" : item.eta
              };
            }
            return item;
          });
        });

        return {
          ...oldData,
          timeline: newTimeline,
          order: {
            ...oldData.order,
            status: deliveryStatus
          }
        };
      });

      // Show toast
      const readableStatus = deliveryStatus.replace(/_/g, " ").toUpperCase();
      toast.info(`Order ${orderId} Status Update`, {
        description: `Delivery status changed to: ${readableStatus}`,
        duration: 5000,
      });
    };

    socket.on("rider:location-update", handleLocationUpdate);
    socket.on("order:delivery-progress", handleDeliveryProgress);

    // Standalone Simulation
    const isMock = import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL;
    if (isMock) {
      setSocketConnected(true);
    }

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Simulation runner for active tracking order
  useEffect(() => {
    const isMock = import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL;
    if (!isMock || !trackedOrderId) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      return;
    }

    // Reset step for this order if it doesn't exist
    if (simStepRef.current[trackedOrderId] === undefined) {
      simStepRef.current[trackedOrderId] = 0;
    }

    // Clear existing interval
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    // Start simulation loop (every 5 seconds)
    simulationIntervalRef.current = setInterval(() => {
      const currentOrderData = queryClient.getQueryData(["tracking", trackedOrderId]);
      if (!currentOrderData) return;

      const storeCoords = currentOrderData.store || { latitude: 22.7432, longitude: 75.8970 };
      const destCoords = currentOrderData.customer || { latitude: 22.7513, longitude: 75.8953 };

      const step = simStepRef.current[trackedOrderId];
      const maxSteps = 12; // 60 seconds total simulation path

      if (step >= maxSteps) {
        // Mark as Delivered if it wasn't already
        const statusList = ["assigned", "accepted", "picked_up", "out_for_delivery", "delivered"];
        const currentStatus = currentOrderData.order?.status || "out_for_delivery";
        
        if (currentStatus !== "delivered") {
          // Trigger progress update
          queryClient.invalidateQueries({ queryKey: ["live-deliveries"] });
          queryClient.setQueryData(["tracking", trackedOrderId], (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              timeline: {
                ...oldData.timeline,
                deliveredAt: new Date().toISOString()
              },
              order: {
                ...oldData.order,
                status: "delivered"
              },
              rider: {
                ...oldData.rider,
                latitude: parseFloat(destCoords.latitude),
                longitude: parseFloat(destCoords.longitude),
                speed: 0
              }
            };
          });

          // Update main list
          queryClient.setQueryData(["live-deliveries"], (oldList) => {
            if (!Array.isArray(oldList)) return oldList;
            return oldList.map(item => {
              if (item.orderId === trackedOrderId) {
                return { ...item, deliveryStatus: "delivered", eta: "Delivered" };
              }
              return item;
            });
          });

          toast.success(`Order ${trackedOrderId} Delivered!`, {
            description: "Rider has successfully delivered the pizza to customer.",
            duration: 6000
          });
        }

        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
        return;
      }

      // Calculate path interpolation
      const progress = step / maxSteps;
      const nextLat = parseFloat(storeCoords.latitude) + (parseFloat(destCoords.latitude) - parseFloat(storeCoords.latitude)) * progress;
      const nextLng = parseFloat(storeCoords.longitude) + (parseFloat(destCoords.longitude) - parseFloat(storeCoords.longitude)) * progress;
      
      const speed = Math.floor(25 + Math.random() * 20); // fluctuate speed
      
      // Update coordinates
      queryClient.setQueryData(["tracking", trackedOrderId], (oldData) => {
        if (!oldData) return oldData;
        
        // Progress status if it's currently at "assigned" or "accepted"
        let newStatus = oldData.order?.status || "assigned";
        const newTimeline = { ...oldData.timeline };
        const nowStr = new Date().toISOString();

        if (step === 1 && newStatus === "assigned") {
          newStatus = "accepted";
          newTimeline.acceptedAt = nowStr;
        } else if (step === 3 && newStatus === "accepted") {
          newStatus = "picked_up";
          newTimeline.pickupAt = nowStr;
        } else if (step === 5 && newStatus === "picked_up") {
          newStatus = "out_for_delivery";
          newTimeline.outForDeliveryAt = nowStr;
        }

        // Show status transition toasts during simulation
        if (newStatus !== oldData.order?.status) {
          toast.info(`Simulated: Order ${trackedOrderId} status updated`, {
            description: `Delivery status: ${newStatus.replace(/_/g, " ").toUpperCase()}`,
            duration: 4000
          });
          queryClient.invalidateQueries({ queryKey: ["live-deliveries"] });
        }

        return {
          ...oldData,
          timeline: newTimeline,
          order: {
            ...oldData.order,
            status: newStatus
          },
          rider: {
            ...oldData.rider,
            latitude: nextLat,
            longitude: nextLng,
            speed: newStatus === "delivered" ? 0 : speed,
            lastUpdated: nowStr
          }
        };
      });

      // Increment step
      simStepRef.current[trackedOrderId] = step + 1;
    }, 5000);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [trackedOrderId, queryClient]);

  return {
    socketConnected
  };
}
