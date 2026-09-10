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
    { id: "financial", label: "Financials", icon: Briefcase },
    { id: "operational", label: "Ops Review", icon: BarChart2 },
    { id: "notes", label: "Internal Notes", icon: MessageSquare },
  ];

  // Mock list of uploaded documents for preview and download
  const mockDocuments = [
    { id: "gst", name: "GST Registration Certificate", status: "Verified", date: "12 May 2026", type: "PDF", url: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?fit=crop&w=600&q=80" },
    { id: "tax", name: "Business Tax Certificate (FY 2025)", status: "Verified", date: "12 May 2026", type: "PDF", url: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?fit=crop&w=600&q=80" },
    { id: "id_proof", name: "Applicant ID Proof (Aadhaar & PAN)", status: "Pending Review", date: "14 May 2026", type: "Image", url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?fit=crop&w=600&q=80" },
    { id: "financial_sheet", name: "Funding Verification / Bank Statement", status: "Under Review", date: "15 May 2026", type: "PDF", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?fit=crop&w=600&q=80" },
  ];

  // Mock Internal Notes Timeline
  const mockNotes = [
    { reviewer: "Amit Patel (Senior Reviewer)", avatar: "AP", role: "Verification Specialist", date: "13 May 2026 • 11:30 AM", content: "Background verification completed. Primary credit rating score is healthy. Applicant possesses adequate F&B experience in western India." },
    { reviewer: "Rohan Deshmukh", avatar: "RD", role: "Super Admin Analyst", date: "15 May 2026 • 04:15 PM", content: "Requested target territory has high demand. Need to verify GST document signature matching the applicant's company name." },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex justify-end" id="details-overlay">
      {/* Detail Drawer Container - taking up 600px width on large screens */}
      <div className="bg-white dark:bg-zinc-950 w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-900 transition-all duration-300">

        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-bold text-black dark:text-zinc-100 flex items-center gap-1.5">
              Review Application: <span className="text-[var(--primary)]">{application.id}</span>
            </h2>
            <p className="text-[10px] font-bold text-black/75 dark:text-zinc-300 mt-0.5">
              Submitted: {application.submittedDate} • Last Updated: {application.lastUpdated}
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
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">{application.applicantName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wide">Company / Entity Name</p>
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">{application.companyName}</p>
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
                  Suite 120, Level 3, Golden Hub, Connaught Place, New Delhi, DL - 110001
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-900 space-y-2">
                <h4 className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wide">Current Status & Assignment</h4>
                <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-medium text-black dark:text-zinc-300">Application Status</span>
                  <span className="text-[10px] font-bold text-[var(--primary)]">{application.status}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] font-medium text-black dark:text-zinc-300">Assigned Auditor</span>
                  <span className="text-[11px] font-bold text-black dark:text-zinc-100">{application.reviewer || "Unassigned"}</span>
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
                  <span className="text-xs font-black text-black dark:text-zinc-100 mt-1 block">{application.region}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-900 text-center">
                  <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase block tracking-wider">Zone</span>
                  <span className="text-xs font-black text-black dark:text-zinc-100 mt-1 block">{application.zone}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-900 text-center">
                  <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase block tracking-wider">Territory</span>
                  <span className="text-xs font-black text-black dark:text-zinc-100 mt-1 block">{application.territory}</span>
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
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-lg flex items-center justify-between gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-black dark:text-zinc-100 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-850 text-black dark:text-zinc-300">
                          {doc.type}
                        </span>
                        <span className="text-[9px] font-semibold text-black/60 dark:text-zinc-400">
                          Uploaded: {doc.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${doc.status === "Verified"
                        ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : doc.status === "Pending Review"
                          ? "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-blue-100 text-blue-950 dark:bg-blue-950/40 dark:text-blue-300"
                        }`}>
                        {doc.status}
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
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 text-black hover:text-[var(--primary)] dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
                        title="Download Document"
                      >
                        <Download size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <Briefcase size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Financial Solvency Review</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200 dark:border-orange-900/40">
                  <p className="text-[9px] font-bold text-orange-950/80 dark:text-orange-300 uppercase tracking-wide">Investment Capacity</p>
                  <p className="text-lg font-black text-black dark:text-zinc-100 mt-1">₹65,00,000</p>
                  <span className="text-[8px] font-bold text-black/60 dark:text-zinc-400 mt-0.5 block">Self Funding Confirmed</span>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40">
                  <p className="text-[9px] font-bold text-blue-950/80 dark:text-blue-300 uppercase tracking-wide">Net Worth Estimate</p>
                  <p className="text-lg font-black text-black dark:text-zinc-100 mt-1">₹1.8 Crores</p>
                  <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">Audited CA statement</span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-900 space-y-3">
                <h4 className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wide">Requested Financial Parameters</h4>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-black dark:text-zinc-300">Proposed Commission Split</span>
                  <span className="text-xs font-bold text-black dark:text-zinc-100">8% on Gross Sales</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-black dark:text-zinc-300">Initial Franchise Fee</span>
                  <span className="text-xs font-bold text-black dark:text-zinc-100">₹5,00,000 (Non-refundable)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-xs font-medium text-black dark:text-zinc-300">Expected Security Deposit</span>
                  <span className="text-xs font-bold text-black dark:text-zinc-100">₹2,50,000 (Refundable)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "operational" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <BarChart2 size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Operational Assessment</h3>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-900 space-y-3">
                <div>
                  <h4 className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase tracking-wide">F&B Experience Details</h4>
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-1">
                    Operating 2 franchise units of reputed QSR pizza brands since 2021. Excellent track record of compliance.
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase tracking-wide">Proposed Store Format</h4>
                  <p className="text-xs font-bold text-black dark:text-zinc-100 mt-1">
                    Dine-in + Delivery hybrid setup (approx. 1200 sq.ft. prime space).
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase tracking-wide">Operational Reviewer Comments</h4>
                  <p className="text-xs text-black/80 dark:text-zinc-300 mt-1 leading-relaxed">
                    Applicant exhibits high operational understanding of supply chain logistics. Space selection looks prime with heavy footfall. Recommend approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <MessageSquare size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Reviewer Timeline Notes</h3>
              </div>

              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {mockNotes.map((note, idx) => (
                  <div key={idx} className="relative pl-8 animate-fadeIn">
                    <div className="absolute left-0.5 top-0.5 w-6.5 h-6.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center font-bold text-[9px] uppercase">
                      {note.avatar}
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-250/50 dark:border-zinc-900">
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-black dark:text-zinc-100">{note.reviewer}</h4>
                          <p className="text-[9px] font-bold text-black/60 dark:text-zinc-400">{note.role}</p>
                        </div>
                        <span className="text-[8px] font-bold text-black/50 dark:text-zinc-400">{note.date}</span>
                      </div>
                      <p className="text-xs text-black/85 dark:text-zinc-300 mt-2 leading-relaxed font-medium">
                        {note.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase tracking-wide">Add Internal Comment</label>
                <textarea
                  className="w-full mt-1.5 p-2.5 text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:border-[var(--primary)] outline-none h-18 resize-none font-semibold text-black dark:text-zinc-100"
                  placeholder="Type notes that are only visible to super admin review staff..."
                />
                <div className="flex justify-end mt-2">
                  <button className="px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-md text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer">
                    Add Internal Note
                  </button>
                </div>
              </div>
            </div>
          )}

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
