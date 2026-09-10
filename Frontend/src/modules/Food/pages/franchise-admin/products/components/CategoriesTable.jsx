import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender
} from "@tanstack/react-table";
import {
  MoreVertical,
  ArrowUpDown,
  Eye,
  Edit2,
  Power,
  Trash2,
  Grid,
  AlertCircle,
  EyeOff,
  Plus
} from "lucide-react";
import * as Icons from "lucide-react";

export default function CategoriesTable({
  categoriesList = [],
  isLoading,
  selectedIds,
  onSelectionChange,
  onSortChange,
  sortBy,
  sortOrder,
  onViewClick,
  onEditClick,
  onToggleStatusClick,
  onDeleteClick,
  onAddClick
}) {
  
  // Format dynamic icons from Lucide-react
  const renderCategoryIcon = (iconName) => {
    const LucideIcon = Icons[iconName] || Grid;
    return <LucideIcon size={14} className="text-zinc-400" />;
  };

  // Checkbox toggle logic
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(categoriesList.map((c) => c._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    }
  };

  // TanStack table columns definition
  const columns = useMemo(() => [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={categoriesList.length > 0 && selectedIds.length === categoriesList.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original._id)}
          onChange={(e) => handleSelectRow(row.original._id, e.target.checked)}
          className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
        />
      )
    },
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-150 dark:border-zinc-800 flex-shrink-0">
          <img
            src={row.original.image}
            alt={row.original.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=100&q=80";
            }}
          />
        </div>
      )
    },
    {
      accessorKey: "name",
      header: () => (
        <button
          onClick={() => onSortChange("name")}
          className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white cursor-pointer font-bold uppercase tracking-wider text-[9px]"
        >
          <span>Category Name</span>
          <ArrowUpDown size={10} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
            {renderCategoryIcon(row.original.icon)}
            <span>{row.original.name}</span>
          </div>
          <div className="text-[9.5px] text-zinc-400 font-mono tracking-tight font-semibold">
            /{row.original.slug}
          </div>
        </div>
      )
    },
    {
      accessorKey: "parentCategory",
      header: "Parent Category",
      cell: ({ row }) => {
        const parentId = row.original.parentCategory;
        const parent = categoriesList.find((c) => c._id === parentId);
        return parent ? (
          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded font-semibold text-zinc-650 dark:text-zinc-300">
            {parent.name}
          </span>
        ) : (
          <span className="text-zinc-400 italic font-medium">None</span>
        );
      }
    },
    {
      accessorKey: "productsCount",
      header: () => (
        <button
          onClick={() => onSortChange("productsCount")}
          className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white cursor-pointer font-bold uppercase tracking-wider text-[9px]"
        >
          <span>Products</span>
          <ArrowUpDown size={10} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-extrabold text-zinc-900 dark:text-zinc-200">
          {row.original.productsCount || 0} items
        </div>
      )
    },
    {
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) => (
        row.original.isFeatured ? (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-purple-500/10 text-purple-600 border border-purple-250/20">
            FEATURED
          </span>
        ) : (
          <span className="text-zinc-400 font-medium">-</span>
        )
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
          row.original.status === "ACTIVE"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-250/20"
            : "bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800"
        }`}>
          {row.original.status}
        </span>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => (
        <div className="text-zinc-500 font-medium">
          {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
        </div>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="relative group/actions flex justify-end pr-2">
          <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700">
            <MoreVertical size={13} />
          </button>
          
          {/* Quick Popover dropdown */}
          <div className="absolute right-6 top-0 hidden group-hover/actions:flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 w-36 overflow-hidden py-1 animate-fade-in font-bold">
            <button
              onClick={() => onViewClick(row.original._id)}
              className="px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 text-left w-full cursor-pointer"
            >
              <Eye size={12} className="text-zinc-400" />
              <span>View Specs</span>
            </button>
            <button
              onClick={() => onEditClick(row.original._id)}
              className="px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 text-left w-full cursor-pointer"
            >
              <Edit2 size={12} className="text-zinc-400" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => onToggleStatusClick(row.original._id, row.original.status)}
              className="px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 text-left w-full cursor-pointer"
            >
              <Power size={12} className="text-zinc-400" />
              <span>{row.original.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
            </button>
            <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />
            <button
              onClick={() => onDeleteClick(row.original._id)}
              className="px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 flex items-center gap-2 text-left w-full cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )
    }
  ], [categoriesList, selectedIds]);

  const table = useReactTable({
    data: categoriesList,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
          <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-850 rounded animate-pulse" />
          <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-850 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, rIdx) => (
            <div key={rIdx} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-850 rounded" />
              <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-850 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-850 rounded" />
                <div className="h-2 w-1/4 bg-zinc-200 dark:bg-zinc-850 rounded" />
              </div>
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-850 rounded" />
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-850 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (categoriesList.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[40vh]">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-full text-zinc-400">
          <EyeOff size={32} />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">No Categories Found</h4>
          <p className="text-[10px] text-zinc-450 leading-relaxed max-w-sm">
            We couldn't find any category profiles matching your query. Click below to add a new franchise category to the catalog.
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md text-xs active:scale-[0.98]"
        >
          <Plus size={13} />
          <span>Create Category</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      
      {/* Table Container */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse text-[11px] font-bold">
          
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-zinc-50/75 dark:bg-zinc-950/75 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800 z-10 text-zinc-450 uppercase text-[9px] font-black tracking-wider">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3.5 first:pl-5">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-55/10 dark:hover:bg-zinc-900/20 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 first:pl-5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* Pagination Footer */}
      <footer className="p-3.5 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-50/20 dark:bg-zinc-900/10">
        <div>
          Page <span className="text-zinc-700 dark:text-white font-extrabold">{table.getState().pagination.pageIndex + 1}</span> of{" "}
          <span className="text-zinc-700 dark:text-white font-extrabold">{table.getPageCount()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-950 rounded-lg disabled:opacity-40 cursor-pointer font-bold transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-950 rounded-lg disabled:opacity-40 cursor-pointer font-bold transition-colors"
          >
            Next
          </button>
        </div>
      </footer>

    </div>
  );
}
