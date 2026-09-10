import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";

export default function useIssueSocket() {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);
  const simulationIntervalRef = useRef(null);

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
    const isMock = import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL;
    if (isMock) {
      setSocketConnected(true);

      // Setup simulation intervals to add issues periodically
      let simulationTick = 0;
      simulationIntervalRef.current = setInterval(() => {
        simulationTick++;
        const currentIssues = queryClient.getQueryData(["delivery-issues"]);
        if (!currentIssues) return;

        if (simulationTick === 1) {
          // Simulate new issue report
          const mockNewIssue = {
            _id: `TKT-305`,
            orderId: "ORD-1026",
            riderId: "rider-2",
            riderName: "Amit Patel",
            issueType: "Customer Unreachable",
            description: "Doorbell is not working, phone switched off. Standing outside building.",
            reportedBy: "Rider",
            severity: "medium",
            status: "open",
            resolution: "",
            refundAmount: 0,
            penaltyAmount: 0,
            createdAt: new Date().toISOString()
          };

          queryClient.setQueryData(["delivery-issues"], (oldList) => {
            if (!Array.isArray(oldList)) return oldList;
            if (oldList.some(i => i._id === mockNewIssue._id)) return oldList;
            return [mockNewIssue, ...oldList];
          });

          // Insert timeline node
          queryClient.setQueryData(["delivery-timelines", "ORD-1026"], (oldTimeline = []) => {
            return [
              ...oldTimeline,
              {
                status: "issue_reported_customer_unreachable",
                updatedBy: "Rider Amit",
                timestamp: new Date().toISOString()
              }
            ];
          });

          toast.error("Simulated Event: New Exception Reported", {
            description: "Customer Unreachable on Order ORD-1026 reported by Rider.",
            duration: 6000
          });
        } else if (simulationTick === 2) {
          // Escalate TKT-301
          queryClient.setQueryData(["delivery-issues"], (oldList) => {
            if (!Array.isArray(oldList)) return oldList;
            return oldList.map(item => {
              if (item._id === "TKT-301") {
                return { ...item, status: "escalated", severity: "critical" };
              }
              return item;
            });
          });

          toast.warning("Simulated Event: Ticket Escalated", {
            description: "Ticket TKT-301 status changed to ESCALATED (Severity: Critical).",
            duration: 5000
          });
        }
      }, 15000); // Trigger simulation step every 15 seconds
    }

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
