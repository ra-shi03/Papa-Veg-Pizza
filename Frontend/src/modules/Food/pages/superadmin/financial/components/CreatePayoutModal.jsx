import React, { useState, useEffect } from 'react';
import { X, Search, Landmark, Upload, Trash2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { useCreatePayout as useCreatePayoutHook, MOCK_BENEFICIARIES as BENEFICIARY_DATABASE } from '../hooks/usePayoutQuery';


export default function CreatePayoutModal({ isOpen, onClose, onSuccess }) {
  const { createPayout, loading } = useCreatePayoutHook();
  
  const [beneficiaryType, setBeneficiaryType] = useState('franchise');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState([]);
  
  const [errors, setErrors] = useState({});

  // Reset Form states on open
  useEffect(() => {
    if (isOpen) {
      setBeneficiaryType('franchise');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedBeneficiary(null);
      setAmount('');
      setPayoutMethod('Bank Transfer');
      setReferenceNo('');
      setRemarks('');
      setAttachments([]);
      setErrors({});
    }
  }, [isOpen]);

  // Autocomplete dynamic search simulation with 300ms debounce simulation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(() => {
      const db = BENEFICIARY_DATABASE[beneficiaryType] || [];
      const query = searchQuery.toLowerCase();
      const filtered = db.filter(b => 
        b.name.toLowerCase().includes(query) || 
        (b.ownerName && b.ownerName.toLowerCase().includes(query)) ||
        (b.id && b.id.toLowerCase().includes(query))
      );
      setSearchResults(filtered);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery, beneficiaryType]);

  if (!isOpen) return null;

  const handleSelectBeneficiary = (b) => {
    setSelectedBeneficiary(b);
    setSearchQuery(b.name);
    setSearchResults([]);
  };

  const handleClearBeneficiary = () => {
    setSelectedBeneficiary(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Attachments simulation handler
  const handleFileUpload = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = files.map(file => ({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedBeneficiary) {
      newErrors.beneficiary = "Please search and select a beneficiary";
    }
    if (!amount || Number(amount) <= 0) {
      newErrors.amount = "Amount must be a positive number greater than 0";
    }
    if (remarks.length > 500) {
      newErrors.remarks = "Remarks cannot exceed 500 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!validateForm()) return;

    const success = await createPayout({
      beneficiaryType,
      beneficiaryId: selectedBeneficiary.id,
      amount: Number(amount),
      payoutMethod,
      referenceNo,
      remarks,
      attachments,
      status: isDraft ? 'Draft' : 'Pending Approval'
    });

    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-[1000px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Landmark size={16} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black dark:text-white">
                Initiate Outgoing Payout
              </h3>
              <p className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400 mt-0.5">
                Register bank split clearance request for franchises, stores, riders, or external vendors
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-260px)] custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column 1: Beneficiary Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-800">
              Section 1: Beneficiary Details
            </h4>
            
            {/* Beneficiary Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Beneficiary Type</label>
              <select
                value={beneficiaryType}
                onChange={(e) => { setBeneficiaryType(e.target.value); handleClearBeneficiary(); }}
                className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="franchise">Franchise Owner</option>
                <option value="store">Store Outlet</option>
                <option value="deliveryPartner">Delivery Rider</option>
                <option value="vendor">External Vendor</option>
              </select>
            </div>

            {/* Search Beneficiary Autocomplete */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Search Beneficiary Node</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder={`Type to search ${beneficiaryType} logs...`}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (selectedBeneficiary) handleClearBeneficiary(); }}
                  className={`w-full pl-8 pr-8 h-9 bg-zinc-50 dark:bg-zinc-955 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white ${errors.beneficiary ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                />
                {selectedBeneficiary && (
                  <button 
                    type="button"
                    onClick={handleClearBeneficiary}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {errors.beneficiary && <span className="text-[10px] text-rose-550 font-bold">{errors.beneficiary}</span>}

              {/* Autocomplete Results Box */}
              {searchResults.length > 0 && (
                <div className="absolute top-[58px] left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 py-1 divide-y divide-zinc-100 dark:divide-zinc-850">
                  {searchResults.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleSelectBeneficiary(b)}
                      className="px-3 py-2 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 cursor-pointer flex justify-between items-center text-black dark:text-white"
                    >
                      <div>
                        <p className="font-bold">{b.name}</p>
                        <p className="text-[10px] text-zinc-450 font-normal mt-0.5">
                          {b.ownerName || b.riderName || b.vendorName || b.phone || 'Representative'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-[var(--primary)] bg-[var(--primary)]/5 px-2 py-0.5 rounded border border-[var(--primary)]/10 font-mono">
                        {b.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Read-only bank detail cards */}
            <div className="p-4 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-inner">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Landmark size={12} className="text-[var(--primary)]" />
                Verified Bank Details (Auto-Fetched)
              </p>
              {selectedBeneficiary ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Account Holder</span>
                    <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 truncate">{selectedBeneficiary.ownerName || selectedBeneficiary.riderName || selectedBeneficiary.vendorName || selectedBeneficiary.name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Bank Name</span>
                    <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 truncate">Verified Institution</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Account Number</span>
                    <p className="font-mono font-bold text-zinc-805 dark:text-zinc-250 mt-0.5">{selectedBeneficiary.bankAccount}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">IFSC Code</span>
                    <p className="font-mono font-bold text-zinc-805 dark:text-zinc-250 mt-0.5">{selectedBeneficiary.ifscCode}</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400 text-[11px] font-semibold flex flex-col items-center justify-center gap-1">
                  <AlertTriangle size={18} className="text-zinc-350" />
                  Select a beneficiary node to load routing details.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Payment Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-800">
              Section 2: Payment Information
            </h4>

            {/* Amount & Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-7 pr-3 h-9 bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white ${errors.amount ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  />
                </div>
                {errors.amount && <span className="text-[10px] text-rose-550 font-bold">{errors.amount}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="IMPS">IMPS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                </select>
              </div>
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Reference / Invoice Number</label>
              <input
                type="text"
                placeholder="e.g. INVOICE-FR-9908"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              />
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Internal Remarks</label>
                <span className="text-[8px] text-zinc-400 font-bold">{remarks.length}/500</span>
              </div>
              <textarea
                rows={3}
                placeholder="Explain payouts ledger context..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                maxLength={500}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none text-black dark:text-white"
              ></textarea>
            </div>

            {/* File Upload Attachment Dropzone */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">Attachments (Invoices / Proofs)</label>
              <div className="grid grid-cols-2 gap-3 items-start">
                {/* Upload drag block */}
                <div 
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group h-[110px]"
                  onClick={() => document.getElementById('payout-file-input').click()}
                >
                  <Upload size={18} className="text-[var(--primary)] group-hover:scale-110 transition-transform mb-1" />
                  <p className="text-[10px] font-bold text-black dark:text-white text-center">Add files</p>
                  <p className="text-[8px] text-zinc-450 text-center mt-0.5">PDF, PNG, JPG, XLSX (Max 10MB)</p>
                  <input
                    type="file"
                    id="payout-file-input"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Files list */}
                <div className="space-y-1.5 h-[110px] overflow-y-auto custom-scrollbar pr-1">
                  {attachments.length > 0 ? (
                    attachments.map((file, index) => (
                      <div 
                        key={index}
                        className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between text-[10px] font-semibold text-black dark:text-white"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText size={12} className="text-[var(--primary)] shrink-0" />
                          <span className="truncate max-w-[90px]" title={file.name}>{file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFile(index)}
                          className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-850 rounded text-rose-500 shrink-0 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-center text-[9px] text-zinc-450 font-bold border-dashed select-none">
                      No attachments added
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-zinc-350 dark:border-zinc-800 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="px-4 py-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-4 py-1.5 bg-[var(--primary)] hover:brightness-110 text-white text-xs font-bold rounded-lg shadow active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              Create Payout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
