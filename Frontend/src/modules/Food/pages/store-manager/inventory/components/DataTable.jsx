import React from "react";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@food/components/ui/dropdown-menu";
import { SlidersHorizontal, ArrowUpDown, ChevronUp, ChevronDown, ArchiveX } from "lucide-react";

export function DataTable({
  data = [],
  columns = [],
  isLoading = false,
  rowSelection = {},
  onRowSelectionChange,
  sorting = [],
  onSortingChange,
  columnVisibility = {},
  onColumnVisibilityChange,
  emptyMessage = "No records found."
}) {

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    onSortingChange,
    onRowSelectionChange,
    onColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // We delegate paging to server-side query hooks
    enableRowSelection: true,
  });

  return (
    <div className="w-full space-y-3.5 select-none">
      
      {/* Column Visibility and Selections Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-zinc-400">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </div>

        {/* Column Toggle Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-black text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-all outline-none bg-white dark:bg-zinc-900 cursor-pointer">
            <SlidersHorizontal size={12} />
            Toggle Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase text-zinc-400 py-1.5 px-2">Visible Columns</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="text-xs font-semibold py-2 cursor-pointer capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/([A-Z])/g, " $1")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-300 w-full relative">
        <div className="overflow-x-auto w-full max-h-[500px]">
          <table className="w-full border-collapse text-left text-xs table-auto relative">
            
            {/* Sticky Header */}
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-950 shadow-[0_1px_0_0_rgba(228,228,231,0.8)] dark:shadow-[0_1px_0_0_rgba(39,39,42,0.8)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="text-slate-400 dark:text-zinc-550 font-black uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-zinc-850"
                >
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted();
                    return (
                      <th 
                        key={header.id} 
                        className="py-3.5 px-4 font-black text-left"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1.5 ${
                              header.column.getCanSort() ? "cursor-pointer select-none hover:text-slate-700 dark:hover:text-white" : ""
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            
                            {/* Sort Direction Indicator */}
                            {header.column.getCanSort() && (
                              <span className="text-zinc-400">
                                {isSorted === "asc" ? (
                                  <ChevronUp size={12} className="stroke-[2.5]" />
                                ) : isSorted === "desc" ? (
                                  <ChevronDown size={12} className="stroke-[2.5]" />
                                ) : (
                                  <ArrowUpDown size={11} className="opacity-40" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
              {isLoading ? (
                // Table skeleton rows
                [1, 2, 3, 4, 5].map((n) => (
                  <tr key={n} className="animate-pulse bg-white dark:bg-zinc-900">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="py-4 px-4">
                        <div 
                          className={`h-4 bg-slate-150 dark:bg-zinc-800 rounded ${
                            colIdx === 0 ? "w-4" : colIdx === 1 ? "w-36" : "w-14"
                          }`} 
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-zinc-850/20 transition-all ${
                      row.getIsSelected() ? "bg-slate-50/70 dark:bg-zinc-850/10" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4 text-slate-800 dark:text-zinc-200">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-14 text-center text-slate-400 dark:text-zinc-550 font-black text-sm"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ArchiveX size={32} className="text-zinc-300 dark:text-zinc-700 animate-bounce-slow" />
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
