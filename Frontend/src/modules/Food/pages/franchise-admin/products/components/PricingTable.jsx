import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  MoreVertical, Eye, Pencil, Trash2, ArrowUpDown, ChevronDown, Check, SlidersHorizontal, History, Copy
} from "lucide-react";
import { TableSkeleton } from "@food/components/ui/loading-skeletons";

export default function PricingTable({
  data = [],
  isLoading,
  sorting,
  onSortingChange,
  page,
  limit,
  totalCount,
  onPageChange,
  onLimitChange,
  rowSelection,
  onRowSelectionChange,
  onAction
}) {
  const [columnVisibility, setColumnVisibility] = useState({
    store: true,
    product: true,
    smallPrice: true,
    mediumPrice: true,
    largePrice: true,
    deliveryPrice: true,
    takeawayPrice: true,
    availability: true,
    updatedAt: true,
  });

  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 focus:ring-1 focus:ring-[var(--primary)] w-3.5 h-3.5 cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 focus:ring-1 focus:ring-[var(--primary)] w-3.5 h-3.5 cursor-pointer"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        id: "store",
        header: () => (
          <button
            onClick={() => onSortingChange("storeName")}
            className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 focus:outline-none cursor-pointer font-bold uppercase tracking-wider text-[9px] text-zinc-400"
          >
            <span>Store</span>
            <ArrowUpDown size={10} className="opacity-65" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="font-extrabold text-zinc-900 dark:text-white text-xs leading-none">
              {row.original.storeName}
            </p>
            <span className="text-[8.5px] font-mono tracking-tight font-bold text-zinc-450 dark:text-zinc-500 uppercase leading-none">
              {row.original.storeCode}
            </span>
          </div>
        ),
      },
      {
        id: "product",
        header: () => (
          <button
            onClick={() => onSortingChange("productName")}
            className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 focus:outline-none cursor-pointer font-bold uppercase tracking-wider text-[9px] text-zinc-400"
          >
            <span>Product</span>
            <ArrowUpDown size={10} className="opacity-65" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 max-w-[170px]">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={row.original.productImage}
                alt={row.original.productName}
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=40&q=80";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-zinc-900 dark:text-white text-xs leading-none truncate">
                {row.original.productName}
              </p>
              <span className="inline-block text-[8px] bg-zinc-50 dark:bg-zinc-950 text-zinc-450 px-1 py-0.2 rounded border border-zinc-200 dark:border-zinc-800 font-bold tracking-tight uppercase leading-none mt-1">
                SKU: {row.original.productSku}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "smallPrice",
        header: "Small Price",
        cell: ({ row }) => (
          <span className="font-black text-zinc-900 dark:text-zinc-200">
            ₹{row.original.smallPrice}
          </span>
        ),
      },
      {
        accessorKey: "mediumPrice",
        header: "Medium Price",
        cell: ({ row }) => (
          <span className="font-black text-zinc-900 dark:text-zinc-200">
            ₹{row.original.mediumPrice}
          </span>
        ),
      },
      {
        accessorKey: "largePrice",
        header: "Large Price",
        cell: ({ row }) => (
          <span className="font-black text-zinc-900 dark:text-zinc-200">
            ₹{row.original.largePrice}
          </span>
        ),
      },
      {
        accessorKey: "deliveryPrice",
        header: "Delivery",
        cell: ({ row }) => (
          <span className="font-bold text-zinc-700 dark:text-zinc-350">
            ₹{row.original.deliveryPrice}
          </span>
        ),
      },
      {
        accessorKey: "takeawayPrice",
        header: "Takeaway",
        cell: ({ row }) => (
          <span className="font-bold text-zinc-700 dark:text-zinc-350">
            ₹{row.original.takeawayPrice}
          </span>
        ),
      },
      {
        accessorKey: "availability",
        header: "Availability",
        cell: ({ row }) => {
          const avail = row.original.availability || "AVAILABLE";
          let badgeClass = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650";
          if (avail === "UNAVAILABLE") {
            badgeClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-650";
          } else if (avail === "PROMOTION ACTIVE") {
            badgeClass = "bg-orange-50 dark:bg-orange-950/20 text-orange-650 border border-orange-200 dark:border-orange-900/35";
          }
          return (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>
              {avail}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => {
          const date = new Date(row.original.updatedAt || row.original.createdAt);
          return (
            <div className="space-y-0.5 text-zinc-450 dark:text-zinc-500 font-medium">
              <p className="text-[10px] leading-none">
                {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
              </p>
              <p className="text-[9px] leading-none font-semibold">
                by {row.original.updatedBy || "System"}
              </p>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="relative text-right">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === row.original._id ? null : row.original._id);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <MoreVertical size={14} />
            </button>

            {activeMenuId === row.original._id && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 text-left">
                  <div className="py-1">
                    <button
                      onClick={() => { onAction("view", row.original); setActiveMenuId(null); }}
                      className="w-full px-3.5 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 font-semibold"
                    >
                      <Eye size={12} className="text-zinc-400" />
                      View Pricing
                    </button>
                    <button
                      onClick={() => { onAction("edit", row.original); setActiveMenuId(null); }}
                      className="w-full px-3.5 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 font-semibold"
                    >
                      <Pencil size={12} className="text-zinc-400" />
                      Edit Price
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { onAction("bulk_update", row.original); setActiveMenuId(null); }}
                      className="w-full px-3.5 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 font-semibold"
                    >
                      <SlidersHorizontal size={12} className="text-zinc-400" />
                      Bulk Update
                    </button>
                    <button
                      onClick={() => { onAction("copy", row.original); setActiveMenuId(null); }}
                      className="w-full px-3.5 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 font-semibold"
                    >
                      <Copy size={12} className="text-zinc-400" />
                      Copy Pricing
                    </button>
                    <button
                      onClick={() => { onAction("history", row.original); setActiveMenuId(null); }}
                      className="w-full px-3.5 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 font-semibold"
                    >
                      <History size={12} className="text-zinc-400" />
                      Price History
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ),
      },
    ],
    [activeMenuId, onSortingChange, onAction]
  );

  const tableData = useMemo(() => data, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnVisibility,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._id,
  });

  const totalPages = Math.ceil(totalCount / limit) || 1;

  if (isLoading) {
    return <TableSkeleton rows={limit} columns={8} className="border-zinc-200 dark:border-zinc-800" />;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs relative">
      
      {/* Table Action Bar: Column Selector */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 dark:text-zinc-450 text-[11px]">
            {table.getFilteredSelectedRowModel().rows.length} of {totalCount} rows selected
          </span>
        </div>

        {/* Column Visibility Selector */}
        <div className="relative">
          <button
            onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 bg-white dark:bg-zinc-950 rounded-lg text-zinc-500 dark:text-zinc-400 text-[11px] font-bold focus:outline-none cursor-pointer"
          >
            <SlidersHorizontal size={11} />
            Columns
            <ChevronDown size={11} className="opacity-60" />
          </button>

          {showVisibilityDropdown && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowVisibilityDropdown(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-30 p-2 space-y-1 text-[11px]">
                <p className="font-bold text-zinc-400 px-1 py-0.5 text-[9px] uppercase tracking-wider">Toggle Columns</p>
                {table.getAllLeafColumns().map((column) => {
                  if (column.id === "select" || column.id === "actions") return null;
                  return (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-350 font-bold select-none"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 text-primary focus:ring-[var(--primary)] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="capitalize">{column.id.replace(/([A-Z])/g, " $1")}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* TanStack Table Canvas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-150 dark:border-zinc-800 text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider select-none"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3.5 py-2 font-bold">
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] text-zinc-700 dark:text-zinc-350 font-semibold">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-zinc-50/40 dark:hover:bg-zinc-950/20 transition-colors ${
                  row.getIsSelected() ? "bg-zinc-50/80 dark:bg-zinc-950/30" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3.5 py-2 font-semibold">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State Banner */}
      {!isLoading && data.length === 0 && (
        <div className="py-16 text-center space-y-3.5">
          <div className="w-20 h-20 mx-auto bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center text-[var(--primary)] opacity-70">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-850 dark:text-zinc-200">No Store Pricing Found</h3>
            <p className="text-xs text-zinc-450 dark:text-zinc-450 mt-1 max-w-[280px] mx-auto leading-relaxed">
              We couldn't find any pricing overrides matching your search criteria.
            </p>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs text-zinc-500 font-semibold select-none">
          <div className="flex items-center gap-4">
            <span className="text-[11px]">
              Showing {Math.min(totalCount, (page - 1) * limit + 1)} to {Math.min(totalCount, page * limit)} of {totalCount} records
            </span>

            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => onLimitChange(parseInt(e.target.value))}
                className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[11px] focus:outline-none font-bold"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Back
            </button>
            <span className="px-1 text-[11px]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
