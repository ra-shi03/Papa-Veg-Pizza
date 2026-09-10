import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Truck, ToggleLeft, ToggleRight, MapPin, X, Map, ShieldAlert, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"

// Mock delivery data
const MOCK_DELIVERY_OVERVIEW = {
  availableRiders: 6,
  assignedRiders: 9,
  delayedDeliveries: 2
}

// Mock active riders list
const MOCK_RIDERS = [
  { name: "Rahul Dev", status: "Delivering", ordersAssigned: "PV-8830", location: "Vijay Nagar Crossing" },
  { name: "Vikram Rathore", status: "Delivering", ordersAssigned: "PV-8828", location: "Palasia square" },
  { name: "Karan Singh", status: "Waiting at Store", ordersAssigned: "None", location: "Store Hub #104" },
  { name: "Amit Kumar", status: "Delivering (Delayed)", ordersAssigned: "PV-8839", location: "Bombay Hospital Road" },
  { name: "Suresh Patil", status: "Idle", ordersAssigned: "None", location: "Store Hub #104" },
  { name: "Rajesh Joshi", status: "Idle", ordersAssigned: "None", location: "Store Hub #104" }
]

export default function DeliveryOverview({ storeId, refreshKey }) {
  const [showRiderModal, setShowRiderModal] = useState(false)
  const [riderFilter, setRiderFilter] = useState("all") // all, available, assigned, delayed

  // Fetch delivery overview
  const { data: deliveryData, isLoading } = useQuery({
    queryKey: ["delivery-overview", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/delivery-overview", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_DELIVERY_OVERVIEW
      }
    }
  })

  const available = deliveryData?.availableRiders ?? 0
  const assigned = deliveryData?.assignedRiders ?? 0
  const delayed = deliveryData?.delayedDeliveries ?? 0

  const handleCardClick = (filter) => {
    setRiderFilter(filter)
    setShowRiderModal(true)
  }

  // Filter riders by selected status card clicked
  const filteredRiders = MOCK_RIDERS.filter((rider) => {
    if (riderFilter === "available") return rider.status === "Idle" || rider.status === "Waiting at Store"
    if (riderFilter === "assigned") return rider.status.startsWith("Delivering")
    if (riderFilter === "delayed") return rider.status.includes("Delayed")
    return true
  })

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[300px]">
      
      {/* Title */}
      <div>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
          <Truck size={16} className="text-[var(--primary)]" />
          Delivery Operations
        </h3>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-3 gap-3.5 my-auto">
        {/* Available Riders */}
        <button
          onClick={() => handleCardClick("available")}
          className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col items-center justify-between text-center cursor-pointer hover:border-emerald-500/20 hover:scale-[1.02] transition-all min-h-[110px]"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <ToggleLeft size={16} />
          </div>
          <div className="mt-2">
            <span className="text-[20px] font-black text-slate-900 dark:text-white block leading-none">{available}</span>
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-widest mt-1 block">Available</span>
          </div>
        </button>

        {/* Assigned Riders */}
        <button
          onClick={() => handleCardClick("assigned")}
          className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col items-center justify-between text-center cursor-pointer hover:border-blue-500/20 hover:scale-[1.02] transition-all min-h-[110px]"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
            <ToggleRight size={16} />
          </div>
          <div className="mt-2">
            <span className="text-[20px] font-black text-slate-900 dark:text-white block leading-none">{assigned}</span>
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-widest mt-1 block">On Delivery</span>
          </div>
        </button>

        {/* Delayed Deliveries */}
        <button
          onClick={() => handleCardClick("delayed")}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center cursor-pointer hover:scale-[1.02] transition-all min-h-[110px] ${
            delayed > 0 
              ? "bg-rose-50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/50" 
              : "bg-slate-50 border-zinc-100 dark:bg-zinc-950 dark:border-zinc-850"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            delayed > 0 ? "bg-rose-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          }`}>
            <AlertTriangle size={15} className={delayed > 0 ? "animate-pulse" : ""} />
          </div>
          <div className="mt-2">
            <span className={`text-[20px] font-black block leading-none ${delayed > 0 ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>{delayed}</span>
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-widest mt-1 block">Delayed</span>
          </div>
        </button>
      </div>

      {/* Summary Footer */}
      <div className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-center border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
        Click any operations card to track couriers
      </div>

      {/* RIDER OVERVIEW MODAL */}
      {showRiderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Rider Overview Grid ({riderFilter})
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">Active delivery fleet status</p>
              </div>
              <button 
                onClick={() => setShowRiderModal(false)}
                className="p-1 rounded-md text-zinc-405 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    <th className="py-2">Rider Name</th>
                    <th className="py-2">Current Status</th>
                    <th className="py-2">Order Assigned</th>
                    <th className="py-2">Current Location</th>
                    <th className="py-2 text-right">Map</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y divide-zinc-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                  {filteredRiders.map((rider, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50">
                      <td className="py-2.5 text-zinc-900 dark:text-white">{rider.name}</td>
                      <td className="py-2.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black ${
                          rider.status.includes("Delayed")
                            ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-455"
                            : rider.status.startsWith("Delivering")
                              ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-450"
                              : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450"
                        }`}>
                          {rider.status}
                        </span>
                      </td>
                      <td className="py-2.5">{rider.ordersAssigned}</td>
                      <td className="py-2.5 text-slate-500">{rider.location}</td>
                      <td className="py-2.5 text-right">
                        <button 
                          onClick={() => toast.success(`Launching active GPS radar tracking for ${rider.name}...`)}
                          className="p-1 rounded bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-[var(--primary)] cursor-pointer"
                        >
                          <MapPin size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowRiderModal(false)}
              className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-750 dark:text-zinc-250 font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-sm text-center"
            >
              Dismiss Window
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
