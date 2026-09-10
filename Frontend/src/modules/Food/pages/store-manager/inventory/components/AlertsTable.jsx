import React, { useMemo } from "react";
import { DataTable } from "./DataTable";
import { Checkbox } from "@food/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@food/components/ui/dropdown-menu";
import { Eye, CheckCircle, FilePlus, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";

export function AlertsTable({
  data = [],
  isLoading = false,
  role = "store_manager",
  rowSelection = {},
  onRowSelectionChange,
  sorting = [],
  onSortingChange,
  columnVisibility = {},
  onColumnVisibilityChange,
  onViewDetails,
  onResolve,
  onCreateRequest
}) {

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const columns = useMemo(() => [
    // 0. Row Selection Checkbox
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] rounded-md border border-zinc-350 bg-white dark:bg-zinc-950 dark:border-zinc-800 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] rounded-md border border-zinc-350 bg-white dark:bg-zinc-950 dark:border-zinc-800 cursor-pointer"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    // 1. Ingredient
    {
      accessorKey: "ingredientName",
      header: "Ingredient",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col select-none">
            <span className="font-bold text-slate-900 dark:text-white">{item.ingredientName}</span>
            <span className="text-[10px] text-zinc-400 font-medium mt-0.5">{item.ingredientId}</span>
          </div>
        );
      },
      size: 200,
    },
    // 2. Alert Type
    {
      accessorKey: "alertType",
      header: "Alert Type",
      cell: ({ row }) => (
        <span className="inline-flex items-center text-[10px] font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full capitalize">
          {row.getValue("alertType") ? row.getValue("alertType").replace("_", " ") : "Low Stock"}
        </span>
      ),
      size: 110,
    },
    // 3. Stock Level
    {
      id: "stockLevels",
      header: "Current / Min Stock",
      cell: ({ row }) => {
        const item = row.original;
        const percent = item.minimumStock > 0 
          ? Math.round((item.currentStock / item.minimumStock) * 100)
          : 0;

        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              {item.currentStock} / {item.minimumStock}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-12 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    percent < 40 ? "bg-rose-500" : percent < 70 ? "bg-amber-500" : "bg-blue-500"
                  }`} 
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <span className={`text-[9px] font-bold ${
                percent < 40 ? "text-rose-500" : percent < 70 ? "text-amber-500" : "text-blue-500"
              }`}>
                {percent}%
              </span>
            </div>
          </div>
        );
      },
      size: 150,
    },
    // 4. Severity
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => <SeverityBadge severity={row.getValue("severity")} />,
      size: 100,
    },
    // 5. Date Generated
    {
      accessorKey: "createdAt",
      header: "Date Generated",
      cell: ({ row }) => (
        <span className="font-medium text-zinc-400">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      size: 160,
    },
    // 6. Status
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      size: 100,
    },
    // 7. Actions dropdown
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        const isActive = item.status === "active";
        const isManager = role === "store_manager";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-7 w-7 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 outline-none bg-white dark:bg-zinc-900 cursor-pointer">
              <MoreVertical size={13} className="text-zinc-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl w-44 select-none">
              
              <DropdownMenuItem 
                onClick={() => onViewDetails(item._id)}
                className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={12} className="text-[var(--primary)]" />
                View Details
              </DropdownMenuItem>

              {isActive && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem 
                    onClick={() => onCreateRequest(item)}
                    className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-600 dark:focus:text-blue-400"
                  >
                    <FilePlus size={12} />
                    Raise Stock Request
                  </DropdownMenuItem>
                </>
              )}

              {isActive && isManager && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem 
                    onClick={() => onResolve(item._id)}
                    className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                  >
                    <CheckCircle size={12} />
                    Resolve Alert
                  </DropdownMenuItem>
                </>
              )}

            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 80,
    }
  ], [role, onViewDetails, onResolve, onCreateRequest]);

  return (
    <DataTable 
      data={data}
      columns={columns}
      isLoading={isLoading}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      emptyMessage="No inventory alerts match the query filters."
    />
  );
}
