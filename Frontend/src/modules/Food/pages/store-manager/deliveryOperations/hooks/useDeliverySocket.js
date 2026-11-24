import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";

export default function useDeliverySocket(trackedOrderId = null) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);
  const simulationIntervalRef = useRef(null);
  const simStepRef = useRef({}); // Track steps per orderId

  useEffect(() => {
    const socket = storeSocket();   // the store panel's one signed-in socket

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
    
    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Simulation runner for active tracking order
  useEffect(() => {
    
    if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      return;

    // Reset step for this order if it doesn't exist
    
  }, [trackedOrderId, queryClient]);

  return {
    socketConnected
  };
}
