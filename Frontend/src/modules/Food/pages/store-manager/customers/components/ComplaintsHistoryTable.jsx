import React from "react";
import { Smile, ShieldAlert } from "lucide-react";

export default function ComplaintsHistoryTable({ complaints = [] }) {
  if (complaints.length === 0) {
    return (
      <div className="py-10 text-center flex flex-col items-center justify-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/20 dark:bg-zinc-950/20">
        <Smile size={24} className="text-emerald-500 stroke-[2]" />
        <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Zero Complaints Registered</p>
        <p className="text-[9px] text-zinc-400 font-semibold">This customer has a clean operational satisfaction record.</p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
      <table className="w-full text-left text-xs font-semibold">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
          <tr>
            <th className="px-4 py-2.5">Complaint ID</th>
            <th className="px-4 py-2.5">Issue Reported</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Resolution Notes</th>
            <th className="px-4 py-2.5">Created Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
          {complaints.map((comp) => (
            <tr key={comp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
              <td className="px-4 py-2.5 font-mono font-extrabold text-[10px] text-zinc-900 dark:text-white uppercase">
                {comp._id}
              </td>
              <td className="px-4 py-2.5 text-zinc-850 dark:text-zinc-200 font-bold max-w-[200px] truncate" title={comp.issue || comp.description || ""}>
                {comp.issue || comp.description || comp.complaintType || "Complaint"}
              </td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  comp.status === "resolved" 
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                }`}>
                  {comp.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 font-medium max-w-[220px] truncate" title={typeof comp.resolution === "object" ? comp.resolution?.actionTaken : comp.resolution}>
                {typeof comp.resolution === "object" ? comp.resolution?.actionTaken : (comp.resolution || "Under Investigation")}
              </td>
              <td className="px-4 py-2.5 text-zinc-400 dark:text-zinc-500 font-bold">
                {new Date(comp.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
