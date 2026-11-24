import React from "react"
import { Clock } from "lucide-react"
import { useMyAttendanceToday } from "../staffManagement/hooks/useAttendance"
import ClockInOutButton from "../myTasks/components/ClockInOutButton"

// Everyone who works in the store marks attendance first: kitchen staff and the store manager
const KITCHEN_ROLES = ["kitchen_staff", "store_manager"]

// Kitchen staff and the store manager mark attendance first; the server refuses work until they have (and after they clock out).
export default function AttendanceBanner({ role }) {
  const isKitchen = KITCHEN_ROLES.includes(role)
  const { data: today, isLoading } = useMyAttendanceToday(isKitchen)
  if (!isKitchen || isLoading || !today) return null
  if (today.clockedIn || today.state === "marked") return null

  const finished = today.state === "clocked_out"
  const onLeave = today.state === "on_leave"
  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
        <Clock size={15} className="shrink-0" />
        <p className="text-xs font-bold">
          {onLeave
            ? "You are on leave today, so work actions are locked."
            : finished
              ? "Your shift is finished for today, so work actions are locked."
              : "Mark your attendance first (Clock In). Work actions stay locked until you do."}
        </p>
      </div>
      {!finished && !onLeave && <ClockInOutButton />}
    </div>
  )
}
