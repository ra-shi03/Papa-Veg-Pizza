import React, { useState, useEffect } from "react";
import {
  Filter,
  ChevronDown,
  Sliders,
  CheckSquare,
  Square,
  Eye,
  Trash2,
  CheckCircle,
  Milestone
} from "lucide-react";

export default function ZonesData({
  regions,
  zones,
  setZones,
  setSelectedZone,
  setIsZoneDrawerOpen,
  onEdit,
  setIsAssignTerritoryOpen,
  triggerArchiveConfirm,
  activateRecord,
  zonesSearch,
  setZonesSearch,
  zonesDebouncedSearch,
  onFilteredZonesChange
}) {


  // Zone Filters state
  const [isZonesFilterOpen, setIsZonesFilterOpen] = useState(false);
  const [zoneFilterName, setZoneFilterName] = useState("");
  const [zoneFilterRegion, setZoneFilterRegion] = useState("");
  const [zoneFilterStatus, setZoneFilterStatus] = useState("");
  const [zoneFilterDate, setZoneFilterDate] = useState("");
  const [zoneMinTerritories, setZoneMinTerritories] = useState("");
  const [zoneMaxTerritories, setZoneMaxTerritories] = useState("");
  const [zoneMinStores, setZoneMinStores] = useState("");
  const [zoneMaxStores, setZoneMaxStores] = useState("");



  const [zonesVisibleColumns, setZonesVisibleColumns] = useState({
    name: true,
    region: true,
    territories: true,
    franchises: true,
    stores: true,
    status: true,
    created: true
  });
  const [isZonesColDropdownOpen, setIsZonesColDropdownOpen] = useState(false);

  // Bulk Selection state

  const [selectedZoneIds, setSelectedZoneIds] = useState([]);



  const [zonesSortField, setZonesSortField] = useState("name");
  const [zonesSortDirection, setZonesSortDirection] = useState("asc");

  // Pagination state

  const [zonesPage, setZonesPage] = useState(1);
  const itemsPerPage = 5;

  // Sorting handlers


  const handleZonesSort = (field) => {
    if (zonesSortField === field) {
      setZonesSortDirection(zonesSortDirection === "asc" ? "desc" : "asc");
    } else {
      setZonesSortField(field);
      setZonesSortDirection("asc");
    }
  };



  // Filter Logic: Zones
  const safeZones = Array.isArray(zones) ? zones : [];
  const filteredZones = safeZones
    .filter((z) => {
      const matchesSearch =
        z.name.toLowerCase().includes(zonesDebouncedSearch.toLowerCase()) ||
        z.regionName.toLowerCase().includes(zonesDebouncedSearch.toLowerCase());
      const matchesName = !zoneFilterName || z.name.toLowerCase().includes(zoneFilterName.toLowerCase());
      const matchesRegion = !zoneFilterRegion || z.regionId === zoneFilterRegion;
      const matchesStatus = !zoneFilterStatus || z.status === zoneFilterStatus;
      const matchesDate = !zoneFilterDate || z.createdDate === zoneFilterDate;
      const matchesMinTerritories = !zoneMinTerritories || z.territoriesCount >= parseInt(zoneMinTerritories, 10);
      const matchesMaxTerritories = !zoneMaxTerritories || z.territoriesCount <= parseInt(zoneMaxTerritories, 10);
      const matchesMinStores = !zoneMinStores || z.storesCount >= parseInt(zoneMinStores, 10);
      const matchesMaxStores = !zoneMaxStores || z.storesCount <= parseInt(zoneMaxStores, 10);

      return (
        matchesSearch &&
        matchesName &&
        matchesRegion &&
        matchesStatus &&
        matchesDate &&
        matchesMinTerritories &&
        matchesMaxTerritories &&
        matchesMinStores &&
        matchesMaxStores
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (typeof a[zonesSortField] === "string") {
        comparison = a[zonesSortField].localeCompare(b[zonesSortField]);
      } else {
        comparison = a[zonesSortField] - b[zonesSortField];
      }
      return zonesSortDirection === "asc" ? comparison : -comparison;
    });



  useEffect(() => {
    if (onFilteredZonesChange) {
      onFilteredZonesChange(filteredZones);
    }
  }, [zones, zonesDebouncedSearch, zoneFilterName, zoneFilterRegion, zoneFilterStatus, zoneFilterDate, zoneMinTerritories, zoneMaxTerritories, zoneMinStores, zoneMaxStores, zonesSortField, zonesSortDirection]);

  // Paginated slices

  const paginatedZones = filteredZones.slice((zonesPage - 1) * itemsPerPage, zonesPage * itemsPerPage);


  const totalZonesPages = Math.ceil(filteredZones.length / itemsPerPage);





  const handleToggleSelectZone = (id) => {
    setSelectedZoneIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllZones = (checked) => {
    if (checked) {
      setSelectedZoneIds(filteredZones.map((z) => z.id));
    } else {
      setSelectedZoneIds([]);
    }
  };

  return (
    <div className="space-y-4">
          {/* Collapsible Filter Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setIsZonesFilterOpen(!isZonesFilterOpen)}
              className="w-full p-3.5 flex justify-between items-center font-bold text-xs text-black dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/40 select-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[var(--primary)]" />
                <span>ADVANCED ZONES SEARCH & FILTERS</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-250 ${isZonesFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {isZonesFilterOpen && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-950 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Zone Name</label>
                  <input
                    type="text"
                    value={zoneFilterName}
                    onChange={(e) => setZoneFilterName(e.target.value)}
                    placeholder="e.g. Mumbai Zone"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Parent Region</label>
                  <select
                    value={zoneFilterRegion}
                    onChange={(e) => setZoneFilterRegion(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  >
                    <option value="">All Regions</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Status</label>
                  <select
                    value={zoneFilterStatus}
                    onChange={(e) => setZoneFilterStatus(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Date Created</label>
                  <input
                    type="date"
                    value={zoneFilterDate}
                    onChange={(e) => setZoneFilterDate(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Territory Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={zoneMinTerritories}
                      onChange={(e) => setZoneMinTerritories(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={zoneMaxTerritories}
                      onChange={(e) => setZoneMaxTerritories(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Store Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={zoneMinStores}
                      onChange={(e) => setZoneMinStores(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={zoneMaxStores}
                      onChange={(e) => setZoneMaxStores(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 flex justify-end gap-2.5 pt-2 select-none">
                  <button
                    onClick={() => {
                      setZoneFilterName("");
                      setZoneFilterRegion("");
                      setZoneFilterStatus("");
                      setZoneFilterDate("");
                      setZoneMinTerritories("");
                      setZoneMaxTerritories("");
                      setZoneMinStores("");
                      setZoneMaxStores("");
                    }}
                    className="px-4 py-1.5 bg-zinc-155 dark:bg-zinc-850 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsZonesFilterOpen(false)}
                    className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Zones Data Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center select-none">
              <div className="flex items-center gap-3">
                {selectedZoneIds.length > 0 && (
                  <div className="flex items-center gap-2 p-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg px-2">
                    <span className="text-[10px] font-black text-[var(--primary)]">{selectedZoneIds.length} Selected</span>
                    <button
                      onClick={() => {
                        setZones((prev) => prev.map((z) => selectedZoneIds.includes(z.id) ? { ...z, status: "Inactive" } : z));
                        setSelectedZoneIds([]);
                      }}
                      className="text-rose-600 hover:text-rose-700 cursor-pointer text-[10px] font-bold"
                    >
                      Archive Selected
                    </button>
                  </div>
                )}
              </div>

              {/* Column dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsZonesColDropdownOpen(!isZonesColDropdownOpen)}
                  className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                >
                  <Sliders size={12} />
                  <span>COLUMNS</span>
                </button>
                {isZonesColDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg shadow-xl z-20 p-2 space-y-1 animate-scaleUp">
                    {Object.keys(zonesVisibleColumns).map((col) => (
                      <div
                        key={col}
                        onClick={() => setZonesVisibleColumns({ ...zonesVisibleColumns, [col]: !zonesVisibleColumns[col] })}
                        className="flex items-center justify-between p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded cursor-pointer text-xs font-semibold select-none text-black dark:text-zinc-100"
                      >
                        <span className="capitalize">{col}</span>
                        {zonesVisibleColumns[col] ? <CheckSquare size={13} className="text-[var(--primary)]" /> : <Square size={13} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedZoneIds.length === filteredZones.length && filteredZones.length > 0}
                        onChange={(e) => handleToggleSelectAllZones(e.target.checked)}
                        className="rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    {zonesVisibleColumns.name && (
                      <th onClick={() => handleZonesSort("name")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100">
                        Zone Name
                      </th>
                    )}
                    {zonesVisibleColumns.region && (
                      <th onClick={() => handleZonesSort("regionName")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100">
                        Parent Region
                      </th>
                    )}
                    {zonesVisibleColumns.territories && (
                      <th onClick={() => handleZonesSort("territoriesCount")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Territories
                      </th>
                    )}
                    {zonesVisibleColumns.franchises && (
                      <th onClick={() => handleZonesSort("franchisesCount")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Franchises
                      </th>
                    )}
                    {zonesVisibleColumns.stores && (
                      <th onClick={() => handleZonesSort("storesCount")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Stores
                      </th>
                    )}

                    {zonesVisibleColumns.status && (
                      <th onClick={() => handleZonesSort("status")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Status
                      </th>
                    )}
                    {zonesVisibleColumns.created && (
                      <th onClick={() => handleZonesSort("createdDate")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Created Date
                      </th>
                    )}
                    <th className="p-3 text-right text-black dark:text-zinc-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-zinc-100">
                  {paginatedZones.length > 0 ? (
                    paginatedZones.map((z) => {
                      const isChecked = selectedZoneIds.includes(z.id);
                      return (
                        <tr key={z.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectZone(z.id)}
                              className="rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                            />
                          </td>
                          {zonesVisibleColumns.name && (
                            <td className="p-3 font-bold text-black dark:text-zinc-100 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] cursor-pointer" onClick={() => { setSelectedZone(z); setIsZoneDrawerOpen(true); }}>
                              {z.name}
                            </td>
                          )}
                          {zonesVisibleColumns.region && <td className="p-3 text-zinc-500 dark:text-zinc-400">{z.regionName}</td>}
                          {zonesVisibleColumns.territories && <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300">{z.territoriesCount}</td>}
                          {zonesVisibleColumns.franchises && <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300">{z.franchisesCount}</td>}
                          {zonesVisibleColumns.stores && <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300">{z.storesCount}</td>}

                          {zonesVisibleColumns.status && (
                            <td className="p-3 text-center">
                              <button
                                onClick={() => z.status === "Active" ? triggerArchiveConfirm("zone", z) : activateRecord("zone", z)}
                                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors cursor-pointer ${
                                  z.status === "Active" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                                }`}
                                title={z.status === "Active" ? "Archive Zone" : "Activate Zone"}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                    z.status === "Active" ? "translate-x-4" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </td>
                          )}
                          {zonesVisibleColumns.created && <td className="p-3 text-center text-zinc-500 dark:text-zinc-400 font-bold">{z.createdDate}</td>}
                          <td className="p-3 select-none">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedZone(z);
                                  setIsZoneDrawerOpen(true);
                                }}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-blue-600 dark:text-blue-400 cursor-pointer inline-flex"
                                  title="View Details"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => onEdit(z)}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-black dark:text-zinc-300 cursor-pointer inline-flex"
                                title="Edit Zone"
                              >
                                <Sliders size={13} />
                              </button>
                              <button
                                onClick={() => triggerArchiveConfirm("zone", z)}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-red-600 dark:text-red-500 cursor-pointer inline-flex"
                                title="Delete Zone"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-6 text-center text-zinc-500 font-bold">No zones found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalZonesPages > 1 && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs select-none">
                <span className="text-zinc-500 font-bold">Showing {paginatedZones.length} of {filteredZones.length} Zones</span>
                <div className="flex gap-1">
                  <button
                    disabled={zonesPage === 1}
                    onClick={() => setZonesPage(zonesPage - 1)}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-black dark:text-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors font-bold cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 flex items-center font-black">{zonesPage} / {totalZonesPages}</span>
                  <button
                    disabled={zonesPage === totalZonesPages}
                    onClick={() => setZonesPage(zonesPage + 1)}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-black dark:text-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
  );
}
