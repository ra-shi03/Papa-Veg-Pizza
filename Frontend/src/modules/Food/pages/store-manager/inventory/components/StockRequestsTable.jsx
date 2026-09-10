import React, { useMemo } from "react";
import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import { Checkbox } from "@food/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@food/components/ui/dropdown-menu";
import { Eye, CheckCircle, XOctagon, Truck, MoreVertical } from "lucide-react";
import { format } from "date-fns";

export function StockRequestsTable({
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
  onReject,
  onFulfill
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
    // 1. Request Number
    {
      accessorKey: "requestNo",
      header: "Request No",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col select-none">
            <span className="font-bold text-slate-900 dark:text-white">{item.requestNo}</span>
            <span className="text-[10px] text-zinc-400 font-medium mt-0.5">{item._id}</span>
          </div>
        );
      },
      size: 150,
    },
    // 2. Date Created
    {
      accessorKey: "createdAt",
      header: "Date Raised",
      cell: ({ row }) => (
        <span className="font-medium text-zinc-400">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      size: 160,
    },
    // 3. Ingredient Name
    {
      accessorKey: "ingredientName",
      header: "Ingredient",
      cell: ({ row }) => (
        <span className="font-bold text-slate-800 dark:text-zinc-200">{row.getValue("ingredientName")}</span>
      ),
      size: 180,
    },
    // 4. Requested Qty
    {
      accessorKey: "requestedQty",
      header: "Requested Qty",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="font-semibold text-slate-700 dark:text-zinc-350">
            {item.requestedQty}
          </span>
        );
      },
      size: 110,
    },
    // 5. Approved Qty
    {
      accessorKey: "approvedQty",
      header: "Approved Qty",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="font-semibold text-slate-750 dark:text-zinc-300">
            {item.status === "pending" || item.status === "rejected" ? "-" : item.approvedQty}
          </span>
        );
      },
      size: 110,
    },
    // 6. Urgency Level
    {
      accessorKey: "urgency",
      header: "Urgency",
      cell: ({ row }) => <UrgencyBadge urgency={row.getValue("urgency")} />,
      size: 110,
    },
    // 7. Status
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      size: 120,
    },
    // 8. Requested By
    {
      accessorKey: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => (
        <span className="font-medium text-zinc-400">{row.getValue("requestedBy")}</span>
      ),
      size: 130,
    },
    // 9. Actions Column
    {
      id: "actions",
      header: () => <span className="text-right block w-full pr-3">Actions</span>,
      cell: ({ row }) => {
        const item = row.original;
        const isPending = item.status === "pending";
        const isApproved = item.status === "approved";
        
        return (
          <div className="text-right pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer inline-block outline-none">
                <MoreVertical size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl w-48 shadow-lg select-none">
                <DropdownMenuLabel className="text-[10px] font-bold text-zinc-400 uppercase py-1.5 px-2.5">Controls</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                
                {/* 1. View Details (All roles) */}
                <DropdownMenuItem 
                  onClick={() => onViewDetails(item._id)}
                  className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-zinc-850"
                >
                  <Eye size={14} className="text-indigo-500" />
                  View Details
                </DropdownMenuItem>

                {/* 2. Manager Actions (Approve / Reject) */}
                {role === "store_manager" && isPending && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => onApprove(item._id)}
                      className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-zinc-850 text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle size={14} className="text-emerald-500" />
                      Approve Request
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onReject(item._id)}
                      className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-zinc-850 text-rose-600 dark:text-rose-400"
                    >
                      <XOctagon size={14} className="text-rose-500" />
                      Reject Request
                    </DropdownMenuItem>
                  </>
                )}

                {/* 3. Manager Action (Fulfill) */}
                {role === "store_manager" && isApproved && (
                  <DropdownMenuItem 
                    onClick={() => onFulfill(item._id)}
                    className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-zinc-850 text-indigo-650 dark:text-indigo-400"
                  >
                    <Truck size={14} className="text-indigo-500" />
                    Fulfill Request
                  </DropdownMenuItem>
                )}

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 80,
    }
  ], [role, onViewDetails, onApprove, onReject, onFulfill]);

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
      emptyMessage="No stock requests matching filter criteria."
    />
  );
}
