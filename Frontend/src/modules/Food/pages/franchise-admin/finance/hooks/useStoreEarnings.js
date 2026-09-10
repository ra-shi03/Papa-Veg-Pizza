import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { mockStoreEarnings, mockStores, mockExpenses, mockTopProducts, mockRefundRequests } from "../mockData";

export function useStoreEarnings() {
  const [loading, setLoading] = useState(false);
  const [rawEarnings, setRawEarnings] = useState([]);
  
  // Filters State
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [storeFilter, setStoreFilter] = useState("All");
  const [profitStatusFilter, setProfitStatusFilter] = useState("All");

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("netProfit");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

  // Modals States
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [storeDetails, setStoreDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initialize data
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setRawEarnings(mockStoreEarnings);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Real-time automatic updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRawEarnings(prev => {
        const updated = [...prev];
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Randomly simulate incoming sales for today's records
        updated.forEach((rec, idx) => {
          if (rec.date === todayStr) {
            const extraOrders = Math.floor(Math.random() * 3) + 1;
            const extraSales = extraOrders * 320; // Avg transaction ₹320
            const extraDiscounts = Math.round(extraSales * 0.08);
            const extraExpenses = Math.round(extraSales * 0.60);
            const extraRefunds = Math.random() < 0.1 ? 250 : 0;
            const extraProfit = extraSales - extraDiscounts - extraExpenses - extraRefunds;

            updated[idx] = {
              ...rec,
              totalOrders: rec.totalOrders + extraOrders,
              grossSales: rec.grossSales + extraSales,
              discounts: rec.discounts + extraDiscounts,
              expenses: rec.expenses + extraExpenses,
              refunds: rec.refunds + extraRefunds,
              netProfit: rec.netProfit + extraProfit
            };
          }
        });
        return updated;
      });
      toast.info("Store earnings synced in real-time.", { duration: 2000 });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Filter Logic
  const filteredEarnings = useMemo(() => {
    let result = [...rawEarnings];

    // 1. Filter by Store selection
    if (storeFilter !== "All") {
      result = result.filter(r => r.storeId === storeFilter);
    }

    // 2. Filter by search query (match store name)
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(r => {
        const storeObj = mockStores.find(s => s.id === r.storeId);
        const storeName = storeObj ? storeObj.name.toLowerCase() : "";
        return storeName.includes(query);
      });
    }

    // 3. Filter by Date range
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    if (dateFilter === "Today") {
      result = result.filter(r => r.date === todayStr);
    } else if (dateFilter === "Last 7 Days") {
      const threshold = new Date();
      threshold.setDate(now.getDate() - 7);
      result = result.filter(r => new Date(r.date) >= threshold);
    } else if (dateFilter === "Last 30 Days") {
      const threshold = new Date();
      threshold.setDate(now.getDate() - 30);
      result = result.filter(r => new Date(r.date) >= threshold);
    } else if (dateFilter === "This Month") {
      const month = now.getMonth();
      const year = now.getFullYear();
      result = result.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    } else if (dateFilter === "Custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      result = result.filter(r => {
        const d = new Date(r.date);
        return d >= start && d <= end;
      });
    }

    // Note: Profit Status filter is applied on aggregated store metrics in table/KPIs,
    // but we can pre-filter here or filter the aggregated table data.
    // Filtering on the table level (aggregated store performance) makes more sense.
    return result;
  }, [rawEarnings, storeFilter, search, dateFilter, customRange]);

  // Aggregate store performance (Grouped by Store) over the selected filter period
  const aggregatedStores = useMemo(() => {
    const storeMap = {};

    // Initialize with all stores
    mockStores.forEach(s => {
      storeMap[s.id] = {
        storeId: s.id,
        name: s.name,
        totalOrders: 0,
        grossSales: 0,
        discounts: 0,
        refunds: 0,
        expenses: 0,
        netProfit: 0,
        margin: 0,
        status: "Average"
      };
    });

    // Populate actual records
    filteredEarnings.forEach(r => {
      if (storeMap[r.storeId]) {
        storeMap[r.storeId].totalOrders += r.totalOrders;
        storeMap[r.storeId].grossSales += r.grossSales;
        storeMap[r.storeId].discounts += r.discounts;
        storeMap[r.storeId].refunds += r.refunds;
        storeMap[r.storeId].expenses += r.expenses;
        storeMap[r.storeId].netProfit += r.netProfit;
      }
    });

    // Calculate margins and statuses
    return Object.values(storeMap).map(store => {
      const margin = store.grossSales > 0 
        ? Math.round((store.netProfit / store.grossSales) * 100)
        : 0;

      // Status tagging based on profit margin
      let status = "Average";
      if (store.netProfit < 0) {
        status = "Loss";
      } else if (margin >= 30) {
        status = "Excellent";
      } else if (margin >= 20) {
        status = "Good";
      } else if (margin >= 10) {
        status = "Average";
      } else {
        status = "Low Profit";
      }

      return {
        ...store,
        margin,
        status
      };
    });
  }, [filteredEarnings]);

  // Filter aggregated stores by Profit Status
  const filteredAggregatedStores = useMemo(() => {
    let result = [...aggregatedStores];

    if (profitStatusFilter !== "All") {
      result = result.filter(store => {
        if (profitStatusFilter === "High Profit") return store.margin >= 30 && store.netProfit >= 0;
        if (profitStatusFilter === "Medium Profit") return store.margin >= 15 && store.margin < 30 && store.netProfit >= 0;
        if (profitStatusFilter === "Low Profit") return store.margin >= 0 && store.margin < 15 && store.netProfit >= 0;
        if (profitStatusFilter === "Loss Making") return store.netProfit < 0;
        return true;
      });
    }

    return result;
  }, [aggregatedStores, profitStatusFilter]);

  // KPIs calculations
  const kpis = useMemo(() => {
    if (aggregatedStores.length === 0) {
      return {
        bestStore: { name: "N/A", profit: 0, orders: 0, growth: "0%" },
        highestRevStore: { name: "N/A", sales: 0 },
        lowestRevStore: { name: "N/A", sales: 0 },
        averageProfit: 0
      };
    }

    // 1. Best Performing Store (Highest netProfit)
    let best = aggregatedStores[0];
    aggregatedStores.forEach(s => {
      if (s.netProfit > best.netProfit) best = s;
    });

    // 2. Highest Revenue Store
    let highestRev = aggregatedStores[0];
    aggregatedStores.forEach(s => {
      if (s.grossSales > highestRev.grossSales) highestRev = s;
    });

    // 3. Lowest Revenue Store
    let lowestRev = aggregatedStores[0];
    aggregatedStores.forEach(s => {
      if (s.grossSales < lowestRev.grossSales) lowestRev = s;
    });

    // 4. Average Profit
    const totalProfit = aggregatedStores.reduce((sum, s) => sum + s.netProfit, 0);
    const averageProfit = mockStores.length > 0 ? Math.round(totalProfit / mockStores.length) : 0;

    // Growth simulation based on performance
    const growthPercent = best.margin >= 25 ? "+14.8%" : best.margin >= 15 ? "+8.5%" : "+2.1%";

    return {
      bestStore: {
        name: best.name.replace("Papa Veg Pizza - ", ""),
        profit: best.netProfit,
        orders: best.totalOrders,
        growth: growthPercent
      },
      highestRevStore: {
        name: highestRev.name.replace("Papa Veg Pizza - ", ""),
        sales: highestRev.grossSales
      },
      lowestRevStore: {
        name: lowestRev.name.replace("Papa Veg Pizza - ", ""),
        sales: lowestRev.grossSales
      },
      averageProfit
    };
  }, [aggregatedStores]);

  // Chart 1: Store Comparison Chart (Bar Chart)
  // X-axis: Store Names; Y-axis: Amount; Bars: Revenue, Profit, Orders (on right axis or scaled)
  const storeComparisonChartData = useMemo(() => {
    return aggregatedStores.map(s => ({
      name: s.name.replace("Papa Veg Pizza - ", ""),
      revenue: s.grossSales,
      profit: s.netProfit,
      orders: s.totalOrders,
      margin: s.margin
    }));
  }, [aggregatedStores]);

  // Chart 2: Revenue vs Profit Trend Chart (Line Chart)
  // Shows daily cumulative revenue and profit across filtered period
  const revenueProfitTrendChartData = useMemo(() => {
    const dateMap = {};

    filteredEarnings.forEach(r => {
      if (!dateMap[r.date]) {
        dateMap[r.date] = { date: r.date, revenue: 0, profit: 0 };
      }
      dateMap[r.date].revenue += r.grossSales;
      dateMap[r.date].profit += r.netProfit;
    });

    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(r => ({
        ...r,
        formattedDate: new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      }));
  }, [filteredEarnings]);

  // Table sorting and pagination
  const sortedTableData = useMemo(() => {
    const sorted = [...filteredAggregatedStores].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Client-side pagination matching server-side structure
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [filteredAggregatedStores, sortBy, sortOrder, currentPage, pageSize]);

  // Fetch populated store details for detail tabs
  const fetchStoreDetails = useCallback((storeId) => {
    setLoadingDetails(true);
    setSelectedStoreId(storeId);

    setTimeout(() => {
      // Find aggregated data for this store
      const storeAgg = aggregatedStores.find(s => s.storeId === storeId);
      const storeObj = mockStores.find(s => s.id === storeId);

      if (!storeAgg || !storeObj) {
        toast.error("Store earnings data not found.");
        setLoadingDetails(false);
        return;
      }

      // Filter expenses for this store
      const storeExpenses = mockExpenses.filter(e => e.storeId === storeId && e.status === "Approved");
      
      // Calculate expense category breakdown
      const expenseCategories = {
        Inventory: 0,
        Salary: 0,
        Utilities: 0,
        Marketing: 0,
        Delivery: 0,
        Maintenance: 0,
        Miscellaneous: 0
      };

      storeExpenses.forEach(exp => {
        // Map category cleanly
        let category = exp.category;
        if (category === "Electricity" || category === "Gas") category = "Utilities";
        if (category === "Refund") category = "Miscellaneous"; // edge cases
        
        if (expenseCategories[category] !== undefined) {
          expenseCategories[category] += exp.amount;
        } else {
          expenseCategories.Miscellaneous += exp.amount;
        }
      });

      // If store expenses mock is empty, simulate proportional values based on total expenses
      const totalExpenseVal = storeAgg.expenses;
      const expenseList = Object.keys(expenseCategories).map(cat => {
        let amount = expenseCategories[cat];
        if (amount === 0 && totalExpenseVal > 0) {
          // Proportional simulation fallback
          const shares = { Inventory: 0.40, Salary: 0.25, Utilities: 0.12, Marketing: 0.08, Delivery: 0.06, Maintenance: 0.05, Miscellaneous: 0.04 };
          amount = Math.round(totalExpenseVal * shares[cat]);
        }
        return {
          category: cat,
          amount,
          pct: totalExpenseVal > 0 ? Math.round((amount / totalExpenseVal) * 100) : 0
        };
      });

      // Product performance fallback for Indore, Bhopal, etc.
      // Top 10 products
      const topProducts = mockTopProducts.map(p => {
        // Scale product performance to this store's revenue proportion
        const storePct = storeAgg.grossSales / 1000000; // factor
        const qty = Math.max(10, Math.round(p.quantity * Math.min(1.2, Math.max(0.2, storePct))));
        const rev = Math.round(p.revenue * Math.min(1.2, Math.max(0.2, storePct)));
        return {
          product: p.name,
          quantity: qty,
          revenue: rev,
          contribution: p.contribution
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Refund requests fallback
      const refundRequests = mockRefundRequests.map((ref, idx) => ({
        refundId: ref.id,
        amount: Math.round(storeAgg.refunds * (0.3 - idx * 0.05)),
        reason: ref.reason,
        date: ref.date
      })).filter(r => r.amount > 0);

      // Orders Analysis fallback
      const orderTypeDistribution = [
        { name: "Delivery", value: Math.round(storeAgg.totalOrders * 0.65), color: "#3b82f6" },
        { name: "Pickup", value: Math.round(storeAgg.totalOrders * 0.20), color: "#f59e0b" },
        { name: "Dine-In", value: Math.round(storeAgg.totalOrders * 0.15), color: "#10b981" }
      ];

      const aov = storeAgg.totalOrders > 0 ? Math.round(storeAgg.grossSales / storeAgg.totalOrders) : 0;

      setStoreDetails({
        storeId,
        storeName: storeObj.name,
        city: storeObj.city,
        totalOrders: storeAgg.totalOrders,
        grossSales: storeAgg.grossSales,
        discounts: storeAgg.discounts,
        refunds: storeAgg.refunds,
        expenses: storeAgg.expenses,
        netProfit: storeAgg.netProfit,
        margin: storeAgg.margin,
        aov,
        expensesBreakdown: expenseList,
        productPerformance: topProducts,
        refundRequests,
        ordersAnalysis: {
          totalOrders: storeAgg.totalOrders,
          completedOrders: Math.round(storeAgg.totalOrders * 0.96),
          cancelledOrders: Math.round(storeAgg.totalOrders * 0.04),
          aov,
          peakHours: "07:00 PM - 09:30 PM",
          orderTypeDistribution
        }
      });

      setLoadingDetails(false);
    }, 450);
  }, [aggregatedStores]);

  // Export mock report generator (trigger progress and download CSV/Excel/PDF)
  const exportStoreEarningsReport = useCallback((format, exportConfig) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `Store_Earnings_Report_${timestamp}`;
        const records = [...aggregatedStores];

        if (format === "CSV") {
          const headers = ["Store Name", "Total Orders", "Gross Sales (₹)", "Expenses (₹)", "Net Profit (₹)", "Margin %", "Refunds (₹)", "Status"];
          const csvLines = [
            headers.join(","),
            ...records.map(r => [
              `"${r.name}"`,
              r.totalOrders,
              r.grossSales,
              r.expenses,
              r.netProfit,
              r.margin,
              r.refunds,
              r.status
            ].join(","))
          ].join("\n");

          const blob = new Blob(["\uFEFF" + csvLines], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else if (format === "Excel") {
          const headers = ["Store Name", "Total Orders", "Gross Sales", "Expenses", "Net Profit", "Margin", "Refunds", "Status"];
          const rows = records.map(r => `
            <tr>
              <td>${r.name}</td>
              <td>${r.totalOrders}</td>
              <td>₹${r.grossSales}</td>
              <td>₹${r.expenses}</td>
              <td>₹${r.netProfit}</td>
              <td>${r.margin}%</td>
              <td>₹${r.refunds}</td>
              <td>${r.status}</td>
            </tr>
          `).join("");

          const html = `
            <html>
              <head><meta charset="utf-8"></head>
              <body>
                <h2>Store Profitability & Earnings Report</h2>
                <table border="1">
                  <tr style="background:#f3f4f6; font-weight:bold;">
                    ${headers.map(h => `<th>${h}</th>`).join("")}
                  </tr>
                  ${rows}
                </table>
              </body>
            </html>
          `;

          const blob = new Blob([html], { type: "application/vnd.ms-excel" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}.xls`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else if (format === "PDF") {
          import("jspdf").then(({ default: jsPDF }) => {
            import("jspdf-autotable").then(({ default: autoTable }) => {
              const doc = new jsPDF();
              doc.setFontSize(14);
              doc.text("Store Earnings Report (Franchise Admin)", 14, 15);
              doc.setFontSize(9);
              doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | All values in INR (₹)`, 14, 21);

              const rows = records.map(r => [
                r.name.replace("Papa Veg Pizza - ", ""),
                r.totalOrders,
                `Rs. ${r.grossSales}`,
                `Rs. ${r.expenses}`,
                `Rs. ${r.netProfit}`,
                `${r.margin}%`,
                `Rs. ${r.refunds}`,
                r.status
              ]);

              autoTable(doc, {
                head: [["Store", "Orders", "Sales", "Expenses", "Profit", "Margin %", "Refunds", "Status"]],
                body: rows,
                startY: 26,
                styles: { fontSize: 8 }
              });

              doc.save(`${filename}.pdf`);
            });
          });
        }
        resolve(true);
      }, 1500);
    });
  }, [aggregatedStores]);

  return {
    loading,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    storeFilter,
    setStoreFilter,
    profitStatusFilter,
    setProfitStatusFilter,

    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalRecords: filteredAggregatedStores.length,

    kpis,
    storeComparisonChartData,
    revenueProfitTrendChartData,
    tableData: sortedTableData,

    selectedStoreId,
    storeDetails,
    loadingDetails,
    fetchStoreDetails,
    setSelectedStoreId,

    exportStoreEarningsReport,
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        setRawEarnings([...mockStoreEarnings]);
        setLoading(false);
        toast.success("Store earnings details updated successfully.");
      }, 500);
    }
  };
}
