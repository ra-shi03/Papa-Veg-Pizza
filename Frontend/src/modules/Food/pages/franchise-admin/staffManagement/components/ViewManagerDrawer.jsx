import React, { useState, useEffect } from "react"
import {
  X, Phone, MapPin
} from "lucide-react"
import { adminAPI } from "../../../../../../services/api"

export default function ViewManagerDrawer({ isOpen, onClose, manager: initialManager, defaultTab = "profile", stores = [] }) {
  const [manager, setManager] = useState(initialManager)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && initialManager?._id) {
      setManager(initialManager)
      setLoading(true)
      adminAPI.getStoreManagerById(initialManager._id)
        .then(res => {
          if (res?.data?.success) {
            setManager(res.data.data)
          }
        })
        .catch(err => console.error("Failed to fetch manager details:", err))
        .finally(() => setLoading(false))
    }
  }, [isOpen, initialManager])

  if (!isOpen || !manager) return null

  const assignedStore = stores.find((s) => s._id === manager.storeId)

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A"
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <>
      {/* Backdrop restricted to content area */}
      <div
        className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Inset Drawer Page Container */}
      <div className="fixed z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 shadow-2xl transition-all duration-300 animate-slide-in-right right-0 top-[64px] bottom-0 w-full h-[calc(100vh-64px)] rounded-none border-l border-zinc-200 dark:border-zinc-800 lg:top-[80px] lg:bottom-6 lg:right-6 lg:w-[calc(100vw-312px)] lg:max-w-[1200px] lg:h-[calc(100vh-104px)] lg:rounded-2xl lg:border lg:border-zinc-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 shrink-0 lg:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <img
              src={manager.profileImage}
              alt={manager.name}
              className="w-11 h-11 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">{manager.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  manager.status === "Active"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                    : manager.status === "On Leave"
                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                      : "bg-red-50 dark:bg-red-950/20 text-red-650"
                }`}>
                  {manager.status}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                Employee Code: {manager.employeeCode} • Store Assignment: {assignedStore ? assignedStore.storeName : "None"}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* Left card */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 text-center shadow-xs">
                  <img
                    src={manager.profileImage}
                    alt={manager.name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-zinc-200 dark:border-zinc-800 shadow-md"
                  />
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white mt-3 uppercase tracking-wider">{manager.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Franchise Store Manager</p>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <div className="text-center">
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Joined Date</span>
                      <span className="text-[11px] font-black text-zinc-800 dark:text-white mt-0.5 block">{formatDate(manager.joinedDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Emergency Contact</span>
                  <div className="flex gap-2 items-center text-xs font-semibold text-zinc-750 dark:text-zinc-300">
                    <Phone size={13} className="text-zinc-400 shrink-0" />
                    <p className="text-[11px]">{manager.emergencyContact || manager.personalDetails?.emergencyContact || "No contact listed"}</p>
                  </div>
                </div>
              </div>

              {/* Right column details */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Employment Profile Overview</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Full Name</span>
                      <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white">{manager.name}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</span>
                      <span className="text-[11px] font-extrabold">{manager.email}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Phone</span>
                      <span className="text-[11px] font-extrabold">{manager.phone}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Employee ID</span>
                      <span className="text-[11px] font-extrabold">{manager.employeeCode}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Store</span>
                      <span className="text-[11px] font-extrabold text-[var(--primary)]">{assignedStore ? assignedStore.storeName : "None"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Monthly Salary</span>
                      <span className="text-[11px] font-extrabold">₹ {manager.salary || manager.personalDetails?.salary || 0}</span>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Home Address</span>
                      <span className="text-[11px] font-medium leading-normal flex items-start gap-1">
                        <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                        {manager.address || manager.personalDetails?.address || "Address not provided"}
                      </span>
                    </div>
                  </div>
                </div>
                  </div>
                </div>



        </div>

      </div>
    </>
  )
}
