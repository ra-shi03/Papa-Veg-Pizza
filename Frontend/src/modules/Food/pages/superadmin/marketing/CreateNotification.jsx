import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Check, ChevronRight, AlertCircle, Info, Calendar, 
  DollarSign, Target, Gift, Settings, Search, Volume2, 
  Mail, MessageSquare, Layers, Loader2, ArrowRight, Upload, 
  Smartphone, Bell, MessageCircle, AlertTriangle 
} from 'lucide-react';
import { 
  apiCreateNotification, 
  apiSearchCustomers 
} from './NotificationData';
import { 
  mockRegions, 
  mockZones, 
  mockTerritories, 
  mockFranchises, 
  mockStores 
} from './CouponsData';

export default function CreateNotification({ isOpen, onClose, onCreated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Channels
  const [selectedChannels, setSelectedChannels] = useState(['App Push']);

  // Audience
  const [audienceType, setAudienceType] = useState('All Customers');
  const [regionIds, setRegionIds] = useState([]);
  const [franchiseIds, setFranchiseIds] = useState([]);
  const [customerIds, setCustomerIds] = useState([]);

  // Customer async search states
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Schedule
  const [scheduleMode, setScheduleMode] = useState('Immediate'); // 'Immediate' | 'Schedule'
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Status
  const [status, setStatus] = useState('Draft');

  // Error States
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  // Handle customer async lookup with debouncing
  useEffect(() => {
    if (audienceType === 'Selected Customers') {
      setCustomersLoading(true);
      const timer = setTimeout(() => {
        apiSearchCustomers(customerQuery)
          .then(data => {
            setCustomerOptions(data);
            setCustomersLoading(false);
          })
          .catch(() => setCustomersLoading(false));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [customerQuery, audienceType]);

  // Hierarchical Filter Calculations
  const filteredFranchises = useMemo(() => {
    if (regionIds.length === 0) return mockFranchises;
    const zoneIds = mockZones.filter(z => regionIds.includes(z.regionId)).map(z => z.id);
    const territoryIds = mockTerritories.filter(t => zoneIds.includes(t.zoneId)).map(t => t.id);
    return mockFranchises.filter(f => territoryIds.includes(f.territoryId));
  }, [regionIds]);

  // Auto-deselect invalid children when parent selections change
  useEffect(() => {
    const allowedFranIds = filteredFranchises.map(f => f.id);
    setFranchiseIds(prev => prev.filter(id => allowedFranIds.includes(id)));
  }, [filteredFranchises]);

  if (!isOpen) return null;

  // Image upload simulator
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Only JPEG, PNG, and WebP images are supported!');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!title.trim()) newErrors.title = 'Notification Title is required';
      if (!message.trim()) newErrors.message = 'Notification Message Body is required';
    }
    if (step === 2) {
      if (selectedChannels.length === 0) newErrors.channels = 'Please select at least one channel';
    }
    if (step === 3) {
      if (audienceType === 'Selected Customers' && customerIds.length === 0) {
        newErrors.customers = 'Please select at least one customer';
      }
      if (audienceType === 'Region Wise' && regionIds.length === 0) {
        newErrors.regions = 'Please select at least one region';
      }
      if (audienceType === 'Franchise Wise' && franchiseIds.length === 0) {
        newErrors.franchises = 'Please select at least one franchise';
      }
    }
    if (step === 4) {
      if (scheduleMode === 'Schedule') {
        if (!scheduleDate) newErrors.scheduleDate = 'Schedule Date is required';
        if (!scheduleTime) newErrors.scheduleTime = 'Schedule Time is required';
        if (scheduleDate && scheduleTime) {
          const sched = new Date(`${scheduleDate}T${scheduleTime}:00`);
          if (sched <= new Date()) {
            newErrors.scheduleTime = 'Schedule time must be in the future';
          }
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSave = async (forceStatus = null) => {
    // Validate all
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setLoading(true);
    const resolvedStatus = forceStatus || status;

    const payload = {
      title,
      message,
      image: imagePreview || '',
      type: selectedChannels.join(', '),
      audienceType,
      customerIds,
      regionIds,
      franchiseIds,
      scheduleImmediate: scheduleMode === 'Immediate',
      scheduleAt: scheduleMode === 'Immediate' ? new Date().toISOString() : new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString(),
      status: resolvedStatus
    };

    try {
      const result = await apiCreateNotification(payload);
      setLoading(false);
      onCreated && onCreated(result);
      handleClose();
    } catch (err) {
      setLoading(false);
      alert('Failed to send notification: ' + err.message);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setImageFile(null);
    setImagePreview('');
    setSelectedChannels(['App Push']);
    setAudienceType('All Customers');
    setRegionIds([]);
    setFranchiseIds([]);
    setCustomerIds([]);
    setScheduleMode('Immediate');
    setScheduleDate('');
    setScheduleTime('');
    setStatus('Draft');
    setCurrentStep(1);
    setErrors({});
    onClose();
  };

  const stepsList = [
    { num: 1, label: 'Message Details', icon: Info },
    { num: 2, label: 'Channels', icon: Smartphone },
    { num: 3, label: 'Audience Targeting', icon: Target },
    { num: 4, label: 'Scheduling', icon: Calendar },
    { num: 5, label: 'Review & Status', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-[1200px] h-[700px] max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <Bell size={16} />
              </span>
              Create Push Notification
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Deploy immediate or scheduled multi-channel push announcements</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Core Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Stepper Sidebar */}
          <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 flex flex-col justify-between">
            <div className="space-y-1">
              {stepsList.map((step) => {
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                return (
                  <button
                    key={step.num}
                    onClick={() => {
                      if (step.num < currentStep || validateStep(currentStep)) {
                        setCurrentStep(step.num);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                      isActive 
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-sm' 
                        : isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-bold shrink-0 transition-all ${
                      isActive 
                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                        : isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-750 text-zinc-500'
                    }`}>
                      {isCompleted ? <Check size={12} /> : step.num}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold leading-none">Step 0{step.num}</p>
                      <p className="text-xs truncate mt-0.5">{step.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Live Counter Preview Box */}
            <div className="bg-zinc-900 text-white rounded-xl p-3 flex flex-col gap-1 shadow-inner select-none">
              <span className="text-[8px] font-black uppercase text-zinc-450 tracking-wider">Device Preview Count</span>
              <span className="text-sm font-black tracking-tight text-white mt-1">
                {audienceType === 'All Customers' ? '12,500' :
                 audienceType === 'Premium Customers' ? '3,100' :
                 audienceType === 'New Customers' ? '4,200' :
                 audienceType === 'Selected Customers' ? customerIds.length :
                 audienceType === 'Region Wise' ? `${regionIds.length * 3500}` :
                 `${franchiseIds.length * 800}`} users
              </span>
              <p className="text-[9px] text-zinc-400 leading-tight">Delivering via push notification gateways.</p>
            </div>
          </div>

          {/* Right Content Form Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950">
            
            {/* STEP 1: Message details */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
                
                {/* Inputs block */}
                <div className="space-y-4">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Message Formulation</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Compose title and body descriptions supporting custom WebP previews.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Message Title *</label>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. 🍕 Weekend Cheese Fest Alert!"
                      className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.title ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all font-semibold`}
                    />
                    {errors.title && <p className="text-[10px] text-red-500 font-semibold">{errors.title}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Message Body *</label>
                      <span className="text-[9px] text-zinc-400 font-bold">{message.length}/250 chars</span>
                    </div>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 250))}
                      placeholder="Type push alert description message (max 250 chars)..."
                      rows={4}
                      className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.message ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all resize-none font-medium`}
                    />
                    {errors.message && <p className="text-[10px] text-red-500 font-semibold">{errors.message}</p>}
                  </div>

                  {/* Banner Image Drag and Drop */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Banner Image (WebP supported)</label>
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                      className="border-2 border-dashed border-zinc-250 dark:border-zinc-800 hover:border-[var(--primary)]/50 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-900/30 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        accept="image/jpeg, image/png, image/webp"
                      />
                      <Upload size={20} className="text-zinc-400 group-hover:text-[var(--primary)] transition-colors" />
                      <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-350">Drag &amp; Drop or Click to Upload</p>
                      <p className="text-[9px] text-zinc-400">Supports JPEG, PNG, WebP up to 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Smartphone Preview Block */}
                <div className="flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-808 select-none">
                  <span className="text-[9px] font-extrabold uppercase text-zinc-450 tracking-wider mb-3 block">Live Device Mock Preview</span>
                  
                  {/* Smartphone case */}
                  <div className="w-[280px] h-[450px] border-[6px] border-zinc-900 dark:border-zinc-800 rounded-[36px] bg-zinc-900 shadow-xl relative overflow-hidden flex flex-col justify-between p-3.5">
                    {/* Notch */}
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-10"></div>
                    
                    {/* Top status bar */}
                    <div className="flex justify-between items-center text-[8px] text-white/70 px-1 pt-1 z-10">
                      <span>12:00</span>
                      <div className="flex items-center gap-1">
                        <span>Push</span>
                        <div className="w-3.5 h-2 bg-white/70 rounded-sm"></div>
                      </div>
                    </div>

                    {/* Notification Alert Box */}
                    <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-2xl p-3 border border-zinc-200/25 shadow-2xl flex flex-col gap-2 mt-4 max-h-[220px] overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-[var(--primary)] flex items-center justify-center text-white text-[8px] font-bold shrink-0">PVP</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8.5px] font-extrabold text-zinc-900 dark:text-zinc-150 leading-none">Papa Veg Pizza</p>
                          <p className="text-[7.5px] text-zinc-455 leading-none mt-0.5">Push Notification</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">{title || 'Monsoon BOGO Special Alert!'}</p>
                        <p className="text-[8.5px] text-zinc-550 dark:text-zinc-400 leading-relaxed font-semibold line-clamp-3">
                          {message || 'Warm up your rainy days! Buy 1 Get 1 Free on all Medium Thin-crust Pizzas. Offer valid today only.'}
                        </p>
                      </div>

                      {imagePreview && (
                        <div className="h-20 w-full rounded-lg overflow-hidden border border-zinc-200/20 shrink-0">
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Banner Preview" />
                        </div>
                      )}
                    </div>

                    {/* Bottom slider */}
                    <div className="w-20 h-1 bg-white/35 rounded-full mx-auto mb-1"></div>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 2: Channels */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delivery Channels</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Select and enable one or more transport delivery channels.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'App Push', desc: 'In-app and browser push notifications', icon: Bell },
                    { name: 'SMS', desc: 'Direct text messaging alert gateway', icon: MessageSquare },
                    { name: 'Email', desc: 'Rich HTML newsletter direct delivery', icon: Mail },
                    { name: 'Multi Channel', desc: 'Cross-platform push, SMS and Email dispatch', icon: Layers }
                  ].map(chan => {
                    const Icon = chan.icon;
                    const isSel = selectedChannels.includes(chan.name);
                    return (
                      <label 
                        key={chan.name}
                        className={`border rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                          isSel 
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-[var(--primary)]' 
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSel}
                          onChange={() => {
                            setSelectedChannels(prev => 
                              isSel ? prev.filter(c => c !== chan.name) : [...prev, chan.name]
                            );
                          }}
                          className="sr-only"
                        />
                        <span className={`p-2.5 rounded-xl shrink-0 ${isSel ? 'bg-[var(--primary)] text-white' : 'bg-zinc-100 dark:bg-zinc-805 text-zinc-450'}`}>
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${isSel ? 'text-[var(--primary)]' : 'text-zinc-900 dark:text-zinc-100'}`}>{chan.name}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">{chan.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.channels && <p className="text-[10px] text-red-500 font-semibold">{errors.channels}</p>}
              </div>
            )}

            {/* STEP 3: Audience targeting */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Audience Targeting</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Determine demographic and geographic scopes for push targets.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Audience Target Type</label>
                    <select 
                      value={audienceType}
                      onChange={(e) => {
                        setAudienceType(e.target.value);
                        setRegionIds([]);
                        setFranchiseIds([]);
                        setCustomerIds([]);
                      }}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 font-semibold cursor-pointer"
                    >
                      <option value="All Customers">All Customers</option>
                      <option value="Premium Customers">Premium Customers Only</option>
                      <option value="New Customers">New Customers Only</option>
                      <option value="Selected Customers">Selected Customers List (Async Search)</option>
                      <option value="Region Wise">Region Wise</option>
                      <option value="Franchise Wise">Franchise Wise</option>
                    </select>
                  </div>

                  {/* 1. Selected Customers Async Search */}
                  {audienceType === 'Selected Customers' && (
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Search Customers *</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={customerQuery}
                          onChange={(e) => {
                            setCustomerQuery(e.target.value);
                            setShowCustDropdown(true);
                          }}
                          onFocus={() => setShowCustDropdown(true)}
                          placeholder="Type customer name or phone..."
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-semibold"
                        />
                        <Search size={14} className="absolute left-3.5 top-3 text-zinc-400" />
                      </div>
                      
                      {/* Dropdown list */}
                      {showCustDropdown && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-805">
                          {customersLoading ? (
                            <div className="p-3 text-center flex justify-center items-center gap-1.5">
                              <Loader2 size={13} className="animate-spin text-[var(--primary)]" />
                              <span className="text-[10px] text-zinc-400 font-semibold">Searching...</span>
                            </div>
                          ) : customerOptions.length === 0 ? (
                            <p className="p-3 text-[10px] text-zinc-500 font-semibold text-center">No customers found</p>
                          ) : (
                            customerOptions.map(cust => {
                              const isAdded = customerIds.includes(cust.id);
                              return (
                                <button
                                  key={cust.id}
                                  type="button"
                                  onClick={() => {
                                    setCustomerIds(prev => 
                                      isAdded ? prev.filter(id => id !== cust.id) : [...prev, cust.id]
                                    );
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 flex justify-between items-center text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                                >
                                  <div>
                                    <p className="font-bold">{cust.name}</p>
                                    <p className="text-[9px] text-zinc-500 mt-0.5">{cust.phone} • {cust.city}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                    isAdded 
                                      ? 'bg-rose-500/10 text-rose-500' 
                                      : 'bg-emerald-500/10 text-emerald-600'
                                  }`}>
                                    {isAdded ? 'Remove' : 'Add'}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Render selected list tags */}
                      {customerIds.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">Selected Targets:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {customerIds.map(id => {
                              return (
                                <span key={id} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-800 dark:text-zinc-200 rounded-md flex items-center gap-1 font-bold">
                                  {id}
                                  <button onClick={() => setCustomerIds(prev => prev.filter(item => item !== id))} className="text-zinc-400 hover:text-rose-500"><X size={10} /></button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {errors.customers && <p className="text-[10px] text-red-500 font-semibold">{errors.customers}</p>}
                    </div>
                  )}

                  {/* 2. Region wise */}
                  {(audienceType === 'Region Wise' || audienceType === 'Franchise Wise') && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Regions Targeting *</label>
                      <div className="flex flex-wrap gap-2">
                        {mockRegions.map(reg => {
                          const isSel = regionIds.includes(reg.id);
                          return (
                            <button
                              key={reg.id}
                              type="button"
                              onClick={() => {
                                setRegionIds(prev => 
                                  isSel ? prev.filter(id => id !== reg.id) : [...prev, reg.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                isSel 
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' 
                                  : 'bg-white dark:bg-zinc-900 border-zinc-205 dark:border-zinc-800 text-zinc-755 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {reg.name}
                            </button>
                          );
                        })}
                      </div>
                      {errors.regions && <p className="text-[10px] text-red-500 font-semibold">{errors.regions}</p>}
                    </div>
                  )}

                  {/* 3. Franchise wise */}
                  {audienceType === 'Franchise Wise' && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Franchises ({filteredFranchises.length} available) *</label>
                      <div className="flex flex-wrap gap-2 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/25 max-h-32 overflow-y-auto">
                        {filteredFranchises.map(fran => {
                          const isSel = franchiseIds.includes(fran.id);
                          return (
                            <button
                              key={fran.id}
                              type="button"
                              onClick={() => {
                                setFranchiseIds(prev => 
                                  isSel ? prev.filter(id => id !== fran.id) : [...prev, fran.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                isSel 
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' 
                                  : 'bg-white dark:bg-zinc-900 border-zinc-205 dark:border-zinc-800 text-zinc-755 hover:bg-zinc-50'
                              }`}
                            >
                              {fran.name}
                            </button>
                          );
                        })}
                        {filteredFranchises.length === 0 && (
                          <p className="text-[10px] text-zinc-500 py-1 pl-1">No franchises available. Please select regions above first.</p>
                        )}
                      </div>
                      {errors.franchises && <p className="text-[10px] text-red-500 font-semibold">{errors.franchises}</p>}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* STEP 4: Scheduling */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Scheduling</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Dispatch notification immediately or schedule for future processing.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { type: 'Immediate', desc: 'Deploy payload right now' },
                      { type: 'Schedule', desc: 'Execute on a specific date & time' }
                    ].map(mode => {
                      const isSel = scheduleMode === mode.type;
                      return (
                        <label 
                          key={mode.type}
                          className={`border rounded-2xl p-4 flex flex-col cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                            isSel 
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-[var(--primary)]' 
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="scheduleMode" 
                            checked={isSel}
                            onChange={() => setScheduleMode(mode.type)}
                            className="sr-only"
                          />
                          <span className={`text-xs font-bold ${isSel ? 'text-[var(--primary)]' : 'text-zinc-900 dark:text-zinc-100'}`}>{mode.type}</span>
                          <span className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-0.5 leading-normal">{mode.desc}</span>
                        </label>
                      );
                    })}
                  </div>

                  {scheduleMode === 'Schedule' && (
                    <div className="grid grid-cols-2 gap-4 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl bg-zinc-50/20 dark:bg-zinc-900/10 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Date *</label>
                        <input 
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.scheduleDate ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-100 font-bold`}
                        />
                        {errors.scheduleDate && <p className="text-[10px] text-red-500 font-semibold">{errors.scheduleDate}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider block">Time *</label>
                        <input 
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.scheduleTime ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-100 font-bold`}
                        />
                        {errors.scheduleTime && <p className="text-[10px] text-red-500 font-semibold">{errors.scheduleTime}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Review & Status */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Review &amp; Launch</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Choose status parameters and finalize execution.</p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl p-4.5 border border-zinc-200 dark:border-zinc-805 space-y-3.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--primary)]">Configuration Review</span>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-zinc-450 block text-[10px] uppercase font-bold">Message Title</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{title || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-450 block text-[10px] uppercase font-bold">Channels Selected</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{selectedChannels.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-zinc-450 block text-[10px] uppercase font-bold">Audience Group</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{audienceType}</span>
                    </div>
                    <div>
                      <span className="text-zinc-450 block text-[10px] uppercase font-bold">Schedule Execution</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">
                        {scheduleMode === 'Immediate' ? 'Immediately on Send' : `${scheduleDate} ${scheduleTime}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Set Default Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 font-bold cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
          <div>
            {currentStep > 1 && (
              <button 
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            
            {currentStep < 5 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Next <ChevronRight size={13} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSave('Draft')}
                  disabled={loading}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button 
                  onClick={() => handleSave(scheduleMode === 'Immediate' ? 'Sent' : 'Scheduled')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    scheduleMode === 'Immediate' ? 'Send Notification' : 'Schedule Notification'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
