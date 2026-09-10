import React from "react"
import { X, Phone, Mail, MessageCircle, User } from "lucide-react"

export default function ContactManagerModal({ isOpen, onClose, manager }) {
  if (!isOpen || !manager) return null

  const handleCall = () => {
    window.location.href = `tel:${manager.phone || ""}`
  }

  const handleEmail = () => {
    window.location.href = `mailto:${manager.email || ""}?subject=Papa Veg Pizza Store Application`
  }

  const handleWhatsApp = () => {
    const sanitizedPhone = String(manager.phone || "").replace(/\D/g, "")
    // Default country code to +91 if length is 10 digits
    const targetPhone = sanitizedPhone.length === 10 ? `91${sanitizedPhone}` : sanitizedPhone
    window.open(`https://wa.me/${targetPhone}?text=Hello%20${encodeURIComponent(manager.name || "Manager")},%20this%2520is%2520Franchise%2520Admin%2520regarding%2520your%2520store%2520approval%2520application.`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden scale-in duration-200 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contact Manager</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-605 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400">
            <User className="w-8 h-8 text-primary/70" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-850 dark:text-slate-200">{manager.name || "Store Manager"}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Assigned Manager Profile</p>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold select-all">{manager.phone || "No phone added"}</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold select-all truncate">{manager.email || "No email added"}</span>
          </div>
        </div>

        {/* Interactive Action CTA Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={handleCall}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold"
          >
            <Phone className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px]">Call</span>
          </button>
          
          <button
            onClick={handleEmail}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold"
          >
            <Mail className="w-4 h-4 text-blue-500" />
            <span className="text-[10px]">Email</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-500/25" />
            <span className="text-[10px]">WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  )
}
