import React, { useState } from "react";
import { X, User, Briefcase, BarChart2, CheckCircle, FileText, BadgeCheck, Clock, Hourglass, Eye, Download, Gavel, XCircle, MessageSquare, Info, ShieldCheck, MapPin } from "lucide-react";

export default function FranchiseApprovalsDetails({
  isOpen,
  onClose,
  application,
  onApprove,
  onReject,
  onRequestChanges,
  onPreviewDocument,
}) {
  const [activeTab, setActiveTab] = useState("applicant");

  if (!isOpen || !application) return null;

  const tabs = [
    { id: "applicant", label: "Applicant Info", icon: User },
    { id: "expansion", label: "Requested Area", icon: MapPin },
    { id: "documents", label: "Uploaded Docs", icon: FileText },
  ];

  // Removed mock data

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex justify-end" id="details-overlay">
      {/* Detail Drawer Container - taking up 600px width on large screens */}
      <div className="bg-white dark:bg-zinc-950 w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-900 transition-all duration-300">

        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-bold text-black dark:text-zinc-100 flex items-center gap-1.5">
              Review Application: <span className="text-[var(--primary)]">{application._id}</span>
            </h2>
            <p className="text-[10px] font-bold text-black/75 dark:text-zinc-300 mt-0.5">
              Submitted: {new Date(application.createdAt).toLocaleDateString()} • Last Updated: {new Date(application.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-black dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isActive
                  ? "border-[var(--primary)] text-[var(--primary)] bg-white dark:bg-zinc-950 font-black"
                  : "border-transparent text-black dark:text-zinc-300 hover:text-[var(--primary)]"
                  }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">

          {activeTab === "applicant" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <User size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Applicant Profile</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-900">
                <div>
                  <p className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wide">Full Name</p>
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">{application.managerName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wide">Company / Entity Name</p>
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">{application.storeName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wide">Email Address</p>
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">{application.email}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wide">Phone Number</p>
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">{application.phone}</p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-900">
                <p className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wide">Registered Office Address</p>
                <p className="text-xs font-bold text-black dark:text-zinc-100 mt-1 leading-relaxed">
                  {application.address || "Address not provided"}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-900 space-y-2">
                <h4 className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wide">Current Status</h4>
                <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-medium text-black dark:text-zinc-300">Application Status</span>
                  <span className="text-[10px] font-bold text-[var(--primary)]">{application.status}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "expansion" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <MapPin size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Requested Expansion Hierarchy</h3>
              </div>
              <p className="text-[10px] font-bold text-black/75 dark:text-zinc-300">
                The applicant wishes to acquire franchise development rights within the following regional hierarchy limits:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-900 text-center">
                  <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase block tracking-wider">Region</span>
                  <span className="text-xs font-black text-black dark:text-zinc-100 mt-1 block">{application.regionId?.name || "N/A"}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-900 text-center">
                  <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase block tracking-wider">Zone</span>
                  <span className="text-xs font-black text-black dark:text-zinc-100 mt-1 block">{application.zoneId?.name || "N/A"}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-900 text-center">
                  <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase block tracking-wider">Territory</span>
                  <span className="text-xs font-black text-black dark:text-zinc-100 mt-1 block">{application.territoryId?.name || "N/A"}</span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 mt-4 flex gap-3">
                <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">Territory Exclusivity Rule</h4>
                  <p className="text-[10px] font-semibold text-black dark:text-zinc-200 mt-1 leading-relaxed">
                    This territory choice requires exclusive operations. Approval will block onboarding of new franchise requests inside the assigned territory for a 12-month period.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <FileText size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Document Audit Grid</h3>
              </div>
              <p className="text-[10px] font-bold text-black/75 dark:text-zinc-300">
                Select a document to review online or download the files.
              </p>

              <div className="space-y-2.5">
                {application.documents && application.documents.length > 0 ? (
                  application.documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-lg flex items-center justify-between gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-black dark:text-zinc-100 truncate">{doc.type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-850 text-black dark:text-zinc-300">
                            {doc.name}
                          </span>
                          <span className="text-[9px] font-semibold text-black/60 dark:text-zinc-400">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                          Uploaded
                        </span>
                        <button
                          onClick={() => onPreviewDocument && onPreviewDocument(doc)}
                          className="p-1.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 text-black hover:text-[var(--primary)] dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye size={12} />
                        </button>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 text-black hover:text-[var(--primary)] dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
                          title="Download Document"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No documents uploaded.</p>
                )}
              </div>
            </div>
          )}

          {/* Financial, Operational, and Notes removed to use real data only */}

        </div>

        {/* Action Buttons Footer */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-900 p-4 flex gap-3 justify-end shadow-md shrink-0">
          <button
            onClick={() => onReject(application)}
            className="px-4 py-2 border border-zinc-300 dark:border-red-800 text-red-800 hover:text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Reject Application
          </button>

          <button
            onClick={() => onRequestChanges(application)}
            className="px-4 py-2 bg-red-800 text-white font-bold text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Request Changes
          </button>

          <button
            onClick={() => onApprove(application)}
            className="px-5 py-2 bg-[var(--primary)] hover:brightness-105 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BadgeCheck size={14} />
            <span>Approve Request</span>
          </button>
        </div>

      </div>
    </div>
  );
}
