import React, { useMemo } from "react";
import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import { Checkbox } from "@food/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@food/components/ui/dropdown-menu";
import { Eye, History, RefreshCw, MoreVertical, ShieldAlert } from "lucide-react";

export function IngredientsTable({
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
  onUpdateStock,
  onViewHistory
}) {

  // Dynamic status color highlight for stock cells
  const getStockColorClass = (stock, reorder) => {
    if (stock === 0) return "text-rose-600 dark:text-rose-400 font-black";
    if (stock <= reorder) return "text-amber-600 dark:text-amber-400 font-bold";
    return "text-slate-900 dark:text-white font-semibold";
  };

  // Indian Rupee currency format helper
  const formatRupee = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(val);
  };

  // Table Columns Definitions
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
    // 1. Ingredient Name
    {
      accessorKey: "ingredientName",
      header: "Ingredient",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col select-none">
            <span className="font-bold text-slate-900 dark:text-white">{item.ingredientName}</span>
            <span className="text-[10px] text-zinc-400 font-medium mt-0.5">{item._id}</span>
          </div>
        );
      },
      size: 220,
    },
    // 2. Category
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span className="font-semibold text-zinc-500 dark:text-zinc-400">{row.getValue("category")}</span>,
      size: 130,
    },
    // 3. Current Stock
    {
      accessorKey: "currentStock",
      header: "Current Stock",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className={getStockColorClass(item.currentStock, item.reorderLevel)}>
            {item.currentStock}
          </span>
        );
      },
      size: 120,
    },
    // 4. Unit
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => <span className="text-zinc-400 font-medium uppercase text-[10px]">{row.getValue("unit")}</span>,
      size: 90,
    },
    // 5. Minimum Stock
    {
      accessorKey: "minimumStock",
      header: "Min Stock",
      cell: ({ row }) => <span className="font-semibold text-zinc-500">{row.getValue("minimumStock")}</span>,
      size: 100,
    },
    // 6. Reorder Level
    {
      accessorKey: "reorderLevel",
      header: "Reorder Lvl",
      cell: ({ row }) => <span className="font-semibold text-zinc-500">{row.getValue("reorderLevel")}</span>,
      size: 100,
    },
    // 7. Cost
    {
      accessorKey: "costPerUnit",
      header: "Cost Per Unit",
      cell: ({ row }) => <span className="font-black text-slate-800 dark:text-zinc-200">{formatRupee(row.getValue("costPerUnit"))}</span>,
      size: 120,
    },
    // 8. Status
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      size: 120,
    },
    // 9. Updated By
    {
      accessorKey: "lastUpdatedBy",
      header: "Updated By",
      cell: ({ row }) => <span className="font-medium text-zinc-400">{row.getValue("lastUpdatedBy")}</span>,
      size: 120,
    },
    // 10. Last Updated Date
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedAt"));
        return (
          <span className="font-medium text-zinc-400">
            {date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        );
      },
      size: 140,
    },
    // 11. Row Actions Dropdown
    {
      id: "actions",
      header: () => <span className="text-right block w-full pr-3">Actions</span>,
      cell: ({ row }) => {
        const item = row.original;
        
        return (
          <div className="text-right pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer inline-block outline-none">
                <MoreVertical size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl w-44 shadow-lg select-none">
                <DropdownMenuLabel className="text-[10px] font-bold text-zinc-400 uppercase py-1.5 px-2.5">Stock Controls</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                
                {/* 1. View Details (All roles) */}
                <DropdownMenuItem 
                  onClick={() => onViewDetails(item._id)}
                  className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-zinc-850"
                >
                  <Eye size={14} className="text-indigo-500" />
                  View Details
                </DropdownMenuItem>

                {/* 2. Update Stock (Store Manager only) */}
                {role === "store_manager" ? (
                  <DropdownMenuItem 
                    onClick={() => onUpdateStock(item._id)}
                    className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-zinc-850"
                  >
                    <RefreshCw size={14} className="text-[var(--primary)]" />
                    Update Stock
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    disabled
                    className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 text-zinc-350 dark:text-zinc-600 cursor-not-allowed opacity-50"
                  >
                    <ShieldAlert size={14} />
                    Update Stock
                  </DropdownMenuItem>
                )}

                {/* 3. History (Store Manager & Kitchen Supervisor) */}
                {role === "store_manager" || role === "kitchen_supervisor" ? (
                  <DropdownMenuItem 
                    onClick={() => onViewHistory(item._id)}
                    className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-zinc-850"
                  >
                    <History size={14} className="text-emerald-500" />
                    View History
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    disabled
                    className="text-xs font-semibold py-2 px-2.5 flex items-center gap-2 text-zinc-350 dark:text-zinc-600 cursor-not-allowed opacity-50"
                  >
                    <ShieldAlert size={14} />
                    View History
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
  ], [role, onViewDetails, onUpdateStock, onViewHistory]);

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
      emptyMessage="No ingredients matching filter criteria."
    />
  );
}
