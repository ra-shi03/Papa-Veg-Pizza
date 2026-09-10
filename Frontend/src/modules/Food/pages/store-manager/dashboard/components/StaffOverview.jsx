import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, UserCheck, Clock, UserX, X, Search, ChevronRight } from "lucide-react"
import apiClient from "@/services/api/axios"

// Mock staff overview
const MOCK_STAFF_OVERVIEW = {
  present: 12,
  late: 2,
  absent: 1
}

// Mock staff attendance details
const MOCK_STAFF_ATTENDANCE = [
  { employee: "Alok Gupta", role: "Store Manager", shift: "Morning", status: "Present" },
  { employee: "Karan Malhotra", role: "Head Pizza Chef", shift: "Morning", status: "Present" },
  { employee: "Sunil Verma", role: "Kitchen Helper", shift: "Morning", status: "Present" },
  { employee: "Ramesh Singh", role: "Delivery Rider", shift: "Morning", status: "Present" },
  { employee: "Vijay Kadam", role: "Delivery Rider", shift: "Morning", status: "Present" },
  { employee: "Sanjay Dutt", role: "Delivery Rider", shift: "Morning", status: "Late" },
  { employee: "Ashish Kumar", role: "Delivery Rider", shift: "Morning", status: "Late" },
  { employee: "Suresh Patil", role: "Cook Specialist", shift: "Morning", status: "Absent" },
  
  { employee: "Pooja Rawat", role: "Assistant Manager", shift: "Evening", status: "Present" },
  { employee: "Irfan Khan", role: "Oven Specialist", shift: "Evening", status: "Present" },
  { employee: "Deepak Jha", role: "Prep Chef", shift: "Evening", status: "Present" }
]

export default function StaffOverview({ storeId, refreshKey }) {
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all") // all, present, late, absent

  // Modal filters
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Fetch staff overview
  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff-overview-widget", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/staff-overview", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_STAFF_OVERVIEW
      }
    }
  })

  const present = staffData?.present ?? 0
  const late = staffData?.late ?? 0
  const absent = staffData?.absent ?? 0

  const handleCardClick = (status) => {
    setFilterStatus(status)
    setShowRosterModal(true)
  }

  // Filter roster by clicked card + search query
  const filteredRoster = MOCK_STAFF_ATTENDANCE.filter((staff) => {
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "present" && staff.status === "Present") ||
      (filterStatus === "late" && staff.status === "Late") ||
      (filterStatus === "absent" && staff.status === "Absent")
      
    const matchesSearch = 
      staff.employee.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      staff.role.toLowerCase().includes(debouncedSearch.toLowerCase())

    return matchesStatus && matchesSearch
  })

  // Pagination parameters
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredRoster.length / itemsPerPage)
  const paginatedRoster = filteredRoster.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[300px]">
      
      {/* Title */}
      <div>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
          <Users size={16} className="text-[var(--primary)]" />
          Staff Roster Summary
        </h3>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-3 gap-3.5 my-auto">
        
        {/* Present Card */}
        <button
          onClick={() => handleCardClick("present")}
          className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col items-center justify-between text-center cursor-pointer hover:border-emerald-500/20 hover:scale-[1.02] transition-all min-h-[110px] w-full"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={15} />
          </div>
          <div className="mt-2">
            <span className="text-[20px] font-black text-slate-900 dark:text-white block leading-none">{present}</span>
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-widest mt-1 block">Present</span>
          </div>
        </button>

        {/* Late Card */}
        <button
          onClick={() => handleCardClick("late")}
          className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col items-center justify-between text-center cursor-pointer hover:border-amber-500/20 hover:scale-[1.02] transition-all min-h-[110px] w-full"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={15} />
          </div>
          <div className="mt-2">
            <span className="text-[20px] font-black text-slate-900 dark:text-white block leading-none">{late}</span>
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-widest mt-1 block">Late arrival</span>
          </div>
        </button>

        {/* Absent Card */}
        <button
          onClick={() => handleCardClick("absent")}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center cursor-pointer hover:scale-[1.02] transition-all min-h-[110px] w-full ${
            absent > 0
              ? "bg-rose-50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/50"
              : "bg-slate-50 border-zinc-100 dark:bg-zinc-950 dark:border-zinc-850"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            absent > 0 ? "bg-rose-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
          }`}>
            <UserX size={15} />
          </div>
          <div className="mt-2">
            <span className={`text-[20px] font-black block leading-none ${absent > 0 ? "text-rose-505" : "text-slate-900 dark:text-white"}`}>{absent}</span>
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-widest mt-1 block">Absent</span>
          </div>
        </button>

      </div>

      <div className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-center border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
        Click counts to audit shift attendance sheet
      </div>

      {/* STAFF ATTENDANCE MODAL */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Staff Shift Attendance ({filterStatus})
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold mt-0.5">Audit log for current active roster</p>
              </div>
              <button 
                onClick={() => setShowRosterModal(false)}
                className="p-1 rounded-md text-zinc-405 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Filter Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input
                type="text"
                placeholder="Search staff name or role..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-955/50 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-bold placeholder-zinc-450"
              />
            </div>

            {/* Attendance list table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    <th className="py-2">Employee</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Active Shift</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y divide-zinc-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                  {paginatedRoster.length > 0 ? (
                    paginatedRoster.map((staff, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50">
                        <td className="py-2.5 text-zinc-900 dark:text-white">{staff.employee}</td>
                        <td className="py-2.5 text-slate-500">{staff.role}</td>
                        <td className="py-2.5">{staff.shift}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black ${
                            staff.status === "Present" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450"
                              : staff.status === "Late"
                                ? "bg-amber-50 text-amber-705 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450"
                                : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450"
                          }`}>
                            {staff.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-zinc-400 font-bold">No roster records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3.5 mt-4">
                <span className="text-[10px] text-slate-400 font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1 text-[10px] bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-350 font-black rounded-lg disabled:opacity-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1 text-[10px] bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-350 font-black rounded-lg disabled:opacity-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
