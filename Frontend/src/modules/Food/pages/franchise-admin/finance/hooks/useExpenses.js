import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { mockExpenses, mockStores } from "../mockData";

export function useExpenses() {
  const [loading, setLoading] = useState(false);
  const [rawExpenses, setRawExpenses] = useState([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [storeId, setStoreId] = useState("All");
  const [status, setStatus] = useState("All");
  const [dateFilter, setDateFilter] = useState("This Month"); // default filter
  const [customRange, setCustomRange] = useState({ start: null, end: null });

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("expenseDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals Visibility and details state
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initialize records from mock DB
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setRawExpenses(mockExpenses);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Real-Time auto-refresh every 60 seconds (KPIs, Charts, Table)
  useEffect(() => {
    const interval = setInterval(() => {
      setRawExpenses(prev => {
        // Small real-time simulation: add an order refund or simple electricity charge
        const updated = [...prev];
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Randomly simulate a pending delivery reimbursement
        const randomStoreId = `store-${Math.floor(Math.random() * 5) + 1}`;
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const newExpense = {
          _id: `exp-auto-${randomNum}`,
          franchiseId: randomStoreId,
          storeId: randomStoreId,
          expenseNumber: `EXP-2026-${randomNum}`,
          category: "Delivery",
          amount: Math.round(150 + Math.random() * 400),
          description: "Rider fuel cash payout reimbursement",
          paymentMethod: "Cash",
          attachment: "",
          approvedBy: "",
          expenseDate: todayStr,
          status: "Pending",
          createdBy: "Vikram Rathore"
        };
        updated.unshift(newExpense);
        return updated;
      });
      toast.info("Expenses synced in real-time.", { duration: 2000 });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Filter & Search Logic
  const filteredExpenses = useMemo(() => {
    let result = [...rawExpenses];

    // Filter by Store
    if (storeId !== "All") {
      result = result.filter(r => r.storeId === storeId);
    }

    // Filter by Category
    if (category !== "All") {
      result = result.filter(r => r.category === category);
    }

    // Filter by Status
    if (status !== "All") {
      result = result.filter(r => r.status === status);
    }

    // Filter by Search Query (Number, Description)
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(r => 
        r.expenseNumber.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query)
      );
    }

    // Filter by Date Range Preset or Custom Range
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    if (dateFilter === "Today") {
      result = result.filter(r => r.expenseDate === todayStr);
    } else if (dateFilter === "Last 7 Days") {
      const threshold = new Date();
      threshold.setDate(now.getDate() - 7);
      result = result.filter(r => new Date(r.expenseDate) >= threshold);
    } else if (dateFilter === "This Month") {
      const month = now.getMonth();
      const year = now.getFullYear();
      result = result.filter(r => {
        const d = new Date(r.expenseDate);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    } else if (dateFilter === "Custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      // set hours to cover full days
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => {
        const d = new Date(r.expenseDate);
        return d >= start && d <= end;
      });
    }

    return result;
  }, [rawExpenses, storeId, category, status, search, dateFilter, customRange]);

  // Aggregated KPI Cards calculations
  const kpis = useMemo(() => {
    let totalExpenses = 0;
    let pendingCount = 0;
    let monthlyTotal = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    filteredExpenses.forEach(r => {
      totalExpenses += r.amount;
      if (r.status === "Pending") {
        pendingCount++;
      }
      
      const d = new Date(r.expenseDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthlyTotal += r.amount;
      }
    });

    const averageExpense = filteredExpenses.length > 0 ? Math.round(totalExpenses / filteredExpenses.length) : 0;

    return {
      totalExpenses,
      pendingApprovals: pendingCount,
      monthlyExpense: monthlyTotal,
      averageExpense
    };
  }, [filteredExpenses]);

  // Recharts Daily / Monthly Expense Chart Compiler
  const expenseTrendChartData = useMemo(() => {
    const dateMap = {};
    filteredExpenses.forEach(r => {
      const dStr = r.expenseDate;
      if (!dateMap[dStr]) {
        dateMap[dStr] = { date: dStr, amount: 0 };
      }
      dateMap[dStr].amount += r.amount;
    });

    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(r => ({
        ...r,
        formattedDate: new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      }));
  }, [filteredExpenses]);

  // Recharts Expense Category Pie Chart Compiler
  const categoryDistributionChartData = useMemo(() => {
    const categoriesMap = {
      Inventory: 0,
      Salary: 0,
      Maintenance: 0,
      Electricity: 0,
      Gas: 0,
      Marketing: 0,
      Refund: 0,
      Delivery: 0,
      Miscellaneous: 0
    };

    let total = 0;
    filteredExpenses.forEach(r => {
      if (categoriesMap[r.category] !== undefined) {
        categoriesMap[r.category] += r.amount;
        total += r.amount;
      }
    });

    const COLORS = {
      Inventory: "#10b981", // Emerald
      Salary: "#3b82f6", // Blue
      Maintenance: "#8b5cf6", // Purple
      Electricity: "#f59e0b", // Amber
      Gas: "#f43f5e", // Rose
      Marketing: "#06b6d4", // Cyan
      Refund: "#e11d48", // Rose dark
      Delivery: "#ec4899", // Pink
      Miscellaneous: "#6b7280" // Gray
    };

    return Object.keys(categoriesMap).map(catName => {
      const val = categoriesMap[catName];
      return {
        name: catName,
        value: val,
        pct: total > 0 ? Math.round((val / total) * 100) : 0,
        color: COLORS[catName] || "#6b7280"
      };
    }).filter(item => item.value > 0);
  }, [filteredExpenses]);

  // Table Row Formatting and Pagination/Sorting
  const paginatedAndSortedTableData = useMemo(() => {
    const sorted = [...filteredExpenses].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "expenseDate") {
        return sortOrder === "asc"
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [filteredExpenses, sortBy, sortOrder, currentPage, pageSize]);

  // Operations
  const addExpense = useCallback((data) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const newExpense = {
          _id: `exp-${randomNum}`,
          expenseNumber: `EXP-2026-${randomNum}`,
          status: "Pending",
          approvedBy: "",
          createdBy: "Amit Sharma", // Simulated logged in user
          ...data
        };
        setRawExpenses(prev => [newExpense, ...prev]);
        setLoading(false);
        toast.success("Expense created successfully.");
        resolve(newExpense);
      }, 500);
    });
  }, []);

  const updateExpense = useCallback((id, data) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        setRawExpenses(prev =>
          prev.map(exp => (exp._id === id ? { ...exp, ...data } : exp))
        );
        setLoading(false);
        toast.success("Expense updated successfully.");
        resolve(true);
      }, 500);
    });
  }, []);

  const deleteExpense = useCallback((id) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        setRawExpenses(prev => prev.filter(exp => exp._id !== id));
        setLoading(false);
        toast.success("Expense deleted successfully.");
        resolve(true);
      }, 500);
    });
  }, []);

  const updateExpenseStatus = useCallback((id, newStatus, remarks) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        setRawExpenses(prev =>
          prev.map(exp =>
            exp._id === id
              ? {
                  ...exp,
                  status: newStatus,
                  approvedBy: newStatus === "Approved" ? "Shubham Jamliya" : "",
                  remarks: remarks || exp.remarks
                }
              : exp
          )
        );
        setLoading(false);
        toast.success("Expense status updated successfully.");
        resolve(true);
      }, 500);
    });
  }, []);

  const bulkUpdateStatus = useCallback((ids, newStatus) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        setRawExpenses(prev =>
          prev.map(exp =>
            ids.includes(exp._id)
              ? {
                  ...exp,
                  status: newStatus,
                  approvedBy: newStatus === "Approved" ? "Shubham Jamliya" : ""
                }
              : exp
          )
        );
        setLoading(false);
        toast.success(`Selected expenses ${newStatus.toLowerCase()} successfully.`);
        resolve(true);
      }, 600);
    });
  }, []);

  const bulkDelete = useCallback((ids) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        setRawExpenses(prev => prev.filter(exp => !ids.includes(exp._id)));
        setLoading(false);
        toast.success("Selected expenses deleted successfully.");
        resolve(true);
      }, 600);
    });
  }, []);

  // Export File Simulation
  const exportExpensesReport = useCallback((format, exportConfig) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `Franchise_Expenses_Report_${timestamp}`;

        let exportRecords = [...filteredExpenses];
        if (exportConfig?.category && exportConfig.category !== "All") {
          exportRecords = exportRecords.filter(r => r.category === exportConfig.category);
        }
        if (exportConfig?.storeId && exportConfig.storeId !== "All") {
          exportRecords = exportRecords.filter(r => r.storeId === exportConfig.storeId);
        }
        if (exportConfig?.status && exportConfig.status !== "All") {
          exportRecords = exportRecords.filter(r => r.status === exportConfig.status);
        }

        exportRecords.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));

        if (format === "CSV") {
          const headers = ["Expense No", "Category", "Store", "Amount (₹)", "Payment Method", "Date", "Status", "Created By", "Description"];
          const csvLines = [
            headers.join(","),
            ...exportRecords.map(r => {
              const storeName = mockStores.find(s => s.id === r.storeId)?.name || "All Stores";
              return [
                r.expenseNumber,
                r.category,
                `"${storeName.replace(/"/g, '""')}"`,
                r.amount,
                r.paymentMethod,
                r.expenseDate,
                r.status,
                r.createdBy,
                `"${(r.description || "").replace(/"/g, '""')}"`
              ].join(",");
            })
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
          const headers = ["Expense No", "Category", "Store", "Amount", "Payment Method", "Date", "Status", "Created By", "Description"];
          const excelRows = exportRecords.map(r => {
            const storeName = mockStores.find(s => s.id === r.storeId)?.name || "All Stores";
            return `
              <tr>
                <td>${r.expenseNumber}</td>
                <td>${r.category}</td>
                <td>${storeName}</td>
                <td>₹${r.amount}</td>
                <td>${r.paymentMethod}</td>
                <td>${r.expenseDate}</td>
                <td>${r.status}</td>
                <td>${r.createdBy}</td>
                <td>${r.description || ""}</td>
              </tr>
            `;
          }).join("");

          const excelHtml = `
            <html>
              <head><meta charset="utf-8"></head>
              <body>
                <h2>Franchise Expenses Management Report</h2>
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
          import("jspdf").then(({ default: jsPDF }) => {
            import("jspdf-autotable").then(({ default: autoTable }) => {
              const doc = new jsPDF();
              doc.setFontSize(16);
              doc.text("Franchise Expenses Report", 14, 15);
              doc.setFontSize(9);
              doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | Currency: INR (₹)`, 14, 21);

              const rows = exportRecords.map(r => {
                const storeName = mockStores.find(s => s.id === r.storeId)?.name || "All Stores";
                return [
                  r.expenseNumber,
                  r.category,
                  storeName.replace("Papa Veg Pizza - ", ""),
                  `Rs. ${r.amount}`,
                  r.paymentMethod,
                  r.expenseDate,
                  r.status,
                  r.createdBy
                ];
              });

              autoTable(doc, {
                head: [["Expense No", "Category", "Store", "Amount", "Method", "Date", "Status", "Created By"]],
                body: rows,
                startY: 26,
                styles: { fontSize: 8 }
              });

              doc.save(`${filename}.pdf`);
            });
          });
        }

        resolve(true);
      }, 1000);
    });
  }, [filteredExpenses]);

  return {
    loading,
    search,
    setSearch,
    category,
    setCategory,
    storeId,
    setStoreId,
    status,
    setStatus,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalRecords: filteredExpenses.length,

    kpis,
    expenseTrendChartData,
    categoryDistributionChartData,
    tableData: paginatedAndSortedTableData,

    selectedExpense,
    setSelectedExpense,
    loadingDetails,
    setLoadingDetails,

    addExpense,
    updateExpense,
    deleteExpense,
    updateExpenseStatus,
    bulkUpdateStatus,
    bulkDelete,
    exportExpensesReport,
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        setRawExpenses([...mockExpenses]);
        setLoading(false);
        toast.success("Expenses reloaded successfully.");
      }, 500);
    }
  };
}
