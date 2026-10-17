import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  ClipboardList,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RotateCcw,
  Boxes,
  Disc,
  Sparkles,
  Droplets,
  Flame,
  Tag,
  Layers,
  RefreshCw,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { adminClient } from "@/services/api/axios";

// Component imports
import AddonsData from "./AddonsData";
import AddAddonsModal from "./AddAddonsModal";
import EditAddonsModal from "./EditAddonsModal";
import AddonsDetails from "./AddonsDetails";
import AddonTypesTab from "./AddonTypesTab";
import { ICON_MAP } from "./AddTypeModal";

export const normalizeAddonType = (rawType = "") => {
  const t = String(rawType || "").trim().toLowerCase();
  if (t.includes("crust")) return "crust";
  if (t.includes("cheese")) return "cheese";
  if (t.includes("dip") || t.includes("sauce")) return "dip";
  if (t.includes("topping")) return "topping";
  if (t.includes("burst")) return "burst";
  return t || "other";
};

const TYPE_META = {
  crust: {
    key: "crust",
    label: "Crusts",
    icon: Disc,
    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
  },
  topping: {
    key: "topping",
    label: "Toppings",
    icon: Sparkles,
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30",
  },
  dip: {
    key: "dip",
    label: "Dips & Sauces",
    icon: Droplets,
    color: "text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30",
  },
  cheese: {
    key: "cheese",
    label: "Cheese & Extra Cheese",
    icon: Flame,
    color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30",
  },
  burst: {
    key: "burst",
    label: "Burst",
    icon: Layers,
    color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30",
  },
};

