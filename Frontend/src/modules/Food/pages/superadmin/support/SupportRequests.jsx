import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, RefreshCw, Users, CheckCircle2, 
  AlertTriangle, SlidersHorizontal, Search, Clock, 
  Database, ShieldAlert, Eye, Check, ChevronLeft, 
  ChevronRight, LayoutGrid, X, Trash2, UserCheck, 
  AlertCircle, Shield, LifeBuoy, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

// Import Modals
import CreateSupportRequestModal from './CreateSupportRequestModal';
import SupportRequestDetailsModal from './SupportRequestDetailsModal';
import AssignSupportAgentModal from './AssignSupportAgentModal';
import ChangePriorityModal from './ChangePriorityModal';
import EscalateRequestModal from './EscalateRequestModal';
import ResolveRequestModal from './ResolveRequestModal';
import CloseRequestModal from './CloseRequestModal';

export default function SupportRequests() {
  // Page Loading State
  const [loading, setLoading] = useState(true);

  // Search & Filter Panel State
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Advanced Filter Inputs
  const [filterRequestId, setFilterRequestId] = useState('');
  const [filterRequester, setFilterRequester] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterFranchise, setFilterFranchise] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Column Visibility State
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    requestNumber: true,
    requesterName: true,
    requesterRole: true,
    category: true,
    priority: true,
    status: true,
    assignedTo: true,
    createdAt: true,
    actions: true
  });

  // Table Selections & Sorting
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Request Modals State
  const [activeRequest, setActiveRequest] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  // Raw mock requests matching DB collections and relationships
  const [requests, setRequests] = useState([
    {
      _id: "sr_90182",
      requestNumber: "SRQ-90182",
      requesterId: "req_3",
      requesterName: "Amit Sharma",
      requesterRole: "Store Manager",
      employeeId: "EMP-MGR-82",
      phone: "+91 94072 88402",
      email: "amit.sharma@papaveg.com",
      store: "Indore Vijay Nagar",
      franchise: "Indore Group",
      category: "Technical",
      subcategory: "POS Issue",
      subject: "POS printer thermal roll jammed during order printing",
      description: "Counter 2 thermal printer is repeatedly jamming on receipt generation. Cleaned roller but hardware issue persists. Need operational replacement roll or service.",
      priority: "Medium",
      status: "In Progress",
      assignedTo: "Amit Patel",
      department: "Technical Team",
      attachments: ["printer_jam_photo.jpg"],
      createdAt: "2026-06-19T22:30:00.000Z",
      updatedAt: "2026-06-19T23:05:00.000Z"
    },
    {
      _id: "sr_82914",
      requestNumber: "SRQ-82914",
      requesterId: "req_1",
      requesterName: "Neha Singh",
      requesterRole: "Admin",
      employeeId: "EMP-ADM-02",
      phone: "+91 94012 34567",
      email: "neha.singh@papaveg.com",
      store: "All Nodes",
      franchise: "Global Corporate",
      category: "HR",
      subcategory: "Salary Issue",
      subject: "Salary mismatch for May month regarding overtime incentive calculation",
      description: "May salary ledger lists overtime as 8 hours instead of approved 16 hours. Verified biometric punch shows matching shifts. Please correct discrepancy of ₹3,450.",
      priority: "High",
      status: "Open",
      assignedTo: "Unassigned",
      department: "HR Team",
      attachments: ["attendance_sheets.pdf"],
      createdAt: "2026-06-19T20:15:00.000Z",
      updatedAt: "2026-06-19T20:15:00.000Z"
    },
    {
      _id: "sr_77821",
      requestNumber: "SRQ-77821",
      requesterId: "req_7",
      requesterName: "Rahul Dev",
      requesterRole: "Delivery Partner",
      employeeId: "EMP-RDR-442",
      phone: "+91 98930 22114",
      email: "rahul.rider@gmail.com",
      store: "Bhopal MP Nagar",
      franchise: "Bhopal Foods",
      category: "Delivery",
      subcategory: "Rider App Issue",
      subject: "Rider app GPS showing incorrect delivery coordinates for order",
      description: "Rider application continuously fails to sync GPS pins. Points to central lake instead of MP Nagar Zone-2 address. Stack error code 403 geo-auth.",
      priority: "Critical",
      status: "Escalated",
      assignedTo: "Rohit Joshi",
      department: "Support Team",
      attachments: ["gps_log.txt", "screenshot_rider.png"],
      createdAt: "2026-06-19T18:40:00.000Z",
      updatedAt: "2026-06-19T19:12:00.000Z"
    },
    {
      _id: "sr_66512",
      requestNumber: "SRQ-66512",
      requesterId: "req_5",
      requesterName: "Vikram Singh",
      requesterRole: "Kitchen Staff",
      employeeId: "EMP-KIT-102",
      phone: "+91 91029 44859",
      email: "vikram.s@papaveg.com",
      store: "Indore Vijay Nagar",
      franchise: "Indore Group",
      category: "Operational",
      subcategory: "Kitchen Delay",
      subject: "Kitchen display screen freezing during peak rush",
      description: "KDS screen 1 gets stuck loading orders when order count exceeds 15. Requires device reboot which delays preparation times by 8-10 mins. Checked network socket.",
      priority: "Low",
      status: "Resolved",
      assignedTo: "Rajesh Sharma",
      department: "Operations Team",
      attachments: [],
      createdAt: "2026-06-18T16:10:00.000Z",
      updatedAt: "2026-06-19T11:45:00.000Z"
    },
    {
      _id: "sr_55219",
      requestNumber: "SRQ-55219",
      requesterId: "req_9",
      requesterName: "Automated Job Server",
      requesterRole: "System",
      employeeId: "SYS-CRON-01",
      phone: "-",
      email: "cron-agent@papaveg.com",
      store: "Infrastructure Cloud",
      franchise: "System Admin",
      category: "System",
      subcategory: "Automated Job Fail",
      subject: "Daily sales backup sync cron job failed with status code 500",
      description: "System backup server failed to write dump file to S3 bucket. Access denied error on bucket policy. Need to verify IAM credentials.",
      priority: "Critical",
      status: "Open",
      assignedTo: "Unassigned",
      department: "Technical Team",
      attachments: ["s3_error_logs.txt"],
      createdAt: "2026-06-19T23:55:00.000Z",
      updatedAt: "2026-06-19T23:55:00.000Z"
    },
    {
      _id: "sr_44810",
      requestNumber: "SRQ-44810",
      requesterId: "req_2",
      requesterName: "Gaurav Joshi",
      requesterRole: "Admin",
      employeeId: "EMP-ADM-09",
      phone: "+91 82230 45678",
      email: "gaurav.j@papaveg.com",
      store: "All Nodes",
      franchise: "Global Corporate",
      category: "Technical",
      subcategory: "POS Issue",
      subject: "Online orders not syncing to POS counter 2",
      description: "Counter 2 has disconnected from order sockets. Orders show in dashboard but not in terminal. Manual entry is required which causes data mismatch.",
      priority: "High",
      status: "Pending",
      assignedTo: "Sandeep Kumar",
      department: "Technical Team",
      attachments: [],
      createdAt: "2026-06-19T12:30:00.000Z",
      updatedAt: "2026-06-19T14:20:00.000Z"
    },
    {
      _id: "sr_33104",
      requestNumber: "SRQ-33104",
      requesterId: "req_4",
      requesterName: "Ramesh Kumar",
      requesterRole: "Store Manager",
      employeeId: "EMP-MGR-34",
      phone: "+91 75529 11029",
      email: "ramesh.k@papaveg.com",
      store: "Bhopal MP Nagar",
      franchise: "Bhopal Foods",
      category: "Operational",
      subcategory: "Inventory Problem",
      subject: "Cheese block shipment received without cold storage sealing",
      description: "Received 10 boxes of Mozzarella Cheese from Central WH-02. Temperature was recorded at 24C due to broken seal in cargo transit. Requesting replacement stock.",
      priority: "Medium",
      status: "Resolved",
      assignedTo: "Meera Nair",
      department: "Operations Team",
      attachments: ["damaged_cheese_seal.png"],
      createdAt: "2026-06-17T11:00:00.000Z",
      updatedAt: "2026-06-18T10:20:00.000Z"
    },
    {
      _id: "sr_22019",
      requestNumber: "SRQ-22019",
      requesterId: "req_6",
      requesterName: "Karan Johar",
      requesterRole: "Kitchen Staff",
      employeeId: "EMP-KIT-94",
      phone: "+91 88770 11223",
      email: "karan.j@papaveg.com",
      store: "Bhopal MP Nagar",
      franchise: "Bhopal Foods",
      category: "HR",
      subcategory: "Leave Request",
      subject: "Emergency leave application for 3 days due to family medical issue",
      description: "Kitchen assistant Karan requesting leave from 21st to 23rd June. Store manager approved but needs HR database logging.",
      priority: "Low",
      status: "Closed",
      assignedTo: "Shalini Gupta",
      department: "HR Team",
      attachments: [],
      createdAt: "2026-06-16T15:20:00.000Z",
      updatedAt: "2026-06-17T17:15:00.000Z"
    }
  ]);

  // Loading state simulation
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Search Debouncing (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Dynamic KPI Metrics calculations
  const kpiMetrics = React.useMemo(() => {
    const total = requests.length;
    const open = requests.filter(r => r.status === 'Open').length;
    const tech = requests.filter(r => r.category === 'Technical').length;
    const operational = requests.filter(r => r.category === 'Operational').length;
    const pending = requests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length;
    const resolved = requests.filter(r => r.status === 'Resolved' || r.status === 'Closed').length;
    
    return {
      total,
      open,
      tech,
      operational,
      pending,
      resolved,
      avgTime: "2.8 Hours"
    };
  }, [requests]);

  // Column Visibility toggle helper
  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // Row selection handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredRequests.map(r => r._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Advanced Filters and Search Matching Logic
  const filteredRequests = React.useMemo(() => {
    return requests.filter(r => {
      // 1. Debounced Search query
      const matchSearch = debouncedSearch.trim() === '' || 
        r.requestNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.assignedTo.toLowerCase().includes(debouncedSearch.toLowerCase());

      // 2. Custom Advanced Filters
      const matchId = filterRequestId.trim() === '' || r.requestNumber.toLowerCase().includes(filterRequestId.toLowerCase());
      const matchReq = filterRequester.trim() === '' || r.requesterName.toLowerCase().includes(filterRequester.toLowerCase());
      const matchRole = filterRole === '' || r.requesterRole === filterRole;
      const matchStore = filterStore.trim() === '' || r.store.toLowerCase().includes(filterStore.toLowerCase());
      const matchFranchise = filterFranchise.trim() === '' || r.franchise.toLowerCase().includes(filterFranchise.toLowerCase());
      const matchCategory = filterCategory === '' || r.category === filterCategory;
      const matchPriority = filterPriority === '' || r.priority === filterPriority;
      const matchStatus = filterStatus === '' || r.status === filterStatus;
      const matchAgent = filterAgent.trim() === '' || r.assignedTo.toLowerCase().includes(filterAgent.toLowerCase());

      // 3. Date Filters
      let matchDate = true;
      if (dateFrom) {
        matchDate = matchDate && new Date(r.createdAt) >= new Date(dateFrom);
      }
      if (dateTo) {
        // end of day matching
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchDate = matchDate && new Date(r.createdAt) <= toDate;
      }

      return matchSearch && matchId && matchReq && matchRole && matchStore && matchFranchise && matchCategory && matchPriority && matchStatus && matchAgent && matchDate;
    });
  }, [requests, debouncedSearch, filterRequestId, filterRequester, filterRole, filterStore, filterFranchise, filterCategory, filterPriority, filterStatus, filterAgent, dateFrom, dateTo]);

  // Sorting Logic
  const sortedRequests = React.useMemo(() => {
    const list = [...filteredRequests];
    list.sort((a, b) => {
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
    return list;
  }, [filteredRequests, sortField, sortDirection]);

  // Pagination bounds
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const paginatedRequests = sortedRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleRequestSort = (field) => {
    let direction = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortField(field);
    setSortDirection(direction);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterRequestId('');
    setFilterRequester('');
    setFilterRole('');
    setFilterStore('');
    setFilterFranchise('');
    setFilterCategory('');
    setFilterPriority('');
    setFilterStatus('');
    setFilterAgent('');
    setDateFrom('');
    setDateTo('');
    toast.success("Filters reset successfully");
  };

  // CSV Exporter
  const exportCSV = () => {
    const rowsToExport = selectedRows.length > 0 
      ? requests.filter(r => selectedRows.includes(r._id))
      : filteredRequests;

    if (rowsToExport.length === 0) {
      toast.error("No support requests available to export");
      return;
    }

    const headers = ["Request ID", "Requester Name", "Role", "Store Node", "Franchise", "Category", "Subcategory", "Subject", "Priority", "Status", "Assigned Agent", "Created At"];
    const csvRows = [
      headers.join(','),
      ...rowsToExport.map(r => [
        `"${r.requestNumber}"`,
        `"${r.requesterName}"`,
        `"${r.requesterRole}"`,
        `"${r.store}"`,
        `"${r.franchise}"`,
        `"${r.category}"`,
        `"${r.subcategory}"`,
        `"${r.subject.replace(/"/g, '""')}"`,
        `"${r.priority}"`,
        `"${r.status}"`,
        `"${r.assignedTo}"`,
        `"${new Date(r.createdAt).toLocaleDateString('en-IN')}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `internal_support_requests_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Successfully exported ${rowsToExport.length} requests to CSV`);
  };

  // Bulk Operations
  const handleBulkResolve = () => {
    if (selectedRows.length === 0) return;
    
    setRequests(prev => prev.map(r => {
      if (selectedRows.includes(r._id)) {
        return {
          ...r,
          status: 'Resolved',
          resolutionCategory: 'Bulk Action Fix',
          resolutionNotes: 'Resolved via bulk action console operations by Super Admin.',
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));
    
    toast.success(`Successfully resolved ${selectedRows.length} requests in bulk`);
    setSelectedRows([]);
  };

  const handleBulkClose = () => {
    if (selectedRows.length === 0) return;

    setRequests(prev => prev.map(r => {
      if (selectedRows.includes(r._id)) {
        return {
          ...r,
          status: 'Closed',
          closedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    toast.success(`Successfully closed & archived ${selectedRows.length} requests in bulk`);
    setSelectedRows([]);
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;

    setRequests(prev => prev.filter(r => !selectedRows.includes(r._id)));
    toast.success(`Successfully deleted ${selectedRows.length} records`);
    setSelectedRows([]);
  };

  // Single record mutations from details modal
  const handleUpdateRequest = (updated) => {
    setRequests(prev => prev.map(r => r._id === updated._id ? updated : r));
    if (activeRequest && activeRequest._id === updated._id) {
      setActiveRequest(updated);
    }
  };

  const handleCreateSuccess = (newReq) => {
    setRequests(prev => [newReq, ...prev]);
  };

  const handleAssignAction = (updatedRequest, details) => {
    handleUpdateRequest(updatedRequest);
  };

  const handlePriorityAction = (updatedRequest, details) => {
    handleUpdateRequest(updatedRequest);
  };

  const handleEscalateAction = (updatedRequest, details) => {
    handleUpdateRequest(updatedRequest);
  };

  const handleResolveAction = (updatedRequest, details) => {
    handleUpdateRequest(updatedRequest);
  };

  const handleCloseAction = (updatedRequest, details) => {
    handleUpdateRequest(updatedRequest);
  };

  // Status/Priority badge CSS helpers
  const getStatusBadge = (status) => {
    const classes = {
      Open: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'In Progress': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      Pending: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      Escalated: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-450 border-rose-200 dark:border-rose-800',
      Resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-800',
      Closed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border-zinc-200 dark:border-zinc-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase ${classes[status] || 'bg-zinc-50'}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (prio) => {
    const classes = {
      Low: 'bg-zinc-100 text-zinc-705 dark:bg-zinc-800 dark:text-zinc-300',
      Medium: 'bg-yellow-100 text-yellow-850 dark:bg-yellow-900/20 dark:text-yellow-455',
      High: 'bg-orange-100 text-orange-850 dark:bg-orange-900/20 dark:text-orange-400',
      Critical: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-extrabold animate-pulse'
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${classes[prio] || 'bg-zinc-100'}`}>
        {prio}
      </span>
    );
  };

  // Triggers for row modals
  const openRowModal = (requestItem, modalSetter) => {
    setActiveRequest(requestItem);
    modalSetter(true);
  };

  return (
    <div className="p-4 pb-12 max-w-7xl mx-auto space-y-4 bg-zinc-50 dark:bg-zinc-955 min-h-screen">
      
      {/* 1. HERO HEADER PANEL */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5 animate-pulse">
            <LifeBuoy className="w-5 h-5 text-[var(--primary)]" /> Customer Complaints & Support Requests
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            Manage internal technical, operational, delivery, HR, and system support requests raised across the platform.
          </p>
        </div>
        
        {/* Actions panel */}
        <div className="flex items-center gap-1.5 self-start md:self-center">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3 rounded-lg bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white text-[10px] font-bold shadow-sm transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create Request
          </button>
          
          <button 
            onClick={exportCSV}
            className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-[10px] font-bold text-zinc-650 dark:text-zinc-300 transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export Requests
          </button>

          <button 
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. KPI DASHBOARD BENTO GRID */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Requests", val: kpiMetrics.total, icon: Users, color: "text-[var(--primary)] bg-[var(--primary)]/10" },
          { label: "Open Requests", val: kpiMetrics.open, icon: Clock, color: "text-blue-600 bg-blue-500/10" },
          { label: "Technical Issues", val: kpiMetrics.tech, icon: Database, color: "text-indigo-650 bg-indigo-500/10" },
          { label: "Operational Issues", val: kpiMetrics.operational, icon: SlidersHorizontal, color: "text-amber-600 bg-amber-500/10" },
          { label: "Pending Requests", val: kpiMetrics.pending, icon: AlertCircle, color: "text-purple-650 bg-purple-500/10" },
          { label: "Resolved Today", val: kpiMetrics.resolved, icon: CheckCircle2, color: "text-emerald-650 bg-emerald-500/10" }
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
                placeholder="Search request id, subject, requester or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] transition-all font-semibold text-zinc-900 dark:text-zinc-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650">
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
              Advanced Filters
            </button>
          </div>

          {/* Column Visibility and Bulk operations */}
          <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
            
            {/* Bulk actions */}
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-2">
                <span className="text-[10px] font-black text-zinc-500">{selectedRows.length} Selected:</span>
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
                <button 
                  onClick={handleBulkDelete}
                  className="h-7 px-2.5 bg-red-655 hover:bg-red-700 text-white rounded text-[9px] font-bold"
                >
                  Bulk Delete
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

        {/* 3.1 COLLAPSIBLE ADVANCED FILTERS PANEL */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 animate-fade-down">
            
            {/* Request ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Request ID</label>
              <input 
                type="text" 
                placeholder="E.g., SRQ-90182..."
                value={filterRequestId}
                onChange={(e) => setFilterRequestId(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-50 font-semibold"
              />
            </div>

            {/* Requester Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Requester Name</label>
              <input 
                type="text" 
                placeholder="E.g., Amit..."
                value={filterRequester}
                onChange={(e) => setFilterRequester(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-50 font-semibold"
              />
            </div>

            {/* Requester Role */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Requester Role</label>
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Store Manager">Store Manager</option>
                <option value="Kitchen Staff">Kitchen Staff</option>
                <option value="Delivery Partner">Delivery Partner</option>
                <option value="System">System Automated</option>
              </select>
            </div>

            {/* Store Node */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Store Node</label>
              <input 
                type="text" 
                placeholder="E.g., Indore..."
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-50 font-semibold"
              />
            </div>

            {/* Franchise Group */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Franchise Group</label>
              <input 
                type="text" 
                placeholder="E.g., Indore Group..."
                value={filterFranchise}
                onChange={(e) => setFilterFranchise(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-50 font-semibold"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Category</label>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
              >
                <option value="">All Categories</option>
                <option value="Technical">Technical</option>
                <option value="Operational">Operational</option>
                <option value="Delivery">Delivery</option>
                <option value="HR">HR</option>
                <option value="System">System</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Priority Severity</label>
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
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
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-zinc-50 font-semibold"
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

            {/* Assigned Agent */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">Assigned Agent</label>
              <input 
                type="text" 
                placeholder="E.g., Amit..."
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-50 font-semibold"
              />
            </div>

            {/* Date Range */}
            <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-1 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">From</label>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-8 px-1 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-[10px] outline-none text-zinc-900 dark:text-zinc-50 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">To</label>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-8 px-1 bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg text-[10px] outline-none text-zinc-900 dark:text-zinc-50 font-bold"
                />
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex items-end lg:col-span-5 justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-8 px-4 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all"
              >
                Clear All Filters
              </button>
            </div>

          </div>
        )}
      </section>

      {/* 4. DATA TABLE SECTION */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* STICKY OPAQUE TABLE HEADER */}
            <thead className="sticky top-[52px] z-10 bg-zinc-50 dark:bg-zinc-800/95 backdrop-blur-sm text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredRequests.length > 0 && selectedRows.length === filteredRequests.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 border border-zinc-300 dark:border-zinc-700 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                </th>
                
                {visibleColumns.requestNumber && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('requestNumber')}>
                    Request ID {sortField === 'requestNumber' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}
                
                {visibleColumns.requesterName && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('requesterName')}>
                    Requester Name {sortField === 'requesterName' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}

                {visibleColumns.requesterRole && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('requesterRole')}>
                    Requester Role {sortField === 'requesterRole' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}

                {visibleColumns.category && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('category')}>
                    Category {sortField === 'category' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}

                {visibleColumns.priority && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('priority')}>
                    Severity {sortField === 'priority' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}

                {visibleColumns.status && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('status')}>
                    Status {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}

                {visibleColumns.assignedTo && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('assignedTo')}>
                    Assigned Agent {sortField === 'assignedTo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}

                {visibleColumns.createdAt && (
                  <th className="px-4 py-3.5 cursor-pointer select-none whitespace-nowrap" onClick={() => handleRequestSort('createdAt')}>
                    Created At {sortField === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                )}

                {visibleColumns.actions && (
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-semibold">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-20 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      <span>Loading support desk logs database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRequests.map((req) => {
                const isSelected = selectedRows.includes(req._id);
                return (
                  <tr 
                    key={req._id}
                    className={`hover:bg-zinc-55/40 dark:hover:bg-zinc-800/40 transition-colors group ${
                      isSelected ? 'bg-zinc-100/50 dark:bg-zinc-800/30' : ''
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(req._id)}
                        className="w-4 h-4 border border-zinc-300 dark:border-zinc-700 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    </td>

                    {/* Request ID */}
                    {visibleColumns.requestNumber && (
                      <td className="px-4 py-3 font-mono font-bold text-[var(--primary)]">
                        {req.requestNumber}
                      </td>
                    )}

                    {/* Requester Name */}
                    {visibleColumns.requesterName && (
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-black">
                        {req.requesterName}
                      </td>
                    )}

                    {/* Requester Role */}
                    {visibleColumns.requesterRole && (
                      <td className="px-4 py-3 text-zinc-500">
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[8px] rounded uppercase font-black">
                          {req.requesterRole}
                        </span>
                      </td>
                    )}

                    {/* Category */}
                    {visibleColumns.category && (
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        <div className="flex flex-col">
                          <span>{req.category}</span>
                          <span className="text-[9px] text-zinc-450">{req.subcategory}</span>
                        </div>
                      </td>
                    )}

                    {/* Severity */}
                    {visibleColumns.priority && (
                      <td className="px-4 py-3">
                        {getPriorityBadge(req.priority)}
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <td className="px-4 py-3">
                        {getStatusBadge(req.status)}
                      </td>
                    )}

                    {/* Assigned Agent */}
                    {visibleColumns.assignedTo && (
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                        {req.assignedTo === 'Unassigned' ? (
                          <span className="text-zinc-400 italic">Unassigned</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[8px] flex items-center justify-center font-bold">
                              {req.assignedTo.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{req.assignedTo}</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Created Date */}
                    {visibleColumns.createdAt && (
                      <td className="px-4 py-3 text-zinc-500 font-mono text-[10px]">
                        {new Date(req.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    )}

                    {/* Row actions */}
                    {visibleColumns.actions && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openRowModal(req, setIsDetailsOpen)}
                            className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => openRowModal(req, setIsAssignOpen)}
                            className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 transition-colors"
                            title="Assign Rep"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => openRowModal(req, setIsResolveOpen)}
                            className="p-1.5 rounded bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 transition-all"
                            title="Resolve Case"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}

                  </tr>
                );
              })}

              {!loading && paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                      <LifeBuoy className="w-12 h-12 opacity-30" />
                      <p className="text-sm font-bold">No support requests match your queries</p>
                      <button 
                        type="button" 
                        onClick={handleResetFilters}
                        className="px-4 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-black text-zinc-500 hover:bg-zinc-50 transition-all mt-2"
                      >
                        Reset Search Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* PAGINATION PANEL FOOTER */}
        {!loading && sortedRequests.length > 0 && (
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-500 flex-wrap gap-2">
            <div>
              Showing {Math.min(sortedRequests.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(sortedRequests.length, currentPage * itemsPerPage)} of {sortedRequests.length} Requests logged
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-50 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 rounded border text-[10px] font-black transition-all ${
                      currentPage === idx + 1 
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-500'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-50 transition-opacity"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CREATE REQUEST MODAL */}
      <CreateSupportRequestModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateSuccess={handleCreateSuccess}
      />

      {/* VIEW DETAILS MODAL */}
      {isDetailsOpen && activeRequest && (
        <SupportRequestDetailsModal 
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          request={activeRequest}
          onUpdate={handleUpdateRequest}
        />
      )}

      {/* ROW ACTION SUB-MODALS */}
      {isAssignOpen && activeRequest && (
        <AssignSupportAgentModal 
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          request={activeRequest}
          onAssign={handleAssignAction}
        />
      )}

      {isPriorityOpen && activeRequest && (
        <ChangePriorityModal 
          isOpen={isPriorityOpen}
          onClose={() => setIsPriorityOpen(false)}
          request={activeRequest}
          onChangePriority={handlePriorityAction}
        />
      )}

      {isEscalateOpen && activeRequest && (
        <EscalateRequestModal 
          isOpen={isEscalateOpen}
          onClose={() => setIsEscalateOpen(false)}
          request={activeRequest}
          onEscalate={handleEscalateAction}
        />
      )}

      {isResolveOpen && activeRequest && (
        <ResolveRequestModal 
          isOpen={isResolveOpen}
          onClose={() => setIsResolveOpen(false)}
          request={activeRequest}
          onResolve={handleResolveAction}
        />
      )}

      {isCloseOpen && activeRequest && (
        <CloseRequestModal 
          isOpen={isCloseOpen}
          onClose={() => setIsCloseOpen(false)}
          request={activeRequest}
          onCloseRequest={handleCloseAction}
        />
      )}

    </div>
  );
}
