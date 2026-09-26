import React from "react";
import { Edit, Trash2, ArrowUpDown } from "lucide-react";
import dayjs from "dayjs";

export default function AddonsData({
  addons = [],
  onEdit,
  onDelete,
  sortConfig = { key: "name", direction: "asc" },
  onSort
}) {
  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return <span className="text-[var(--primary)] ml-1 font-bold">▲</span>;
    }
    return <ArrowUpDown size={11} className="ml-1 opacity-40 inline shrink-0" />;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden select-none">
      <div className="overflow-x-auto w-full relative">
        <table className="w-full border-collapse text-left text-xs min-w-[800px]">
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 font-bold uppercase sticky top-0 z-30">
            <tr>
              <th className="px-4 py-3 w-16 text-center">Image</th>
              <th className="px-4 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("name")}>
                Add-on Name {getSortIcon("name")}
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("type")}>
                Type {getSortIcon("type")}
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("size")}>
                Size {getSortIcon("size")}
              </th>
              <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("price")}>
                Price {getSortIcon("price")}
              </th>
              <th className="px-4 py-3 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("status")}>
                Status {getSortIcon("status")}
              </th>
              <th className="px-4 py-3 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => onSort("createdAt")}>
                Created Date {getSortIcon("createdAt")}
              </th>
              <th className="px-4 py-3 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-950 shadow-l z-30 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300">
            {addons.map((item) => (
              <tr key={item._id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors group">
                <td className="px-4 py-3 text-center">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white mx-auto">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs">No img</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-black dark:text-white">
                  {item.name}
                </td>
                <td className="px-4 py-3 capitalize">
                  {item.type}
                </td>
                <td className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 align-top">
                  {item.prices && item.prices.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {item.prices.map((p, i) => <span key={i}>{p.size}</span>)}
                    </div>
                  ) : item.size || "-"}
                </td>
                <td className="px-4 py-3 text-right font-black text-black dark:text-white align-top">
                  {item.prices && item.prices.length > 0 ? (
                    <div className="flex flex-col gap-1 text-right">
                      {item.prices.map((p, i) => <span key={i}>₹{Number(p.price).toFixed(2)}</span>)}
                    </div>
                  ) : `₹${Number(item.price || 0).toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    item.status === "Active"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-medium text-zinc-500">
                  {item.createdAt ? dayjs(item.createdAt).format("DD MMM YYYY, hh:mm A") : "-"}
                </td>
                <td className="px-4 py-3 text-right sticky right-0 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50/80 dark:group-hover:bg-zinc-800/50 transition-colors z-20">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-zinc-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                      title="Edit Add-on"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(item._id)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Add-on"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {addons.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-zinc-500 text-sm font-medium">
                  No add-ons found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
