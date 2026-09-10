import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { mockFranchiseRevenue, mockStores, mockTopProducts, mockRefundRequests } from "../mockData";

export function useFranchiseRevenue() {
  const [loading, setLoading] = useState(false);
  const [rawRecords, setRawRecords] = useState([]);
  
  // Filters State
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Last 30 Days"); // default
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [storeId, setStoreId] = useState("All");
  const [orderType, setOrderType] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("All");
  const [status, setStatus] = useState("All");

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals Detail State
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [recordDetails, setRecordDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initialize records from mock DB
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setRawRecords(mockFranchiseRevenue);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Real-Time auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate refetching from server without full reload
      setRawRecords(prev => {
        // Small fluctuation on the latest day's data (today's record)
        const updated = [...prev];
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Find today's records and randomly add a new order
        updated.forEach((rec, idx) => {
          if (rec.date === todayStr) {
            const extraOrders = Math.floor(Math.random() * 2) + 1;
            const extraGross = extraOrders * 280; // ₹280 avg pizza
            const extraTax = Math.round(extraGross * 0.05);
            const extraDelivery = extraOrders * 30;
            const extraDiscount = Math.round(extraGross * 0.08);

            updated[idx] = {
              ...rec,
              totalOrders: rec.totalOrders + extraOrders,
              grossRevenue: rec.grossRevenue + extraGross,
              taxCollected: rec.taxCollected + extraTax,
              deliveryCharges: rec.deliveryCharges + extraDelivery,
              discountAmount: rec.discountAmount + extraDiscount,
              netRevenue: rec.netRevenue + (extraGross - extraDiscount + extraTax + extraDelivery),
              totalProfit: Math.round(rec.totalProfit + (extraGross - extraDiscount) * 0.3)
            };
          }
        });
        return updated;
      });
      toast.info("Revenue data synced in real-time.", { duration: 2000 });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Filter & Search Logic
  const filteredRecords = useMemo(() => {
    let result = [...rawRecords];

    // Filter by Store
    if (storeId !== "All") {
      result = result.filter(r => r.franchiseId === storeId);
    }

    // Filter by Search Query (date or store name)
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(r => {
        const storeName = mockStores.find(s => s.id === r.franchiseId)?.name || "";
        return r.date.includes(query) || storeName.toLowerCase().includes(query);
      });
    }

    // Filter by Date Range Preset or Custom Range
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

    // (OrderType, PaymentMethod, Status are mapped to overall trends or simulated adjustments)
    if (orderType !== "All" || paymentMethod !== "All" || status !== "All") {
      // Simulation of changing totals when filter is applied:
      // In a real DB, these would filter raw orders. Here, we apply deterministic multipliers.
      let multiplier = 1.0;
      if (orderType === "Delivery") multiplier *= 0.65;
      else if (orderType === "Pickup") multiplier *= 0.20;
      else if (orderType === "Dine-In") multiplier *= 0.15;

      if (paymentMethod === "UPI") multiplier *= 0.50;
      else if (paymentMethod === "Card") multiplier *= 0.25;
      else if (paymentMethod === "Cash") multiplier *= 0.15;
      else if (paymentMethod === "Wallet") multiplier *= 0.10;

      if (status === "Completed") multiplier *= 0.96;
      else if (status === "Refunded") multiplier *= 0.02;
      else if (status === "Cancelled") multiplier *= 0.02;

      result = result.map(r => ({
        ...r,
        totalOrders: Math.max(1, Math.round(r.totalOrders * multiplier)),
        grossRevenue: Math.round(r.grossRevenue * multiplier),
        discountAmount: Math.round(r.discountAmount * multiplier),
        refundAmount: status === "Refunded" ? r.refundAmount : Math.round(r.refundAmount * multiplier),
        deliveryCharges: orderType === "Pickup" || orderType === "Dine-In" ? 0 : Math.round(r.deliveryCharges * multiplier),
        taxCollected: Math.round(r.taxCollected * multiplier),
        netRevenue: Math.round(r.netRevenue * multiplier),
        totalExpenses: Math.round(r.totalExpenses * multiplier),
        totalProfit: Math.round(r.totalProfit * multiplier)
      }));
    }

    return result;
  }, [rawRecords, storeId, search, dateFilter, customRange, orderType, paymentMethod, status]);

  // Aggregated KPI Cards calculations
  const kpis = useMemo(() => {
    let grossRevenue = 0;
    let netRevenue = 0;
    let totalOrders = 0;
    let discountAmount = 0;
    let refundAmount = 0;
    let totalProfit = 0;

    filteredRecords.forEach(r => {
      grossRevenue += r.grossRevenue;
      netRevenue += r.netRevenue;
      totalOrders += r.totalOrders;
      discountAmount += r.discountAmount;
      refundAmount += r.refundAmount;
      totalProfit += r.totalProfit;
    });

    const averageOrderValue = totalOrders > 0 ? Math.round(grossRevenue / totalOrders) : 0;
    const profitMargin = netRevenue > 0 ? Math.round((totalProfit / netRevenue) * 100) : 0;

    // Today's revenue calculation
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecords = rawRecords.filter(r => r.date === todayStr && (storeId === "All" || r.franchiseId === storeId));
    const todayRevenue = todayRecords.reduce((sum, r) => sum + r.netRevenue, 0);

    // Monthly & Yearly Revenue Calculations (overall)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRecords = rawRecords.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && (storeId === "All" || r.franchiseId === storeId);
    });
    const monthlyRevenue = monthlyRecords.reduce((sum, r) => sum + r.netRevenue, 0);

    const yearlyRecords = rawRecords.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === currentYear && (storeId === "All" || r.franchiseId === storeId);
    });
    const yearlyRevenue = yearlyRecords.reduce((sum, r) => sum + r.netRevenue, 0);

    // Dynamic sparkline points
    const sortedDaily = [...filteredRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    const sparkData = sortedDaily.slice(-10).map(r => r.netRevenue);

    return {
      grossRevenue,
      netRevenue,
      totalOrders,
      averageOrderValue,
      profitMargin,
      todayRevenue,
      monthlyRevenue,
      yearlyRevenue,
      sparkData: sparkData.length > 0 ? sparkData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
  }, [filteredRecords, rawRecords, storeId]);

  // Recharts Daily Revenue Chart Compiler
  const dailyTrendsChartData = useMemo(() => {
    // Group records by Date (when showing all stores)
    const dateMap = {};
    filteredRecords.forEach(r => {
      if (!dateMap[r.date]) {
        dateMap[r.date] = { date: r.date, revenue: 0, orders: 0, netRevenue: 0 };
      }
      dateMap[r.date].revenue += r.grossRevenue;
      dateMap[r.date].orders += r.totalOrders;
      dateMap[r.date].netRevenue += r.netRevenue;
    });

    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(r => ({
        ...r,
        formattedDate: new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      }));
  }, [filteredRecords]);

  // Recharts Revenue Distribution Pie Chart Compiler
  const distributionChartData = useMemo(() => {
    let foodRevenue = 0;
    let deliveryRevenue = 0;
    let taxRevenue = 0;
    let discountImpact = 0;
    let refundLoss = 0;

    filteredRecords.forEach(r => {
      foodRevenue += (r.grossRevenue - r.discountAmount);
      deliveryRevenue += r.deliveryCharges;
      taxRevenue += r.taxCollected;
      discountImpact += r.discountAmount;
      refundLoss += r.refundAmount;
    });

    const total = foodRevenue + deliveryRevenue + taxRevenue + discountImpact + refundLoss;

    return [
      { name: "Food Revenue", value: foodRevenue, pct: total > 0 ? Math.round((foodRevenue / total) * 100) : 0, color: "#10b981" },
      { name: "Delivery Revenue", value: deliveryRevenue, pct: total > 0 ? Math.round((deliveryRevenue / total) * 100) : 0, color: "#3b82f6" },
      { name: "Tax Revenue", value: taxRevenue, pct: total > 0 ? Math.round((taxRevenue / total) * 100) : 0, color: "#8b5cf6" },
      { name: "Discount Impact", value: discountImpact, pct: total > 0 ? Math.round((discountImpact / total) * 100) : 0, color: "#f59e0b" },
      { name: "Refund Loss", value: refundLoss, pct: total > 0 ? Math.round((refundLoss / total) * 100) : 0, color: "#ef4444" }
    ];
  }, [filteredRecords]);

  // Table Row Formatting and Pagination/Sorting
  const paginatedAndSortedTableData = useMemo(() => {
    // Sort
    const sorted = [...filteredRecords].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Pagination
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, sortBy, sortOrder, currentPage, pageSize]);

  // Fetch populated details for the tabbed View Details modal
  const fetchRevenueDetails = useCallback((id) => {
    setLoadingDetails(true);
    setSelectedRecordId(id);

    setTimeout(() => {
      const record = rawRecords.find(r => r._id === id);
      if (!record) {
        toast.error("Record details not found");
        setLoadingDetails(false);
        return;
      }

      const storeName = mockStores.find(s => s.id === record.franchiseId)?.name || "All Stores";

      // 1. Compile Store Contribution share for this franchise
      const storeDetailsList = mockStores.map(store => {
        const storeRecs = rawRecords.filter(r => r.franchiseId === store.id && r.date === record.date);
        const revenue = storeRecs.reduce((sum, r) => sum + r.netRevenue, 0);
        const orders = storeRecs.reduce((sum, r) => sum + r.totalOrders, 0);
        const profit = storeRecs.reduce((sum, r) => sum + r.totalProfit, 0);
        return {
          name: store.name.replace("Papa Veg Pizza - ", ""),
          orders,
          revenue,
          profit,
          pct: 20 // Simulated equal share or calculated pct
        };
      });

      const totalStoreRev = storeDetailsList.reduce((sum, s) => sum + s.revenue, 0);
      storeDetailsList.forEach((s, idx) => {
        storeDetailsList[idx].pct = totalStoreRev > 0 ? Math.round((s.revenue / totalStoreRev) * 100) : 0;
      });

      // 2. Payments Breakdown Details
      const paymentBreakdown = [
        { method: "UPI Transactions", count: Math.round(record.totalOrders * 0.50), amount: Math.round(record.netRevenue * 0.48), pct: 48, color: "#10b981" },
        { method: "Card Payments", count: Math.round(record.totalOrders * 0.25), amount: Math.round(record.netRevenue * 0.28), pct: 28, color: "#3b82f6" },
        { method: "Cash Payments", count: Math.round(record.totalOrders * 0.15), amount: Math.round(record.netRevenue * 0.14), pct: 14, color: "#f59e0b" },
        { method: "Wallet Deductions", count: Math.round(record.totalOrders * 0.10), amount: Math.round(record.netRevenue * 0.10), pct: 10, color: "#ef4444" }
      ];

      setRecordDetails({
        ...record,
        storeName,
        topProducts: mockTopProducts,
        storeContribution: storeDetailsList,
        paymentBreakdown,
        refundSummary: mockRefundRequests
      });
      setLoadingDetails(false);
    }, 400);
  }, [rawRecords]);

  // Export File (PDF, CSV, Excel)
  const exportRevenueReport = useCallback((format, exportConfig) => {
    return new Promise((resolve) => {
      // Simulate API post export delay
      setTimeout(() => {
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `Franchise_Revenue_Report_${timestamp}`;

        // Get filter matched records
        const exportRecords = [...filteredRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (format === "CSV") {
          const headers = ["Date", "Orders", "Gross Revenue (₹)", "Discounts (₹)", "Refunds (₹)", "Delivery Charges (₹)", "Taxes (₹)", "Net Revenue (₹)", "Profit (₹)"];
          const csvLines = [
            headers.join(","),
            ...exportRecords.map(r => [
              r.date,
              r.totalOrders,
              r.grossRevenue,
              r.discountAmount,
              r.refundAmount,
              r.deliveryCharges,
              r.taxCollected,
              r.netRevenue,
              r.totalProfit
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
          const headers = ["Date", "Orders", "Gross Revenue", "Discounts", "Refunds", "Delivery Charges", "Taxes", "Net Revenue", "Profit"];
          const excelRows = exportRecords.map(r => `
            <tr>
              <td>${r.date}</td>
              <td>${r.totalOrders}</td>
              <td>₹${r.grossRevenue}</td>
              <td>₹${r.discountAmount}</td>
              <td>₹${r.refundAmount}</td>
              <td>₹${r.deliveryCharges}</td>
              <td>₹${r.taxCollected}</td>
              <td>₹${r.netRevenue}</td>
              <td>₹${r.totalProfit}</td>
            </tr>
          `).join("");

          const excelHtml = `
            <html>
              <head><meta charset="utf-8"></head>
              <body>
                <h2>Franchise Revenue Report</h2>
                <table border="1">
                  <tr style="background:#f3f4f6; font-weight:bold;">
                    ${headers.map(h => `<th>${h}</th>`).join("")}
                  </tr>
                  ${excelRows}
                </table>
              </body>
            </html>
          `;

          const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}.xls`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else if (format === "PDF") {
          // Generate PDF using jsPDF + AutoTable
          import("jspdf").then(({ default: jsPDF }) => {
            import("jspdf-autotable").then(({ default: autoTable }) => {
              const doc = new jsPDF();
              doc.setFontSize(16);
              doc.text("Franchise Revenue Report", 14, 15);
              doc.setFontSize(9);
              doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | Currency: INR (₹)`, 14, 21);

              const rows = exportRecords.map(r => [
                r.date,
                r.totalOrders,
                `Rs. ${r.grossRevenue}`,
                `Rs. ${r.discountAmount}`,
                `Rs. ${r.refundAmount}`,
                `Rs. ${r.deliveryCharges}`,
                `Rs. ${r.taxCollected}`,
                `Rs. ${r.netRevenue}`,
                `Rs. ${r.totalProfit}`
              ]);

              autoTable(doc, {
                head: [["Date", "Orders", "Gross", "Discounts", "Refunds", "Delivery", "Tax", "Net", "Profit"]],
                body: rows,
                startY: 26,
                styles: { fontSize: 8 }
              });

              doc.save(`${filename}.pdf`);
            });
          });
        }

        resolve(true);
      }, 2000);
    });
  }, [filteredRecords]);

  return {
    // Filters & States
    loading,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    storeId,
    setStoreId,
    orderType,
    setOrderType,
    paymentMethod,
    setPaymentMethod,
    status,
    setStatus,

    // Pagination/Sorting
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalRecords: filteredRecords.length,

    // Statistics & Calculations
    kpis,
    dailyTrendsChartData,
    distributionChartData,
    tableData: paginatedAndSortedTableData,

    // Detailed record view
    recordDetails,
    loadingDetails,
    fetchRevenueDetails,
    setSelectedRecordId,
    selectedRecordId,

    // Operations
    exportRevenueReport,
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        setRawRecords([...mockFranchiseRevenue]);
        setLoading(false);
        toast.success("Revenue details reloaded successfully.");
      }, 500);
    }
  };
}
