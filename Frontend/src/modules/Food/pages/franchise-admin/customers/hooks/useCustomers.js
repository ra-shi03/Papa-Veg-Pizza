import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  mockUsers,
  mockCustomers,
  mockOrders,
  mockCustomerAddresses,
  mockReviews,
  mockLoyaltyTransactions,
  mockComplaints,
  mockCustomerBlocks,
  mockActivityLogs,
  mockStores
} from "../mockData";

// Initialize Local Mock DB in localStorage if it doesn't exist
const initMockDB = () => {
  if (!localStorage.getItem("pv_db_initialized")) {
    localStorage.setItem("pv_users", JSON.stringify(mockUsers));
    localStorage.setItem("pv_customers", JSON.stringify(mockCustomers));
    localStorage.setItem("pv_orders", JSON.stringify(mockOrders));
    localStorage.setItem("pv_addresses", JSON.stringify(mockCustomerAddresses));
    localStorage.setItem("pv_reviews", JSON.stringify(mockReviews));
    localStorage.setItem("pv_loyalty_transactions", JSON.stringify(mockLoyaltyTransactions));
    localStorage.setItem("pv_complaints", JSON.stringify(mockComplaints));
    localStorage.setItem("pv_blocks", JSON.stringify(mockCustomerBlocks));
    localStorage.setItem("pv_activity_logs", JSON.stringify(mockActivityLogs));
    localStorage.setItem("pv_db_initialized", "true");
  }
};

