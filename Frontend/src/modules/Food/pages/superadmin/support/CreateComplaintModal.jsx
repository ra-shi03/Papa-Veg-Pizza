import React, { useState } from 'react';
import { X, Plus, Upload, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateComplaintModal({ isOpen, onClose, onCreateSuccess }) {
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  
  // Auto-filled states
  const [autoFields, setAutoFields] = useState({
    store: '',
    franchise: '',
    deliveryPartner: '',
    orderAmount: 0,
    paymentMethod: ''
  });

  const [complaintType, setComplaintType] = useState('Food Quality');
  const [category, setCategory] = useState('Bad Taste / Incorrect Toppings');
  const [priority, setPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Mock collections for search
  const customers = [
    { id: "c1", name: "Rohan Malhotra", phone: "+91 98402 12903", email: "rohan@gmail.com" },
    { id: "c2", name: "Isha Sharma", phone: "+91 88401 22894", email: "isha@gmail.com" },
    { id: "c3", name: "Amit Verma", phone: "+91 74029 88390", email: "amit.v@yahoo.com" },
    { id: "c4", name: "Pooja Patel", phone: "+91 99002 44101", email: "pooja.patel@gmail.com" },
    { id: "c5", name: "Deepak Rawat", phone: "+91 81029 99882", email: "deepak.r@outlook.com" }
  ];

  const orders = {
    "c1": [
      { id: "o1", orderNumber: "PV-9042", store: "Indore Central", franchise: "Indore Group", deliveryPartner: "Karan Singh", orderAmount: 450, paymentMethod: "UPI (Google Pay)" }
    ],
    "c2": [
      { id: "o2", orderNumber: "PV-9041", store: "Bhopal Zone", franchise: "Bhopal Foods", deliveryPartner: "Rahul Dev", orderAmount: 590, paymentMethod: "Cash on Delivery" }
    ],
    "c3": [
      { id: "o3", orderNumber: "PV-9039", store: "Ujjain Branch", franchise: "Mahakal Franchises", deliveryPartner: "Vikram Rathore", orderAmount: 380, paymentMethod: "Net Banking" }
    ],
    "c4": [
      { id: "o4", orderNumber: "PV-9038", store: "Indore Central", franchise: "Indore Group", deliveryPartner: "Karan Singh", orderAmount: 320, paymentMethod: "Papa Store Wallet" }
    ],
    "c5": [
      { id: "o5", orderNumber: "PV-9036", store: "Bhopal Zone", franchise: "Bhopal Foods", deliveryPartner: "Rahul Dev", orderAmount: 520, paymentMethod: "UPI (PhonePe)" }
    ]
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    setSelectedOrderId('');
    setAutoFields({
      store: '',
      franchise: '',
      deliveryPartner: '',
      orderAmount: 0,
      paymentMethod: ''
    });
  };

  const handleOrderChange = (e) => {
    const ordId = e.target.value;
    setSelectedOrderId(ordId);
    if (!ordId) return;

    const customerOrders = orders[selectedCustomerId] || [];
    const matchedOrder = customerOrders.find(o => o.id === ordId);
    if (matchedOrder) {
      setAutoFields({
        store: matchedOrder.store,
        franchise: matchedOrder.franchise,
        deliveryPartner: matchedOrder.deliveryPartner,
        orderAmount: matchedOrder.orderAmount,
        paymentMethod: matchedOrder.paymentMethod
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
    if (!selectedCustomerId || !selectedOrderId) {
      toast.error("Please specify customer and related order");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }

    setLoading(true);
    // Simulate POST /api/customer-complaints
    setTimeout(() => {
      setLoading(false);
      const chosenCustomer = customers.find(c => c.id === selectedCustomerId);
      const chosenOrder = (orders[selectedCustomerId] || []).find(o => o.id === selectedOrderId);
      
      const mockNewComplaint = {
        complaintNumber: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: chosenCustomer.name,
        orderNumber: chosenOrder.orderNumber,
        type: complaintType,
        category,
        priority,
        status: 'Open',
        assignedTo: 'Unassigned',
        refundAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subject,
        description,
        store: autoFields.store,
        franchise: autoFields.franchise,
        deliveryPartner: autoFields.deliveryPartner,
        orderAmount: autoFields.orderAmount,
        paymentMethod: autoFields.paymentMethod,
        attachments: attachments.map(a => a.name)
      };

      toast.success(`Complaint ${mockNewComplaint.complaintNumber} registered successfully`);
      if (onCreateSuccess) {
        onCreateSuccess(mockNewComplaint);
      }
      onClose();
    }, 1200);
  };

  const categories = {
    'Food Quality': ['Bad Taste / Incorrect Toppings', 'Undercooked Dough', 'Cold Pizza Delivered', 'Hygiene / Hair in Food'],
    'Delivery Issues': ['Late Delivery (>30m delay)', 'Rider Misbehavior', 'Spilled / Smashed Pizza Box', 'Rider Undelivered'],
    'Payment & Refunds': ['Double Payment Debited', 'Cashback / Promo Coupon Not Applied', 'Store Wallet Settlement Pending'],
    'Store Operations': ['Delayed Cooking (>30m prep)', 'Store Cancelled Without Reason', 'Incorrect Pizza Size']
  };

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Create Customer Complaint</h2>
            <p className="text-[10px] text-zinc-500">Register new customer feedback and store disputes</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          
          {/* Section 1: Customer Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1">
              1. Customer & Order Identification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  required
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  <option value="">Search customer list...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {/* Order selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Select Order ID</label>
                <select
                  value={selectedOrderId}
                  onChange={handleOrderChange}
                  disabled={!selectedCustomerId}
                  required
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Choose order...</option>
                  {selectedCustomerId && (orders[selectedCustomerId] || []).map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} (₹{o.orderAmount})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-filled details (Card Grid) */}
            {selectedOrderId && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-lg animate-fade-down">
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Outlet Store</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{autoFields.store}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Franchise Node</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{autoFields.franchise}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Delivery Rider</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{autoFields.deliveryPartner}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Order Value</p>
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-450">₹{autoFields.orderAmount}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Payment Mode</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{autoFields.paymentMethod}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Complaint Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1">
              2. Complaint Specifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Complaint Type</label>
                <select
                  value={complaintType}
                  onChange={(e) => {
                    setComplaintType(e.target.value);
                    setCategory(categories[e.target.value][0]);
                  }}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  <option value="Food Quality">Food Quality</option>
                  <option value="Delivery Issues">Delivery Issues</option>
                  <option value="Payment & Refunds">Payment & Refunds</option>
                  <option value="Store Operations">Store Operations</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Detailed Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                >
                  {categories[complaintType]?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Initial Severity Priority</label>
                <div className="grid grid-cols-4 gap-1 h-9 items-center">
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`h-8 rounded-lg border text-[9px] font-extrabold uppercase transition-all active:scale-95 flex items-center justify-center ${
                        priority === p
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
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
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455">Complaint Ticket Title / Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief summary of the issue (e.g., Delivered cold pizza with missing toppings)..."
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
                placeholder="Document full customer claims, logs, and any background store responses..."
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Image Attachments & Logs (Max 10 files)</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Dropzone */}
                <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-[var(--primary)] transition-colors p-4 flex flex-col items-center justify-center cursor-pointer text-center bg-zinc-50/50 dark:bg-zinc-800/20 min-h-[100px]">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-zinc-400 group-hover:text-[var(--primary)] mb-1.5" />
                  <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-305">Click to choose or drag images/PDFs here</p>
                  <p className="text-[8px] text-zinc-400 mt-1">Supported: JPG, PNG, PDF (Up to 10 MB per file)</p>
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
                  Save Complaint
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
