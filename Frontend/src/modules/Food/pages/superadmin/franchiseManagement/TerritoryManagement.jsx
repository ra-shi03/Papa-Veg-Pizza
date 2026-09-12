import React, { useState, useEffect } from "react";
import {
  Download,
  RefreshCw,
  FileText,
  Plus,
  MapPin,
  X
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Sub-components
import TerritoryManagementData from "./TerritoryManagementData";
import TerritoryDetails from "./components/TerritoryDetails";
import AddTerritoryModal from "./components/AddTerritoryModal";
import EditTerritoryModal from "./components/EditTerritoryModal";
import apiClient from "../../../../../services/api/axios";

export default function TerritoryManagement() {
  // Data states
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [franchises, setFranchises] = useState([]);

  const [territories, setTerritories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTerritories = async () => {
    try {
      setIsLoading(true);
      const [terRes, regRes, zonRes, franRes] = await Promise.all([
        apiClient.get('/food/admin/territories'),
        apiClient.get('/food/admin/regions'),
        apiClient.get('/food/admin/zones'),
        apiClient.get('/food/admin/franchises')
      ]);
      const extractArray = (res) => {
        if (Array.isArray(res?.data?.data)) return res.data.data;
        if (Array.isArray(res?.data)) return res.data;
        return [];
      };
      const regionsData = extractArray(regRes);
      const zonesData = extractArray(zonRes);
      const franchisesData = extractArray(franRes);
      
      const mappedTerritories = extractArray(terRes).map(t => {
        const zone = zonesData.find(z => z.id === t.zoneId);
        const region = zone ? regionsData.find(r => r.id === zone.regionId) : null;
        return {
          ...t,
          zoneName: zone ? zone.name : 'Unknown',
          regionName: region ? region.name : 'Unknown',
        };
      });

      setTerritories(mappedTerritories);
      setRegions(regionsData);
      setZones(zonesData);
      setFranchises(franchisesData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritories();
  }, []);

  // Search, Debouncing and Filter State sync
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filteredTerritories, setFilteredTerritories] = useState(territories);

  useEffect(() => {
    setFilteredTerritories(territories);
  }, [territories]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modal and Drawer controllers
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editTerritoryData, setEditTerritoryData] = useState(null);

  // Status Change Confirmation Modals
  const [statusChangeTarget, setStatusChangeTarget] = useState(null); // { data: territory, targetStatus: "Active" | "Inactive" }
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  // Calculated KPI aggregates
  const safeTerritories = Array.isArray(territories) ? territories : [];
  const totalTerritories = safeTerritories.length;
  const activeTerritories = safeTerritories.filter((t) => t.status === "Active").length;
  const inactiveTerritories = safeTerritories.filter((t) => t.status === "Inactive").length;
  const assignedFranchisesCount = safeTerritories.reduce((acc, curr) => acc + (curr.franchisesCount || 0), 0);
  const totalStoresMapped = safeTerritories.reduce((acc, curr) => acc + (curr.storesCount || 0), 0);
  const totalPostalCodesCovered = new Set(safeTerritories.flatMap((t) => t.postalCodes || [])).size;

  // Format currency
  const formatCurrency = (val) => {
    return `₹${val.toLocaleString()}`;
  };

  // CSV Exporter
  const handleDownloadCSV = () => {
    const headers = [
      "Territory ID",
      "Territory Name",
      "Parent Zone",
      "Parent Region",
      "Postal Codes",
      "Assigned Franchise",
      "Stores Count",
      "Radius (km)",
      "Orders Today",
      "Revenue Today (INR)",
      "Status",
      "Created Date"
    ];
    const rows = filteredTerritories.map((t) => [
      t.id,
      t.name,
      t.zoneName,
      t.regionName,
      (t.postalCodes || []).join(";"),
      t.assignedFranchiseName || "Unassigned",
      t.storesCount,
      t.deliveryRadiusKm,
      t.ordersToday,
      t.revenueToday,
      t.status,
      t.createdAt
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Territories_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Landscape PDF Exporter
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("PAPA VEG PIZZA - TERRITORY MANAGEMENT REPORT", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 21);

    const headers = [
      "ID",
      "Territory Name",
      "Zone",
      "Region",
      "Postal Codes",
      "Assigned Franchise",
      "Stores",
      "Radius",
      "Orders Today",
      "Revenue Today",
      "Status",
      "Created Date"
    ];

    const tableRows = filteredTerritories.map((t) => [
      t.id,
      t.name,
      t.zoneName,
      t.regionName,
      (t.postalCodes || []).join(", "),
      t.assignedFranchiseName || "Unassigned",
      t.storesCount,
      `${t.deliveryRadiusKm} km`,
      t.ordersToday || 0,
      `₹${(t.revenueToday || 0).toLocaleString()}`,
      t.status,
      t.createdAt
    ]);

    autoTable(doc, {
      head: [headers],
      body: tableRows,
      startY: 28,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [164, 60, 18] } // Match primary dark brick red
    });

    doc.save(`Territories_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Submit new or updated Territory
  const handleTerritorySubmit = async (territoryData) => {
    try {
      if (editTerritoryData) {
        // Edit flow
        const response = await apiClient.patch(`/food/admin/territories/${editTerritoryData.id}`, territoryData);
        const updatedT = response.data.data;
        const zone = zones.find(z => z.id === updatedT.zoneId);
        const region = zone ? regions.find(r => r.id === zone.regionId) : null;
        
        setTerritories((prev) => prev.map(t => t.id === updatedT.id ? {
            ...t,
            ...updatedT,
            zoneName: zone ? zone.name : 'Unknown',
            regionName: region ? region.name : 'Unknown'
        } : t));
      } else {
        // Create flow
        const response = await apiClient.post('/food/admin/territories', territoryData);
        const newT = response.data.data;
        const zone = zones.find(z => z.id === newT.zoneId);
        const region = zone ? regions.find(r => r.id === zone.regionId) : null;
        
        setTerritories((prev) => [...prev, {
            ...newT,
            id: newT._id,
            zoneName: zone ? zone.name : 'Unknown',
            regionName: region ? region.name : 'Unknown',
            franchisesCount: 0,
            storesCount: 0,
            status: newT.isActive ? 'Active' : 'Inactive',
            createdDate: new Date(newT.createdAt).toISOString().slice(0,10)
        }]);
      }
      setIsAddEditModalOpen(false);
      setEditTerritoryData(null);
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteTerritory = async (territory) => {
    if (!window.confirm("Are you sure you want to delete this territory?")) return;
    try {
      await apiClient.delete(`/food/admin/territories/${territory.id}`);
      setTerritories(prev => prev.filter(t => t.id !== territory.id));
    } catch (err) {
      console.error("Error deleting territory:", err);
    }
  };

  // Status Change Confirmation Trigger
  const triggerStatusChange = (territory, targetStatus) => {
    setStatusChangeTarget({ data: territory, targetStatus });
    setIsStatusConfirmOpen(true);
  };

  const confirmStatusChange = () => {
    if (!statusChangeTarget) return;
    const { data, targetStatus } = statusChangeTarget;
    setTerritories((prev) =>
      prev.map((t) => (t.id === data.id ? { ...t, status: targetStatus } : t))
    );
    if (selectedTerritory?.id === data.id) {
      setSelectedTerritory((prev) => ({ ...prev, status: targetStatus }));
    }
    setIsStatusConfirmOpen(false);
    setStatusChangeTarget(null);
  };

  // Reassignment Submission
  const handleReassignFranchise = (reassignData) => {
    const targetFran = franchises.find((f) => f.id === reassignData.newFranchiseId);
    setTerritories((prev) =>
      prev.map((t) =>
        t.id === reassignData.territoryId
          ? {
              ...t,
              assignedFranchiseId: reassignData.newFranchiseId,
              assignedFranchiseName: targetFran ? targetFran.name : "Unassigned",
              notes: `${t.notes || ""} [Reassigned to ${targetFran ? targetFran.name : "Unassigned"} on ${reassignData.effectiveDate} Reason: ${reassignData.reason}]`
            }
          : t
      )
    );
    if (selectedTerritory?.id === reassignData.territoryId) {
      setSelectedTerritory((prev) => ({
        ...prev,
        assignedFranchiseId: reassignData.newFranchiseId,
        assignedFranchiseName: targetFran ? targetFran.name : "Unassigned"
      }));
    }
    setIsReassignModalOpen(false);
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-900 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-zinc-100 leading-tight">
            Territory Management
          </h1>
          <p className="text-[10px] font-bold text-black/75 dark:text-zinc-300 mt-0.5">
            Manage territories, delivery coverage, franchise assignments, and service boundaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 select-none">
          <button
            onClick={() => {
              setEditTerritoryData(null);
              setIsAddEditModalOpen(true);
            }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-100 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Plus size={13} className="stroke-[3]" />
            <span>ADD TERRITORY</span>
          </button>
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
            onClick={() => window.location.reload()}
            className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-100 rounded-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            title="Refresh Page"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 6 Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
        {/* Total Territories */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Total Territories</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-black dark:text-zinc-100">{totalTerritories}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Sectors</span>
          </div>
        </div>

        {/* Active Territories */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Active</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">{activeTerritories}</h3>
            <span className="text-[8px] font-bold text-emerald-600/80">Online</span>
          </div>
        </div>

        {/* Inactive Territories */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Inactive</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-rose-600 dark:text-rose-455">{inactiveTerritories}</h3>
            <span className="text-[8px] font-bold text-rose-500/85">Paused</span>
          </div>
        </div>

        {/* Assigned Franchises */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Franchises</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-orange-655 dark:text-orange-400">{assignedFranchisesCount}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Holders</span>
          </div>
        </div>

        {/* Mapped Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Mapped Stores</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-blue-600 dark:text-blue-400">{totalStoresMapped}</h3>
            <span className="text-[8px] font-bold text-blue-500/80">Outlets</span>
          </div>
        </div>

        {/* Total Postal Codes */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Postal Codes</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-purple-600 dark:text-purple-400">{totalPostalCodesCovered}</h3>
            <span className="text-[8px] font-bold text-zinc-500">PINs Cover</span>
          </div>
        </div>
      </div>

      {/* Main Grid, Search & Filters component */}
      <TerritoryManagementData
        regions={regions}
        zones={zones}
        franchises={franchises}
        territories={territories}
        setTerritories={setTerritories}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        onFilteredTerritoriesChange={setFilteredTerritories}
        setSelectedTerritory={setSelectedTerritory}
        setIsDetailsDrawerOpen={setIsDetailsDrawerOpen}
        setEditTerritoryData={setEditTerritoryData}
        setIsAddEditModalOpen={setIsAddEditModalOpen}
        triggerStatusChange={triggerStatusChange}
        handleDeleteTerritory={handleDeleteTerritory}
      />

      {/* View Details Drawer */}
      <TerritoryDetails
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        territory={selectedTerritory}
        franchises={franchises}
        onEdit={(t) => {
          setIsDetailsDrawerOpen(false);
          setEditTerritoryData(t);
          setIsAddEditModalOpen(true);
        }}
        onStatusToggle={(t) => {
          const nextStatus = t.status === "Active" ? "Inactive" : "Active";
          triggerStatusChange(t, nextStatus);
        }}
      />

      {/* Add Territory Wizard Modal */}
      <AddTerritoryModal
        isOpen={isAddEditModalOpen && !editTerritoryData}
        onClose={() => setIsAddEditModalOpen(false)}
        onSubmit={handleTerritorySubmit}
        regions={regions}
        zones={zones}
        existingTerritories={territories}
      />

      {/* Edit Territory Wizard Modal */}
      <EditTerritoryModal
        isOpen={isAddEditModalOpen && !!editTerritoryData}
        onClose={() => setIsAddEditModalOpen(false)}
        onSubmit={handleTerritorySubmit}
        regions={regions}
        zones={zones}
        existingTerritories={territories}
        editTerritory={editTerritoryData}
      />



      {/* Activate / Deactivate Confirmation dialog */}
      {isStatusConfirmOpen && statusChangeTarget && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[280px]" id="status-confirm-modal">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200">
                {statusChangeTarget.targetStatus === "Inactive" ? "Deactivate Territory" : "Activate Territory"}
              </h3>
              <button
                onClick={() => setIsStatusConfirmOpen(false)}
                className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 text-xs font-semibold text-black dark:text-zinc-300 space-y-3">
              {statusChangeTarget.targetStatus === "Inactive" ? (
                <p className="leading-relaxed">
                  Deactivating this territory will prevent new operational assignments while preserving historical data. Existing store mappings and franchises will remain intact.
                </p>
              ) : (
                <p className="leading-relaxed">
                  Activating this territory will restore normal operations, allowing store allocations and delivery dispatch bounds to function as active.
                </p>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-end gap-3 select-none">
              <button
                onClick={() => setIsStatusConfirmOpen(false)}
                className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all cursor-pointer ${
                  statusChangeTarget.targetStatus === "Inactive"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-750"
                }`}
              >
                {statusChangeTarget.targetStatus === "Inactive" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

