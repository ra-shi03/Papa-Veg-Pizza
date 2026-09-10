import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";

export default function useSocketAssignment() {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    setSocketInstance(socket);

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Real-Time Socket Listeners
    socket.on("store:assignment-success", ({ orderId, riderId }) => {
      toast.success("Rider Assignment Active!", {
        description: `Rider successfully assigned to Order ${orderId}`,
      });
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["ready-orders"] });
      queryClient.invalidateQueries({ queryKey: ["available-riders"] });
    });

    // Standalone Simulation
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);
    }

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const emitNewAssignment = (orderId, riderId) => {
    if (socketInstance && socketConnected) {
      socketInstance.emit("rider:new-assignment", { orderId, riderId });
    }
  };

  return {
    socketConnected,
    emitNewAssignment
  };
}
