import React, { useState, useEffect } from "react";
import { 
  X, Check, AlertTriangle, UserPlus, ShieldAlert, 
  DollarSign, Ticket, FileText, Upload, Calendar, 
  TrendingUp, HelpCircle, Eye, Trash2, Plus
} from "lucide-react";
import { mockStores, mockEmployees } from "../mockData";

// Local storage retrieval helpers
const getDB = (key) => JSON.parse(localStorage.getItem(key) || "[]");

// Premium Reusable Dialog Wrapper
export function DialogWrapper({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all animate-fade-down duration-200 z-10 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin text-xs text-zinc-650 dark:text-zinc-350">
          {children}
        </div>
      </div>
    </div>
  );
}

// 1. CREATE COMPLAINT MODAL
export function CreateComplaintModal({ isOpen, onClose, onCreate }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  const [formData, setFormData] = useState({
    customerId: "",
    orderId: "",
    storeId: "store-01",
    category: "Food Quality",
    priority: "Medium",
    description: "",
    assignedTo: "",
    attachmentUrl: ""
  });

  const [attachments, setAttachments] = useState([]);

  // Load database lists
  useEffect(() => {
    if (isOpen) {
      const customersList = getDB("pv_customers");
      const usersList = getDB("pv_users");
      const ordersList = getDB("pv_orders");

      // Join users for names
      const joinedCustomers = customersList.map(cust => {
        const u = usersList.find(user => user._id === cust.userId) || {};
        return {
          _id: cust._id,
          fullName: u.fullName || "Unknown Customer",
          mobile: u.mobile || "N/A"
        };
      });

      setCustomers(joinedCustomers);
      setOrders(ordersList);
      
      // Default selections
      if (joinedCustomers.length > 0) {
        setFormData(prev => ({
          ...prev,
          customerId: joinedCustomers[0]._id,
          storeId: "store-01",
          category: "Food Quality",
          priority: "Medium",
          description: "",
          assignedTo: "",
          attachmentUrl: ""
        }));
        setAttachments([]);
      }
    }
  }, [isOpen]);

  // Filter orders when customer changes
  useEffect(() => {
    if (formData.customerId) {
      const custOrders = orders.filter(o => o.customerId === formData.customerId);
      setFilteredOrders(custOrders);
      setFormData(prev => ({
        ...prev,
        orderId: custOrders.length > 0 ? custOrders[0].orderNumber : ""
      }));
    } else {
      setFilteredOrders([]);
    }
  }, [formData.customerId, orders]);

  const addAttachment = () => {
    if (formData.attachmentUrl.trim()) {
      setAttachments(prev => [...prev, formData.attachmentUrl.trim()]);
      setFormData(prev => ({ ...prev, attachmentUrl: "" }));
    }
  };

  const handleAddMockPhoto = () => {
    const mockPhotos = [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571066811602-716837d681de?w=600&auto=format&fit=crop"
    ];
    const randomPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    setAttachments(prev => [...prev, randomPhoto]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerId) return;
    
    onCreate({
      ...formData,
      attachments
    });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Register New Customer Complaint" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Customer & Store selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
              required
            >
              {customers.map(c => (
                <option key={c._id} value={c._id}>
                  {c.fullName} ({c.mobile})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Store Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
              required
            >
              {mockStores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Order ID & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Related Order ID
            </label>
            {filteredOrders.length > 0 ? (
              <select
                value={formData.orderId}
                onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
              >
                <option value="">None / Not Order Specific</option>
                {filteredOrders.map(o => (
                  <option key={o._id} value={o.orderNumber}>
                    {o.orderNumber} (₹{o.amount})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.orderId}
                onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                placeholder="Enter order no. if known (e.g. PV-98421)"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Complaint Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
              required
            >
              <option value="Food Quality">Food Quality & Taste</option>
              <option value="Delivery">Delivery Issues (Delay, Rude Rider)</option>
              <option value="Payment">Payment / Refund Errors</option>
              <option value="Missing Item">Missing / Wrong Item</option>
              <option value="App Issue">App / Website Tech Glitch</option>
              <option value="Other">Other Operational Issue</option>
            </select>
          </div>
        </div>

        {/* Priority & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              SLA Priority <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {["Low", "Medium", "High", "Critical"].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                  className={`flex-1 py-1.5 rounded-lg border text-center text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                    formData.priority === p
                      ? p === "Low"
                        ? "bg-slate-100 dark:bg-zinc-800 border-slate-400 text-slate-700 dark:text-slate-200"
                        : p === "Medium"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                        : p === "High"
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-450"
                      : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Initial Assignment
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            >
              <option value="">Leave Unassigned (Open status)</option>
              {mockEmployees.map(emp => (
                <option key={emp.id} value={emp.fullName}>
                  {emp.fullName} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaint Description */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Complaint Details / Customer Grievance <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the complaint in detail..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150 scrollbar-thin"
            required
          />
        </div>

        {/* Photo attachments */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Attachments (Photos / Evidence)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={formData.attachmentUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, attachmentUrl: e.target.value }))}
              placeholder="Paste Photo URL"
              className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            />
            <button
              type="button"
              onClick={addAttachment}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg font-bold border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              Add URL
            </button>
            <button
              type="button"
              onClick={handleAddMockPhoto}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg font-bold cursor-pointer"
            >
              <Upload size={12} />
              Mock Upload
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
              {attachments.map((url, i) => (
                <div key={i} className="relative w-14 h-14 rounded-md border border-zinc-250 dark:border-zinc-850 overflow-hidden group">
                  <img src={url} alt={`Attachment ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Submit Ticket
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 2. ASSIGN COMPLAINT MODAL
export function AssignComplaintModal({ isOpen, onClose, complaint, onAssign }) {
  const [formData, setFormData] = useState({
    assignedTo: "",
    priority: "Medium"
  });

  useEffect(() => {
    if (complaint) {
      setFormData({
        assignedTo: complaint.assignedTo || "",
        priority: complaint.priority || "Medium"
      });
    }
  }, [complaint]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!complaint) return;
    onAssign(complaint._id, formData);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Assign Ticket ${complaint?.ticketNumber || ""}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Support Representative
          </label>
          <select
            value={formData.assignedTo}
            onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            required
          >
            <option value="">-- Choose Agent --</option>
            {mockEmployees.map(emp => (
              <option key={emp.id} value={emp.fullName}>
                {emp.fullName} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Update Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal font-medium font-semibold">
            Assigning an agent will automatically update the ticket status to <strong className="font-extrabold">In Progress</strong>. An SLA timer will begin tracking based on the selected priority.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Confirm Assignment
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 3. ESCALATE COMPLAINT MODAL
export function EscalateComplaintModal({ isOpen, onClose, complaint, onEscalate }) {
  const [formData, setFormData] = useState({
    escalateTo: "Senior Operations Manager",
    priority: "Critical",
    comments: ""
  });

  useEffect(() => {
    if (complaint) {
      setFormData({
        escalateTo: "Senior Operations Manager",
        priority: "Critical",
        comments: ""
      });
    }
  }, [complaint]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!complaint) return;
    onEscalate(complaint._id, formData);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Escalate Ticket ${complaint?.ticketNumber || ""}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 flex gap-2">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-red-700 dark:text-red-400 leading-normal font-medium font-semibold">
            Escalation triggers immediate high-priority notifications to franchise administrators. Use this only for critical delays, payment errors, or unsatisfied VIP customer cases.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Escalate Destination Department / Role
          </label>
          <select
            value={formData.escalateTo}
            onChange={(e) => setFormData(prev => ({ ...prev, escalateTo: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            required
          >
            <option value="Senior Operations Manager">Senior Operations Manager</option>
            <option value="Franchise Head Office">Franchise Head Office (HQ)</option>
            <option value="Payment Disputes Desk">Payment Disputes Desk</option>
            <option value="Kitchen Operations Director">Kitchen Operations Director</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Upgrade Ticket Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
          >
            <option value="High">High Priority</option>
            <option value="Critical">Critical (Immediate Attention)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Escalation Notes / Remarks <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
            placeholder="Provide justification and details for escalation..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Escalate Now
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 4. EXPORT COMPLAINTS MODAL
export function ExportComplaintsModal({ isOpen, onClose, onExport }) {
  const [formData, setFormData] = useState({
    format: "CSV",
    storeId: "All",
    status: "All",
    priority: "All",
    dateRange: { start: "", end: "" }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport(formData.format, {
      storeId: formData.storeId,
      status: formData.status,
      priority: formData.priority,
      dateRange: formData.dateRange
    });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Export Support Tickets">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["CSV", "Excel", "PDF"].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, format: f }))}
                className={`py-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                  formData.format === f
                    ? "bg-zinc-800 text-white border-zinc-850 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200"
                    : "bg-white border-zinc-250 hover:bg-zinc-55 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Filter by Store
          </label>
          <select
            value={formData.storeId}
            onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
          >
            <option value="All">All Stores</option>
            {mockStores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Filter Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Filter Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Custom Date Created Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-zinc-450 font-bold uppercase block mb-0.5">From</span>
              <input
                type="date"
                value={formData.dateRange.start}
                onChange={(e) => setFormData(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-150"
              />
            </div>
            <div>
              <span className="text-[9px] text-zinc-450 font-bold uppercase block mb-0.5">To</span>
              <input
                type="date"
                value={formData.dateRange.end}
                onChange={(e) => setFormData(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-150"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Export Now
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}
