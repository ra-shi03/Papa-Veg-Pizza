import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";

export default function useSocketAssignment() {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    const socket = storeSocket();   // the store panel's one signed-in socket

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
