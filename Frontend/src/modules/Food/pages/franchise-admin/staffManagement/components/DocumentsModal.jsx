import React, { useState, useEffect } from "react"
import { Shield, X, CheckCircle2, AlertTriangle, Eye, Download, Upload, Calendar, AlertCircle } from "lucide-react"

export default function DocumentsModal({ isOpen, onClose, onConfirm, rider }) {
  const [docsStatus, setDocsStatus] = useState({
    drivingLicense: "Verified",
    vehicleRC: "Verified",
    insurance: "Verified",
    aadhaar: "Verified",
    panCard: "Verified",
    bankProof: "Verified"
  })

  const [expiryDates, setExpiryDates] = useState({
    licenseExpiry: "2031-12-31",
    insuranceExpiry: "2026-09-15"
  })

  const [activePreview, setActivePreview] = useState(null)

  useEffect(() => {
    if (isOpen && rider) {
      setDocsStatus({
        drivingLicense: rider.documents?.drivingLicense || "Pending",
        vehicleRC: rider.documents?.vehicleRC || "Pending",
        insurance: rider.documents?.insurance || "Pending",
        aadhaar: rider.documents?.aadhaar || "Pending",
        panCard: rider.documents?.panCard || "Pending",
        bankProof: rider.documents?.bankProof || "Pending"
      })
      // Seed some dummy expiry dates
      const seed = parseInt(rider.id.split("-")[1] || 1);
      setExpiryDates({
        licenseExpiry: `203${seed % 9}-08-12`,
        insuranceExpiry: seed % 2 === 0 ? "2026-05-10" : "2026-11-20" // seed % 2 === 0 will show expired/near expiry
      })
      setActivePreview(null)
    }
  }, [isOpen, rider])

  if (!isOpen || !rider) return null

  const handleStatusChange = (docName, status) => {
    setDocsStatus(prev => ({
      ...prev,
      [docName]: status
    }))
  }

  const handleExpiryChange = (field, val) => {
    setExpiryDates(prev => ({
      ...prev,
      [field]: val
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(rider.id, {
      documents: docsStatus,
      expiry: expiryDates
    })
  }

  const documentList = [
    { key: "drivingLicense", name: "Driving License", requiresExpiry: true, expiryKey: "licenseExpiry" },
    { key: "vehicleRC", name: "Vehicle Registration Certificate (RC)", requiresExpiry: false },
    { key: "insurance", name: "Vehicle Insurance Policy", requiresExpiry: true, expiryKey: "insuranceExpiry" },
    { key: "aadhaar", name: "Aadhaar Card (KYC)", requiresExpiry: false },
    { key: "panCard", name: "PAN Card (Tax Registration)", requiresExpiry: false },
    { key: "bankProof", name: "Bank Passbook/Cancelled Cheque", requiresExpiry: false }
  ]

  // Helper to check if a document is expired
  const isDocumentExpired = (expiryDate) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const triggerDownload = (docName) => {
    alert(`Downloading ${docName} copy for ${rider.name} (Rider ID: ${rider.employeeCode})`)
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop restricted to content area */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh] z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Shield className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Verify Rider Documents: {rider.name} ({rider.employeeCode})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Global Expiry Alerts banner */}
          {(isDocumentExpired(expiryDates.insuranceExpiry) || isDocumentExpired(expiryDates.licenseExpiry)) && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex gap-3 text-rose-700 dark:text-rose-455 text-xs font-semibold leading-normal animate-fade-down">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-wide">Critical Alerts: Expired Documents</p>
                <p className="mt-0.5 font-medium">
                  {isDocumentExpired(expiryDates.insuranceExpiry) && "• Vehicle Insurance Policy has EXPIRED. "}
                  {isDocumentExpired(expiryDates.licenseExpiry) && "• Driving License has EXPIRED. "}
                  Please verify renewed copies before updating rider status back to Online.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* List of Documents */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                Rider KYC and Vehicle Documents
              </h4>
              
              <div className="space-y-3">
                {documentList.map((doc) => {
                  // For Cycle, bypass DL/RC/Insurance requirements
                  const isCycle = rider.vehicleType === "Cycle"
                  const isBypassedDoc = isCycle && (doc.key === "drivingLicense" || doc.key === "vehicleRC" || doc.key === "insurance")
                  
                  return (
                    <div 
                      key={doc.key} 
                      className={`p-3 border rounded-xl flex flex-col gap-2.5 transition-all ${
                        isBypassedDoc 
                          ? "opacity-50 bg-zinc-50 dark:bg-zinc-950/10 border-zinc-200 dark:border-zinc-850"
                          : "bg-white dark:bg-zinc-950/40 border-zinc-150 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                            {doc.name}
                          </span>
                          {isBypassedDoc && (
                            <span className="text-[9px] font-bold text-zinc-400">
                              (Not required for Bicycle riders)
                            </span>
                          )}
                        </div>
                        
                        {!isBypassedDoc && (
                          <select
                            value={docsStatus[doc.key]}
                            onChange={(e) => handleStatusChange(doc.key, e.target.value)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                              docsStatus[doc.key] === "Verified"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250 dark:border-emerald-900"
                                : docsStatus[doc.key] === "Pending"
                                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-250 dark:border-amber-900"
                                : docsStatus[doc.key] === "Expired"
                                ? "bg-red-50 dark:bg-red-950/20 text-red-650 border-red-250 dark:border-red-900"
                                : "bg-rose-50 dark:bg-rose-950/20 text-rose-650 border-rose-250 dark:border-rose-900"
                            }`}
                          >
                            <option value="Pending">🕒 Pending</option>
                            <option value="Verified">✅ Verified</option>
                            <option value="Rejected">❌ Rejected</option>
                            <option value="Expired">⚠️ Expired</option>
                          </select>
                        )}
                      </div>

                      {!isBypassedDoc && (
                        <div className="flex items-center justify-between border-t border-zinc-50 dark:border-zinc-900/50 pt-2.5">
                          {/* Expiry datepicker if needed */}
                          {doc.requiresExpiry ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Expiry:</span>
                              <input
                                type="date"
                                value={expiryDates[doc.expiryKey]}
                                onChange={(e) => handleExpiryChange(doc.expiryKey, e.target.value)}
                                className={`px-1.5 py-0.5 border rounded-md text-[10px] font-bold focus:outline-none bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 ${
                                  isDocumentExpired(expiryDates[doc.expiryKey])
                                    ? "border-red-300 text-red-600 dark:border-red-900/50 dark:text-red-400 font-black"
                                    : "border-zinc-200 dark:border-zinc-800"
                                }`}
                              />
                            </div>
                          ) : (
                            <span className="text-[9px] font-medium text-zinc-400">Lifetime document</span>
                          )}

                          {/* Action icons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActivePreview({
                                name: doc.name,
                                type: "Image Placeholder",
                                fileUrl: rider.profileImage || "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=150&fm=webp"
                              })}
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded cursor-pointer"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerDownload(doc.name)}
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded cursor-pointer"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Document Preview Pane */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                Real-Time Document Preview Pane
              </h4>
              
              {activePreview ? (
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center min-h-[300px] gap-3 relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-[9px] font-bold text-zinc-500">
                    Active Preview
                  </div>
                  
                  <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    {activePreview.name}
                  </span>

                  {/* Render simulated doc image */}
                  <div className="w-full max-w-[280px] aspect-[4/3] rounded-lg bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 overflow-hidden relative group">
                    <img 
                      src={activePreview.fileUrl} 
                      alt="Doc Preview" 
                      className="w-full h-full object-cover filter blur-[2px] hover:blur-none transition-all duration-350"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3 text-center opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                      <span className="text-[10px] text-white font-extrabold uppercase tracking-widest drop-shadow-md">
                        Protected Watermark
                      </span>
                      <span className="text-[8px] text-zinc-300 font-bold mt-1 drop-shadow-xs">
                        Hover cursor to clear blur
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] text-zinc-400 font-bold text-center leading-normal max-w-xs">
                    File Format: WebP/Image. Cryptographic hash matched with UIDAI server. Metadata verified.
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerDownload(activePreview.name)}
                      className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Download Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreview(null)}
                      className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-550 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/20 flex flex-col items-center justify-center min-h-[300px] text-center gap-2">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-2xl">
                    <Eye className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    No Document Selected
                  </span>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-normal max-w-xs">
                    Click the eye icon next to any document row on the left to load its secure, decrypted copy in this preview pane.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 hover:shadow-lg transition-all cursor-pointer"
            >
              Save Verification Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
