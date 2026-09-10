import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User, Shield, Store, ClipboardList, Clock, AlertTriangle, 
  MessageSquare, FileText, Send, UserCheck, ShieldAlert,
  ArrowUpRight, AlertCircle, Copy, Check, Info, RefreshCw, 
  DollarSign, Activity, Percent, Layers, Smartphone, Landmark,
  Database, HelpCircle, HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

import AssignDepartmentModal from './AssignDepartmentModal';
import EscalateFranchiseTicketModal from './EscalateFranchiseTicketModal';
import ResolveFranchiseTicketModal from './ResolveFranchiseTicketModal';
import CloseFranchiseTicketModal from './CloseFranchiseTicketModal';

export default function FranchiseTicketDetailsModal({ isOpen, onClose, ticket, onUpdateTicket }) {
  const [activeTab, setActiveTab] = useState('General');
  
  // Nested Modals State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  // Internal Notes State (mock db notes collection representation)
  const [internalNotes, setInternalNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteAttachments, setNoteAttachments] = useState([]);
  const notesEndRef = useRef(null);

  // Activity Timeline State
  const [timelineEvents, setTimelineEvents] = useState([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Copy State
  const [copiedId, setCopiedId] = useState(false);

  // Sync state for sync tab
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (activeTab === 'Internal Notes') {
      notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, internalNotes]);

  // Load ticket mock data relationships
  useEffect(() => {
    if (ticket) {
      // 1. Populate Internal Notes
      setInternalNotes([
        {
          _id: "in_1",
          createdBy: "Amit Sharma",
          role: "Operations Team",
          note: "Franchise code PV-IND-01 is disputing Indore Central store commission on order batch ID 90812. Finance logs show Razorpay payout was processed on 15th, but POS sync was delayed by 3 hours.",
          attachments: ["pos_reconciliation_report.xlsx"],
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 1800000).toISOString()
        },
        {
          _id: "in_2",
          createdBy: "Neha Singh",
          role: "Super Admin",
          note: "Reviewed Razorpay API response. Re-calculated settlement values: Gross: ₹85,420, Platform share (10%): ₹8,542, Net eligible payout: ₹76,878. Transferred discrepancy details to Finance Queue.",
          attachments: [],
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 3600000).toISOString()
        }
      ]);

      // 2. Populate Activity Timeline
      setTimelineEvents([
        {
          _id: "ta_1",
          action: "Ticket Raised",
          performedBy: ticket.adminName || "Suresh Gupta",
          role: "Franchise Admin",
          remarks: `Initiated via Super Admin Portal. Initial Priority: ${ticket.priority}. Type: ${ticket.type}.`,
          createdAt: ticket.createdAt
        },
        {
          _id: "ta_2",
          action: "Assigned Department Node",
          performedBy: "System Gateway",
          role: "System Routing API",
          remarks: `Routed to Technical Support Desk based on ticket metadata categorization.`,
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 120000).toISOString()
        }
      ]);

      // 3. Populate Audit Logs
      setAuditLogs([
        {
          _id: "al_1",
          actorRole: "Franchise Admin",
          actorName: ticket.adminName || "Suresh Gupta",
          action: "Ticket Submission",
          module: "Franchise Support",
          oldValue: "-",
          newValue: `Status: Open | Subj: "${ticket.subject}"`,
          ipAddress: "157.34.120.91",
          device: "Windows 11 Desktop",
          browser: "Google Chrome v124",
          location: "Indore, MP",
          createdAt: ticket.createdAt
        },
        {
          _id: "al_2",
          actorRole: "System Route Agent",
          actorName: "System Gateway",
          action: "Status Transition",
          module: "Franchise Support",
          oldValue: "Pending Route",
          newValue: "Status: Open | Queue: Technical Support",
          ipAddress: "127.0.0.1",
          device: "AWS EC2 API Node",
          browser: "Node.js Axios v1.6",
          location: "Mumbai Region (ap-south-1)",
          createdAt: new Date(new Date(ticket.createdAt).getTime() + 120000).toISOString()
        }
      ]);
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success("Ticket ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const newN = {
      _id: Date.now().toString(),
      createdBy: "Neha Singh (You)",
      role: "Super Admin",
      note: newNote,
      attachments: noteAttachments,
      createdAt: new Date().toISOString()
    };

    setInternalNotes(prev => [...prev, newN]);
    setNewNote('');
    setNoteAttachments([]);

    // Register activity & audit logs
    const act = {
      _id: Date.now().toString(),
      action: "Internal Note Added",
      performedBy: "Neha Singh",
      role: "Super Admin",
      remarks: `Added a private operational comment.`,
      createdAt: new Date().toISOString()
    };
    setTimelineEvents(prev => [...prev, act]);

    const audit = {
      _id: Date.now().toString(),
      actorRole: "Super Admin",
      actorName: "Neha Singh",
      action: "Create Internal Note",
      module: "Franchise Support",
      oldValue: "-",
      newValue: `Note preview: "${newN.note.substring(0, 30)}..."`,
      ipAddress: "103.45.221.84",
      device: "MacBook Pro M3",
      browser: "Safari v17.2",
      location: "Bhopal, MP",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  // State Updates from Sub-Modals
  const handleAssignSuccess = (dept, agent, prio, noteText) => {
    const updated = {
      ...ticket,
      assignedDepartment: dept,
      assignedTo: agent.split(' ')[0],
      priority: prio,
      status: 'In Progress',
      updatedAt: new Date().toISOString()
    };
    onUpdateTicket(updated);

    const act = {
      _id: Date.now().toString(),
      action: "Assigned Representative Node",
      performedBy: "Neha Singh",
      role: "Super Admin",
      remarks: `Assigned: ${agent} (${dept}). Priority severity adjusted to ${prio}.`,
      createdAt: new Date().toISOString()
    };
    setTimelineEvents(prev => [...prev, act]);

    const audit = {
      _id: Date.now().toString(),
      actorRole: "Super Admin",
      actorName: "Neha Singh",
      action: "Reassign Ticket Node",
      module: "Franchise Support",
      oldValue: `Dept: ${ticket.assignedDepartment}, Handler: ${ticket.assignedTo}`,
      newValue: `Dept: ${dept}, Handler: ${agent}, Status: In Progress`,
      ipAddress: "103.45.221.84",
      device: "MacBook Pro M3",
      browser: "Safari v17.2",
      location: "Bhopal, MP",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleEscalateSuccess = (lvl, dept, reason, comments) => {
    const updated = {
      ...ticket,
      status: 'Escalated',
      priority: 'Critical',
      assignedDepartment: dept,
      updatedAt: new Date().toISOString()
    };
    onUpdateTicket(updated);

    const act = {
      _id: Date.now().toString(),
      action: "Ticket Escalated",
      performedBy: "Neha Singh",
      role: "Super Admin",
      remarks: `Escalated to: ${lvl} in ${dept}. Reason: ${reason}.`,
      createdAt: new Date().toISOString()
    };
    setTimelineEvents(prev => [...prev, act]);

    const audit = {
      _id: Date.now().toString(),
      actorRole: "Super Admin",
      actorName: "Neha Singh",
      action: "Ticket Escalation",
      module: "Franchise Support",
      oldValue: `Status: ${ticket.status}, Priority: ${ticket.priority}`,
      newValue: `Status: Escalated, Priority: Critical, Level: ${lvl}, Target: ${dept}`,
      ipAddress: "103.45.221.84",
      device: "MacBook Pro M3",
      browser: "Safari v17.2",
      location: "Bhopal, MP",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleResolveSuccess = (notes, category, comments) => {
    const updated = {
      ...ticket,
      status: 'Resolved',
      resolvedAt: new Date().toISOString(),
      resolution: notes,
      updatedAt: new Date().toISOString()
    };
    onUpdateTicket(updated);

    const act = {
      _id: Date.now().toString(),
      action: "Ticket Resolved",
      performedBy: "Neha Singh",
      role: "Super Admin",
      remarks: `Solved Category: ${category}. Fix Notes: ${notes}.`,
      createdAt: new Date().toISOString()
    };
    setTimelineEvents(prev => [...prev, act]);

    const audit = {
      _id: Date.now().toString(),
      actorRole: "Super Admin",
      actorName: "Neha Singh",
      action: "Resolve Ticket Action",
      module: "Franchise Support",
      oldValue: `Status: ${ticket.status}`,
      newValue: `Status: Resolved | Resolved Category: ${category}`,
      ipAddress: "103.45.221.84",
      device: "MacBook Pro M3",
      browser: "Safari v17.2",
      location: "Bhopal, MP",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleCloseSuccess = (remarks, finalStatus) => {
    const updated = {
      ...ticket,
      status: 'Closed',
      updatedAt: new Date().toISOString()
    };
    onUpdateTicket(updated);

    const act = {
      _id: Date.now().toString(),
      action: "Ticket Closed & Archived",
      performedBy: "Neha Singh",
      role: "Super Admin",
      remarks: `Remarks: ${remarks}. Archive Status: ${finalStatus}.`,
      createdAt: new Date().toISOString()
    };
    setTimelineEvents(prev => [...prev, act]);

    const audit = {
      _id: Date.now().toString(),
      actorRole: "Super Admin",
      actorName: "Neha Singh",
      action: "Close Ticket Action",
      module: "Franchise Support",
      oldValue: `Status: ${ticket.status}`,
      newValue: `Status: Closed | Archive Classification: ${finalStatus}`,
      ipAddress: "103.45.221.84",
      device: "MacBook Pro M3",
      browser: "Safari v17.2",
      location: "Bhopal, MP",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  const triggerResync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Successfully completed full Product database synchronization check");
    }, 1800);
  };

  // Status colors helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Pending':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Escalated':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-450 border-rose-200 dark:border-rose-800';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-450 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800/30 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-zinc-100 text-zinc-705 dark:bg-zinc-800 dark:text-zinc-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-450';
      case 'High':
        return 'bg-orange-100 text-orange-850 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-extrabold animate-pulse';
      default:
        return 'bg-zinc-100 text-zinc-705 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center bg-zinc-50 dark:bg-zinc-955 p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-zinc-900 w-[95%] max-w-6xl h-[700px] max-h-[85vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-98 duration-300">
        
        {/* Top Header Panel */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-800/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              ticket.status === 'Open' ? 'bg-blue-500' :
              ticket.status === 'In Progress' ? 'bg-amber-500' :
              ticket.status === 'Pending' ? 'bg-purple-500' :
              ticket.status === 'Escalated' ? 'bg-red-500' :
              ticket.status === 'Resolved' ? 'bg-emerald-500' : 'bg-zinc-400'
            }`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  Franchise Ticket: {ticket.ticketNumber}
                </h2>
                <button 
                  onClick={() => copyToClipboard(ticket.ticketNumber)}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-zinc-650"
                  title="Copy Ticket ID"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                Entity: <strong className="text-zinc-700 dark:text-zinc-300">{ticket.franchiseName}</strong> ({ticket.franchiseCode}) • Created: {new Date(ticket.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Quick Ticket Action Bar */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button 
              onClick={() => setIsAssignOpen(true)}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-95 flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Reassign Node
            </button>
            <button 
              onClick={() => setIsEscalateOpen(true)}
              className="h-8 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-bold text-red-650 dark:text-red-400 transition-all active:scale-95 flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Escalate
            </button>
            
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors md:ml-4"
            >
              <X className="w-4.5 h-4.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="px-6 border-b border-zinc-200 dark:border-zinc-850 flex gap-2 shrink-0 bg-white dark:bg-zinc-900 overflow-x-auto scrollbar-thin">
          {['General', 'Linked Data', 'Internal Notes', 'Timeline', 'Audit Logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-11 px-3 border-b-2 text-xs font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-[var(--primary)] text-[var(--primary)]' 
                  : 'border-transparent text-zinc-500 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tab}
              {tab === 'Linked Data' && (
                <span className="ml-1 px-1.5 py-0.2 bg-[var(--primary)]/10 text-[var(--primary)] text-[8px] rounded font-bold">
                  {ticket.type}
                </span>
              )}
              {tab === 'Internal Notes' && internalNotes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] rounded-full font-bold">
                  {internalNotes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content Frame */}
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950/20">
          
          {/* TAB 1: GENERAL INFORMATION */}
          {activeTab === 'General' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Primary Subject & Description Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold uppercase rounded text-zinc-600 dark:text-zinc-400">
                      {ticket.type}
                    </span>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{ticket.subject}</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getStatusStyle(ticket.status)}`}>
                      Status: {ticket.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityStyle(ticket.priority)}`}>
                      Priority: {ticket.priority}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-650 dark:text-zinc-355 leading-relaxed font-medium whitespace-pre-line">
                  {ticket.description || "No description provided."}
                </div>

                {/* Attachments Section */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Uploaded Attachments</p>
                    <div className="flex gap-3 flex-wrap">
                      {ticket.attachments.map((file, i) => (
                        <div key={i} className="group relative border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900 w-24 h-24 flex items-center justify-center cursor-pointer shadow-sm hover:scale-[1.02] hover:border-[var(--primary)] transition-all">
                          {file.toLowerCase().endsWith('.pdf') ? (
                            <div className="flex flex-col items-center justify-center p-2 text-center text-red-500">
                              <FileText className="w-8 h-8 mb-1" />
                              <span className="text-[8px] font-bold text-zinc-605 dark:text-zinc-400 truncate w-20">{file}</span>
                            </div>
                          ) : (
                            <>
                              <img 
                                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=150&q=80" 
                                alt={file} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] text-white truncate font-semibold text-center">
                                {file}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stakeholders Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Franchise Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/85 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Franchise Details</p>
                    <p className="text-xs font-black text-zinc-805 dark:text-zinc-50 truncate mt-0.5">{ticket.franchiseName}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Code: {ticket.franchiseCode}</p>
                    <p className="text-[10px] text-zinc-450 mt-0.5">Region: {ticket.region || 'Madhya Pradesh'}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Stores Count: {ticket.storesCount || 8} Outlets</p>
                  </div>
                </div>

                {/* Raise Admin Coordinator Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/85 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-550 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Reporter Admin</p>
                    <p className="text-xs font-black text-zinc-805 dark:text-zinc-50 truncate mt-0.5">{ticket.adminName || 'Suresh Gupta'}</p>
                    <p className="text-[10px] text-zinc-550 mt-1">Role: Franchise Manager</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{ticket.contactPhone || '+91 98270 12345'}</p>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{ticket.contactEmail || 'suresh@franchise.in'}</p>
                  </div>
                </div>

                {/* Assignment Desk Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/85 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-650 dark:text-purple-400 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Assignment Status</p>
                    <p className="text-xs font-black text-zinc-805 dark:text-zinc-50 truncate mt-0.5">{ticket.assignedDepartment || 'Technical Support'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Assigned Agent: <strong className="text-zinc-700 dark:text-zinc-200">{ticket.assignedTo || 'Unassigned'}</strong></p>
                    {ticket.resolvedAt && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold mt-1">
                        Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Resolution Notes Block if Resolved */}
              {ticket.resolution && (
                <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Resolution Details</p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                    {ticket.resolution}
                  </p>
                </div>
              )}

              {/* Settlement Quick actions */}
              <div className="pt-4 border-t border-zinc-250 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-zinc-500">
                <div className="flex gap-4">
                  <span>Last Update: {new Date(ticket.updatedAt).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsResolveOpen(true)}
                    className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Resolve Ticket
                  </button>
                  <button 
                    onClick={() => setIsCloseOpen(true)}
                    className="h-8 px-4 rounded-lg bg-zinc-650 hover:bg-zinc-700 text-white font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" /> Close Ticket
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LINKED DATA (DYNAMIC VIEWS) */}
          {activeTab === 'Linked Data' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Payment Settlement Issue */}
              {ticket.type === 'Payment Settlement Issue' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Pending Settlement</p>
                      <p className="text-xl font-black text-red-650 dark:text-red-450 mt-1">₹85,420</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Last Settled Amount</p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1">₹1,12,900</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Platform Commission</p>
                      <p className="text-xl font-black text-zinc-905 dark:text-zinc-100 mt-1">10.0 %</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Payout Mode</p>
                      <p className="text-sm font-black text-zinc-705 dark:text-zinc-200 mt-2 truncate">Razorpay Bank IMPS</p>
                    </div>
                  </div>

                  {/* Settlement Bank Details */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-zinc-805 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-1">
                      <Landmark className="w-4 h-4 text-emerald-600" /> Authorized Settlement Node Bank
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                      <div>
                        <span className="text-zinc-400 block text-[9px] uppercase">Bank Name</span>
                        <span className="text-zinc-900 dark:text-zinc-100">State Bank of India</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[9px] uppercase">Account Number</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-mono">*********0924</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[9px] uppercase">IFSC Code</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-mono">SBIN0001204</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[9px] uppercase">Settlement Period</span>
                        <span className="text-zinc-900 dark:text-zinc-100">Weekly (Every Monday)</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction History Table */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-855 dark:text-zinc-50">Recent Settlements Log</h4>
                    </div>
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 border-b border-zinc-150 dark:border-zinc-800">
                          <th className="p-3">Reference ID</th>
                          <th className="p-3">Billing Cycle</th>
                          <th className="p-3">Gross Sales</th>
                          <th className="p-3">Platform Charges</th>
                          <th className="p-3">Payout Value</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                        <tr>
                          <td className="p-3 font-mono">TXN-90812</td>
                          <td className="p-3">08 June - 14 June</td>
                          <td className="p-3">₹1,25,440</td>
                          <td className="p-3">₹12,544</td>
                          <td className="p-3 font-black text-emerald-600">₹1,12,900</td>
                          <td className="p-3 text-right font-bold text-emerald-555">Settled</td>
                        </tr>
                        <tr className="bg-red-500/5">
                          <td className="p-3 font-mono">TXN-90411</td>
                          <td className="p-3">01 June - 07 June</td>
                          <td className="p-3">₹94,910</td>
                          <td className="p-3">₹9,491</td>
                          <td className="p-3 font-black text-red-600">₹85,420</td>
                          <td className="p-3 text-right font-bold text-red-650">Disputed</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inventory Issue */}
              {ticket.type === 'Inventory Issue' && (
                <div className="space-y-6">
                  {/* Stock Metrics summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Critical low stock alerts</p>
                      <p className="text-xl font-black text-red-650 mt-1">3 Products</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Connected warehouse</p>
                      <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 mt-2.5">Central Warehouse Indore (WH-02)</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Last restock delivery</p>
                      <p className="text-sm font-bold text-zinc-705 dark:text-zinc-200 mt-2.5">18 June 2026 (via Cargo #9012)</p>
                    </div>
                  </div>

                  {/* Inventory low stock table */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-855 dark:text-zinc-50">Low Stock Product Inventory Table</h4>
                    </div>
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 border-b border-zinc-150 dark:border-zinc-800">
                          <th className="p-3">SKU Code</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Current Stock</th>
                          <th className="p-3">Minimum Alert Limit</th>
                          <th className="p-3">Warehouse Unit</th>
                          <th className="p-3 text-right">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                        <tr>
                          <td className="p-3 font-mono">SKU-PANEER-05</td>
                          <td className="p-3 font-bold">Paneer Tikka Dices (Diced 1kg Pack)</td>
                          <td className="p-3 text-red-600 font-bold">12 Packs</td>
                          <td className="p-3">50 Packs</td>
                          <td className="p-3">Central WH-02</td>
                          <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[8px] font-black uppercase">Critical</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">SKU-CHEESE-MOZ</td>
                          <td className="p-3 font-bold">Shredded Mozzarella Cheese (5kg Box)</td>
                          <td className="p-3 text-orange-655 font-bold">8 Boxes</td>
                          <td className="p-3">20 Boxes</td>
                          <td className="p-3">Central WH-02</td>
                          <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[8px] font-bold uppercase">Warning</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">SKU-DOUGH-MED</td>
                          <td className="p-3 font-bold">Fresh Dough Balls - Medium Size</td>
                          <td className="p-3 text-orange-655 font-bold">18 Balls</td>
                          <td className="p-3">100 Balls</td>
                          <td className="p-3">Central WH-02</td>
                          <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[8px] font-bold uppercase">Warning</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Store Issue */}
              {ticket.type === 'Store Issue' && (
                <div className="space-y-6">
                  {/* Store Details Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50">Indore Vijay Nagar Outlet</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Flat 202, Sector C, Vijay Nagar, Indore</p>
                        <p className="text-[10px] text-zinc-400">POS Identifier: IND-VJY-04 • Opening Hours: 11:00 AM - 11:00 PM</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-705 dark:bg-emerald-950/20 text-[10px] font-bold border border-emerald-200">
                        Operational: Active
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-705 dark:bg-blue-950/20 text-[10px] font-bold border border-blue-200">
                        Orders Queue: Normal
                      </span>
                    </div>
                  </div>

                  {/* Manager and Orders Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Outlet Manager</p>
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 mt-1">Amit Sharma</p>
                      <p className="text-[10px] text-zinc-500 mt-1">+91 94072 88402</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5">amit.sharma@papaveg.com</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Active Orders Pending</p>
                      <p className="text-xl font-black text-[var(--primary)] mt-1">14 Orders</p>
                      <p className="text-[9px] text-zinc-400 mt-1">Average preparing wait time: 18 mins</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Weekly Net Sales</p>
                      <p className="text-xl font-black text-emerald-600 mt-1">₹4,28,450</p>
                      <p className="text-[9px] text-zinc-400 mt-1">Rating: 4.8 / 5.0 (2,400+ reviews)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Synchronization Issue */}
              {ticket.type === 'Product Synchronization Issue' && (
                <div className="space-y-6">
                  {/* Sync status cards */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-yellow-500/10 text-yellow-600 rounded-xl animate-spin" style={{ animationDuration: isSyncing ? '1.5s' : '0s' }}>
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Synchronization Mismatch Detected</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">3 products have mismatched price points or category nodes between regional inventory and local POS caches.</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={triggerResync}
                        disabled={isSyncing}
                        className="h-8 px-4 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSyncing ? 'Syncing...' : 'Resync Mismatched products'}
                      </button>
                    </div>
                  </div>

                  {/* Sync table */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-zinc-855 dark:text-zinc-50">Unsynced Menu Products</h4>
                      <span className="text-[9px] font-bold text-zinc-400">Last Synced Cache: Today 12:30 AM</span>
                    </div>
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 border-b border-zinc-150 dark:border-zinc-800">
                          <th className="p-3">Product Name</th>
                          <th className="p-3">POS Category Node</th>
                          <th className="p-3">Central Base Price</th>
                          <th className="p-3">POS Cache Price</th>
                          <th className="p-3">Last Sync Try</th>
                          <th className="p-3 text-right">Mismatch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                        <tr>
                          <td className="p-3 font-bold">Double Cheese Margherita (Medium)</td>
                          <td className="p-3">Classic Veg Pizza</td>
                          <td className="p-3 font-semibold">₹349</td>
                          <td className="p-3 font-semibold text-red-500">₹329</td>
                          <td className="p-3">18 June 11:20 PM</td>
                          <td className="p-3 text-right font-black text-red-650">₹20 Price Mismatch</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Paneer Tikka Roll</td>
                          <td className="p-3">Snacks / Starters</td>
                          <td className="p-3 font-semibold">₹159</td>
                          <td className="p-3 font-semibold text-red-500">₹149</td>
                          <td className="p-3">18 June 11:20 PM</td>
                          <td className="p-3 text-right font-black text-red-650">₹10 Price Mismatch</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Cheesy Garlic Breadsticks</td>
                          <td className="p-3 font-semibold text-yellow-600">Sides (Missing in POS)</td>
                          <td className="p-3 font-semibold">₹129</td>
                          <td className="p-3 text-zinc-400">-</td>
                          <td className="p-3">18 June 11:20 PM</td>
                          <td className="p-3 text-right font-black text-red-650">Node Missing</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Commission Dispute */}
              {ticket.type === 'Commission Dispute' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Gross Dispute Amount</p>
                      <p className="text-xl font-black text-red-650 mt-1">₹8,542</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Gross Sales Revenue</p>
                      <p className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">₹85,420</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Agreed Commission %</p>
                      <p className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">10.0 %</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm text-center">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">Extra Platform Fees Charged</p>
                      <p className="text-xl font-black text-orange-655 mt-1">₹3,400</p>
                    </div>
                  </div>

                  {/* Settlement History Table */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-150 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-855 dark:text-zinc-50">Disputed Billing cycle log</h4>
                    </div>
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 border-b border-zinc-150 dark:border-zinc-800">
                          <th className="p-3">Period</th>
                          <th className="p-3">Gross Sales</th>
                          <th className="p-3">Commission Charged</th>
                          <th className="p-3">Platform Charges</th>
                          <th className="p-3">Discrepancy Notes</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                        <tr className="bg-red-500/5">
                          <td className="p-3 font-semibold">01 June - 07 June</td>
                          <td className="p-3">₹85,420</td>
                          <td className="p-3 font-bold text-red-500">₹12,042 (14%)</td>
                          <td className="p-3">₹8,542 (10% + 4% service charge)</td>
                          <td className="p-3 text-zinc-500">Charge index calculated at 14% instead of 10% contract value.</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[8px] font-bold uppercase">Disputed</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* System Bug */}
              {ticket.type === 'System Bug' && (
                <div className="space-y-6">
                  {/* System properties grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-lg text-center">
                      <p className="text-[8px] font-bold text-zinc-450 uppercase">Affected Module</p>
                      <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100 mt-1">Franchise POS Portal</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-lg text-center">
                      <p className="text-[8px] font-bold text-zinc-450 uppercase">Environment</p>
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">Production (Live)</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-lg text-center">
                      <p className="text-[8px] font-bold text-zinc-450 uppercase">Browser Node</p>
                      <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100 mt-1">Chrome v125.0</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-lg text-center">
                      <p className="text-[8px] font-bold text-zinc-450 uppercase">Device OS</p>
                      <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100 mt-1">Android 14 POS Tablet</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-lg text-center">
                      <p className="text-[8px] font-bold text-zinc-450 uppercase">Build App Version</p>
                      <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100 mt-1">v4.12.9-Prod</p>
                    </div>
                  </div>

                  {/* Crash logs block */}
                  <div className="bg-zinc-900 text-zinc-200 border border-zinc-800 p-5 rounded-xl shadow-lg font-mono text-[10px] space-y-2 select-text">
                    <p className="text-red-500 font-bold">ERROR LOGS & STACK TRACE:</p>
                    <p className="text-zinc-500">2026-06-19T23:14:15.084Z [HTTP-POST] /api/products/sync - Status Code: 504 Gateway Timeout</p>
                    <p className="text-zinc-450">at GatewayService.syncPosChannel (services/posSync.js:415:18)</p>
                    <p className="text-zinc-450">at processTicksAndRejections (node:internal/process/task_queues:95:5)</p>
                    <p className="text-zinc-450">at async RouteHandler.syncProducts (controllers/franchiseController.js:84:10)</p>
                    <p className="text-zinc-550 mt-2">Caused by: TimeoutError: Connection pool timeout (15000ms exceeded) on central MongoDB Cluster replicaSet "rs0".</p>
                  </div>
                </div>
              )}

              {/* Staff Problem */}
              {ticket.type === 'Staff Problem' && (
                <div className="space-y-6">
                  {/* Staff details */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">Store Staff Conflict Logs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                      <div>
                        <span className="text-zinc-400 block text-[9px] uppercase">Grievance Category</span>
                        <span className="text-zinc-900 dark:text-zinc-100">Store Shift Dispute</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[9px] uppercase">Staff Role Involved</span>
                        <span className="text-zinc-900 dark:text-zinc-100">Delivery Supervisor</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[9px] uppercase">Shift hours</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-mono">03:00 PM - 11:00 PM</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-400 block text-[9px] uppercase">Manager Remarks</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed mt-1">
                        Supervisor left shift early without handing over keys. Caused 4 late orders on Saturday evening. Need dispute resolution and central HR record filing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: INTERNAL NOTES */}
          {activeTab === 'Internal Notes' && (
            <div className="flex-1 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950/40 p-4 min-h-0">
              
              {/* Notes Timeline Scroll */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {internalNotes.map((note) => (
                  <div key={note._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-900 dark:text-zinc-100 font-extrabold">{note.createdBy}</span>
                        <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 rounded uppercase text-[8px] font-black text-zinc-600 dark:text-zinc-400">{note.role}</span>
                      </div>
                      <span>{new Date(note.createdAt).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', second: 'numeric', day: 'numeric', month: 'short' })}</span>
                    </div>

                    <p className="text-xs text-zinc-750 dark:text-zinc-300 font-medium leading-relaxed">
                      {note.note}
                    </p>

                    {/* Note private attachments */}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="pt-2 flex gap-2">
                        {note.attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-700 text-[9px] font-bold text-zinc-550">
                            <FileText className="w-3 h-3 text-[var(--primary)]" />
                            <span>{att}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={notesEndRef} />
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an internal note visible only to Superadmin & Support desks..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                    className="flex-grow h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] transition-all font-semibold text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    className="h-9 w-9 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 4: TIMELINE (ACTIVITY LOG) */}
          {activeTab === 'Timeline' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-6">
                {timelineEvents.map((evt, idx) => (
                  <div key={evt._id || idx} className="relative">
                    {/* Circle Node */}
                    <div className="absolute -left-[31px] top-1 bg-white dark:bg-zinc-900 border-2 border-[var(--primary)] rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{evt.action}</h4>
                        <span className="text-[9px] text-zinc-400 font-semibold">{new Date(evt.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500">
                        Performed by: <strong className="text-zinc-700 dark:text-zinc-300">{evt.performedBy}</strong> ({evt.role})
                      </p>
                      <p className="text-xs text-zinc-650 dark:text-zinc-400 font-medium pt-0.5 leading-relaxed">
                        {evt.remarks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'Audit Logs' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-450 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-3">Action Event</th>
                        <th className="p-3">Actor Role</th>
                        <th className="p-3">Performed By</th>
                        <th className="p-3">Old Value</th>
                        <th className="p-3">New Value</th>
                        <th className="p-3">Device / Browser</th>
                        <th className="p-3 text-right">IP & Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30 text-zinc-700 dark:text-zinc-350">
                      {auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                          <td className="p-3 font-bold text-zinc-900 dark:text-zinc-50">{log.action}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-[8px] uppercase rounded font-black">
                              {log.actorRole}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{log.actorName}</td>
                          <td className="p-3 text-zinc-400 font-mono text-[10px] max-w-[120px] truncate" title={log.oldValue}>
                            {log.oldValue}
                          </td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-450 font-mono text-[10px] max-w-[150px] truncate" title={log.newValue}>
                            {log.newValue}
                          </td>
                          <td className="p-3 text-zinc-500 text-[10px] leading-tight">
                            <span>{log.device}</span>
                            <span className="block text-[8px] text-zinc-400">{log.browser}</span>
                          </td>
                          <td className="p-3 text-right text-zinc-500 font-mono text-[10px]">
                            <span>{log.ipAddress}</span>
                            <span className="block text-[9px] text-zinc-450 font-sans">{log.location}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Sub Modals Portals */}
      <AssignDepartmentModal 
        isOpen={isAssignOpen} 
        onClose={() => setIsAssignOpen(false)} 
        ticketNumber={ticket.ticketNumber}
        onAssignSuccess={handleAssignSuccess}
      />
      
      <EscalateFranchiseTicketModal 
        isOpen={isEscalateOpen} 
        onClose={() => setIsEscalateOpen(false)} 
        ticketNumber={ticket.ticketNumber}
        onEscalateSuccess={handleEscalateSuccess}
      />

      <ResolveFranchiseTicketModal 
        isOpen={isResolveOpen} 
        onClose={() => setIsResolveOpen(false)} 
        ticketNumber={ticket.ticketNumber}
        onResolveSuccess={handleResolveSuccess}
      />

      <CloseFranchiseTicketModal 
        isOpen={isCloseOpen} 
        onClose={() => setIsCloseOpen(false)} 
        ticketNumber={ticket.ticketNumber}
        onCloseSuccess={handleCloseSuccess}
      />

    </div>
  );
}
