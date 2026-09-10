import React, { useMemo } from "react";
import { Drawer, Progress, Tag, Card } from "antd";
import { 
  Calendar, Layers, Clock, Eye, Smartphone, Tv, 
  ArrowUpRight, Award, Link2, Info
} from "lucide-react";

export default function PreviewBannerDrawer({ visible, onClose, banner, stores = [], products = [], categories = [], coupons = [], campaigns = [] }) {
  
  // Find Redirection targets
  const redirectDetail = useMemo(() => {
    if (!banner) return { name: "N/A", details: "" };
    const id = banner.redirectId;
    switch (banner.redirectType) {
      case "product": {
        const item = products.find(p => p._id === id);
        return { name: item ? item.name : "Unknown Pizza", details: "🍕 Product details page" };
      }
      case "category": {
        const item = categories.find(c => c._id === id);
        return { name: item ? item.name : "Unknown Category", details: "📁 Category listing" };
      }
      case "coupon": {
        const item = coupons.find(c => c._id === id);
        return { name: item ? item.code : "Unknown Coupon", details: "🎟️ Coupon discount code" };
      }
      case "campaign": {
        const item = campaigns.find(c => c._id === id);
        return { name: item ? item.campaignName : "Unknown Campaign", details: "📢 Marketing campaign page" };
      }
      default:
        return { name: "N/A", details: "" };
    }
  }, [banner, products, categories, coupons, campaigns]);

  // Find store names
  const storeNames = useMemo(() => {
    if (!banner || !banner.stores || banner.stores.length === 0) return [];
    return banner.stores.map(id => {
      const st = stores.find(s => s._id === id);
      return st ? (st.name || st.storeName) : "Unknown Outlet";
    });
  }, [banner, stores]);

  // Priority Label helper
  const getPriorityBadge = (val) => {
    if (val <= 3) return <Tag color="red" className="font-extrabold uppercase text-[8px] px-2 py-0.5 rounded border-0">High Priority (Rank {val})</Tag>;
    if (val <= 7) return <Tag color="orange" className="font-extrabold uppercase text-[8px] px-2 py-0.5 rounded border-0">Medium Priority (Rank {val})</Tag>;
    return <Tag color="blue" className="font-extrabold uppercase text-[8px] px-2 py-0.5 rounded border-0">Low Priority (Rank {val})</Tag>;
  };

  // Status Badge helper
  const getStatusTag = (status, endDate, startDate) => {
    const now = new Date();
    if (new Date(endDate) < now) {
      return <Tag color="red" className="font-extrabold uppercase text-[8px] px-2 py-0.5 rounded border-0">Expired</Tag>;
    }
    if (new Date(startDate) > now) {
      return <Tag color="blue" className="font-extrabold uppercase text-[8px] px-2 py-0.5 rounded border-0">Scheduled</Tag>;
    }
    if (status === "active") {
      return <Tag color="green" className="font-extrabold uppercase text-[8px] px-2 py-0.5 rounded border-0 animate-pulse">Active</Tag>;
    }
    return <Tag color="default" className="font-extrabold uppercase text-[8px] px-2 py-0.5 rounded border-0">Inactive</Tag>;
  };

  // Active Schedule calculations
  const scheduleStats = useMemo(() => {
    if (!banner) return { totalDays: 0, elapsed: 0, remaining: 0, percent: 0 };
    const start = new Date(banner.startDate);
    const end = new Date(banner.endDate);
    const now = new Date();

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    let remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    remaining = Math.max(0, remaining);

    const elapsed = Math.max(0, totalDays - remaining);
    const percent = Math.round((elapsed / totalDays) * 100);

    return { totalDays, elapsed, remaining, percent };
  }, [banner]);

  if (!banner) return null;

  return (
    <Drawer
      title={
        <div className="flex justify-between items-center w-full pr-6 font-['Poppins']">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Promotional Banner Preview
            </span>
          </div>
          {getStatusTag(banner.status, banner.endDate, banner.startDate)}
        </div>
      }
      placement="right"
      width={700}
      onClose={onClose}
      open={visible}
      destroyOnClose
      bodyStyle={{ padding: "16px", backgroundColor: "#f8fafc" }}
      className="dark:bg-zinc-900 dark:text-zinc-100 font-['Poppins']"
    >
      <div className="space-y-4 text-xs font-['Poppins'] pb-8">
        
        {/* SECTION 1: DESKTOP BANNER */}
        <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden"
          title={
            <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
              <Tv size={13} /> Desktop Banner Preview
            </span>
          }
        >
          {banner.imageUrl ? (
            <div className="w-full relative rounded-lg border border-zinc-100 dark:border-zinc-900 overflow-hidden bg-zinc-50">
              <img 
                src={banner.imageUrl} 
                alt="Desktop banner preview" 
                className="w-full h-auto max-h-[220px] object-cover block"
              />
            </div>
          ) : (
            <div className="w-full h-[150px] bg-zinc-100 dark:bg-zinc-850 rounded-lg flex items-center justify-center text-zinc-400">
              No Desktop Banner Image Available
            </div>
          )}
        </Card>

        {/* SECTION 2: MOBILE BANNER (PHONE FRAME) */}
        <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden"
          title={
            <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
              <Smartphone size={13} /> Mobile Banner Preview
            </span>
          }
        >
          <div className="flex justify-center py-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
            {/* Phone Mockup Frame */}
            <div className="w-[280px] h-[480px] border-[8px] border-zinc-900 dark:border-zinc-800 rounded-[32px] bg-white dark:bg-zinc-950 shadow-lg relative overflow-hidden flex flex-col">
              {/* Ear Speaker / Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-900 rounded-b-xl z-20 flex items-center justify-center">
                <span className="w-10 h-1 bg-zinc-700 rounded-full"></span>
              </div>
              
              {/* Screen Content Mockup */}
              <div className="w-full h-full pt-6 px-3 flex flex-col gap-4 overflow-y-auto scrollbar-none text-[10px]">
                {/* Simulated App Header */}
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900">
                  <span className="font-black text-[var(--primary)] uppercase text-[9px]">Papa Veg Pizza</span>
                  <span className="text-[8px] text-zinc-400">Indore 📍</span>
                </div>

                {/* Mobile Image container */}
                {banner.mobileImageUrl ? (
                  <div className="w-full rounded-xl border border-zinc-100 dark:border-zinc-900 overflow-hidden bg-zinc-50 shrink-0 shadow-xs relative">
                    <img 
                      src={banner.mobileImageUrl} 
                      alt="Mobile Banner Preview" 
                      className="w-full h-auto max-h-[140px] object-cover block"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs p-1.5 rounded-lg text-white">
                      <h4 className="font-extrabold text-[8px] leading-tight truncate">{banner.title}</h4>
                      <p className="text-[6.5px] opacity-80 truncate">{banner.subtitle}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[120px] bg-zinc-150 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                    No Mobile Image
                  </div>
                )}

                {/* Other simulated components */}
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded-md w-1/3"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex flex-col justify-end p-1">
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                    </div>
                    <div className="h-16 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex flex-col justify-end p-1">
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 3: BANNER INFORMATION */}
        <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                {banner.title}
              </h2>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-0.5 leading-relaxed">
                {banner.subtitle || "No subtitle provided for this banner."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3.5 border-t border-zinc-150 dark:border-zinc-800 text-[10px]">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col gap-1">
                <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Display Priority</span>
                <div className="mt-0.5">{getPriorityBadge(banner.priority)}</div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col gap-1">
                <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Created By</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{banner.createdBy || "Admin"}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col gap-1">
                <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Created At</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {new Date(banner.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 4: REDIRECT DETAILS */}
        <Card 
          size="small" 
          title={
            <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
              <Link2 size={13} className="text-[var(--primary)]" /> Redirection Configuration
            </span>
          }
          className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-1">
              <span className="block text-[8px] font-black text-zinc-400 uppercase">Redirect Event</span>
              <span className="text-xs font-black text-slate-805 dark:text-zinc-200 capitalize">{banner.redirectType}</span>
              <span className="block text-[9.5px] text-zinc-450 font-semibold">{redirectDetail.details}</span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-1">
              <span className="block text-[8px] font-black text-zinc-400 uppercase">Redirection Target</span>
              <span className="text-xs font-black text-[var(--primary)] flex items-center gap-1">
                {redirectDetail.name}
                <ArrowUpRight size={12} />
              </span>
              <span className="block text-[8px] font-mono text-zinc-400 truncate">ID: {banner.redirectId}</span>
            </div>
          </div>
        </Card>

        {/* SECTION 5: STORES LIST */}
        <Card 
          size="small" 
          title={
            <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
              <Layers size={13} /> Active Store Assignment
            </span>
          }
          className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
        >
          <div className="flex flex-wrap gap-1">
            {storeNames.length > 0 ? (
              storeNames.map((name, i) => (
                <span key={i} className="bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-650 dark:text-zinc-350">
                  {name}
                </span>
              ))
            ) : (
              <span className="text-[9.5px] text-zinc-450 italic font-semibold">Global Visibility (All Franchises)</span>
            )}
          </div>
        </Card>

        {/* SECTION 6: ACTIVE DURATION */}
        <Card 
          size="small" 
          title={
            <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
              <Calendar size={13} /> Campaign Schedule Timeline
            </span>
          }
          className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 text-[10px] text-zinc-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-zinc-400" />
                <span>Start: {new Date(banner.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-zinc-400" />
                <span>End: {new Date(banner.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-extrabold text-zinc-500">Validity Progress</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {scheduleStats.remaining > 0 ? `${scheduleStats.remaining} Days Remaining` : "Campaign Validity Concluded"}
                </span>
              </div>
              <Progress 
                percent={scheduleStats.percent} 
                strokeColor="var(--primary)" 
                size="small" 
                showInfo={false}
                className="m-0"
              />
              <div className="flex justify-between text-[7.5px] font-black text-zinc-400 uppercase tracking-wider">
                <span>{scheduleStats.elapsed} Days Elapsed</span>
                <span>Total Span: {scheduleStats.totalDays} Days</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Drawer>
  );
}
