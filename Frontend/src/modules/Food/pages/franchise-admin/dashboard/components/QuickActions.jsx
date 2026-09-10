import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Ticket, Store, UserPlus, FileText, Bell, Sparkles, X, Send, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { adminAPI } from "@food/api"

export default function QuickActions({ onAddStore, onAddManager, onAddAlert }) {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState(null) // store, manager, alert
  const [loading, setLoading] = useState(false)

  // Form states
  const [storeForm, setStoreForm] = useState({ name: "", phone: "", address: "", commission: "15" })
  const [managerForm, setManagerForm] = useState({ name: "", email: "", store: "Indore Central", phone: "" })
  const [alertForm, setAlertForm] = useState({ title: "", detail: "", type: "low_stock" })

  const actions = [
    { label: "Create Coupon", icon: Ticket, action: () => navigate("/franchise-admin/coupons"), color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
    { label: "Add Store", icon: Store, action: () => setActiveModal("store"), color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { label: "Add Manager", icon: UserPlus, action: () => setActiveModal("manager"), color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20" },
    { label: "View Reports", icon: FileText, action: () => navigate("/franchise-admin/reports"), color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { label: "Broadcast Alert", icon: Bell, action: () => setActiveModal("alert"), color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" }
  ]

  const handleAddStoreSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Simulate API call to create store
      const response = await adminAPI.createStore(storeForm)
      if (response.data?.success) {
        toast.success(`Store "${storeForm.name}" created successfully!`)
        if (onAddStore) onAddStore()
        setStoreForm({ name: "", phone: "", address: "", commission: "15" })
        setActiveModal(null)
      }
    } catch (_) {
      toast.error("Failed to create store.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddManagerSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success(`Manager "${managerForm.name}" registered for ${managerForm.store}!`)
      if (onAddManager) onAddManager()
      setManagerForm({ name: "", email: "", store: "Indore Central", phone: "" })
      setActiveModal(null)
      setLoading(false)
    }, 1200)
  }

  const handleAddAlertSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const newAlert = {
        id: Date.now(),
        title: alertForm.title,
        detail: alertForm.detail,
        type: alertForm.type,
        time: "Just now",
        unread: true
      }
      toast.success("Operations alert broadcasted to feed.")
      if (onAddAlert) onAddAlert(newAlert)
      setAlertForm({ title: "", detail: "", type: "low_stock" })
      setActiveModal(null)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col h-[320px] justify-between">
      <div className="shrink-0 mb-3">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
          <Sparkles size={14} className="text-[var(--primary)]" />
          Quick Actions Shortcuts
        </h3>
        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Rapid operational task entry points</p>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto pr-1 scrollbar-thin">
        {actions.map((act, idx) => {
          const Icon = act.icon
          return (
            <button
              key={idx}
              onClick={act.action}
              className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 hover:border-[var(--primary)]/30 hover:bg-white dark:hover:bg-zinc-850 hover:shadow-sm rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 text-center"
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${act.color}`}>
                <Icon size={16} />
              </div>
              <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{act.label}</span>
            </button>
          )
        })}
      </div>

      {/* Add Store Modal */}
      {activeModal === "store" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-sm w-full overflow-hidden shadow-2xl animate-fade-up text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Add New Franchise Store</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleAddStoreSubmit} className="p-6 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Store Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Papa Veg Pizza - Dewas Hub"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-850 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Store Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543219"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Store Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AB Road, Dewas"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[var(--primary)]/10 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? <RefreshCw size={12} className="animate-spin" /> : "Create Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Manager Modal */}
      {activeModal === "manager" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-sm w-full overflow-hidden shadow-2xl animate-fade-up text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Register Store Manager</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleAddManagerSubmit} className="p-6 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Manager Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={managerForm.name}
                  onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@papavegpizza.com"
                  value={managerForm.email}
                  onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Assigned Outlet</label>
                <select
                  value={managerForm.store}
                  onChange={(e) => setManagerForm({ ...managerForm, store: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                >
                  <option value="Indore Central">Indore Central</option>
                  <option value="Bhopal Zone">Bhopal Zone</option>
                  <option value="Ujjain Branch">Ujjain Branch</option>
                  <option value="Gwalior Hub">Gwalior Hub</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[var(--primary)]/10 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? <RefreshCw size={12} className="animate-spin" /> : "Register Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {activeModal === "alert" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-sm w-full overflow-hidden shadow-2xl animate-fade-up text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Broadcast Operations Alert</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleAddAlertSubmit} className="p-6 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Alert Category</label>
                <select
                  value={alertForm.type}
                  onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                >
                  <option value="low_stock">Low Stock Alert</option>
                  <option value="complaint">New Customer Complaint</option>
                  <option value="refund">Refund request ticket</option>
                  <option value="offline">Outlet Offline report</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical stock: Paneer"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Alert Details</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Describe the operational incident details..."
                  value={alertForm.detail}
                  onChange={(e) => setAlertForm({ ...alertForm, detail: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[var(--primary)]/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={11} />
                  <span>Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
