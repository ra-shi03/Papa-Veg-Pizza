import React from "react";
import { Clock } from "lucide-react";
import { useMyAttendanceToday, useClockInOut } from "../../staffManagement/hooks/useAttendance";

// Clock in / clock out for kitchen supervisors and kitchen staff (the store manager does not clock in).
export default function ClockInOutButton() {
  const { data: today, isLoading } = useMyAttendanceToday();
  const clock = useClockInOut();
  const clockedIn = !!today?.clockedIn;
  const finished = today?.state === "clocked_out" || today?.state === "marked";

  let label = "Clock In";
  if (isLoading) label = "Attendance...";
  else if (clockedIn) label = `Clock Out${today?.record?.checkIn ? ` (in at ${today.record.checkIn})` : ""}`;
  else if (today?.state === "clocked_out") label = `Shift done (${today?.record?.totalHours || 0} hrs)`;
  else if (today?.state === "marked") label = "Attendance marked";

  return (
    <button
      onClick={() => clock.mutate(clockedIn ? "out" : "in")}
      disabled={isLoading || finished || clock.isPending}
      className="text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
    >
      <Clock size={13} />
      <span>{label}</span>
    </button>
  );
}
