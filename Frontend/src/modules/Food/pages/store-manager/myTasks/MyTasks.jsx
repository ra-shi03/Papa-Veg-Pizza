import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ClipboardList, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";

// Queries and Mutations Hooks
import {
  useMyTasksQuery,
  useMyTaskStats,
  useTeamTasksQuery,
  useStartTaskMutation,
  useCompleteTaskMutation,
  useDelayReportMutation,
  useIngredientRequestMutation,
  useReassignRequestMutation,
  useReassignTaskMutation,
  useQualityCheckMutation,
} from "./hooks/useMyTasks";

// Components
import TaskStatsCards from "./components/TaskStatsCards";
import AssignedTasksTable from "./components/AssignedTasksTable";
import InProgressTaskCard from "./components/InProgressTaskCard";
import CompletedTasksTable from "./components/CompletedTasksTable";
import DelayedTasksTable from "./components/DelayedTasksTable";
import TaskHistoryTable from "./components/TaskHistoryTable";
import TeamTasksWidget from "./components/TeamTasksWidget";

// Modals
import StartTaskModal from "./modals/StartTaskModal";
import CompleteTaskModal from "./modals/CompleteTaskModal";
import DelayReportModal from "./modals/DelayReportModal";
import IngredientRequestModal from "./modals/IngredientRequestModal";
import ReassignRequestModal from "./modals/ReassignRequestModal";
import ReassignTaskModal from "./modals/ReassignTaskModal";
import QualityCheckModal from "./modals/QualityCheckModal";

