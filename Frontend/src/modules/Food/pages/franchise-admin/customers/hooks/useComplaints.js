import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { adminClient } from "@/services/api/axios";

// Customer Complaints desk. Everything comes from the server (/food/admin/stores/complaints/desk): the complaints
// customers raised about this franchise's stores, the numbers, the lists for the filters, and the actions.
const DESK = "/food/admin/stores/complaints/desk";

const errorOf = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

// "Today" / "This Week" / "This Month" / a custom range -> the dates the server filters on
const rangeOf = (dateFilter, custom) => {
  const now = new Date();
  const day = (d) => d.toISOString().slice(0, 10);
  if (dateFilter === "Today") return { fromDate: day(now), toDate: day(now) };
  if (dateFilter === "This Week") return { fromDate: day(new Date(now.getTime() - 6 * 86400000)), toDate: day(now) };
  if (dateFilter === "This Month") return { fromDate: day(new Date(now.getFullYear(), now.getMonth(), 1)), toDate: day(now) };
  if (dateFilter === "Custom Range" && custom?.start && custom?.end) return { fromDate: custom.start, toDate: custom.end };
  return {};
};

const EMPTY_STATS = {
  openComplaints: 0,
  highPriority: 0,
  resolvedToday: 0,
  totalComplaintsThisMonth: 0
};

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
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Numbers and the lists the filter boxes are built from
  const [stats, setStats] = useState(EMPTY_STATS);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);

  // Detailed Complaint view
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const latest = useRef(0); // only the newest answer is shown

  const fetchComplaintsList = useCallback(async () => {
    const ticket = ++latest.current;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
        ...rangeOf(dateFilter, customDateRange)
      };
      if (search.trim()) params.search = search.trim();
      if (storeId !== "All") params.storeId = storeId;
      if (category !== "All") params.category = category;
      if (priority !== "All") params.priority = priority;
      if (status !== "All") params.status = status;
      const res = await adminClient.get(DESK, { params });
      if (ticket !== latest.current) return;
      const data = res?.data?.data || {};
      setComplaints(data.complaints || []);
      setTotalCount(data.total || 0);
      setStats({ ...EMPTY_STATS, ...(data.stats || {}) });
      setStores(data.stores || []);
      setCategories(data.categories || []);
    } catch (err) {
      if (ticket !== latest.current) return;
      setComplaints([]);
      setTotalCount(0);
      toast.error(errorOf(err, "Could not load the complaints"));
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, [search, storeId, category, priority, status, dateFilter, customDateRange, sortBy, sortOrder, currentPage, pageSize]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchComplaintsList();
  }, [fetchComplaintsList]);

  // The numbers are part of the same answer
  const fetchStats = fetchComplaintsList;

  const fetchComplaintDetails = useCallback(async (id) => {
    setLoadingDetails(true);
    try {
      const res = await adminClient.get(`${DESK}/${id}`);
      setComplaintDetails(res?.data?.data || null);
    } catch (err) {
      setComplaintDetails(null);
      toast.error(errorOf(err, "Complaint ticket not found"));
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // One action on a complaint: send it, show what the server answered, refresh the table and the numbers
  const act = useCallback(async (id, method, path, body, success) => {
    try {
      const res = await adminClient({ method, url: `${DESK}/${id}${path}`, data: body });
      const detail = res?.data?.data;
      if (detail) setComplaintDetails((current) => (current && current._id === id ? detail : current));
      if (success) toast.success(success);
      fetchComplaintsList();
      return true;
    } catch (err) {
      toast.error(errorOf(err, "That did not work. Please try again."));
      return false;
    }
  }, [fetchComplaintsList]);

  const resolveComplaint = useCallback(
    (id, data) => act(id, "post", "/resolve", {
      resolutionType: data.resolutionType,
      refundAmount: data.refundAmount,
      couponCode: data.couponCode,
      remarks: data.remarks
    }, "Complaint ticket marked as resolved"),
    [act]
  );

  const closeTicket = useCallback(
    (id, data) => act(id, "post", "/close", { closingRemarks: data.closingRemarks }, "Ticket closed and locked"),
    [act]
  );

  const addComplaintNote = useCallback(
    (complaintId, noteText) => act(complaintId, "post", "/notes", { note: noteText }, "Complaint internal note added"),
    [act]
  );

  const deleteComplaintNote = useCallback(
    (complaintId, noteId) => act(complaintId, "delete", `/notes/${noteId}`, undefined, "Internal note removed"),
    [act]
  );

  // Export Complaints: the same filters as the export box, taken from the server
  const exportComplaints = useCallback(async (format, exportFilters = {}) => {
    let result = [];
    try {
      const params = { limit: 500, sortBy: "createdAt", sortOrder: "desc" };
      if (exportFilters.storeId && exportFilters.storeId !== "All") params.storeId = exportFilters.storeId;
      if (exportFilters.status && exportFilters.status !== "All") params.status = exportFilters.status;
      if (exportFilters.priority && exportFilters.priority !== "All") params.priority = exportFilters.priority;
      if (exportFilters.dateRange?.start && exportFilters.dateRange?.end) {
        params.fromDate = exportFilters.dateRange.start;
        params.toDate = exportFilters.dateRange.end;
      }
      const res = await adminClient.get(DESK, { params });
      result = res?.data?.data?.complaints || [];
    } catch (err) {
      toast.error(errorOf(err, "Could not load the complaints to export"));
      return;
    }

    if (result.length === 0) {
      toast.error("No tickets matches export filter criteria");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `complaints_export_${timestamp}`;

    if (format === "CSV") {
      const headers = ["Ticket ID", "Customer", "Order ID", "Store", "Category", "Priority", "Status", "Date Created", "Resolution"];
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
      const headers = ["Ticket ID", "Customer", "Order ID", "Store", "Category", "Priority", "Status", "Date Created", "Resolution"];
      const tableRows = result.map(c => `
        <tr>
          <td>${c.ticketNumber}</td>
          <td>${c.customerName}</td>
          <td>${c.orderId}</td>
          <td>${c.storeName}</td>
          <td>${c.category}</td>
          <td>${c.priority}</td>
          <td>${c.status}</td>
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
              new Date(c.createdAt).toLocaleDateString("en-IN"),
            c.resolution || "N/A"
          ]);

          autoTable(doc, {
            head: [["Ticket ID", "Customer", "Order ID", "Store", "Category", "Priority", "Status", "Created", "Resolution"]],
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
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    stores,
    categories,
    complaintDetails,
    loadingDetails,
    fetchComplaintDetails,
    resolveComplaint,
    closeTicket,
    addComplaintNote,
    deleteComplaintNote,
    exportComplaints,
    fetchStats,
    refetch: fetchComplaintsList
  };
}
