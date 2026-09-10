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
import { Eye, CheckCircle, Trash2, MoreVertical } from "lucide-react";
import { format } from "date-fns";

export function WasteTable({
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
  onApprove,
  onDelete
}) {

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const formatRupee = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);
  };

  const getWasteTypeBadge = (type) => {
    switch (type) {
      case "expired":
        return <span className="inline-flex items-center text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 rounded-full border border-red-150 dark:border-red-900/30 capitalize">Expired</span>;
      case "burnt":
        return <span className="inline-flex items-center text-[10px] font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-0.5 rounded-full border border-orange-150 dark:border-orange-900/30 capitalize">Burnt</span>;
      case "damaged":
        return <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-full border border-amber-150 dark:border-amber-900/30 capitalize">Damaged</span>;
      case "spillage":
        return <span className="inline-flex items-center text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full border border-blue-150 dark:border-blue-900/30 capitalize">Spillage</span>;
      default:
        return <span className="text-[10px] font-semibold">{type}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-150 dark:border-emerald-900/30 capitalize">Approved</span>;
      case "pending":
        return <span className="inline-flex items-center text-[10px] font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 px-2.5 py-0.5 rounded-full border border-yellow-150 dark:border-yellow-900/30 capitalize">Pending</span>;
      default:
        return <span className="text-[10px] font-semibold">{status}</span>;
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
      size: 180,
    },
    // 2. Quantity
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="font-bold text-slate-800 dark:text-zinc-200">
            {item.quantity} units
          </span>
        );
      },
      size: 100,
    },
    // 3. Waste Type
    {
      accessorKey: "wasteType",
      header: "Waste Type",
      cell: ({ row }) => getWasteTypeBadge(row.getValue("wasteType")),
      size: 110,
    },
    // 4. Loss Amount
    {
      accessorKey: "estimatedLoss",
      header: "Loss Amount",
      cell: ({ row }) => (
        <span className="font-black text-rose-600 dark:text-rose-400">
          {formatRupee(row.getValue("estimatedLoss"))}
        </span>
      ),
      size: 120,
    },
    // 5. Reported By
    {
      accessorKey: "reportedBy",
      header: "Reported By",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700 dark:text-zinc-300">
          {row.getValue("reportedBy")}
        </span>
      ),
      size: 120,
    },
    // 6. Date
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="font-medium text-zinc-400">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      size: 160,
    },
    // 7. Status
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      size: 100,
    },
    // 8. Actions dropdown
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        const isManager = role === "store_manager";
        const isPending = item.status === "pending";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-7 w-7 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 outline-none bg-white dark:bg-zinc-900 cursor-pointer">
              <MoreVertical size={13} className="text-zinc-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl w-36 select-none">
              
              <DropdownMenuItem 
                onClick={() => onViewDetails(item._id)}
                className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={12} className="text-[var(--primary)]" />
                View Details
              </DropdownMenuItem>

              {isManager && isPending && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem 
                    onClick={() => onApprove(item._id)}
                    className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                  >
                    <CheckCircle size={12} />
                    Approve Waste
                  </DropdownMenuItem>
                </>
              )}

              {isManager && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem 
                    onClick={() => onDelete(item._id)}
                    className="text-xs font-semibold py-1.5 flex items-center gap-1.5 cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                  >
                    <Trash2 size={12} />
                    Delete Record
                  </DropdownMenuItem>
                </>
              )}

            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 80,
    }
  ], [role, onViewDetails, onApprove, onDelete]);

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
      emptyMessage="No waste logs match the query filters."
    />
  );
}
