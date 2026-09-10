import React, { useState } from "react";
import {
  X,
  Star,
  Leaf,
  CheckCircle,
  PlusCircle,
  Check,
  Clock,
  Activity,
  User,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  Tag,
  AlertTriangle,
  Flame,
  Info
} from "lucide-react";

export default function ProductsDetail({ isOpen, onClose, product }) {
  const [activeTab, setActiveTab] = useState("Basic Info");

  if (!isOpen || !product) return null;

  const tabs = [
    "Basic Info",
    "Pricing & Variants",
    "Customization",
    "Store Availability",
    "Audit Timeline"
  ];

  // Helper dietary badges
  const isVeg = product.vegType !== "non-veg"; // Papa Veg Pizza default veg

  // Mocked details matching MongoDB collection structure
  const detailedProduct = {
    shortDescription: "Delightful fusion of tandoori spices and soft cottage cheese.",
    description: "Our signature pizza featuring premium hand-stretched crust, creamy tikka marinade, freshly diced paneer blocks, red onions, crisp capsicum, mozzarella, and sprinkled seasoning.",
    tags: ["Best Seller", "Tandoori Spice", "Cottage Cheese", "Chef Special"],
    displayOrder: 1,
    calories: product.calories || 340,
    preparationTime: product.preparationTime || 15,
    taxCategory: "GST 5%",
    availability: "all",
    createdBy: "Admin Shubh",
    createdAt: "12 May 2026, 11:20 AM",
    updatedAt: "14 Jun 2026, 04:30 PM",
    variants: [
      { name: "Regular", size: "7 inch", price: "₹249", weight: "280g", serving: "1-2 Servings", sku: `${product.id}-REG`, barcode: "8901234001", status: "Active" },
      { name: "Medium", size: "10 inch", price: product.price || "₹399", weight: "450g", serving: "2-3 Servings", sku: `${product.id}-MED`, barcode: "8901234002", status: "Active" },
      { name: "Large", size: "12 inch", price: "₹599", weight: "680g", serving: "4-5 Servings", sku: `${product.id}-LRG`, barcode: "8901234003", status: "Active" }
    ],
    customization: {
      allowToppings: true,
      allowCrust: true,
      allowCheese: true,
      allowSauce: true,
      allowHalfAndHalf: false,
      maxAddons: 5
    },
    auditLogs: [
      { action: "Product Created", user: "Admin Shubh", date: "12 May 2026, 11:20 AM", notes: "Initial catalog entry" },
      { action: "Price Adjustment", user: "Admin Shubh", date: "24 May 2026, 02:15 PM", notes: "Updated Regular pricing (+₹20)" },
      { action: "Availability Update", user: "Manager Amit", date: "02 Jun 2026, 09:10 AM", notes: "Assigned to Indore Scheme 54 store" },
      { action: "Metadata Update", user: "Admin Shubh", date: "14 Jun 2026, 04:30 PM", notes: "Modified tags and added short description" }
    ],
    ...product
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      {/* Drawer */}
      <div className="w-full md:w-[540px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-955 z-10">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[300px]">
                {detailedProduct.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                detailedProduct.status === "Active" || detailedProduct.status === "In Stock"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-450"
                  : detailedProduct.status === "Low Stock"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-905/30 dark:text-orange-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {detailedProduct.status}
              </span>
            </div>
            <span className="text-zinc-500 text-[10px] mt-0.5 font-mono">
              SKU: {detailedProduct.id}
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

        {/* Drawer scroll content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
          
          {/* TAB 1: Basic Information */}
          {activeTab === "Basic Info" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Product Hero Banner */}
              <div className="relative h-44 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-inner">
                <img
                  className="w-full h-full object-cover"
                  src={detailedProduct.image}
                  alt={detailedProduct.name}
                />
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm bg-white shrink-0 ${isVeg ? "border-green-600" : "border-red-600"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {isVeg ? "Veg" : "Non-Veg"}
                  </span>
                </div>
              </div>

              {/* Main Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Category</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-150 mt-1 block">
                    {detailedProduct.category}
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Prep Time</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-150 mt-1 block flex items-center gap-1">
                    <Clock size={12} className="text-[var(--primary)]" />
                    {detailedProduct.preparationTime} mins
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Calories</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-150 mt-1 block flex items-center gap-1">
                    <Flame size={12} className="text-orange-500" />
                    {detailedProduct.calories} kcal
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Tax category</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-150 mt-1 block">
                    {detailedProduct.taxCategory}
                  </span>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">Short Description</h4>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                    {detailedProduct.shortDescription}
                  </p>
                </div>
                
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">Long Description</h4>
                  <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed">
                    {detailedProduct.description}
                  </p>
                </div>
              </div>

              {/* Tags and Display order */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag size={10} /> Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {detailedProduct.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-150 dark:border-zinc-800 sm:w-36 text-center flex flex-col justify-center">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">Display Order</h4>
                  <p className="text-lg font-black text-[var(--primary)]">{detailedProduct.displayOrder}</p>
                </div>
              </div>

              {/* Creation details footer inside Drawer */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850 text-[10px] text-zinc-500 font-semibold">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>Created by: {detailedProduct.createdBy}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Calendar size={12} />
                  <span>Created: {detailedProduct.createdAt}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Pricing and Variants */}
          {activeTab === "Pricing & Variants" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="p-3 bg-[var(--primary)]/5 border border-[var(--primary)]/15 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Variant-Based Pricing Strategy</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Base Price: <span className="font-bold text-[var(--primary)]">₹249.00</span></p>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/15 uppercase">
                  Multi-size Enabled
                </span>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Size</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Weight</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Serving</th>
                      <th className="px-3 py-2 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Price</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-medium">
                    {detailedProduct.variants.map((v, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-black dark:text-white block">{v.name}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold">{v.size}</span>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-650 dark:text-zinc-350">{v.weight}</td>
                        <td className="px-3 py-2.5 text-zinc-500 text-[10px]">{v.serving}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-[var(--primary)]">{v.price}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-[9px] text-zinc-500">{v.sku}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: Customization */}
          {activeTab === "Customization" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries({
                  allowToppings: "Allow Custom Toppings",
                  allowCrust: "Allow Crust Customization",
                  allowCheese: "Allow Extra Cheese Trigger",
                  allowSauce: "Allow Sauce Customization",
                  allowHalfAndHalf: "Allow Half & Half Selection"
                }).map(([key, label]) => (
                  <div key={key} className="flex justify-between items-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${detailedProduct.customization[key] ? "bg-emerald-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                  </div>
                ))}
                
                <div className="flex justify-between items-center p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 bg-[var(--primary)]/5">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Maximum Add-ons Cap</span>
                  <span className="text-sm font-black text-[var(--primary)]">{detailedProduct.customization.maxAddons} items</span>
                </div>
              </div>

              {/* Toppings pricing preview */}
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Configured Toppings & Pricing</h4>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2 text-xs font-semibold">
                  <div className="flex justify-between items-center p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-700 dark:text-zinc-300">Extra Cheese</span>
                    <span className="text-[var(--primary)] font-bold">+₹120</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-700 dark:text-zinc-300">Paneer Tikka Cubes</span>
                    <span className="text-[var(--primary)] font-bold">+₹95</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-700 dark:text-zinc-300">Golden Corn</span>
                    <span className="text-[var(--primary)] font-bold">+₹65</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-700 dark:text-zinc-300">Capsicum & Onion Mix</span>
                    <span className="text-[var(--primary)] font-bold">+₹50</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Store Availability */}
          {activeTab === "Store Availability" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Global Coverage Status</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Assigned at Franchise level</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded border border-emerald-500/15">
                  AVAILABLE AT 24 STORES
                </span>
              </div>

              {/* Franchise mappings logs */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Assigned Regions & Franchises:</h4>
                <div className="space-y-2">
                  {[
                    { name: "Indore Central (HQ)", region: "Madhya Pradesh", stores: 8, status: "Active" },
                    { name: "Bhopal Zone", region: "Madhya Pradesh", stores: 10, status: "Active" },
                    { name: "Ujjain Branch", region: "Madhya Pradesh", stores: 6, status: "Active" }
                  ].map((store, i) => (
                    <div key={i} className="p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-55 hover:bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-150 dark:border-zinc-700">
                          <MapPin size={14} className="text-[var(--primary)]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{store.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Region: {store.region} • {store.stores} stores</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        {store.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: Audit Timeline */}
          {activeTab === "Audit Timeline" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3.5 pl-6 space-y-5 py-2">
                {detailedProduct.auditLogs.map((log, i) => (
                  <div key={i} className="relative group">
                    {/* Circle timeline item indicator */}
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

        {/* Drawer Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center sticky bottom-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Last update: {detailedProduct.updatedAt}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
