import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { X, Check, Trash2, Bell, AlertTriangle, AlertOctagon, Info, CheckCheck } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"

export default function NotificationsDrawer({ isOpen, onClose, notifications, setNotifications }) {
  const queryClient = useQueryClient()

  // Mark Read Mutation (POST /notifications/read)
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.post("/notifications/read", { id })
      return response.data
    },
    onSuccess: (_, id) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
      toast.success("Notification marked as read")
    },
    onError: (_, id) => {
      // Offline fallback
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
      toast.success("Notification marked as read")
    }
  })

  // Delete Mutation (POST /notifications/delete)
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.post("/notifications/delete", { id })
      return response.data
    },
    onSuccess: (_, id) => {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success("Notification deleted")
    },
    onError: (_, id) => {
      // Offline fallback
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success("Notification deleted")
    }
  })

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    toast.success("All alerts marked as read")
  }

  const clearAll = () => {
    setNotifications([])
    toast.success("All alerts cleared")
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-sm bg-white dark:bg-zinc-900 border-l border-zinc-150 dark:border-zinc-800 shadow-2xl p-4 flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[var(--primary)] shrink-0" />
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Store System Alerts</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Toolbar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase pb-2 mb-2 border-b border-zinc-50 dark:border-zinc-850">
            <button 
              onClick={markAllRead}
              className="flex items-center gap-1 hover:text-[var(--primary)] cursor-pointer"
            >
              <CheckCheck size={12} />
              <span>Mark all read</span>
            </button>
            <button 
              onClick={clearAll}
              className="flex items-center gap-1 hover:text-rose-500 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Clear all</span>
            </button>
          </div>
        )}

        {/* Scrollable Alerts feed */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const isCritical = n.type === "Critical"
              const isWarning = n.type === "Warning"

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border relative group transition-all duration-200 ${
                    n.unread
                      ? isCritical
                        ? "bg-rose-500/5 border-rose-100 dark:bg-rose-955/5 dark:border-rose-900/40"
                        : isWarning
                          ? "bg-amber-500/5 border-amber-100 dark:bg-amber-955/5 dark:border-amber-900/40"
                          : "bg-blue-500/5 border-blue-100 dark:bg-blue-955/5 dark:border-blue-900/40"
                      : "bg-slate-50 border-zinc-150 dark:bg-zinc-950/20 dark:border-zinc-850"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Icon type */}
                    {isCritical ? (
                      <AlertOctagon size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    ) : isWarning ? (
                      <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0 font-bold text-xs pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-900 dark:text-white leading-tight font-extrabold">{n.title}</span>
                        {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">{n.message}</p>
                      <span className="text-[8px] text-slate-400 font-bold block mt-1.5">{n.time}</span>
                    </div>
                  </div>

                  {/* Actions (hover visible) */}
                  <div className="absolute right-2 top-2 flex gap-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {n.unread && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="p-1 text-slate-500 hover:text-emerald-500 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Mark read"
                      >
                        <Check size={11} className="stroke-[3]" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(n.id)}
                      className="p-1 text-slate-550 hover:text-rose-500 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                </div>
              )
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <Bell size={32} className="text-slate-200 dark:text-zinc-850 stroke-[1.5] mb-2" />
              <p className="text-xs text-zinc-400 font-bold">No active notifications</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-4 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-750 dark:text-zinc-250 font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-sm"
          >
            Dismiss Alert Pane
          </button>
        </div>

      </div>
    </>
  )
}
