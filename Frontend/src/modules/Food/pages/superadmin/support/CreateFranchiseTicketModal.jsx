import React, { useState } from 'react';
import { X, Plus, Upload, Trash2, FileText, CheckCircle2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateFranchiseTicketModal({ isOpen, onClose, onCreateSuccess }) {
  // Form state
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  
  // Auto-filled details representation
  const [autoFields, setAutoFields] = useState({
    region: '',
    franchiseCode: '',
    numberOfStores: 0,
    ownerName: '',
    email: '',
    phone: ''
  });

  const [ticketType, setTicketType] = useState('Store Issue');
  const [priority, setPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Mock collections for franchise lookup (Indian contexts)
  const franchises = [
    { id: "fr_1", code: "PV-IND-01", name: "Indore Foods Pvt Ltd", owner: "Priyanshu Patel", region: "Madhya Pradesh (Central)", stores: 8, email: "priyanshu@indorefoods.in", phone: "+91 98270 12345" },
    { id: "fr_2", code: "PV-BHO-02", name: "Bhopal Pizza Ventures", owner: "Ramanathan Iyer", region: "Madhya Pradesh (West)", stores: 5, email: "ram@bhopalventures.co.in", phone: "+91 75524 88392" },
    { id: "fr_3", code: "PV-DEL-03", name: "Capital Crust Franchisees", owner: "Gurpreet Singh", region: "NCR Delhi", stores: 12, email: "gurpreet@capitalcrust.in", phone: "+91 99110 55432" },
    { id: "fr_4", code: "PV-MUM-04", name: "Western Coast Pizzas", owner: "Ananya Deshmukh", region: "Maharashtra (West)", stores: 15, email: "ananya@westerncoast.in", phone: "+91 90220 77112" },
    { id: "fr_5", code: "PV-BLR-05", name: "Bengaluru Tech Foods", owner: "Karthik Reddy", region: "Karnataka (South)", stores: 6, email: "karthik@techfoods.co.in", phone: "+91 80491 66224" }
  ];

  // Franchise Admins lookup mapping
  const franchiseAdmins = {
    "fr_1": [
      { id: "adm_11", name: "Suresh Gupta (Store Ops Coordinator)" },
      { id: "adm_12", name: "Priyan Patel (Managing Director)" }
    ],
    "fr_2": [
      { id: "adm_21", name: "Rajesh Kulkarni (Finance Head)" },
      { id: "adm_22", name: "Kirti Iyer (Operations Lead)" }
    ],
    "fr_3": [
      { id: "adm_31", name: "Harpreet Singh (Area Manager)" },
      { id: "adm_32", name: "Sonia Gandhi (Accounts Desk)" }
    ],
    "fr_4": [
      { id: "adm_41", name: "Vijay Kadam (Logistics Lead)" },
      { id: "adm_42", name: "Deshmukh Senior (Owner Liaison)" }
    ],
    "fr_5": [
      { id: "adm_51", name: "Nandini Gowda (Operations Supervisor)" }
    ]
  };

  const handleFranchiseChange = (e) => {
    const frId = e.target.value;
    setSelectedFranchiseId(frId);
    setSelectedAdminId('');
    
    if (!frId) {
      setAutoFields({
        region: '',
        franchiseCode: '',
        numberOfStores: 0,
        ownerName: '',
        email: '',
        phone: ''
      });
      return;
    }

    const matchedFr = franchises.find(f => f.id === frId);
    if (matchedFr) {
      setAutoFields({
        region: matchedFr.region,
        franchiseCode: matchedFr.code,
        numberOfStores: matchedFr.stores,
        ownerName: matchedFr.owner,
        email: matchedFr.email,
        phone: matchedFr.phone
      });
    }
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
    if (!selectedFranchiseId || !selectedAdminId) {
      toast.error("Please specify franchise and raise request reporter");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }

    setLoading(true);
    
    // Simulate API POST /api/franchise-tickets
    setTimeout(() => {
      setLoading(false);
      const chosenFr = franchises.find(f => f.id === selectedFranchiseId);
      const chosenAdmin = (franchiseAdmins[selectedFranchiseId] || []).find(a => a.id === selectedAdminId);
      
      const mockNewTicket = {
        _id: `ft_${Math.floor(1000 + Math.random() * 9000)}`,
        ticketNumber: `FTK-${Math.floor(10000 + Math.random() * 90000)}`,
        franchiseId: selectedFranchiseId,
        franchiseName: chosenFr.name,
        franchiseCode: chosenFr.code,
        adminId: selectedAdminId,
        adminName: chosenAdmin.name,
        ownerName: chosenFr.owner,
        contactEmail: chosenFr.email,
        contactPhone: chosenFr.phone,
        region: chosenFr.region,
        storesCount: chosenFr.stores,
        type: ticketType,
        subject,
        description,
        priority,
        status: 'Open',
        assignedDepartment: 'Technical Support',
        assignedTo: 'Unassigned',
        attachments: attachments.map(a => a.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      toast.success(`Franchise Ticket ${mockNewTicket.ticketNumber} registered successfully`);
      if (onCreateSuccess) {
        onCreateSuccess(mockNewTicket);
      }
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Create Franchise Support Ticket</h2>
              <p className="text-[10px] text-zinc-500">Log new operational issues, payment disputes, or store requests</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          
          {/* Section 1: Franchise Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1">
              1. Franchise Entity Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Franchise Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Select Franchise Partner</label>
                <select
                  value={selectedFranchiseId}
                  onChange={handleFranchiseChange}
                  required
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  <option value="">Search Franchise list...</option>
                  {franchises.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              {/* Franchise Admin Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Reporter (Franchise Admin)</label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  disabled={!selectedFranchiseId}
                  required
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Choose Admin...</option>
                  {selectedFranchiseId && (franchiseAdmins[selectedFranchiseId] || []).map(adm => (
                    <option key={adm.id} value={adm.id}>{adm.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-filled details Card Grid */}
            {selectedFranchiseId && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-lg animate-fade-down">
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Franchise Code</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{autoFields.franchiseCode}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Operating Region</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate w-28" title={autoFields.region}>{autoFields.region}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Active Stores</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{autoFields.numberOfStores} Outlet(s)</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Owner Name</p>
                  <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">{autoFields.ownerName}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Contact Details</p>
                  <p className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">{autoFields.phone}</p>
                  <p className="text-[9px] text-zinc-400 truncate w-32" title={autoFields.email}>{autoFields.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Ticket Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1">
              2. Support Ticket Specifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ticket Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Ticket Type</label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
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
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Initial Severity / Priority</label>
                <div className="grid grid-cols-4 gap-1.5 h-9 items-center">
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`h-8 rounded-lg border text-[9px] font-extrabold uppercase transition-all active:scale-95 flex items-center justify-center ${
                        priority === p
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm font-black'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-550'
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
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Ticket Title / Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="E.g., Inventory counts mismatch for SKU-Paneer-05 or Weekly settlements discrepancy..."
                className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows="4"
                placeholder="Elaborate on the issue, specifying timestamps, affected products, order codes, or error details..."
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
              />
            </div>

            {/* Upload Attachments */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Supporting Attachments (Max 10 files)</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Dropzone */}
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
                        <div key={att.id} className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-705">
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
                            className="p-1 text-zinc-400 hover:text-red-550 rounded hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors"
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
              className="px-5 h-9 rounded-lg text-xs font-bold text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 h-9 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? 'Registering...' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
