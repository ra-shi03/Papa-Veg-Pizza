import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Package,
  Layers,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";
import { ICON_MAP } from "./AddTypeModal";
import AddTypeModal from "./AddTypeModal";
import EditTypeModal from "./EditTypeModal";

export default function AddonTypesTab({
  types = [],
  loading = false,
  onRefresh,
  onCreateType,
  onUpdateType,
  onDeleteType
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [sortKey, setSortKey] = useState("sortOrder");
  const [sortDir, setSortDir] = useState("asc");

  const filteredTypes = types.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.slug || "").toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q)
    );
  });

  const sortedTypes = [...filteredTypes].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleEditClick = (type) => {
    setEditingType(type);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search add-on types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onRefresh}
            className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Refresh Types"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-[11px] shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Create Add-on Type
          </button>
        </div>
      </div>

      {/* Types Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left text-xs min-w-[750px]">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 font-bold uppercase sticky top-0 z-30">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("name")}>
                  Type Name <ArrowUpDown size={11} className="inline ml-1 opacity-40" />
                </th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("totalAddons")}>
                  Add-ons Count <ArrowUpDown size={11} className="inline ml-1 opacity-40" />
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("connectedProductsCount")}>
                  Connected Products <ArrowUpDown size={11} className="inline ml-1 opacity-40" />
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("status")}>
                  Status <ArrowUpDown size={11} className="inline ml-1 opacity-40" />
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("sortOrder")}>
                  Order <ArrowUpDown size={11} className="inline ml-1 opacity-40" />
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300">
              {sortedTypes.map((item) => {
                const IconComponent = ICON_MAP[item.icon] || Tag;
                const isCrust = (item.slug || item.name || "").toLowerCase().includes("crust");

                return (
                  <tr key={item._id || item.slug} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-black dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${item.color || "text-indigo-500 bg-indigo-50 border-indigo-200"}`}>
                          <IconComponent size={14} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold">{item.name}</span>
                            {item.isDefault && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                                Base
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">
                      {item.slug || item.name.toLowerCase()}
                    </td>

                    <td className="px-4 py-3 text-zinc-500 max-w-xs truncate" title={item.description}>
                      {item.description || "-"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        <Layers size={10} />
                        {item.totalAddons || 0} {item.totalAddons === 1 ? "Add-on" : "Add-ons"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {(item.connectedProductsCount || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <Package size={10} />
                          {item.connectedProductsCount} {item.connectedProductsCount === 1 ? "Product" : "Products"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-medium">0 Products</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                        }`}
                      >
                        {item.status || "Active"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-zinc-500">
                      {item.sortOrder ?? 0}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-zinc-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Type"
                        >
                          <Edit size={14} />
                        </button>
                        {!item.isDefault && (
                          <button
                            onClick={() => onDeleteType(item._id, item.name)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Delete Type"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedTypes.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-zinc-500 text-sm font-medium">
                    No add-on types found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddTypeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={async (payload) => {
          await onCreateType(payload);
          setIsAddOpen(false);
        }}
      />

      <EditTypeModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingType(null);
        }}
        typeData={editingType}
        onSave={async (payload) => {
          await onUpdateType(payload);
          setIsEditOpen(false);
          setEditingType(null);
        }}
      />
    </div>
  );
}

