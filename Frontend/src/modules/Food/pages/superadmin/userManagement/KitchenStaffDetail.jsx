import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ChangeShiftModal from "./ChangeShiftModal"
import {
  X,
  Calendar,
  Mail,
  Phone,
  MapPin,
  UtensilsCrossed,
  CheckCircle,
  Sun,
  Edit
} from "lucide-react"

export default function KitchenStaffDetail({ isOpen, onClose, staff, onEdit, onSuspend }) {
  if (!staff) return null;

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const handleShiftConfirm = (staff, newShift, date, reason) => {
    alert(`Shift change request to ${newShift} Shift submitted successfully for ${staff.name}.`);
    setIsShiftModalOpen(false);
  };

  // Derive profile image from staff name
  const getProfileImage = (name) => {
    if (name?.toLowerCase().includes("antonio")) return "/chef_antonio.webp"
    if (name?.toLowerCase().includes("sarah")) return "/chef_sarah.webp"
    if (name?.toLowerCase().includes("marco")) return "/chef_marco.webp"
    if (name?.toLowerCase().includes("elena")) return "/chef_elena.webp"
    return "/chef_antonio.webp"
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex justify-end">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[380px] bg-white dark:bg-zinc-950 shadow-2xl z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full"
            >
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-955 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={onClose}
                    className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Staff Profile</h3>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Employee ID: {staff.id}</p>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${staff.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  staff.status === "Inactive" ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                  <span className={`w-1 h-1 rounded-full ${staff.status === "Active" ? "bg-green-500" :
                    staff.status === "Inactive" ? "bg-zinc-500" : "bg-red-500"
                    }`}></span>
                  {staff.status}
                </span>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3.5 space-y-4">
                {/* Section 1: Hero & Personal Info */}
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={getProfileImage(staff.name)}
                        alt={staff.name}
                        className="w-16 h-16 rounded-xl object-cover shadow-md border-2 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{staff.name}</h4>
                      <p className="text-[var(--primary)] text-xs font-medium">{staff.role}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-zinc-500 dark:text-zinc-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-medium">Joined Oct 12, 2023</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg flex items-center gap-4 border border-zinc-100 dark:border-zinc-800/50">
                      <Mail className="text-[var(--primary)]" size={16} />
                      <div>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Email Address</p>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{staff.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="bg-zinc-55 dark:bg-zinc-900/50 p-2.5 rounded-lg flex items-center gap-4 border border-zinc-100 dark:border-zinc-800/50">
                      <Phone className="text-[var(--primary)]" size={16} />
                      <div>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Phone Number</p>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">+1 (555) 012-7742</p>
                      </div>
                    </div>
                    <div className="bg-zinc-55 dark:bg-zinc-900/50 p-2.5 rounded-lg flex items-center gap-4 border border-zinc-100 dark:border-zinc-800/50">
                      <MapPin className="text-[var(--primary)]" size={16} />
                      <div>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Home Address</p>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">124 Flatbush Ave, Brooklyn, NY 11217</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Store Assignment */}
                <section className="space-y-4">
                  <h5 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Store Assignment</h5>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{staff.store}</p>
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Franchise: {staff.franchise}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center text-[9px] font-bold">SJ</span>
                        <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">Mgr: Sarah Jenkins</span>
                      </div>
                    </div>
                    <UtensilsCrossed className="text-zinc-300 dark:text-zinc-700" size={32} />
                  </div>
                </section>

                {/* Section 3 & 4: Performance & Analytics */}
                <section className="space-y-4">
                  <h5 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Performance Overview</h5>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl text-center border border-red-100 dark:border-red-900/30">
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Today</p>
                      <p className="text-base font-bold text-red-600 dark:text-red-400">42</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1">Orders</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-955/20 p-2.5 rounded-xl text-center border border-green-100 dark:border-green-900/30">
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Efficiency</p>
                      <p className="text-base font-bold text-green-600 dark:text-green-400">{staff.efficiency}%</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1">Target met</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-955/20 p-2.5 rounded-xl text-center border border-orange-100 dark:border-orange-900/30">
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Rating</p>
                      <p className="text-base font-bold text-orange-600 dark:text-orange-400">4.8</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1">Top Tier</p>
                    </div>
                  </div>

                  {/* Prep Time Trend (Visual Representation) */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Prep Time Trend</p>
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Avg: 8.2 min</span>
                    </div>
                    <div className="h-16 flex items-end justify-between gap-1 px-2">
                      {[60, 45, 70, 85, 55, 90, 95, 40, 65, 30].map((height, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-t-sm transition-all duration-500 ${height > 80 ? 'bg-[var(--primary)]' :
                            height > 50 ? 'bg-[var(--primary)]/60' : 'bg-[var(--primary)]/30'
                            }`}
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">08:00</span>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">12:00</span>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">16:00</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Total Prepared</p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{staff.orders.toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Accuracy Rate</p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">99%</p>
                    </div>
                  </div>
                </section>

                {/* Section 5: Attendance (Calendar) */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Attendance</h5>
                    <span className="text-green-600 dark:text-green-400 text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle size={14} />
                      0 Absences
                    </span>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
                    <p className="text-xs font-bold text-center mb-3 text-zinc-900 dark:text-zinc-100">October 2023</p>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <span key={i} className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">{day}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {/* Calendar Days */}
                      {Array.from({ length: 31 }).map((_, i) => {
                        const day = i + 1;
                        let className = "aspect-square flex items-center justify-center text-[10px] font-medium rounded-full ";

                        if (day < 12) {
                          className += "text-zinc-400 dark:text-zinc-600"; // Past days not attended/recorded
                        } else if (day === 12) {
                          className += "bg-green-600 text-white font-bold"; // First day attended
                        } else if (day > 12 && day < 25) {
                          className += "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"; // Attended
                        } else if (day === 25) {
                          className += "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-2 border-[var(--primary)]"; // Today
                        } else {
                          className += "text-zinc-700 dark:text-zinc-300"; // Future days
                        }

                        return (
                          <div key={i} className={className}>
                            {day}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>

                {/* Section 6: Shift Info */}
                <section className="space-y-4 pb-8">
                  <h5 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Shift Info</h5>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl flex items-center gap-4 border border-zinc-200 dark:border-zinc-800">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-full text-[var(--primary)] shadow-sm">
                      <Sun size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{staff.shift} Shift</p>
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">08:00 - 16:00</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sticky Action Buttons Footer */}
              <div className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3 mt-auto">
                {/* <button 
                onClick={() => onEdit(staff)}
                className="col-span-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white py-1.5 rounded-lg text-xs font-bold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Edit size={14} />
                Edit Details
              </button> */}
                {/* <button
                  onClick={() => setIsShiftModalOpen(true)}
                  className="border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Change Shift
                </button> */}
                <button
                  onClick={() => onSuspend(staff)}
                  className="border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  {staff.status === "Active" ? "Suspend" : "Activate"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ChangeShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        staff={staff}
        onConfirm={handleShiftConfirm}
      />
    </>
  )
}
