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
import { Eye, Truck, CheckCircle2, Megaphone, MoreVertical } from "lucide-react";
import { format } from "date-fns";

export function ShortagesTable({
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
  onTransfer,
  onResolve,
  onNotifyAdmin
}) {

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "low":
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-blue-700 dark:text-blue-405 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30 uppercase tracking-wider">
            Low
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-yellow-700 dark:text-yellow-405 bg-yellow-50 dark:bg-yellow-955/20 px-2.5 py-0.5 rounded-full border border-yellow-100 dark:border-yellow-900/30 uppercase tracking-wider">
            Medium
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-orange-700 dark:text-orange-405 bg-orange-50 dark:bg-orange-955/20 px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30 uppercase tracking-wider">
            High
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-955/20 px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-900/30 uppercase tracking-wider animate-pulse">
            Critical
          </span>
        );
      default:
        return <span className="capitalize">{severity}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-955/20 px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-900/30 uppercase tracking-wider animate-pulse">
            Active
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wider">
            Resolved
          </span>
        );
      default:
        return <span className="capitalize">{status}</span>;
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
    // 2. Shortage Quantity
    {
      accessorKey: "shortageQty",
      header: "Shortage Qty",
      cell: ({ row }) => {
        const item = row.original;
        // Large box uses 'Pcs', paneer/jalapenos use 'KG'
        const unit = item.ingredientId === "ing-013" ? "Pcs" : "KG";
        return (
          <span className="font-bold text-slate-800 dark:text-zinc-200">
            {item.shortageQty} {unit}
          </span>
        );
      },
      size: 110,
    },
    // 3. Affected Orders
    {
      accessorKey: "affectedOrders",
      header: "Affected Orders",
      cell: ({ row }) => {
        const value = row.getValue("affectedOrders") || 0;
        return (
          <span className="inline-flex items-center justify-center font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-900/30 text-[10px]">
            {value} Orders
          </span>
        );
      },
      size: 120,
    },
    // 4. Severity
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => getSeverityBadge(row.getValue("severity")),
      size: 110,
    },
    // 5. Status
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      size: 100,
    },
    // 6. Created At
    {
      accessorKey: "createdAt",
      header: "Detected At",
      cell: ({ row }) => (
        <span className="font-medium text-zinc-400">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      size: 160,
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
              <MoreVertical size={13} className="text-zinc-505" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl w-44 select-none">
              
              <DropdownMenuItem 
                onClick={() => onViewDetails(item._id)}
                className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={12} className="text-[var(--primary)]" />
                View Details
              </DropdownMenuItem>

              {isActive && isManager && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem 
                    onClick={() => onTransfer(item)}
                    className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer text-blue-650 dark:text-blue-400 focus:text-blue-650 dark:focus:text-blue-450"
                  >
                    <Truck size={12} />
                    Transfer Stock
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => onResolve(item)}
                    className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                  >
                    <CheckCircle2 size={12} />
                    Mark Resolved
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => onNotifyAdmin(item)}
                    className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer text-rose-600 dark:text-rose-455 focus:text-rose-600 dark:focus:text-rose-455"
                  >
                    <Megaphone size={12} />
                    Notify Admin
                  </DropdownMenuItem>
                </>
              )}

            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 80,
    }
  ], [role, onViewDetails, onTransfer, onResolve, onNotifyAdmin]);

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
      emptyMessage="No active shortages matching the query filters."
    />
  );
}
