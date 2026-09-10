import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User, Shield, Store, ClipboardList, Clock, AlertTriangle, 
  MessageSquare, FileText, Send, UserCheck, ShieldAlert,
  ArrowUpRight, AlertCircle, Copy, Check, Info, RefreshCw, 
  Activity, Layers, Smartphone, Landmark,
  Database, HelpCircle, HardDrive, Paperclip, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// Import sub-modals
import AssignSupportAgentModal from './AssignSupportAgentModal';
import ChangePriorityModal from './ChangePriorityModal';
import EscalateRequestModal from './EscalateRequestModal';
import ResolveRequestModal from './ResolveRequestModal';
import CloseRequestModal from './CloseRequestModal';
import AttachmentGalleryModal from './AttachmentGalleryModal';

export default function SupportRequestDetailsModal({ isOpen, onClose, request, onUpdate }) {
  const [activeTab, setActiveTab] = useState('Basic Info');
  
  // Nested Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Lists state (local mock database synced on request changes)
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [copiedId, setCopiedId] = useState(false);
  
  const chatEndRef = useRef(null);
  const notesEndRef = useRef(null);

  // Auto-scroll chat & notes
  useEffect(() => {
    if (activeTab === 'Conversation') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'Internal Notes') {
      notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, messages, internalNotes]);

  // Generate realistic mock records based on the request metadata
  useEffect(() => {
    if (request) {
      // 1. Mock Conversation
      const conversationTemplates = {
        'Technical': [
          { sender: request.requesterName, role: request.requesterRole, text: `Hello support, my ${request.subcategory || 'POS System'} is crashing when processing payments. Can anyone look?`, time: '1 hour ago' },
          { sender: 'System Router', role: 'System', text: 'Ticket automatically routed to Technical Desk.', time: '58 mins ago' },
          { sender: 'Neha Reddy', role: 'Support Agent', text: 'Checking socket connectivity logs. Please confirm if other devices are online.', time: '40 mins ago' },
          { sender: request.requesterName, role: request.requesterRole, text: 'Yes, kitchen display is online. Only the counter POS has issues.', time: '35 mins ago' }
        ],
        'Operational': [
          { sender: request.requesterName, role: request.requesterRole, text: `Facing ${request.subcategory || 'Inventory Issue'}. The shipment contains damaged items. Need replacement approval.`, time: '2 hours ago' },
          { sender: 'Rajesh Sharma', role: 'Support Agent', text: 'Please upload photos of the damaged inventory logs so we can cross-verify.', time: '1.5 hours ago' }
        ],
        'Delivery': [
          { sender: request.requesterName, role: request.requesterRole, text: `Rider reported GPS mapping failure on order ${request.requestNumber}. App shows wrong store address.`, time: '45 mins ago' },
          { sender: 'Sanjay Verma', role: 'Support Agent', text: 'Checking the lat/long coordinates in store master. We will sync it.', time: '30 mins ago' }
        ],
        'HR': [
          { sender: request.requesterName, role: request.requesterRole, text: `Salary dispute regarding attendance count for May. Biometric punch was not recorded for 3 days.`, time: '3 hours ago' },
          { sender: 'Shalini Gupta', role: 'Support Agent', text: 'Please share approved manual attendance slips from store manager.', time: '2.5 hours ago' }
        ],
        'System': [
          { sender: 'Automated Monitor', role: 'System', text: `System cron job failed: ${request.subcategory || 'Database sync issue'}. Executed recovery script.`, time: '5 mins ago' }
        ]
      };

      setMessages(conversationTemplates[request.category] || [
        { sender: request.requesterName, role: request.requesterRole, text: `Request logged: ${request.description}`, time: '30 mins ago' }
      ]);

      // 2. Mock Internal Notes
      setInternalNotes([
        { author: 'Neha Singh', role: 'Super Admin', text: `Verified requester store node (${request.store}). POS version is currently v4.82. Checking database migration status.`, time: '50 mins ago' }
      ]);

      // 3. Mock Timeline
      setTimeline([
        { event: 'Ticket Raised', actor: request.requesterName, role: request.requesterRole, remarks: `Raised ${request.category} support request via Portal.`, time: request.createdAt },
        { event: 'Routed to Queue', actor: 'System Router', role: 'System', remarks: `Categorized under ${request.category} -> ${request.subcategory}`, time: new Date(new Date(request.createdAt).getTime() + 60000).toISOString() }
      ]);

      // 4. Mock Assignment History
      setAssignmentHistory([
        { assignedTo: request.assignedTo || 'Unassigned', department: request.category + ' Team', assignedBy: 'System Router', time: request.createdAt }
      ]);

      // 5. Mock Status History
      setStatusHistory([
        { oldStatus: '-', newStatus: request.status, changedBy: request.requesterName, role: request.requesterRole, time: request.createdAt }
      ]);

      // 6. Mock Audit Logs
      setAuditLogs([
        { action: 'Ticket Submission', actor: request.requesterName, role: request.requesterRole, ip: '192.168.10.82', device: 'Windows 11 POS client', browser: 'Chrome 124.0.0', location: 'Indore, MP', time: request.createdAt }
      ]);
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('Request Number copied');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Add Conversation Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      sender: 'Neha Singh',
      role: 'Super Admin',
      text: newMessage,
      time: 'Just now'
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage('');

    // Log in Timeline
    setTimeline(prev => [
      ...prev,
      { event: 'Conversation Reply Sent', actor: 'Neha Singh', role: 'Super Admin', remarks: `Replied: "${newMessage.substring(0, 30)}..."`, time: new Date().toISOString() }
    ]);
  };

  // Add Internal Note
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const note = {
      author: 'Neha Singh',
      role: 'Super Admin',
      text: newNote,
      time: 'Just now'
    };

    setInternalNotes(prev => [...prev, note]);
    setNewNote('');

    // Log in Timeline & Audit Logs
    setTimeline(prev => [
      ...prev,
      { event: 'Internal Note Added', actor: 'Neha Singh', role: 'Super Admin', remarks: 'Added a private note', time: new Date().toISOString() }
    ]);

    setAuditLogs(prev => [
      { action: 'Add Internal Note', actor: 'Neha Singh', role: 'Super Admin', ip: '192.168.1.1', device: 'MacBook Pro M3', browser: 'Safari 17.4', location: 'Corporate Office', time: new Date().toISOString() },
      ...prev
    ]);
  };

  // Helper styles
  const getStatusBadge = (status) => {
    const classes = {
      Open: 'bg-blue-50 text-blue-750 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'In Progress': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      Pending: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      Escalated: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
      Resolved: 'bg-emerald-50 text-emerald-705 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      Closed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
    };
    return classes[status] || classes.Open;
  };

  const getPriorityBadge = (prio) => {
    const classes = {
      Low: 'bg-blue-100/60 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
      Medium: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      High: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400',
      Critical: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-extrabold animate-pulse'
    };
    return classes[prio] || classes.Medium;
  };

  // Sub-modal action callbacks
  const handleAssignAction = (updatedRequest, details) => {
    onUpdate(updatedRequest);
    
    setTimeline(prev => [
      ...prev,
      { event: 'Agent Assigned', actor: 'Neha Singh', role: 'Super Admin', remarks: `Assigned to ${details.agent} (${details.department}). Notes: ${details.notes}`, time: details.timestamp }
    ]);

    setAssignmentHistory(prev => [
      { assignedTo: details.agent, department: details.department, assignedBy: 'Neha Singh', time: details.timestamp },
      ...prev
    ]);

    setStatusHistory(prev => [
      { oldStatus: request.status, newStatus: 'In Progress', changedBy: 'Neha Singh', role: 'Super Admin', time: details.timestamp },
      ...prev
    ]);
  };

  const handlePriorityAction = (updatedRequest, details) => {
    onUpdate(updatedRequest);

    setTimeline(prev => [
      ...prev,
      { event: 'Priority Updated', actor: 'Neha Singh', role: 'Super Admin', remarks: `Changed priority from ${details.oldPriority} to ${details.newPriority}. Reason: ${details.reason}`, time: details.timestamp }
    ]);

    setAuditLogs(prev => [
      { action: 'Modify Priority', actor: 'Neha Singh', role: 'Super Admin', ip: '192.168.1.1', device: 'MacBook Pro M3', browser: 'Safari 17.4', location: 'Corporate Office', time: details.timestamp },
      ...prev
    ]);
  };

  const handleEscalateAction = (updatedRequest, details) => {
    onUpdate(updatedRequest);

    setTimeline(prev => [
      ...prev,
      { event: 'Ticket Escalated', actor: 'Neha Singh', role: 'Super Admin', remarks: `Escalated to ${details.tier} (${details.targetDept}). Remarks: ${details.remarks}`, time: details.timestamp }
    ]);

    setStatusHistory(prev => [
      { oldStatus: request.status, newStatus: 'Escalated', changedBy: 'Neha Singh', role: 'Super Admin', time: details.timestamp },
      ...prev
    ]);
  };

  const handleResolveAction = (updatedRequest, details) => {
    onUpdate(updatedRequest);

    setTimeline(prev => [
      ...prev,
      { event: 'Ticket Resolved', actor: 'Neha Singh', role: 'Super Admin', remarks: `Resolution Category: ${details.category}. Notes: ${details.notes}`, time: details.timestamp }
    ]);

    setStatusHistory(prev => [
      { oldStatus: request.status, newStatus: 'Resolved', changedBy: 'Neha Singh', role: 'Super Admin', time: details.timestamp },
      ...prev
    ]);
  };

  const handleCloseAction = (updatedRequest, details) => {
    onUpdate(updatedRequest);

    setTimeline(prev => [
      ...prev,
      { event: 'Ticket Closed', actor: 'Neha Singh', role: 'Super Admin', remarks: `Remarks: ${details.closingRemarks}. Consensus: Confirmed.`, time: details.timestamp }
    ]);

    setStatusHistory(prev => [
      { oldStatus: request.status, newStatus: 'Closed', changedBy: 'Neha Singh', role: 'Super Admin', time: details.timestamp },
      ...prev
    ]);
  };

  return (
    <div 
      className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 w-[95%] max-w-6xl h-[700px] max-h-[85vh] rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header Panel */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-800/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              request.status === 'Open' ? 'bg-blue-500' :
              request.status === 'In Progress' ? 'bg-amber-500' :
              request.status === 'Pending' ? 'bg-purple-500' :
              request.status === 'Escalated' ? 'bg-red-500' :
              request.status === 'Resolved' ? 'bg-emerald-500' : 'bg-zinc-400'
            }`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  Support Request: {request.requestNumber}
                </h2>
                <button 
                  onClick={() => copyToClipboard(request.requestNumber)}
                  className="p-1 hover:bg-zinc-205 dark:hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-zinc-600"
                  title="Copy Request Number"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                Requester: <strong className="text-zinc-700 dark:text-zinc-300">{request.requesterName}</strong> ({request.requesterRole}) • Logged: {new Date(request.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button 
              onClick={() => setIsAssignOpen(true)}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-95 flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Assign Agent
            </button>
            <button 
              onClick={() => setIsPriorityOpen(true)}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-95 flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Priority
            </button>
            <button 
              onClick={() => setIsEscalateOpen(true)}
              className="h-8 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-bold text-red-650 dark:text-red-400 transition-all active:scale-95 flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Escalate Case
            </button>
            
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors md:ml-4"
            >
              <X className="w-4.5 h-4.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Tab Menu Navigation */}
        <div className="px-6 border-b border-zinc-200 dark:border-zinc-850 flex gap-2 shrink-0 bg-white dark:bg-zinc-900 overflow-x-auto scrollbar-none">
          {['Basic Info', 'Conversation', 'Internal Notes', 'Timeline', 'Assignment History', 'Status History', 'Audit Logs'].map((tab) => (
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
              {tab === 'Conversation' && messages.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] rounded-full font-bold">
                  {messages.length}
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

        {/* Dynamic Tab Body Frame (fixed size container with overflow handled internally) */}
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950/20">
          
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'Basic Info' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              
              {/* Subject & Description Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold uppercase rounded text-zinc-650 dark:text-zinc-400">
                      {request.category} • {request.subcategory}
                    </span>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{request.subject}</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getStatusBadge(request.status)}`}>
                      Status: {request.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(request.priority)}`}>
                      Priority: {request.priority}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium whitespace-pre-line">
                  {request.description}
                </div>

                {/* Attachments quick link */}
                {request.attachments && request.attachments.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{request.attachments.length} Document Attachment(s) logged</span>
                    </div>
                    <button 
                      onClick={() => setIsGalleryOpen(true)}
                      className="text-xs text-[var(--primary)] hover:underline font-bold flex items-center gap-0.5"
                    >
                      Open Files Gallery <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Stakeholders Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Requester Profile */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/85 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Requester Profile</p>
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-50 truncate mt-0.5">{request.requesterName}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Role: {request.requesterRole}</p>
                    <p className="text-[10px] text-zinc-450 mt-0.5">Emp ID: {request.employeeId || 'SYS-DESK-01'}</p>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{request.email || '-'}</p>
                  </div>
                </div>

                {/* Node Store Details */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/85 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-550 rounded-lg">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Linked Node Store</p>
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-50 truncate mt-0.5">{request.store || 'Cloud Gateway'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Franchise: {request.franchise || 'Corporate Node'}</p>
                    <p className="text-[10px] text-zinc-450 mt-0.5">Contact: {request.phone || '-'}</p>
                  </div>
                </div>

                {/* Assignment & Department Details */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/85 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-650 dark:text-purple-400 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Assignment Desk</p>
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-50 truncate mt-0.5">{request.department || `${request.category} Team`}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Operator: <strong className="text-zinc-700 dark:text-zinc-200">{request.assignedTo || 'Unassigned'}</strong></p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Last Sync: {new Date(request.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Resolution Notes Block if Resolved or Closed */}
              {(request.resolutionNotes || request.resolutionCategory) && (
                <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-xl space-y-2 animate-fade-down">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Resolution Status: {request.resolutionCategory || 'Issue Solved'}
                  </p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                    {request.resolutionNotes || 'No notes specified.'}
                  </p>
                </div>
              )}

              {/* Quick Actions Footer Bar */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-zinc-500 shrink-0">
                <span>Last Updated: {new Date(request.updatedAt).toLocaleString('en-IN')}</span>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsResolveOpen(true)}
                    className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Resolve Request
                  </button>
                  <button 
                    onClick={() => setIsCloseOpen(true)}
                    className="h-8 px-4 rounded-lg bg-zinc-650 hover:bg-zinc-755 text-white font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" /> Close Ticket
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CONVERSATION PANEL */}
          {activeTab === 'Conversation' && (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950/40">
              
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((msg, i) => {
                  const isMe = msg.sender === 'Neha Singh';
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-zinc-400">
                        <span>{msg.sender}</span>
                        <span className="px-1 py-0.1 bg-zinc-200 dark:bg-zinc-800 text-[8px] rounded uppercase text-zinc-550 dark:text-zinc-400">
                          {msg.role}
                        </span>
                        <span>•</span>
                        <span>{msg.time}</span>
                      </div>
                      
                      <div className={`p-3 rounded-xl max-w-lg text-xs leading-relaxed font-semibold shadow-sm ${
                        isMe 
                          ? 'bg-[var(--primary)] text-white rounded-tr-none' 
                          : 'bg-white dark:bg-zinc-850 text-zinc-805 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-850 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 shrink-0">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your response to the support ticket..."
                  className="flex-1 h-9 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button 
                  type="submit"
                  className="h-9 px-4 bg-[var(--primary)] text-white font-bold rounded-lg text-xs shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Send Reply
                </button>
              </form>

            </div>
          )}

          {/* TAB 3: INTERNAL NOTES PANEL */}
          {activeTab === 'Internal Notes' && (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-955/40">
              
              {/* Warning Alert */}
              <div className="px-4 py-2.5 bg-yellow-500/10 text-yellow-605 dark:text-yellow-450 border-b border-yellow-500/20 text-[10px] font-bold flex items-center gap-1.5 shrink-0">
                <Shield className="w-4 h-4" /> Confidential Desk Zone: Internal operator notes are hidden from the store manager/delivery requester.
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {internalNotes.map((note, i) => (
                  <div key={i} className="flex flex-col items-start bg-yellow-500/5 dark:bg-yellow-950/10 border border-yellow-500/10 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-450">
                      <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{note.author}</span>
                      <span className="px-1.5 py-0.2 bg-yellow-500/15 text-yellow-700 dark:text-yellow-450 rounded text-[7px] uppercase font-black">
                        {note.role}
                      </span>
                      <span>•</span>
                      <span>{note.time}</span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                ))}
                <div ref={notesEndRef} />
              </div>

              {/* Note Input form */}
              <form onSubmit={handleAddNote} className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 shrink-0">
                <input 
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a secure internal note for operators..."
                  className="flex-1 h-9 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button 
                  type="submit"
                  className="h-9 px-4 bg-zinc-700 text-white font-bold rounded-lg text-xs hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Save Note
                </button>
              </form>

            </div>
          )}

          {/* TAB 4: TIMELINE ACTIVITY */}
          {activeTab === 'Timeline' && (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="max-w-2xl mx-auto relative border-l-2 border-zinc-200 dark:border-zinc-800 pl-6 space-y-6 py-2">
                {timeline.map((evt, i) => (
                  <div key={i} className="relative">
                    {/* Circle Dot */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 bg-[var(--primary)] flex items-center justify-center shadow" />
                    
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-zinc-900 dark:text-zinc-50">{evt.event}</p>
                      <p className="text-[10px] text-zinc-500 font-semibold">
                        by {evt.actor} ({evt.role}) • {new Date(evt.time).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-zinc-650 dark:text-zinc-350 italic mt-1 font-semibold">
                        {evt.remarks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ASSIGNMENT HISTORY */}
          {activeTab === 'Assignment History' && (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase text-[9px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Assigned Representative</th>
                      <th className="p-3">Department Desk</th>
                      <th className="p-3">Assigned By</th>
                      <th className="p-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {assignmentHistory.map((item, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/25">
                        <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{item.assignedTo}</td>
                        <td className="p-3">{item.department}</td>
                        <td className="p-3 text-zinc-500">{item.assignedBy}</td>
                        <td className="p-3 text-right font-mono text-[10px] text-zinc-450">{new Date(item.time).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: STATUS HISTORY */}
          {activeTab === 'Status History' && (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase text-[9px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Initial State</th>
                      <th className="p-3">Transition State</th>
                      <th className="p-3">Modified By</th>
                      <th className="p-3">User Role</th>
                      <th className="p-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {statusHistory.map((item, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/25">
                        <td className="p-3 font-mono text-zinc-450">{item.oldStatus}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(item.newStatus)}`}>
                            {item.newStatus}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{item.changedBy}</td>
                        <td className="p-3 text-zinc-500">{item.role}</td>
                        <td className="p-3 text-right font-mono text-[10px] text-zinc-450">{new Date(item.time).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === 'Audit Logs' && (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="space-y-4 max-w-4xl mx-auto">
                {auditLogs.map((log, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2 flex-wrap gap-2 text-xs font-semibold">
                      <span className="text-[var(--primary)] font-extrabold">{log.action}</span>
                      <span className="text-zinc-400 font-mono text-[10px]">{new Date(log.time).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                      <div>
                        <span>Operator / Actor</span>
                        <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 normal-case mt-0.5">{log.actor} ({log.role})</p>
                      </div>
                      <div>
                        <span>IP Address</span>
                        <p className="text-xs font-mono text-zinc-800 dark:text-zinc-200 mt-0.5">{log.ip}</p>
                      </div>
                      <div>
                        <span>OS & Browser Node</span>
                        <p className="text-xs font-black text-zinc-850 dark:text-zinc-100 normal-case mt-0.5 truncate" title={`${log.device} | ${log.browser}`}>
                          {log.device} • {log.browser}
                        </p>
                      </div>
                      <div>
                        <span>Gateway Location</span>
                        <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 normal-case mt-0.5">{log.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Render sub-modals */}
      <AssignSupportAgentModal 
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        request={request}
        onAssign={handleAssignAction}
      />

      <ChangePriorityModal 
        isOpen={isPriorityOpen}
        onClose={() => setIsPriorityOpen(false)}
        request={request}
        onChangePriority={handlePriorityAction}
      />

      <EscalateRequestModal 
        isOpen={isEscalateOpen}
        onClose={() => setIsEscalateOpen(false)}
        request={request}
        onEscalate={handleEscalateAction}
      />

      <ResolveRequestModal 
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        request={request}
        onResolve={handleResolveAction}
      />

      <CloseRequestModal 
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        request={request}
        onCloseRequest={handleCloseAction}
      />

      <AttachmentGalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        attachments={request.attachments}
      />

    </div>
  );
}
