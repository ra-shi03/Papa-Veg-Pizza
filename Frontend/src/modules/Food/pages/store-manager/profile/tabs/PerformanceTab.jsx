import React, { useState, useEffect } from "react";
import { Award, TrendingUp, BarChart2, Star, Clock, AlertTriangle, Users, CheckCircle2, DollarSign, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { profileApi } from "@food/api";
import PerformanceCard from "../components/PerformanceCard";

export default function PerformanceTab({ userRole = "store_manager" }) {
  const [loading, setLoading] = useState(true);
  const [perfData, setPerfData] = useState(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await profileApi.getPerformance();
        if (res.success) {
          setPerfData(res.data);
        }
      } catch (err) {
        console.error("Failed to load performance metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  // Performance progress bars based on roles
  const managerKPIs = [
    { label: "Waste Reduction Accuracy", value: 92 },
    { label: "Staff Scheduling Efficiency", value: 88 },
    { label: "Customer Resolution Rate", value: 95 },
  ];

  const staffKPIs = [
    { label: "Dough Kneading Consistency", value: 94 },
    { label: "Baking Temperature Control", value: 90 },
    { label: "Topping Speed Index", value: 86 },
  ];

  const currentKPIs = userRole === "store_manager" ? managerKPIs : staffKPIs;

  // Chart data representing weekly productivity/orders completed
  const chartData = [
    { week: "Wk 1", orders: 280, target: 250 },
    { week: "Wk 2", orders: 340, target: 250 },
    { week: "Wk 3", orders: 290, target: 250 },
    { week: "Wk 4", orders: 380, target: 250 },
    { week: "Wk 5", orders: 410, target: 250 },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
          ))}
        </div>
        <div className="h-[200px] bg-zinc-150 dark:bg-zinc-850 rounded-xl" />
      </div>
    );
  }

  // Define role specific cards
  const getCards = () => {
    if (userRole === "store_manager") {
      return [
        {
          title: "Revenue Managed",
          value: perfData?.revenueManaged || "₹8,45,000",
          subtext: "Total store billings this month",
          icon: DollarSign,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/35",
        },
        {
          title: "Customer Satisfaction",
          value: perfData?.customerSatisfaction || "94%",
          subtext: "Feedback rating (Google & Portal)",
          icon: Users,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/35",
        },
        {
          title: "Staff Efficiency Index",
          value: perfData?.staffEfficiency || "91%",
          subtext: "Average task dispatch speeds",
          icon: TrendingUp,
          color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/35",
        },
        {
          title: "Store Performance Rating",
          value: `${perfData?.performanceRating || "4.8"} / 5.0`,
          subtext: "Evaluated by Regional Head",
          icon: Star,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/35",
        },
      ];
    }

    if (userRole === "kitchen_supervisor") {
      return [
        {
          title: "Orders Supervised",
          value: perfData?.ordersManaged || 1420,
          subtext: "Direct kitchen station throughput",
          icon: CheckCircle2,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/35",
        },
        {
          title: "Average Prep Time",
          value: perfData?.avgPrepTime || "12.5 mins",
          subtext: "Target preparation is <12 mins",
          icon: Clock,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/35",
        },
        {
          title: "Delayed Oven Handoffs",
          value: perfData?.delayedOrders || 14,
          subtext: "Orders exceeding baking threshold",
          icon: AlertTriangle,
          color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/35",
        },
        {
          title: "Supervisor Score",
          value: `${perfData?.performanceRating || "4.7"} / 5.0`,
          subtext: "Combined speed & quality rating",
          icon: Star,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/35",
        },
      ];
    }

    // Default: kitchen_staff
    return [
      {
        title: "Orders Prepared",
        value: perfData?.ordersPrepared || 820,
        subtext: "Personal items dispatched",
        icon: CheckCircle2,
        color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/35",
      },
      {
        title: "Average Pizza Time",
        value: perfData?.avgPizzaTime || "9.2 mins",
        subtext: "Prep, stretch & top duration",
        icon: Clock,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/35",
      },
      {
        title: "Delayed Prep Items",
        value: perfData?.delayedOrders || 14,
        subtext: "Items exceeding prep threshold",
        icon: AlertTriangle,
        color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/35",
      },
      {
        title: "Personal Performance",
        value: `${perfData?.personalRating || "4.6"} / 5.0`,
        subtext: "Manager speed & quality index",
        icon: Star,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/35",
      },
    ];
  };

  const cards = getCards();

  const getPerformanceBadge = (rating) => {
    const val = parseFloat(rating);
    if (val >= 4.7) return { text: "Outstanding Chef Elite", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30" };
    if (val >= 4.5) return { text: "Highly Efficient Operator", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30" };
    return { text: "Standard Performer", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30" };
  };

  const currentRating = userRole === "store_manager"
    ? perfData?.performanceRating || "4.8"
    : userRole === "kitchen_supervisor"
    ? perfData?.performanceRating || "4.7"
    : perfData?.personalRating || "4.6";

  const badge = getPerformanceBadge(currentRating);

  return (
    <div className="space-y-4">
      {/* PERFORMANCE METRICS CARDS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-[var(--primary)]" />
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {userRole === "kitchen_staff" ? "My Performance Metrics" : "Operational Performance Overview"}
            </h2>
          </div>
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.text}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((card, index) => (
            <PerformanceCard
              key={index}
              title={card.title}
              value={card.value}
              subtext={card.subtext}
              icon={card.icon}
              colorClass={card.color}
            />
          ))}
        </div>
      </div>

      {/* CHARTS & DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* PROGRESS BAR STATS */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
              <Activity size={14} className="text-[var(--secondary)]" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Skill Index Parameters
              </h3>
            </div>
            
            <div className="space-y-4">
              {currentKPIs.map((kpi, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-500 dark:text-zinc-400">{kpi.label}</span>
                    <span className="text-[var(--primary)]">{kpi.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                      style={{ width: `${kpi.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-50 dark:border-zinc-850 text-[9px] font-semibold text-slate-400 dark:text-zinc-500 leading-normal">
            *Skill indices are computed monthly based on customer feedback and kitchen order fulfillment accuracy logs.
          </div>
        </div>

        {/* WORKLOAD CHART PLACEHOLDER */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
            <BarChart2 size={14} className="text-[var(--primary)]" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Weekly Order Dispatch Trend
            </h3>
          </div>

          <div className="w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "8px",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === chartData.length - 1 ? "var(--primary)" : "var(--secondary)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
