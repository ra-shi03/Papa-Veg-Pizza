import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, LineChart, Line, CartesianGrid, Legend, ComposedChart } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Tag, Award } from "lucide-react";

export default function PricingAnalytics({ pricingData = [], storesList = [], categoriesList = [], isLoading }) {
  if (isLoading || pricingData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 animate-pulse" />
        <div className="h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 animate-pulse" />
      </div>
    );
  }

  // 1. Calculate Bento Card Metrics
  const getBentoStats = () => {
    const validPrices = pricingData.filter((sp) => sp.mediumPrice > 0);
    if (validPrices.length === 0) return null;

    const highest = [...validPrices].sort((a, b) => b.mediumPrice - a.mediumPrice)[0];
    const lowest = [...validPrices].sort((a, b) => a.mediumPrice - b.mediumPrice)[0];
    const average = validPrices.reduce((sum, sp) => sum + sp.mediumPrice, 0) / validPrices.length;

    // Stores with most promotions
    const promoActiveList = pricingData.filter((sp) => sp.availability === "PROMOTION ACTIVE");
    const promoCount = promoActiveList.length;

    return {
      highest,
      lowest,
      average,
      promoCount
    };
  };

  const bento = getBentoStats();

  // 2. Prepare Charts Data
  // Chart A: Store-wise Average Medium Override Price
  const storePricingData = (() => {
    const activeStores = storesList.filter(s => s.status === "Active");
    return activeStores.map((store) => {
      const storeOverrides = pricingData.filter((sp) => sp.storeId === store._id);
      const avgPrice = storeOverrides.length > 0
        ? Math.round(storeOverrides.reduce((sum, sp) => sum + sp.mediumPrice, 0) / storeOverrides.length)
        : 0;

      const promoCount = storeOverrides.filter((sp) => sp.availability === "PROMOTION ACTIVE").length;

      return {
        storeName: store.storeName.replace("Papa Veg Pizza - ", ""),
        avgPrice,
        promoCount
      };
    }).filter(d => d.avgPrice > 0);
  })();

  // Chart B: Category-wise Pricing Range (Min, Avg, Max)
  const categoryPricingData = categoriesList.map((cat) => {
    const catItems = pricingData.filter((sp) => sp.categoryId === cat._id);
    if (catItems.length === 0) return null;

    const prices = catItems.map((sp) => sp.mediumPrice);
    const avg = Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      category: cat.name,
      MinPrice: min,
      AvgPrice: avg,
      MaxPrice: max
    };
  }).filter(Boolean);

  // Chart C: Simulated Price Trend over time (historical index)
  const priceTrendData = [
    { date: "01 Jun", index: 245 },
    { date: "05 Jun", index: 252 },
    { date: "10 Jun", index: 249 },
    { date: "15 Jun", index: 261 },
    { date: "20 Jun", index: 269 },
    { date: "22 Jun", index: 274 }
  ];

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#a43c12";
  const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue("--secondary").trim() || "#ff7f50";

  return (
    <div className="space-y-4">
      {/* 1. Statistics Bento Overview Cards */}
      {bento && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-zinc-700 dark:text-zinc-350">
          
          {/* Highest priced override */}
          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[85px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8.5px] text-zinc-400 font-extrabold uppercase tracking-wider block">Highest Price Point</span>
                <p className="font-extrabold text-[10.5px] text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] mt-0.5">{bento.highest.productName}</p>
              </div>
              <span className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 shrink-0"><TrendingUp size={12} /></span>
            </div>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-base font-black text-zinc-900 dark:text-white leading-none">₹{bento.highest.mediumPrice}</span>
              <span className="text-[8px] font-bold text-zinc-400 font-mono tracking-tight">{bento.highest.storeCode}</span>
            </div>
          </div>

          {/* Lowest priced override */}
          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[85px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8.5px] text-zinc-400 font-extrabold uppercase tracking-wider block">Lowest Price Point</span>
                <p className="font-extrabold text-[10.5px] text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] mt-0.5">{bento.lowest.productName}</p>
              </div>
              <span className="p-1 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-650 shrink-0"><TrendingDown size={12} /></span>
            </div>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-base font-black text-zinc-900 dark:text-white leading-none">₹{bento.lowest.mediumPrice}</span>
              <span className="text-[8px] font-bold text-zinc-400 font-mono tracking-tight">{bento.lowest.storeCode}</span>
            </div>
          </div>

          {/* Average override price */}
          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[85px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8.5px] text-zinc-400 font-extrabold uppercase tracking-wider block">Average Override Price</span>
                <p className="font-extrabold text-[10.5px] text-zinc-900 dark:text-zinc-100 mt-0.5">Across outlets catalog</p>
              </div>
              <span className="p-1 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-650 shrink-0"><DollarSign size={12} /></span>
            </div>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-base font-black text-zinc-900 dark:text-white leading-none">₹{Math.round(bento.average)}</span>
              <span className="text-[8.5px] font-bold text-zinc-400 leading-none">Standard size avg</span>
            </div>
          </div>

          {/* Promotions count */}
          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[85px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8.5px] text-zinc-400 font-extrabold uppercase tracking-wider block">Promotional Campaigns</span>
                <p className="font-extrabold text-[10.5px] text-zinc-900 dark:text-zinc-100 mt-0.5">Active pricing rules</p>
              </div>
              <span className="p-1 rounded bg-orange-50 dark:bg-orange-950/20 text-orange-650 shrink-0"><Tag size={12} /></span>
            </div>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-base font-black text-[var(--primary)] leading-none">{bento.promoCount} Rules</span>
              <span className="text-[8.5px] font-bold text-zinc-400 leading-none">Limited time window</span>
            </div>
          </div>

        </div>
      )}

      {/* 2. Recharts Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart A: Store-wise price overrides */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xs space-y-2 max-h-[300px]">
          <div>
            <h4 className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Store-wise Price Comparison</h4>
            <p className="text-[9px] text-zinc-450 font-bold">Average override prices vs active promotion counts per store</p>
          </div>

          <div className="h-[210px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storePricingData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="storeName" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px", border: "1px solid #eee" }} />
                <Bar dataKey="avgPrice" name="Avg Price (₹)" fill={primaryColor} radius={[3, 3, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Category-wise Distribution Ranges */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xs space-y-2 max-h-[300px]">
          <div>
            <h4 className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Category-wise Pricing Distribution</h4>
            <p className="text-[9px] text-zinc-450 font-bold">Comparison of minimum, average, and maximum overrides by category</p>
          </div>

          <div className="h-[210px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={categoryPricingData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvgPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="category" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px", border: "1px solid #eee" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "8px", fontWeight: "bold" }} />
                <Area type="monotone" dataKey="AvgPrice" name="Avg Price (₹)" stroke={secondaryColor} fillOpacity={1} fill="url(#colorAvgPrice)" strokeWidth={1.5} />
                <Line type="monotone" dataKey="MaxPrice" name="Max Price (₹)" stroke={primaryColor} strokeWidth={1.5} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Price Index Trend */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xs space-y-2 max-h-[300px]">
          <div>
            <h4 className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Price Index Trend</h4>
            <p className="text-[9px] text-zinc-450 font-bold">Historical tracking of price overrides index fluctuations</p>
          </div>

          <div className="h-[210px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="index" name="Price Index" stroke={primaryColor} strokeWidth={2} dot={{ r: 3, fill: primaryColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart D: Promotion trends per Store */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xs space-y-2 max-h-[300px]">
          <div>
            <h4 className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Promotion Active Density</h4>
            <p className="text-[9px] text-zinc-450 font-bold">Density of active special campaigns per outlet channel</p>
          </div>

          <div className="h-[210px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storePricingData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="storeName" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                <Bar dataKey="promoCount" name="Active Promotions" fill={secondaryColor} radius={[3, 3, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
