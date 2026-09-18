import React, { useState, useEffect } from "react"
import { X, RefreshCw, Building2, FileText, User, Calendar, MapPin, Phone, Mail, ShieldCheck, Download, Eye, AlertCircle } from "lucide-react"
import { adminAPI } from "@food/api"
import DocViewerModal from "./DocViewerModal"

export default function ApproveModal({ isOpen, onClose, onConfirm, approval }) {
  if (!isOpen || !approval) return null

  const [activeTab, setActiveTab] = useState("store")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  
  const [selectedFiles, setSelectedFiles] = useState({})
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [hasUploadedNewDocs, setHasUploadedNewDocs] = useState(false)

  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!isOpen || !approval) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setData(null)

        if (activeTab === "store") {
          try {
            const res = await adminAPI.getSingleStore(approval._id)
            setData(res?.data?.data || null)
          } catch (err) {
            setData(null)
          }
        } else if (activeTab === "manager") {
          try {
            if (!approval.managerId) throw new Error("No manager assigned");
            const res = await adminAPI.getStoreManagerById(approval.managerId)
            setData(res?.data?.data || null)
          } catch (err) {
            setData(null)
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

  const handleFileChange = (docType, e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [docType]: file }))
    }
  }

  const handleUploadDocuments = async () => {
    const types = Object.keys(selectedFiles)
    if (types.length === 0) return

    try {
      setUploadingDocs(true)
      const formData = new FormData()
      types.forEach(type => {
        formData.append(type, selectedFiles[type])
      })
      
      const res = await adminAPI.uploadStoreApprovalDocuments(approval._id, formData)
      
      // Update local data with new documents
      if (res?.data?.data) {
        if (!approval.documents) approval.documents = []
        
        // Merge documents locally so UI updates instantly
        const updatedDocs = [...approval.documents]
        res.data.data.forEach(newDoc => {
          const idx = updatedDocs.findIndex(d => d.type === newDoc.type)
          if (idx >= 0) updatedDocs[idx] = newDoc
          else updatedDocs.push(newDoc)
        })
        approval.documents = updatedDocs
        
        // Clear selection and mark as uploaded
        setSelectedFiles({})
        setHasUploadedNewDocs(true)
        
        // We could also re-trigger fetch, but updating approval object is enough for the modal view
        // The table might need refresh but this is fine.
      }
    } catch (err) {
      console.error("Failed to upload documents:", err)
      // Note: Ideally use a toast here
    } finally {
      setUploadingDocs(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      await onConfirm(notes.trim())
      setNotes("")
      setShowConfirm(false)
    } catch (_) {
      // Toast handles error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
        
        {/* Backdrop click */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        {/* Slideout Panel */}
        <div className="relative w-full max-w-3xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850 bg-blue-50/50 dark:bg-blue-950/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
                  Submit Store Application
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Request: {approval._id} | {approval.storeName}</p>
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
              { id: "manager", label: "Manager Details", icon: User },
              { id: "documents", label: "Documents", icon: FileText }
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
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/10 flex flex-col">
            <div className="flex-1">
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
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Store Name", value: approval.storeName },
                          { label: "Store Code", value: data?.code || approval.storeCode || "PVP-STR-PENDING" },
                          { label: "Type", value: approval.storeType },
                          { label: "Fulfillment", value: Array.isArray(data?.fulfillmentModes) ? data.fulfillmentModes.join(', ') : (data?.fulfillmentModes || "N/A") },
                          { label: "Region", value: data?.regionId?.name || data?.city || approval.city || "N/A" },
                          { label: "Zone", value: data?.zoneId?.name || data?.state || approval.address?.state || "N/A" },
                          { label: "Territory", value: data?.territoryId?.name || "N/A" },
                          { label: "Pincode", value: data?.pincode || approval.address?.pincode || "N/A" },
                          { label: "Phone", value: data?.phone || approval.phone || "N/A" },
                          { label: "Email", value: data?.email || approval.email || "N/A" },
                          { label: "Created By", value: data?.createdBy || "Unknown" },
                          { label: "Created At", value: data?.createdAt ? new Date(data.createdAt).toLocaleString() : (approval.createdAt ? new Date(approval.createdAt).toLocaleString() : "N/A") },
                          { label: "Updated At", value: data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : "N/A" }
                        ].map((item, idx) => (
                          <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                              {item.label}
                            </span>
                            <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                          Store Address
                        </span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {data?.address || approval.address?.line1}, {data?.city || approval.address?.city}, {data?.state || approval.address?.state} - {data?.pincode || approval.address?.pincode}
                        </p>
                        {approval.address?.coordinates && (
                          <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                            <span>Latitude: {approval.address.coordinates[1] || "N/A"}</span>
                            <span>Longitude: {approval.address.coordinates[0] || "N/A"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. DOCUMENTS GRID TAB */}
                  {activeTab === "documents" && (
                    <div className="space-y-6">
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Upload Required Documents</h4>
                        <div className="space-y-3">
                          {[
                            "Store application",
                            "Address/premises proof",
                            "Rent/lease agreement",
                            "FSSAI",
                            "GST/business documents",
                            "Store photos",
                            "Franchise Admin declaration"
                          ].map((docType, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{docType}</span>
                              <input
                                type="file"
                                onChange={(e) => handleFileChange(docType, e)}
                                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={handleUploadDocuments}
                            disabled={uploadingDocs || Object.keys(selectedFiles).length === 0}
                            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                          >
                            {uploadingDocs ? "Uploading..." : "Upload Files"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. MANAGER DETAILS TAB */}
                  {activeTab === "manager" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-4">
                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 text-center shadow-xs">
                            {data?.profileImage ? (
                              <img
                                src={data.profileImage}
                                alt={data.name || approval.managerName}
                                className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-slate-200 dark:border-slate-800 shadow-md"
                              />
                            ) : (
                              <div className="w-24 h-24 mx-auto bg-slate-50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shadow-md">
                                <User className="w-12 h-12 text-primary/70" />
                              </div>
                            )}
                            
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-3 uppercase tracking-wider">{data?.name || approval.managerName}</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Franchise Store Manager</p>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                              <div className="text-center">
                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Joined Date</span>
                                <span className="text-[11px] font-black text-slate-800 dark:text-white mt-0.5 block">
                                  {data?.joinedDate ? new Date(data.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact</span>
                            <div className="flex gap-2 items-center text-xs font-semibold text-slate-750 dark:text-slate-300">
                              <Phone size={13} className="text-slate-400 shrink-0" />
                              <p className="text-[11px]">{data?.emergencyContact || data?.personalDetails?.emergencyContact || "No contact listed"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                            <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-1.5">Employment Profile Overview</h4>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                                <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">{data?.name || approval.managerName}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                                <span className="text-[11px] font-extrabold">{data?.email || approval.email}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                                <span className="text-[11px] font-extrabold">{data?.phone || approval.phone}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</span>
                                <span className="text-[11px] font-extrabold">{data?.employeeCode || "N/A"}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Store</span>
                                <span className="text-[11px] font-extrabold text-[var(--primary)]">{approval.storeName}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Salary</span>
                                <span className="text-[11px] font-extrabold">₹ {data?.salary || data?.personalDetails?.salary || 0}</span>
                              </div>
                              <div className="space-y-0.5 col-span-2">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Home Address</span>
                                <span className="text-[11px] font-medium leading-normal flex items-start gap-1">
                                  <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                  {data?.address || data?.personalDetails?.address || "Address not provided"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions (Only if Draft or (Changes Requested + new docs uploaded) and on Documents tab) */}
            {(approval.status === "Draft" || (approval.status === "Changes Requested" && hasUploadedNewDocs)) && activeTab === "documents" && !loading && !error && (
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add notes for the superadmin..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all"
                  >
                    Submit Store
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CONFIRMATION OVERLAY DIALOG */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4 scale-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-550 rounded-xl">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Submission</h4>
                <p className="text-xs text-slate-500 mt-0.5">Submit this store for approval?</p>
              </div>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              Submitting this request will forward it to the Superadmin for review. You can't modify the store details while it's pending.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-55 dark:hover:bg-slate-900 rounded-lg"
                disabled={submitting}
              >
                No, Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW LIGHTBOX */}
      <DocViewerModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </>
  )
}
