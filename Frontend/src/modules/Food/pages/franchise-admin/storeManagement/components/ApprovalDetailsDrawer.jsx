import React, { useState, useEffect } from "react"
import { X, RefreshCw, Building2, FileText, User, ListTodo, Download, Eye, Calendar, MapPin, Phone, Mail, AlertTriangle, ShieldCheck } from "lucide-react"
import { adminAPI } from "@food/api"
import DocViewerModal from "./DocViewerModal"

export default function ApprovalDetailsDrawer({ isOpen, onClose, approval }) {
  if (!isOpen || !approval) return null

  const [activeTab, setActiveTab] = useState("store")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)

  useEffect(() => {
    if (!isOpen || !approval) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setData(null)

        if (activeTab === "store") {
          // Fetch store details
          try {
            const res = await adminAPI.getSingleStore(approval.storeId)
            setData(res?.data?.data || null)
          } catch (err) {
            // Store might not exist yet if it is pending approval, which is expected.
            setData(null)
          }
        } else if (activeTab === "manager") {
          // Fetch manager details
          try {
            const res = await adminAPI.getSingleUser(approval.managerId)
            setData(res?.data?.data || null)
          } catch (err) {
            setData(null)
          }
        } else if (activeTab === "audit") {
          // Fetch audit timeline
          try {
            const res = await adminAPI.getStoreApprovalAudit(approval._id)
            setData(res?.data?.data || [])
          } catch (err) {
            setData([])
          }
        }
      } catch (err) {
        setError("Failed to fetch application details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab, approval, isOpen])

  const handleDownloadDoc = (doc, e) => {
    e.stopPropagation()
    const link = document.createElement ? document.createElement("a") : window.document.createElement("a")
    link.href = doc.url
    link.download = doc.name || "document"
    link.target = "_blank"
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  const getStatusBadge = (status) => {
    if (status === "Approved") return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
    if (status === "Rejected") return "bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
    return "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
        
        {/* Backdrop click */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        {/* Slideout Panel */}
        <div className="relative w-full max-w-3xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-primary">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
                    {approval.storeName}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(approval.status)}`}>
                    {approval.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Code: {approval.storeCode || "Pending"} | Type: {approval.storeType}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-tabs Selectors */}
          <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-slate-850 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/20">
            {[
              { id: "store", label: "Store Info", icon: Building2 },
              { id: "documents", label: "Documents", icon: FileText },
              { id: "manager", label: "Manager Details", icon: User },
              { id: "audit", label: "Audit Logs", icon: ListTodo }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Drawer Body Container */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/10">
            {loading && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-450">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
                <span className="text-xs font-semibold">Fetching details...</span>
              </div>
            )}

            {error && !loading && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex items-center justify-center h-48 text-center text-rose-650 dark:text-rose-400">
                <span className="text-xs font-semibold">{error}</span>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* 1. STORE INFO TAB */}
                {activeTab === "store" && (
                  <div className="space-y-6">
                    {/* Basic Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Store Name", value: approval.storeName },
                        { label: "Store Code", value: approval.storeCode || "PVP-STR-PENDING" },
                        { label: "Store Type", value: approval.storeType },
                        { label: "Phone Number", value: approval.phone },
                        { label: "Email Address", value: approval.email },
                        { label: "Opening Date", value: data?.openingDate || "Will be set on approval" },
                        { label: "Max Orders/Hour", value: data?.maxOrdersHour || 60 },
                        { label: "Kitchen Capacity", value: data?.maxKitchenCapacity ? `${data.maxKitchenCapacity}%` : "100%" }
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
                          <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {item.label}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Address Section */}
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
                      <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Location Details
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {approval.address?.line1}, {approval.address?.city}, {approval.address?.state} - {approval.address?.pincode}
                      </p>
                      {approval.address?.coordinates && (
                        <div className="flex gap-4 mt-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" /> Latitude: {approval.address.coordinates[1]}</span>
                          <span>Longitude: {approval.address.coordinates[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. DOCUMENTS GRID TAB */}
                {activeTab === "documents" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3.5">
                      {approval.documents?.map((doc, idx) => (
                        <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between h-[120px] hover:border-primary/45 transition-colors">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-500 shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{doc.type}</span>
                              <span className="block text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{doc.name || "document.pdf"}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850 pt-2 text-[10px] font-bold">
                            <span className="text-slate-400 flex items-center gap-1 font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(approval.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 hover:text-primary transition-colors"
                                title="View Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDownloadDoc(doc, e)}
                                className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-555 hover:text-primary transition-colors"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. MANAGER DETAILS TAB */}
                {activeTab === "manager" && (
                  <div className="space-y-6">
                    {/* Manager Card Header */}
                    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs text-center space-y-3">
                      <div className="w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400">
                        <User className="w-10 h-10 text-primary/70" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-850 dark:text-slate-200">{approval.managerName}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Assigned Manager</p>
                      </div>
                    </div>

                    {/* Stats List */}
                    <div className="space-y-3">
                      {[
                        { label: "Phone", value: approval.phone, icon: Phone },
                        { label: "Email Address", value: approval.email, icon: Mail },
                        { label: "Account ID", value: approval.managerId, icon: User },
                        { label: "Manager Status", value: data?.status || "Active", icon: ShieldCheck }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
                          <div className="p-2 bg-slate-50 dark:bg-slate-850 text-slate-455 dark:text-slate-400 rounded-lg">
                            <item.icon className="w-4 h-4 text-primary/70" />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">{item.label}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-250 select-all">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. AUDIT LOGS TAB */}
                {activeTab === "audit" && Array.isArray(data) && (
                  <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 max-w-lg mx-auto py-4">
                    {data.map((log, idx) => {
                      const isApproved = log.action === "Approved"
                      const isRejected = log.action === "Rejected"
                      return (
                        <div key={idx} className="relative">
                          {/* Timeline Dot */}
                          <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border bg-white dark:bg-slate-900 flex items-center justify-center ${
                            isApproved
                              ? "border-emerald-500 text-emerald-500"
                              : isRejected
                                ? "border-rose-500 text-rose-500"
                                : "border-amber-500 text-amber-500"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-amber-500"
                            }`} />
                          </div>

                          {/* Log Info */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                isApproved
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                                  : isRejected
                                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-650"
                                    : "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                              }`}>
                                {log.actor}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                {new Date(log.date).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2.5 rounded-xl">
                              {log.remarks}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {/* DOCUMENT PREVIEW LIGHTBOX */}
      <DocViewerModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </>
  )
}
