import React, { useState } from "react";
import { Download, RefreshCw, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Play, HelpCircle, ArrowRight, Eye, RotateCw, ZoomIn, ZoomOut, UserCheck } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import FranchiseApprovalsData from "./FranchiseApprovalsData";
import FranchiseApprovalsDetails from "./FranchiseApprovalsDetails";
import RejectAppModal from "./RejectAppModal";
import ReqChangeModal from "./ReqChangeModal";
import AppFranchiseModal from "./AppFranchiseModal";

export default function FranchiseApprovals() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);

  // Mock initial applications state (representing MongoDB collections in the UI)
  const [applications, setApplications] = useState([
    {
      id: "APP-2026-001",
      applicantName: "Rajesh Kumar",
      companyName: "RK Foods & Beverages",
      email: "rajesh.kumar@rkfoods.in",
      phone: "+91 98111 22333",
      region: "North India",
      zone: "Zone A",
      territory: "Delhi-NCR",
      submittedDate: "2026-05-12",
      documentsCount: 4,
      status: "Pending Review",
      reviewer: "Amit Patel",
      lastUpdated: "2026-05-13",
      investment: "₹65,00,000",
    },
    {
      id: "APP-2026-002",
      applicantName: "Priya Sen",
      companyName: "Sen Hospitality Group",
      email: "priya@senhospitality.com",
      phone: "+91 98222 33444",
      region: "West India",
      zone: "Zone B",
      territory: "Mumbai-Thane",
      submittedDate: "2026-05-13",
      documentsCount: 4,
      status: "Under Verification",
      reviewer: "Rohan Deshmukh",
      lastUpdated: "2026-05-15",
      investment: "₹85,00,000",
    },
    {
      id: "APP-2026-003",
      applicantName: "Rohan Nair",
      companyName: "Nair Foods Pvt Ltd",
      email: "rohan@nairfoods.co.in",
      phone: "+91 98333 44555",
      region: "South India",
      zone: "Zone C",
      territory: "Bengaluru-East",
      submittedDate: "2026-05-10",
      documentsCount: 4,
      status: "Approved",
      reviewer: "Siddharth Rao",
      lastUpdated: "2026-05-14",
      investment: "₹75,00,000",
    },
    {
      id: "APP-2026-004",
      applicantName: "Deepika Vyas",
      companyName: "Vyas Food Ventures",
      email: "deepika@vyasfoods.com",
      phone: "+91 98444 55666",
      region: "Central India",
      zone: "Zone D",
      territory: "Indore-VijayNagar",
      submittedDate: "2026-05-15",
      documentsCount: 3,
      status: "Changes Requested",
      reviewer: "Nisha Sharma",
      lastUpdated: "2026-05-16",
      investment: "₹55,00,000",
    },
    {
      id: "APP-2026-005",
      applicantName: "Vikram Mehra",
      companyName: "Mehra Kitchens",
      email: "vikram@mehrakitchen.com",
      phone: "+91 98555 66777",
      region: "North India",
      zone: "Zone A",
      territory: "Lucknow-Hazratganj",
      submittedDate: "2026-05-11",
      documentsCount: 4,
      status: "Rejected",
      reviewer: "Amit Patel",
      lastUpdated: "2026-05-16",
      investment: "₹45,00,000",
    },
  ]);

  // Modals Visibility
  const [isApproveWizardOpen, setIsApproveWizardOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Active document preview structure
  const [previewDoc, setPreviewDoc] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);





  // Handler for row select/check
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

  // KPI calculations
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === "Pending Review").length;
  const verificationCount = applications.filter((a) => a.status === "Under Verification").length;
  const approvedCount = applications.filter((a) => a.status === "Approved").length;
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length;
  const changesCount = applications.filter((a) => a.status === "Changes Requested").length;
  const approvedMonthCount = 4; // Mock indicator
  const avgApprovalTime = "4.8 Days";

  // Refresh
  const handleRefresh = () => {
    // Simply reset checklist/selection and log a mockup reload
    setSelectedApplicationIds([]);
    console.log("Reloading application records from MongoDB database...");
  };

  // CSV Exporter (Blob dynamic download)
  const handleDownloadCSV = () => {
    const headers = [
      "Application ID",
      "Applicant Name",
      "Company Name",
      "Email",
      "Phone",
      "Region",
      "Zone",
      "Territory",
      "Submitted Date",
      "Docs",
      "Status",
      "Reviewer",
      "Last Updated",
    ];

    const rows = applications.map((app) => [
      app.id,
      app.applicantName,
      app.companyName,
      app.email,
      app.phone,
      app.region,
      app.zone,
      app.territory,
      app.submittedDate,
      app.documentsCount,
      app.status,
      app.reviewer,
      app.lastUpdated,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Franchise_Approvals_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Landscape PDF Exporter (jsPDF & jsPDF-autotable integration)
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    
    // Add Report title
    doc.setFontSize(16);
    doc.text("PAPA VEG PIZZA - FRANCHISE APPROVALS REPORT", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 21);

    const tableHeaders = [
      "ID",
      "Applicant",
      "Company",
      "Email",
      "Phone",
      "Region",
      "Zone",
      "Territory",
      "Status",
      "Reviewer",
    ];

    const tableRows = applications.map((app) => [
      app.id,
      app.applicantName,
      app.companyName,
      app.email,
      app.phone,
      app.region,
      app.zone,
      app.territory,
      app.status,
      app.reviewer || "Unassigned",
    ]);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableRows,
      startY: 28,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [164, 60, 18] }, // Match primary dark brick red
    });

    doc.save(`Franchise_Approvals_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Launch approve wizard
  const handleApproveClick = (app) => {
    setSelectedApp(app);
    setIsApproveWizardOpen(true);
  };

  // Submit approval
  const handleWizardSubmit = (wizardData) => {
    // Update local state to show Approved status
    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApp.id ? { ...app, status: "Approved", lastUpdated: new Date().toISOString().slice(0, 10) } : app
      )
    );
    setIsApproveWizardOpen(false);
    setIsDetailsOpen(false);
  };

  // Launch Reject Form
  const handleRejectClick = (app) => {
    setSelectedApp(app);
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = (data) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApp.id ? { ...app, status: "Rejected", lastUpdated: new Date().toISOString().slice(0, 10) } : app
      )
    );
    setIsRejectOpen(false);
    setIsDetailsOpen(false);
  };

  // Launch Request Changes Form
  const handleRequestChangesClick = (app) => {
    setSelectedApp(app);
    setIsRequestChangesOpen(true);
  };

  const handleRequestChangesSubmit = (data) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApp.id ? { ...app, status: "Changes Requested", lastUpdated: new Date().toISOString().slice(0, 10) } : app
      )
    );
    setIsRequestChangesOpen(false);
    setIsDetailsOpen(false);
  };

  // Launch Document Preview
  const handlePreviewDocClick = (doc) => {
    setPreviewDoc(doc);
    setZoomScale(1);
    setRotation(0);
    setIsPreviewOpen(true);
  };

  // Launch Audit timeline
  const handleViewAuditClick = (app) => {
    setSelectedApp(app);
    setIsAuditOpen(true);
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
            onClick={handleDownloadCSV}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-100 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Download size={13} />
            <span>DOWNLOAD CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-100 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <FileText size={13} />
            <span>EXPORT PDF</span>
          </button>
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

        {/* Under Verification */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Under Verification</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-blue-600 dark:text-blue-400">{verificationCount}</h3>
            <span className="text-[8px] font-bold text-blue-600/80">In Progress</span>
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

        {/* Changes Requested */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Changes Requested</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-purple-600 dark:text-purple-400">{changesCount}</h3>
            <span className="text-[8px] font-bold text-purple-600/80">Draft Resubmissions</span>
          </div>
        </div>

        {/* Approved Month */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Approved Month</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-black dark:text-zinc-100">{approvedMonthCount}</h3>
            <span className="text-[8px] font-bold text-emerald-600">+12% vs Last Month</span>
          </div>
        </div>

        {/* Avg Approval Time */}
        <div className="bg-white dark:bg-zinc-905 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block">Avg Approval Time</span>
          <div className="mt-2">
            <h3 className="text-base font-black text-black dark:text-zinc-100">{avgApprovalTime}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Target: Under 5 Days</span>
          </div>
        </div>

      </div>

      {/* Main Grid Component for table and filters */}
      <FranchiseApprovalsData
        applications={applications}
        onRowClick={(app) => {
          setSelectedApp(app);
          setIsDetailsOpen(true);
        }}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        onRequestChanges={handleRequestChangesClick}
        onViewAudit={handleViewAuditClick}
        selectedApplicationIds={selectedApplicationIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[280px]" id="preview-modal">
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
                <a
                  href={previewDoc.url}
                  download
                  className="px-3.5 py-1.5 bg-[var(--primary)] text-white rounded text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                >
                  Download File
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Audit History Timeline Modal */}
      {isAuditOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60] flex items-center justify-center p-4 lg:pl-[280px]" id="audit-modal">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Application Audit Timeline</h3>
                <p className="text-[10px] font-bold text-[var(--primary)] mt-0.5">{selectedApp.id} - {selectedApp.companyName}</p>
              </div>
              <button
                onClick={() => setIsAuditOpen(false)}
                className="text-black dark:text-zinc-300 hover:text-[var(--primary)]"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Vertical timeline details */}
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-5">
              <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 pl-6 space-y-6">
                
                {/* Event 1 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-950 z-10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-black/50 dark:text-zinc-400">12 May 2026 • 10:45 AM</span>
                    <span className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">Application Submitted Successfully</span>
                    <p className="text-[11px] font-semibold text-black/75 dark:text-zinc-300 mt-1">
                      Applicant submitted business expansion proposal online. System verified GST & PAN formats.
                    </p>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-blue-500 border-4 border-white dark:border-zinc-950 z-10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-black/50 dark:text-zinc-400">13 May 2026 • 02:15 PM</span>
                    <span className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">Auditor Assignment Configured</span>
                    <p className="text-[11px] font-semibold text-black/75 dark:text-zinc-300 mt-1">
                      System automatically assigned Specialist <span className="font-bold">Amit Patel</span> to inspect financial and background records.
                    </p>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-purple-500 border-4 border-white dark:border-zinc-950 z-10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-black/50 dark:text-zinc-400">14 May 2026 • 11:30 AM</span>
                    <span className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">Financial Verification Complete</span>
                    <p className="text-[11px] font-semibold text-black/75 dark:text-zinc-300 mt-1">
                      Credit verification agency cleared company financials. Net worth verification confirmed.
                    </p>
                  </div>
                </div>

                {/* Event 4 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-amber-500 border-4 border-white dark:border-zinc-950 z-10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-black/50 dark:text-zinc-400">15 May 2026 • 05:00 PM</span>
                    <span className="text-xs font-bold text-black dark:text-zinc-100 mt-0.5">Internal Review Comments Logged</span>
                    <p className="text-[11px] font-semibold text-black/75 dark:text-zinc-300 mt-1">
                      Review notes uploaded: "Applicant has deep experience with QSR, recommended for fast-track approval".
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-end">
              <button
                onClick={() => setIsAuditOpen(false)}
                className="px-5 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-colors cursor-pointer"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
