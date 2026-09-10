import React, { useState, useEffect } from "react";
import { X, Building2, BarChart2, MapPin, ChevronRight, ChevronDown, Award, Store, ShoppingBag, Loader2 } from "lucide-react";
import apiClient from "../../../../../../services/api/axios";

export default function RegionDetailsDrawer({ isOpen, onClose, region, onEdit }) {
  const [activeTab, setActiveTab] = useState("Info");
  const [expandedZones, setExpandedZones] = useState({});
  const [fetchedRegion, setFetchedRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && region?.id) {
      const fetchRegion = async () => {
        setIsLoading(true);
        try {
          const res = await apiClient.get(`/food/admin/regions/${region.id}`);
          setFetchedRegion(res.data.data);
        } catch (error) {
          console.error("Failed to fetch region details", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRegion();
    } else {
      setFetchedRegion(null);
      setActiveTab("Info");
    }
  }, [isOpen, region]);

  if (!isOpen || !region) return null;

  const displayData = fetchedRegion || region;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-900 shadow-2xl flex flex-col h-full animate-slideIn">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20">
              <Building2 size={15} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Region Details</h3>
              <p className="text-[10px] font-bold text-black/60 dark:text-zinc-400 mt-0.5">{displayData.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>



        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <p className="text-xs font-bold text-zinc-500 mt-2">Loading data...</p>
            </div>
          ) : null}

          <div className="space-y-4">
            {/* Basic Information */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-black/55 dark:text-zinc-400 uppercase tracking-wider">Basic Information</h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-900 rounded-xl text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 block uppercase">Region Name</span>
                    <span className="font-bold text-black dark:text-zinc-100">{displayData.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 block uppercase">Country</span>
                    <span className="font-bold text-black dark:text-zinc-100">{displayData.country}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-[9px] font-bold text-zinc-500 block uppercase">Description</span>
                    <p className="text-[11px] font-semibold text-black/80 dark:text-zinc-300 leading-relaxed">
                      {displayData.description || "No description provided for this region."}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-[9px] font-bold text-zinc-500 block uppercase">Created Date</span>
                    <span className="font-bold text-black dark:text-zinc-100">{displayData.createdDate || "2026-01-01"}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-[9px] font-bold text-zinc-500 block uppercase">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      displayData.status === "Active" 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {displayData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Summary */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-black/55 dark:text-zinc-400 uppercase tracking-wider">Operational Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase">Zones</span>
                      <p className="text-lg font-black text-black dark:text-zinc-100 mt-0.5">{displayData.zonesCount || 0}</p>
                    </div>
                    <Building2 className="text-zinc-400" size={16} />
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase">Franchises</span>
                      <p className="text-lg font-black text-black dark:text-zinc-100 mt-0.5">{displayData.franchisesCount || 0}</p>
                    </div>
                    <Award className="text-zinc-400" size={16} />
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase">Stores</span>
                      <p className="text-lg font-black text-black dark:text-zinc-100 mt-0.5">{displayData.storesCount || 0}</p>
                    </div>
                    <Store className="text-zinc-400" size={16} />
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 grid grid-cols-1 gap-3 shrink-0 select-none">
          <button
            onClick={() => onEdit(displayData)}
            className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all cursor-pointer text-center"
          >
            Edit Region
          </button>
        </div>
      </aside>
    </>
  );
}