const getDB = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState("All");
  const [status, setStatus] = useState("All");
  const [storeId, setStoreId] = useState("All");
  const [orderCountFilter, setOrderCountFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Stats State
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    vipCustomers: 0,
    avgOrderValue: 0,
    lifetimeRevenue: 0
  });

  // Selected Customer Detail State
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initialize DB
  useEffect(() => {
    initMockDB();
    fetchStats();
    fetchCustomersList();
  }, []);

  // Fetch stats from Local Mock DB
  const fetchStats = useCallback(() => {
    initMockDB();
    const users = getDB("pv_users");
    const custs = getDB("pv_customers");

    const totalCustomers = custs.length;
    const activeCustomers = users.filter(u => u.status === "Active").length;

    // New Customers this month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const newCustomersThisMonth = users.filter(u => {
      const created = new Date(u.createdAt);
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;

    const vipCustomers = custs.filter(c => c.customerType === "VIP").length;

    // Lifetime Revenue & Average Order Value
    const totalSpent = custs.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = custs.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? parseFloat((totalSpent / totalOrders).toFixed(2)) : 0;

    setStats({
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      vipCustomers,
      avgOrderValue,
      lifetimeRevenue: totalSpent
    });
  }, []);

  // Fetch list of customers based on search & filters (simulates server-side query)
  const fetchCustomersList = useCallback(() => {
    setLoading(true);
    initMockDB();
    
    // Simulate slight network delay
    setTimeout(() => {
      const users = getDB("pv_users");
      const custs = getDB("pv_customers");

      // Join users + customers
      let list = custs.map(c => {
        const user = users.find(u => u._id === c.userId) || {};
        return {
          ...c,
          ...user,
          _id: c._id, // ensure customer _id is used
          userId: c.userId
        };
      });

      // Filter by Search Query (Name, Email, Mobile)
      if (search.trim()) {
        const term = search.toLowerCase();
        list = list.filter(item => 
          item.fullName?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.mobile?.includes(term)
        );
      }

      // Filter by Customer Type
      if (customerType !== "All") {
        list = list.filter(item => item.customerType === customerType);
      }

      // Filter by Status
      if (status !== "All") {
        list = list.filter(item => item.status === status);
      }

      // Filter by Favorite Store
      if (storeId !== "All") {
        list = list.filter(item => item.favoriteStoreId === storeId);
      }

      // Filter by Order Count
      if (orderCountFilter !== "All") {
        if (orderCountFilter === "1-5") {
          list = list.filter(item => item.totalOrders >= 1 && item.totalOrders <= 5);
        } else if (orderCountFilter === "5-10") {
          list = list.filter(item => item.totalOrders >= 5 && item.totalOrders <= 10);
        } else if (orderCountFilter === "10+") {
          list = list.filter(item => item.totalOrders > 10);
        }
      }

      // Filter by Date Joined
      if (dateFilter !== "All") {
        const now = new Date();
        const todayStr = now.toDateString();
        
        list = list.filter(item => {
          const joined = new Date(item.createdAt);
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
          if (dateFilter === "Custom Range" && customDateRange.start && customDateRange.end) {
            const start = new Date(customDateRange.start);
            const end = new Date(customDateRange.end);
            end.setHours(23, 59, 59, 999);
            return joined >= start && joined <= end;
          }
          return true;
        });
      }

      // Sort
      list.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === "fullName" || sortBy === "customerType" || sortBy === "status") {
          valA = (valA || "").toLowerCase();
          valB = (valB || "").toLowerCase();
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        valA = Number(valA) || valA || 0;
        valB = Number(valB) || valB || 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });

      // Pagination
      setTotalCount(list.length);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedList = list.slice(startIndex, startIndex + pageSize);
      setCustomers(paginatedList);
      setLoading(false);
    }, 400);
  }, [search, customerType, status, storeId, orderCountFilter, dateFilter, customDateRange, sortBy, sortOrder, currentPage, pageSize]);

  // Re-fetch when dependencies change
  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  // Fetch full details of a customer for the Drawer (fully populated)
  const fetchCustomerDetails = useCallback((id) => {
    setLoadingDetails(true);
    initMockDB();

    setTimeout(() => {
      const users = getDB("pv_users");
      const custs = getDB("pv_customers");
      const orders = getDB("pv_orders");
      const addresses = getDB("pv_addresses");
      const reviews = getDB("pv_reviews");
      const complaints = getDB("pv_complaints");
      const activities = getDB("pv_activity_logs");

      const customer = custs.find(c => c._id === id);
      if (!customer) {
        toast.error("Customer record not found");
        setLoadingDetails(false);
        return;
      }

      const user = users.find(u => u._id === customer.userId) || {};

      // Filter matching sub-collections
      const customerOrders = orders.filter(o => o.customerId === id);
      const customerAddresses = addresses.filter(a => a.customerId === id);
      const customerReviews = reviews.filter(r => r.customerId === id);
      const customerComplaints = complaints.filter(c => c.customerId === id);
      const customerActivities = activities.filter(a => a.customerId === id);

      // Sort timeline chronologically (latest first)
      customerActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setCustomerDetails({
        ...customer,
        ...user,
        _id: customer._id,
        userId: customer.userId,
        orders: customerOrders,
        addresses: customerAddresses,
        reviews: customerReviews,
        complaints: customerComplaints,
        activities: customerActivities
      });

      setLoadingDetails(false);
    }, 300);
  }, []);

  // Update Customer profile details
  const updateCustomer = useCallback((id, updatedFields) => {
    initMockDB();
    const users = getDB("pv_users");
    const custs = getDB("pv_customers");

    const customerIndex = custs.findIndex(c => c._id === id);
    if (customerIndex === -1) {
      toast.error("Customer not found");
      return false;
    }

    const userId = custs[customerIndex].userId;
    const userIndex = users.findIndex(u => u._id === userId);

    // Update customer fields
    custs[customerIndex] = {
      ...custs[customerIndex],
      customerType: updatedFields.customerType || custs[customerIndex].customerType,
      favoriteStoreId: updatedFields.favoriteStoreId || custs[customerIndex].favoriteStoreId,
      tags: updatedFields.tags || custs[customerIndex].tags,
      updatedAt: new Date().toISOString()
    };

    // Update user fields
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        fullName: updatedFields.fullName || users[userIndex].fullName,
        email: updatedFields.email || users[userIndex].email,
        mobile: updatedFields.mobile || users[userIndex].mobile,
        isVerified: updatedFields.isVerified !== undefined ? updatedFields.isVerified : users[userIndex].isVerified
      };
    }

    setDB("pv_users", users);
    setDB("pv_customers", custs);

    // Add activity log
    const activities = getDB("pv_activity_logs");
    activities.push({
      _id: `act-${Date.now()}`,
      customerId: id,
      activityType: "Admin Notes",
      description: "Profile information updated by Admin",
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_activity_logs", activities);

    fetchCustomersList();
    fetchStats();
    
    // Refresh details if open
    fetchCustomerDetails(id);
    
    toast.success("Customer profile updated successfully");
    return true;
  }, [fetchCustomersList, fetchStats, fetchCustomerDetails]);

  // Block Customer
  const blockCustomer = useCallback((id, blockDetails) => {
    initMockDB();
    const users = getDB("pv_users");
    const custs = getDB("pv_customers");
    const blocks = getDB("pv_blocks");
    const activities = getDB("pv_activity_logs");

    const customer = custs.find(c => c._id === id);
    if (!customer) return false;

    // Update status in users collection
    const updatedUsers = users.map(u => u._id === customer.userId ? { ...u, status: "Blocked" } : u);
    setDB("pv_users", updatedUsers);

    // Update blocked reason in customers collection
    const updatedCusts = custs.map(c => c._id === id ? { ...c, blockedReason: blockDetails.reason } : c);
    setDB("pv_customers", updatedCusts);

    // Create block record
    const newBlock = {
      _id: `blk-${Date.now()}`,
      customerId: id,
      reason: blockDetails.reason,
      blockedBy: "Admin Shubham",
      blockUntil: blockDetails.blockUntil || "",
      permanent: blockDetails.permanent,
      remarks: blockDetails.remarks || ""
    };
    blocks.push(newBlock);
    setDB("pv_blocks", blocks);

    // Log activity
    activities.push({
      _id: `act-${Date.now()}`,
      customerId: id,
      activityType: "Blocked/Unblocked",
      description: `Blocked: ${blockDetails.reason}. remarks: ${blockDetails.remarks || "none"}`,
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_activity_logs", activities);

    fetchCustomersList();
    fetchStats();
    fetchCustomerDetails(id);

    toast.error(`Customer blocked due to: ${blockDetails.reason}`);
    return true;
  }, [fetchCustomersList, fetchStats, fetchCustomerDetails]);

  // Unblock Customer
  const unblockCustomer = useCallback((id, unblockDetails) => {
    initMockDB();
    const users = getDB("pv_users");
    const custs = getDB("pv_customers");
    const activities = getDB("pv_activity_logs");

    const customer = custs.find(c => c._id === id);
    if (!customer) return false;

    // Update status in users
    const updatedUsers = users.map(u => u._id === customer.userId ? { ...u, status: "Active" } : u);
    setDB("pv_users", updatedUsers);

    // Remove blocked reason in customers
    const updatedCusts = custs.map(c => c._id === id ? { ...c, blockedReason: "" } : c);
    setDB("pv_customers", updatedCusts);

    // Log activity
    activities.push({
      _id: `act-${Date.now()}`,
      customerId: id,
      activityType: "Blocked/Unblocked",
      description: `Unblocked. Remarks: ${unblockDetails.remarks || "Account reactivated"}`,
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_activity_logs", activities);

    fetchCustomersList();
    fetchStats();
    fetchCustomerDetails(id);

    toast.success("Customer unblocked and active");
    return true;
  }, [fetchCustomersList, fetchStats, fetchCustomerDetails]);

  // Adjust Loyalty Points
  const adjustPoints = useCallback((id, pointsDetails) => {
    initMockDB();
    const custs = getDB("pv_customers");
    const loyTxns = getDB("pv_loyalty_transactions");
    const activities = getDB("pv_activity_logs");

    const customerIndex = custs.findIndex(c => c._id === id);
    if (customerIndex === -1) return false;

    const currentPoints = custs[customerIndex].loyaltyPoints || 0;
    const adjustedAmount = parseInt(pointsDetails.points) || 0;
    let newPoints = currentPoints;

    if (pointsDetails.type === "Credit") {
      newPoints += adjustedAmount;
    } else {
      newPoints = Math.max(0, newPoints - adjustedAmount);
    }

    custs[customerIndex].loyaltyPoints = newPoints;
    setDB("pv_customers", custs);

    // Create Loyalty Transaction
    const newTxn = {
      _id: `loy-${Date.now()}`,
      customerId: id,
      date: new Date().toISOString(),
      pointsEarned: pointsDetails.type === "Credit" ? adjustedAmount : 0,
      pointsRedeemed: pointsDetails.type === "Debit" ? adjustedAmount : 0,
      balance: newPoints,
      source: "Manual Adjustment by Admin",
      remarks: `${pointsDetails.reason} | Remarks: ${pointsDetails.remarks || "None"}`
    };
    loyTxns.push(newTxn);
    setDB("pv_loyalty_transactions", loyTxns);

    // Log Activity
    activities.push({
      _id: `act-${Date.now()}`,
      customerId: id,
      activityType: "Points Redeemed",
      description: `${pointsDetails.type}ed ${adjustedAmount} points. Balance: ${newPoints}`,
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_activity_logs", activities);

    fetchCustomersList();
    fetchCustomerDetails(id);

    toast.success(`Loyalty points adjusted: ${pointsDetails.type} of ${adjustedAmount} points.`);
    return true;
  }, [fetchCustomersList, fetchCustomerDetails]);

  // Add Internal Admin Note
  const addNote = useCallback((id, noteText) => {
    initMockDB();
    const custs = getDB("pv_customers");
    const activities = getDB("pv_activity_logs");

    const customerIndex = custs.findIndex(c => c._id === id);
    if (customerIndex === -1) return false;

    const notes = custs[customerIndex].notes || [];
    const newNoteObj = {
      id: `note-${Date.now()}`,
      note: noteText,
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    };
    
    custs[customerIndex].notes = [newNoteObj, ...notes];
    setDB("pv_customers", custs);

    // Log activity
    activities.push({
      _id: `act-${Date.now()}`,
      customerId: id,
      activityType: "Admin Notes",
      description: `Added internal note: "${noteText.substring(0, 30)}..."`,
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_activity_logs", activities);

    fetchCustomersList();
    fetchCustomerDetails(id);

    toast.success("Internal note added");
    return true;
  }, [fetchCustomersList, fetchCustomerDetails]);

  // Delete Internal Note
  const deleteNote = useCallback((id, noteId) => {
    initMockDB();
    const custs = getDB("pv_customers");
    const customerIndex = custs.findIndex(c => c._id === id);
    if (customerIndex === -1) return false;

    const notes = custs[customerIndex].notes || [];
    custs[customerIndex].notes = notes.filter(n => n.id !== noteId);
    setDB("pv_customers", custs);

    fetchCustomersList();
    fetchCustomerDetails(id);

    toast.success("Note removed");
    return true;
  }, [fetchCustomersList, fetchCustomerDetails]);

  // Add Address
  const addAddress = useCallback((id, addressDetails) => {
    initMockDB();
    const addresses = getDB("pv_addresses");
    const activities = getDB("pv_activity_logs");

    if (addressDetails.isDefault) {
      // Clear other defaults
      addresses.forEach(a => {
        if (a.customerId === id) a.isDefault = false;
      });
    }

    const newAddress = {
      _id: `addr-${Date.now()}`,
      customerId: id,
      addressType: addressDetails.addressType,
      recipientName: addressDetails.recipientName,
      phone: addressDetails.phone,
      houseNumber: addressDetails.houseNumber,
      street: addressDetails.street,
      city: addressDetails.city,
      state: addressDetails.state,
      pincode: addressDetails.pincode,
      landmark: addressDetails.landmark || "",
      latitude: addressDetails.latitude || "0.0",
      longitude: addressDetails.longitude || "0.0",
      isDefault: addressDetails.isDefault
    };

    addresses.push(newAddress);
    setDB("pv_addresses", addresses);

    // Log Activity
    activities.push({
      _id: `act-${Date.now()}`,
      customerId: id,
      activityType: "Orders Placed", // using existing type for logs
      description: `Added new ${addressDetails.addressType} address`,
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_activity_logs", activities);

    fetchCustomerDetails(id);
    toast.success("New address added successfully");
    return true;
  }, [fetchCustomerDetails]);

  // Set Default Address
  const setDefaultAddress = useCallback((id, addressId) => {
    initMockDB();
    let addresses = getDB("pv_addresses");

    addresses = addresses.map(addr => {
      if (addr.customerId === id) {
        return { ...addr, isDefault: addr._id === addressId };
      }
      return addr;
    });

    setDB("pv_addresses", addresses);
    fetchCustomerDetails(id);
    toast.success("Default address updated");
    return true;
  }, [fetchCustomerDetails]);

  // Delete Address
  const deleteAddress = useCallback((id, addressId) => {
    initMockDB();
    const addresses = getDB("pv_addresses");
    const filtered = addresses.filter(addr => !(addr.customerId === id && addr._id === addressId));
    setDB("pv_addresses", filtered);

    fetchCustomerDetails(id);
    toast.success("Address deleted");
    return true;
  }, [fetchCustomerDetails]);

  // Delete Customer
  const deleteCustomer = useCallback((id) => {
    initMockDB();
    const users = getDB("pv_users");
    const custs = getDB("pv_customers");

    const customer = custs.find(c => c._id === id);
    if (!customer) return false;

    const filteredCusts = custs.filter(c => c._id !== id);
    const filteredUsers = users.filter(u => u._id !== customer.userId);

    setDB("pv_customers", filteredCusts);
    setDB("pv_users", filteredUsers);

    fetchCustomersList();
    fetchStats();
    toast.error("Customer deleted successfully");
    return true;
  }, [fetchCustomersList, fetchStats]);

  // Export Customers (handles formatted data)
  const exportCustomers = useCallback((format, exportFilters) => {
    const users = getDB("pv_users");
    const custs = getDB("pv_customers");

    let list = custs.map(c => {
      const user = users.find(u => u._id === c.userId) || {};
      return {
        ...c,
        ...user
      };
    });

    // Apply export filters
    if (exportFilters.customerType && exportFilters.customerType !== "All") {
      list = list.filter(item => item.customerType === exportFilters.customerType);
    }
    if (exportFilters.status && exportFilters.status !== "All") {
      list = list.filter(item => item.status === exportFilters.status);
    }
    if (exportFilters.dateRange && exportFilters.dateRange.start && exportFilters.dateRange.end) {
      const start = new Date(exportFilters.dateRange.start);
      const end = new Date(exportFilters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      list = list.filter(item => {
        const joined = new Date(item.createdAt);
        return joined >= start && joined <= end;
      });
    }

    if (list.length === 0) {
      toast.error("No customers matched export criteria");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `customer_export_${timestamp}`;

    if (format === "CSV") {
      const headers = ["ID", "Name", "Email", "Mobile", "Type", "Total Orders", "Spent (INR)", "Points", "Joined Date", "Status"];
      const csvRows = [
        headers.join(","),
        ...list.map(c => [
          c._id,
          `"${(c.fullName || "").replace(/"/g, '""')}"`,
          c.email || "N/A",
          c.mobile || "N/A",
          c.customerType || "Regular",
          c.totalOrders || 0,
          c.totalSpent || 0,
          c.loyaltyPoints || 0,
          new Date(c.createdAt).toLocaleDateString("en-IN"),
          c.status || "Active"
        ].join(","))
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("CSV Export downloaded");
    } else if (format === "Excel") {
      const headers = ["ID", "Name", "Email", "Mobile", "Type", "Total Orders", "Spent (INR)", "Points", "Joined Date", "Status"];
      const tableRows = list.map(c => `
        <tr>
          <td>${c._id}</td>
          <td>${c.fullName || ""}</td>
          <td>${c.email || ""}</td>
          <td>${c.mobile || ""}</td>
          <td>${c.customerType}</td>
          <td>${c.totalOrders}</td>
          <td>${c.totalSpent}</td>
          <td>${c.loyaltyPoints}</td>
          <td>${new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
          <td>${c.status}</td>
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
      toast.success("Excel Export downloaded");
    } else if (format === "PDF") {
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF({ orientation: 'landscape' });
          doc.setFontSize(16);
          doc.text('Customer Database Report (Franchise)', 14, 15);
          doc.setFontSize(10);
          doc.text(`Generated on: ${new Date().toLocaleString("en-IN")} | Records: ${list.length}`, 14, 22);

          const bodyData = list.map(c => [
            c._id,
            c.fullName || "N/A",
            c.email || "N/A",
            c.mobile || "N/A",
            c.customerType,
            c.totalOrders,
            `INR ${c.totalSpent}`,
            c.loyaltyPoints,
            new Date(c.createdAt).toLocaleDateString("en-IN"),
            c.status
          ]);

          autoTable(doc, {
            head: [["ID", "Name", "Email", "Mobile", "Type", "Orders", "Spent", "Points", "Joined", "Status"]],
            body: bodyData,
            startY: 28,
            styles: { fontSize: 8 }
          });

          doc.save(`${filename}.pdf`);
          toast.success("PDF Export downloaded");
        });
      });
    }
  }, []);

  return {
    customers,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    customerType,
    setCustomerType,
    status,
    setStatus,
    storeId,
    setStoreId,
    orderCountFilter,
    setOrderCountFilter,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    customerDetails,
    loadingDetails,
    fetchCustomerDetails,
    updateCustomer,
    blockCustomer,
    unblockCustomer,
    adjustPoints,
    addNote,
    deleteNote,
    addAddress,
    setDefaultAddress,
    deleteAddress,
    deleteCustomer,
    exportCustomers,
    refetch: fetchCustomersList
  };
}
