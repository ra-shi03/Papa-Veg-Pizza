import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { 
  MoreVertical, Eye, Pencil, Copy, Layers, Sparkles, 
  Check, Trash2, ShieldAlert, ArrowUpDown, ChevronDown, 
  Pizza, Flame, Leaf, HelpCircle 
} from "lucide-react";
import { mockCategories } from "../mockProducts";

export default function ProductsTable({
  data,
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
    sku: true,
    category: true,
    productType: true,
    prepTime: true,
    bestSeller: true,
    createdAt: false, // Hidden by default, customizable
  });

  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);

  // Map categoryId to Category Name
  const getCategoryName = (catId) => {
    const cat = mockCategories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  // TanStack Columns Definition
  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 focus:ring-1 focus:ring-[var(--primary)] w-3.5 h-3.5"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 focus:ring-1 focus:ring-[var(--primary)] w-3.5 h-3.5"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }) => {
          const imgUrl = row.original.image;
          const name = row.original.name;
          return (
            <div className="w-9 h-9 rounded-lg bg-zinc-150 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={imgUrl}
                alt={name}
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=40&q=80";
                }}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            onClick={() => onSortingChange("name")}
            className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 focus:outline-none"
          >
            <span>Product Name</span>
            <ArrowUpDown size={11} className="opacity-60" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[150px]">
            <p className="font-extrabold text-zinc-900 dark:text-white text-xs leading-tight">
              {row.original.name}
            </p>
            {row.original.isFeatured && (
              <span className="inline-block mt-0.5 text-[8px] bg-[var(--primary)]/10 text-[var(--primary)] px-1 py-0.2 rounded font-bold border border-[var(--primary)]/15">
                Featured
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => <span className="font-mono text-zinc-500 font-bold">{row.original.sku || "-"}</span>,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <span>{getCategoryName(row.original.categoryId)}</span>,
      },
      {
        accessorKey: "productType",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.productType;
          let badgeClass = "";
          let icon = null;
          if (type === "VEG") {
            badgeClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250/20";
            icon = <Leaf size={10} className="fill-current shrink-0" />;
          } else if (type === "NON_VEG") {
            badgeClass = "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-250/20";
            icon = <Flame size={10} className="fill-current shrink-0" />;
          } else {
            badgeClass = "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-250/20";
            icon = <Pizza size={10} className="fill-current shrink-0" />;
          }
          return (
            <span className={`px-2 py-0.5 border rounded-lg font-bold text-[9px] inline-flex items-center gap-1 ${badgeClass}`}>
              {icon}
              <span>{type}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "basePrice",
        header: ({ column }) => (
          <button
            onClick={() => onSortingChange("basePrice")}
            className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 focus:outline-none"
          >
            <span>Price</span>
            <ArrowUpDown size={11} className="opacity-60" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-black text-zinc-900 dark:text-zinc-150">
            ₹{row.original.basePrice.toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "prepTime",
        header: "Prep Time",
        cell: ({ row }) => (
          <span className="text-zinc-500 font-bold">{row.original.preparationTime} mins</span>
        ),
      },
      {
        accessorKey: "bestSeller",
        header: "Best Seller",
        cell: ({ row }) => {
          return row.original.isBestSeller ? (
            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-650 dark:text-orange-400 font-bold rounded-full border border-orange-500/20 text-[9px] inline-flex items-center gap-0.5">
              <Sparkles size={10} className="fill-current animate-pulse text-orange-550" />
              <span>Best Seller</span>
            </span>
          ) : (
            <span className="text-zinc-400 font-medium text-[10px] italic">No</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.status === "ACTIVE";
          return (
            <span
              className={`px-2.5 py-0.5 border rounded-full font-bold inline-flex items-center gap-1 text-[9.5px] ${
                isActive
                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/35"
                  : "text-zinc-500 bg-zinc-100 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              {row.original.status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ row }) => (
          <span className="text-zinc-400 text-[10px] font-bold">
            {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActionsDropdown product={row.original} onAction={onAction} />,
      },
    ],
    [onSortingChange, onAction]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      columnVisibility,
    },
    onRowSelectionChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      
      {/* Visibility Column Controls Bar */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/20 dark:bg-zinc-950/20 text-xs font-semibold">
        <span className="text-zinc-450 font-bold">
          {Object.keys(rowSelection).length} of {data.length} products selected
        </span>

        {/* Column Visibility Selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 dark:hover:bg-zinc-850 transition-all flex items-center gap-1 font-bold text-zinc-550 dark:text-zinc-350 cursor-pointer"
          >
            <span>Columns</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${showVisibilityDropdown ? "rotate-180" : ""}`} />
          </button>
          
          {showVisibilityDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowVisibilityDropdown(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden py-1.5 animate-scale-up font-semibold text-zinc-700 dark:text-zinc-350 text-[11px]">
                {table.getAllLeafColumns().map((col) => {
                  if (col.id === "select" || col.id === "actions" || col.id === "image" || col.id === "name" || col.id === "basePrice") return null;
                  return (
                    <label
                      key={col.id}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={col.getToggleVisibilityHandler()}
                        className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3 h-3 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <span className="capitalize">{col.id.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Responsive table wrapper */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[1000px] text-left border-collapse text-xs font-semibold text-zinc-700 dark:text-zinc-350">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr
                key={group.id}
                className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-850 text-zinc-450 uppercase text-[9px] font-black tracking-wider sticky top-0 z-10"
              >
                {group.headers.map((header) => (
                  <th key={header.id} className="px-5 py-3 font-black">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 bg-white dark:bg-zinc-950">
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: limit }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-5 py-3"><div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                  <td className="px-5 py-3"><div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg" /></td>
                  <td className="px-5 py-3"><div className="w-32 h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                  <td className="px-5 py-3"><div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                  <td className="px-5 py-3"><div className="w-20 h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                  <td className="px-5 py-3"><div className="w-12 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" /></td>
                  <td className="px-5 py-3"><div className="w-12 h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded font-black" /></td>
                  <td className="px-5 py-3"><div className="w-14 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                  <td className="px-5 py-3"><div className="w-14 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" /></td>
                  <td className="px-5 py-3"><div className="w-14 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" /></td>
                  <td className="px-5 py-3 text-right"><div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State (Triggered inside parent Products.jsx, but safety fallback here)
              <tr>
                <td colSpan={12} className="py-16 text-center">
                  <Pizza className="mx-auto text-zinc-300 dark:text-zinc-700 w-12 h-12 stroke-[1.2] mb-3 animate-bounce" />
                  <p className="font-extrabold text-zinc-800 dark:text-zinc-200">No Products Displayed</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Try resetting filter selectors or create a new custom pizza product.</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalCount > 0 && (
        <footer className="p-4 border-t border-zinc-150 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/20 dark:bg-zinc-900/10 font-bold text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-zinc-450 ml-2">
              Showing {Math.min((page - 1) * limit + 1, totalCount)}-{Math.min(page * limit, totalCount)} of {totalCount} products
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold">
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              Prev
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1;
              const isActive = page === pNum;
              return (
                <button
                  key={pNum}
                  onClick={() => onPageChange(pNum)}
                  className={`w-7 h-7 font-bold rounded-lg transition-all text-center flex items-center justify-center cursor-pointer ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
              disabled={page === totalPages}
              className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </footer>
      )}

    </div>
  );
}

// Row Actions Dropdown component
function RowActionsDropdown({ product, onAction }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleItemClick = (actionName) => {
    setIsOpen(false);
    onAction(actionName, product);
  };

  return (
    <div className="relative inline-block text-left actions-dropdown-container">
      <button
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors focus:outline-none cursor-pointer"
      >
        <MoreVertical size={14} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-scale-up font-bold text-xs text-zinc-700 dark:text-zinc-300">
            
            <button
              onClick={() => handleItemClick("view")}
              className="w-full px-3.5 py-2 text-left hover:bg-zinc-55/15 hover:text-zinc-900 dark:hover:bg-zinc-900/50 dark:hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <Eye size={12} className="text-zinc-400 shrink-0" />
              <span>View Product</span>
            </button>

            <button
              onClick={() => handleItemClick("edit")}
              className="w-full px-3.5 py-2 text-left hover:bg-zinc-55/15 hover:text-zinc-900 dark:hover:bg-zinc-900/50 dark:hover:text-white flex items-center gap-2 cursor-pointer text-amber-600"
            >
              <Pencil size={12} className="shrink-0" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => handleItemClick("duplicate")}
              className="w-full px-3.5 py-2 text-left hover:bg-zinc-55/15 hover:text-zinc-900 dark:hover:bg-zinc-900/50 dark:hover:text-white flex items-center gap-2 cursor-pointer text-blue-650"
            >
              <Copy size={12} className="shrink-0" />
              <span>Duplicate Product</span>
            </button>

            <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 my-1" />

            <button
              onClick={() => handleItemClick("variants")}
              className="w-full px-3.5 py-2 text-left hover:bg-zinc-55/15 hover:text-zinc-900 dark:hover:bg-zinc-900/50 dark:hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <Layers size={12} className="text-zinc-400 shrink-0" />
              <span>Manage Variants</span>
            </button>

            <button
              onClick={() => handleItemClick("addons")}
              className="w-full px-3.5 py-2 text-left hover:bg-zinc-55/15 hover:text-zinc-900 dark:hover:bg-zinc-900/50 dark:hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={12} className="text-zinc-400 shrink-0" />
              <span>Manage Add-ons</span>
            </button>

            <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 my-1" />

            <button
              onClick={() => handleItemClick("toggle_status")}
              className={`w-full px-3.5 py-2 text-left hover:bg-zinc-55/15 hover:text-zinc-900 dark:hover:bg-zinc-900/50 dark:hover:text-white flex items-center gap-2 cursor-pointer ${
                product.status === "ACTIVE" ? "text-zinc-500" : "text-emerald-600 font-bold"
              }`}
            >
              <Check size={12} className="shrink-0" />
              <span>{product.status === "ACTIVE" ? "Disable Product" : "Enable Product"}</span>
            </button>

            <button
              onClick={() => handleItemClick("delete")}
              className="w-full px-3.5 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={12} className="shrink-0" />
              <span>Delete Product</span>
            </button>

          </div>
        </>
      )}
    </div>
  );
}
