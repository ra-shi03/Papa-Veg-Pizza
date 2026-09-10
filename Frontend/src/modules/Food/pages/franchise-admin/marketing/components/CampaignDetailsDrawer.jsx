import React, { useState, useEffect } from "react";
import { Drawer, Skeleton, Card, Tabs, Progress, Tag } from "antd";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip as RechartsTooltip, BarChart, Bar 
} from "recharts";
import { 
  Calendar, Info, Users, Layers, Award, Clock, ArrowUpRight, 
  Eye, MousePointer, CheckSquare, ShoppingCart, DollarSign, Percent, TrendingUp 
} from "lucide-react";

export default function CampaignDetailsDrawer({ visible, onClose, campaignId, getCampaignPerformanceDetails, stores = [] }) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("impressions");

  useEffect(() => {
    if (campaignId && visible) {
      setLoading(true);
      getCampaignPerformanceDetails(campaignId)
        .then((data) => {
          setDetails(data);
        })
        .catch((err) => {
          console.error("Failed loading performance details", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [campaignId, visible, getCampaignPerformanceDetails]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getCampaignTypeTag = (type) => {
    switch (type) {
      case "festival":
        return <Tag color="purple" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Festival</Tag>;
      case "weekend_offer":
        return <Tag color="blue" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Weekend Offer</Tag>;
      case "combo_offer":
        return <Tag color="green" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Combo Offer</Tag>;
      case "flash_sale":
        return <Tag color="orange" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Flash Sale</Tag>;
      default:
        return <Tag className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">{type}</Tag>;
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "draft":
        return <Tag className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded bg-zinc-100 text-zinc-650">Draft</Tag>;
      case "active":
        return <Tag className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded bg-emerald-50 text-emerald-650 animate-pulse">Active</Tag>;
      case "paused":
        return <Tag className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded bg-amber-50 text-amber-650">Paused</Tag>;
      case "completed":
        return <Tag className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded bg-blue-50 text-blue-650">Completed</Tag>;
      default:
        return <Tag className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">{status}</Tag>;
    }
  };

  const getRoiColor = (roi) => {
    if (roi >= 40) return "#10b981"; // Green
    if (roi >= 20) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  const currentCamp = details?.campaign || details?.data?.campaign;
  const perf = details?.performance || details?.data?.performance;
  const chartData = perf?.dailyBreakdown || [];

  const storeNamesList = currentCamp?.stores?.map(id => {
    const st = stores.find(s => s._id === id);
    return st ? (st.name || st.storeName) : "Unknown Outlet";
  }) || [];

  return (
    <Drawer
      title={
        <div className="flex justify-between items-center w-full pr-6 font-['Poppins']">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Campaign Analytics Panel
            </span>
          </div>
          {currentCamp && getStatusTag(currentCamp.status)}
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
      {loading ? (
        <div className="space-y-6">
          <Skeleton active paragraph={{ rows: 3 }} />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton.Button active size="large" style={{ height: 80, width: "100%" }} />
            <Skeleton.Button active size="large" style={{ height: 80, width: "100%" }} />
            <Skeleton.Button active size="large" style={{ height: 80, width: "100%" }} />
          </div>
          <Skeleton.Avatar active size="large" style={{ height: 200, width: "100%" }} />
        </div>
      ) : details ? (
        <div className="space-y-4 text-xs font-['Poppins']">
          {/* SECTION 1: CAMPAIGN DETAILS */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                    {currentCamp?.campaignName}
                  </h2>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-0.5 leading-relaxed">
                    {currentCamp?.description || "No campaign description provided."}
                  </p>
                </div>
                <div className="shrink-0">
                  {getCampaignTypeTag(currentCamp?.campaignType)}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-900 text-[10px]">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col gap-1">
                  <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Allocated Budget</span>
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{formatCurrency(currentCamp?.budget)}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col gap-1">
                  <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Target Audience</span>
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 capitalize">{currentCamp?.targetAudience} Customers</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col gap-1">
                  <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Expected Reach</span>
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{currentCamp?.expectedReach?.toLocaleString("en-IN")} Reach</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col gap-1">
                  <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Created By</span>
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate" title={currentCamp?.createdBy}>{currentCamp?.createdBy}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] grid grid-cols-2 gap-2 text-zinc-500 font-semibold">
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-zinc-400" />
                  <span>Start: {currentCamp?.startDate ? new Date(currentCamp.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-zinc-400" />
                  <span>End: {currentCamp?.endDate ? new Date(currentCamp.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900">
                <span className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Applicable Store Outlets</span>
                <div className="flex flex-wrap gap-1">
                  {storeNamesList.length > 0 ? (
                    storeNamesList.map((name, i) => (
                      <span key={i} className="bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-650 dark:text-zinc-350">
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9.5px] text-zinc-450 italic font-semibold">Global (All Stores)</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 2: KPI CARDS */}
          <div className="grid grid-cols-3 gap-3">
            {/* Impressions */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Impressions</span>
                <h3 className="text-base font-black text-blue-600 mt-0.5">{perf?.impressions?.toLocaleString("en-IN") || 0}</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500">
                <Eye size={13} />
              </div>
            </div>

            {/* Clicks */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Clicks</span>
                <h3 className="text-base font-black text-amber-500 mt-0.5">{perf?.clicks?.toLocaleString("en-IN") || 0}</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                <MousePointer size={13} />
              </div>
            </div>

            {/* Conversions */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 p-3 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Conversions</span>
                <h3 className="text-base font-black text-purple-650 mt-0.5">{perf?.conversions?.toLocaleString("en-IN") || 0}</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-500">
                <CheckSquare size={13} />
              </div>
            </div>

            {/* Orders Generated */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Orders Gen.</span>
                <h3 className="text-base font-black text-emerald-600 mt-0.5">{perf?.ordersGenerated?.toLocaleString("en-IN") || 0}</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                <ShoppingCart size={13} />
              </div>
            </div>

            {/* Revenue Generated */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl flex items-center justify-between shadow-xs col-span-2">
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Revenue Generated</span>
                <h3 className="text-base font-black text-emerald-605 mt-0.5">{formatCurrency(perf?.revenueGenerated)}</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                <DollarSign size={13} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px] text-zinc-450 font-bold">
            <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
              <span>Click Through Rate (CTR %)</span>
              <span className="text-xs font-black text-zinc-800 dark:text-zinc-150">{perf?.ctr || "0.00"}%</span>
            </div>
            <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
              <span>Conversion Rate %</span>
              <span className="text-xs font-black text-zinc-800 dark:text-zinc-150">{perf?.conversionRate || "0.00"}%</span>
            </div>
          </div>

          {/* SECTION 3, 4, 5: INTERACTIVE TREND CHARTS */}
          <Card 
            size="small" 
            title={
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[var(--primary)]" />
                Performance Trends Index
              </span>
            }
            className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
            bodyStyle={{ padding: "12px" }}
          >
            {chartData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex bg-zinc-50 dark:bg-zinc-900 p-0.5 rounded-lg self-start">
                  {[
                    { id: "impressions", label: "Impressions Trend" },
                    { id: "orders", label: "Orders Gen" },
                    { id: "revenue", label: "Revenue Capped" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all border-0 cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-zinc-550 dark:text-zinc-400 bg-transparent hover:opacity-100 opacity-80"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === "impressions" ? (
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" fontSize={9} stroke="#888" tickLine={false} axisLine={false} />
                        <YAxis fontSize={9} stroke="#88" tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                        <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorImpressions)" />
                      </AreaChart>
                    ) : activeTab === "orders" ? (
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" fontSize={9} stroke="#88" tickLine={false} axisLine={false} />
                        <YAxis fontSize={9} stroke="#88" tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                        <Area type="monotone" dataKey="orders" name="Orders Generated" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <XAxis dataKey="date" fontSize={9} stroke="#88" tickLine={false} axisLine={false} />
                        <YAxis fontSize={9} stroke="#88" tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                        <RechartsTooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(val) => [`₹${val}`, "Revenue"]} />
                        <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-450 italic font-semibold">
                No analytics timeline breakdown records found.
              </div>
            )}
          </Card>

          {/* SECTION 6: PERFORMANCE METRICS & ROI PROGRESS CIRCLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs space-y-2.5">
              <h4 className="text-[9px] font-black uppercase text-zinc-400">Marketing ROI Analysis</h4>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                Return on Investment calculates campaign productivity. High indicators reflect successful conversions matching allocated budgets.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                  <span className="block text-[8px] font-black text-zinc-400 uppercase">Cost Base</span>
                  <span className="font-extrabold text-slate-805 dark:text-zinc-200">{formatCurrency(currentCamp?.budget)}</span>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                  <span className="block text-[8px] font-black text-zinc-400 uppercase">Gross Return</span>
                  <span className="font-extrabold text-emerald-600">{formatCurrency(perf?.revenueGenerated)}</span>
                </div>
              </div>
            </div>

            {/* ROI Radial Progress Circle */}
            <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-[8px] font-black uppercase text-zinc-400 mb-2">Campaign Yield Rate</span>
              
              <Progress
                type="circle"
                percent={Math.min(100, perf?.roi || 0)}
                format={() => `${perf?.roi || 0}%`}
                strokeColor={getRoiColor(perf?.roi || 0)}
                width={85}
                strokeWidth={9}
              />
              
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-bold text-zinc-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getRoiColor(perf?.roi || 0) }} />
                <span className="uppercase text-slate-800 dark:text-zinc-300">
                  {perf?.roi >= 40 ? "Excellent ROI (>40%)" : perf?.roi >= 20 ? "Moderate ROI (20-40%)" : "Poor ROI (<20%)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-zinc-450 italic font-semibold">
          No analytics data available for this campaign.
        </div>
      )}
    </Drawer>
  );
}
