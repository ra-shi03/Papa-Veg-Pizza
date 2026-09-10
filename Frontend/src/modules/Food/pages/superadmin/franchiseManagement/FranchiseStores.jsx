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

export default function FranchiseStores() {
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([
    {
      id: "PV-DEL-001",
      name: "Connaught Place Central",
      franchise: "Papa Veg Pizza North India",
      owner: "Rahul Sharma",
      region: "North India",
      zone: "Zone A",
      territory: "Connaught Place",
      location: "F-Block, Connaught Place, New Delhi",
      state: "Delhi",
      city: "New Delhi",
      ordersToday: 28,
      activeKitchenOrders: 4,
      inventoryStatus: "Healthy",
      status: "Active",
      createdDate: "2022-05-14",
      phone: "+91 98765 43210",
      revenue: "₹ 14,250",
      latitude: "28.6304",
      longitude: "77.2177",
      openingTime: "11:00 AM",
      closingTime: "11:30 PM",
    },
    {
      id: "PV-MUM-042",
      name: "Bandra West Hub",
      franchise: "Papa Veg Pizza Western Hub",
      owner: "Priya Mehra",
      region: "West India",
      zone: "Zone B",
      territory: "Bandra West",
      location: "Linking Road, Bandra West, Mumbai",
      state: "Maharashtra",
      city: "Mumbai",
      ordersToday: 42,
      activeKitchenOrders: 9,
      inventoryStatus: "Low Stock",
      status: "Active",
      createdDate: "2023-01-20",
      phone: "+91 91234 56789",
      revenue: "₹ 18,900",
      latitude: "19.0600",
      longitude: "72.8300",
      openingTime: "10:30 AM",
      closingTime: "11:30 PM",
    },
    {
      id: "PV-IND-084",
      name: "Bholaram Ustad Marg",
      franchise: "Papa Veg Pizza MP & Central",
      owner: "Vikram Singh",
      region: "West India",
      zone: "Zone B",
      territory: "Bholaram Ustad Marg",
      location: "Bholaram Ustad Marg, Indore",
      state: "Madhya Pradesh",
      city: "Indore",
      ordersToday: 15,
      activeKitchenOrders: 2,
      inventoryStatus: "Healthy",
      status: "Active",
      createdDate: "2023-06-11",
      phone: "+91 88888 77777",
      revenue: "₹ 8,200",
      latitude: "22.7001",
      longitude: "75.8702",
      openingTime: "11:00 AM",
      closingTime: "11:00 PM",
    },
    {
      id: "PV-PUN-015",
      name: "Koregaon Park Express",
      franchise: "Papa Veg Pizza Western Hub",
      owner: "Aniket Deshpande",
      region: "West India",
      zone: "Zone C",
      territory: "Koregaon Park",
      location: "North Main Road, Koregaon Park, Pune",
      state: "Maharashtra",
      city: "Pune",
      ordersToday: 0,
      activeKitchenOrders: 0,
      inventoryStatus: "Out of Stock",
      status: "Suspended",
      createdDate: "2022-11-05",
      phone: "+91 77776 66665",
      revenue: "₹ 0",
      latitude: "18.5362",
      longitude: "73.8896",
      openingTime: "11:00 AM",
      closingTime: "11:00 PM",
    },
    {
      id: "PV-BLR-099",
      name: "Indiranagar Flagship",
      franchise: "Papa Veg Pizza South India",
      owner: "Amit Hegde",
      region: "South India",
      zone: "Zone A",
      territory: "Indiranagar",
      location: "100 Feet Road, Indiranagar, Bengaluru",
      state: "Karnataka",
      city: "Bengaluru",
      ordersToday: 36,
      activeKitchenOrders: 6,
      inventoryStatus: "Healthy",
      status: "Active",
      createdDate: "2021-08-15",
      phone: "+91 94444 55555",
      revenue: "₹ 16,700",
      latitude: "12.9716",
      longitude: "77.6412",
      openingTime: "11:00 AM",
      closingTime: "11:30 PM",
    },
    {
      id: "PV-BHO-022",
      name: "Arera Colony Store",
      franchise: "Papa Veg Pizza MP & Central",
      owner: "Siddharth Verma",
      region: "West India",
      zone: "Zone B",
      territory: "Arera Colony",
      location: "E-7, Arera Colony, Bhopal",
      state: "Madhya Pradesh",
      city: "Bhopal",
      ordersToday: 19,
      activeKitchenOrders: 1,
      inventoryStatus: "Healthy",
      status: "Active",
      createdDate: "2024-02-12",
      phone: "+91 90000 11111",
      revenue: "₹ 9,500",
      latitude: "23.2100",
      longitude: "77.4300",
      openingTime: "11:00 AM",
      closingTime: "11:00 PM",
    },
    {
      id: "PV-MUM-011",
      name: "Andheri East Station",
      franchise: "Papa Veg Pizza Western Hub",
      owner: "Nikhil Joshi",
      region: "West India",
      zone: "Zone C",
      territory: "Andheri East",
      location: "Near Station Road, Andheri East, Mumbai",
      state: "Maharashtra",
      city: "Mumbai",
      ordersToday: 0,
      activeKitchenOrders: 0,
      inventoryStatus: "Out of Stock",
      status: "Closed",
      createdDate: "2024-04-01",
      phone: "+91 99999 88888",
      revenue: "₹ 0",
      latitude: "19.1150",
      longitude: "72.8560",
      openingTime: "11:00 AM",
      closingTime: "11:00 PM",
    },
    {
      id: "PV-DEL-088",
      name: "Dwarka Sector 12",
      franchise: "Papa Veg Pizza North India",
      owner: "Sanjay Kaushik",
      region: "North India",
      zone: "Zone A",
      territory: "Dwarka Sector 12",
      location: "Sector 12 Market, Dwarka, New Delhi",
      state: "Delhi",
      city: "New Delhi",
      ordersToday: 22,
      activeKitchenOrders: 3,
      inventoryStatus: "Low Stock",
      status: "Active",
      createdDate: "2023-09-05",
      phone: "+91 93333 22222",
      revenue: "₹ 11,400",
      latitude: "28.5900",
      longitude: "77.0400",
      openingTime: "11:00 AM",
      closingTime: "11:30 PM",
    }
  ]);
  const [filteredStores, setFilteredStores] = useState([]);

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

  // Form inputs for sub-modals
  const [reassignData, setReassignData] = useState({ newManager: "", date: "", reason: "" });
  const [changeFranchiseData, setChangeFranchiseData] = useState({ newFranchise: "", reason: "", confirmed: false });

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
      ["Store Code", "Store Name", "Franchise", "Manager", "Region", "Zone", "Territory", "State", "City", "Orders Today", "Active Kitchen", "Inventory", "Status", "Revenue"]
    ];

    const body = listToExport.map(store => [
      store.id,
      store.name,
      store.franchise,
      store.owner,
      store.region,
      store.zone,
      store.territory,
      store.state,
      store.city,
      store.ordersToday,
      store.activeKitchenOrders,
      store.inventoryStatus,
      store.status,
      store.revenue
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
      "Store Code", "Store Name", "Franchise", "Manager", "Region", "Zone",
      "Territory", "Address", "State", "City", "Today's Orders",
      "Active Kitchen Orders", "Inventory Status", "Status", "Created Date",
      "Phone", "Revenue"
    ];

    const rows = listToExport.map(store => [
      store.id,
      store.name,
      store.franchise,
      store.owner,
      store.region,
      store.zone,
      store.territory,
      store.location,
      store.state,
      store.city,
      store.ordersToday,
      store.activeKitchenOrders,
      store.inventoryStatus,
      store.status,
      store.createdDate,
      store.phone,
      store.revenue
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

  const handleSuspendActivateSubmit = () => {
    const actionText = selectedStore?.status === 'Active' ? 'Suspended' : 'Activated';
    const newStatus = selectedStore?.status === 'Active' ? 'Suspended' : 'Active';
    setStores(prev => prev.map(s => s.id === selectedStore.id ? { ...s, status: newStatus } : s));
    toast.success(`Store ${selectedStore?.name || "Indiranagar Central"} successfully ${actionText}`);
    setIsSuspendActivateOpen(false);
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

      {/* KPI Cards Grid (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 select-none">
        {/* Card 1: Total Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Total Stores</span>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">152</h3>
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
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">135</h3>
          </div>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20">
            <CheckCircle size={14} />
          </div>
        </div>

        {/* Card 3: Suspended Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Suspended Stores</span>
            <h3 className="text-base font-black text-rose-600 dark:text-rose-455">10</h3>
          </div>
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 shrink-0 border border-rose-500/20">
            <Ban size={14} />
          </div>
        </div>

        {/* Card 4: Open Now */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Open Now</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">125</h3>
          </div>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20">
            <Clock size={14} />
          </div>
        </div>

        {/* Card 5: Closed Now */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Closed Now</span>
            <h3 className="text-base font-black text-amber-600 dark:text-amber-400">17</h3>
          </div>
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 shrink-0 border border-amber-500/20">
            <Clock size={14} />
          </div>
        </div>

        {/* Card 6: Today's Orders */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Today's Orders</span>
            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">684</h3>
          </div>
          <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-200 shrink-0 border border-zinc-200 dark:border-zinc-750">
            <ShoppingBag size={14} />
          </div>
        </div>

        {/* Card 7: Low Inventory */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Low Inventory</span>
            <h3 className="text-base font-black text-rose-600 dark:text-rose-455">8</h3>
          </div>
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 shrink-0 border border-rose-500/20">
            <AlertTriangle size={14} />
          </div>
        </div>

        {/* Card 8: Revenue Today */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-black dark:text-zinc-200 uppercase tracking-wider truncate">Revenue Today</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">₹ 1,84,500</h3>
          </div>
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20">
            <Users size={14} />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <FranchiseStoresData
        stores={stores}
        setStores={setStores}
        onFilteredStoresChange={setFilteredStores}
        onRowClick={handleRowClick}
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

      {/* Decorative Footnote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-zinc-900 dark:bg-zinc-950 text-white p-4 rounded-xl overflow-hidden relative mt-4">
        <div className="space-y-2 z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider">Operational Insights</h3>
          <p className="text-zinc-300 opacity-90 text-[10px] leading-relaxed">
            92% of franchise stores have successfully integrated the new Papa Veg 'Green-Chain' inventory management system. Compliance reviews for the remaining 12 units are scheduled for next quarter.
          </p>
          <button
            onClick={() => setIsComplianceReportOpen(true)}
            className="px-4 py-1.5 bg-white text-zinc-900 font-bold rounded-lg hover:bg-zinc-100 transition-all text-[10px] mt-1"
          >
            View Compliance Report
          </button>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none z-0">
          <div className="grid grid-cols-4 gap-2 rotate-12 translate-x-12 translate-y-8">
            <div className="h-24 w-24 bg-white rounded-xl"></div>
            <div className="h-24 w-24 bg-white rounded-xl"></div>
            <div className="h-24 w-24 bg-white rounded-xl"></div>
            <div className="h-24 w-24 bg-white rounded-xl"></div>
          </div>
        </div>
      </div>

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
                {selectedStore?.status === 'Active' ? 'Suspend Store?' : 'Activate Store?'}
              </h3>
              <button onClick={() => setIsSuspendActivateOpen(false)} className="text-black dark:text-zinc-350 hover:text-red-650 dark:hover:text-red-400"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="flex gap-2.5 items-start">
                <AlertCircle className={selectedStore?.status === 'Active' ? 'text-rose-650 mt-0.5 shrink-0' : 'text-emerald-500 mt-0.5 shrink-0'} size={18} />
                <div>
                  <p className="font-bold text-black dark:text-white">
                    Are you sure you want to {selectedStore?.status === 'Active' ? 'suspend' : 'activate'} "{selectedStore?.name || "Connaught Place Central"}"?
                  </p>
                  <p className="text-[10px] text-black dark:text-zinc-300 mt-1 leading-normal">
                    {selectedStore?.status === 'Active'
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
                  className={`px-4 py-1.5 text-white font-bold rounded-lg transition-colors active:scale-95 ${selectedStore?.status === 'Active' ? 'bg-rose-650 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                  {selectedStore?.status === 'Active' ? 'Confirm Suspension' : 'Activate Location'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
