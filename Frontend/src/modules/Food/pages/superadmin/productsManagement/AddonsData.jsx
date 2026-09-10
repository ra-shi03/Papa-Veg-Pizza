import React, { useState } from "react";
import { ChevronDown, MoreVertical, Eye, Edit, Copy, Archive, Trash2, CheckCircle, XCircle, Link2, ArrowUpDown } from "lucide-react";

export default function AddonsData({
  addons = [],
  mappings = [],
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  onView,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
  onManageMapping,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  rowsPerPage = 10,
  onRowsPerPageChange,
  sortConfig = { key: "name", direction: "asc" },
  onSort
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClose = () => setActiveDropdown(null);
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, []);

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return <span className="text-[var(--primary)] ml-1 font-bold">▲</span>;
    }
    return <ArrowUpDown size={11} className="ml-1 opacity-40 inline shrink-0" />;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden select-none">
      
      {/* Scrollable Table Area */}
      <div className="overflow-x-auto w-full relative">
        <table className="w-full border-collapse text-left text-xs min-w-[1200px]">
          
          {/* Sticky Header */}
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 font-bold uppercase sticky top-0 z-30">
            <tr>
              <th className="px-3 py-2 w-10 text-center">
                <input
                  type="checkbox"
                  onChange={onSelectAll}
                  checked={addons.length > 0 && selectedRows.length === addons.length}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                />
              </th>
              <th className="px-3 py-2 w-14 text-center">Image</th>
              
              <th className="px-3 py-2 cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("name")}>
                Add-on Name {getSortIcon("name")}
              </th>
              
              <th className="px-3 py-2 cursor-pointer hover:text-[var(--primary)] text-center" onClick={() => onSort("type")}>
                Type {getSortIcon("type")}
              </th>
              
              <th className="px-3 py-2 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("price")}>
                Price {getSortIcon("price")}
              </th>
              
              <th className="px-3 py-2 text-center">Veg Type</th>
              
              <th className="px-3 py-2 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("maxQuantity")}>
                Max Qty {getSortIcon("maxQuantity")}
              </th>
              
              <th className="px-3 py-2">Categories</th>
              <th className="px-3 py-2 text-center">Assigned Products</th>
              
              <th className="px-3 py-2 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("status")}>
                Status {getSortIcon("status")}
              </th>
              
              <th className="px-3 py-2 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("updatedAt")}>
                Last Updated {getSortIcon("updatedAt")}
              </th>
              
              <th className="px-3 py-2 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-950 shadow-l z-30 w-24">Actions</th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300">
            {addons.map((item) => {
              const isChecked = selectedRows.includes(item._id);
              const isVeg = item.isVeg !== false;
              
              // Count linked products
              const linkedProds = mappings.filter(m => m.addonId === item._id).length;

              return (
                <tr
                  key={item._id}
                  className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/35 transition-colors ${
                    isChecked ? "bg-[var(--primary)]/5" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onSelectRow(item._id)}
                      className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                    />
                  </td>

                  {/* WebP Image */}
                  <td className="px-3 py-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 shrink-0 mx-auto">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  </td>

                  {/* Add-on Name */}
                  <td className="px-3 py-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-[200px]">
                      {item.name}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2 text-center">
                    <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded text-[9px] font-black uppercase tracking-wider">
                      {item.type}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2 text-right font-black text-zinc-900 dark:text-zinc-100">
                    ₹{item.price.toFixed(2)}
                  </td>

                  {/* Veg/Vegan Indicator Badge */}
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center">
                      {item.isVegan ? (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 text-[8px] font-black uppercase rounded shadow-sm flex items-center gap-0.5">
                          🌱 Vegan
                        </span>
                      ) : (
                        <div className="w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm bg-white shrink-0 border-green-600" title="Vegetarian">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Max Quantity */}
                  <td className="px-3 py-2 text-center font-mono font-bold">
                    {item.maxQuantity}
                  </td>

                  {/* Compatible Category */}
                  <td className="px-3 py-2 font-bold text-zinc-500 truncate max-w-[130px]">
                    {item.category || "All Categories"}
                  </td>

                  {/* Products count linked */}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageMapping(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] rounded text-[10px] font-black transition-colors"
                      title="Manage Product Mappings"
                    >
                      <Link2 size={11} />
                      {linkedProds} {linkedProds === 1 ? "prod" : "prods"}
                    </button>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      item.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : item.status === "inactive"
                        ? "bg-zinc-105 text-zinc-650 dark:bg-zinc-800/30 dark:text-zinc-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400"
                    }`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Last Updated */}
                  <td className="px-3 py-2 text-center text-zinc-500 font-semibold font-mono">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "14 Jun 2026"}
                  </td>

                  {/* Actions Dropdown */}
                  <td className={`px-3 py-2 text-right sticky right-0 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-l transition-colors ${
                    activeDropdown === item._id ? "z-20" : "z-10"
                  }`}>
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(prev => (prev === item._id ? null : item._id));
                        }}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeDropdown === item._id && (
                        <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mt-1 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 animate-in fade-in slide-in-from-top-1 text-zinc-700 dark:text-zinc-300">
                          
                          <div className="py-1">
                            <button
                              onClick={() => onView(item)}
                              className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors"
                            >
                              <Eye size={12} className="text-zinc-400" />
                              View Profile Drawer
                            </button>
                            <button
                              onClick={() => onEdit(item)}
                              className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors"
                            >
                              <Edit size={12} className="text-zinc-400" />
                              Edit Add-on
                            </button>
                            <button
                              onClick={() => onDuplicate(item)}
                              className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors"
                            >
                              <Copy size={12} className="text-zinc-400" />
                              Duplicate Add-on
                            </button>
                          </div>

                          <div className="py-1">
                            {item.status === "active" ? (
                              <button
                                onClick={() => onStatusChange(item._id, "inactive")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors"
                              >
                                <XCircle size={12} className="text-zinc-400" />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => onStatusChange(item._id, "active")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors"
                              >
                                <CheckCircle size={12} className="text-emerald-400" />
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => onStatusChange(item._id, "archived")}
                              className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors"
                            >
                              <Archive size={12} className="text-zinc-400" />
                              Archive
                            </button>
                          </div>

                          <div className="py-1">
                            <button
                              onClick={() => onManageMapping(item)}
                              className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors text-[var(--primary)]"
                            >
                              <Link2 size={12} className="text-[var(--primary)] opacity-70" />
                              Manage Product Mappings
                            </button>
                            <button
                              onClick={() => onDelete(item)}
                              className="w-full text-left px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors text-red-500"
                            >
                              <Trash2 size={12} className="text-red-400" />
                              Delete Confirmation
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {addons.length === 0 && (
              <tr>
                <td colSpan={12} className="py-10 text-center text-zinc-400 font-bold text-xs">
                  No toppings or add-ons found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold select-none">
        
        {/* Rows Per Page */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
            className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300 font-bold outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-all font-bold"
          >
            ◀
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                    : "border-zinc-205 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-all font-bold"
          >
            ▶
          </button>
        </div>
      </div>

    </div>
  );
}
