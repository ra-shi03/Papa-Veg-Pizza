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

export default function RegionsData({
  regions,
  setRegions,
  setSelectedRegion,
  setIsRegionDrawerOpen,
  onEdit,
  triggerArchiveConfirm,
  activateRecord,
  regionsSearch,
  setRegionsSearch,
  regionsDebouncedSearch,
  onFilteredRegionsChange
}) {
  // Region Filters state
  const [isRegionsFilterOpen, setIsRegionsFilterOpen] = useState(false);
  const [regionFilterName, setRegionFilterName] = useState("");
  const [regionFilterCountry, setRegionFilterCountry] = useState("");
  const [regionFilterStatus, setRegionFilterStatus] = useState("");
  const [regionFilterDate, setRegionFilterDate] = useState("");
  const [regionMinFranchises, setRegionMinFranchises] = useState("");
  const [regionMaxFranchises, setRegionMaxFranchises] = useState("");
  const [regionMinStores, setRegionMinStores] = useState("");
  const [regionMaxStores, setRegionMaxStores] = useState("");



  // Column Visibility state
  const [regionsVisibleColumns, setRegionsVisibleColumns] = useState({
    name: true,
    country: true,
    zones: true,
    franchises: true,
    stores: true,
    status: true,
    created: true
  });
  const [isRegionsColDropdownOpen, setIsRegionsColDropdownOpen] = useState(false);



  // Bulk Selection state
  const [selectedRegionIds, setSelectedRegionIds] = useState([]);


  // Sorting state
  const [regionsSortField, setRegionsSortField] = useState("name");
  const [regionsSortDirection, setRegionsSortDirection] = useState("asc");



  // Pagination state
  const [regionsPage, setRegionsPage] = useState(1);

  const itemsPerPage = 5;

  // Sorting handlers
  const handleRegionsSort = (field) => {
    if (regionsSortField === field) {
      setRegionsSortDirection(regionsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setRegionsSortField(field);
      setRegionsSortDirection("asc");
    }
  };



  // Filter Logic: Regions
  const safeRegions = Array.isArray(regions) ? regions : [];
  const filteredRegions = safeRegions
    .filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(regionsDebouncedSearch.toLowerCase()) ||
        r.country.toLowerCase().includes(regionsDebouncedSearch.toLowerCase());
      const matchesName = !regionFilterName || r.name.toLowerCase().includes(regionFilterName.toLowerCase());
      const matchesCountry = !regionFilterCountry || r.country.toLowerCase().includes(regionFilterCountry.toLowerCase());
      const matchesStatus = !regionFilterStatus || r.status === regionFilterStatus;
      const matchesDate = !regionFilterDate || r.createdDate === regionFilterDate;
      const matchesMinFranchise = !regionMinFranchises || r.franchisesCount >= parseInt(regionMinFranchises, 10);
      const matchesMaxFranchise = !regionMaxFranchises || r.franchisesCount <= parseInt(regionMaxFranchises, 10);
      const matchesMinStores = !regionMinStores || r.storesCount >= parseInt(regionMinStores, 10);
      const matchesMaxStores = !regionMaxStores || r.storesCount <= parseInt(regionMaxStores, 10);

      return (
        matchesSearch &&
        matchesName &&
        matchesCountry &&
        matchesStatus &&
        matchesDate &&
        matchesMinFranchise &&
        matchesMaxFranchise &&
        matchesMinStores &&
        matchesMaxStores
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (typeof a[regionsSortField] === "string") {
        comparison = a[regionsSortField].localeCompare(b[regionsSortField]);
      } else {
        comparison = a[regionsSortField] - b[regionsSortField];
      }
      return regionsSortDirection === "asc" ? comparison : -comparison;
    });



  // Report changes to parent
  useEffect(() => {
    if (onFilteredRegionsChange) {
      onFilteredRegionsChange(filteredRegions);
    }
  }, [regions, regionsDebouncedSearch, regionFilterName, regionFilterCountry, regionFilterStatus, regionFilterDate, regionMinFranchises, regionMaxFranchises, regionMinStores, regionMaxStores, regionsSortField, regionsSortDirection]);

  // Paginated slices
  const paginatedRegions = filteredRegions.slice((regionsPage - 1) * itemsPerPage, regionsPage * itemsPerPage);

  const totalRegionsPages = Math.ceil(filteredRegions.length / itemsPerPage);

  // Bulk selectors
  const handleToggleSelectRegion = (id) => {
    setSelectedRegionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllRegions = (checked) => {
    if (checked) {
      setSelectedRegionIds(filteredRegions.map((r) => r.id));
    } else {
      setSelectedRegionIds([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Collapsible Filter Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setIsRegionsFilterOpen(!isRegionsFilterOpen)}
              className="w-full p-3.5 flex justify-between items-center font-bold text-xs text-black dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/40 select-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[var(--primary)]" />
                <span>ADVANCED SEARCH & FILTER OPTIONS</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-250 ${isRegionsFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {isRegionsFilterOpen && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-950 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Region Name</label>
                  <input
                    type="text"
                    value={regionFilterName}
                    onChange={(e) => setRegionFilterName(e.target.value)}
                    placeholder="e.g. North India"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Country</label>
                  <input
                    type="text"
                    value={regionFilterCountry}
                    onChange={(e) => setRegionFilterCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Status</label>
                  <select
                    value={regionFilterStatus}
                    onChange={(e) => setRegionFilterStatus(e.target.value)}
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
                    value={regionFilterDate}
                    onChange={(e) => setRegionFilterDate(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Franchise Count Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={regionMinFranchises}
                      onChange={(e) => setRegionMinFranchises(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={regionMaxFranchises}
                      onChange={(e) => setRegionMaxFranchises(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Store Count Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={regionMinStores}
                      onChange={(e) => setRegionMinStores(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={regionMaxStores}
                      onChange={(e) => setRegionMaxStores(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 flex justify-end gap-2.5 pt-2 select-none">
                  <button
                    onClick={() => {
                      setRegionFilterName("");
                      setRegionFilterCountry("");
                      setRegionFilterStatus("");
                      setRegionFilterDate("");
                      setRegionMinFranchises("");
                      setRegionMaxFranchises("");
                      setRegionMinStores("");
                      setRegionMaxStores("");
                    }}
                    className="px-4 py-1.5 bg-zinc-150 dark:bg-zinc-850 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsRegionsFilterOpen(false)}
                    className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Regions Data Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center select-none">
              <div className="flex items-center gap-3">
                {selectedRegionIds.length > 0 && (
                  <div className="flex items-center gap-2 p-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg px-2">
                    <span className="text-[10px] font-black text-[var(--primary)]">{selectedRegionIds.length} Selected</span>
                    <button
                      onClick={() => {
                        setRegions((prev) => prev.map((r) => selectedRegionIds.includes(r.id) ? { ...r, status: "Inactive" } : r));
                        setSelectedRegionIds([]);
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
                  onClick={() => setIsRegionsColDropdownOpen(!isRegionsColDropdownOpen)}
                  className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                >
                  <Sliders size={12} />
                  <span>COLUMNS</span>
                </button>
                {isRegionsColDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg shadow-xl z-20 p-2 space-y-1 animate-scaleUp">
                    {Object.keys(regionsVisibleColumns).map((col) => (
                      <div
                        key={col}
                        onClick={() => setRegionsVisibleColumns({ ...regionsVisibleColumns, [col]: !regionsVisibleColumns[col] })}
                        className="flex items-center justify-between p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded cursor-pointer text-xs font-semibold select-none text-black dark:text-zinc-100"
                      >
                        <span className="capitalize">{col}</span>
                        {regionsVisibleColumns[col] ? <CheckSquare size={13} className="text-[var(--primary)]" /> : <Square size={13} />}
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
                        checked={selectedRegionIds.length === filteredRegions.length && filteredRegions.length > 0}
                        onChange={(e) => handleToggleSelectAllRegions(e.target.checked)}
                        className="rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    {regionsVisibleColumns.name && (
                      <th onClick={() => handleRegionsSort("name")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100">
                        Region Name
                      </th>
                    )}
                    {regionsVisibleColumns.country && (
                      <th onClick={() => handleRegionsSort("country")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100">
                        Country
                      </th>
                    )}
                    {regionsVisibleColumns.zones && (
                      <th onClick={() => handleRegionsSort("zonesCount")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Total Zones
                      </th>
                    )}
                    {regionsVisibleColumns.franchises && (
                      <th onClick={() => handleRegionsSort("franchisesCount")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Franchises
                      </th>
                    )}
                    {regionsVisibleColumns.stores && (
                      <th onClick={() => handleRegionsSort("storesCount")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Stores
                      </th>
                    )}

                    {regionsVisibleColumns.status && (
                      <th onClick={() => handleRegionsSort("status")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Status
                      </th>
                    )}
                    {regionsVisibleColumns.created && (
                      <th onClick={() => handleRegionsSort("createdDate")} className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 text-center">
                        Created Date
                      </th>
                    )}
                    <th className="p-3 text-right text-black dark:text-zinc-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-zinc-100">
                  {paginatedRegions.length > 0 ? (
                    paginatedRegions.map((r) => {
                      const isChecked = selectedRegionIds.includes(r.id);
                      return (
                        <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectRegion(r.id)}
                              className="rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                            />
                          </td>
                          {regionsVisibleColumns.name && (
                            <td className="p-3 font-bold text-black dark:text-zinc-100 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] cursor-pointer" onClick={() => { setSelectedRegion(r); setIsRegionDrawerOpen(true); }}>
                              {r.name}
                            </td>
                          )}
                          {regionsVisibleColumns.country && <td className="p-3 text-zinc-500 dark:text-zinc-400">{r.country}</td>}
                          {regionsVisibleColumns.zones && <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300">{r.zonesCount}</td>}
                          {regionsVisibleColumns.franchises && <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300">{r.franchisesCount}</td>}
                          {regionsVisibleColumns.stores && <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300">{r.storesCount}</td>}

                          {regionsVisibleColumns.status && (
                            <td className="p-3 text-center">
                              <button
                                onClick={() => r.status === "Active" ? triggerArchiveConfirm("region", r) : activateRecord("region", r)}
                                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors cursor-pointer ${
                                  r.status === "Active" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                                }`}
                                title={r.status === "Active" ? "Archive Region" : "Activate Region"}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                    r.status === "Active" ? "translate-x-4" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </td>
                          )}
                          {regionsVisibleColumns.created && <td className="p-3 text-center text-zinc-500 dark:text-zinc-400 font-bold">{r.createdDate}</td>}
                          <td className="p-3 select-none">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedRegion(r);
                                  setIsRegionDrawerOpen(true);
                                }}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-blue-600 dark:text-blue-400 cursor-pointer inline-flex"
                                title="View Details"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => onEdit(r)}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-black dark:text-zinc-300 cursor-pointer inline-flex"
                                title="Edit Region"
                              >
                                <Sliders size={13} />
                              </button>
                              <button
                                onClick={() => triggerArchiveConfirm("region", r)}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-red-600 dark:text-red-500 cursor-pointer inline-flex"
                                title="Delete Region"
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
                      <td colSpan={10} className="p-6 text-center text-zinc-500 font-bold">No regions found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalRegionsPages > 1 && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs select-none">
                <span className="text-zinc-500 font-bold">Showing {paginatedRegions.length} of {filteredRegions.length} Regions</span>
                <div className="flex gap-1">
                  <button
                    disabled={regionsPage === 1}
                    onClick={() => setRegionsPage(regionsPage - 1)}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-black dark:text-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors font-bold cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 flex items-center font-black">{regionsPage} / {totalRegionsPages}</span>
                  <button
                    disabled={regionsPage === totalRegionsPages}
                    onClick={() => setRegionsPage(regionsPage + 1)}
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