export default function Addons() {
  const [activeTab, setActiveTab] = useState("types"); // 'types' | 'addons'
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [apiStats, setApiStats] = useState(null);

  // Addon Types State
  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);

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

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAddonId, setViewAddonId] = useState(null);
  const [viewAddonData, setViewAddonData] = useState(null);

  useEffect(() => {
    fetchAddons();
    fetchStats();
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      setTypesLoading(true);
      const res = await adminClient.get("/food/admin/addon-types");
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setTypes(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch addon types:", err);
    } finally {
      setTypesLoading(false);
    }
  };

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

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await adminClient.get("/food/admin/addons/stats");
      if (res?.data?.success && res.data.data) {
        setApiStats(res.data.data);
      }
    } catch (err) {
      console.warn("Using local calculations for addon stats fallback:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Addon Type Handlers
  const handleCreateType = async (payload) => {
    try {
      const res = await adminClient.post("/food/admin/addon-types", payload);
      if (res?.data?.success) {
        toast.success(`Add-on type '${payload.name}' created successfully`);
        await fetchTypes();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create addon type");
    }
  };

  const handleUpdateType = async (payload) => {
    try {
      const res = await adminClient.patch(`/food/admin/addon-types/${payload._id}`, payload);
      if (res?.data?.success) {
        toast.success(`Add-on type '${payload.name}' updated successfully`);
        await fetchTypes();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update addon type");
    }
  };

  const handleDeleteType = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete add-on type '${name}'?`)) return;
    try {
      const res = await adminClient.delete(`/food/admin/addon-types/${id}`);
      if (res?.data?.success) {
        toast.success(`Add-on type '${name}' deleted successfully`);
        await fetchTypes();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete addon type");
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

  // Overall KPI Calculations
  const stats = useMemo(() => {
    const total = addons.length;
    const active = addons.filter((a) => (a.status || "").toLowerCase() === "active").length;
    const inactive = addons.filter((a) => (a.status || "").toLowerCase() === "inactive").length;

    let totalPriceSum = 0;
    let priceCount = 0;
    addons.forEach((a) => {
      if (a.prices && a.prices.length > 0) {
        totalPriceSum += Number(a.prices[0].price || 0);
        priceCount += 1;
      } else if (a.price) {
        totalPriceSum += Number(a.price || 0);
        priceCount += 1;
      }
    });
    const avg = priceCount > 0 ? (totalPriceSum / priceCount).toFixed(2) : "0.00";

    return {
      totalAddons: apiStats?.totalAddons ?? total,
      activeAddons: apiStats?.activeAddons ?? active,
      inactiveAddons: apiStats?.inactiveAddons ?? inactive,
      avgPrice: apiStats?.avgPrice ?? avg,
    };
  }, [addons, apiStats]);

  // Combined Interactive KPI Cards (All, Active, Inactive + Type categories)
  const typeCardsData = useMemo(() => {
    const totalCount = apiStats?.totalAddons ?? addons.length;
    const activeCount = apiStats?.activeAddons ?? addons.filter(a => (a.status || "").toLowerCase() === "active").length;
    const inactiveCount = apiStats?.inactiveAddons ?? addons.filter(a => (a.status || "").toLowerCase() === "inactive").length;
    const totalConnected = addons.reduce((sum, a) => sum + (a.connectedProductsCount || 0), 0);
    const activeConnected = addons.filter(a => (a.status || "").toLowerCase() === "active").reduce((sum, a) => sum + (a.connectedProductsCount || 0), 0);
    const inactiveConnected = addons.filter(a => (a.status || "").toLowerCase() === "inactive").reduce((sum, a) => sum + (a.connectedProductsCount || 0), 0);

    const cards = [
      {
        key: "all",
        filterKind: "all",
        type: "all",
        label: "All Add-ons",
        count: totalCount,
        activeCount: activeCount,
        connectedProductsCount: totalConnected,
        icon: Boxes,
        color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
        badge: "All Types",
      },
      {
        key: "active",
        filterKind: "status",
        statusValue: "Active",
        type: "active",
        label: "Active Add-ons",
        count: activeCount,
        activeCount: activeCount,
        connectedProductsCount: activeConnected,
        icon: CheckCircle,
        color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30",
        badge: "Live Active",
      },
      {
        key: "inactive",
        filterKind: "status",
        statusValue: "Inactive",
        type: "inactive",
        label: "Inactive Add-ons",
        count: inactiveCount,
        activeCount: 0,
        connectedProductsCount: inactiveConnected,
        icon: XCircle,
        color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
        badge: "Draft / Off",
      },
    ];

    // Group all loaded addons by normalized type, utilizing dynamic DB types
    const grouped = {};

    types.forEach((t) => {
      const normKey = normalizeAddonType(t.slug || t.name);
      const IconComponent = ICON_MAP[t.icon] || TYPE_META[normKey]?.icon || Tag;
      grouped[normKey] = {
        key: normKey,
        label: t.name,
        icon: IconComponent,
        color: t.color || TYPE_META[normKey]?.color || "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30",
        count: 0,
        activeCount: 0,
        connectedProductsCount: 0,
        sortOrder: t.sortOrder ?? 99,
      };
    });

    addons.forEach((item) => {
      const normKey = normalizeAddonType(item.type);
      const isActive = (item.status || "").toLowerCase() === "active";
      const connected = item.connectedProductsCount || 0;

      if (!grouped[normKey]) {
        const meta = TYPE_META[normKey] || {
          key: normKey,
          label: (item.type || normKey).charAt(0).toUpperCase() + (item.type || normKey).slice(1),
          icon: Tag,
          color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30",
        };
        grouped[normKey] = {
          key: normKey,
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          count: 0,
          activeCount: 0,
          connectedProductsCount: 0,
          sortOrder: 100,
        };
      }

      grouped[normKey].count += 1;
      if (isActive) grouped[normKey].activeCount += 1;
      grouped[normKey].connectedProductsCount += connected;
    });

    // Also merge any API stats if they exist
    if (apiStats?.types && Array.isArray(apiStats.types)) {
      apiStats.types.forEach((t) => {
        const normKey = normalizeAddonType(t.type);
        if (grouped[normKey] && grouped[normKey].count === 0 && t.count > 0) {
          grouped[normKey].count = t.count;
          grouped[normKey].activeCount = t.activeCount || 0;
          grouped[normKey].connectedProductsCount = t.connectedProductsCount || 0;
        }
      });
    }

    // Only include types that have real items (count > 0) - ELIMINATES EMPTY GHOST CARDS
    const activeTypes = Object.values(grouped).filter((g) => g.count > 0);

    activeTypes.sort((a, b) => {
      const ordA = a.sortOrder ?? 99;
      const ordB = b.sortOrder ?? 99;
      if (ordA !== ordB) return ordA - ordB;
      return a.label.localeCompare(b.label);
    });

    activeTypes.forEach((g) => {
      cards.push({
        key: g.key,
        filterKind: "type",
        type: g.key,
        label: g.label,
        count: g.count,
        activeCount: g.activeCount,
        connectedProductsCount: g.connectedProductsCount,
        icon: g.icon,
        color: g.color,
        badge: `${g.activeCount} Active`,
      });
    });

    return cards;
  }, [addons, apiStats, types]);

  // Process data (Filter + Sort)
  const processedAddons = useMemo(() => {
    return addons.filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesType = true;
      if (filterType) {
        const itemNorm = normalizeAddonType(item.type);
        const targetNorm = normalizeAddonType(filterType);
        matchesType = itemNorm === targetNorm;
      }

      const matchesStatus = filterStatus ? (item.status || "").toLowerCase() === filterStatus.toLowerCase() : true;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [addons, searchTerm, filterType, filterStatus]);

  const sortedAddons = useMemo(() => {
    return [...processedAddons].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "price") {
        aVal = a.prices && a.prices.length > 0 ? Number(a.prices[0].price) : Number(a.price || 0);
        bVal = b.prices && b.prices.length > 0 ? Number(b.prices[0].price) : Number(b.price || 0);
      } else if (sortConfig.key === "connectedProductsCount") {
        aVal = Number(a.connectedProductsCount || 0);
        bVal = Number(b.connectedProductsCount || 0);
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [processedAddons, sortConfig]);

  // API Handlers
  const handleSaveNewAddon = async (payload) => {
    try {
      const res = await adminClient.post("/food/admin/addons", payload);
      if (res?.data?.success) {
        toast.success("Add-on created successfully");
        fetchAddons();
        fetchStats();
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
        fetchStats();
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
        fetchStats();
      }
    } catch (err) {
      toast.error("Failed to delete addon");
    }
  };

  const handleEditClick = (addon) => {
    setSelectedAddon(addon);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (addon) => {
    setViewAddonId(addon._id);
    setViewAddonData(addon);
    setIsViewModalOpen(true);
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
            Configure extra side options, custom toppings, dips, and crust varieties.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => {
              fetchAddons();
              fetchStats();
            }}
            disabled={loading || statsLoading}
            className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh Add-ons & Stats"
          >
            <RefreshCw size={14} className={loading || statsLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-[11px] shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Add New Add-on
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs (Types first, then Add-ons) */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("types")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
            activeTab === "types"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <Layers size={14} />
          <span>Types</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "types"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {types.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("addons")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
            activeTab === "addons"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <Boxes size={14} />
          <span>Add-ons</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "addons"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {addons.length}
          </span>
        </button>
      </div>

      {activeTab === "types" ? (
        <AddonTypesTab
          types={types}
          loading={typesLoading}
          onRefresh={fetchTypes}
          onCreateType={handleCreateType}
          onUpdateType={handleUpdateType}
          onDeleteType={handleDeleteType}
        />
      ) : (
        <>
          {/* Interactive KPI & Type Cards Grid */}
          <section className="space-y-2 select-none">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <Layers size={13} className="text-[var(--primary)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Live Add-on & Type KPI Cards
                </h2>
                <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                  (Live count • Click to filter table)
                </span>
              </div>
              {(filterType || filterStatus) && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Clear filter ({filterType || filterStatus})
                  <RotateCcw size={10} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {typeCardsData.map((card) => {
                const Icon = card.icon;
                const isSelected =
                  (card.filterKind === "all" && !filterType && !filterStatus) ||
                  (card.filterKind === "status" && filterStatus.toLowerCase() === (card.statusValue || "").toLowerCase()) ||
                  (card.filterKind === "type" && !filterStatus && filterType.toLowerCase() === card.key.toLowerCase());

                return (
                  <div
                    key={card.key}
                    onClick={() => {
                      if (card.filterKind === "all") {
                        setFilterType("");
                        setFilterStatus("");
                      } else if (card.filterKind === "status") {
                        if (filterStatus.toLowerCase() === (card.statusValue || "").toLowerCase()) {
                          setFilterStatus("");
                        } else {
                          setFilterStatus(card.statusValue);
                          setFilterType("");
                        }
                      } else {
                        if (filterType.toLowerCase() === card.key.toLowerCase()) {
                          setFilterType("");
                        } else {
                          setFilterType(card.key);
                          setFilterStatus("");
                        }
                      }
                    }}
                    className={`bg-white dark:bg-zinc-900 border p-3 rounded-xl flex flex-col justify-between transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden ${
                      isSelected
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30 bg-orange-50/40 dark:bg-orange-950/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                    title={`Click to filter table by ${card.label}`}
                  >
                    {/* Active indicator bar */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--primary)]" />
                    )}

                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                        {card.label}
                      </span>
                      <div className={`p-1.5 rounded-lg border ${card.color} shrink-0`}>
                        <Icon size={14} className="stroke-[2.5]" />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mt-3 flex-wrap gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-black dark:text-white leading-none">
                          {card.count}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold">
                          {card.count === 1 ? "type" : "items"}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isSelected
                            ? "bg-[var(--primary)] text-white shadow-xs"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {isSelected && <Check size={9} className="stroke-[3]" />}
                        {card.badge}
                      </span>
                    </div>

                    {/* Connected to Products indicator */}
                    <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-medium">In Products:</span>
                      <span className={`font-bold ${card.connectedProductsCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"}`}>
                        {card.connectedProductsCount || 0} {card.connectedProductsCount === 1 ? "Product" : "Products"}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    showFilters
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-650 dark:text-zinc-350"
                  }`}
                >
                  <Filter size={12} />
                  Filters
                  {filterType && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[var(--primary)] inline-block" />}
                </button>
                <button
                  onClick={handleResetFilters}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
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
                    <option value="">All Types ({stats.totalAddons})</option>
                    {types.length > 0
                      ? types.map((t) => {
                          const normKey = normalizeAddonType(t.slug || t.name);
                          const cardMatch = typeCardsData.find((c) => c.key === normKey);
                          const count = cardMatch ? cardMatch.count : 0;
                          return (
                            <option key={t._id || t.slug} value={normKey}>
                              {t.name} ({count})
                            </option>
                          );
                        })
                      : typeCardsData
                          .filter((c) => c.filterKind === "type")
                          .map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label} ({c.count})
                            </option>
                          ))}
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
              onView={handleViewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteAddon}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
        </>
      )}

      {/* Modals */}
      <AddAddonsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewAddon}
        typesList={types}
      />

      <EditAddonsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        addonData={selectedAddon}
        onSave={handleSaveEditAddon}
        typesList={types}
      />

      <AddonsDetails
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewAddonId(null);
          setViewAddonData(null);
        }}
        addonId={viewAddonId}
        initialData={viewAddonData}
        onEdit={(addon) => {
          setIsViewModalOpen(false);
          handleEditClick(addon);
        }}
      />
    </div>
  );
}
