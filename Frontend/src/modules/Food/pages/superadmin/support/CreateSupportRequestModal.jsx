import React, { useState } from 'react';
import { X, Plus, Upload, Trash2, FileText, CheckCircle2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateSupportRequestModal({ isOpen, onClose, onCreateSuccess }) {
  // Form State
  const [selectedRequesterId, setSelectedRequesterId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Store Manager');

  const [autoFields, setAutoFields] = useState({
    phone: '',
    email: '',
    store: '',
    franchise: '',
    employeeId: ''
  });

  const [category, setCategory] = useState('Technical');
  const [subcategory, setSubcategory] = useState('App Crash');
  const [priority, setPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Mock Database for Requesters
  const requesters = {
    "Admin": [
      { id: "req_1", name: "Neha Singh", phone: "+91 94012 34567", email: "neha.singh@papaveg.com", store: "All Nodes", franchise: "Global Corporate", employeeId: "EMP-ADM-02" },
      { id: "req_2", name: "Gaurav Joshi", phone: "+91 82230 45678", email: "gaurav.j@papaveg.com", store: "All Nodes", franchise: "Global Corporate", employeeId: "EMP-ADM-09" }
    ],
    "Store Manager": [
      { id: "req_3", name: "Amit Sharma", phone: "+91 94072 88402", email: "amit.sharma@papaveg.com", store: "Indore Vijay Nagar", franchise: "Indore Group", employeeId: "EMP-MGR-82" },
      { id: "req_4", name: "Ramesh Kumar", phone: "+91 75529 11029", email: "ramesh.k@papaveg.com", store: "Bhopal MP Nagar", franchise: "Bhopal Foods", employeeId: "EMP-MGR-34" }
    ],
    "Kitchen Staff": [
      { id: "req_5", name: "Vikram Singh", phone: "+91 91029 44859", email: "vikram.s@papaveg.com", store: "Indore Vijay Nagar", franchise: "Indore Group", employeeId: "EMP-KIT-102" },
      { id: "req_6", name: "Karan Johar", phone: "+91 88770 11223", email: "karan.j@papaveg.com", store: "Bhopal MP Nagar", franchise: "Bhopal Foods", employeeId: "EMP-KIT-94" }
    ],
    "Delivery Partner": [
      { id: "req_7", name: "Rahul Dev", phone: "+91 98930 22114", email: "rahul.rider@gmail.com", store: "Bhopal MP Nagar", franchise: "Bhopal Foods", employeeId: "EMP-RDR-442" },
      { id: "req_8", name: "Karan Singh", phone: "+91 90390 12903", email: "karan.rider@gmail.com", store: "Indore Vijay Nagar", franchise: "Indore Group", employeeId: "EMP-RDR-201" }
    ],
    "System": [
      { id: "req_9", name: "Automated Job Server", phone: "-", email: "cron-agent@papaveg.com", store: "Infrastructure Cloud", franchise: "System Admin", employeeId: "SYS-CRON-01" },
      { id: "req_10", name: "API Monitoring Agent", phone: "-", email: "monitor-agent@papaveg.com", store: "API Cloud Gateway", franchise: "System Admin", employeeId: "SYS-MON-02" }
    ]
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setSelectedRequesterId('');
    setAutoFields({
      phone: '',
      email: '',
      store: '',
      franchise: '',
      employeeId: ''
    });
  };

  const handleRequesterChange = (e) => {
    const reqId = e.target.value;
    setSelectedRequesterId(reqId);
    if (!reqId) return;

    const list = requesters[selectedRole] || [];
    const matched = list.find(r => r.id === reqId);
    if (matched) {
      setAutoFields({
        phone: matched.phone,
        email: matched.email,
        store: matched.store,
        franchise: matched.franchise,
        employeeId: matched.employeeId
      });
    }
  };

  // Category and Subcategory lists mapping
  const categorySubcategories = {
    'Technical': ['App Crash', 'Login Issue', 'POS Issue', 'Socket Issue'],
    'Operational': ['Inventory Problem', 'Kitchen Delay', 'Store Issue', 'Printer Issue'],
    'Delivery': ['Rider App Issue', 'GPS Problem', 'Wallet Issue'],
    'HR': ['Attendance Issue', 'Salary Issue', 'Leave Request'],
    'System': ['Automated Job Fail', 'API Timeout', 'Database Connection', 'Cache Sync']
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    const subList = categorySubcategories[cat] || [];
    setSubcategory(subList[0] || '');
  };

  // Multiple File Attachment handler
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (attachments.length + files.length > 10) {
      toast.error("Maximum 10 files can be uploaded");
      return;
    }

    const newAttachments = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequesterId) {
      toast.error("Please select the raising requester");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }

    setLoading(true);
    // Simulate POST /api/support-requests
    setTimeout(() => {
      setLoading(false);
      const chosenList = requesters[selectedRole] || [];
      const chosenReq = chosenList.find(r => r.id === selectedRequesterId);

      const mockNewRequest = {
        _id: `sr_${Math.floor(1000 + Math.random() * 9000)}`,
        requestNumber: `SRQ-${Math.floor(10000 + Math.random() * 90000)}`,
        requesterId: selectedRequesterId,
        requesterName: chosenReq.name,
        requesterRole: selectedRole,
        employeeId: autoFields.employeeId,
        phone: autoFields.phone,
        email: autoFields.email,
        store: autoFields.store,
        franchise: autoFields.franchise,
        category,
        subcategory,
        subject,
        description,
        priority,
        status: 'Open',
        assignedTo: 'Unassigned',
        attachments: attachments.map(a => a.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      toast.success(`Support Request ${mockNewRequest.requestNumber} logged successfully`);
      if (onCreateSuccess) {
        onCreateSuccess(mockNewRequest);
      }
      onClose();
    }, 1200);
  };

  const subcategoriesList = categorySubcategories[category] || [];

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--primary)] animate-bounce" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Create Internal Support Request</h2>
              <p className="text-[10px] text-zinc-500 font-semibold">Log a helpdesk request for Admins, Store Managers, Kitchen Staff, Delivery Partners, or System crons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          
          {/* Section 1: Requester Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1">
              1. Requester Profile Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450 block">Requester Role Category</label>
                <select
                  value={selectedRole}
                  onChange={handleRoleChange}
                  required
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  <option value="Admin">Admin / Corporate</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Kitchen Staff">Kitchen Staff</option>
                  <option value="Delivery Partner">Delivery Partner / Rider</option>
                  <option value="System">System Automated Cron</option>
                </select>
              </div>

              {/* Requester Select */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450 block">Select Employee / Requester Name</label>
                <select
                  value={selectedRequesterId}
                  onChange={handleRequesterChange}
                  required
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  <option value="">Choose employee...</option>
                  {(requesters[selectedRole] || []).map(r => (
                    <option key={r.id} value={r.id}>{r.name} {r.phone !== '-' ? `(${r.phone})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-filled metrics */}
            {selectedRequesterId && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-lg animate-fade-down">
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Employee / Job ID</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">{autoFields.employeeId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Linked Store</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate w-28" title={autoFields.store}>{autoFields.store}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Franchise Node</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate w-28" title={autoFields.franchise}>{autoFields.franchise}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Contact Information</p>
                  <p className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
                    {autoFields.phone !== '-' ? autoFields.phone : 'No Phone'} • {autoFields.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Request Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1">
              2. Helpdesk Ticket Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Request Category</label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  <option value="Technical">Technical</option>
                  <option value="Operational">Operational</option>
                  <option value="Delivery">Delivery</option>
                  <option value="HR">HR</option>
                  <option value="System">System (Automated)</option>
                </select>
              </div>

              {/* Subcategory */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Subcategory Type</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  {subcategoriesList.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Severity Priority</label>
                <div className="grid grid-cols-4 gap-1 h-9 items-center">
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`h-8 rounded-lg border text-[9px] font-extrabold uppercase transition-all active:scale-95 flex items-center justify-center ${
                        priority === p
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Subject / Issue Summary</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="E.g., POS Printer thermal roll jammed or Rider wallet calculation discrepancy..."
                className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Detailed Problem Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows="4"
                placeholder="Explain the technical or operational blocks, steps to reproduce, or salary months involved..."
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Attachments & Logs (Max 10 files)</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File dropzone */}
                <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-[var(--primary)] transition-colors p-4 flex flex-col items-center justify-center cursor-pointer text-center bg-zinc-50/50 dark:bg-zinc-800/20 min-h-[100px]">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.xlsx,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-zinc-400 group-hover:text-[var(--primary)] mb-1.5" />
                  <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-305">Click to choose or drag files here</p>
                  <p className="text-[8px] text-zinc-400 mt-1">Supported: JPG, PNG, PDF, XLSX, CSV (Up to 10 MB per file)</p>
                </div>

                {/* Previews List */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/30 dark:bg-zinc-900/50 max-h-[120px] overflow-y-auto scrollbar-thin">
                  {attachments.length > 0 ? (
                    <div className="space-y-1.5">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-700">
                          <div className="flex items-center gap-2 min-w-0">
                            {att.type.includes('image') ? (
                              <img src={att.url} alt="preview" className="w-7 h-7 rounded object-cover shadow-sm" />
                            ) : (
                              <div className="w-7 h-7 bg-red-500/10 text-red-500 rounded flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold text-zinc-800 dark:text-zinc-100 truncate w-32 md:w-44">{att.name}</p>
                              <p className="text-[8px] text-zinc-400">{att.size}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1 text-zinc-450 hover:text-red-550 rounded hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center">
                      <p className="text-[9px] text-zinc-400 font-bold">No documents attached yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-9 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 h-9 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? 'Submitting...' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Request
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
