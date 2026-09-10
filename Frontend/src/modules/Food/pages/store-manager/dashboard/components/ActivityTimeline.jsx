import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ClipboardList, X, Play, Clock, User, AlertOctagon } from "lucide-react"
import apiClient from "@/services/api/axios"

// Mock activity logs
const MOCK_ACTIVITY_LOGS = [
  { id: 1, action: "Order PV-8842 accepted", user: "Manager (Shubham)", type: "order", timestamp: "1m ago" },
  { id: 2, action: "Margherita pizza moved to Baking", user: "Chef (Vijay)", type: "kitchen", timestamp: "5m ago" },
  { id: 3, action: "Low stock alert triggered: Paneer", user: "System", type: "inventory", timestamp: "14m ago" },
  { id: 4, action: "Rider assigned: Ramesh Singh", user: "Auto-Dispatch", type: "delivery", timestamp: "20m ago" },
  { id: 5, action: "Shift started: Assistant Manager Pooja", user: "Pooja Rawat", type: "staff", timestamp: "1h ago" }
]

export default function ActivityTimeline({ storeId, refreshKey, activities }) {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)

  // Fetch activity logs
  const { data: serverLogs, isLoading } = useQuery({
    queryKey: ["activity-logs-widget", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/activity-logs", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_ACTIVITY_LOGS
      }
    }
  })

  // Use live activities passed from socket simulator, falling back to server logs
  const timelineData = activities || serverLogs || MOCK_ACTIVITY_LOGS

  const handleEventClick = (evt) => {
    setSelectedEvent(evt)
    setShowEventModal(true)
  }

  // Get color coding classes based on type
  const getTypeClasses = (type) => {
    switch (type) {
      case "order":
        return {
          bullet: "bg-blue-500 ring-blue-100 dark:ring-blue-950",
          text: "text-blue-600 dark:text-blue-400"
        }
      case "kitchen":
        return {
          bullet: "bg-orange-500 ring-orange-100 dark:ring-orange-950",
          text: "text-orange-600 dark:text-orange-400"
        }
      case "inventory":
        return {
          bullet: "bg-rose-500 ring-rose-100 dark:ring-rose-955",
          text: "text-rose-600 dark:text-rose-400"
        }
      case "delivery":
        return {
          bullet: "bg-emerald-500 ring-emerald-100 dark:ring-emerald-950",
          text: "text-emerald-600 dark:text-emerald-400"
        }
      default:
        return {
          bullet: "bg-slate-400 ring-slate-100 dark:ring-zinc-800",
          text: "text-slate-650 dark:text-zinc-400"
        }
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between min-h-[300px]">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-3">
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
          <ClipboardList size={16} className="text-[var(--primary)]" />
          Activity Log Timeline
        </h3>
        <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
          Live stream
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto pl-2.5 py-1 space-y-4 pr-1 relative scrollbar-thin max-h-56">
        
        {/* Vertical line indicator */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-zinc-800" />

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-6 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-6 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : (
          timelineData.map((evt, idx) => {
            const colors = getTypeClasses(evt.type)

            return (
              <div 
                key={evt.id || idx}
                onClick={() => handleEventClick(evt)}
                className="relative flex gap-4 items-start cursor-pointer hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 p-1.5 rounded-xl transition-colors"
              >
                {/* Bullet */}
                <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ring-4 ${colors.bullet} shrink-0 mt-1 z-10`} />

                {/* Content */}
                <div className="flex-1 min-w-0 font-bold text-xs">
                  <p className="text-slate-800 dark:text-zinc-200 truncate">{evt.action}</p>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold mt-1">
                    By: {evt.user} • <span className={colors.text}>{evt.type.toUpperCase()}</span>
                  </p>
                </div>

                {/* Time */}
                <span className="text-[9px] font-bold text-slate-405 mt-0.5 shrink-0">
                  {evt.timestamp}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* ACTIVITY DETAIL MODAL */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertOctagon size={16} className="text-[var(--primary)]" />
                System Activity Audit
              </h3>
              <button 
                onClick={() => setShowEventModal(false)}
                className="p-1 rounded-md text-zinc-405 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Event Description details */}
            <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">Event Action</span>
                <p className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl text-slate-900 dark:text-white font-extrabold leading-relaxed">
                  {selectedEvent.action}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">Triggered By</span>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                    <User size={12} className="text-slate-450" />
                    <span className="truncate">{selectedEvent.user}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">Category Code</span>
                  <div className="p-2 bg-slate-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-855 rounded-xl capitalize">
                    {selectedEvent.type}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">Occurrence Timestamp</span>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <Clock size={12} className="text-slate-450" />
                  <span>{selectedEvent.timestamp}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowEventModal(false)}
              className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-755 dark:text-zinc-250 font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-sm text-center"
            >
              Dismiss audit
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
