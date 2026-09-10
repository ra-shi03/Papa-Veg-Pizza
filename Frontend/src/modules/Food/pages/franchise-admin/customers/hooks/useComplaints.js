import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  mockCustomerComplaintsExpanded, 
  mockComplaintLogs, 
  mockComplaintNotes, 
  mockEmployees,
  mockStores
} from "../mockData";

// Initialize Local Mock DB in localStorage if it doesn't exist
const initMockDB = () => {
  if (!localStorage.getItem("pv_complaints_initialized")) {
    localStorage.setItem("pv_complaints", JSON.stringify(mockCustomerComplaintsExpanded));
    localStorage.setItem("pv_complaint_logs", JSON.stringify(mockComplaintLogs));
    localStorage.setItem("pv_complaint_notes", JSON.stringify(mockComplaintNotes));
    localStorage.setItem("pv_complaints_initialized", "true");
  }
};

const getDB = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export function useComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState("All");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [assignedTo, setAssignedTo] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Stats State
  const [stats, setStats] = useState({
    openComplaints: 0,
    highPriority: 0,
    escalated: 0,
    resolvedToday: 0,
    avgResolutionTimeHours: 0,
    totalComplaintsThisMonth: 0
  });

  // Detailed Complaint view
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    initMockDB();
    fetchStats();
    fetchComplaintsList();
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(() => {
    initMockDB();
    const list = getDB("pv_complaints");

    const openComplaints = list.filter(c => c.status === "Open").length;
    const highPriority = list.filter(c => c.priority === "High" || c.priority === "Critical").length;
    const escalated = list.filter(c => c.status === "Escalated").length;

    // Resolved today
    const now = new Date();
    const todayStr = now.toDateString();
    const resolvedToday = list.filter(c => {
      if (c.status !== "Resolved" || !c.resolvedAt) return false;
      const resDate = new Date(c.resolvedAt);
      return resDate.toDateString() === todayStr;
    }).length;

    // Avg resolution time in hours
    const resolvedTickets = list.filter(c => c.handlingTimeHours !== null && c.handlingTimeHours !== undefined);
    const totalHours = resolvedTickets.reduce((sum, c) => sum + c.handlingTimeHours, 0);
    const avgResolutionTimeHours = resolvedTickets.length > 0 
      ? parseFloat((totalHours / resolvedTickets.length).toFixed(1))
      : 0;

    // Total complaints this month
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const totalComplaintsThisMonth = list.filter(c => {
      const created = new Date(c.createdAt);
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;

    setStats({
      openComplaints,
      highPriority,
      escalated,
      resolvedToday,
      avgResolutionTimeHours,
      totalComplaintsThisMonth
    });
  }, []);

  // Fetch list with filters
  const fetchComplaintsList = useCallback(() => {
    setLoading(true);
    initMockDB();

    setTimeout(() => {
      const list = getDB("pv_complaints");
      const users = getDB("pv_users");
      const stores = mockStores;

      // Join customer information
      let result = list.map(c => {
        // Find customer user object
        const cust = getDB("pv_customers").find(cu => cu._id === c.customerId) || {};
        const user = users.find(u => u._id === cust.userId) || {};
        const store = stores.find(s => s.id === c.storeId) || {};
        return {
          ...c,
          customerName: user.fullName || "Guest Customer",
          customerPhone: user.mobile || "N/A",
          storeName: store.name || "N/A"
        };
      });

      // Filter by Search Query (Ticket ID, Customer Name, Order ID, Phone Number)
      if (search.trim()) {
        const term = search.toLowerCase();
        result = result.filter(item => 
          item.ticketNumber?.toLowerCase().includes(term) ||
          item.customerName?.toLowerCase().includes(term) ||
          item.orderId?.toLowerCase().includes(term) ||
          item.customerPhone?.includes(term)
        );
      }

      // Dropdown filters
      if (storeId !== "All") {
        result = result.filter(item => item.storeId === storeId);
      }
      if (category !== "All") {
        result = result.filter(item => item.category === category);
      }
      if (priority !== "All") {
        result = result.filter(item => item.priority === priority);
      }
      if (status !== "All") {
        result = result.filter(item => item.status === status);
      }
      if (assignedTo !== "All") {
        result = result.filter(item => item.assignedTo === assignedTo);
      }

      // Filter by Date Created Range
      if (dateFilter !== "All") {
        const now = new Date();
        const todayStr = now.toDateString();
        
        result = result.filter(item => {
          const created = new Date(item.createdAt);
          const diffTime = Math.abs(now - created);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (dateFilter === "Today") {
            return created.toDateString() === todayStr;
          }
          if (dateFilter === "This Week") {
            return diffDays <= 7;
          }
          if (dateFilter === "This Month") {
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }
          if (dateFilter === "Custom Range" && customDateRange.start && customDateRange.end) {
            const start = new Date(customDateRange.start);
            const end = new Date(customDateRange.end);
            end.setHours(23, 59, 59, 999);
            return created >= start && created <= end;
          }
          return true;
        });
      }

      // Sort
      result.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === "ticketNumber" || sortBy === "category" || sortBy === "priority" || sortBy === "status") {
          valA = (valA || "").toLowerCase();
          valB = (valB || "").toLowerCase();
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        valA = Number(valA) || valA || 0;
        valB = Number(valB) || valB || 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });

      // Pagination
      setTotalCount(result.length);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedList = result.slice(startIndex, startIndex + pageSize);
      setComplaints(paginatedList);
      setLoading(false);
    }, 450);
  }, [search, storeId, category, priority, status, assignedTo, dateFilter, customDateRange, sortBy, sortOrder, currentPage, pageSize]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchComplaintsList();
  }, [fetchComplaintsList]);

  // Fetch populated complaint details
  const fetchComplaintDetails = useCallback((id) => {
    setLoadingDetails(true);
    initMockDB();

    setTimeout(() => {
      const list = getDB("pv_complaints");
      const users = getDB("pv_users");
      const orders = getDB("pv_orders");
      const stores = mockStores;
      const logs = getDB("pv_complaint_logs");
      const notes = getDB("pv_complaint_notes");

      const complaint = list.find(c => c._id === id);
      if (!complaint) {
        toast.error("Complaint ticket not found");
        setLoadingDetails(false);
        return;
      }

      // Customer Info
      const cust = getDB("pv_customers").find(cu => cu._id === complaint.customerId) || {};
      const user = users.find(u => u._id === cust.userId) || {};
      const customerPopulated = {
        ...cust,
        ...user,
        _id: cust._id,
        userId: cust.userId
      };

      // Order Info
      const orderPopulated = orders.find(o => o._id === complaint.orderId || o.orderNumber === complaint.orderId) || null;

      // Filter sub-collections
      const ticketLogs = logs.filter(l => l.complaintId === id);
      const ticketNotes = notes.filter(n => n.complaintId === id);
      const storeObj = stores.find(s => s.id === complaint.storeId) || {};

      setComplaintDetails({
        ...complaint,
        storeName: storeObj.name || "N/A",
        customer: customerPopulated,
        order: orderPopulated,
        logs: ticketLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        notes: ticketNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

      setLoadingDetails(false);
    }, 300);
  }, []);

  // 1. Create Ticket
  const createComplaint = useCallback((data) => {
    initMockDB();
    const list = getDB("pv_complaints");
    const logs = getDB("pv_complaint_logs");

    const tktNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTicket = {
      _id: `comp-${Date.now()}`,
      ticketNumber: tktNumber,
      customerId: data.customerId,
      orderId: data.orderId,
      storeId: data.storeId || "store-01",
      category: data.category,
      priority: data.priority,
      description: data.description,
      attachments: data.attachments || [],
      status: "Open",
      assignedTo: data.assignedTo || "",
      resolution: "",
      createdAt: new Date().toISOString(),
      resolvedAt: "",
      handlingTimeHours: null
    };

    list.unshift(newTicket);
    setDB("pv_complaints", list);

    // Timeline Log
    logs.push({
      _id: `log-${Date.now()}`,
      complaintId: newTicket._id,
      action: "Complaint Created",
      oldValue: "",
      newValue: "Open",
      performedBy: "Admin Shubham",
      timestamp: new Date().toISOString()
    });

    if (data.assignedTo) {
      logs.push({
        _id: `log-${Date.now() + 1}`,
        complaintId: newTicket._id,
        action: "Assigned To Staff",
        oldValue: "",
        newValue: data.assignedTo,
        performedBy: "Admin Shubham",
        timestamp: new Date().toISOString()
      });
      newTicket.status = "In Progress";
      setDB("pv_complaints", list);
    }

    setDB("pv_complaint_logs", logs);

    fetchComplaintsList();
    fetchStats();
    toast.success(`Complaint Ticket ${tktNumber} generated successfully`);
    return true;
  }, [fetchComplaintsList, fetchStats]);

  // 2. Assign Complaint
  const assignComplaint = useCallback((id, data) => {
    initMockDB();
    const list = getDB("pv_complaints");
    const logs = getDB("pv_complaint_logs");

    const ticketIndex = list.findIndex(c => c._id === id);
    if (ticketIndex === -1) return false;

    const oldAssignee = list[ticketIndex].assignedTo;
    list[ticketIndex].assignedTo = data.assignedTo;
    list[ticketIndex].status = "In Progress";
    list[ticketIndex].priority = data.priority || list[ticketIndex].priority;
    setDB("pv_complaints", list);

    // Logs
    logs.push({
      _id: `log-${Date.now()}`,
      complaintId: id,
      action: "Assigned To Staff",
      oldValue: oldAssignee,
      newValue: data.assignedTo,
      performedBy: "Admin Shubham",
      timestamp: new Date().toISOString()
    });
    setDB("pv_complaint_logs", logs);

    fetchComplaintsList();
    fetchStats();
    fetchComplaintDetails(id);

    toast.success(`Ticket assigned to ${data.assignedTo}`);
    return true;
  }, [fetchComplaintsList, fetchStats, fetchComplaintDetails]);

  // 3. Escalate Complaint
  const escalateComplaint = useCallback((id, data) => {
    initMockDB();
    const list = getDB("pv_complaints");
    const logs = getDB("pv_complaint_logs");

    const index = list.findIndex(c => c._id === id);
    if (index === -1) return false;

    const oldStatus = list[index].status;
    list[index].status = "Escalated";
    list[index].priority = data.priority || list[index].priority;
    setDB("pv_complaints", list);

    logs.push({
      _id: `log-${Date.now()}`,
      complaintId: id,
      action: "Escalated",
      oldValue: oldStatus,
      newValue: "Escalated",
      performedBy: "Admin Shubham",
      timestamp: new Date().toISOString()
    });
    setDB("pv_complaint_logs", logs);

    fetchComplaintsList();
    fetchStats();
    fetchComplaintDetails(id);

    toast.warning(`Ticket escalated to ${data.escalateTo}. Remarks: ${data.comments}`);
    return true;
  }, [fetchComplaintsList, fetchStats, fetchComplaintDetails]);

  // 4. Resolve Complaint
  const resolveComplaint = useCallback((id, data) => {
    initMockDB();
    const list = getDB("pv_complaints");
    const logs = getDB("pv_complaint_logs");

    const index = list.findIndex(c => c._id === id);
    if (index === -1) return false;

    const oldStatus = list[index].status;
    const createdDate = new Date(list[index].createdAt);
    const now = new Date();
    const handlingTimeHours = parseFloat((Math.abs(now - createdDate) / (1000 * 60 * 60)).toFixed(1));

    list[index].status = "Resolved";
    list[index].resolvedAt = now.toISOString();
    list[index].resolution = `Type: ${data.resolutionType}. Details: ${data.remarks}`;
    list[index].handlingTimeHours = handlingTimeHours;
    setDB("pv_complaints", list);

    // Logs
    logs.push({
      _id: `log-${Date.now()}`,
      complaintId: id,
      action: "Resolved",
      oldValue: oldStatus,
      newValue: "Resolved",
      performedBy: "Admin Shubham",
      timestamp: now.toISOString()
    });

    if (data.resolutionType === "Refund") {
      logs.push({
        _id: `log-${Date.now() + 1}`,
        complaintId: id,
        action: "Refund Initiated",
        oldValue: "",
        newValue: `₹${data.refundAmount}`,
        performedBy: "Admin Shubham",
        timestamp: now.toISOString()
      });
    } else if (data.resolutionType === "Coupon Compensation") {
      logs.push({
        _id: `log-${Date.now() + 2}`,
        complaintId: id,
        action: "Coupon Issued",
        oldValue: "",
        newValue: `Code: ${data.couponCode || 'COMP100'} (Value: ₹${data.couponValue})`,
        performedBy: "Admin Shubham",
        timestamp: now.toISOString()
      });
    }

    setDB("pv_complaint_logs", logs);

    fetchComplaintsList();
    fetchStats();
    fetchComplaintDetails(id);

    toast.success("Complaint Ticket marked as resolved");
    return true;
  }, [fetchComplaintsList, fetchStats, fetchComplaintDetails]);

  // 5. Close Ticket
  const closeTicket = useCallback((id, data) => {
    initMockDB();
    const list = getDB("pv_complaints");
    const logs = getDB("pv_complaint_logs");

    const index = list.findIndex(c => c._id === id);
    if (index === -1) return false;

    const oldStatus = list[index].status;
    list[index].status = "Closed";
    list[index].resolution += ` | Closed remarks: ${data.closingRemarks}`;
    setDB("pv_complaints", list);

    logs.push({
      _id: `log-${Date.now()}`,
      complaintId: id,
      action: "Closed",
      oldValue: oldStatus,
      newValue: "Closed",
      performedBy: "Admin Shubham",
      timestamp: new Date().toISOString()
    });
    setDB("pv_complaint_logs", logs);

    fetchComplaintsList();
    fetchStats();
    fetchComplaintDetails(id);

    toast.success("Ticket closed and locked");
    return true;
  }, [fetchComplaintsList, fetchStats, fetchComplaintDetails]);

  // 6. Delete Ticket
  const deleteComplaint = useCallback((id) => {
    initMockDB();
    const list = getDB("pv_complaints");
    const filtered = list.filter(c => c._id !== id);
    setDB("pv_complaints", filtered);

    fetchComplaintsList();
    fetchStats();
    toast.error("Complaint ticket removed from database");
    return true;
  }, [fetchComplaintsList, fetchStats]);

  // 7. Add Internal Note
  const addComplaintNote = useCallback((complaintId, noteText) => {
    initMockDB();
    const notes = getDB("pv_complaint_notes");

    const newNote = {
      _id: `note-${Date.now()}`,
      complaintId,
      note: noteText,
      createdBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    };

    notes.push(newNote);
    setDB("pv_complaint_notes", notes);

    fetchComplaintDetails(complaintId);
    toast.success("Complaint internal note added");
    return true;
  }, [fetchComplaintDetails]);

  // 8. Delete Internal Note
  const deleteComplaintNote = useCallback((complaintId, noteId) => {
    initMockDB();
    const notes = getDB("pv_complaint_notes");
    const filtered = notes.filter(n => n._id !== noteId);
    setDB("pv_complaint_notes", filtered);

    fetchComplaintDetails(complaintId);
    toast.success("Internal note removed");
    return true;
  }, [fetchComplaintDetails]);

  // Export Complaints
  const exportComplaints = useCallback((format, exportFilters) => {
    const list = getDB("pv_complaints");
    const users = getDB("pv_users");
    const stores = mockStores;

    let result = list.map(c => {
      const cust = getDB("pv_customers").find(cu => cu._id === c.customerId) || {};
      const user = users.find(u => u._id === cust.userId) || {};
      const storeObj = stores.find(s => s.id === c.storeId) || {};
      return {
        ...c,
        customerName: user.fullName || "Guest",
        storeName: storeObj.name || "N/A"
      };
    });

    if (exportFilters.storeId && exportFilters.storeId !== "All") {
      result = result.filter(item => item.storeId === exportFilters.storeId);
    }
    if (exportFilters.status && exportFilters.status !== "All") {
      result = result.filter(item => item.status === exportFilters.status);
    }
    if (exportFilters.priority && exportFilters.priority !== "All") {
      result = result.filter(item => item.priority === exportFilters.priority);
    }
    if (exportFilters.dateRange && exportFilters.dateRange.start && exportFilters.dateRange.end) {
      const start = new Date(exportFilters.dateRange.start);
      const end = new Date(exportFilters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const created = new Date(item.createdAt);
        return created >= start && created <= end;
      });
    }

    if (result.length === 0) {
      toast.error("No tickets matches export filter criteria");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `complaints_export_${timestamp}`;

    if (format === "CSV") {
      const headers = ["Ticket ID", "Customer", "Order ID", "Store", "Category", "Priority", "Status", "Assigned To", "Date Created", "Resolution"];
      const csvContent = [
        headers.join(","),
        ...result.map(c => [
          c.ticketNumber,
          `"${c.customerName.replace(/"/g, '""')}"`,
          c.orderId,
          c.storeName,
          c.category,
          c.priority,
          c.status,
          c.assignedTo || "Unassigned",
          new Date(c.createdAt).toLocaleDateString("en-IN"),
          `"${(c.resolution || "").replace(/"/g, '""')}"`
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
      toast.success("CSV download completed");
    } else if (format === "Excel") {
      const headers = ["Ticket ID", "Customer", "Order ID", "Store", "Category", "Priority", "Status", "Assigned To", "Date Created", "Resolution"];
      const tableRows = result.map(c => `
        <tr>
          <td>${c.ticketNumber}</td>
          <td>${c.customerName}</td>
          <td>${c.orderId}</td>
          <td>${c.storeName}</td>
          <td>${c.category}</td>
          <td>${c.priority}</td>
          <td>${c.status}</td>
          <td>${c.assignedTo || "Unassigned"}</td>
          <td>${new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
          <td>${c.resolution || ""}</td>
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
      toast.success("Excel download completed");
    } else if (format === "PDF") {
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF({ orientation: 'landscape' });
          doc.setFontSize(16);
          doc.text('Customer Complaints & Support Report', 14, 15);
          doc.setFontSize(10);
          doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | Tickets: ${result.length}`, 14, 22);

          const bodyData = result.map(c => [
            c.ticketNumber,
            c.customerName,
            c.orderId,
            c.storeName,
            c.category,
            c.priority,
            c.status,
            c.assignedTo || "Unassigned",
            new Date(c.createdAt).toLocaleDateString("en-IN"),
            c.resolution || "N/A"
          ]);

          autoTable(doc, {
            head: [["Ticket ID", "Customer", "Order ID", "Store", "Category", "Priority", "Status", "Assigned To", "Created", "Resolution"]],
            body: bodyData,
            startY: 28,
            styles: { fontSize: 8 }
          });

          doc.save(`${filename}.pdf`);
          toast.success("PDF download completed");
        });
      });
    }
  }, []);

  return {
    complaints,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    storeId,
    setStoreId,
    category,
    setCategory,
    priority,
    setPriority,
    status,
    setStatus,
    assignedTo,
    setAssignedTo,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    complaintDetails,
    loadingDetails,
    fetchComplaintDetails,
    createComplaint,
    assignComplaint,
    escalateComplaint,
    resolveComplaint,
    closeTicket,
    deleteComplaint,
    addComplaintNote,
    deleteComplaintNote,
    exportComplaints,
    refetch: fetchComplaintsList
  };
}
