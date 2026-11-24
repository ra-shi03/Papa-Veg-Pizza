import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";

export default function useRiderSocket() {
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

    // Real-Time listeners
    socket.on("rider:online", ({ riderId, name }) => {
      const riderName = name || "A delivery partner";
      toast.success(`${riderName} is now online`, {
        description: "Rider is available for deliveries."
      });
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["riders"] });
      queryClient.invalidateQueries({ queryKey: ["rider", riderId] });
    });

    socket.on("rider:offline", ({ riderId, name }) => {
      const riderName = name || "A delivery partner";
      toast.error(`${riderName} went offline`, {
        description: "Rider has clocked out of shift."
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["riders"] });
      queryClient.invalidateQueries({ queryKey: ["rider", riderId] });
    });

    socket.on("rider:status-changed", ({ riderId, name, currentStatus }) => {
      const riderName = name || "A delivery partner";
      const statusText = currentStatus === "busy" ? "Busy" : "Idle";
      toast.info(`${riderName} is now ${statusText}`, {
        description: `Duty status updated successfully.`
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["riders"] });
      queryClient.invalidateQueries({ queryKey: ["rider", riderId] });
    });

    // Standalone Simulation
    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return {
    socketConnected
  };
}
