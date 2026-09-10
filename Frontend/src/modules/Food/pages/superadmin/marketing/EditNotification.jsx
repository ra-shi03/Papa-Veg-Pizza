import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Check, ChevronRight, AlertCircle, Info, Calendar, 
  Settings, Search, Volume2, Mail, MessageSquare, Layers, 
  Loader2, Upload, Smartphone, Bell, MessageCircle, AlertTriangle 
} from 'lucide-react';
import { 
  apiGetNotificationById,
  apiUpdateNotification, 
  apiSearchCustomers 
} from './NotificationData';
import { 
  mockRegions, 
  mockZones, 
  mockTerritories, 
  mockFranchises, 
  mockStores 
} from './CouponsData';

export default function EditNotification({ notificationId, isOpen, onClose, onUpdated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Initial fetched data to check for modifications
  const [initialData, setInitialData] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [selectedChannels, setSelectedChannels] = useState([]);
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

  // Warning State
  const [showWarning, setShowWarning] = useState(false);

  // Error States
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  // Fetch initial notification details
  useEffect(() => {
    if (isOpen && notificationId) {
      setFetching(true);
      apiGetNotificationById(notificationId)
        .then(data => {
          setInitialData(data);
          
          setTitle(data.title || '');
          setMessage(data.message || '');
          setImagePreview(data.image || '');
          
          const chans = data.type ? data.type.split(', ') : ['App Push'];
          setSelectedChannels(chans);
          
          setAudienceType(data.audienceType || 'All Customers');
          setRegionIds(data.regionIds || []);
          setFranchiseIds(data.franchiseIds || []);
          setCustomerIds(data.customerIds || []);

          if (data.status === 'Scheduled' && data.scheduleAt) {
            setScheduleMode('Schedule');
            const dt = new Date(data.scheduleAt);
            setScheduleDate(dt.toISOString().slice(0, 10));
            setScheduleTime(dt.toTimeString().slice(0, 5));
          } else {
            setScheduleMode('Immediate');
          }
          
          setStatus(data.status || 'Draft');
          setFetching(false);
        })
        .catch(err => {
          alert('Failed to load notification: ' + err.message);
          setFetching(false);
          onClose();
        });
    }
  }, [isOpen, notificationId]);

  // Is Form Dirty checker
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    
    const arraysMatch = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return false;
      const sorted1 = [...arr1].sort();
      const sorted2 = [...arr2].sort();
      return sorted1.every((val, index) => val === sorted2[index]);
    };

    const initialChans = initialData.type ? initialData.type.split(', ') : ['App Push'];
    
    // Schedule check
    let initialSchedMode = 'Immediate';
    let initialDate = '';
    let initialTime = '';
    if (initialData.status === 'Scheduled' && initialData.scheduleAt) {
      initialSchedMode = 'Schedule';
      const dt = new Date(initialData.scheduleAt);
      initialDate = dt.toISOString().slice(0, 10);
      initialTime = dt.toTimeString().slice(0, 5);
    }

    return (
      title !== (initialData.title || '') ||
      message !== (initialData.message || '') ||
      imagePreview !== (initialData.image || '') ||
      audienceType !== (initialData.audienceType || '') ||
      status !== (initialData.status || '') ||
      scheduleMode !== initialSchedMode ||
      (scheduleMode === 'Schedule' && (scheduleDate !== initialDate || scheduleTime !== initialTime)) ||
      !arraysMatch(selectedChannels, initialChans) ||
      !arraysMatch(regionIds, initialData.regionIds || []) ||
      !arraysMatch(franchiseIds, initialData.franchiseIds || []) ||
      !arraysMatch(customerIds, initialData.customerIds || [])
    );
  }, [
    initialData, title, message, imagePreview, selectedChannels, 
    audienceType, regionIds, franchiseIds, customerIds, 
    scheduleMode, scheduleDate, scheduleTime, status
  ]);

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
    if (!fetching) {
      const allowedFranIds = filteredFranchises.map(f => f.id);
      setFranchiseIds(prev => prev.filter(id => allowedFranIds.includes(id)));
    }
  }, [filteredFranchises, fetching]);

  if (!isOpen) return null;

  // Image upload simulator
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
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
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
  };
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSave = async (forceStatus = null) => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) return;

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
      scheduleAt: scheduleMode === 'Immediate' ? new Date().toISOString() : new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString(),
      status: resolvedStatus
    };

    try {
      const result = await apiUpdateNotification(notificationId, payload);
      setLoading(false);
      onUpdated && onUpdated(result);
      onClose();
    } catch (err) {
      setLoading(false);
      alert('Failed to update: ' + err.message);
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowWarning(true);
    } else {
      onClose();
    }
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
              Edit Push Notification
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Modify properties and reschedule campaign parameters</p>
          </div>
          <button 
            onClick={handleCloseAttempt}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {fetching ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-bold text-zinc-500">Loading Configuration...</span>
          </div>
        ) : (
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
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-755 text-zinc-500'
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
              
              {/* Guidance alerts */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
                <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                  Modifying sent notifications will only update historical dashboard records.
                </p>
              </div>
            </div>

            {/* Right Content Form Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950">
              
              {/* STEP 1: Message Details */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
                  
                  {/* Inputs */}
                  <div className="space-y-4">
                    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Message Formulation</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Edit alert messages and images.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Message Title *</label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. 🍕 Weekend Cheese Fest Alert!"
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.title ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 font-semibold`}
                      />
                      {errors.title && <p className="text-[10px] text-red-500 font-semibold">{errors.title}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider">Message Body *</label>
                        <span className="text-[9px] text-zinc-400 font-bold">{message.length}/250 chars</span>
                      </div>
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, 250))}
                        placeholder="Type push alert description..."
                        rows={4}
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.message ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 resize-none font-medium`}
                      />
                      {errors.message && <p className="text-[10px] text-red-500 font-semibold">{errors.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Banner Image</label>
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
                        <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-350">Upload or drop new image</p>
                      </div>
                    </div>
                  </div>

                  {/* Device Preview */}
                  <div className="flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-808 select-none">
                    <span className="text-[9px] font-extrabold uppercase text-zinc-450 tracking-wider mb-3 block">Live Device Mock Preview</span>
                    <div className="w-[280px] h-[450px] border-[6px] border-zinc-900 dark:border-zinc-800 rounded-[36px] bg-zinc-900 shadow-xl relative overflow-hidden flex flex-col justify-between p-3.5">
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-10"></div>
                      <div className="flex justify-between items-center text-[8px] text-white/70 px-1 pt-1 z-10">
                        <span>12:00</span>
                        <span>Push</span>
                      </div>
                      
                      <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-2xl p-3 border border-zinc-205/20 shadow-2xl flex flex-col gap-2 mt-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-[var(--primary)] flex items-center justify-center text-white text-[7px] font-black">PVP</span>
                          <span className="text-[8.5px] font-bold text-zinc-900 dark:text-zinc-150">Papa Veg Pizza</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">{title}</p>
                          <p className="text-[8.5px] text-zinc-550 dark:text-zinc-400 leading-relaxed font-semibold line-clamp-3">{message}</p>
                        </div>
                        {imagePreview && (
                          <div className="h-20 w-full rounded-lg overflow-hidden border border-zinc-200/20 shrink-0">
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Banner Preview" />
                          </div>
                        )}
                      </div>
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
                    <p className="text-[11px] text-zinc-500 mt-0.5">Toggle notification distribution channels.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'App Push', desc: 'In-app and browser push notifications', icon: Bell },
                      { name: 'SMS', desc: 'Gateway text messages alerts', icon: MessageSquare },
                      { name: 'Email', desc: 'Rich visual newsletter emails', icon: Mail },
                      { name: 'Multi Channel', desc: 'Deploy across all active gateways', icon: Layers }
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
                            <p className="text-xs font-bold">{chan.name}</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">{chan.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {errors.channels && <p className="text-[10px] text-red-500 font-semibold">{errors.channels}</p>}
                </div>
              )}

              {/* STEP 3: Audience */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Audience Targeting</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Modify filters defining target users.</p>
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
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 font-semibold cursor-pointer"
                      >
                        <option value="All Customers">All Customers</option>
                        <option value="Premium Customers">Premium Customers Only</option>
                        <option value="New Customers">New Customers Only</option>
                        <option value="Selected Customers">Selected Customers List (Async Search)</option>
                        <option value="Region Wise">Region Wise</option>
                        <option value="Franchise Wise">Franchise Wise</option>
                      </select>
                    </div>

                    {audienceType === 'Selected Customers' && (
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Search Customers *</label>
                        <input 
                          type="text"
                          value={customerQuery}
                          onChange={(e) => {
                            setCustomerQuery(e.target.value);
                            setShowCustDropdown(true);
                          }}
                          onFocus={() => setShowCustDropdown(true)}
                          placeholder="Type customer name to search..."
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none"
                        />
                        {showCustDropdown && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-805">
                            {customersLoading ? (
                              <p className="p-3 text-[10px] text-zinc-500 font-semibold text-center">Searching...</p>
                            ) : (
                              customerOptions.map(cust => (
                                <button
                                  key={cust.id}
                                  type="button"
                                  onClick={() => {
                                    setCustomerIds(prev => 
                                      prev.includes(cust.id) ? prev.filter(id => id !== cust.id) : [...prev, cust.id]
                                    );
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 flex justify-between items-center text-xs font-semibold"
                                >
                                  <div>
                                    <p className="font-bold">{cust.name}</p>
                                    <p className="text-[9px] text-zinc-500">{cust.phone}</p>
                                  </div>
                                  <span>{customerIds.includes(cust.id) ? 'Remove' : 'Add'}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                        {customerIds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {customerIds.map(id => (
                              <span key={id} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] rounded-md font-bold flex items-center gap-1">
                                {id}
                                <button type="button" onClick={() => setCustomerIds(prev => prev.filter(x => x !== id))}><X size={10} /></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

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
                                onClick={() => setRegionIds(prev => isSel ? prev.filter(id => id !== reg.id) : [...prev, reg.id])}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                  isSel ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-205 dark:border-zinc-800 text-zinc-755'
                                }`}
                              >
                                {reg.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {audienceType === 'Franchise Wise' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Franchises ({filteredFranchises.length}) *</label>
                        <div className="flex flex-wrap gap-2 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/25 max-h-32 overflow-y-auto">
                          {filteredFranchises.map(fran => {
                            const isSel = franchiseIds.includes(fran.id);
                            return (
                              <button
                                key={fran.id}
                                type="button"
                                onClick={() => setFranchiseIds(prev => isSel ? prev.filter(id => id !== fran.id) : [...prev, fran.id])}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                  isSel ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-205 dark:border-zinc-800 text-zinc-755 hover:bg-zinc-50'
                                }`}
                              >
                                {fran.name}
                              </button>
                            );
                          })}
                        </div>
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
                    <p className="text-[11px] text-zinc-500 mt-0.5">Determine running schedule parameters.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {['Immediate', 'Schedule'].map(mode => (
                        <label 
                          key={mode}
                          className={`border rounded-2xl p-4 flex flex-col cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                            scheduleMode === mode 
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-[var(--primary)] font-bold' 
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="scheduleMode" 
                            checked={scheduleMode === mode}
                            onChange={() => setScheduleMode(mode)}
                            className="sr-only"
                          />
                          <span className="text-xs">{mode}</span>
                        </label>
                      ))}
                    </div>

                    {scheduleMode === 'Schedule' && (
                      <div className="grid grid-cols-2 gap-4 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl bg-zinc-50/20 dark:bg-zinc-900/10 animate-in fade-in duration-200">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Date *</label>
                          <input 
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-100 font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider block">Time *</label>
                          <input 
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-100 font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Review &amp; Status</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Select creation status parameters.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Set Default Status</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none font-bold"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
          <div>
            {currentStep > 1 && (
              <button 
                onClick={handleBack}
                disabled={loading || fetching}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleCloseAttempt}
              disabled={loading || fetching}
              className="px-4 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            
            {currentStep < 5 ? (
              <button 
                onClick={handleNext}
                disabled={fetching}
                className="flex items-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Next <ChevronRight size={13} />
              </button>
            ) : (
              <button 
                onClick={() => handleSave(scheduleMode === 'Immediate' ? 'Sent' : 'Scheduled')}
                disabled={loading || fetching}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Unsaved Warning popup */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Discard Changes?</h3>
            <p className="text-xs text-zinc-550 mt-2">You have unsaved edits. Discarding will lose changes.</p>
            <div className="flex gap-3 mt-6 w-full text-xs font-bold">
              <button onClick={() => setShowWarning(false)} className="flex-1 py-2 border rounded-xl">Stay</button>
              <button onClick={() => { setShowWarning(false); onClose(); }} className="flex-1 py-2 bg-red-650 text-white rounded-xl">Discard</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
