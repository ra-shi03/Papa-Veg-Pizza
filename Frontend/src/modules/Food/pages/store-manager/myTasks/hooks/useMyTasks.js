import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { myTasksService } from "@food/api";

// Query keys constants
const QUERY_KEYS = {
  tasks: "myTasks",
  stats: "myTaskStats",
  teamTasks: "teamTasks",
  notifications: "notifications",
};

// 1. Hook to fetch assigned tasks
export function useMyTasksQuery() {
  return useQuery({
    queryKey: [QUERY_KEYS.tasks],
    queryFn: async () => {
      const res = await myTasksService.getMyTasks();
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (typeof res === "object") {
        if (res.data) {
          if (Array.isArray(res.data)) return res.data;
          if (typeof res.data === "object") {
            if (Array.isArray(res.data.tasks)) return res.data.tasks;
            if (Array.isArray(res.data.data)) return res.data.data;
          }
        }
        if (Array.isArray(res.tasks)) return res.tasks;
      }
      return [];
    },
    refetchInterval: 10000, // auto-refresh every 10 seconds for live order queue
  });
}

// 2. Hook to fetch stats
export function useMyTaskStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: async () => {
      const res = await myTasksService.getMyTaskStats();
      return res.success ? res.data : {};
    },
  });
}

// 3. Hook to fetch team tasks (Supervisor only)
export function useTeamTasksQuery() {
  return useQuery({
    queryKey: [QUERY_KEYS.teamTasks],
    queryFn: async () => {
      const res = await myTasksService.getTeamTasks();
      return res.success ? res.data : {};
    },
  });
}

// 4. Hook to fetch notifications
export function useNotifications() {
  return useQuery({
    queryKey: [QUERY_KEYS.notifications],
    queryFn: async () => {
      const res = await myTasksService.getNotifications();
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (typeof res === "object") {
        if (res.data) {
          if (Array.isArray(res.data)) return res.data;
          if (typeof res.data === "object") {
            if (Array.isArray(res.data.notifications)) return res.data.notifications;
            if (Array.isArray(res.data.data)) return res.data.data;
          }
        }
        if (Array.isArray(res.notifications)) return res.notifications;
      }
      return [];
    },
    refetchInterval: 15000,
  });
}

// Mutations layer
// 5. Start task
export function useStartTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }) => myTasksService.startTask(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamTasks] });
    },
  });
}

// 6. Complete task
export function useCompleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => myTasksService.completeTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamTasks] });
    },
  });
}

// 7. Report delay
export function useDelayReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => myTasksService.reportDelay(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamTasks] });
    },
  });
}

// 8. Request ingredient
export function useIngredientRequestMutation() {
  return useMutation({
    mutationFn: (payload) => myTasksService.requestIngredient(payload),
  });
}

// 9. Request reassignment (Staff only)
export function useReassignRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => myTasksService.requestReassignment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamTasks] });
    },
  });
}

// 10. Reassign task directly (Supervisor only)
export function useReassignTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => myTasksService.reassignTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamTasks] });
    },
  });
}

// 11. Submit quality check (Supervisor only)
export function useQualityCheckMutation() {
  return useMutation({
    mutationFn: (payload) => myTasksService.submitQualityCheck(payload),
  });
}

// 12. Mark notification read
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => myTasksService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
  });
}
