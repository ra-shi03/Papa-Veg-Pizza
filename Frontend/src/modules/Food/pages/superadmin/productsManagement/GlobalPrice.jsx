import React, { useState } from "react";
import { Plus, CheckCircle, AlertTriangle, RefreshCw, X, DollarSign, Percent, TrendingUp, Calendar, Tag } from "lucide-react";
import GlobalPriceData from "./GlobalPriceData";
import GlobalPriceDetail from "./GlobalPriceDetail";
import CreateUpdatePricingModal from "./CreateUpdatePricingModal";
import DuplicatePricingModal from "./DuplicatePricingModal";
import DeletePricingModal from "./DeletePricingModal";
import BulkPriceUpdateModal from "./BulkPriceUpdateModal";
import PriceHistoryModal from "./PriceHistoryModal";

export default function GlobalPrice() {
  const [alert, setAlert] = useState(null);

  // Modal target rules
  const [selectedRule, setSelectedRule] = useState(null);
  
  // Drawer / Modals visibility states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add", "edit"
  
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Mock catalog products corresponding to ProductsData
  const productsList = [
    { id: "PP-V-001", name: "Paneer Tikka Supreme", category: "Signature Pizzas", price: "₹399", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80" },
    { id: "PP-V-002", name: "Veg Supreme Delight", category: "Classic Pizzas", price: "₹299", image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=100&q=80" },
    { id: "PP-V-003", name: "Tandoori Veggie Blast", category: "Signature Pizzas", price: "₹449", image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?fm=webp&fit=crop&w=100&q=80" },
    { id: "PP-V-004", name: "Cheese Burst Margherita", category: "Classic Pizzas", price: "₹349", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?fm=webp&fit=crop&w=100&q=80" },
    { id: "PP-V-005", name: "Spicy Capsicum & Corn", category: "Classic Pizzas", price: "₹249", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?fm=webp&fit=crop&w=100&q=80" },
    { id: "PP-V-006", name: "Garlic Breadsticks", category: "Sides & Bread", price: "₹149", image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=100&q=80" },
    { id: "PP-V-007", name: "Chocolate Lava Cake", category: "Desserts & Sweets", price: "₹99", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?fm=webp&fit=crop&w=100&q=80" },
    { id: "PP-V-008", name: "Cold Pepsi 500ml", category: "Beverages", price: "₹60", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?fm=webp&fit=crop&w=100&q=80" }
  ];

  // Pricing rules master list mapped to MongoDB collection schema
  const [pricingRules, setPricingRules] = useState([
    {
      id: "PR-001",
      productId: "PP-V-001",
      productName: "Paneer Tikka Supreme",
      category: "Signature Pizzas",
      variant: "Medium",
      basePrice: 399,
      effectivePrice: 379,
      currency: "INR",
      regionId: "Central India",
      zoneId: "Madhya Pradesh",
      territoryId: "Indore",
      franchiseId: "Indore Central",
      storeId: "Vijay Nagar",
      validFrom: "2026-06-01 10:00 AM",
      validTo: "2026-06-30 11:59 PM",
      status: "active",
      lastUpdated: "14 Jun 2026",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80"
    },
    {
      id: "PR-002",
      productId: "PP-V-002",
      productName: "Veg Supreme Delight",
      category: "Classic Pizzas",
      variant: "Large",
      basePrice: 299,
      effectivePrice: 279,
      currency: "INR",
      regionId: "West India",
      zoneId: "Maharashtra",
      territoryId: "Mumbai",
      franchiseId: "Mumbai Premium",
      storeId: "Bandra West",
      validFrom: "2026-06-10 12:00 PM",
      validTo: "2026-07-15 12:00 PM",
      status: "active",
      lastUpdated: "12 Jun 2026",
      image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=100&q=80"
    },
    {
      id: "PR-003",
      productId: "PP-V-004",
      productName: "Cheese Burst Margherita",
      category: "Classic Pizzas",
      variant: "Regular",
      basePrice: 349,
      effectivePrice: 329,
      currency: "INR",
      regionId: "",
      zoneId: "",
      territoryId: "",
      franchiseId: "",
      storeId: "",
      validFrom: "2026-07-01 09:00 AM",
      validTo: "2026-08-31 09:00 AM",
      status: "scheduled",
      lastUpdated: "15 Jun 2026",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?fm=webp&fit=crop&w=100&q=80"
    },
    {
      id: "PR-004",
      productId: "PP-V-007",
      productName: "Chocolate Lava Cake",
      category: "Desserts & Sweets",
      variant: "Regular",
      basePrice: 99,
      effectivePrice: 79,
      currency: "INR",
      regionId: "North India",
      zoneId: "Delhi NCR",
      territoryId: "Delhi",
      franchiseId: "Delhi Express",
      storeId: "CP Market",
      validFrom: "2026-05-01 08:00 AM",
      validTo: "2026-05-31 10:00 PM",
      status: "expired",
      lastUpdated: "08 May 2026",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?fm=webp&fit=crop&w=100&q=80"
    }
  ]);

  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 8,
    customPrices: 3,
    activeRules: 2,
    scheduledRules: 1,
    expiredRules: 1,
    franchiseOverrides: 3,
    storeOverrides: 3,
    rulesExpiringSoon: 1
  });

  const triggerAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // KPI Bento stats mapping
  const kpis = [
    { title: "Total Products", val: stats.totalProducts, icon: Tag, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
    { title: "Custom Prices", val: stats.customPrices, icon: DollarSign, color: "text-amber-500 bg-amber-50 dark:bg-amber-955/20" },
    { title: "Active Rules", val: stats.activeRules, icon: CheckCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { title: "Scheduled Changes", val: stats.scheduledRules, icon: Calendar, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { title: "Expired Rules", val: stats.expiredRules, icon: AlertTriangle, color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40" },
    { title: "Franchise Overrides", val: stats.franchiseOverrides, icon: TrendingUp, color: "text-purple-500 bg-purple-50 dark:bg-purple-955/20" },
    { title: "Store Overrides", val: stats.storeOverrides, icon: Percent, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-955/20" },
    { title: "Expiring Soon", val: stats.rulesExpiringSoon, icon: AlertTriangle, color: "text-red-500 bg-red-50 dark:bg-red-955/20" }
  ];

  // Callbacks handlers
  const handleViewRule = (rule) => {
    setSelectedRule(rule);
    setIsDetailOpen(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleDuplicateRequest = (rule) => {
    setSelectedRule(rule);
    setIsDuplicateOpen(true);
  };

  const handleDeleteRequest = (rule) => {
    setSelectedRule(rule);
    setIsDeleteOpen(true);
  };

  const handleHistoryRequest = (rule) => {
    setSelectedRule(rule);
    setIsHistoryOpen(true);
  };

  const handleStatusChange = (rule, newStatus) => {
    setPricingRules(prev =>
      prev.map(item => item.id === rule.id ? { ...item, status: newStatus } : item)
    );
    triggerAlert(`Pricing rule status changed to ${newStatus}.`, "success");
    
    // Recalculate stats
    setStats(prev => {
      const isActChange = newStatus === "active" ? 1 : (rule.status === "active" ? -1 : 0);
      const isSchChange = newStatus === "scheduled" ? 1 : (rule.status === "scheduled" ? -1 : 0);
      const isExpChange = newStatus === "expired" ? 1 : (rule.status === "expired" ? -1 : 0);
      return {
        ...prev,
        activeRules: prev.activeRules + isActChange,
        scheduledRules: prev.scheduledRules + isSchChange,
        expiredRules: prev.expiredRules + isExpChange
      };
    });
  };

  const handleSaveRule = (payload, mode) => {
    const matchedProd = productsList.find(p => p.id === payload.productId);
    const productName = matchedProd ? matchedProd.name : "Custom Pizza";
    const image = matchedProd ? matchedProd.image : "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80";

    const formattedDate = (dtStr) => {
      if (!dtStr) return "Immediate / Permanent";
      const d = new Date(dtStr);
      return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    if (mode === "add") {
      const newRule = {
        id: `PR-${String(pricingRules.length + 1).padStart(3, "0")}`,
        ...payload,
        productName,
        image,
        validFrom: formattedDate(payload.validFrom),
        validTo: formattedDate(payload.validTo),
        lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
      };
      
      setPricingRules(prev => [newRule, ...prev]);
      triggerAlert(`Pricing rule published successfully for ${productName}.`, "success");
      
      setStats(prev => ({
        ...prev,
        customPrices: prev.customPrices + 1,
        activeRules: payload.status === "active" ? prev.activeRules + 1 : prev.activeRules,
        scheduledRules: payload.status === "scheduled" ? prev.scheduledRules + 1 : prev.scheduledRules,
        storeOverrides: payload.storeId ? prev.storeOverrides + 1 : prev.storeOverrides,
        franchiseOverrides: payload.franchiseId ? prev.franchiseOverrides + 1 : prev.franchiseOverrides
      }));
    } else {
      // Edit
      setPricingRules(prev =>
        prev.map(item => item.id === selectedRule.id ? {
          ...item,
          ...payload,
          productName,
          image,
          validFrom: formattedDate(payload.validFrom),
          validTo: formattedDate(payload.validTo),
          lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        } : item)
      );
      triggerAlert(`Pricing override configurations updated for ${productName}.`, "success");
    }
  };

  const handleConfirmDuplicate = (duplicateData) => {
    const matchedProd = productsList.find(p => p.id === duplicateData.targetProductId);
    const productName = matchedProd ? matchedProd.name : "Custom Pizza";
    const image = matchedProd ? matchedProd.image : "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80";

    const source = duplicateData.sourceRule;
    const newRule = {
      id: `PR-${String(pricingRules.length + 1).padStart(3, "0")}`,
      productId: duplicateData.targetProductId,
      productName,
      image,
      category: matchedProd ? matchedProd.category : source.category,
      variant: duplicateData.targetVariant,
      basePrice: duplicateData.copyPrices ? source.basePrice : (matchedProd ? parseFloat(matchedProd.price.replace(/[^\d.]/g, "")) : 0),
      effectivePrice: duplicateData.copyPrices ? source.effectivePrice : (matchedProd ? parseFloat(matchedProd.price.replace(/[^\d.]/g, "")) : 0),
      currency: source.currency,
      regionId: duplicateData.copyScope ? source.regionId : "",
      zoneId: duplicateData.copyScope ? source.zoneId : "",
      territoryId: duplicateData.copyScope ? source.territoryId : "",
      franchiseId: duplicateData.copyScope ? source.franchiseId : "",
      storeId: duplicateData.copyScope ? source.storeId : "",
      validFrom: duplicateData.copyDates ? source.validFrom : "Immediate / Permanent",
      validTo: duplicateData.copyDates ? source.validTo : "",
      status: "draft",
      lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    };

    setPricingRules(prev => [newRule, ...prev]);
    triggerAlert(`Duplicated Pricing Rule saved as Draft for ${productName}.`, "success");
  };

  const handleConfirmDelete = (rule, action) => {
    if (action === "archive") {
      handleStatusChange(rule, "archived");
    } else {
      setPricingRules(prev => prev.filter(item => item.id !== rule.id));
      triggerAlert(`Pricing override rule for ${rule.productName} deleted.`, "error");
      setStats(prev => ({
        ...prev,
        customPrices: prev.customPrices - 1,
        activeRules: rule.status === "active" ? prev.activeRules - 1 : prev.activeRules,
        scheduledRules: rule.status === "scheduled" ? prev.scheduledRules - 1 : prev.scheduledRules,
        storeOverrides: rule.storeId ? prev.storeOverrides - 1 : prev.storeOverrides,
        franchiseOverrides: rule.franchiseId ? prev.franchiseOverrides - 1 : prev.franchiseOverrides
      }));
    }
  };

  const handleBulkConfirm = (bulkData) => {
    // Modify existing matching pricing rules or display a batch update toast
    triggerAlert(`Bulk action applied successfully on ${bulkData.productIds.length} select items.`, "success");
  };

  const handleImportPrices = () => {
    triggerAlert("CSV Sheet price matrix catalog imported successfully.", "success");
  };

  const handleExportPrices = () => {
    triggerAlert("CSV Price Overrides spreadsheet generated and downloaded.", "success");
  };

  const refreshRules = () => {
    triggerAlert("POS system pricing resolution engines synchronized.", "success");
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4">
      {/* Toast Alerts Banner */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[90] p-3 rounded-lg border shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${
          alert.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-400 border-emerald-500/20"
            : alert.type === "warning"
            ? "bg-amber-50 dark:bg-amber-955/90 text-amber-800 dark:text-amber-450 border-amber-500/20"
            : "bg-rose-50 dark:bg-rose-955/90 text-rose-800 dark:text-rose-400 border-rose-500/20"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className={alert.type === "success" ? "text-emerald-500" : alert.type === "warning" ? "text-amber-500" : "text-rose-500"} />
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header and Breadcrumb Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2 select-none">
        <div className="space-y-0.5">
          <h1 className="text-base md:text-lg font-bold text-black dark:text-white leading-tight">
            Global Pricing Management
          </h1>
          <p className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
            Define hierarchical pricing overrides at Region, Zone, Franchise, and Store levels.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={refreshRules}
            className="p-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors shadow-sm cursor-pointer"
            title="Sync Channels"
          >
            <RefreshCw size={12} />
          </button>

          <button
            onClick={() => {
              setSelectedRule(null);
              setFormMode("add");
              setIsFormOpen(true);
            }}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Create Pricing Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 select-none">
        {kpis.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-lg flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1 rounded-md border ${card.color} shrink-0`}>
                  <Icon size={12} className="stroke-[2.5]" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm font-black text-black dark:text-white leading-none">
                  {card.val}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main pricing data rules grid */}
      <GlobalPriceData
        pricingRules={pricingRules}
        onViewRule={handleViewRule}
        onEditRule={handleEditRule}
        onDuplicateRule={handleDuplicateRequest}
        onStatusChange={handleStatusChange}
        onDeleteRule={handleDeleteRequest}
        onHistoryRule={handleHistoryRequest}
        onCreateRule={() => {
          setSelectedRule(null);
          setFormMode("add");
          setIsFormOpen(true);
        }}
        onBulkUpdate={() => setIsBulkOpen(true)}
        onImportPrices={handleImportPrices}
        onExportPrices={handleExportPrices}
      />

      {/* View Rule detail right-side drawer */}
      <GlobalPriceDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRule(null);
        }}
        rule={selectedRule}
      />

      {/* Create / Edit Rule full-screen drawer */}
      <CreateUpdatePricingModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRule(null);
        }}
        rule={selectedRule}
        productsList={productsList}
        onSave={handleSaveRule}
      />

      {/* Duplicate Pricing Rule Modal */}
      <DuplicatePricingModal
        isOpen={isDuplicateOpen}
        onClose={() => {
          setIsDuplicateOpen(false);
          setSelectedRule(null);
        }}
        rule={selectedRule}
        productsList={productsList}
        onConfirm={handleConfirmDuplicate}
      />

      {/* Delete / Archive Confirmation Modal */}
      <DeletePricingModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedRule(null);
        }}
        rule={selectedRule}
        onConfirm={handleConfirmDelete}
      />

      {/* Bulk Price update Modal */}
      <BulkPriceUpdateModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        productsList={productsList}
        onConfirm={handleBulkConfirm}
      />

      {/* Audit Logs history modal */}
      <PriceHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedRule(null);
        }}
        rule={selectedRule}
      />

    </div>
  );
}
