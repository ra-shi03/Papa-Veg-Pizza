import React, { useState, useEffect } from "react"
import { X, Clock, Calendar, ShieldCheck, History, Info, AlertTriangle, ArrowRight, User } from "lucide-react"
import { adminAPI } from "@food/api"

export default function ViewScheduleDrawer({ isOpen, onClose, store }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [scheduleData, setScheduleData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && store?.storeId) {
      setActiveTab("overview")
      setScheduleData(null)
      setError(null)
      fetchSchedule()
    }
  }, [isOpen, store])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getStoreOperatingHours(store.storeId)
      setScheduleData(res?.data?.data || null)
    } catch (err) {
      setError("Failed to load operating hours details.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !store) return null

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  const getTodayScheduleString = (data) => {
    if (!data) return "N/A"
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    const dayData = data[today]
    if (!dayData) return "N/A"
    if (dayData.isClosed) return "Closed Today"
    if (dayData.open === "12:00 AM" && dayData.close === "12:00 AM") return "Open 24 Hours"
    return `${dayData.open} - ${dayData.close}`
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A"
    const date = new Date(isoString)
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  }

  const getStatusBadge = (isOpenVal) => {
    if (isOpenVal) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 border border-emerald-200/50 dark:border-emerald-900/30">
          Open Now
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-650 border border-rose-200/50 dark:border-rose-900/30">
        Closed
      </span>
    )
  }

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Slideout Panel */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-primary">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{store.storeName}</h2>
                {getStatusBadge(store.isOpen)}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Code: {store.storeCode || store.storeId} | {store.city} | {store.storeType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-850 px-4 bg-slate-50/50 dark:bg-slate-950/20">
          {[
            { id: "overview", label: "Overview", icon: Info },
            { id: "weekly", label: "Weekly Schedule", icon: Clock },
            { id: "holidays", label: "Holidays", icon: Calendar },
            { id: "audit", label: "Audit Logs", icon: History }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="space-y-4 py-8">
              <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse" />
              <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse" />
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-center text-xs text-rose-650 font-medium">
              {error}
            </div>
          )}

          {!loading && !error && scheduleData && (
            <div className="space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">
                        Today's Timing
                      </span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {getTodayScheduleString(scheduleData)}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">
                        Last Updated
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {formatDateTime(scheduleData.updatedAt)}
                      </p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
                        By {scheduleData.updatedBy || "System"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850 p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                      Store Metadata
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 text-xs">
                      <div>
                        <span className="text-slate-400">Store Name:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{store.storeName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Type:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{store.storeType}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">City / Zone:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{store.city}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Status:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{store.status}</p>
                      </div>
                    </div>
                  </div>

                  {scheduleData.holidaySchedule?.some(h => {
                    const hDate = new Date(h.date)
                    const today = new Date()
                    return hDate.toDateString() === today.toDateString()
                  }) && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex gap-3 text-amber-700 dark:text-amber-500">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold">Holiday Closure Scheduled Today</h4>
                        <p className="text-[11px] mt-1 text-amber-600/90 dark:text-amber-500/80">
                          This store is scheduled to follow holiday hours or closure due to:{" "}
                          <span className="font-semibold">
                            {scheduleData.holidaySchedule.find(h => new Date(h.date).toDateString() === new Date().toDateString())?.reason}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: WEEKLY SCHEDULE */}
              {activeTab === "weekly" && (
                <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <th className="px-4 py-3">Day</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Timings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                      {daysOfWeek.map((day) => {
                        const dayInfo = scheduleData[day] || { isClosed: true }
                        const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day

                        return (
                          <tr
                            key={day}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors ${
                              isToday ? "bg-amber-500/5 dark:bg-amber-500/5 font-semibold" : ""
                            }`}
                          >
                            <td className="px-4 py-3.5 capitalize flex items-center gap-1.5">
                              {day}
                              {isToday && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Today" />
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {dayInfo.isClosed ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200/50 dark:border-slate-800/50">
                                  Closed
                                </span>
                              ) : dayInfo.open === "12:00 AM" && dayInfo.close === "12:00 AM" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 border border-emerald-150/50 dark:border-emerald-900/30">
                                  24 Hours
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-650 border border-blue-150/50 dark:border-blue-900/30">
                                  Open
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-slate-700 dark:text-slate-350">
                              {dayInfo.isClosed ? (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              ) : dayInfo.open === "12:00 AM" && dayInfo.close === "12:00 AM" ? (
                                <span className="text-emerald-600 dark:text-emerald-500 font-bold">12:00 AM - 12:00 AM</span>
                              ) : (
                                <span>
                                  {dayInfo.open} <span className="text-slate-400 dark:text-slate-600 mx-1">→</span> {dayInfo.close}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: HOLIDAY SCHEDULE */}
              {activeTab === "holidays" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                      Scheduled Holidays & Special Days
                    </h3>
                  </div>

                  {!scheduleData.holidaySchedule || scheduleData.holidaySchedule.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No holidays scheduled</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        This store follows normal weekly operations.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-55 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3 text-right">Timing Settings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                          {scheduleData.holidaySchedule.map((holiday, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                                {new Date(holiday.date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 dark:text-slate-450 font-medium">
                                {holiday.reason}
                              </td>
                              <td className="px-4 py-3.5 text-right font-semibold">
                                {holiday.isClosed ? (
                                  <span className="text-xs text-rose-650 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-150/40 dark:border-rose-900/30">
                                    Closed All Day
                                  </span>
                                ) : (
                                  <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-150/40 dark:border-amber-900/30">
                                    {holiday.open} - {holiday.close}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AUDIT LOGS */}
              {activeTab === "audit" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                    Operation Updates History
                  </h3>

                  {!scheduleData.auditLogs || scheduleData.auditLogs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      <History className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No log history found</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-150 dark:border-slate-800 ml-3.5 pl-6 space-y-6 py-2">
                      {scheduleData.auditLogs.map((log, idx) => (
                        <div key={idx} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-primary border border-white dark:border-slate-950 transition-colors" />

                          <div className="text-xs">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded">
                                <User className="w-2.5 h-2.5" />
                                {log.updatedBy}
                              </span>
                              <span>•</span>
                              <span className="text-[10px] font-semibold">{formatDateTime(log.date)}</span>
                            </div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 mt-1.5">{log.action}</p>
                            {log.remarks && (
                              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 italic border-l-2 border-slate-200 dark:border-slate-800 pl-2">
                                "{log.remarks}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
