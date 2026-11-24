import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";

export default function useIssueSocket() {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);
  const simulationIntervalRef = useRef(null);

  useEffect(() => {
    const socket = storeSocket();   // the store panel's one signed-in socket

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Websocket issue events listeners
    socket.on("delivery:issue-created", ({ issue }) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-issues"] });
      toast.error(`New Exception Reported!`, {
        description: `${issue.issueType} on Order ${issue.orderId} by ${issue.reportedBy}`,
        duration: 5000,
      });
    });

    socket.on("delivery:issue-updated", ({ issueId, status }) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue-details", issueId] });
      toast.warning(`Exception Ticket Updated`, {
        description: `Ticket ${issueId} is now ${status.toUpperCase().replace(/_/g, " ")}`,
        duration: 4000,
      });
    });

    socket.on("delivery:issue-resolved", ({ issueId, resolution }) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue-details", issueId] });
      toast.success(`Exception Resolved!`, {
        description: `Ticket ${issueId} marked as resolved.`,
        duration: 5000,
      });
    });

    // Standalone Simulation
    
    

    return () => {
      socket.disconnect();
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [queryClient]);

  return {
    socketConnected
  };
}
