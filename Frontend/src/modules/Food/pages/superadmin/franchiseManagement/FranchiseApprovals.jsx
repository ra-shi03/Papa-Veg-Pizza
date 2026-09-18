import React, { useState } from "react";
import { Download, RefreshCw, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Play, HelpCircle, ArrowRight, Eye, RotateCw, ZoomIn, ZoomOut, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@food/api";
import FranchiseApprovalsData from "./FranchiseApprovalsData";
import FranchiseApprovalsDetails from "./FranchiseApprovalsDetails";
import RejectAppModal from "./RejectAppModal";
import ReqChangeModal from "./ReqChangeModal";
import AppFranchiseModal from "./AppFranchiseModal";

export default function FranchiseApprovals() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  
  const [activeTab, setActiveTab] = useState("All");
  const TABS = ["All", "Pending", "Approved", "Rejected", "Changes Requested"];

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);

  // Modals Visibility
  const [isApproveWizardOpen, setIsApproveWizardOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Active document preview structure
  const [previewDoc, setPreviewDoc] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);


  const [isDocsViewerOpen, setIsDocsViewerOpen] = useState(false);
  const [selectedDocsStoreId, setSelectedDocsStoreId] = useState(null);
  const [docsToView, setDocsToView] = useState([]);

  // Fetch logic
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resApps, resKpis] = await Promise.all([
        adminAPI.getStoreApprovals({ page: 1, limit: 100 }),
        adminAPI.getStoreApprovalsDashboard()
      ]);
      setApplications(resApps?.data?.data?.approvals || []);
      setKpis(resApps?.data?.data?.kpis || resKpis?.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []); // Handler for row select/check
  const handleToggleSelect = (id) => {
    setSelectedApplicationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (filteredIds, checked) => {
    if (checked) {
      setSelectedApplicationIds((prev) => {
        const newSelected = [...prev];
        filteredIds.forEach((id) => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    } else {
      setSelectedApplicationIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    }
  };

  const pendingCount = kpis?.pendingApprovals ?? applications.filter((a) => a.status === "Pending").length;
  const draftCount = kpis?.draftStores ?? applications.filter((a) => a.status === "Draft").length;
  const approvedCount = kpis?.approvedStores ?? applications.filter((a) => a.status === "Approved").length;
  const rejectedCount = kpis?.rejectedStores ?? applications.filter((a) => a.status === "Rejected").length;
  const totalCount = (draftCount + pendingCount + approvedCount + rejectedCount) || applications.length;

  const handleRefresh = () => {
    setSelectedApplicationIds([]);
    fetchData();
  };

  // Launch approve wizard
  const handleApproveClick = (app) => {
    setSelectedApp(app);
    setIsApproveWizardOpen(true);
  };

  // Submit approval
  const handleWizardSubmit = async (wizardData) => {
    try {
      await adminAPI.approveStoreApproval(selectedApp._id, wizardData);
      fetchData();
      setIsApproveWizardOpen(false);
      setIsDetailsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to download file");
    }
  };

  const handleVerifyDocument = async (docId, currentStatus) => {
    try {
      const res = await adminAPI.toggleVerifyDocument(selectedDocsStoreId, docId);
      const updatedStore = res.data.data;
      toast.success(currentStatus ? 'Document marked as unverified' : 'Document verified successfully');
      setDocsToView([...updatedStore.documents]);
      fetchApprovals(); // refresh the background data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  const fetchApprovals = fetchData;

  // Launch Reject Form
  const handleRejectClick = (app) => {
    setSelectedApp(app);
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = async (data) => {
    try {
      await adminAPI.rejectStoreApproval(selectedApp._id, { reason: data.reason || "Rejected by Superadmin" });
      fetchData();
      setIsRejectOpen(false);
      setIsDetailsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Launch Request Changes Form
  const handleRequestChangesClick = (app) => {
    setSelectedApp(app);
    setIsRequestChangesOpen(true);
  };

  const handleRequestChangesSubmit = async (data) => {
    try {
      await adminAPI.requestChangesStoreApproval(selectedApp._id, {
        instructions: data.instructions || "",
        notes: data.notes || "",
        deadline: data.deadline || null
      });
      fetchData();
      setIsRequestChangesOpen(false);
      setIsDetailsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Launch Document Preview
  const handlePreviewDocClick = (doc) => {
    setPreviewDoc(doc);
    setZoomScale(1);
    setRotation(0);
    setIsPreviewOpen(true);
  };

  const handleViewDocsArray = (app) => {
    if (app.documents && app.documents.length > 0) {
      setDocsToView(app.documents);
      setSelectedDocsStoreId(app._id || app.id);
      setIsDocsViewerOpen(true);
    } else {
      alert("No documents uploaded for this application.");
    }
  };

  const handleDownloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-900 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-zinc-100 leading-tight">
            Franchise Approvals
          </h1>
          <p className="text-[10px] font-bold text-black/75 dark:text-zinc-300 mt-0.5">
            Administer applications workflow, inspect credentials, and configure new franchise entities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 select-none">
          <button
            onClick={handleRefresh}
            className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-100 rounded-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 8 KPI summary cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 select-none">
        
        {/* Total Apps */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Total Applications</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-black dark:text-zinc-100">{totalCount}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Submissions</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Pending Review</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-amber-600 dark:text-amber-400">{pendingCount}</h3>
            <span className="text-[8px] font-bold text-amber-600/80">Awaiting Action</span>
          </div>
        </div>

        {/* Draft Review */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Draft Stores</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-blue-600 dark:text-blue-400">{draftCount}</h3>
            <span className="text-[8px] font-bold text-blue-600/80">Draft Mode</span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Approved</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">{approvedCount}</h3>
            <span className="text-[8px] font-bold text-emerald-600/80">Onboarded</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Rejected</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-rose-600 dark:text-rose-400">{rejectedCount}</h3>
            <span className="text-[8px] font-bold text-rose-600/80">Declined</span>
          </div>
        </div>

        {/* Mock cards removed to show only required real data */}

      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "border-red-650 text-red-650"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid Component for table and filters */}
      <FranchiseApprovalsData
        applications={applications.filter(app => activeTab === "All" || app.status === activeTab)}
        onRowClick={(app) => {
          setSelectedApp(app);
          setIsDetailsOpen(true);
        }}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        onRequestChanges={handleRequestChangesClick}
        selectedApplicationIds={selectedApplicationIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onViewDocs={handleViewDocsArray}
      />

      {/* Details Drawer */}
      <FranchiseApprovalsDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        application={selectedApp}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        onRequestChanges={handleRequestChangesClick}
        onPreviewDocument={handlePreviewDocClick}
      />

      {/* MODALS WITH SIDEBAR OFFSET lg:pl-[280px] */}

      {/* Modal 1: Approve Franchise 3-Step Wizard */}
      <AppFranchiseModal
        isOpen={isApproveWizardOpen}
        onClose={() => setIsApproveWizardOpen(false)}
        selectedApp={selectedApp}
        onSubmit={handleWizardSubmit}
      />

      {/* Modal 2: Reject Application Modal */}
      <RejectAppModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        selectedApp={selectedApp}
        onSubmit={handleRejectSubmit}
      />

      {/* Modal 3: Request Changes Modal */}
      <ReqChangeModal
        isOpen={isRequestChangesOpen}
        onClose={() => setIsRequestChangesOpen(false)}
        selectedApp={selectedApp}
        onSubmit={handleRequestChangesSubmit}
      />

      {/* Modal 4: Interactive Document Preview Modal */}
      {isPreviewOpen && previewDoc && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[80] flex items-center justify-center p-4 lg:pl-[280px]" id="preview-modal">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
            {/* Header with actions */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Document Live Viewer</h3>
                <p className="text-[10px] font-bold text-black/60 dark:text-zinc-300 mt-0.5">{previewDoc.name}</p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-black dark:text-zinc-300 hover:text-[var(--primary)]"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Viewer Content with Zoom / Rotate State */}
            <div className="p-6 bg-zinc-100 dark:bg-zinc-900/60 overflow-hidden flex items-center justify-center min-h-[350px] max-h-[50vh] relative">
              <div
                className="transition-transform duration-200 max-w-full max-h-full"
                style={{
                  transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="rounded border border-zinc-300 dark:border-zinc-800 shadow max-h-[320px] object-contain"
                />
              </div>
            </div>

            {/* Live Operations Controller Footer */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-900 flex justify-between items-center gap-3">
              <div className="flex items-center gap-1.5 select-none">
                <button
                  onClick={() => setZoomScale(Math.min(2, zoomScale + 0.1))}
                  className="p-2 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-850 text-black dark:text-zinc-200 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.1))}
                  className="p-2 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-850 text-black dark:text-zinc-200 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-2 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-850 text-black dark:text-zinc-200 transition-colors"
                  title="Rotate Right"
                >
                  <RotateCw size={13} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 border border-zinc-350 dark:border-zinc-800 text-black dark:text-zinc-200 rounded text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => handleDownloadFile(previewDoc.url, previewDoc.name)}
                  className="px-3.5 py-1.5 bg-[var(--primary)] text-white rounded text-xs font-bold hover:brightness-110 shadow-sm transition-all cursor-pointer"
                >
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: All Documents Viewer */}
      {isDocsViewerOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[280px]">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-zinc-100">Uploaded Documents</h3>
              <button
                onClick={() => setIsDocsViewerOpen(false)}
                className="text-black dark:text-zinc-300 hover:text-[var(--primary)]"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docsToView.map((doc, idx) => (
                <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-2">
                  <div className="font-bold text-xs truncate" title={doc.type}>{doc.type}</div>
                  <div className="text-[10px] text-zinc-500 truncate" title={doc.name}>{doc.name}</div>
                  <div className="mt-auto flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => handlePreviewDocClick(doc)} className="text-[var(--primary)] text-xs font-bold hover:underline flex items-center gap-1">
                      <Eye size={12}/> View
                    </button>
                    <div className="flex gap-2 items-center">
                      <button 
                        onClick={() => handleVerifyDocument(doc._id || doc.id, doc.isVerified)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${doc.isVerified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-zinc-100 text-zinc-500 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'}`}
                      >
                        {doc.isVerified ? (
                          <span className="flex items-center gap-1"><CheckCircle size={10} /> Verified</span>
                        ) : 'Verify'}
                      </button>
                      <button
                        onClick={() => handleDownloadFile(doc.url, doc.name)}
                        className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Removed Mock Audit Modal */}

    </div>
  );
}
