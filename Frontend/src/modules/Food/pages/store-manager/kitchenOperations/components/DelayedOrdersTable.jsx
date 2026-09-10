import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender
} from "@tanstack/react-table";
import { Tooltip } from "antd";
import {
  Clock,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  CheckCircle,
  ExternalLink,
  ChefHat,
  ShieldAlert,
  ListCollapse
} from "lucide-react";
import { getStaffName } from "../hooks/useDelayedOrders";
import { mockChefs, mockStaff, mockPackagingStaff } from "../mockData";

export default function DelayedOrdersTable({
  data = [],
  isLoading,
  onOpenTimeline,
  onOpenEscalate,
  onOpenReassign,
  onOpenNotify,
  onOpenResolve
}) {
  const safeData = Array.isArray(data) ? data : [];

  // Look up staff info
  const getStaffData = (staffId) => {
    if (!staffId) return null;
    const allStaff = [...mockChefs, ...mockStaff, ...mockPackagingStaff];
    return allStaff.find((s) => s._id === staffId);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      return new Date(timeStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return "-";
    }
  };

  // Define columns for TanStack Table
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Order ID",
        cell: (info) => (
          <span className="text-[var(--primary)] font-black flex items-center gap-0.5">
            #{info.getValue()}
            <ExternalLink size={9} className="text-slate-400" />
          </span>
        )
      },
      {
        accessorKey: "customer",
        header: "Customer",
        cell: (info) => {
          const customer = info.getValue() || {};
          return (
            <div className="space-y-0.5">
              <div className="font-extrabold text-slate-800 dark:text-zinc-200">{customer.name}</div>
              <div className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">{customer.phone}</div>
            </div>
          );
        }
      },
      {
        accessorKey: "status",
        header: "Current Stage",
        cell: (info) => {
          const status = info.getValue() || "";
          let badgeColor = "bg-slate-50 text-slate-700 dark:bg-zinc-850 dark:text-zinc-400 border-slate-100 dark:border-zinc-800";
          if (status.toLowerCase() === "preparing") {
            badgeColor = "bg-orange-50 text-orange-700 dark:bg-orange-950/15 dark:text-orange-400 border-orange-100/50 dark:border-orange-900/30";
          } else if (status.toLowerCase() === "baking") {
            badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/15 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30";
          } else if (status.toLowerCase() === "packaging") {
            badgeColor = "bg-purple-50 text-purple-700 dark:bg-purple-950/15 dark:text-purple-400 border-purple-100/50 dark:border-purple-900/30";
          } else if (status.toLowerCase() === "ready") {
            badgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/15 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30";
          }
          return (
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeColor}`}>
              {status}
            </span>
          );
        }
      },
      {
        accessorKey: "assigned_staff",
        header: "Assigned Staff",
        cell: (info) => {
          const staffId = info.getValue();
          const staffMember = getStaffData(staffId);
          if (staffMember) {
            return (
              <div className="flex items-center gap-1.5">
                <img
                  src={staffMember.avatar}
                  alt={staffMember.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-800"
                />
                <span className="text-[10px] truncate max-w-[90px] font-extrabold">{staffMember.name}</span>
              </div>
            );
          }
          return (
            <span className="text-slate-400 flex items-center gap-1 text-[10px] font-bold">
              <ChefHat size={10} />
              Unassigned
            </span>
          );
        }
      },
      {
        accessorKey: "delay_duration",
        header: "Delay",
        cell: (info) => {
          const delay = info.getValue() || 0;
          const isCritical = delay > 20;
          return (
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                isCritical
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-150 dark:border-rose-900/40 animate-pulse"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/10 dark:text-amber-400 border-amber-100 dark:border-amber-900/20"
              }`}
            >
              {delay} min
            </span>
          );
        }
      },
      {
        accessorKey: "expectedReadyTime",
        header: "Expected Ready",
        cell: (info) => (
          <span className="text-slate-500 font-bold text-[10px]">{formatTime(info.getValue())}</span>
        )
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: (info) => {
          const priority = info.getValue() || "NORMAL";
          let color = "bg-slate-50 text-slate-700 border-slate-100 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-800";
          if (priority === "VIP") {
            color = "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/15 dark:text-amber-400 dark:border-amber-900/30";
          } else if (priority === "EXPRESS") {
            color = "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/15 dark:text-rose-400 dark:border-rose-900/30";
          }
          return (
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${color}`}>
              {priority}
            </span>
          );
        }
      },
      {
        accessorKey: "reason",
        header: "Reason / Issue",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="text-rose-600 dark:text-rose-455 font-black text-[10px]">
              {val || "High Order Volume"}
            </span>
          );
        }
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex justify-end items-center gap-1.5">
              {/* Timeline */}
              <Tooltip title="View SLA Timeline">
                <button
                  onClick={() => onOpenTimeline(order)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-650 dark:text-zinc-350 rounded-xl cursor-pointer transition-all border border-slate-200/50 dark:border-zinc-850"
                >
                  <ListCollapse size={12} />
                </button>
              </Tooltip>

              {/* Escalate */}
              <Tooltip title="Escalate Delay">
                <button
                  onClick={() => onOpenEscalate(order)}
                  className="w-7 h-7 flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer transition-all border border-rose-100/50 dark:border-rose-900/20"
                >
                  <ShieldAlert size={12} />
                </button>
              </Tooltip>

              {/* Reassign Staff */}
              <Tooltip title="Reassign Staff">
                <button
                  onClick={() => onOpenReassign(order)}
                  className="w-7 h-7 flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl cursor-pointer transition-all border border-blue-100/50 dark:border-blue-900/20"
                >
                  <UserCheck size={12} />
                </button>
              </Tooltip>

              {/* Notify Customer */}
              <Tooltip title="Notify Customer">
                <button
                  onClick={() => onOpenNotify(order)}
                  className="w-7 h-7 flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-xl cursor-pointer transition-all border border-amber-100/50 dark:border-amber-900/20"
                >
                  <MessageSquare size={12} />
                </button>
              </Tooltip>

              {/* Resolve Issue */}
              <Tooltip title="Resolve Issue">
                <button
                  onClick={() => onOpenResolve(order)}
                  className="w-7 h-7 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-xl cursor-pointer transition-all border border-emerald-100/50 dark:border-emerald-900/20"
                >
                  <CheckCircle size={12} />
                </button>
              </Tooltip>
            </div>
          );
        }
      }
    ],
    [onOpenTimeline, onOpenEscalate, onOpenReassign, onOpenNotify, onOpenResolve]
  );

  // TanStack table initialization
  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 w-full">
      {/* Desktop/Tablet Table Layout */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-xs table-auto">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px]"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3.5 px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-28" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-20" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-24" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-12" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-14" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-14" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-32 ml-auto" /></td>
                </tr>
              ))
            ) : safeData.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-12 text-center text-slate-400 dark:text-zinc-550 font-black text-sm"
                >
                  No delayed orders found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout Fallback */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850 p-1">
        {isLoading ? (
          [1, 2].map((n) => (
            <div key={n} className="p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-20" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-14" />
              </div>
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-32" />
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" />
              <div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-full" />
            </div>
          ))
        ) : safeData.length === 0 ? (
          <div className="py-12 text-center text-slate-450 dark:text-zinc-550 font-black text-xs">
            No delayed orders found.
          </div>
        ) : (
          safeData.map((order) => {
            const staffMember = getStaffData(order.assigned_staff);
            const isCritical = order.delay_duration > 20;
            return (
              <div key={order._id} className="p-4 space-y-3 font-bold">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[var(--primary)] font-black text-sm">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">
                      ({order.customer.name})
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      order.priority === "VIP"
                        ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                        : order.priority === "EXPRESS"
                        ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {order.priority}
                  </span>
                </div>

                {/* Body info */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-zinc-400">
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Stage</span>
                    <span className="font-extrabold uppercase text-slate-800 dark:text-zinc-200">
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Delay</span>
                    <span className={`font-black ${isCritical ? "text-rose-500 animate-pulse" : "text-amber-500"}`}>
                      {order.delay_duration} min
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Assigned Staff</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200 truncate block max-w-[100px]">
                      {staffMember ? staffMember.name : "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Bottleneck</span>
                    <span className="font-black text-rose-600 dark:text-rose-455">
                      {order.reason || "High Order Volume"}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex justify-between items-center gap-1.5 border-t border-slate-50 dark:border-zinc-850 pt-2.5">
                  <span className="text-[10px] text-[var(--primary)] font-black">
                    Value: ₹{order.grandTotal}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenTimeline(order)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-zinc-850 text-slate-650 dark:text-zinc-350 rounded-xl border border-slate-200/50"
                    >
                      <ListCollapse size={11} />
                    </button>
                    <button
                      onClick={() => onOpenEscalate(order)}
                      className="w-7 h-7 flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100/50"
                    >
                      <ShieldAlert size={11} />
                    </button>
                    <button
                      onClick={() => onOpenReassign(order)}
                      className="w-7 h-7 flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50"
                    >
                      <UserCheck size={11} />
                    </button>
                    <button
                      onClick={() => onOpenNotify(order)}
                      className="w-7 h-7 flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 rounded-xl border border-amber-100/50"
                    >
                      <MessageSquare size={11} />
                    </button>
                    <button
                      onClick={() => onOpenResolve(order)}
                      className="w-7 h-7 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 rounded-xl border border-emerald-100/50"
                    >
                      <CheckCircle size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
