import React from "react";
import { Check, X } from "lucide-react";

export default function PermissionRow({ name = "", allowed = false, description = "" }) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 transition-colors">
      <td className="py-2.5 px-3 text-left">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            {name}
          </span>
          {description && (
            <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500">
              {description}
            </span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3 text-right">
        <div className="flex justify-end items-center">
          {allowed ? (
            <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
              <Check size={11} className="stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center">
              <X size={10} className="stroke-[3]" />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
