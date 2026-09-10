import React, { useState } from "react";
import { Inbox, CheckSquare, Flame, AlertTriangle } from "lucide-react";
import QueueColumn from "./QueueColumn";

export default function QueueBoard({
  orders = [],
  isLoading,
  chefs = [],
  onAccept,
  onOpenAssignChef,
  onOpenRejectItem,
  onOpenDetails,
  onMarkPreparing
}) {
  // 1. New Orders: status === "confirmed"
  const newOrders = orders.filter((o) => o.status === "confirmed");

  // 2. Accepted Orders: status === "queued"
  const acceptedOrders = orders.filter((o) => o.status === "queued");

  // 3. Priority Orders: priority === "VIP" or priority === "EXPRESS" (and status confirmed/queued/preparing)
  const priorityOrders = orders.filter(
    (o) => (o.priority === "VIP" || o.priority === "EXPRESS") && ["confirmed", "queued", "preparing"].includes(o.status)
  );

  // 4. Delayed Orders: waiting_time > sla_minutes (and status === "queued")
  const delayedOrders = orders.filter((o) => {
    if (o.status !== "queued" || !o.queueEntryTime) return false;
    const waiting = Math.floor((new Date() - new Date(o.queueEntryTime)) / 60000);
    const sla = o.sla_minutes || 20;
    return waiting > sla;
  });

  // Mobile navigation tabs state
  const [activeMobileTab, setActiveMobileTab] = useState("new");

  const columnConfig = [
    {
      id: "new",
      title: "New Orders",
      icon: Inbox,
      orders: newOrders,
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
    },
    {
      id: "accepted",
      title: "Accepted Orders",
      icon: CheckSquare,
      orders: acceptedOrders,
      badgeColor: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
    },
    {
      id: "priority",
      title: "Priority Orders",
      icon: Flame,
      orders: priorityOrders,
      badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 animate-pulse"
    },
    {
      id: "delayed",
      title: "Delayed Orders",
      icon: AlertTriangle,
      orders: delayedOrders,
      badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Mobile Tab Selectors (only visible below MD breakpoint) */}
      <div className="flex md:hidden bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200/50 dark:border-zinc-850">
        {columnConfig.map((col) => {
          const Icon = col.icon;
          const isActive = activeMobileTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileTab(col.id)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-sm"
                  : "text-slate-500 dark:text-zinc-550 hover:text-slate-700"
              }`}
            >
              <Icon size={14} />
              <span>{col.title.split(" ")[0]} ({col.orders.length})</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Column Layout (Grid layout) */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columnConfig.map((col) => (
          <QueueColumn
            key={col.id}
            title={col.title}
            icon={col.icon}
            orders={col.orders}
            isLoading={isLoading}
            chefs={chefs}
            badgeColor={col.badgeColor}
            onAccept={onAccept}
            onOpenAssignChef={onOpenAssignChef}
            onOpenRejectItem={onOpenRejectItem}
            onOpenDetails={onOpenDetails}
            onMarkPreparing={onMarkPreparing}
          />
        ))}
      </div>

      {/* Mobile Single Column View */}
      <div className="block md:hidden">
        {columnConfig
          .filter((col) => col.id === activeMobileTab)
          .map((col) => (
            <QueueColumn
              key={col.id}
              title={col.title}
              icon={col.icon}
              orders={col.orders}
              isLoading={isLoading}
              chefs={chefs}
              badgeColor={col.badgeColor}
              onAccept={onAccept}
              onOpenAssignChef={onOpenAssignChef}
              onOpenRejectItem={onOpenRejectItem}
              onOpenDetails={onOpenDetails}
              onMarkPreparing={onMarkPreparing}
            />
          ))}
      </div>
    </div>
  );
}
