import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { mockRiderPayouts, mockDeliveryPartners } from "../mockData";

export function useRiderPayouts() {
  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [ridersList, setRidersList] = useState([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [riderFilter, setRiderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("This Month");
  const [customRange, setCustomRange] = useState({ start: null, end: null });

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("totalAmount");
  const [sortOrder, setSortOrder] = useState("desc");

  // Detailed Modal States
  const [selectedPayoutId, setSelectedPayoutId] = useState(null);
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initialize data
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setPayouts(mockRiderPayouts);
      setRidersList(mockDeliveryPartners);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Real-time updates simulation every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates: add delivery counts and auto-incentives for active pending payouts
      setPayouts(prev => {
        const updated = [...prev];
        updated.forEach((pay, idx) => {
          if (pay.paymentStatus === "Pending") {
            const extraDeliveries = Math.floor(Math.random() * 2);
            if (extraDeliveries > 0) {
              const extraIncentive = extraDeliveries * 15; // ₹15 commission per order
              const newDeliveries = pay.totalDeliveries + extraDeliveries;
              const newIncentive = pay.incentive + extraIncentive;
              const newTotal = pay.baseSalary + newIncentive + pay.bonus - pay.penalties;
              updated[idx] = {
                ...pay,
                totalDeliveries: newDeliveries,
                incentive: newIncentive,
                totalAmount: newTotal
              };
            }
          }
        });
        return updated;
      });
      toast.info("Rider payout details refreshed in real-time.", { duration: 2000 });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Filtered Payouts
  const filteredPayouts = useMemo(() => {
    let result = [...payouts];

    // 1. Search Query (match rider name or payout number)
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(p => {
        const riderObj = ridersList.find(r => r.id === p.riderId);
        const name = riderObj ? riderObj.name.toLowerCase() : "";
        const num = p.payoutNumber.toLowerCase();
        return name.includes(query) || num.includes(query);
      });
    }

    // 2. Rider Filter
    if (riderFilter !== "All") {
      result = result.filter(p => p.riderId === riderFilter);
    }

    // 3. Status Filter
    if (statusFilter !== "All") {
      result = result.filter(p => p.paymentStatus === statusFilter);
    }

    // 4. Date Filter
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    if (dateFilter === "Today") {
      result = result.filter(p => p.startDate <= todayStr && p.endDate >= todayStr);
    } else if (dateFilter === "Last 7 Days") {
      const threshold = new Date();
      threshold.setDate(now.getDate() - 7);
      result = result.filter(p => new Date(p.endDate) >= threshold);
    } else if (dateFilter === "This Month") {
      const month = now.getMonth();
      const year = now.getFullYear();
      result = result.filter(p => {
        const d = new Date(p.endDate);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    } else if (dateFilter === "Custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      result = result.filter(p => {
        const startD = new Date(p.startDate);
        const endD = new Date(p.endDate);
        return startD >= start && endD <= end;
      });
    }

    return result;
  }, [payouts, ridersList, search, riderFilter, statusFilter, dateFilter, customRange]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalRiders = ridersList.length;
    const pendingPayouts = payouts.filter(p => p.paymentStatus === "Pending").length;
    
    // Sum totalAmount over filtered records
    const totalPayoutAmount = filteredPayouts.reduce((sum, p) => sum + p.totalAmount, 0);
    const averageEarnings = totalRiders > 0 ? Math.round(totalPayoutAmount / totalRiders) : 0;

    return {
      totalRiders,
      pendingPayouts,
      totalPayoutAmount,
      averageEarnings
    };
  }, [filteredPayouts, payouts, ridersList]);

  // Analytics Chart 1: Rider Earnings Comparison (Bar Chart)
  const riderEarningsComparisonData = useMemo(() => {
    // Group by Rider Name
    const map = {};
    filteredPayouts.forEach(p => {
      const riderObj = ridersList.find(r => r.id === p.riderId);
      const name = riderObj ? riderObj.name : "Unknown Rider";
      
      if (!map[p.riderId]) {
        map[p.riderId] = {
          name,
          baseSalary: 0,
          incentive: 0,
          bonus: 0,
          netAmount: 0
        };
      }
      map[p.riderId].baseSalary += p.baseSalary;
      map[p.riderId].incentive += p.incentive;
      map[p.riderId].bonus += p.bonus;
      map[p.riderId].netAmount += p.totalAmount;
    });

    return Object.values(map);
  }, [filteredPayouts, ridersList]);

  // Analytics Chart 2: Payment Status Distribution (Pie Chart)
  const paymentStatusDistributionData = useMemo(() => {
    let paidCount = 0, paidAmount = 0;
    let pendingCount = 0, pendingAmount = 0;
    let failedCount = 0, failedAmount = 0;

    filteredPayouts.forEach(p => {
      if (p.paymentStatus === "Paid") {
        paidCount++;
        paidAmount += p.totalAmount;
      } else if (p.paymentStatus === "Pending") {
        pendingCount++;
        pendingAmount += p.totalAmount;
      } else if (p.paymentStatus === "Failed") {
        failedCount++;
        failedAmount += p.totalAmount;
      }
    });

    const total = paidCount + pendingCount + failedCount;

    return [
      { name: "Paid", count: paidCount, amount: paidAmount, pct: total > 0 ? Math.round((paidCount / total) * 100) : 0, color: "#10b981" },
      { name: "Pending", count: pendingCount, amount: pendingAmount, pct: total > 0 ? Math.round((pendingCount / total) * 100) : 0, color: "#f59e0b" },
      { name: "Failed", count: failedCount, amount: failedAmount, pct: total > 0 ? Math.round((failedCount / total) * 100) : 0, color: "#ef4444" }
    ];
  }, [filteredPayouts]);

  // Paginated and Sorted Table Data
  const sortedTableData = useMemo(() => {
    const sorted = [...filteredPayouts].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "paidDate") {
        if (!aVal) return 1;
        if (!bVal) return -1;
        return sortOrder === "asc" ? new Date(aVal) - new Date(bVal) : new Date(bVal) - new Date(aVal);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [filteredPayouts, sortBy, sortOrder, currentPage, pageSize]);

  // Operations
  const generatePayout = useCallback((config) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        const { startDate, endDate, riderId, bonus, penalty, autoCalculate } = config;
        
        // Generate payout for selected rider(s)
        const targetRiders = riderId === "All" ? ridersList : ridersList.filter(r => r.id === riderId);
        const newRecords = [];

        targetRiders.forEach((rider, idx) => {
          const baseSalary = 6000; // base flat salary for 15 days
          const deliveriesCount = autoCalculate ? Math.floor(Math.random() * 50) + 70 : 80;
          const calculatedIncentive = autoCalculate ? deliveriesCount * 15 : 0; // ₹15 commission per order

          const record = {
            _id: `pay-gen-${Date.now()}-${idx}`,
            riderId: rider.id,
            franchiseId: rider.storeId || "store-1",
            payoutNumber: `PAY-2026-G${Math.floor(Math.random() * 9000) + 1000}`,
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: endDate.format("YYYY-MM-DD"),
            totalDeliveries: deliveriesCount,
            baseSalary,
            incentive: calculatedIncentive,
            bonus: Number(bonus) || 0,
            penalties: Number(penalty) || 0,
            totalAmount: baseSalary + calculatedIncentive + (Number(bonus) || 0) - (Number(penalty) || 0),
            paymentStatus: "Pending",
            paidDate: null,
            paymentMethod: null
          };
          newRecords.push(record);
        });

        setPayouts(prev => [...newRecords, ...prev]);
        setLoading(false);
        toast.success("Payout generated successfully.");
        resolve(true);
      }, 1000);
    });
  }, [ridersList]);

  const markAsPaid = useCallback((id, paymentDetails) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { paymentMethod, transactionId, paidDate, remarks } = paymentDetails;
        
        setPayouts(prev => 
          prev.map(p => {
            if (p._id === id) {
              return {
                ...p,
                paymentStatus: "Paid",
                paidDate: paidDate.format("YYYY-MM-DD"),
                paymentMethod,
                transactionId: transactionId || "N/A",
                remarks: remarks || ""
              };
            }
            return p;
          })
        );
        toast.success("Payment updated successfully.");
        resolve(true);
      }, 500);
    });
  }, []);

  const bulkMarkAsPaid = useCallback((ids) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        setPayouts(prev => 
          prev.map(p => {
            if (ids.includes(p._id)) {
              return {
                ...p,
                paymentStatus: "Paid",
                paidDate: todayStr,
                paymentMethod: "Bank Transfer",
                transactionId: `BULK-TXN-${Math.floor(Math.random() * 90000) + 10000}`
              };
            }
            return p;
          })
        );
        toast.success("Selected payouts marked as paid successfully.");
        resolve(true);
      }, 800);
    });
  }, []);

  const fetchPayoutDetails = useCallback((id) => {
    setLoadingDetails(true);
    setSelectedPayoutId(id);

    setTimeout(() => {
      const payout = payouts.find(p => p._id === id);
      const rider = ridersList.find(r => r.id === payout?.riderId);

      if (!payout || !rider) {
        toast.error("Rider payout details not found.");
        setLoadingDetails(false);
        return;
      }

      // Simulated attendance details
      const attendance = {
        presentDays: Math.floor(Math.random() * 3) + 12, // out of 15
        absentDays: Math.floor(Math.random() * 2),
        lateDays: Math.floor(Math.random() * 2),
        workingHours: 120
      };

      // Mock previous payouts table
      const previousPayouts = payouts.filter(p => p.riderId === payout.riderId && p._id !== id);

      setPayoutDetails({
        ...payout,
        riderName: rider.name,
        phone: rider.phone,
        vehicle: rider.vehicleType,
        rating: rider.rating,
        attendanceInfo: {
          ...attendance,
          pct: Math.round((attendance.presentDays / 15) * 100)
        },
        previousPayouts,
        performance: {
          totalDeliveries: payout.totalDeliveries,
          completed: Math.round(payout.totalDeliveries * 0.98),
          avgRating: rider.rating,
          attendancePct: Math.round((attendance.presentDays / 15) * 100),
          cancelled: Math.round(payout.totalDeliveries * 0.01),
          late: Math.round(payout.totalDeliveries * 0.02)
        }
      });
      setLoadingDetails(false);
    }, 400);
  }, [payouts, ridersList]);

  // Export report CSV/Excel/PDF
  const exportRiderPayoutsReport = useCallback((format, config) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `Rider_Payouts_Report_${timestamp}`;
        const records = [...filteredPayouts];

        if (format === "CSV") {
          const headers = ["Rider Name", "Payout Number", "Deliveries", "Base Salary (₹)", "Incentives (₹)", "Bonus (₹)", "Penalties (₹)", "Total (₹)", "Status", "Paid Date"];
          const csvLines = [
            headers.join(","),
            ...records.map(r => {
              const riderObj = ridersList.find(rd => rd.id === r.riderId);
              const name = riderObj ? riderObj.name : "Unknown";
              return [
                `"${name}"`,
                r.payoutNumber,
                r.totalDeliveries,
                r.baseSalary,
                r.incentive,
                r.bonus,
                r.penalties,
                r.totalAmount,
                r.paymentStatus,
                r.paidDate || "N/A"
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
          const headers = ["Rider Name", "Payout Number", "Deliveries", "Base Salary", "Incentive", "Bonus", "Penalty", "Total Amount", "Status", "Paid Date"];
          const rows = records.map(r => {
            const riderObj = ridersList.find(rd => rd.id === r.riderId);
            const name = riderObj ? riderObj.name : "Unknown";
            return `
              <tr>
                <td>${name}</td>
                <td>${r.payoutNumber}</td>
                <td>${r.totalDeliveries}</td>
                <td>₹${r.baseSalary}</td>
                <td>₹${r.incentive}</td>
                <td>₹${r.bonus}</td>
                <td>₹${r.penalties}</td>
                <td>₹${r.totalAmount}</td>
                <td>${r.paymentStatus}</td>
                <td>${r.paidDate || "N/A"}</td>
              </tr>
            `;
          }).join("");

          const html = `
            <html>
              <head><meta charset="utf-8"></head>
              <body>
                <h2>Rider Payout Ledger</h2>
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
              doc.text("Rider Payout Ledger (Franchise Admin)", 14, 15);
              doc.setFontSize(9);
              doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | All values in INR (₹)`, 14, 21);

              const rows = records.map(r => {
                const riderObj = ridersList.find(rd => rd.id === r.riderId);
                const name = riderObj ? riderObj.name : "Unknown";
                return [
                  name,
                  r.payoutNumber,
                  r.totalDeliveries,
                  `Rs. ${r.baseSalary}`,
                  `Rs. ${r.incentive}`,
                  `Rs. ${r.bonus}`,
                  `Rs. ${r.penalties}`,
                  `Rs. ${r.totalAmount}`,
                  r.paymentStatus,
                  r.paidDate || "N/A"
                ];
              });

              autoTable(doc, {
                head: [["Rider", "Payout No", "Orders", "Base", "Incentive", "Bonus", "Penalty", "Total Amount", "Status", "Paid Date"]],
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
  }, [filteredPayouts, ridersList]);

  return {
    loading,
    search,
    setSearch,
    riderFilter,
    setRiderFilter,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    ridersList,

    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalRecords: filteredPayouts.length,

    kpis,
    riderEarningsComparisonData,
    paymentStatusDistributionData,
    tableData: sortedTableData,

    selectedPayoutId,
    payoutDetails,
    loadingDetails,
    fetchPayoutDetails,
    setSelectedPayoutId,

    generatePayout,
    markAsPaid,
    bulkMarkAsPaid,
    exportRiderPayoutsReport,
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        setPayouts([...mockRiderPayouts]);
        setLoading(false);
        toast.success("Rider payout records updated successfully.");
      }, 505);
    }
  };
}
