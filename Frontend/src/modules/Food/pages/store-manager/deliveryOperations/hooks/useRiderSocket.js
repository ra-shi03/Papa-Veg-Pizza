import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";

export default function useRiderSocket() {
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
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);
    }

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return {
    socketConnected
  };
}