export default function MyTasks() {
  // 1. Get role from layout context
  const { role = "kitchen_staff" } = useOutletContext();
  const isSupervisor = role === "kitchen_supervisor" || role === "store_manager";

  // 2. Fetch Tasks Data
  const { data: tasks = [], isLoading: tasksLoading } = useMyTasksQuery();
  const { data: stats = {}, isLoading: statsLoading } = useMyTaskStats();
  const { data: teamStats = {}, isLoading: teamStatsLoading } = useTeamTasksQuery();

  // 3. Tab State
  const [activeTab, setActiveTab] = useState("assigned"); // 'assigned', 'in_progress', 'completed', 'delayed', 'history'

  // 4. Modal and Selection State
  const [activeModal, setActiveModal] = useState(null); // 'start', 'complete', 'delay', 'ingredient', 'reassignRequest', 'reassignTask', 'qualityCheck'
  const [selectedTask, setSelectedTask] = useState(null);

  // 5. Mutations
  const startTaskMutation = useStartTaskMutation();
  const completeTaskMutation = useCompleteTaskMutation();
  const delayReportMutation = useDelayReportMutation();
  const ingredientRequestMutation = useIngredientRequestMutation();
  const reassignRequestMutation = useReassignRequestMutation();
  const reassignTaskMutation = useReassignTaskMutation();
  const qualityCheckMutation = useQualityCheckMutation();

  // Helper helper to open modal
  const openModal = (modalType, task) => {
    setSelectedTask(task);
    setActiveModal(modalType);
  };

  // Close helper
  const closeModal = () => {
    setActiveModal(null);
    setSelectedTask(null);
  };

  // Handler functions for mutations
  const handleStartTask = (taskId, notes) => {
    startTaskMutation.mutate(
      { id: taskId, notes },
      {
        onSuccess: () => {
          toast.success("Task started successfully! Go to In Progress tab.");
          closeModal();
        },
        onError: () => {
          toast.error("Failed to start task.");
        },
      }
    );
  };

  const handleCompleteTask = (taskId, payload) => {
    completeTaskMutation.mutate(
      { id: taskId, payload },
      {
        onSuccess: () => {
          toast.success("Task completed and logged! QA proof registered.");
          closeModal();
          setActiveTab("completed");
        },
        onError: () => {
          toast.error("Failed to complete task.");
        },
      }
    );
  };

  const handleReportDelay = (taskId, payload) => {
    delayReportMutation.mutate(
      { id: taskId, payload },
      {
        onSuccess: () => {
          toast.success("Delay reported to supervisor.");
          closeModal();
          setActiveTab("delayed");
        },
        onError: () => {
          toast.error("Failed to report delay.");
        },
      }
    );
  };

  const handleRequestIngredient = (payload) => {
    ingredientRequestMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Requested ${payload.quantity} ${payload.unit} of ${payload.ingredientName}.`);
        closeModal();
      },
      onError: () => {
        toast.error("Failed to submit ingredient request.");
      },
    });
  };

  const handleRequestReassign = (taskId, payload) => {
    reassignRequestMutation.mutate(
      { id: taskId, payload },
      {
        onSuccess: () => {
          toast.success(`Handoff request submitted to ${payload.preferredStaff}.`);
          closeModal();
        },
        onError: () => {
          toast.error("Failed to submit reassignment request.");
        },
      }
    );
  };

  const handleDirectReassign = (taskId, payload) => {
    reassignTaskMutation.mutate(
      { id: taskId, payload },
      {
        onSuccess: () => {
          toast.success(`Task reassigned directly to ${payload.assignedTo}.`);
          closeModal();
        },
        onError: () => {
          toast.error("Failed to reassign task.");
        },
      }
    );
  };

  const handleQualityCheck = (payload) => {
    qualityCheckMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Pizza quality check approved and logged in system!");
        closeModal();
      },
      onError: () => {
        toast.error("Failed to submit quality check.");
      },
    });
  };

  // Filter tasks locally by status
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const pendingTasks = safeTasks.filter((t) => t.status === "pending");
  const inProgressTasks = safeTasks.filter((t) => t.status === "in_progress");
  const completedTasks = safeTasks.filter((t) => t.status === "completed");
  const delayedTasks = safeTasks.filter((t) => t.status === "delayed");

  // Premium tab labels mapping
  const tabsConfig = [
    { id: "assigned", label: "Assigned Queue", count: pendingTasks.length, color: "bg-blue-500" },
    { id: "in_progress", label: "In Progress", count: inProgressTasks.length, color: "bg-rose-500" },
    { id: "completed", label: "Completed", count: completedTasks.length, color: "bg-emerald-500" },
    { id: "delayed", label: "Delayed Alerts", count: delayedTasks.length, color: "bg-amber-500" },
    { id: "history", label: "Fulfillment History", count: null, color: "bg-zinc-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <ClipboardList className="text-[var(--primary)]" />
            <span>Kitchen My Tasks</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
            Real-time station order queue, delay controls, and quality verification logs.
          </p>
        </div>

        {/* Quick action: request ingredient replenishment */}
        <button
          onClick={() => openModal("ingredient")}
          className="text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          Request Ingredients
        </button>
      </div>

      {/* 1. Bento Dashboard Stats Summary */}
      <TaskStatsCards stats={stats} loading={statsLoading} />

      {/* 2. Main Tabbed Layout and Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Central Tasks Panel */}
        <div className="lg:col-span-3 space-y-5">
          {/* Custom Tabs Navigation */}
          <div className="flex flex-wrap items-center bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-1.5 rounded-2xl shadow-sm gap-1">
            {tabsConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white text-[var(--primary)]" : "bg-zinc-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Tab Content Panel */}
          <div className="min-h-[300px]">
            {tasksLoading ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[300px] animate-pulse">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)] mb-3" />
                <span className="text-xs font-bold text-slate-500">Retrieving station tasks queue...</span>
              </div>
            ) : (
              <>
                {/* ASSIGNED/PENDING TAB */}
                {activeTab === "assigned" && (
                  <AssignedTasksTable
                    tasks={pendingTasks}
                    onStartTask={(t) => openModal("start", t)}
                  />
                )}

                {/* IN PROGRESS TAB */}
                {activeTab === "in_progress" && (
                  inProgressTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {inProgressTasks.map((task) => (
                        <InProgressTaskCard
                          key={task._id}
                          task={task}
                          onComplete={(t) => openModal("complete", t)}
                          onReportDelay={(t) => openModal("delay", t)}
                          onRequestIngredients={(t) => openModal("ingredient", t)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                      <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-950 text-slate-400 rounded-xl flex items-center justify-center border border-zinc-150 dark:border-zinc-800 mb-3">
                        <Layers size={18} />
                      </div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
                        No Active Work
                      </h3>
                      <p className="text-[10px] font-semibold text-slate-450 dark:text-zinc-555 mt-1 max-w-xs leading-normal">
                        No kitchen tasks are currently in progress. Go to the Assigned Queue to kick off a new task.
                      </p>
                    </div>
                  )
                )}

                {/* COMPLETED TAB */}
                {activeTab === "completed" && (
                  <CompletedTasksTable
                    tasks={completedTasks}
                    role={role}
                    onQualityCheck={(t) => openModal("qualityCheck", t)}
                  />
                )}

                {/* DELAYED TAB */}
                {activeTab === "delayed" && (
                  <DelayedTasksTable
                    tasks={delayedTasks}
                    role={role}
                    onResume={(t) => handleStartTask(t._id, "Resuming delayed task")}
                    onRequestReassign={(t) => openModal("reassignRequest", t)}
                    onReassign={(t) => openModal("reassignTask", t)}
                    onCancel={(t) => {
                      toast.info(`Task ${t._id} cancellation request submitted.`);
                    }}
                  />
                )}

                {/* HISTORICAL LOGS TAB */}
                {activeTab === "history" && (
                  <TaskHistoryTable tasks={safeTasks} />
                )}
              </>
            )}
          </div>
        </div>

        {/* 3. Conditional Supervisor Team Widget Sidebar */}
        {isSupervisor && (
          <div className="lg:col-span-1">
            <TeamTasksWidget
              teamStats={teamStats}
              loading={teamStatsLoading}
              onReassignClick={(t) => openModal("reassignTask", t)}
            />
          </div>
        )}
      </div>

      {/* 4. MODALS REGISTER */}
      
      {/* Start Task Modal */}
      <StartTaskModal
        isOpen={activeModal === "start"}
        task={selectedTask}
        onClose={closeModal}
        onConfirm={handleStartTask}
        loading={startTaskMutation.isPending}
      />

      {/* Complete Task Modal */}
      <CompleteTaskModal
        isOpen={activeModal === "complete"}
        task={selectedTask}
        onClose={closeModal}
        onConfirm={handleCompleteTask}
        loading={completeTaskMutation.isPending}
      />

      {/* Delay Report Modal */}
      <DelayReportModal
        isOpen={activeModal === "delay"}
        task={selectedTask}
        onClose={closeModal}
        onConfirm={handleReportDelay}
        loading={delayReportMutation.isPending}
      />

      {/* Ingredient Request Modal */}
      <IngredientRequestModal
        isOpen={activeModal === "ingredient"}
        onClose={closeModal}
        onConfirm={handleRequestIngredient}
        loading={ingredientRequestMutation.isPending}
      />

      {/* Reassign Request Modal (Staff only) */}
      <ReassignRequestModal
        isOpen={activeModal === "reassignRequest"}
        task={selectedTask}
        onClose={closeModal}
        onConfirm={handleRequestReassign}
        loading={reassignRequestMutation.isPending}
      />

      {/* Reassign Direct Modal (Supervisor only) */}
      <ReassignTaskModal
        isOpen={activeModal === "reassignTask"}
        task={selectedTask}
        onClose={closeModal}
        onConfirm={handleDirectReassign}
        loading={reassignTaskMutation.isPending}
      />

      {/* Quality Check Modal (Supervisor only) */}
      <QualityCheckModal
        isOpen={activeModal === "qualityCheck"}
        task={selectedTask}
        onClose={closeModal}
        onConfirm={handleQualityCheck}
        loading={qualityCheckMutation.isPending}
      />

    </div>
  );
}
