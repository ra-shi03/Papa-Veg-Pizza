import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  mockLoyaltyMembers, 
  mockLoyaltyTransactionsExpanded, 
  mockTierHistory, 
  mockRewardRedemptions, 
  mockLoyaltyLogs 
} from "../mockData";

// Initialize Local Mock DB in localStorage if it doesn't exist
const initLoyaltyDB = () => {
  if (!localStorage.getItem("pv_loyalty_initialized")) {
    localStorage.setItem("pv_loyalty_members", JSON.stringify(mockLoyaltyMembers));
    localStorage.setItem("pv_loyalty_transactions", JSON.stringify(mockLoyaltyTransactionsExpanded));
    localStorage.setItem("pv_tier_history", JSON.stringify(mockTierHistory));
    localStorage.setItem("pv_reward_redemptions", JSON.stringify(mockRewardRedemptions));
    localStorage.setItem("pv_loyalty_logs", JSON.stringify(mockLoyaltyLogs));
    localStorage.setItem("pv_loyalty_initialized", "true");
  }
};

const getDB = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export function useLoyalty() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("All");
  const [status, setStatus] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("joinedDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Stats State
  const [stats, setStats] = useState({
    totalMembers: 0,
    bronzeCount: 0,
    silverCount: 0,
    goldCount: 0,
    platinumCount: 0,
    redeemedPoints: 0,
    activeCount: 0
  });

  // Analytics Chart Data
  const [analytics, setAnalytics] = useState({
    memberGrowth: [],
    tierDistribution: [],
    pointsActivity: []
  });

  // Detailed Member View
  const [memberDetails, setMemberDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    initLoyaltyDB();
    fetchStatsAndAnalytics();
    fetchMembersList();
  }, []);

  // Compute stats and compile Recharts data
  const fetchStatsAndAnalytics = useCallback(() => {
    initLoyaltyDB();
    const list = getDB("pv_loyalty_members");
    const trans = getDB("pv_loyalty_transactions");

    // Core Metrics
    const totalMembers = list.length;
    const bronzeCount = list.filter(m => m.tier === "Bronze").length;
    const silverCount = list.filter(m => m.tier === "Silver").length;
    const goldCount = list.filter(m => m.tier === "Gold").length;
    const platinumCount = list.filter(m => m.tier === "Platinum").length;
    const activeCount = list.filter(m => m.status === "Active").length;

    // Sum points redeemed (negative points in transactions)
    const redeemedPoints = Math.abs(
      trans
        .filter(t => t.transactionType === "Redeem")
        .reduce((sum, t) => sum + t.points, 0)
    );

    setStats({
      totalMembers,
      bronzeCount,
      silverCount,
      goldCount,
      platinumCount,
      redeemedPoints,
      activeCount
    });

    // 1. Tier Distribution pie chart data
    const tierDistribution = [
      { name: "Bronze", value: bronzeCount },
      { name: "Silver", value: silverCount },
      { name: "Gold", value: goldCount },
      { name: "Platinum", value: platinumCount }
    ];

    // 2. Points Activity bar chart data
    const earnedPoints = trans.filter(t => t.points > 0 && t.transactionType !== "Expire").reduce((sum, t) => sum + t.points, 0);
    const expiredPoints = Math.abs(trans.filter(t => t.transactionType === "Expire").reduce((sum, t) => sum + t.points, 0));

    const pointsActivity = [
      { name: "Earned", points: earnedPoints },
      { name: "Redeemed", points: redeemedPoints },
      { name: "Expired", points: expiredPoints }
    ];

    // 3. Membership Growth line chart data (past 6 months)
    const memberGrowth = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      // Count members joined on or before this month
      const count = list.filter(m => {
        const jDate = new Date(m.joinedDate);
        return jDate <= new Date(date.getFullYear(), date.getMonth() + 1, 0); // end of that month
      }).length;

      memberGrowth.push({
        month: monthLabel,
        members: count
      });
    }

    setAnalytics({
      memberGrowth,
      tierDistribution,
      pointsActivity
    });
  }, []);

  // Fetch loyalty members list with filters
  const fetchMembersList = useCallback(() => {
    setLoading(true);
    initLoyaltyDB();

    setTimeout(() => {
      const list = getDB("pv_loyalty_members");
      const users = getDB("pv_users");
      const customers = getDB("pv_customers");

      // Join customer information
      let result = list.map(m => {
        const cust = customers.find(cu => cu._id === m.customerId) || {};
        const user = users.find(u => u._id === cust.userId) || {};
        return {
          ...m,
          customerName: user.fullName || "Guest Customer",
          customerPhone: user.mobile || "N/A",
          customerEmail: user.email || "N/A",
          customerImage: user.profileImage || "",
          totalSpent: cust.totalSpent || m.totalSpent || 0
        };
      });

      // Filter by Search Query (Customer Name, Membership Number, Mobile, Email)
      if (search.trim()) {
        const term = search.toLowerCase();
        result = result.filter(item => 
          item.customerName?.toLowerCase().includes(term) ||
          item.membershipNumber?.toLowerCase().includes(term) ||
          item.customerPhone?.toLowerCase().includes(term) ||
          item.customerEmail?.toLowerCase().includes(term)
        );
      }

      // Dropdown filters
      if (tier !== "All") {
        result = result.filter(item => item.tier === tier);
      }
      if (status !== "All") {
        result = result.filter(item => item.status === status);
      }

      // Filter by Join Date
      if (dateFilter !== "All") {
        const now = new Date();
        const todayStr = now.toDateString();
        
        result = result.filter(item => {
          const joined = new Date(item.joinedDate);
          const diffTime = Math.abs(now - joined);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (dateFilter === "Today") {
            return joined.toDateString() === todayStr;
          }
          if (dateFilter === "This Week") {
            return diffDays <= 7;
          }
          if (dateFilter === "This Month") {
            return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
          }
          if (dateFilter === "Custom" && customDateRange.start && customDateRange.end) {
            const start = new Date(customDateRange.start);
            const end = new Date(customDateRange.end);
            end.setHours(23, 59, 59, 999);
            return joined >= start && joined <= end;
          }
          return true;
        });
      }

      // Sort
      result.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === "joinedDate" || sortBy === "lastActivityDate" || sortBy === "expiryDate") {
          return sortOrder === "asc" 
            ? new Date(valA || 0) - new Date(valB || 0)
            : new Date(valB || 0) - new Date(valA || 0);
        }

        if (sortBy === "totalPoints" || sortBy === "availablePoints" || sortBy === "totalSpent") {
          return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        }

        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });

      // Pagination
      setTotalCount(result.length);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedList = result.slice(startIndex, startIndex + pageSize);
      setMembers(paginatedList);
      setLoading(false);
    }, 450);
  }, [search, tier, status, dateFilter, customDateRange, sortBy, sortOrder, currentPage, pageSize]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchMembersList();
  }, [fetchMembersList]);

  // Fetch populated member details
  const fetchMemberDetails = useCallback((id) => {
    setLoadingDetails(true);
    initLoyaltyDB();

    setTimeout(() => {
      const list = getDB("pv_loyalty_members");
      const users = getDB("pv_users");
      const customers = getDB("pv_customers");
      const trans = getDB("pv_loyalty_transactions");
      const tierHist = getDB("pv_tier_history");
      const redemptions = getDB("pv_reward_redemptions");
      const logs = getDB("pv_loyalty_logs");

      const member = list.find(m => m._id === id);
      if (!member) {
        toast.error("Loyalty member not found");
        setLoadingDetails(false);
        return;
      }

      // Customer Info
      const cust = customers.find(cu => cu._id === member.customerId) || {};
      const user = users.find(u => u._id === cust.userId) || {};
      const customerPopulated = {
        ...cust,
        ...user,
        _id: cust._id,
        userId: cust.userId
      };

      // Filter detail metrics
      const memberTrans = trans.filter(t => t.memberId === id);
      const memberTierHistory = tierHist.filter(t => t.memberId === id);
      const memberRedemptions = redemptions.filter(r => r.memberId === id);
      const memberLogs = logs.filter(l => l.memberId === id);

      setMemberDetails({
        ...member,
        customer: customerPopulated,
        transactions: memberTrans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        tierHistory: memberTierHistory.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt)),
        rewardRedemptions: memberRedemptions.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt)),
        logs: memberLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

      setLoadingDetails(false);
    }, 300);
  }, []);

  // 1. Enroll Member
  const enrollMember = useCallback((data) => {
    initLoyaltyDB();
    const list = getDB("pv_loyalty_members");
    const logs = getDB("pv_loyalty_logs");

    // Check if customer already enrolled
    const exists = list.find(m => m.customerId === data.customerId);
    if (exists) {
      toast.error("Customer is already enrolled in the Loyalty program!");
      return false;
    }

    const newMemberId = `lm-${Date.now()}`;
    const membershipNumber = `PVP-LOY-${Math.floor(10000 + Math.random() * 90000)}`;

    const newMember = {
      _id: newMemberId,
      customerId: data.customerId,
      membershipNumber,
      tier: data.initialTier,
      totalPoints: Number(data.initialPoints) || 0,
      availablePoints: Number(data.initialPoints) || 0,
      redeemedPoints: 0,
      totalSpent: 0,
      joinedDate: new Date().toISOString(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : new Date(Date.now() + 365*24*60*60*1000).toISOString(), // +1 year
      status: "Active",
      lastActivityDate: new Date().toISOString()
    };

    list.push(newMember);
    setDB("pv_loyalty_members", list);

    // Create log
    logs.push({
      _id: `llog-${Date.now()}`,
      memberId: newMemberId,
      action: "Membership Created",
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_loyalty_logs", logs);

    // Create first transaction if points given
    if (Number(data.initialPoints) > 0) {
      const trans = getDB("pv_loyalty_transactions");
      trans.push({
        _id: `lt-${Date.now()}`,
        memberId: newMemberId,
        orderId: "N/A",
        transactionType: "Earn",
        points: Number(data.initialPoints),
        remarks: "Welcome initial points bonus",
        createdAt: new Date().toISOString()
      });
      setDB("pv_loyalty_transactions", trans);
    }

    fetchMembersList();
    fetchStatsAndAnalytics();

    toast.success(`Enrolled successfully! Membership No: ${membershipNumber}`);
    return true;
  }, [fetchMembersList, fetchStatsAndAnalytics]);

  // 2. Adjust Points
  const adjustPoints = useCallback((memberId, data) => {
    initLoyaltyDB();
    const list = getDB("pv_loyalty_members");
    const trans = getDB("pv_loyalty_transactions");
    const logs = getDB("pv_loyalty_logs");

    const index = list.findIndex(m => m._id === memberId);
    if (index === -1) return false;

    const pointsNum = Number(data.points);
    const isAddition = data.adjustmentType === "Add Points";
    const netPoints = isAddition ? pointsNum : -pointsNum;

    // Check available points for deduction
    if (!isAddition && list[index].availablePoints < pointsNum) {
      toast.error(`Insufficient points! Available points: ${list[index].availablePoints}`);
      return false;
    }

    // Update member points
    list[index].availablePoints += netPoints;
    if (isAddition) {
      list[index].totalPoints += netPoints;
    } else {
      list[index].redeemedPoints += pointsNum;
    }
    list[index].lastActivityDate = new Date().toISOString();

    setDB("pv_loyalty_members", list);

    // Create transaction entry
    const newTransId = `lt-${Date.now()}`;
    trans.push({
      _id: newTransId,
      memberId: memberId,
      orderId: "N/A",
      transactionType: "Adjust",
      points: netPoints,
      remarks: data.remarks || data.reason || "Manual points adjustment",
      createdAt: new Date().toISOString()
    });
    setDB("pv_loyalty_transactions", trans);

    // Create log entry
    logs.push({
      _id: `llog-${Date.now()}`,
      memberId: memberId,
      action: "Points Adjusted",
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_loyalty_logs", logs);

    fetchMembersList();
    fetchStatsAndAnalytics();
    fetchMemberDetails(memberId);

    toast.success(`Successfully adjusted points! net: ${netPoints > 0 ? "+" : ""}${netPoints}`);
    return true;
  }, [fetchMembersList, fetchStatsAndAnalytics, fetchMemberDetails]);

  // 3. Upgrade Tier
  const upgradeTier = useCallback((memberId, data) => {
    initLoyaltyDB();
    const list = getDB("pv_loyalty_members");
    const tierHist = getDB("pv_tier_history");
    const logs = getDB("pv_loyalty_logs");

    const index = list.findIndex(m => m._id === memberId);
    if (index === -1) return false;

    const oldTier = list[index].tier;
    const newTier = data.newTier;

    if (oldTier === newTier) {
      toast.error(`Member is already in ${newTier} tier`);
      return false;
    }

    list[index].tier = newTier;
    list[index].lastActivityDate = new Date().toISOString();
    setDB("pv_loyalty_members", list);

    // Create tier history entry
    tierHist.push({
      _id: `th-${Date.now()}`,
      memberId: memberId,
      oldTier,
      newTier,
      changedAt: new Date().toISOString(),
      changedBy: "Admin Shubham",
      reason: data.reason || "Manual tier update"
    });
    setDB("pv_tier_history", tierHist);

    // Create log entry
    logs.push({
      _id: `llog-${Date.now()}`,
      memberId: memberId,
      action: "Tier Upgraded",
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_loyalty_logs", logs);

    fetchMembersList();
    fetchStatsAndAnalytics();
    fetchMemberDetails(memberId);

    toast.success(`Upgraded tier from ${oldTier} to ${newTier}`);
    return true;
  }, [fetchMembersList, fetchStatsAndAnalytics, fetchMemberDetails]);

  // 4. Suspend Member
  const suspendMember = useCallback((memberId, data) => {
    initLoyaltyDB();
    const list = getDB("pv_loyalty_members");
    const logs = getDB("pv_loyalty_logs");

    const index = list.findIndex(m => m._id === memberId);
    if (index === -1) return false;

    const isSuspended = list[index].status === "Suspended";
    const nextStatus = isSuspended ? "Active" : "Suspended";

    list[index].status = nextStatus;
    list[index].lastActivityDate = new Date().toISOString();
    setDB("pv_loyalty_members", list);

    // Create log entry
    logs.push({
      _id: `llog-${Date.now()}`,
      memberId: memberId,
      action: isSuspended ? "Reactivated" : "Suspended",
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_loyalty_logs", logs);

    fetchMembersList();
    fetchStatsAndAnalytics();
    fetchMemberDetails(memberId);

    if (isSuspended) {
      toast.success("Membership reactivated successfully");
    } else {
      toast.warning(`Membership suspended: ${data.reason || "No reason given"}`);
    }
    return true;
  }, [fetchMembersList, fetchStatsAndAnalytics, fetchMemberDetails]);

  // Export Statement
  const exportStatement = useCallback((format, exportFilters) => {
    const list = getDB("pv_loyalty_members");
    const users = getDB("pv_users");
    const customers = getDB("pv_customers");

    let result = list.map(m => {
      const cust = customers.find(cu => cu._id === m.customerId) || {};
      const user = users.find(u => u._id === cust.userId) || {};
      return {
        ...m,
        customerName: user.fullName || "Guest",
        customerPhone: user.mobile || "N/A",
        customerEmail: user.email || "N/A"
      };
    });

    if (exportFilters.tier && exportFilters.tier !== "All") {
      result = result.filter(item => item.tier === exportFilters.tier);
    }
    if (exportFilters.status && exportFilters.status !== "All") {
      result = result.filter(item => item.status === exportFilters.status);
    }
    if (exportFilters.dateRange && exportFilters.dateRange.start && exportFilters.dateRange.end) {
      const start = new Date(exportFilters.dateRange.start);
      const end = new Date(exportFilters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const joined = new Date(item.joinedDate);
        return joined >= start && joined <= end;
      });
    }

    if (result.length === 0) {
      toast.error("No loyalty members matches export filter criteria");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `loyalty_members_export_${timestamp}`;

    if (format === "CSV") {
      const headers = ["Membership Number", "Customer Name", "Phone", "Email", "Tier", "Total Points", "Available Points", "Redeemed Points", "Lifetime Spend", "Join Date", "Status"];
      const csvContent = [
        headers.join(","),
        ...result.map(m => [
          m.membershipNumber,
          `"${m.customerName.replace(/"/g, '""')}"`,
          m.customerPhone,
          m.customerEmail,
          m.tier,
          m.totalPoints,
          m.availablePoints,
          m.redeemedPoints,
          m.totalSpent,
          new Date(m.joinedDate).toLocaleDateString("en-IN"),
          m.status
        ].join(","))
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("CSV Statement downloaded");
    } else if (format === "Excel") {
      const headers = ["Membership Number", "Customer Name", "Phone", "Email", "Tier", "Total Points", "Available Points", "Redeemed Points", "Lifetime Spend", "Join Date", "Status"];
      const tableRows = result.map(m => `
        <tr>
          <td>${m.membershipNumber}</td>
          <td>${m.customerName}</td>
          <td>${m.customerPhone}</td>
          <td>${m.customerEmail}</td>
          <td>${m.tier}</td>
          <td>${m.totalPoints}</td>
          <td>${m.availablePoints}</td>
          <td>${m.redeemedPoints}</td>
          <td>₹${m.totalSpent}</td>
          <td>${new Date(m.joinedDate).toLocaleDateString("en-IN")}</td>
          <td>${m.status}</td>
        </tr>
      `).join("");

      const html = `
        <html>
          <head><meta charset="utf-8"></head>
          <body>
            <table border="1">
              <tr style="background:#f2f2f2; font-weight:bold;">
                ${headers.map(h => `<th>${h}</th>`).join("")}
              </tr>
              ${tableRows}
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
      toast.success("Excel Statement downloaded");
    } else if (format === "PDF") {
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF({ orientation: 'landscape' });
          doc.setFontSize(16);
          doc.text('Loyalty Members Statement Report', 14, 15);
          doc.setFontSize(10);
          doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | Total Members: ${result.length}`, 14, 22);

          const bodyData = result.map(m => [
            m.membershipNumber,
            m.customerName,
            m.customerPhone,
            m.tier,
            m.totalPoints,
            m.availablePoints,
            m.redeemedPoints,
            `Rs. ${m.totalSpent}`,
            new Date(m.joinedDate).toLocaleDateString("en-IN"),
            m.status
          ]);

          autoTable(doc, {
            head: [["Mem No", "Customer", "Phone", "Tier", "Total Pts", "Available Pts", "Redeemed", "Spend", "Join Date", "Status"]],
            body: bodyData,
            startY: 28,
            styles: { fontSize: 8 }
          });

          doc.save(`${filename}.pdf`);
          toast.success("PDF Statement downloaded");
        });
      });
    }
  }, []);

  return {
    members,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    tier,
    setTier,
    status,
    setStatus,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    analytics,
    memberDetails,
    loadingDetails,
    fetchMemberDetails,
    enrollMember,
    adjustPoints,
    upgradeTier,
    suspendMember,
    exportStatement,
    refetch: fetchMembersList
  };
}
