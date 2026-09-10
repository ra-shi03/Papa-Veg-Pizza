import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, RefreshCw, Users, CheckCircle2, 
  AlertTriangle, Archive, ChevronDown, SlidersHorizontal, 
  Search, ShieldAlert, Clock, Star, Landmark, Eye, 
  Check, ChevronLeft, ChevronRight, LayoutGrid, X, Trash2,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

// Modals
import CreateFranchiseTicketModal from './CreateFranchiseTicketModal';
import FranchiseTicketDetailsModal from './FranchiseTicketDetailsModal';
import AssignDepartmentModal from './AssignDepartmentModal';
import EscalateFranchiseTicketModal from './EscalateFranchiseTicketModal';
import ResolveFranchiseTicketModal from './ResolveFranchiseTicketModal';
import CloseFranchiseTicketModal from './CloseFranchiseTicketModal';

export default function FranchiseTicket() {
  // Page Loading State
  const [loading, setLoading] = useState(true);

  // Search & Filter Panel State
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filter Inputs
  const [filterTicketId, setFilterTicketId] = useState('');
  const [filterFranchise, setFilterFranchise] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Column Visibility State
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    ticketNumber: true,
    franchiseName: true,
    type: true,
    subject: true,
    priority: true,
    status: true,
    assignedDepartment: true,
    assignedTo: true,
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

  // Active Ticket Modals Trigger
  const [activeTicket, setActiveTicket] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  // Bulk Modals State
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkResolveOpen, setIsBulkResolveOpen] = useState(false);

  // Raw mock tickets matching DB schema and populated relationships
  const [tickets, setTickets] = useState([
    {
      _id: "ft_1",
      ticketNumber: "FTK-29048",
      franchiseId: "fr_1",
      franchiseName: "Indore Foods Pvt Ltd",
      franchiseCode: "PV-IND-01",
      adminId: "adm_11",
      adminName: "Suresh Gupta",
      ownerName: "Priyanshu Patel",
      contactEmail: "priyanshu@indorefoods.in",
      contactPhone: "+91 98270 12345",
      region: "Madhya Pradesh (Central)",
      storesCount: 8,
      type: "Commission Dispute",
      subject: "Discrepancy in June week-1 commission calculation",
      description: "Franchise disputes commission charge calculated at 14% instead of the agreed 10% on weekly Indore Central sales. Disputed difference is ₹8,542.",
      priority: "High",
      status: "Open",
      assignedDepartment: "Finance",
      assignedTo: "Priya Verma",
      attachments: ["june_commission_ledger.xlsx"],
      createdAt: "2026-06-19T14:20:00.000Z",
      updatedAt: "2026-06-19T14:30:00.000Z"
    },
    {
      _id: "ft_2",
      ticketNumber: "FTK-29031",
      franchiseId: "fr_2",
      franchiseName: "Bhopal Pizza Ventures",
      franchiseCode: "PV-BHO-02",
      adminId: "adm_21",
      adminName: "Rajesh Kulkarni",
      ownerName: "Ramanathan Iyer",
      contactEmail: "ram@bhopalventures.co.in",
      contactPhone: "+91 75524 88392",
      region: "Madhya Pradesh (West)",
      storesCount: 5,
      type: "Inventory Issue",
      subject: "Critical shortage of Mozzarella Cheese at Central Warehouse",
      description: "Mozzarella stock level fell to 8 boxes, which is well below the minimum threshold of 20 boxes. Request immediate restock release from Central WH-02.",
      priority: "Critical",
      status: "Escalated",
      assignedDepartment: "Inventory",
      assignedTo: "Kunal Sen",
      attachments: ["low_stock_details.pdf"],
      createdAt: "2026-06-19T10:15:00.000Z",
      updatedAt: "2026-06-19T11:45:00.000Z"
    },
    {
      _id: "ft_3",
      ticketNumber: "FTK-29014",
      franchiseId: "fr_3",
      franchiseName: "Capital Crust Franchisees",
      franchiseCode: "PV-DEL-03",
      adminId: "adm_31",
      adminName: "Harpreet Singh",
      ownerName: "Gurpreet Singh",
      contactEmail: "gurpreet@capitalcrust.in",
      contactPhone: "+91 99110 55432",
      region: "NCR Delhi",
      storesCount: 12,
      type: "Product Synchronization Issue",
      subject: "Price discrepancy in Double Cheese Margherita on POS",
      description: "POS app shows Margherita price as ₹329 whereas Central Menu has it updated at ₹349. Need database cache refresh to prevent store revenue loss.",
      priority: "Medium",
      status: "In Progress",
      assignedDepartment: "Technical Support",
      assignedTo: "Amit Sharma",
      attachments: [],
      createdAt: "2026-06-18T18:40:00.000Z",
      updatedAt: "2026-06-19T09:12:00.000Z"
    },
    {
      _id: "ft_4",
      ticketNumber: "FTK-29009",
      franchiseId: "fr_4",
      franchiseName: "Western Coast Pizzas",
      franchiseCode: "PV-MUM-04",
      adminId: "adm_41",
      adminName: "Vijay Kadam",
      ownerName: "Ananya Deshmukh",
      contactEmail: "ananya@westerncoast.in",
      contactPhone: "+91 90220 77112",
      region: "Maharashtra (West)",
      storesCount: 15,
      type: "System Bug",
      subject: "POST sync gateway crash logs on POS startup",
      description: "POS app crashes on tablet startup throwing connection pool timeout 504. Attached stack trace for technical audit review.",
      priority: "Critical",
      status: "Open",
      assignedDepartment: "Technical Support",
      assignedTo: "Unassigned",
      attachments: ["pos_crash_stack.txt"],
      createdAt: "2026-06-18T08:10:00.000Z",
      updatedAt: "2026-06-18T08:10:00.000Z"
    },
    {
      _id: "ft_5",
      ticketNumber: "FTK-28994",
      franchiseId: "fr_5",
      franchiseName: "Bengaluru Tech Foods",
      franchiseCode: "PV-BLR-05",
      adminId: "adm_51",
      adminName: "Nandini Gowda",
      ownerName: "Karthik Reddy",
      contactEmail: "karthik@techfoods.co.in",
      contactPhone: "+91 80491 66224",
      region: "Karnataka (South)",
      storesCount: 6,
      type: "Payment Settlement Issue",
      subject: "Settlement TXN-90812 payout discrepancy",
      description: "SBI account is missing weekly settlement payout batch value of ₹1,12,900. Gateway dashboard states success. Request settlement team audit.",
      priority: "High",
      status: "Pending",
      assignedDepartment: "Settlement Team",
      assignedTo: "Karan Singh",
      attachments: ["bank_statement_proof.pdf"],
      createdAt: "2026-06-17T11:30:00.000Z",
      updatedAt: "2026-06-18T10:20:00.000Z"
    },
    {
      _id: "ft_6",
      ticketNumber: "FTK-28955",
      franchiseId: "fr_1",
      franchiseName: "Indore Foods Pvt Ltd",
      franchiseCode: "PV-IND-01",
      adminId: "adm_12",
      adminName: "Priyan Patel",
      ownerName: "Priyanshu Patel",
      contactEmail: "priyanshu@indorefoods.in",
      contactPhone: "+91 98270 12345",
      region: "Madhya Pradesh (Central)",
      storesCount: 8,
      type: "Store Issue",
      subject: "Delayed order dispatch at Indore Vijay Nagar Store",
      description: "Frequent late deliveries due to kitchen dispatcher delay on Saturday evenings. Active order queue exceeds preparation limit.",
      priority: "Medium",
      status: "Resolved",
      assignedDepartment: "Operations",
      assignedTo: "Neha Singh",
      attachments: [],
      createdAt: "2026-06-16T15:00:00.000Z",
      updatedAt: "2026-06-17T14:40:00.000Z",
      resolvedAt: "2026-06-17T14:40:00.000Z",
      resolution: "Coordinated with store manager to assign an extra prep cook on weekends. Dispatches stabilized."
    },
    {
      _id: "ft_7",
      ticketNumber: "FTK-28941",
      franchiseId: "fr_2",
      franchiseName: "Bhopal Pizza Ventures",
      franchiseCode: "PV-BHO-02",
      adminId: "adm_22",
      adminName: "Kirti Iyer",
      ownerName: "Ramanathan Iyer",
      contactEmail: "ram@bhopalventures.co.in",
      contactPhone: "+91 75524 88392",
      region: "Madhya Pradesh (West)",
      storesCount: 5,
      type: "Staff Problem",
      subject: "Supervisor dispute filed for Bhopal main outlet",
      description: "Kitchen helper disputes shift hours and pay deducted by store manager. Request audit of biometric logs.",
      priority: "Low",
      status: "Closed",
      assignedDepartment: "HR",
      assignedTo: "Pooja Desai",
      attachments: [],
      createdAt: "2026-06-15T09:00:00.000Z",
      updatedAt: "2026-06-16T11:20:00.000Z"
    }
  ]);

  // Simulate API GET /api/franchise-tickets/dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Search Debouncing (350ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // KPI Calculations dynamically computed from state
  const kpiMetrics = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'Open').length,
    criticalIssues: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed' && t.status !== 'Resolved').length,
    pendingApproval: tickets.filter(t => t.status === 'Pending').length,
    resolvedTickets: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
    averageResolutionTime: "3.2 Hours"
  };

  // Toggle visible columns
  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({
      ...prev,
      [col]: !prev[col]
    }));
  };

  // Checkbox row toggles
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(tickets.map(t => t._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Delete action
  const handleDeleteTicket = (id, ticketNo) => {
    if (window.confirm(`Are you sure you want to permanently delete Franchise Ticket ${ticketNo}?`)) {
      setTickets(prev => prev.filter(t => t._id !== id));
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
      toast.success(`Ticket ${ticketNo} deleted successfully`);
    }
  };

  // Bulk Actions
  const handleBulkAssign = (dept, agent, priority, notes) => {
    setTickets(prev => prev.map(t => {
      if (selectedRows.includes(t._id)) {
        return {
          ...t,
          assignedDepartment: dept,
          assignedTo: agent.split(' ')[0],
          priority,
          status: 'In Progress',
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
    setSelectedRows([]);
    setIsBulkAssignOpen(false);
    toast.success("Assigned selected tickets successfully");
  };

  const handleBulkResolve = () => {
    if (selectedRows.length === 0) return;
    if (window.confirm(`Resolve all ${selectedRows.length} selected tickets?`)) {
      setTickets(prev => prev.map(t => {
        if (selectedRows.includes(t._id)) {
          return {
            ...t,
            status: 'Resolved',
            resolvedAt: new Date().toISOString(),
            resolution: "Resolved via bulk admin action",
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
      setSelectedRows([]);
      toast.success("Resolved selected tickets successfully");
    }
  };

  const handleBulkClose = () => {
    if (selectedRows.length === 0) return;
    if (window.confirm(`Close all ${selectedRows.length} selected tickets?`)) {
      setTickets(prev => prev.map(t => {
        if (selectedRows.includes(t._id)) {
          return {
            ...t,
            status: 'Closed',
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
      setSelectedRows([]);
      toast.success("Closed selected tickets successfully");
    }
  };

  // Filter & Search Logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.franchiseName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(debouncedSearch.toLowerCase()));

    const matchesId = filterTicketId ? t.ticketNumber.toLowerCase().includes(filterTicketId.toLowerCase()) : true;
    const matchesFranchise = filterFranchise ? t.franchiseName.toLowerCase().includes(filterFranchise.toLowerCase()) : true;
    const matchesType = filterType ? t.type === filterType : true;
    const matchesPriority = filterPriority ? t.priority === filterPriority : true;
    const matchesStatus = filterStatus ? t.status === filterStatus : true;
    const matchesDept = filterDept ? t.assignedDepartment === filterDept : true;
    const matchesAgent = filterAgent ? t.assignedTo.toLowerCase().includes(filterAgent.toLowerCase()) : true;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(t.createdAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      // Set to end of day
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.createdAt) <= toDate;
    }

    return matchesSearch && matchesId && matchesFranchise && matchesType && matchesPriority && matchesStatus && matchesDept && matchesAgent && matchesDate;
  });

  // Sorting Logic
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let fieldA = a[sortField] || '';
    let fieldB = b[sortField] || '';

    if (sortField === 'createdAt' || sortField === 'updatedAt') {
      return sortDirection === 'asc' 
        ? new Date(fieldA) - new Date(fieldB)
        : new Date(fieldB) - new Date(fieldA);
    }

    if (typeof fieldA === 'string') {
      fieldA = fieldA.toLowerCase();
      fieldB = fieldB.toLowerCase();
    }

    if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (field) => {
    let direction = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortField(field);
    setSortDirection(direction);
  };

  // Pagination Logic
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Update single ticket from modal callbacks
  const handleUpdateTicket = (updated) => {
    setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
    if (activeTicket && activeTicket._id === updated._id) {
      setActiveTicket(updated);
    }
  };

  const handleCreateSuccess = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterTicketId('');
    setFilterFranchise('');
    setFilterType('');
    setFilterPriority('');
    setFilterStatus('');
    setFilterDept('');
    setFilterAgent('');
    setDateFrom('');
    setDateTo('');
    toast.success("Filters reset successfully");
  };

  // CSV Exporter
  const exportCSV = () => {
    const rowsToExport = selectedRows.length > 0 
      ? tickets.filter(t => selectedRows.includes(t._id))
      : filteredTickets;

    if (rowsToExport.length === 0) {
      toast.error("No tickets available to export");
      return;
    }

    const headers = ["Ticket Number", "Franchise Partner", "Type", "Subject", "Priority", "Status", "Department", "Assigned To", "Created Date"];
    const csvRows = [
      headers.join(','),
      ...rowsToExport.map(t => [
        `"${t.ticketNumber}"`,
        `"${t.franchiseName}"`,
        `"${t.type}"`,
        `"${t.subject.replace(/"/g, '""')}"`,
        `"${t.priority}"`,
        `"${t.status}"`,
        `"${t.assignedDepartment}"`,
        `"${t.assignedTo}"`,
        `"${new Date(t.createdAt).toLocaleDateString()}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `franchise_tickets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Successfully exported ${rowsToExport.length} tickets to CSV`);
  };

  // Status badge styles
  const getStatusBadge = (status) => {
    let classes = "";
    switch(status) {
      case 'Open':
        classes = "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
        break;
      case 'In Progress':
        classes = "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800";
        break;
      case 'Pending':
        classes = "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800";
        break;
      case 'Escalated':
        classes = "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-450 border-rose-200 dark:border-rose-800";
        break;
      case 'Resolved':
        classes = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-800";
        break;
      case 'Closed':
        classes = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border-zinc-200 dark:border-zinc-700";
        break;
      default:
        classes = "bg-zinc-50 text-zinc-650 border-zinc-200";
    }
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${classes}`}>{status}</span>;
  };

  const getPriorityBadge = (priority) => {
    let classes = "";
    switch(priority) {
      case 'Low':
        classes = "bg-zinc-100 text-zinc-705 dark:bg-zinc-800 dark:text-zinc-300";
        break;
      case 'Medium':
        classes = "bg-yellow-100 text-yellow-850 dark:bg-yellow-900/20 dark:text-yellow-450";
        break;
      case 'High':
        classes = "bg-orange-100 text-orange-850 dark:bg-orange-900/20 dark:text-orange-400";
        break;
      case 'Critical':
        classes = "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-extrabold animate-pulse";
        break;
      default:
        classes = "bg-zinc-105 text-zinc-700";
    }
    return <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${classes}`}>{priority}</span>;
  };

  return (
    <div className="p-4 pb-12 max-w-7xl mx-auto space-y-4 bg-zinc-50 dark:bg-zinc-955 min-h-screen">
      
      {/* 1. HERO HEADER PANEL */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
            <Landmark className="w-5 h-5 text-[var(--primary)]" /> Franchise Tickets
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            Manage support requests raised by Franchise Admins including payments, inventory, product syncing, and commission disputes.
          </p>
        </div>
        
        {/* Header Action triggers */}
        <div className="flex items-center gap-1.5 self-start md:self-center">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3 rounded-lg bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white text-[10px] font-bold shadow-sm transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create Ticket
          </button>
          
          <button 
            onClick={exportCSV}
            className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-[10px] font-bold text-zinc-650 dark:text-zinc-300 transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export Tickets
          </button>

          <button 
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 900); }}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. KPI DASHBOARD BENTO GRID */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Tickets", val: kpiMetrics.totalTickets, icon: Users, color: "text-[var(--primary)] bg-[var(--primary)]/10" },
          { label: "Open Tickets", val: kpiMetrics.openTickets, icon: Clock, color: "text-blue-600 bg-blue-500/10" },
          { label: "Critical Issues", val: kpiMetrics.criticalIssues, icon: AlertTriangle, color: "text-red-650 bg-red-500/10" },
          { label: "Pending Approval", val: kpiMetrics.pendingApproval, icon: Star, color: "text-purple-650 bg-purple-500/10" },
          { label: "Resolved Tickets", val: kpiMetrics.resolvedTickets, icon: CheckCircle2, color: "text-emerald-650 bg-emerald-500/10" },
          { label: "Avg Resolution Time", val: kpiMetrics.averageResolutionTime, icon: Clock, color: "text-indigo-600 bg-indigo-500/10" }
        ].map((card, i) => (
          <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-150 dark:border-zinc-800 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">{card.label}</p>
              <h3 className="text-base font-black text-zinc-905 dark:text-zinc-50 mt-0.5">{loading ? "..." : card.val}</h3>
            </div>
            <div className={`p-1.5 rounded-lg ${card.color} shrink-0`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </section>

      {/* 3. SEARCH & CONTROLS BLOCK */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Main search and filters trigger */}
          <div className="flex items-center gap-2 flex-grow">
            <div className="relative flex-grow max-w-md group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[var(--primary)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search ticket id, franchise, reporter or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] transition-all font-semibold text-zinc-900 dark:text-zinc-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 px-3 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                showFilters 
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' 
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-650 dark:text-zinc-350'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>

          {/* Column Visibility and Bulk operations */}
          <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
            
            {/* Bulk actions */}
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-2">
                <span className="text-[10px] font-black text-zinc-500">{selectedRows.length} Selected:</span>
                <button 
                  onClick={() => setIsBulkAssignOpen(true)}
                  className="h-7 px-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-750 dark:text-zinc-300 rounded text-[9px] font-bold border border-zinc-200 dark:border-zinc-700"
                >
                  Bulk Assign
                </button>
                <button 
                  onClick={handleBulkResolve}
                  className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold"
                >
                  Bulk Resolve
                </button>
                <button 
                  onClick={handleBulkClose}
                  className="h-7 px-2.5 bg-zinc-600 hover:bg-zinc-750 text-white rounded text-[9px] font-bold"
                >
                  Bulk Close
                </button>
              </div>
            )}

            {/* Column visibility dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowColMenu(!showColMenu)}
                className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Columns <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showColMenu && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-xl z-50 space-y-1 select-none">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide px-1.5 py-0.5">Toggle Columns</p>
                  <hr className="border-zinc-100 dark:border-zinc-900" />
                  {Object.keys(visibleColumns).map((col) => (
                    <label key={col} className="flex items-center gap-2 px-1.5 py-1 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns[col]} 
                        onChange={() => toggleColumn(col)}
                        className="accent-[var(--primary)]"
                      />
                      <span className="capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 3.1 ADVANCED FILTERS PANEL */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 animate-fade-down">
            
            {/* Ticket ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Ticket ID</label>
              <input 
                type="text" 
                placeholder="E.g., FTK-29048..."
                value={filterTicketId}
                onChange={(e) => setFilterTicketId(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none"
              />
            </div>

            {/* Franchise */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Franchise Node</label>
              <input 
                type="text" 
                placeholder="E.g., Indore..."
                value={filterFranchise}
                onChange={(e) => setFilterFranchise(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none"
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Ticket Type</label>
              <select 
                value={filterType}
                onChange={(e) => setTicketType(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none"
              >
                <option value="">All Categories</option>
                <option value="Store Issue">Store Issue</option>
                <option value="Payment Settlement Issue">Payment Settlement Issue</option>
                <option value="Inventory Issue">Inventory Issue</option>
                <option value="Staff Problem">Staff Problem</option>
                <option value="System Bug">System Bug</option>
                <option value="Product Synchronization Issue">Product Synchronization Issue</option>
                <option value="Commission Dispute">Commission Dispute</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Priority Severity</label>
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none"
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
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Assigned Department</label>
              <select 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none"
              >
                <option value="">All Departments</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Inventory">Inventory</option>
                <option value="Technical Support">Technical Support</option>
                <option value="HR">HR</option>
                <option value="Settlement Team">Settlement Team</option>
              </select>
            </div>

            {/* Agent */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Assigned Agent</label>
              <input 
                type="text" 
                placeholder="E.g., Amit..."
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none"
              />
            </div>

            {/* Date Range */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Date Range</label>
              <div className="flex items-center gap-1.5">
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-8 px-1.5 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-[10px] font-semibold outline-none"
                />
                <span className="text-zinc-400 font-bold text-xs">-</span>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-8 px-1.5 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg text-[10px] font-semibold outline-none"
                />
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800/80">
              <button 
                onClick={handleResetFilters}
                className="h-8 px-4 rounded-lg bg-zinc-200 hover:bg-zinc-350 text-zinc-650 text-[10px] font-bold transition-colors"
              >
                Reset Filters
              </button>
            </div>

          </div>
        )}
      </section>

      {/* 4. TICKETS DATA TABLE */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-sm flex flex-col min-h-[300px] overflow-hidden">
        
        {loading ? (
          /* Skeleton Loader */
          <div className="p-6 space-y-4">
            <div className="h-4 bg-zinc-150 dark:bg-zinc-800 rounded w-1/3 animate-pulse"></div>
            <div className="space-y-2 pt-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 py-2 border-b border-zinc-100 dark:border-zinc-850">
                  <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded col-span-2 animate-pulse"></div>
                  <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : sortedTickets.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-3">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-black text-zinc-855 dark:text-zinc-50">No Franchise Tickets Found</h3>
            <p className="text-[10px] text-zinc-400 mt-1 max-w-sm">
              We couldn't find any tickets matching your search query or filter parameters. Try checking spelling or resetting filter values.
            </p>
            <button 
              onClick={handleResetFilters}
              className="mt-3.5 h-8 px-4 rounded-lg bg-[var(--primary)] text-white text-[10px] font-bold shadow-sm transition-all active:scale-95"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Active Tickets Table */
          <div className="overflow-x-auto flex-1 min-h-[300px]">
            <table className="w-full text-left border-collapse relative">
              
              {/* Table Sticky Header */}
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 z-10 border-b border-zinc-200 dark:border-zinc-700 shadow-[0_1px_0_0_rgba(200,200,200,0.1)]">
                <tr className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                  <th className="p-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedRows.length === tickets.length}
                      className="accent-[var(--primary)] cursor-pointer"
                    />
                  </th>
                  {visibleColumns.ticketNumber && (
                    <th onClick={() => requestSort('ticketNumber')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap">
                      Ticket ID {sortField === 'ticketNumber' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  {visibleColumns.franchiseName && (
                    <th onClick={() => requestSort('franchiseName')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      Franchise Partner {sortField === 'franchiseName' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  {visibleColumns.type && (
                    <th onClick={() => requestSort('type')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap">
                      Category Type {sortField === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  {visibleColumns.subject && (
                    <th className="p-3 w-80">Subject Request</th>
                  )}
                  {visibleColumns.priority && (
                    <th onClick={() => requestSort('priority')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      Priority {sortField === 'priority' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th onClick={() => requestSort('status')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  {visibleColumns.assignedDepartment && (
                    <th onClick={() => requestSort('assignedDepartment')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap">
                      Assigned Dept {sortField === 'assignedDepartment' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  {visibleColumns.assignedTo && (
                    <th onClick={() => requestSort('assignedTo')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      Handler {sortField === 'assignedTo' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  {visibleColumns.createdAt && (
                    <th onClick={() => requestSort('createdAt')} className="p-3 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap">
                      Raised Date {sortField === 'createdAt' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  )}
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {paginatedTickets.map((t) => (
                  <tr 
                    key={t._id}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all group ${
                      selectedRows.includes(t._id) ? 'bg-[var(--primary)]/5 dark:bg-[var(--primary)]/5' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedRows.includes(t._id)}
                        onChange={() => handleSelectRow(t._id)}
                        className="accent-[var(--primary)] cursor-pointer"
                      />
                    </td>
                    {visibleColumns.ticketNumber && (
                      <td className="p-3 font-mono font-black text-[var(--primary)] whitespace-nowrap">{t.ticketNumber}</td>
                    )}
                    {visibleColumns.franchiseName && (
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">{t.franchiseName}</p>
                          <p className="text-[9px] text-zinc-400 font-semibold">{t.franchiseCode} • {t.region || 'Central'}</p>
                        </div>
                      </td>
                    )}
                    {visibleColumns.type && (
                      <td className="p-3">
                        <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-[8px] uppercase rounded font-black text-zinc-650 dark:text-zinc-400">
                          {t.type.replace(' Issue', '')}
                        </span>
                      </td>
                    )}
                    {visibleColumns.subject && (
                      <td className="p-3">
                        <div className="space-y-0.5 max-w-xs md:max-w-sm">
                          <p className="font-bold text-zinc-850 dark:text-zinc-100 truncate" title={t.subject}>{t.subject}</p>
                          <p className="text-[10px] text-zinc-400 font-medium truncate" title={t.description}>{t.description}</p>
                        </div>
                      </td>
                    )}
                    {visibleColumns.priority && (
                      <td className="p-3">{getPriorityBadge(t.priority)}</td>
                    )}
                    {visibleColumns.status && (
                      <td className="p-3">{getStatusBadge(t.status)}</td>
                    )}
                    {visibleColumns.assignedDepartment && (
                      <td className="p-3 text-zinc-555 dark:text-zinc-400 font-bold">{t.assignedDepartment}</td>
                    )}
                    {visibleColumns.assignedTo && (
                      <td className="p-3 font-bold">{t.assignedTo || <span className="text-zinc-400 italic">Unassigned</span>}</td>
                    )}
                    {visibleColumns.createdAt && (
                      <td className="p-3 text-zinc-400 text-[10px] whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}

                    {/* Actions Menu */}
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1 select-none">
                        <button 
                          onClick={() => { setActiveTicket(t); setIsViewOpen(true); }}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-200 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setActiveTicket(t); setIsAssignOpen(true); }}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 hover:text-[var(--primary)] transition-colors"
                          title="Assign"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setActiveTicket(t); setIsEscalateOpen(true); }}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 hover:text-red-500 transition-colors"
                          title="Escalate"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setActiveTicket(t); setIsResolveOpen(true); }}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 hover:text-emerald-500 transition-colors"
                          title="Resolve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTicket(t._id, t.ticketNumber)}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-400 hover:text-red-650 transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. STICKY TABLE FOOTER (PAGINATION PANEL) */}
        {!loading && totalPages > 0 && (
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between mt-auto shrink-0 text-[10px] font-bold text-zinc-500 select-none">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedTickets.length)} of {sortedTickets.length} Franchise Tickets
            </span>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      : 'bg-white dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-zinc-705 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 6. MODAL PORTALS */}
      <CreateFranchiseTicketModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreateSuccess={handleCreateSuccess}
      />
      
      {activeTicket && (
        <>
          <FranchiseTicketDetailsModal 
            isOpen={isViewOpen} 
            onClose={() => { setIsViewOpen(false); setActiveTicket(null); }} 
            ticket={activeTicket}
            onUpdateTicket={handleUpdateTicket}
          />

          <AssignDepartmentModal 
            isOpen={isAssignOpen} 
            onClose={() => { setIsAssignOpen(false); setActiveTicket(null); }} 
            ticketNumber={activeTicket.ticketNumber}
            onAssignSuccess={(dept, agent, priority, notes) => handleUpdateTicket({
              ...activeTicket,
              assignedDepartment: dept,
              assignedTo: agent.split(' ')[0],
              priority,
              status: 'In Progress',
              updatedAt: new Date().toISOString()
            })}
          />

          <EscalateFranchiseTicketModal 
            isOpen={isEscalateOpen} 
            onClose={() => { setIsEscalateOpen(false); setActiveTicket(null); }} 
            ticketNumber={activeTicket.ticketNumber}
            onEscalateSuccess={(level, department, reason, remarks) => handleUpdateTicket({
              ...activeTicket,
              status: 'Escalated',
              priority: 'Critical',
              assignedDepartment: department,
              updatedAt: new Date().toISOString()
            })}
          />

          <ResolveFranchiseTicketModal 
            isOpen={isResolveOpen} 
            onClose={() => { setIsResolveOpen(false); setActiveTicket(null); }} 
            ticketNumber={activeTicket.ticketNumber}
            onResolveSuccess={(notes, category, comments) => handleUpdateTicket({
              ...activeTicket,
              status: 'Resolved',
              resolvedAt: new Date().toISOString(),
              resolution: notes,
              updatedAt: new Date().toISOString()
            })}
          />

          <CloseFranchiseTicketModal 
            isOpen={isCloseOpen} 
            onClose={() => { setIsCloseOpen(false); setActiveTicket(null); }} 
            ticketNumber={activeTicket.ticketNumber}
            onCloseSuccess={(remarks, finalStatus) => handleUpdateTicket({
              ...activeTicket,
              status: 'Closed',
              updatedAt: new Date().toISOString()
            })}
          />
        </>
      )}

      {/* Bulk Assign Portal */}
      <AssignDepartmentModal 
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        ticketNumber={`Bulk selection (${selectedRows.length} tickets)`}
        onAssignSuccess={handleBulkAssign}
      />

    </div>
  );
}
