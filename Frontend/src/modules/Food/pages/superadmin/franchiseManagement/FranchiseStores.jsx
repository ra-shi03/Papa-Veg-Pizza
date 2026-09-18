import React, { useState } from "react";
import { Download, ChevronDown, Plus, Store, CheckCircle, Clock, Ban, RefreshCw, Users, ShoppingBag, AlertTriangle, AlertCircle, TrendingUp, X } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import FranchiseStoresData from "./FranchiseStoresData";
import FranchiseStoresDetails from "./FranchiseStoresDetails";
import AddFranchiseStores from "./AddFranchiseStores";
import AnalyticsTabModal from "./AnalyticsTabModal";
import ComplianceReport from "./ComplianceReport";

import { adminAPI } from "@food/api";

export default function FranchiseStores() {
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);

  const [filteredStores, setFilteredStores] = useState([]);

  const totalStores = stores.length;
  const activeStores = stores.filter(s => s.status === 'Active').length;
  const suspendedStores = stores.filter(s => s.status === 'Suspended').length;
  const openNow = activeStores;
  const closedNow = suspendedStores;

  // Modals & Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isChangeFranchiseOpen, setIsChangeFranchiseOpen] = useState(false);
  const [isSuspendActivateOpen, setIsSuspendActivateOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Other existing modal states
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [isComplianceReportOpen, setIsComplianceReportOpen] = useState(false);
  const [suspendActivateAction, setSuspendActivateAction] = useState('suspend');
  const [isCloseStoreOpen, setIsCloseStoreOpen] = useState(false);

  // Form inputs for sub-modals
  const [reassignData, setReassignData] = useState({ newManager: "", date: "", reason: "" });
  const [changeFranchiseData, setChangeFranchiseData] = useState({ newFranchise: "", reason: "", confirmed: false });

  const fetchStoresData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getStores();
      const fetchedStores = res?.data?.data?.stores || [];
      const mappedStores = fetchedStores.map(store => ({
        id: store.code || store._id,
        name: store.storeName,
        franchise: store.franchiseName || 'Unknown Franchise',
        manager: store.managerName || 'Unassigned',
        region: store.regionId?.name || 'N/A',
        zone: store.zoneId?.name || 'N/A',
        territory: store.territoryId?.name || 'N/A',
        location: store.territoryId?.name || 'N/A',
        state: store.state || '',
        city: store.city || '',
        status: store.isActive ? 'Active' : 'Pending',
        type: store.storeType || 'Delivery',
        approval: store.approvalStatus || 'Pending',
        createdDate: store.createdAt ? new Date(store.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
        phone: store.phone,
        revenue: '₹ 0',
        ordersToday: 0,
        activeKitchenOrders: 0,
        inventoryStatus: "Healthy",
        latitude: store.latitude || '',
        longitude: store.longitude || '',
        _original: store // store raw reference if needed
      }));
      setStores(mappedStores);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load franchise stores");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStoresData();
  }, []);

  const handleRowClick = (store) => {
    setSelectedStore(store);
    setIsDrawerOpen(true);
  };

  const handleExportPDF = () => {
    const listToExport = filteredStores.length > 0 ? filteredStores : stores;
    if (listToExport.length === 0) {
      toast.error("No store data to export");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });

    // Add title
    doc.setFontSize(14);
    doc.text("Franchise Stores Master Report", 14, 15);
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Records: ${listToExport.length}`, 14, 20);

    const headers = [
      ["Store Code", "Store Name", "Franchise", "Manager", "Location", "Type", "Status", "Approval", "Created"]
    ];

    const body = listToExport.map(store => [
      store.id,
      store.name,
      store.franchise,
      store.manager,
      store.location,
      store.type,
      store.status,
      store.approval,
      store.createdDate
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 23,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, fontStyle: 'normal' },
      headStyles: { fillColor: [180, 30, 21], textColor: [255, 255, 255], fontStyle: 'bold' } // Red primary
    });

    doc.save("franchise-stores-report.pdf");
    toast.success("PDF exported successfully");
  };

  const handleDownloadCSV = () => {
    const listToExport = filteredStores.length > 0 ? filteredStores : stores;
    if (listToExport.length === 0) {
      toast.error("No store data to download");
      return;
    }

    const headers = [
      "Store Code", "Store Name", "Franchise", "Manager", "Location", "Type", "Status", "Approval", "Created"
    ];

    const rows = listToExport.map(store => [
      store.id,
      store.name,
      store.franchise,
      store.manager,
      store.location,
      store.type,
      store.status,
      store.approval,
      store.createdDate
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const strVal = String(val ?? '');
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "franchise_stores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded successfully");
  };

  const handleRefresh = () => {
    fetchStoresData();
    toast.info("Refreshed live store statuses");
  };

  const handleReassignSubmit = (e) => {
    e.preventDefault();
    if (!reassignData.newManager || !reassignData.date || !reassignData.reason) {
      toast.error("Please fill in all reassign parameters");
      return;
    }
    setStores(prev => prev.map(s => s.id === selectedStore.id ? { ...s, owner: reassignData.newManager } : s));
    toast.success(`Store Manager successfully reassigned to ${reassignData.newManager}`);
    setIsReassignOpen(false);
    setReassignData({ newManager: "", date: "", reason: "" });
  };

  const handleChangeFranchiseSubmit = (e) => {
    e.preventDefault();
    if (!changeFranchiseData.newFranchise || !changeFranchiseData.reason || !changeFranchiseData.confirmed) {
      toast.error("Please fill in all franchise parameters and confirm");
      return;
    }
    setStores(prev => prev.map(s => s.id === selectedStore.id ? { ...s, franchise: changeFranchiseData.newFranchise } : s));
    toast.success(`Franchise mapped to ${changeFranchiseData.newFranchise}`);
    setIsChangeFranchiseOpen(false);
    setChangeFranchiseData({ newFranchise: "", reason: "", confirmed: false });
  };

  const handleSuspendActivateSubmit = async () => {
    try {
      const actionText = suspendActivateAction === 'suspend' ? 'Suspended' : 'Activated';
      const newStatus = suspendActivateAction === 'suspend' ? 'Suspended' : 'Active';
      
      const res = await adminAPI.updateStore(selectedStore.id, { status: newStatus });
      if (res.data?.success) {
        setStores(prev => prev.map(s => s.id === selectedStore.id ? { ...s, status: newStatus } : s));
        toast.success(`Store ${selectedStore?.name || "Store"} successfully ${actionText}`);
        setIsSuspendActivateOpen(false);
      } else {
        toast.error(res.data?.message || `Failed to ${suspendActivateAction} store`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    }
  };

  const handleCloseStore = (store) => {
    setSelectedStore(store);
    setIsCloseStoreOpen(true);
  };

  const handleCloseStoreSubmit = async () => {
    try {
      const res = await adminAPI.updateStore(selectedStore.id, { status: 'Closed' });
      if (res.data?.success) {
        setStores(prev => prev.map(s => s.id === selectedStore.id ? { ...s, status: 'Closed' } : s));
        toast.success(`Store ${selectedStore.name} successfully closed`);
        setIsCloseStoreOpen(false);
      } else {
        toast.error(res.data?.message || "Failed to close store");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4">

      {/* Breadcrumbs & Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          {/* <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            <span>Dashboard</span>
            <span>→</span>
            <span>Franchise Management</span>
            <span>→</span>
            <span className="text-red-650">Franchise Stores</span>
          </div> */}
          <h1 className="text-lg font-black text-black dark:text-white leading-tight uppercase tracking-tight mt-1">
            Franchise Stores
          </h1>
          <p className="text-[10px] font-semibold text-black dark:text-white">
            Manage all stores across franchises and monitor operational performance.
          </p>
        </div>

        {/* Actions Button Panel */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={handleRefresh}
            className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-black dark:text-white p-2 rounded-lg flex items-center justify-center shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 text-black dark:text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer font-bold text-[10px]"
          >
            <span>DOWNLOAD CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 text-black dark:text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer font-bold text-[10px]"
          >
            <Download size={12} />
            <span>EXPORT PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (5 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 select-none">
        {/* Card 1: Total Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Total Stores</span>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">{totalStores}</h3>
              <span className="text-emerald-500 font-bold text-[8px] flex items-center gap-0.5"><TrendingUp size={8} />+4.2%</span>
            </div>
          </div>
          <div className="p-1.5 rounded-md bg-red-650/10 text-red-650 shrink-0 border border-red-500/20">
            <Store size={14} />
          </div>
        </div>

        {/* Card 2: Active Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Active Stores</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">{activeStores}</h3>
          </div>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20">
            <CheckCircle size={14} />
          </div>
        </div>

        {/* Card 3: Suspended Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Suspended Stores</span>
            <h3 className="text-base font-black text-rose-600 dark:text-rose-455">{suspendedStores}</h3>
          </div>
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 shrink-0 border border-rose-500/20">
            <Ban size={14} />
          </div>
        </div>

        {/* Card 4: Open Now */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Open Now</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">{openNow}</h3>
          </div>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20">
            <Clock size={14} />
          </div>
        </div>

        {/* Card 5: Closed Now */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Closed Now</span>
            <h3 className="text-base font-black text-amber-600 dark:text-amber-400">{closedNow}</h3>
          </div>
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 shrink-0 border border-amber-500/20">
            <Clock size={14} />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <FranchiseStoresData
        stores={stores}
        setStores={setStores}
        onFilteredStoresChange={setFilteredStores}
        onRowClick={handleRowClick}
        onReassignManager={(store) => {
          setSelectedStore(store);
          setIsReassignOpen(true);
        }}
        onChangeFranchise={(store) => {
          setSelectedStore(store);
          setIsChangeFranchiseOpen(true);
        }}
        onViewAnalytics={(store) => {
          setSelectedStore(store);
          setIsAnalyticsOpen(true);
        }}
        onSuspendActivate={(store, action) => {
          setSelectedStore(store);
          setSuspendActivateAction(action);
          setIsSuspendActivateOpen(true);
        }}
        onCloseStore={handleCloseStore}
      />



      {/* Details Side Drawer */}
      <FranchiseStoresDetails
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        store={selectedStore}
        onEdit={(store) => {
          setSelectedStore(store);
          setIsAddStoreOpen(true);
        }}
        onReassignManager={(store) => {
          setSelectedStore(store);
          setIsReassignOpen(true);
        }}
        onChangeFranchise={(store) => {
          setSelectedStore(store);
          setIsChangeFranchiseOpen(true);
        }}
        onViewAnalytics={(store) => {
          setSelectedStore(store);
          setIsAnalyticsOpen(true);
        }}
        onSuspendActivate={(store) => {
          setSelectedStore(store);
          setIsSuspendActivateOpen(true);
        }}
      />

      {/* Add / Edit Store Step Wizard */}
      <AddFranchiseStores
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        store={selectedStore}
      />

      {/* View Analytics Modal */}
      <AnalyticsTabModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        store={selectedStore}
      />

      {/* Compliance & Bulk Action modals */}
      <ComplianceReport isOpen={isComplianceReportOpen} onClose={() => setIsComplianceReportOpen(false)} />

      {/* INLINE MODAL 1: Reassign Store Manager */}
      {isReassignOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 lg:pl-[280px]">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-55 dark:bg-zinc-950">
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Reassign Store Manager</h3>
              <button onClick={() => setIsReassignOpen(false)} className="text-black dark:text-zinc-350 hover:text-red-650 dark:hover:text-red-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleReassignSubmit} className="p-4 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider block mb-1">Current Manager</label>
                <input
                  type="text"
                  value={selectedStore?.owner || "Rahul Sharma"}
                  disabled
                  className="w-full h-8.5 px-3 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-300 rounded-lg outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider block mb-1">New Store Manager *</label>
                <select
                  required
                  value={reassignData.newManager}
                  onChange={(e) => setReassignData({ ...reassignData, newManager: e.target.value })}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 rounded-lg text-black dark:text-white outline-none cursor-pointer"
                >
                  <option value="">Select Manager...</option>
                  <option value="Sonia Gupta">Sonia Gupta (GUP-4432)</option>
                  <option value="Rajiv Malhotra">Rajiv Malhotra (MAL-9012)</option>
                  <option value="Aniket Deshpande">Aniket Deshpande (DES-7112)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider block mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={reassignData.date}
                  onChange={(e) => setReassignData({ ...reassignData, date: e.target.value })}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 rounded-lg text-black dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider block mb-1">Reason for Reassignment *</label>
                <textarea
                  required
                  rows="2"
                  value={reassignData.reason}
                  onChange={(e) => setReassignData({ ...reassignData, reason: e.target.value })}
                  placeholder="e.g. Operational rotation or manager reallocation"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-955 rounded-lg text-black dark:text-white outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsReassignOpen(false)}
                  className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-lg transition-colors active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE MODAL 2: Change Franchise */}
      {isChangeFranchiseOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 lg:pl-[280px]">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-55 dark:bg-zinc-955">
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Change Store Franchise</h3>
              <button onClick={() => setIsChangeFranchiseOpen(false)} className="text-black dark:text-zinc-350 hover:text-red-650 dark:hover:text-red-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleChangeFranchiseSubmit} className="p-4 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-250 dark:border-rose-900/30 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="text-rose-650 mt-0.5 shrink-0" size={15} />
                <p className="text-[10px] text-rose-800 dark:text-rose-400 font-bold leading-normal">
                  Warning: Changing the franchise will update reporting relationships, ownership records, and future billing mappings immediately.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider block mb-1">Current Franchise</label>
                <input
                  type="text"
                  value={selectedStore?.franchise || "Papa Veg Pizza India"}
                  disabled
                  className="w-full h-8.5 px-3 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-300 rounded-lg outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider block mb-1">New Franchise *</label>
                <select
                  required
                  value={changeFranchiseData.newFranchise}
                  onChange={(e) => setChangeFranchiseData({ ...changeFranchiseData, newFranchise: e.target.value })}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg text-black dark:text-white outline-none cursor-pointer"
                >
                  <option value="">Select Franchise...</option>
                  <option value="Papa Veg Pizza North India">Papa Veg Pizza North India</option>
                  <option value="Papa Veg Pizza Western Hub">Papa Veg Pizza Western Hub</option>
                  <option value="Papa Veg Pizza MP & Central">Papa Veg Pizza MP &amp; Central</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider block mb-1">Reason for Change *</label>
                <textarea
                  required
                  rows="2"
                  value={changeFranchiseData.reason}
                  onChange={(e) => setChangeFranchiseData({ ...changeFranchiseData, reason: e.target.value })}
                  placeholder="Provide justification..."
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg text-black dark:text-white outline-none resize-none"
                />
              </div>
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={changeFranchiseData.confirmed}
                  onChange={(e) => setChangeFranchiseData({ ...changeFranchiseData, confirmed: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-350 text-red-650 focus:ring-red-650"
                />
                <span className="text-[10px] font-bold text-black dark:text-zinc-200">
                  I understand the operational implications of this franchise modification.
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsChangeFranchiseOpen(false)}
                  className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-lg transition-colors active:scale-95"
                >
                  Confirm Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE MODAL 3: Suspend / Activate Confirmation */}
      {isSuspendActivateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 lg:pl-[280px]">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-55 dark:bg-zinc-950">
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                {suspendActivateAction === 'suspend' ? 'Suspend Store?' : 'Activate Store?'}
              </h3>
              <button onClick={() => setIsSuspendActivateOpen(false)} className="text-black dark:text-zinc-350 hover:text-red-650 dark:hover:text-red-400"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="flex gap-2.5 items-start">
                <AlertCircle className={suspendActivateAction === 'suspend' ? 'text-rose-650 mt-0.5 shrink-0' : 'text-emerald-500 mt-0.5 shrink-0'} size={18} />
                <div>
                  <p className="font-bold text-black dark:text-white">
                    Are you sure you want to {suspendActivateAction === 'suspend' ? 'suspend' : 'activate'} "{selectedStore?.name || "Store"}"?
                  </p>
                  <p className="text-[10px] text-black dark:text-zinc-300 mt-1 leading-normal">
                    {suspendActivateAction === 'suspend'
                      ? "The store will stop accepting new orders immediately, but historical transaction and auditing records will remain intact."
                      : "The store will go online and become visible to consumers on platforms and POS immediately."
                    }
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSuspendActivateOpen(false)}
                  className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendActivateSubmit}
                  className={`px-4 py-1.5 text-white font-bold rounded-lg transition-colors active:scale-95 ${suspendActivateAction === 'suspend' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                  {suspendActivateAction === 'suspend' ? 'Confirm Suspension' : 'Activate Location'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INLINE MODAL 4: Close Confirmation */}
      {isCloseStoreOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 lg:pl-[280px]">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-55 dark:bg-zinc-950">
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Permanently Close Store?
              </h3>
              <button onClick={() => setIsCloseStoreOpen(false)} className="text-black dark:text-zinc-350 hover:text-red-650 dark:hover:text-red-400"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="flex gap-2.5 items-start">
                <AlertCircle className="text-rose-650 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-bold text-black dark:text-white">
                    Are you sure you want to permanently close "{selectedStore?.name || "Store"}"?
                  </p>
                  <p className="text-[10px] text-black dark:text-zinc-300 mt-1 leading-normal">
                    This action is permanent and will completely close this location. It will no longer accept orders, and franchise agreements may need to be resolved.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCloseStoreOpen(false)}
                  className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseStoreSubmit}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors active:scale-95"
                >
                  Confirm Closure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
