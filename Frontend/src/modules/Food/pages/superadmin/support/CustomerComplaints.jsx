import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, RefreshCw, Users, CheckCircle2, 
  AlertTriangle, Archive, ChevronDown, SlidersHorizontal, 
  Search, ShieldAlert, Clock, Star, Landmark, Eye, 
  Check, ChevronLeft, ChevronRight, LayoutGrid, X
} from 'lucide-react';
import { toast } from 'sonner';

// Child Modal Imports
import CreateComplaintModal from './CreateComplaintModal';
import ViewComplaintModal from './ViewComplaintModal';
import AssignAgentModal from './AssignAgentModal';
import EscalateModal from './EscalateModal';
import RefundModal from './RefundModal';
import ResolveModal from './ResolveModal';
import CloseModal from './CloseModal';

export default function CustomerComplaints() {
  // Page Loading State
  const [loading, setLoading] = useState(true);

  // Search & Filter Panel State
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filter Inputs
  const [filterComplaintId, setFilterComplaintId] = useState('');
  const [filterOrderId, setFilterOrderId] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Column Visibility State
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    complaintId: true,
    orderNumber: true,
    customer: true,
    type: true,
    category: true,
    priority: true,
    status: true,
    assignedTo: true,
    refundAmount: true,
    createdAt: true,
    updatedAt: true
  });

  // Table Selections & Sorting
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Complaint Modals Trigger
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  // Bulk Modals State
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkResolveOpen, setIsBulkResolveOpen] = useState(false);

  // Raw mock complaints matching DB schema (populated relationships representation)
  const [complaints, setComplaints] = useState([
    {
      _id: "cc_1",
      complaintNumber: "CMP-1049",
      customerName: "Rohan Malhotra",
      orderNumber: "PV-9042",
      store: "Indore Central",
      franchise: "Indore Group",
      deliveryPartner: "Karan Singh",
      type: "Food Quality",
      category: "Bad Taste / Incorrect Toppings",
      subject: "Cold Pizza Received & Incorrect Toppings",
      description: "Customer complains that the Paneer Tikka pizza received was freezing cold and missing extra cheese. They requested a replacement or full refund.",
      priority: "Medium",
      status: "Open",
      assignedTo: "Unassigned",
      refundAmount: 0,
      orderAmount: 450,
      createdAt: "2026-06-20T00:15:00.000Z",
      updatedAt: "2026-06-20T00:15:00.000Z",
      attachments: ["squashed_box.webp"]
    },
    {
      _id: "cc_2",
      complaintNumber: "CMP-2018",
      customerName: "Isha Sharma",
      orderNumber: "PV-9041",
      store: "Bhopal Zone",
      franchise: "Bhopal Foods",
      deliveryPartner: "Rahul Dev",
      type: "Delivery Issues",
      category: "Late Delivery (>30m delay)",
      subject: "Pizza arrived 45 minutes late and soggy",
      description: "The order took almost an hour and fifteen minutes. The rider claimed it was due to heavy rain, but the food package was soggy and unappetizing.",
      priority: "High",
      status: "In Progress",
      assignedTo: "Amit",
      refundAmount: 0,
      orderAmount: 590,
      createdAt: "2026-06-19T22:30:00.000Z",
      updatedAt: "2026-06-19T23:10:00.000Z",
      attachments: ["wet_packet.webp"]
    },
    {
      _id: "cc_3",
      complaintNumber: "CMP-3812",
      customerName: "Amit Verma",
      orderNumber: "PV-9039",
      store: "Ujjain Branch",
      franchise: "Mahakal Franchises",
      deliveryPartner: "Vikram Rathore",
      type: "Food Quality",
      category: "Hygiene / Hair in Food",
      subject: "Hair strand found baked into the crust",
      description: "Severe health/hygiene complaint. Customer found a long hair strand baked into the base of the Margherita pizza. Critical inspection required.",
      priority: "Critical",
      status: "Escalated",
      assignedTo: "Rohan",
      refundAmount: 0,
      orderAmount: 380,
      createdAt: "2026-06-19T18:40:00.000Z",
      updatedAt: "2026-06-19T19:30:00.000Z",
      attachments: ["contamination.webp"]
    },
    {
      _id: "cc_4",
      complaintNumber: "CMP-4552",
      customerName: "Pooja Patel",
      orderNumber: "PV-9038",
      store: "Indore Central",
      franchise: "Indore Group",
      deliveryPartner: "Karan Singh",
      type: "Payment & Refunds",
      category: "Double Payment Debited",
      subject: "UPI transaction debited twice but order showed failed once",
      description: "Customer paid via Google Pay. First attempt showed failed in app but amount was debited. Second attempt was successful. Refund needed for first transaction.",
      priority: "Low",
      status: "Resolved",
      assignedTo: "Neha",
      refundAmount: 320,
      orderAmount: 320,
      createdAt: "2026-06-19T12:00:00.000Z",
      updatedAt: "2026-06-19T13:45:00.000Z",
      resolvedAt: "2026-06-19T13:45:00.000Z",
      attachments: ["bank_sms.webp"]
    },
    {
      _id: "cc_5",
      complaintNumber: "CMP-5911",
      customerName: "Deepak Rawat",
      orderNumber: "PV-9036",
      store: "Bhopal Zone",
      franchise: "Bhopal Foods",
      deliveryPartner: "Rahul Dev",
      type: "Delivery Issues",
      category: "Rider Misbehavior",
      subject: "Rider argued about delivery location",
      description: "Rider refused to come up to the 4th floor elevator and argued rudely over the phone. Forced customer to come down to the gate.",
      priority: "Medium",
      status: "Closed",
      assignedTo: "Neha",
      refundAmount: 0,
      orderAmount: 520,
      createdAt: "2026-06-19T08:24:00.000Z",
      updatedAt: "2026-06-19T11:00:00.000Z",
      attachments: []
    },
    {
      _id: "cc_6",
      complaintNumber: "CMP-6019",
      customerName: "Riya Sen",
      orderNumber: "PV-9032",
      store: "Indore Central",
      franchise: "Indore Group",
      deliveryPartner: "Karan Singh",
      type: "Food Quality",
      category: "Undercooked Dough",
      subject: "Paneer Tikka Pizza base was completely raw",
      description: "Customer reports that the base of the pizza was doughy and completely unbaked. They could not eat it. Re-bake order requested.",
      priority: "High",
      status: "Open",
      assignedTo: "Unassigned",
      refundAmount: 0,
      orderAmount: 490,
      createdAt: "2026-06-19T06:00:00.000Z",
      updatedAt: "2026-06-19T06:00:00.000Z",
      attachments: ["raw_dough.webp"]
    },
    {
      _id: "cc_7",
      complaintNumber: "CMP-7104",
      customerName: "Sneha Patel",
      orderNumber: "PV-9029",
      store: "Ujjain Branch",
      franchise: "Mahakal Franchises",
      deliveryPartner: "Vikram Rathore",
      type: "Food Quality",
      category: "Cold Pizza",
      subject: "Pizza arrived cold and hardened",
      description: "Delivered almost cold. Cheese had hardened. Refund of ₹150 processed.",
      priority: "Low",
      status: "Resolved",
      assignedTo: "Priya",
      refundAmount: 150,
      orderAmount: 380,
      createdAt: "2026-06-18T20:15:00.000Z",
      updatedAt: "2026-06-18T21:40:00.000Z",
      resolvedAt: "2026-06-18T21:40:00.000Z",
      attachments: []
    },
    {
      _id: "cc_8",
      complaintNumber: "CMP-8041",
      customerName: "Priyanshu Sharma",
      orderNumber: "PV-9025",
      store: "Bhopal Zone",
      franchise: "Bhopal Foods",
      deliveryPartner: "Rahul Dev",
      type: "Payment & Refunds",
      category: "Coupon Not Applied",
      subject: "Discount coupon failed during payment checkout",
      description: "Customer attempted to apply code PIZZA50. The transaction went through for full amount. Resolved by adding coupon credits to wallet.",
      priority: "Low",
      status: "Closed",
      assignedTo: "Neha",
      refundAmount: 50,
      orderAmount: 450,
      createdAt: "2026-06-18T14:30:00.000Z",
      updatedAt: "2026-06-18T16:00:00.000Z",
      attachments: []
    }
  ]);

  // Debouncing effect for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Simulate Initial API loading skeleton
  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(loadTimeout);
  }, []);

  // Recalculating dashboard KPI statistics based on current active list state
  const totalComplaints = complaints.length;
  const openComplaints = complaints.filter(c => c.status === 'Open').length;
  const highPriorityCases = complaints.filter(c => c.priority === 'High' || c.priority === 'Critical').length;
  const resolvedToday = complaints.filter(c => c.status === 'Resolved').length;
  const refundCases = complaints.filter(c => c.refundAmount > 0).length;
  const escalatedCases = complaints.filter(c => c.status === 'Escalated').length;
  const avgResolutionTime = "1h 45m";
  const customerSatisfaction = "94.2%";

  // Handler for custom actions
  const handleActionClick = (modalType, complaintItem) => {
    setActiveComplaint(complaintItem);
    if (modalType === 'View') setIsViewOpen(true);
    else if (modalType === 'Assign') setIsAssignOpen(true);
    else if (modalType === 'Escalate') setIsEscalateOpen(true);
    else if (modalType === 'Refund') setIsRefundOpen(true);
    else if (modalType === 'Resolve') setIsResolveOpen(true);
    else if (modalType === 'Close') setIsCloseOpen(true);
  };

  // Callback to update local state dynamically upon modal changes
  const handleUpdateComplaint = (updatedItem) => {
    setComplaints(prev => prev.map(c => c._id === updatedItem._id ? updatedItem : c));
    if (activeComplaint && activeComplaint._id === updatedItem._id) {
      setActiveComplaint(updatedItem);
    }
  };

  const handleCreateSuccess = (newComplaint) => {
    setComplaints(prev => [newComplaint, ...prev]);
  };

  // Row selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredComplaints.map(c => c._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(prev => prev.filter(r => r !== id));
    } else {
      setSelectedRows(prev => [...prev, id]);
    }
  };

  // Bulk Operations
  const handleBulkAssign = (agent, priority) => {
    setComplaints(prev => prev.map(c => 
      selectedRows.includes(c._id) 
        ? { ...c, assignedTo: agent.split(' ')[0], priority, status: 'In Progress', updatedAt: new Date().toISOString() } 
        : c
    ));
    setSelectedRows([]);
    toast.success(`Successfully assigned ${selectedRows.length} complaints to ${agent}`);
  };

  const handleBulkResolve = () => {
    setComplaints(prev => prev.map(c => 
      selectedRows.includes(c._id) 
        ? { ...c, status: 'Resolved', resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } 
        : c
    ));
    setSelectedRows([]);
    toast.success(`Successfully resolved ${selectedRows.length} complaints`);
  };

  const handleBulkClose = () => {
    setComplaints(prev => prev.map(c => 
      selectedRows.includes(c._id) 
        ? { ...c, status: 'Closed', updatedAt: new Date().toISOString() } 
        : c
    ));
    setSelectedRows([]);
    toast.success(`Successfully closed ${selectedRows.length} complaints`);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      setComplaints(prev => prev.filter(c => c._id !== id));
      toast.success("Complaint deleted successfully");
    }
  };

  // Sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtering & Search application
  const filteredComplaints = complaints.filter(c => {
    const query = debouncedSearch.toLowerCase();
    
    // Search query matches complaint ID, order ID, customer name, subject
    const matchesSearch = 
      c.complaintNumber.toLowerCase().includes(query) ||
      c.orderNumber.toLowerCase().includes(query) ||
      c.customerName.toLowerCase().includes(query) ||
      c.subject.toLowerCase().includes(query);

    // Filter Panel matches
    const matchesComplaintId = filterComplaintId ? c.complaintNumber.toLowerCase().includes(filterComplaintId.toLowerCase()) : true;
    const matchesOrderId = filterOrderId ? c.orderNumber.toLowerCase().includes(filterOrderId.toLowerCase()) : true;
    const matchesCustomer = filterCustomer ? c.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) : true;
    const matchesStore = filterStore ? c.store.toLowerCase().includes(filterStore.toLowerCase()) : true;
    const matchesCategory = filterCategory ? c.category.toLowerCase().includes(filterCategory.toLowerCase()) : true;
    const matchesPriority = filterPriority ? c.priority === filterPriority : true;
    const matchesStatus = filterStatus ? c.status === filterStatus : true;
    const matchesAgent = filterAgent ? c.assignedTo.toLowerCase().includes(filterAgent.toLowerCase()) : true;

    // Date Range Match
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(c.createdAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      // Add 23:59:59 to include the entire 'To' day
      const dateToLimit = new Date(dateTo);
      dateToLimit.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(c.createdAt) <= dateToLimit;
    }

    return matchesSearch && matchesComplaintId && matchesOrderId && matchesCustomer && 
           matchesStore && matchesCategory && matchesPriority && matchesStatus && 
           matchesAgent && matchesDate;
  });

  // Sort complaints
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'createdAt' || sortField === 'updatedAt') {
      comparison = new Date(a[sortField]) - new Date(b[sortField]);
    } else if (sortField === 'refundAmount' || sortField === 'orderAmount') {
      comparison = a[sortField] - b[sortField];
    } else {
      comparison = a[sortField]?.localeCompare(b[sortField]) || 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginated elements
  const totalPages = Math.ceil(sortedComplaints.length / itemsPerPage);
  const paginatedComplaints = sortedComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setFilterComplaintId('');
    setFilterOrderId('');
    setFilterCustomer('');
    setFilterStore('');
    setFilterCategory('');
    setFilterPriority('');
    setFilterStatus('');
    setFilterAgent('');
    setDateFrom('');
    setDateTo('');
    toast.info("Filters reset successfully");
  };

  const handleExportCSV = () => {
    const dataToExport = selectedRows.length > 0 
      ? complaints.filter(c => selectedRows.includes(c._id))
      : filteredComplaints;

    if (dataToExport.length === 0) {
      toast.error("No complaints found to export");
      return;
    }

    const headers = ['Complaint ID', 'Order Number', 'Customer', 'Type', 'Category', 'Priority', 'Status', 'Assigned To', 'Refund Amount', 'Created At'];
    const rows = dataToExport.map(item => [
      item.complaintNumber,
      item.orderNumber,
      item.customerName,
      item.type,
      item.category,
      item.priority,
      item.status,
      item.assignedTo,
      `₹${item.refundAmount}`,
      item.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customer_complaints_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export started successfully!");
  };

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({
      ...prev,
      [col]: !prev[col]
    }));
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 animate-in fade-in duration-500">
      
      {/* 1. Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Customer Complaints</h2>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage customer issues, refunds, escalations, and communications between customers, stores, delivery partners, and admins.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 h-8.5 bg-[var(--primary)] text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Complaint
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3 h-8.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button 
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                toast.success("Dashboard data refreshed");
              }, 600);
            }}
            className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            title="Refresh Complaints Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. KPI Cards Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        
        {/* KPI 1: Total Complaints */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider truncate">Total Complaints</span>
            <span className="text-base font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{totalComplaints}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 2: Open Complaints */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider truncate">Open Complaints</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{openComplaints}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 3: High Priority Cases */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider truncate">High Priority</span>
            <span className="text-base font-black text-orange-600 dark:text-orange-400 mt-0.5">{highPriorityCases}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 4: Resolved Today */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider truncate">Resolved Today</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{resolvedToday}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 5: Refund Cases */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider truncate">Refund Cases</span>
            <span className="text-base font-black text-zinc-800 dark:text-zinc-100 mt-0.5">{refundCases}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-500/10 text-zinc-600 dark:text-zinc-350 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 6: Escalated Cases */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider truncate">Escalated Cases</span>
            <span className="text-base font-black text-red-650 dark:text-red-400 mt-0.5">{escalatedCases}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 7: Avg Res Time */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider truncate">Avg Res Time</span>
            <span className="text-base font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{avgResolutionTime}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 8: Customer Satisfaction */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-2.5 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer h-[75px]">
          <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
            <span className="text-[8px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider truncate">CSAT rating</span>
            <span className="text-base font-black text-yellow-600 dark:text-yellow-450 mt-0.5">{customerSatisfaction}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 shrink-0">
            <Star className="w-4 h-4" />
          </div>
        </div>

      </section>

      {/* 3. Search Bar & Action Buttons */}
      <section className="flex flex-col sm:flex-row items-center gap-3">
        {/* Quick Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" size={15} />
          <input
            type="text"
            placeholder="Search complaint ID, order number, client name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9.5 pl-9 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-[var(--primary)] transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0">
          {/* Collapsible Filter Panel Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1 px-3.5 h-9.5 rounded-lg border text-xs font-bold shadow-sm transition-all active:scale-95 ${
              showFilters 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {/* Columns Visibility Toggle Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowColMenu(!showColMenu)}
              className="flex items-center justify-center gap-1 px-3.5 h-9.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Columns</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
            {showColMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2.5 z-40 space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 animate-in fade-in duration-150">
                <p className="text-[10px] font-bold text-zinc-400 uppercase pb-1 border-b border-zinc-100 dark:border-zinc-800 mb-1">Visible Columns</p>
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="flex items-center gap-2 py-1 px-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns[col]} 
                      onChange={() => toggleColumn(col)}
                      className="rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Collapsible Advanced Filters Panel */}
      {showFilters && (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-md space-y-4 animate-in slide-in-from-top-4 duration-250">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">Filter Complaints Query</h3>
            <span className="text-[9px] font-bold text-zinc-400 uppercase">GET /api/customer-complaints</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-xs font-semibold text-zinc-600 dark:text-zinc-450">
            {/* ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Complaint ID</label>
              <input
                type="text"
                placeholder="e.g. CMP-1049"
                value={filterComplaintId}
                onChange={(e) => setFilterComplaintId(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Order */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Order ID</label>
              <input
                type="text"
                placeholder="e.g. PV-9042"
                value={filterOrderId}
                onChange={(e) => setFilterOrderId(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Customer */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Rohan"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Store */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Store Outlet</label>
              <input
                type="text"
                placeholder="e.g. Indore"
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Category</label>
              <input
                type="text"
                placeholder="e.g. Quality"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Agent */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Assigned Agent</label>
              <input
                type="text"
                placeholder="e.g. Amit"
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <button 
              onClick={resetFilters}
              className="px-4 h-8 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-650 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Reset Filters
            </button>
            <button 
              onClick={() => {
                setShowFilters(false);
                toast.success("Applied search query filters");
              }}
              className="px-5 h-8 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </section>
      )}

      {/* 5. Selected Rows Action Bar */}
      {selectedRows.length > 0 && (
        <section className="bg-zinc-900/5 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2.5 animate-in slide-in-from-bottom-2 duration-250">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
            </span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Selected <strong>{selectedRows.length}</strong> complaints
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkAssignOpen(true)}
              className="px-3 h-8.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 active:scale-95"
            >
              Bulk Assign
            </button>
            <button
              onClick={handleBulkResolve}
              className="px-3 h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              Bulk Resolve
            </button>
            <button
              onClick={handleBulkClose}
              className="px-3 h-8.5 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              Bulk Close
            </button>
            <button
              onClick={() => {
                handleExportCSV();
                setSelectedRows([]);
              }}
              className="px-3 h-8.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1"
            >
              Bulk Export
            </button>
            <button 
              onClick={() => setSelectedRows([])}
              className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </section>
      )}

      {/* 6. Complaints Table Section */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        {loading ? (
          /* Table Loading Skeleton */
          <div className="p-6 space-y-4">
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-5" />
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse flex-1" />
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-24" />
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-16" />
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-20" />
              </div>
            ))}
          </div>
        ) : sortedComplaints.length === 0 ? (
          /* Table Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3.5">
            <ShieldAlert className="w-12 h-12 text-zinc-350 dark:text-zinc-600 stroke-[1.5]" />
            <div>
              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">No Complaints Matches Found</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-450 mt-1 max-w-sm leading-normal">
                We couldn't find any complaints that match your active search terms or filters. Try adjusting your query parameters.
              </p>
            </div>
            <button 
              onClick={resetFilters}
              className="px-4 h-8 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-colors"
            >
              Reset Search Query
            </button>
          </div>
        ) : (
          /* Main Complaints Table Canvas */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Sticky Table Header */}
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 sticky top-[52px] z-10">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input 
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedRows.length === filteredComplaints.length && filteredComplaints.length > 0}
                      className="rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                  </th>
                  {visibleColumns.complaintId && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('complaintNumber')}>
                      <div className="flex items-center gap-1">
                        <span>Complaint ID</span>
                        {sortField === 'complaintNumber' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.orderNumber && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('orderNumber')}>
                      <div className="flex items-center gap-1">
                        <span>Order Number</span>
                        {sortField === 'orderNumber' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.customer && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('customerName')}>
                      <div className="flex items-center gap-1">
                        <span>Customer</span>
                        {sortField === 'customerName' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.type && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('type')}>
                      <div className="flex items-center gap-1">
                        <span>Type</span>
                        {sortField === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.category && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-1">
                        <span>Category</span>
                        {sortField === 'category' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.priority && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('priority')}>
                      <div className="flex items-center gap-1">
                        <span>Priority</span>
                        {sortField === 'priority' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.assignedTo && (
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('assignedTo')}>
                      <div className="flex items-center gap-1">
                        <span>Assigned To</span>
                        {sortField === 'assignedTo' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.refundAmount && (
                    <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort('refundAmount')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Refund Amt</span>
                        {sortField === 'refundAmount' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.createdAt && (
                    <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Created At</span>
                        {sortField === 'createdAt' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.updatedAt && (
                    <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort('updatedAt')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Updated At</span>
                        {sortField === 'updatedAt' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  )}
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                {paginatedComplaints.map((c) => (
                  <tr 
                    key={c._id}
                    className={`hover:bg-zinc-50/55 dark:hover:bg-zinc-800/20 transition-all ${
                      selectedRows.includes(c._id) ? 'bg-[var(--primary)]/5 dark:bg-[var(--primary)]/5' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedRows.includes(c._id)}
                        onChange={() => handleSelectRow(c._id)}
                        className="rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </td>
                    
                    {visibleColumns.complaintId && (
                      <td className="p-3 font-bold text-zinc-900 dark:text-zinc-50">{c.complaintNumber}</td>
                    )}
                    
                    {visibleColumns.orderNumber && (
                      <td className="p-3">{c.orderNumber}</td>
                    )}

                    {visibleColumns.customer && (
                      <td className="p-3 font-bold">{c.customerName}</td>
                    )}

                    {visibleColumns.type && (
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                          {c.type}
                        </span>
                      </td>
                    )}

                    {visibleColumns.category && (
                      <td className="p-3 truncate max-w-[130px]" title={c.category}>{c.category}</td>
                    )}

                    {visibleColumns.priority && (
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          c.priority === 'Low' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' :
                          c.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-450' :
                          c.priority === 'High' ? 'bg-orange-105 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400' :
                          'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 animate-pulse font-extrabold'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${
                          c.status === 'Open' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400 border-blue-200 dark:border-blue-900/30' :
                          c.status === 'In Progress' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' :
                          c.status === 'Escalated' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/10 dark:text-rose-450 border-rose-200 dark:border-rose-900/30' :
                          c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' :
                          'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    )}

                    {visibleColumns.assignedTo && (
                      <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-205">{c.assignedTo}</td>
                    )}

                    {visibleColumns.refundAmount && (
                      <td className="p-3 text-right font-bold text-red-650 dark:text-red-400">
                        {c.refundAmount > 0 ? `₹${c.refundAmount}` : '-'}
                      </td>
                    )}

                    {visibleColumns.createdAt && (
                      <td className="p-3 text-right text-zinc-500 font-semibold">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}

                    {visibleColumns.updatedAt && (
                      <td className="p-3 text-right text-zinc-450 font-semibold">
                        {new Date(c.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}

                    {/* Actions Dropdown buttons */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleActionClick('View', c)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-600 dark:text-zinc-300"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Compact row actions menu triggers */}
                        <div className="relative group/actions">
                          <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="absolute right-0 mt-0.5 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-30 hidden group-hover/actions:block text-left font-bold text-[10px]">
                            <button onClick={() => handleActionClick('Assign', c)} className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                              Assign Agent
                            </button>
                            <button onClick={() => handleActionClick('Escalate', c)} className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-red-650 dark:text-red-400 flex items-center gap-1.5">
                              Escalate Tier
                            </button>
                            <button onClick={() => handleActionClick('Refund', c)} className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                              Issue Refund
                            </button>
                            <button onClick={() => handleActionClick('Resolve', c)} className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5">
                              Mark Resolved
                            </button>
                            <button onClick={() => handleActionClick('Close', c)} className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                              Close Ticket
                            </button>
                            <hr className="border-zinc-150 dark:border-zinc-800 my-0.5" />
                            <button onClick={() => handleDelete(c._id)} className="w-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 flex items-center gap-1.5">
                              Delete Record
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sticky Table Footer (Pagination Panel) */}
        {!loading && totalPages > 0 && (
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between mt-auto shrink-0 text-[10px] font-bold text-zinc-500 select-none">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedComplaints.length)} of {sortedComplaints.length} tickets
            </span>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-6.5 h-6.5 rounded flex items-center justify-center border transition-all ${
                    currentPage === i + 1
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 7. Modal Portals */}
      <CreateComplaintModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreateSuccess={handleCreateSuccess}
      />
      
      <ViewComplaintModal 
        isOpen={isViewOpen} 
        onClose={() => setIsViewOpen(false)} 
        complaint={activeComplaint}
        onUpdateComplaint={handleUpdateComplaint}
      />

      <AssignAgentModal 
        isOpen={isAssignOpen} 
        onClose={() => setIsAssignOpen(false)} 
        complaintId={activeComplaint?.complaintNumber}
        onAssignSuccess={(agent, priority, notes) => handleUpdateComplaint({
          ...activeComplaint,
          assignedTo: agent.split(' ')[0],
          priority: priority,
          status: 'In Progress',
          updatedAt: new Date().toISOString()
        })}
      />

      <EscalateModal 
        isOpen={isEscalateOpen} 
        onClose={() => setIsEscalateOpen(false)} 
        complaintId={activeComplaint?.complaintNumber}
        onEscalateSuccess={(level, department, reason, comments) => handleUpdateComplaint({
          ...activeComplaint,
          status: 'Escalated',
          priority: 'Critical',
          updatedAt: new Date().toISOString()
        })}
      />

      <RefundModal 
        isOpen={isRefundOpen} 
        onClose={() => setIsRefundOpen(false)} 
        complaint={activeComplaint}
        onRefundSuccess={(amount, reason, method) => handleUpdateComplaint({
          ...activeComplaint,
          refundAmount: (activeComplaint.refundAmount || 0) + amount,
          status: 'Resolved',
          updatedAt: new Date().toISOString()
        })}
      />

      <ResolveModal 
        isOpen={isResolveOpen} 
        onClose={() => setIsResolveOpen(false)} 
        complaintId={activeComplaint?.complaintNumber}
        onResolveSuccess={(notes, coupon, rating) => handleUpdateComplaint({
          ...activeComplaint,
          status: 'Resolved',
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })}
      />

      <CloseModal 
        isOpen={isCloseOpen} 
        onClose={() => setIsCloseOpen(false)} 
        complaintId={activeComplaint?.complaintNumber}
        onCloseSuccess={(remarks, finalStatus) => handleUpdateComplaint({
          ...activeComplaint,
          status: 'Closed',
          updatedAt: new Date().toISOString()
        })}
      />

      {/* Bulk Assign Portal */}
      <AssignAgentModal 
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        complaintId={`Bulk selection (${selectedRows.length} files)`}
        onAssignSuccess={handleBulkAssign}
      />

    </div>
  );
}
