import React, { useState, useEffect } from "react";
import {
  Download,
  RefreshCw,
  FileText,
  Plus,
  Search,
  X
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Sub-components
import AddRegionModal from "./components/AddRegionModal";
import EditRegionModal from "./components/EditRegionModal";
import AddZoneModal from "./components/AddZoneModal";
import EditZoneModal from "./components/EditZoneModal";
import AssignTerritoryModal from "./components/AssignTerritoryModal";
import RegionDetailsDrawer from "./components/RegionDetailsDrawer";
import ZoneDetailsDrawer from "./components/ZoneDetailsDrawer";
import RegionsData from "./RegionsData";
import ZonesData from "./ZonesData";
import apiClient from "../../../../../services/api/axios";

export default function RegionsZones() {
  const [activeTab, setActiveTab] = useState("regions"); // "regions" | "zones"

  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGeographyData = async () => {
    try {
      setIsLoading(true);
      const [regionsRes, zonesRes] = await Promise.all([
        apiClient.get('/food/admin/regions'),
        apiClient.get('/food/admin/zones')
      ]);
      setRegions(regionsRes.data.data || []);
      setZones(zonesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching geography data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGeographyData();
  }, []);

  // Update filtered datasets whenever source data changes
  useEffect(() => {
    setFilteredRegions(regions);
  }, [regions]);

  useEffect(() => {
    setFilteredZones(zones);
  }, [zones]);


  // Search and Debounce
  const [regionsSearch, setRegionsSearch] = useState("");
  const [regionsDebouncedSearch, setRegionsDebouncedSearch] = useState("");
  const [zonesSearch, setZonesSearch] = useState("");
  const [zonesDebouncedSearch, setZonesDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setRegionsDebouncedSearch(regionsSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [regionsSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setZonesDebouncedSearch(zonesSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [zonesSearch]);

  // Filtered dataset states (propagated from child component)
  const [filteredRegions, setFilteredRegions] = useState(regions);
  const [filteredZones, setFilteredZones] = useState(zones);

  // Drawers and Modals States
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isRegionDrawerOpen, setIsRegionDrawerOpen] = useState(false);

  const [selectedZone, setSelectedZone] = useState(null);
  const [isZoneDrawerOpen, setIsZoneDrawerOpen] = useState(false);

  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isEditRegionModalOpen, setIsEditRegionModalOpen] = useState(false);
  const [editRegionData, setEditRegionData] = useState(null);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [editZoneData, setEditZoneData] = useState(null);

  const [isAssignTerritoryOpen, setIsAssignTerritoryOpen] = useState(false);

  // Archive Confirmations
  const [archiveTarget, setArchiveTarget] = useState(null); // { type: "region" | "zone", data: object }
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  // KPI calculations (Updates dynamically)
  const safeRegions = Array.isArray(regions) ? regions : [];
  const safeZones = Array.isArray(zones) ? zones : [];

  const totalRegions = safeRegions.length;
  const totalZones = safeZones.length;
  const activeRegions = safeRegions.filter((r) => r.status === "Active").length;
  const activeZones = safeZones.filter((z) => z.status === "Active").length;
  const totalTerritories = safeZones.reduce((acc, curr) => acc + (curr.territoriesCount || 0), 0);
  const totalFranchises = safeRegions.reduce((acc, curr) => acc + (curr.franchisesCount || 0), 0);
  const totalStores = safeRegions.reduce((acc, curr) => acc + (curr.storesCount || 0), 0);

  const formatCurrencyInCr = (val) => {
    const inCr = val / 10000000;
    return `₹${inCr.toFixed(2)} Cr`;
  };

  // CSV Downloader
  const handleDownloadCSV = () => {
    if (activeTab === "regions") {
      const headers = ["Region ID", "Region Name", "Country", "Zones count", "Franchises count", "Stores count", "Status", "Created Date"];
      const rows = filteredRegions.map((r) => [r.id, r.name, r.country, r.zonesCount, r.franchisesCount, r.storesCount, r.status, r.createdDate]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Regions_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ["Zone ID", "Zone Name", "Parent Region", "Territories count", "Franchises count", "Stores count", "Active Orders", "Status", "Created Date"];
      const rows = filteredZones.map((z) => [z.id, z.name, z.regionName, z.territoriesCount, z.franchisesCount, z.storesCount, z.activeOrders, z.status, z.createdDate]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Zones_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Landscape PDF Exporter
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const isReg = activeTab === "regions";
    doc.setFontSize(16);
    doc.text(`PAPA VEG PIZZA - ${isReg ? "REGIONS" : "ZONES"} MANAGEMENT REPORT`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 21);

    const headers = isReg
      ? ["ID", "Region Name", "Country", "Zones", "Franchises", "Stores", "Status", "Created Date"]
      : ["ID", "Zone Name", "Parent Region", "Territories", "Franchises", "Stores", "Orders", "Status", "Created Date"];

    const tableRows = isReg
      ? filteredRegions.map((r) => [r.id, r.name, r.country, r.zonesCount, r.franchisesCount, r.storesCount, r.status, r.createdDate])
      : filteredZones.map((z) => [z.id, z.name, z.regionName, z.territoriesCount, z.franchisesCount, z.storesCount, z.activeOrders, z.status, z.createdDate]);

    autoTable(doc, {
      head: [headers],
      body: tableRows,
      startY: 28,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [164, 60, 18] }, // Match primary dark brick red
    });

    doc.save(`${isReg ? "Regions" : "Zones"}_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Add/Edit Submissions
  const handleAddRegionSubmit = async (regionData) => {
    try {
      const response = await apiClient.post('/food/admin/regions', regionData);
      setRegions((prev) => [...prev, {
          ...response.data.data,
          id: response.data.data._id,
          zonesCount: 0,
          franchisesCount: 0,
          storesCount: 0,
          status: response.data.data.isActive ? 'Active' : 'Inactive',
          createdDate: new Date(response.data.data.createdAt).toISOString().slice(0,10)
      }]);
      setIsRegionModalOpen(false);
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditRegionSubmit = async (regionData) => {
    try {
      const response = await apiClient.patch(`/food/admin/regions/${regionData.id}`, regionData);
      
      const updatedRegion = {
          ...response.data.data,
          status: response.data.data.isActive ? 'Active' : 'Inactive'
      };

      setRegions((prev) => prev.map((r) => r.id === regionData.id ? {
          ...r,
          ...updatedRegion
      } : r));

      if (selectedRegion?.id === regionData.id) {
        setSelectedRegion((prev) => ({
          ...prev,
          ...updatedRegion
        }));
      }

      setIsEditRegionModalOpen(false);
      setEditRegionData(null);
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddZoneSubmit = async (zoneData) => {
    try {
      const response = await apiClient.post('/food/admin/zones', zoneData);
      const parentRegion = regions.find(r => r.id === zoneData.regionId);
      setZones((prev) => [...prev, {
          ...response.data.data,
          id: response.data.data._id,
          regionName: parentRegion ? parentRegion.name : 'Unknown',
          territoriesCount: 0,
          franchisesCount: 0,
          storesCount: 0,
          activeOrders: 0,
          status: response.data.data.isActive ? 'Active' : 'Inactive',
          createdDate: new Date(response.data.data.createdAt).toISOString().slice(0,10)
      }]);
      setIsZoneModalOpen(false);
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditZoneSubmit = async (zoneData) => {
    try {
      const response = await apiClient.patch(`/food/admin/zones/${zoneData.id}`, zoneData);
      const parentRegion = regions.find(r => r.id === zoneData.regionId);
      
      const updatedZone = {
          ...response.data.data,
          regionName: parentRegion ? parentRegion.name : 'Unknown',
          status: response.data.data.isActive ? 'Active' : 'Inactive'
      };

      setZones((prev) => prev.map((z) => z.id === zoneData.id ? {
          ...z,
          ...updatedZone
      } : z));

      if (selectedZone?.id === zoneData.id) {
        setSelectedZone((prev) => ({
          ...prev,
          ...updatedZone
        }));
      }

      setIsEditZoneModalOpen(false);
      setEditZoneData(null);
    } catch(err) {
      console.error(err);
    }
  };

  // Archival Confirmations & Toggle Status
  const triggerArchiveConfirm = (type, data) => {
    setArchiveTarget({ type, data });
    setIsArchiveConfirmOpen(true);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    const { type, data } = archiveTarget;
    try {
      if (type === "region") {
        await apiClient.delete(`/food/admin/regions/${data.id}`);
        setRegions((prev) => prev.filter((r) => r.id !== data.id));
        if (selectedRegion?.id === data.id) setSelectedRegion(null);
      } else {
        await apiClient.delete(`/food/admin/zones/${data.id}`);
        setZones((prev) => prev.filter((z) => z.id !== data.id));
        if (selectedZone?.id === data.id) setSelectedZone(null);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
    setIsArchiveConfirmOpen(false);
    setArchiveTarget(null);
  };

  const activateRecord = (type, data) => {
    if (type === "region") {
      setRegions((prev) =>
        prev.map((r) => (r.id === data.id ? { ...r, status: "Active" } : r))
      );
      if (selectedRegion?.id === data.id) {
        setSelectedRegion((prev) => ({ ...prev, status: "Active" }));
      }
    } else {
      setZones((prev) =>
        prev.map((z) => (z.id === data.id ? { ...z, status: "Active" } : z))
      );
      if (selectedZone?.id === data.id) {
        setSelectedZone((prev) => ({ ...prev, status: "Active" }));
      }
    }
  };

  // Territory Assign callback
  const handleSaveAssignments = (payload) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === payload.zoneId
          ? { ...z, territoriesCount: payload.assignedTerritories.length }
          : z
      )
    );
    setIsAssignTerritoryOpen(false);
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-900 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-zinc-100 leading-tight">
            Regions & Zones
          </h1>
          <p className="text-[10px] font-bold text-black/75 dark:text-zinc-300 mt-0.5">
            Manage geographical hierarchy for franchises, stores, reporting, and operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 select-none">
          <button
            onClick={() => {
              setEditRegionData(null);
              setIsRegionModalOpen(true);
            }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-100 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Plus size={13} className="stroke-[3]" />
            <span>ADD REGION</span>
          </button>
          <button
            onClick={() => {
              setEditZoneData(null);
              setIsZoneModalOpen(true);
            }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-100 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Plus size={13} className="stroke-[3]" />
            <span>ADD ZONE</span>
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

      {/* 7 Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 select-none">
        {/* Total Regions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Total Regions</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-black dark:text-zinc-100">{totalRegions}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Clusters</span>
          </div>
        </div>

        {/* Total Zones */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Total Zones</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-black dark:text-zinc-100">{totalZones}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Sectors</span>
          </div>
        </div>

        {/* Active Regions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Active Regions</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">{activeRegions}</h3>
            <span className="text-[8px] font-bold text-emerald-600/80">Operational</span>
          </div>
        </div>

        {/* Active Zones */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Active Zones</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">{activeZones}</h3>
            <span className="text-[8px] font-bold text-emerald-600/80">Operational</span>
          </div>
        </div>

        {/* Total Territories */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Total Territories</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-blue-600 dark:text-blue-400">{totalTerritories}</h3>
            <span className="text-[8px] font-bold text-blue-500/80">SLA Bounds</span>
          </div>
        </div>

        {/* Total Franchises */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Franchises</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-orange-600 dark:text-orange-400">{totalFranchises}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Holders</span>
          </div>
        </div>

        {/* Total Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider block truncate">Stores count</span>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-base font-black text-purple-600 dark:text-purple-400">{totalStores}</h3>
            <span className="text-[8px] font-bold text-zinc-500">Mapped Outlets</span>
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-2 rounded-xl flex justify-between items-center shadow-sm select-none">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("regions")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "regions"
                ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/25"
                : "text-zinc-500 hover:text-black dark:hover:text-zinc-200"
            }`}
          >
            Regions ({filteredRegions.length})
          </button>
          <button
            onClick={() => setActiveTab("zones")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "zones"
                ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/25"
                : "text-zinc-500 hover:text-black dark:hover:text-zinc-200"
            }`}
          >
            Zones ({filteredZones.length})
          </button>
        </div>

        {/* Quick Search inside Tabs */}
        <div className="relative w-64 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
          {activeTab === "regions" ? (
            <input
              id="regionsSearch"
              name="regionsSearch"
              type="text"
              placeholder="Search regions..."
              value={regionsSearch}
              onChange={(e) => setRegionsSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] placeholder-zinc-400"
            />
          ) : (
            <input
              id="zonesSearch"
              name="zonesSearch"
              type="text"
              placeholder="Search zones..."
              value={zonesSearch}
              onChange={(e) => setZonesSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] placeholder-zinc-400"
            />
          )}
        </div>
      </div>

      {/* Grid and Table Data Rendering */}
      {activeTab === "regions" ? (
        <RegionsData
          regions={regions}
          setRegions={setRegions}
          setSelectedRegion={setSelectedRegion}
          setIsRegionDrawerOpen={setIsRegionDrawerOpen}
          onEdit={(r) => {
            setEditRegionData(r);
            setIsEditRegionModalOpen(true);
          }}
          triggerArchiveConfirm={triggerArchiveConfirm}
          activateRecord={activateRecord}
          regionsSearch={regionsSearch}
          setRegionsSearch={setRegionsSearch}
          regionsDebouncedSearch={regionsDebouncedSearch}
          onFilteredRegionsChange={setFilteredRegions}
        />
      ) : (
        <ZonesData
          regions={regions}
          zones={zones}
          setZones={setZones}
          setSelectedZone={setSelectedZone}
          setIsZoneDrawerOpen={setIsZoneDrawerOpen}
          onEdit={(z) => {
            setEditZoneData(z);
            setIsEditZoneModalOpen(true);
          }}
          setIsAssignTerritoryOpen={setIsAssignTerritoryOpen}
          triggerArchiveConfirm={triggerArchiveConfirm}
          activateRecord={activateRecord}
          zonesSearch={zonesSearch}
          setZonesSearch={setZonesSearch}
          zonesDebouncedSearch={zonesDebouncedSearch}
          onFilteredZonesChange={setFilteredZones}
        />
      )}

      {/* Region details drawer */}
      <RegionDetailsDrawer
        isOpen={isRegionDrawerOpen}
        onClose={() => setIsRegionDrawerOpen(false)}
        region={selectedRegion}
        onEdit={(r) => {
          setIsRegionDrawerOpen(false);
          setEditRegionData(r);
          setIsEditRegionModalOpen(true);
        }}
      />

      {/* Zone details drawer */}
      <ZoneDetailsDrawer
        isOpen={isZoneDrawerOpen}
        onClose={() => setIsZoneDrawerOpen(false)}
        zone={selectedZone}
        onEdit={(z) => {
          setIsZoneDrawerOpen(false);
          setEditZoneData(z);
          setIsEditZoneModalOpen(true);
        }}
        onAssignTerritory={(z) => {
          setIsZoneDrawerOpen(false);
          setSelectedZone(z);
          setIsAssignTerritoryOpen(true);
        }}
      />

      {/* Add Region Modal */}
      <AddRegionModal
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        onSubmit={handleAddRegionSubmit}
        existingRegions={regions}
      />

      {/* Edit Region Modal */}
      <EditRegionModal
        isOpen={isEditRegionModalOpen}
        onClose={() => setIsEditRegionModalOpen(false)}
        onSubmit={handleEditRegionSubmit}
        existingRegions={regions}
        editRegion={editRegionData}
      />

      {/* Add Zone Modal */}
      <AddZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSubmit={handleAddZoneSubmit}
        regions={regions}
        existingZones={zones}
      />

      {/* Edit Zone Modal */}
      <EditZoneModal
        isOpen={isEditZoneModalOpen}
        onClose={() => setIsEditZoneModalOpen(false)}
        onSubmit={handleEditZoneSubmit}
        regions={regions}
        existingZones={zones}
        editZone={editZoneData}
      />

      {/* Assign Territory Modal */}
      <AssignTerritoryModal
        isOpen={isAssignTerritoryOpen}
        onClose={() => setIsAssignTerritoryOpen(false)}
        onSubmit={handleSaveAssignments}
        zone={selectedZone}
      />

      {/* Custom Archive Confirmation Alert Modal */}
      {isArchiveConfirmOpen && archiveTarget && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[280px]" id="archive-confirm-modal">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-600">Delete Confirmation</h3>
              <button
                onClick={() => setIsArchiveConfirmOpen(false)}
                className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 text-xs font-semibold text-black dark:text-zinc-300 space-y-3">
              {archiveTarget.type === "region" ? (
                <p className="leading-relaxed">
                  Deleting this region will permanently remove it. Existing zones, territories, franchises, and stores linked to this region may lose their structural parent.
                </p>
              ) : (
                <p className="leading-relaxed">
                  Deleting this zone will permanently remove it along with all related assignments.
                </p>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-end gap-3 select-none">
              <button
                onClick={() => setIsArchiveConfirmOpen(false)}
                className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-350 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Delete {archiveTarget.type === "region" ? "Region" : "Zone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
