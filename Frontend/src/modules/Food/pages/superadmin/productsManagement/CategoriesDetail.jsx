import React, { useState } from "react";
import {
  X,
  FolderOpen,
  CornerDownRight,
  ExternalLink,
  TrendingUp,
  Clock,
  User,
  Calendar,
  Layers,
  Image as ImageIcon,
  Tag,
  Eye,
  Edit2
} from "lucide-react";

export default function CategoriesDetail({ isOpen, onClose, category, onEditClick }) {
  const [activeTab, setActiveTab] = useState("Basic Info");

  if (!isOpen || !category) return null;

  const tabs = [
    "Basic Info",
    "Hierarchy",
    "Linked Products",
    "Display Settings",
    "Audit Timeline"
  ];

  // Map category code prefixes to render visual hierarchy
  const parentCategoryLabel = category.parent && category.parent !== "—" ? category.parent : "Root Category";

  // Simulated detailed data matching MongoDB collection structure
  const detailedCategory = {
    icon: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=80&h=80&q=80",
    bannerImage: category.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=600&h=300&q=80",
    description: category.description || "Freshly baked delights organized for super admin menus.",
    metaTitle: `${category.name} | Papa Veg Pizza Catalog`,
    metaDescription: `Order delicious vegetarian ${category.name?.toLowerCase()} options fresh from the kitchen.`,
    metaKeywords: `Vegetarian, Pizza, Fresh, ${category.name}`,
    createdAt: "12 May 2026, 11:20 AM",
    updatedAt: category.lastUpdated || "14 Jun 2026, 04:30 PM",
    createdBy: "Admin Shubh",
    updatedBy: "Manager Amit",
    auditLogs: [
      { action: "Category Created", user: "Admin Shubh", date: "12 May 2026, 11:20 AM", notes: "Initial catalog category creation" },
      { action: "Metadata Update", user: "Admin Shubh", date: "28 May 2026, 02:15 PM", notes: "Updated SEO keywords and description" },
      { action: "Display Priority Changed", user: "Manager Amit", date: "14 Jun 2026, 04:30 PM", notes: "Shifted display priority from 5 to 1" }
    ],
    linkedProducts: [
      { name: "Paneer Tikka Supreme", sku: "PP-V-001", price: "₹399", status: "Active" },
      { name: "Veg Supreme Delight", sku: "PP-V-002", price: "₹299", status: "Active" },
      { name: "Tandoori Veggie Blast", sku: "PP-V-003", price: "₹449", status: "Active" }
    ],
    ...category
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      
      {/* Drawer Container */}
      <div className="w-full md:w-[540px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-955 z-10">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[280px]">
                {detailedCategory.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                detailedCategory.status === "Active"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {detailedCategory.status}
              </span>
            </div>
            <span className="text-zinc-500 text-[10px] mt-0.5 font-mono">
              Category ID: {detailedCategory.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-full transition-colors text-zinc-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Links */}
        <div className="px-4 flex items-center overflow-x-auto border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 scrollbar-none select-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab
                  ? "border-[var(--primary)] text-[var(--primary)] font-extrabold"
                  : "border-transparent text-zinc-500 hover:text-[var(--primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
          
          {/* TAB 1: Basic Info */}
          {activeTab === "Basic Info" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Category Cover Image */}
              <div className="relative h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-inner">
                <img
                  className="w-full h-full object-cover"
                  src={detailedCategory.bannerImage}
                  alt={detailedCategory.name}
                />
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm p-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0 border border-zinc-200">
                    <img src={detailedCategory.icon} alt="icon" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider px-1">
                    Category Icon
                  </span>
                </div>
              </div>

              {/* Main Metadata */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">URL Slug</span>
                  <span className="text-xs font-mono font-bold text-[var(--primary)] mt-1 block truncate">
                    /cat/{detailedCategory.name?.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Parent category</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-150 mt-1 block">
                    {parentCategoryLabel}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-150 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                  {detailedCategory.description}
                </p>
              </div>

              {/* SEO Metadata Group */}
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-lg p-3 space-y-2.5 bg-zinc-50/30">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b pb-1">SEO Details</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-455 text-[10px] font-bold block">SEO Title:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{detailedCategory.metaTitle}</span>
                  </div>
                  <div>
                    <span className="text-zinc-455 text-[10px] font-bold block">Meta Description:</span>
                    <span className="text-zinc-650 dark:text-zinc-400 leading-normal">{detailedCategory.metaDescription}</span>
                  </div>
                  <div>
                    <span className="text-zinc-455 text-[10px] font-bold block">Keywords:</span>
                    <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-600 dark:text-zinc-350">{detailedCategory.metaKeywords}</span>
                  </div>
                </div>
              </div>

              {/* Audit Details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850 text-[10px] text-zinc-500 font-semibold">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>Created by: {detailedCategory.createdBy}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Calendar size={12} />
                  <span>Created: {detailedCategory.createdAt}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Hierarchy */}
          {activeTab === "Hierarchy" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Visual Hierarchy Tree</label>
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <FolderOpen className="text-[var(--primary)]" size={18} />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Root Category Menu</span>
                </div>
                <div className="ml-5 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Layers className="text-[var(--primary)]" size={16} />
                    <span className="text-sm font-bold text-[var(--primary)]">{detailedCategory.name}</span>
                  </div>
                  <div className="ml-5 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <CornerDownRight className="text-zinc-400" size={14} />
                      <div className="bg-white dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg flex-1 shadow-sm flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Veg {detailedCategory.name} Selection</span>
                        <span className="text-[9px] font-black text-zinc-450 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{detailedCategory.productsCount} items</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Linked Products */}
          {activeTab === "Linked Products" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Linked Products List</label>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {detailedCategory.linkedProducts.length} Items Listed
                </span>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Product Name</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">SKU</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Base Price</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-medium">
                    {detailedCategory.linkedProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{p.name}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-500">{p.sku}</td>
                        <td className="px-3 py-2.5 text-right font-black text-zinc-900 dark:text-zinc-100">{p.price}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded text-[9px] uppercase font-bold">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Display Settings */}
          {activeTab === "Display Settings" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-150 dark:border-zinc-850">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">App Visibility Trigger</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle display status in customer app storefront</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/15 uppercase">
                  VISIBLE IN APP
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 text-center flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block">Display Priority</span>
                  <span className="text-xl font-black text-[var(--primary)] mt-1">{detailedCategory.sortOrder || 1}</span>
                  <p className="text-[8px] text-zinc-400 mt-1">Lowest priority numbers display first</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 text-center flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block">Featured Status</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">Home screen Priority</span>
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.2 rounded mt-1.5 self-center uppercase">
                    FEATURED
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: Audit Timeline */}
          {activeTab === "Audit Timeline" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="relative border-l border-zinc-200 dark:border-zinc-850 ml-3.5 pl-6 space-y-5 py-2">
                {detailedCategory.auditLogs.map((log, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[30px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950 bg-[var(--primary)] group-hover:scale-110 transition-transform shadow-sm" />
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-150 dark:border-zinc-800 hover:border-[var(--primary)]/30 hover:bg-white dark:hover:bg-zinc-900 transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {log.action}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-400">
                          {log.date}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-650 dark:text-zinc-350 font-semibold mt-1">
                        Triggered by: {log.user}
                      </p>
                      <p className="text-[10px] text-zinc-550 dark:text-zinc-400 italic mt-1 font-medium bg-white dark:bg-zinc-950/50 p-1.5 rounded border border-zinc-100 dark:border-zinc-850">
                        "{log.notes}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center sticky bottom-0">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            Last update: {detailedCategory.updatedAt}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEditClick?.(category)}
              className="px-3.5 py-1.5 bg-[var(--primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5"
            >
              <Edit2 size={12} />
              <span>Edit Category</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-950"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
