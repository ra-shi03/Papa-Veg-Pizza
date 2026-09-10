import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User, Store, Shield, Truck, AlertTriangle, 
  Calendar, Clock, CheckCircle2, MessageSquare, 
  DollarSign, FileText, Send, UserCheck, ShieldAlert,
  ArrowUpRight, AlertCircle, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

import AssignAgentModal from './AssignAgentModal';
import EscalateModal from './EscalateModal';
import RefundModal from './RefundModal';
import ResolveModal from './ResolveModal';
import CloseModal from './CloseModal';

export default function ViewComplaintModal({ isOpen, onClose, complaint, onUpdateComplaint }) {
  const [activeTab, setActiveTab] = useState('Details');
  
  // Nested Modals State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  // Chat/Conversation State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Copy State
  const [copiedId, setCopiedId] = useState(false);

  // Auto-scroll chat to bottom when tab active or new message added
  useEffect(() => {
    if (activeTab === 'Conversation') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, chatMessages]);

  // Load static or dynamic mock data upon complaint changes
  useEffect(() => {
    if (complaint) {
      // 1. Load support messages
      setChatMessages([
        {
          _id: "m1",
          senderRole: "Customer",
          senderName: complaint.customerName || "Rohan Malhotra",
          message: "I ordered a Farmhouse Veg Pizza, but received a cold Margherita instead. The box was also squashed. Please process a refund.",
          createdAt: new Date(new Date(complaint.createdAt).getTime() + 120000).toISOString(),
          attachments: ["damaged_box.png"]
        },
        {
          _id: "m2",
          senderRole: "Delivery Partner",
          senderName: complaint.deliveryPartner || "Karan Singh",
          message: "The store handed over the order 15 mins late. The rain caused the delivery box cover to become wet, but I did not damage the container.",
          createdAt: new Date(new Date(complaint.createdAt).getTime() + 450000).toISOString()
        },
        {
          _id: "m3",
          senderRole: "Store Manager",
          senderName: "Amit Sharma",
          message: "We prepared the pizza on time. The rider kept it waiting on his bike. The toppings were correct as per the slip #PV-9042.",
          createdAt: new Date(new Date(complaint.createdAt).getTime() + 900000).toISOString()
        }
      ]);

      // 2. Load audit logs
      setAuditLogs([
        {
          _id: "l1",
          action: "Complaint Ticket Created",
          performedBy: "System Portal",
          role: "System API",
          oldValue: "-",
          newValue: "Status: Open",
          ipAddress: "192.168.1.14",
          createdAt: complaint.createdAt
        },
        {
          _id: "l2",
          action: "Assigned Representative",
          performedBy: "Neha Singh",
          role: "Super Admin",
          oldValue: "Unassigned",
          newValue: `Assigned: ${complaint.assignedTo || 'Amit Sharma'}`,
          ipAddress: "103.45.221.84",
          createdAt: new Date(new Date(complaint.createdAt).getTime() + 300000).toISOString()
        }
      ]);
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      _id: Date.now().toString(),
      senderRole: "Super Admin",
      senderName: "Neha Singh (You)",
      message: newMessage,
      createdAt: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    // Trigger an audit log for conversation
    const newLog = {
      _id: Date.now().toString(),
      action: "Support Reply Sent",
      performedBy: "Neha Singh",
      role: "Super Admin",
      oldValue: "-",
      newValue: `Message: "${newMsg.message.substring(0, 30)}..."`,
      ipAddress: "103.45.221.84",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // State Updates from Modals
  const handleAssignSuccess = (agent, priority, notes) => {
    const updated = {
      ...complaint,
      assignedTo: agent.split(' ')[0],
      priority: priority,
      status: 'In Progress',
      updatedAt: new Date().toISOString()
    };
    onUpdateComplaint(updated);

    const log = {
      _id: Date.now().toString(),
      action: "Reassigned Agent & Priority",
      performedBy: "Neha Singh",
      role: "Super Admin",
      oldValue: `Agent: ${complaint.assignedTo}, Priority: ${complaint.priority}`,
      newValue: `Agent: ${agent}, Priority: ${priority}, Status: In Progress`,
      ipAddress: "103.45.221.84",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleEscalateSuccess = (level, department, reason, comments) => {
    const updated = {
      ...complaint,
      status: 'Escalated',
      priority: 'Critical',
      updatedAt: new Date().toISOString()
    };
    onUpdateComplaint(updated);

    const log = {
      _id: Date.now().toString(),
      action: "Escalated Ticket Level",
      performedBy: "Neha Singh",
      role: "Super Admin",
      oldValue: `Status: ${complaint.status}`,
      newValue: `Status: Escalated, Dept: ${department}, Level: ${level}`,
      ipAddress: "103.45.221.84",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleRefundSuccess = (amount, reason, method) => {
    const updated = {
      ...complaint,
      refundAmount: (complaint.refundAmount || 0) + amount,
      status: 'Resolved',
      updatedAt: new Date().toISOString()
    };
    onUpdateComplaint(updated);

    const log = {
      _id: Date.now().toString(),
      action: "Issued Customer Refund",
      performedBy: "Neha Singh",
      role: "Super Admin",
      oldValue: `Refunded: ₹${complaint.refundAmount || 0}`,
      newValue: `Refunded: ₹${updated.refundAmount} via ${method}`,
      ipAddress: "103.45.221.84",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleResolveSuccess = (notes, coupon, rating) => {
    const updated = {
      ...complaint,
      status: 'Resolved',
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onUpdateComplaint(updated);

    const log = {
      _id: Date.now().toString(),
      action: "Resolved Ticket",
      performedBy: "Neha Singh",
      role: "Super Admin",
      oldValue: `Status: ${complaint.status}`,
      newValue: `Status: Resolved, Coupon: ${coupon || 'None'}, Rating: ${rating}`,
      ipAddress: "103.45.221.84",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleCloseSuccess = (remarks, finalStatus) => {
    const updated = {
      ...complaint,
      status: 'Closed',
      updatedAt: new Date().toISOString()
    };
    onUpdateComplaint(updated);

    const log = {
      _id: Date.now().toString(),
      action: "Closed Complaint Ticket",
      performedBy: "Neha Singh",
      role: "Super Admin",
      oldValue: `Status: ${complaint.status}`,
      newValue: `Status: Closed - ${finalStatus}`,
      ipAddress: "103.45.221.84",
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Status colors helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Escalated':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-450 border-rose-200 dark:border-rose-800';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800/30 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-450';
      case 'High':
        return 'bg-orange-100 text-orange-850 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-extrabold animate-pulse';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center bg-zinc-50 dark:bg-zinc-955 p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
      
      {/* Fullscreen Modal Frame */}
      <div className="bg-white dark:bg-zinc-900 w-[95%] max-w-5xl h-[700px] max-h-[85vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-98 duration-300">
        
        {/* Top Header Panel */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-800/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              complaint.status === 'Open' ? 'bg-blue-500' :
              complaint.status === 'In Progress' ? 'bg-amber-500' :
              complaint.status === 'Escalated' ? 'bg-red-500' :
              complaint.status === 'Resolved' ? 'bg-emerald-500' : 'bg-zinc-400'
            }`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  Complaint Details: {complaint.complaintNumber}
                </h2>
                <button 
                  onClick={() => copyToClipboard(complaint.complaintNumber)}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-zinc-650"
                  title="Copy complaint number"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                Related Order: <strong className="text-zinc-700 dark:text-zinc-300">{complaint.orderNumber}</strong> • Registered: {new Date(complaint.createdAt).toLocaleDateString('en-IN', { hour: 'numeric', minute: 'numeric' })}
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
              Reassign
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
          {['Details', 'Order Details', 'Conversation', 'Resolution', 'Audit Logs'].map((tab) => (
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
              {tab === 'Conversation' && chatMessages.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] rounded-full font-bold">
                  {chatMessages.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content Frame */}
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950/20">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'Details' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Primary Complaint Description Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold uppercase rounded text-zinc-600 dark:text-zinc-400">
                      {complaint.type}
                    </span>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{complaint.subject}</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusStyle(complaint.status)}`}>
                      Status: {complaint.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityStyle(complaint.priority)}`}>
                      Priority: {complaint.priority}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium whitespace-pre-line">
                  {complaint.description || "No description provided."}
                </div>

                {/* Attachments Section */}
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Image / File Attachments</p>
                    <div className="flex gap-3 flex-wrap">
                      {complaint.attachments.map((file, i) => (
                        <div key={i} className="group relative border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900 w-24 h-24 flex items-center justify-center cursor-pointer shadow-sm hover:scale-[1.02] hover:border-[var(--primary)] transition-all">
                          {/* Simulated image webp mockup */}
                          <img 
                            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=150&q=80" 
                            alt={file} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] text-white truncate font-semibold text-center">
                            {file}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stakeholders Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Customer */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Customer Details</p>
                    <p className="text-xs font-black text-zinc-805 dark:text-zinc-50 truncate mt-0.5">{complaint.customerName || 'Rohan Malhotra'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">+91 98402 12903</p>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">rohan@gmail.com</p>
                  </div>
                </div>

                {/* Outlet Store */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-550 rounded-lg">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Store Node</p>
                    <p className="text-xs font-black text-zinc-805 dark:text-zinc-50 truncate mt-0.5">{complaint.store || 'Indore Central'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Manager: Amit Sharma</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">POS: Central-AP-1</p>
                  </div>
                </div>

                {/* Franchise Group */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-650 dark:text-purple-400 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Franchise Node</p>
                    <p className="text-xs font-black text-zinc-805 dark:text-zinc-50 truncate mt-0.5">{complaint.franchise || 'Indore Group'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Owner: Priyanshu Patel</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Rating: 92% (Platinum)</p>
                  </div>
                </div>

                {/* Delivery Logistics */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Delivery Partner</p>
                    <p className="text-xs font-black text-zinc-805 dark:text-zinc-50 truncate mt-0.5">{complaint.deliveryPartner || 'Karan Singh'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Status: Delivery Transit</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Bike: Splendor Plus</p>
                  </div>
                </div>

              </div>

              {/* Time Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>Created: {new Date(complaint.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>Last Update: {new Date(complaint.updatedAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Resolved Date: {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString('en-IN') : 'Unresolved'}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ORDER DETAILS */}
          {activeTab === 'Order Details' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Order Info & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Panel: Invoice Details */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 uppercase tracking-wide border-b border-zinc-150 dark:border-zinc-800 pb-1.5">
                    Invoice Details
                  </h4>
                  <div className="space-y-2 text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Order ID:</span>
                      <span>{complaint.orderNumber || 'PV-9042'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Payment:</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-100">{complaint.paymentMethod || 'UPI (Google Pay)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Coupon Used:</span>
                      <span className="text-orange-655 font-bold">PIZZA50 (₹50 Off)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Delivery Charge:</span>
                      <span>₹40</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">GST Taxes:</span>
                      <span>₹25</span>
                    </div>
                    <hr className="border-zinc-100 dark:border-zinc-800" />
                    <div className="flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-450 pt-1">
                      <span>Total Amount:</span>
                      <span>₹{complaint.orderAmount || 450}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 space-y-2">
                    <p className="text-[10px] font-bold text-zinc-550 uppercase">Delivery Address</p>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                      Flat 302, Green Glen Heights, Sector 3, Vijay Nagar, Indore, MP - 452010
                    </p>
                  </div>
                </div>

                {/* Right Panel: Order Items Table */}
                <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 uppercase tracking-wide border-b border-zinc-150 dark:border-zinc-800 pb-1.5 mb-3">
                      Order Items
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-medium">
                        <thead>
                          <tr className="text-zinc-450 border-b border-zinc-150 dark:border-zinc-800">
                            <th className="pb-2">Product</th>
                            <th className="pb-2 text-center">Qty</th>
                            <th className="pb-2 text-right">Price</th>
                            <th className="pb-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                          <tr>
                            <td className="py-2.5 font-bold">Paneer Tikka Pizza (Medium)</td>
                            <td className="py-2.5 text-center">1</td>
                            <td className="py-2.5 text-right">₹350</td>
                            <td className="py-2.5 text-right">₹350</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold">Garlic Breadsticks</td>
                            <td className="py-2.5 text-center">1</td>
                            <td className="py-2.5 text-right">₹110</td>
                            <td className="py-2.5 text-right">₹110</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold">Cold Drink - Pepsi (500ml)</td>
                            <td className="py-2.5 text-center">1</td>
                            <td className="py-2.5 text-right">₹40</td>
                            <td className="py-2.5 text-right">₹40</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Delivery Timeline Tracker */}
                  <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-4">
                    <h5 className="text-[10px] font-bold text-zinc-450 uppercase mb-3">Delivery Timeline</h5>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 relative">
                      <div className="absolute left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 top-1/2 -translate-y-1/2 z-0" />
                      
                      <div className="z-10 bg-white dark:bg-zinc-900 px-2 text-center text-emerald-600">
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                        <span>Placed (12:00)</span>
                      </div>
                      <div className="z-10 bg-white dark:bg-zinc-900 px-2 text-center text-emerald-600">
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                        <span>Prepared (12:15)</span>
                      </div>
                      <div className="z-10 bg-white dark:bg-zinc-900 px-2 text-center text-amber-500">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                        <span>Transit (12:20)</span>
                      </div>
                      <div className="z-10 bg-white dark:bg-zinc-900 px-2 text-center text-zinc-400">
                        <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 mx-auto mb-1 flex items-center justify-center text-[8px]">4</div>
                        <span>Delivered (12:45)</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: CONVERSATION (TICKET CHAT) */}
          {activeTab === 'Conversation' && (
            <div className="flex-1 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950/40 p-4 min-h-0">
              
              {/* Chat Messages Frame */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {chatMessages.map((msg) => {
                  const isAdmin = msg.senderRole === "Super Admin" || msg.senderRole === "Admin";
                  const isStore = msg.senderRole === "Store Manager";
                  const isRider = msg.senderRole === "Delivery Partner";
                  
                  return (
                    <div 
                      key={msg._id} 
                      className={`flex flex-col max-w-[85%] ${
                        isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      {/* Name & Badge Header */}
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 mb-1">
                        <span>{msg.senderName}</span>
                        <span className={`px-1 py-0.2 rounded text-[7px] uppercase ${
                          isAdmin ? 'bg-red-500/10 text-red-550' : 
                          isStore ? 'bg-yellow-500/10 text-yellow-600' :
                          isRider ? 'bg-blue-500/10 text-blue-600' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {msg.senderRole}
                        </span>
                      </div>

                      {/* Bubble content */}
                      <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                        isAdmin 
                          ? 'bg-[var(--primary)] text-white rounded-tr-none' 
                          : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-150 dark:border-zinc-800 rounded-tl-none'
                      }`}>
                        <p>{msg.message}</p>
                        
                        {/* Attachments preview inside bubble */}
                        {msg.attachments && (
                          <div className="mt-2 flex gap-1">
                            {msg.attachments.map((att, index) => (
                              <div key={index} className="border border-zinc-100/20 rounded overflow-hidden w-20 h-20 bg-black/10">
                                <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=120&q=80" alt="attached" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[8px] text-zinc-400 mt-1 font-semibold">
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <input
                  type="text"
                  placeholder="Type a support response to the client & partners..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[var(--primary)] transition-all font-semibold text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  className="h-9 w-9 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

          {/* TAB 4: RESOLUTION */}
          {activeTab === 'Resolution' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Resolution Summary Controls */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-5">
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 uppercase tracking-wide border-b border-zinc-150 dark:border-zinc-800 pb-1.5">
                  Complaint Settlement Panel
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-500">Ticket Status:</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusStyle(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-zinc-800 pt-2">
                      <span className="font-bold text-zinc-500">Total Refunded Amount:</span>
                      <span className="font-black text-red-600 dark:text-red-400">₹{complaint.refundAmount || 0}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-zinc-800 pt-2">
                      <span className="font-bold text-zinc-500">Order Amount:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-150">₹{complaint.orderAmount || 450}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <button 
                      onClick={() => setIsRefundOpen(true)}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/10 transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <DollarSign className="w-4 h-4" />
                      Issue Customer Refund
                    </button>
                    <button 
                      onClick={() => setIsResolveOpen(true)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/10 transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Resolve Complaint Ticket
                    </button>
                    <button 
                      onClick={() => setIsCloseOpen(true)}
                      className="w-full py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Close Complaint Ticket
                    </button>
                  </div>
                </div>

                {/* Warning Alerts */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-lg border border-zinc-150 dark:border-zinc-800 text-xs font-medium text-zinc-500 dark:text-zinc-400 flex gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-[var(--primary)] shrink-0" />
                  <div>
                    <p className="font-bold text-zinc-705 dark:text-zinc-200">System Integration Notice</p>
                    <p className="mt-0.5 leading-relaxed text-[10px]">
                      Settlement operations trigger live client notifications (Email, SMS, App Push) and synchronize refund settlements to Stripe / Razorpay gateways.
                    </p>
                  </div>
                </div>

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
                        <th className="p-3">Performed By</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Previous State</th>
                        <th className="p-3">New State</th>
                        <th className="p-3 text-right">IP Address</th>
                        <th className="p-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30 text-zinc-700 dark:text-zinc-350">
                      {auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                          <td className="p-3 font-bold text-zinc-900 dark:text-zinc-50">{log.action}</td>
                          <td className="p-3">{log.performedBy}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-[8px] uppercase rounded font-bold">
                              {log.role}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400 font-mono text-[10px] max-w-[120px] truncate" title={log.oldValue}>
                            {log.oldValue}
                          </td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-450 font-mono text-[10px] max-w-[150px] truncate" title={log.newValue}>
                            {log.newValue}
                          </td>
                          <td className="p-3 text-right text-zinc-450 font-mono text-[10px]">{log.ipAddress}</td>
                          <td className="p-3 text-right text-zinc-450 font-semibold">
                            {new Date(log.createdAt).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}
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

      {/* Sub Modals Portal bindings */}
      <AssignAgentModal 
        isOpen={isAssignOpen} 
        onClose={() => setIsAssignOpen(false)} 
        complaintId={complaint.complaintNumber}
        onAssignSuccess={handleAssignSuccess}
      />
      <EscalateModal 
        isOpen={isEscalateOpen} 
        onClose={() => setIsEscalateOpen(false)} 
        complaintId={complaint.complaintNumber}
        onEscalateSuccess={handleEscalateSuccess}
      />
      <RefundModal 
        isOpen={isRefundOpen} 
        onClose={() => setIsRefundOpen(false)} 
        complaint={complaint}
        onRefundSuccess={handleRefundSuccess}
      />
      <ResolveModal 
        isOpen={isResolveOpen} 
        onClose={() => setIsResolveOpen(false)} 
        complaintId={complaint.complaintNumber}
        onResolveSuccess={handleResolveSuccess}
      />
      <CloseModal 
        isOpen={isCloseOpen} 
        onClose={() => setIsCloseOpen(false)} 
        complaintId={complaint.complaintNumber}
        onCloseSuccess={handleCloseSuccess}
      />

    </div>
  );
}
