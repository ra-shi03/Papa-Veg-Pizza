import React, { useState, useEffect } from "react";
import { Plus, ClipboardList, CheckCircle, XCircle, Search, Filter, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { adminClient } from "@/services/api/axios";

// Component imports
import AddonsData from "./AddonsData";
import AddAddonsModal from "./AddAddonsModal";
import EditAddonsModal from "./EditAddonsModal";

export default function Addons() {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState(null);

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const res = await adminClient.get("/food/admin/addons");
      if (res?.data?.success) {
        setAddons(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch addons");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterStatus("");
  };

  // KPI Calculations
  const stats = {
    totalAddons: addons.length,
    activeAddons: addons.filter(a => a.status === "Active").length,
    inactiveAddons: addons.filter(a => a.status === "Inactive").length,
    avgPrice: addons.length > 0 
      ? (addons.reduce((acc, a) => {
          const itemPrice = a.prices && a.prices.length > 0 ? Number(a.prices[0].price) : Number(a.price || 0);
          return acc + itemPrice;
        }, 0) / addons.length).toFixed(2) 
      : "0.00"
  };

  // Process data (Filter + Sort)
  const processedAddons = addons.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? item.type === filterType : true;
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedAddons = [...processedAddons].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === "price") {
      aVal = a.prices && a.prices.length > 0 ? Number(a.prices[0].price) : Number(a.price || 0);
      bVal = b.prices && b.prices.length > 0 ? Number(b.prices[0].price) : Number(b.price || 0);
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // API Handlers
  const handleSaveNewAddon = async (payload) => {
    try {
      const res = await adminClient.post("/food/admin/addons", payload);
      if (res?.data?.success) {
        toast.success("Add-on created successfully");
        fetchAddons();
        setIsAddModalOpen(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create addon");
    }
  };

  const handleSaveEditAddon = async (payload) => {
    try {
      const res = await adminClient.patch(`/food/admin/addons/${payload._id}`, payload);
      if (res?.data?.success) {
        toast.success("Add-on updated successfully");
        fetchAddons();
        setIsEditModalOpen(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update addon");
    }
  };

  const handleDeleteAddon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this addon?")) return;
    try {
      const res = await adminClient.delete(`/food/admin/addons/${id}`);
      if (res?.data?.success) {
        toast.success("Add-on deleted successfully");
        fetchAddons();
      }
    } catch (err) {
      toast.error("Failed to delete addon");
    }
  };

  const handleEditClick = (addon) => {
    setSelectedAddon(addon);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4 text-zinc-900 dark:text-zinc-100">

      {/* Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-white leading-tight mt-1">
            Toppings & Add-ons Module
          </h1>
          <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
            Configure extra side options and custom toppings.
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-[11px] shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Add New Add-on
          </button>
        </div>
      </div>

      {/* KPI Bento summary grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Total Add-ons</span>
            <h3 className="text-base font-black text-black dark:text-white mt-0.5">{stats.totalAddons}</h3>
          </div>
          <div className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
            <ClipboardList size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Active Add-ons</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.activeAddons}</h3>
          </div>
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-100 dark:border-emerald-900/35 shrink-0">
            <CheckCircle size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Inactive Add-ons</span>
            <h3 className="text-base font-black text-zinc-500 mt-0.5">{stats.inactiveAddons}</h3>
          </div>
          <div className="p-1 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200 dark:border-zinc-850 shrink-0">
            <XCircle size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Average Price</span>
            <h3 className="text-base font-black text-blue-500 mt-0.5">₹{stats.avgPrice}</h3>
          </div>
          <div className="p-1.5 border-2 border-blue-500 rounded-sm bg-white shrink-0 text-blue-600 font-bold text-[10px]">
            ₹
          </div>
        </div>
      </section>

      {/* Top Filter and Search Toolbar */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search add-on name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${showFilters
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-650 dark:text-zinc-350"
                }`}
            >
              <Filter size={12} />
              Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 border border-zinc-200 dark:border-zinc-800"
              title="Reset All Filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-zinc-250 dark:border-zinc-850 animate-in slide-in-from-top-1.5 duration-200">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-550 uppercase block">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-semibold"
              >
                <option value="">All Types</option>
                <option value="topping">Topping</option>
                <option value="extra cheese">Extra Cheese</option>
                <option value="dip">Dip</option>
                <option value="crust">Crust</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-550 uppercase block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Main Table View */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-medium text-sm">Loading add-ons...</div>
      ) : (
        <AddonsData
          addons={sortedAddons}
          onEdit={handleEditClick}
          onDelete={handleDeleteAddon}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      )}

      {/* Modals */}
      <AddAddonsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewAddon}
      />

      <EditAddonsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        addonData={selectedAddon}
        onSave={handleSaveEditAddon}
      />
    </div>
  );
}
