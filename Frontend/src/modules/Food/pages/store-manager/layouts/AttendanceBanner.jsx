import React from "react"
import { Clock } from "lucide-react"
import { useMyAttendanceToday } from "../staffManagement/hooks/useAttendance"
import ClockInOutButton from "../myTasks/components/ClockInOutButton"

const KITCHEN_ROLES = ["kitchen_supervisor", "kitchen_staff"]

// Kitchen supervisors and staff mark attendance first; the server refuses kitchen work until they have (and after they clock out).
export default function AttendanceBanner({ role }) {
  const isKitchen = KITCHEN_ROLES.includes(role)
  const { data: today, isLoading } = useMyAttendanceToday(isKitchen)
  if (!isKitchen || isLoading || !today) return null
  if (today.clockedIn || today.state === "marked") return null

  const finished = today.state === "clocked_out"
  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
        <Clock size={15} className="shrink-0" />
        <p className="text-xs font-bold">
          {finished
            ? "Your shift is finished for today, so kitchen actions are locked."
            : "Mark your attendance first. Kitchen actions stay locked until you clock in."}
        </p>
      </div>
      {!finished && <ClockInOutButton />}
    </div>
  )
}
