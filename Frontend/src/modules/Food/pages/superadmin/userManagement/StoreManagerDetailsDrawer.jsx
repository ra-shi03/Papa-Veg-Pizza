import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  Store,
  MapPin,
  TrendingUp,
  ClipboardList,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  ArrowUpRight,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  Clock,
  ShieldAlert,
  TrendingDown,
  Star,
  Activity,
  AlertTriangle,
  Award,
  BellRing
} from "lucide-react"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"
import { adminAPI } from "@food/api"

export default function StoreManagerDetailsDrawer({ isOpen, onClose, manager, onEdit }) {
  const [activeTab, setActiveTab] = useState("Overview")
  const [fetchedData, setFetchedData] = useState(null)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isOpen && manager && (manager.id || manager.raw?._id)) {
      const fetchDetails = async () => {
        try {
          setLoading(true)
          const idToFetch = manager.raw?._id || manager.id;
          const res = await adminAPI.getStoreManagerById(idToFetch);
          if (res?.data?.success) {
            setFetchedData(res.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch manager details:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchDetails()
    } else {
      setFetchedData(null)
    }
  }, [isOpen, manager])

  // Extract detailed data from the manager prop or fetched data
  const details = useMemo(() => {
    if (!manager) return null
    
    const raw = fetchedData || manager.raw || {}
    const dateObj = new Date(manager.joinedDate || raw.joinedDate || raw.createdAt)
    const assignedDate = isNaN(dateObj) ? "Unknown" : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    return {
      assignedStore: raw.storeName || manager.store,
      storeId: raw.storeCode || manager.storeCode,
      storeGroup: raw.franchiseName || manager.group,
      franchiseOwner: raw.franchiseOwnerName || manager.franchiseOwner,
      storeAddress: raw.storeAddress || manager.storeAddress,
      storeEmail: raw.storeEmail || raw.store?.email || "Not Available",
      assignedDate: assignedDate,
      address: raw.personalDetails?.address || "No address provided",
      salary: raw.personalDetails?.salary || "N/A",
      emergencyContact: raw.personalDetails?.emergencyContact || "N/A"
    }
  }, [manager, fetchedData])

  if (!manager || !details) return null

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "ACTIVE":
        return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      case "On Leave":
      case "ON LEAVE":
        return "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      case "Suspended":
      case "SUSPENDED":
        return "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/20"
      default:
        return "bg-zinc-50 dark:bg-zinc-950/20 text-zinc-500 border border-zinc-500/20"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] cursor-pointer"
          />

          {/* Sliding Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm md:max-w-md bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-155 dark:border-zinc-855 z-[105] shadow-2xl flex flex-col h-full"
          >
            {/* Header section with profile name and main CTA */}
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)]/20 to-[var(--primary)]/5 text-[var(--primary)] flex items-center justify-center font-black text-xs border border-[var(--primary)]/10 shadow-inner">
                  {manager.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                    {manager.name}
                  </h3>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-505 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>{manager.id}</span>
                    <span>•</span>
                    <span>{details.storeGroup}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 active:scale-95 transition-all cursor-pointer"
                aria-label="Close drawer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Main scrollable body area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
              <div className="space-y-4">
                {/* General Profile Overview Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col items-center text-center">
                      <div className="relative mb-3.5">
                        {manager.avatar ? (
                          <img
                            alt={manager.name}
                            src={manager.avatar}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-zinc-50 dark:border-zinc-850 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[var(--primary)] to-amber-500 text-white flex items-center justify-center font-bold text-base shadow-md border-4 border-zinc-50 dark:border-zinc-850">
                            {manager.name.split(" ").map(n => n[0]).join("")}
                          </div>
                        )}
                        <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${
                          manager.status === "Active" ? "bg-emerald-500" : manager.status === "On Leave" ? "bg-amber-500" : "bg-rose-500"
                        }`} />
                      </div>

                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 leading-tight">
                        {manager.name}
                      </h4>
                      
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-1.5 ${getStatusColor(manager.status)}`}>
                        {manager.status}
                      </span>

                      {/* Contact fields list */}
                      <div className="w-full space-y-2.5 text-left pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                        <div className="flex items-center gap-2.5">
                          <MapPin size={14} className="text-zinc-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Address</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 truncate mt-0.5" title={details.address}>{details.address}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Mail size={14} className="text-zinc-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 truncate mt-0.5">{manager.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Phone size={14} className="text-zinc-400 flex-shrink-0" />
                          <div>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Phone number</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 mt-0.5">{manager.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Calendar size={14} className="text-zinc-400 flex-shrink-0" />
                          <div>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Since</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 mt-0.5">{details.assignedDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STORE ASSIGNMENT */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                            <Store size={16} className="stroke-[2.2]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                              {details.assignedStore}
                            </h4>
                            <p className="text-[8px] text-zinc-400 font-bold mt-0.5">
                              ID: {details.storeId}
                            </p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          STORE LIVE
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5 py-3 border-y border-zinc-100 dark:border-zinc-800">
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Franchise Group</p>
                          <p className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">
                            {details.storeGroup}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Franchise Owner</p>
                          <p className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">
                            {details.franchiseOwner}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 pt-1 text-[9px] text-zinc-450 dark:text-zinc-400 font-medium leading-relaxed">
                        <div className="flex items-start gap-2">
                          <Mail size={13} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-xs text-zinc-850 dark:text-zinc-50">Store Email</p>
                            <p className="mt-0.5">{details.storeEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-1">
                          <MapPin size={13} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-xs text-zinc-850 dark:text-zinc-50">Store Address</p>
                            <p className="mt-0.5">{details.storeAddress}</p>
                          </div>
                        </div>
                      </div>
                    </div>
              </div>
            </div>

            {/* Sticky Action Footer buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 z-10 flex-shrink-0">
              <button
                onClick={() => {
                  window.location.href = `mailto:${manager.email}`
                }}
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/95 text-white py-1.5 rounded-lg font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} className="stroke-[2.2]" />
                <span>Message Manager</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
