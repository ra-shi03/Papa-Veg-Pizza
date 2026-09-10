import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Upload, Calendar, Sliders, Eye, HelpCircle, MapPin, 
  AlertCircle, CheckCircle2, Loader2, Link as LinkIcon, Sparkles, LayoutGrid
} from 'lucide-react';
import { 
  apiCreateBanner, apiUpdateBanner, apiGetBannerById,
  apiGetCoupons, apiGetCampaigns, apiGetProducts, apiGetCategories,
  mockStores
} from './BannersData';
import { mockRegions, mockFranchises } from './CouponsData';

export default function CreateEditBannerModal({ bannerId, isOpen, onClose, onSaved }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [bannerType, setBannerType] = useState('Homepage Banner');
  const [redirectType, setRedirectType] = useState('External URL');
  const [redirectId, setRedirectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState(50);
  const [regionIds, setRegionIds] = useState([]);
  const [franchiseIds, setFranchiseIds] = useState([]);
  const [storeIds, setStoreIds] = useState([]);
  const [isActive, setIsActive] = useState(true);

  // Lookup option states
  const [coupons, setCoupons] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  // Form Initial Data for Dirty Checking
  const [initialData, setInitialData] = useState(null);

  const fileInputRef = useRef(null);

  // Load Lookup Data
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        apiGetCoupons(),
        apiGetCampaigns(),
        apiGetProducts(),
        apiGetCategories()
      ]).then(([cpns, camps, prods, cats]) => {
        setCoupons(cpns);
        setCampaigns(camps);
        setProducts(prods);
        setCategories(cats);
      });
    }
  }, [isOpen]);

  // Load Edit Details
  useEffect(() => {
    if (isOpen && bannerId) {
      setFetching(true);
      apiGetBannerById(bannerId)
        .then(data => {
          setTitle(data.title || '');
          setImagePreview(data.image || '');
          setBannerType(data.bannerType || 'Homepage Banner');
          setRedirectType(data.redirectType || 'External URL');
          setRedirectId(data.redirectId || '');
          setPriority(data.priority || 50);
          setIsActive(data.isActive !== undefined ? data.isActive : true);

          if (data.startDate) {
            setStartDate(new Date(data.startDate).toISOString().slice(0, 16));
          }
          if (data.endDate) {
            setEndDate(new Date(data.endDate).toISOString().slice(0, 16));
          }

          setRegionIds(data.regionIds || []);
          setFranchiseIds(data.franchiseIds || []);
          setStoreIds(data.storeIds || []);
          
          setInitialData(data);
          setFetching(false);
        })
        .catch(() => {
          setFetching(false);
          onClose();
        });
    } else {
      // Reset fields for Create Mode
      setTitle('');
      setImagePreview('');
      setBannerType('Homepage Banner');
      setRedirectType('External URL');
      setRedirectId('');
      setStartDate('');
      setEndDate('');
      setPriority(50);
      setRegionIds([]);
      setFranchiseIds([]);
      setStoreIds([]);
      setIsActive(true);
      setInitialData(null);
      setCurrentStep(1);
    }
  }, [isOpen, bannerId]);

  // Form Dirty Check
  const isDirty = useMemo(() => {
    if (!bannerId) {
      return title !== '' || imagePreview !== '' || redirectId !== '';
    }
    if (!initialData) return false;
    
    const initialStart = initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '';
    const initialEnd = initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '';

    return (
      title !== (initialData.title || '') ||
      imagePreview !== (initialData.image || '') ||
      bannerType !== (initialData.bannerType || 'Homepage Banner') ||
      redirectType !== (initialData.redirectType || 'External URL') ||
      redirectId !== (initialData.redirectId || '') ||
      priority !== (initialData.priority || 50) ||
      startDate !== initialStart ||
      endDate !== initialEnd ||
      isActive !== (initialData.isActive !== undefined ? initialData.isActive : true) ||
      JSON.stringify(regionIds) !== JSON.stringify(initialData.regionIds || []) ||
      JSON.stringify(franchiseIds) !== JSON.stringify(initialData.franchiseIds || []) ||
      JSON.stringify(storeIds) !== JSON.stringify(initialData.storeIds || [])
    );
  }, [bannerId, initialData, title, imagePreview, bannerType, redirectType, redirectId, priority, startDate, endDate, isActive, regionIds, franchiseIds, storeIds]);

  // Cascading Geography Handlers
  const handleRegionToggle = (regId) => {
    setRegionIds(prev => {
      const isChecked = prev.includes(regId);
      const updated = isChecked ? prev.filter(id => id !== regId) : [...prev, regId];
      
      // Auto clean orphaned franchises and stores
      if (isChecked) {
        const remainingFrans = mockFranchises.filter(f => f.regionId !== regId).map(f => f.id);
        setFranchiseIds(curr => curr.filter(id => remainingFrans.includes(id)));
        
        const remainingStores = mockStores.filter(s => {
          const fran = mockFranchises.find(f => f.id === s.franchiseId);
          return fran && fran.regionId !== regId;
        }).map(s => s.id);
        setStoreIds(curr => curr.filter(id => remainingStores.includes(id)));
      }
      return updated;
    });
  };

  const handleFranchiseToggle = (franId) => {
    setFranchiseIds(prev => {
      const isChecked = prev.includes(franId);
      const updated = isChecked ? prev.filter(id => id !== franId) : [...prev, franId];

      if (isChecked) {
        const remainingStores = mockStores.filter(s => s.franchiseId !== franId).map(s => s.id);
        setStoreIds(curr => curr.filter(id => remainingStores.includes(id)));
      }
      return updated;
    });
  };

  const handleStoreToggle = (storeId) => {
    setStoreIds(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  // Drag and Drop Upload Handlers
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      alert('Invalid file format. Please upload JPG, PNG, or WebP.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Step Navigations
  const handleNext = () => {
    if (currentStep === 1) {
      if (!title.trim()) return alert('Please enter banner title.');
      if (!imagePreview) return alert('Please upload a banner image.');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (redirectType === 'External URL' && !redirectId.trim()) return alert('Please enter redirect target URL.');
      if (redirectType !== 'External URL' && !redirectId) return alert('Please select a redirect destination.');
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!startDate || !endDate) return alert('Please specify both Start Date and End Date.');
      if (new Date(startDate) >= new Date(endDate)) return alert('End Date must be greater than Start Date.');
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      title,
      image: imagePreview,
      bannerType,
      redirectType,
      redirectId,
      priority,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      regionIds,
      franchiseIds,
      storeIds,
      isActive
    };

    try {
      if (bannerId) {
        await apiUpdateBanner(bannerId, payload);
      } else {
        await apiCreateBanner(payload);
      }
      setLoading(false);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setLoading(false);
      alert('Error saving banner: ' + err.message);
    }
  };

  const handleCancelAttempt = () => {
    if (isDirty) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  // Filtered dropdown collections for visibility step
  const activeFranchises = useMemo(() => {
    if (regionIds.length === 0) return mockFranchises;
    return mockFranchises.filter(f => regionIds.includes(f.regionId));
  }, [regionIds]);

  const activeStores = useMemo(() => {
    if (franchiseIds.length === 0) {
      if (regionIds.length === 0) return mockStores;
      const validFrans = mockFranchises.filter(f => regionIds.includes(f.regionId)).map(f => f.id);
      return mockStores.filter(s => validFrans.includes(s.franchiseId));
    }
    return mockStores.filter(s => franchiseIds.includes(s.franchiseId));
  }, [regionIds, franchiseIds]);

  const filteredProductsList = useMemo(() => {
    if (!productSearch) return products.slice(0, 5);
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-[1200px] w-full h-full max-h-[90vh] lg:h-[680px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-150 flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <Sparkles size={14} />
              </span>
              {bannerId ? 'Modify Marketing Banner' : 'Create Campaign Banner'}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Define visual banner assets, redirection rules, priority schedules and display zones.</p>
          </div>
          <button 
            onClick={handleCancelAttempt}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full"
          >
            <X size={18} />
          </button>
        </header>

        {fetching ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2.5">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Loading banner parameters...</span>
          </div>
        ) : (
          <>
            {/* Modal Navigation Stepper Tabs */}
            <div className="bg-zinc-50/50 dark:bg-zinc-950/20 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs font-bold select-none overflow-x-auto scrollbar-none shrink-0">
              {[
                { step: 1, label: '1. Information' },
                { step: 2, label: '2. Redirect Link' },
                { step: 3, label: '3. Schedule & Time' },
                { step: 4, label: '4. Priority Weight' },
                { step: 5, label: '5. Regional Scope' }
              ].map(item => (
                <button
                  key={item.step}
                  onClick={() => {
                    // Quick validation checks before jump
                    if (item.step > 1 && (!title.trim() || !imagePreview)) return;
                    if (item.step > 2 && redirectType === 'External URL' && !redirectId.trim()) return;
                    if (item.step > 3 && (!startDate || !endDate || new Date(startDate) >= new Date(endDate))) return;
                    setCurrentStep(item.step);
                  }}
                  className={`pb-1 border-b-2 whitespace-nowrap transition-colors ${
                    currentStep === item.step 
                      ? 'border-b-[var(--primary)] text-[var(--primary)]' 
                      : 'border-b-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Stepper Body Container */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
              
              {/* Form Config Fields (Left Side) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* STEP 1: INFO */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Banner Name / Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Weekend BOGO Bash Feasts"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150 font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Banner Display Category</label>
                      <select 
                        value={bannerType}
                        onChange={(e) => setBannerType(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150 font-semibold cursor-pointer"
                      >
                        <option value="Homepage Banner">Homepage Slider Banner</option>
                        <option value="Offer Banner">Promo Offers Banner</option>
                        <option value="Festival Banner">Festive Special Banner</option>
                        <option value="Popup Banner">App Pop-up Overlay Banner</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider block">Upload Banner Cover (WebP, PNG, JPEG)</label>
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-zinc-250 dark:border-zinc-800 hover:border-[var(--primary)]/50 rounded-2xl p-6 bg-zinc-50 dark:bg-zinc-900/30 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileSelect} 
                          className="hidden" 
                          accept="image/jpeg, image/png, image/webp"
                        />
                        <Upload size={24} className="text-zinc-400 group-hover:text-[var(--primary)] transition-colors" />
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Drag and drop file here, or click to browse</p>
                        <p className="text-[10px] text-zinc-450 mt-0.5">JPG, PNG, WebP files accepted. Max size 5MB.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: REDIRECT */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Target Redirection Category</label>
                      <select 
                        value={redirectType}
                        onChange={(e) => {
                          setRedirectType(e.target.value);
                          setRedirectId('');
                        }}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150 font-semibold cursor-pointer"
                      >
                        <option value="Product">Product Details Page</option>
                        <option value="Category">Food Category List</option>
                        <option value="Coupon">Discount Coupon Promo</option>
                        <option value="Campaign">Active Marketing Campaign</option>
                        <option value="External URL">External URL Link</option>
                      </select>
                    </div>

                    {/* Conditional input panels */}
                    {redirectType === 'External URL' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Redirect Destination URL</label>
                        <input 
                          type="url" 
                          required
                          placeholder="https://papavegpizza.com/monsoon-deals"
                          value={redirectId}
                          onChange={(e) => setRedirectId(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)]/20 outline-none text-zinc-850 dark:text-zinc-150 font-semibold"
                        />
                      </div>
                    )}

                    {redirectType === 'Product' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Search and Select Food Item</label>
                        <input 
                          type="text" 
                          placeholder="Search products by name..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full bg-zinc-55 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/50">
                          {filteredProductsList.map(p => (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => setRedirectId(p._id)}
                              className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex justify-between items-center ${
                                redirectId === p._id ? 'bg-[var(--primary)]/5 text-[var(--primary)]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350'
                              }`}
                            >
                              <span>{p.name}</span>
                              <span className="font-semibold text-zinc-400">₹{p.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {redirectType === 'Category' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Select Menu Category</label>
                        <div className="grid grid-cols-2 gap-2">
                          {categories.map(cat => (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => setRedirectId(cat._id)}
                              className={`border rounded-xl p-3 text-left font-bold text-xs flex items-center gap-2 transition-all ${
                                redirectId === cat._id 
                                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] shadow-sm' 
                                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350'
                              }`}
                            >
                              <LayoutGrid size={14} />
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {redirectType === 'Coupon' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Link Discount Coupon</label>
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50/50 max-h-48 overflow-y-auto">
                          {coupons.map(cpn => (
                            <button
                              key={cpn._id}
                              type="button"
                              onClick={() => setRedirectId(cpn.code)}
                              className={`w-full px-4 py-2.5 text-left text-xs font-bold flex justify-between items-center transition-colors ${
                                redirectId === cpn.code ? 'bg-[var(--primary)]/5 text-[var(--primary)]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350'
                              }`}
                            >
                              <span className="font-extrabold uppercase tracking-wide px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">{cpn.code}</span>
                              <span className="text-zinc-400 font-semibold">{cpn.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {redirectType === 'Campaign' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Link Active Campaign</label>
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50/50 max-h-48 overflow-y-auto">
                          {campaigns.map(camp => (
                            <button
                              key={camp._id}
                              type="button"
                              onClick={() => setRedirectId(camp._id)}
                              className={`w-full px-4 py-2.5 text-left text-xs font-bold flex justify-between items-center transition-colors ${
                                redirectId === camp._id ? 'bg-[var(--primary)]/5 text-[var(--primary)]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350'
                              }`}
                            >
                              <span>{camp.name}</span>
                              <span className="text-zinc-400 font-semibold uppercase text-[9.5px]">Link Target</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: SCHEDULE */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Start Date &amp; Time</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[var(--primary)] dark:text-zinc-100 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">End Date &amp; Time</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[var(--primary)] dark:text-zinc-100 font-bold"
                        />
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-805 p-3 rounded-xl flex gap-2">
                      <AlertCircle size={14} className="text-zinc-450 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                        Validity Validation: The display engine automatically publishes the banner on the Start Date, and takes it offline once the End Date is reached (IST timezone).
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 4: PRIORITY */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Display Priority Weight (1–100)</label>
                        <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full">{priority} Weight</span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={priority}
                        onChange={(e) => setPriority(parseInt(e.target.value))}
                        className="w-full accent-[var(--primary)] cursor-pointer py-2"
                      />
                      
                      <div className="flex justify-between text-[9px] text-zinc-400 font-bold px-1 select-none">
                        <span>Low Display Order (1)</span>
                        <span>Medium (50)</span>
                        <span>High Priority (100)</span>
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl space-y-2 text-[10.5px] font-semibold text-zinc-650 dark:text-zinc-350">
                      <div className="flex justify-between">
                        <span>Priority Level:</span>
                        <span className={`font-black ${priority >= 75 ? 'text-red-500' : priority >= 35 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                          {priority >= 75 ? '🔥 High Display Priority' : priority >= 35 ? '✨ Standard Priority' : '💤 Low Priority'}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-zinc-450 leading-normal pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                        Banners with higher priority weights are rendered first in homepage sliders. In case of overlap, the higher priority weight takes visual precedence.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 5: VISIBILITY */}
                {currentStep === 5 && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    <div className="space-y-3">
                      {/* Region Multi Select */}
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Target Regions ({regionIds.length})</span>
                        <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 max-h-24 overflow-y-auto">
                          {mockRegions.map(reg => {
                            const isChecked = regionIds.includes(reg.id);
                            return (
                              <button
                                key={reg.id}
                                type="button"
                                onClick={() => handleRegionToggle(reg.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  isChecked 
                                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                                }`}
                              >
                                {reg.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Franchise Dependent Select */}
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Target Franchises ({franchiseIds.length})</span>
                        <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 max-h-24 overflow-y-auto">
                          {activeFranchises.map(fran => {
                            const isChecked = franchiseIds.includes(fran.id);
                            return (
                              <button
                                key={fran.id}
                                type="button"
                                onClick={() => handleFranchiseToggle(fran.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  isChecked 
                                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm' 
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                                }`}
                              >
                                {fran.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Store Dependent Select */}
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Specific Outlets Coverage ({storeIds.length})</span>
                        <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 max-h-28 overflow-y-auto">
                          {activeStores.map(store => {
                            const isChecked = storeIds.includes(store.id);
                            return (
                              <button
                                key={store.id}
                                type="button"
                                onClick={() => handleStoreToggle(store.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  isChecked 
                                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm' 
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                                }`}
                              >
                                {store.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-3 select-none">
                      <div>
                        <span className="text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200 block">Immediate Activation Status</span>
                        <span className="text-[9.5px] text-zinc-450">Determine if banner is active immediately or disabled.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isActive} 
                          onChange={() => setIsActive(!isActive)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-250 dark:bg-zinc-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-[var(--primary)]/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                      </label>
                    </div>
                  </div>
                )}

              </div>

              {/* Mock Device Live Canvas Preview (Right Side) */}
              <div className="w-full lg:w-[380px] bg-zinc-50 dark:bg-zinc-950/40 p-6 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-center items-center select-none shrink-0">
                <span className="text-[9px] font-extrabold uppercase text-zinc-450 tracking-wider mb-3 block">Live Screen Context Preview</span>
                
                <div className="w-[260px] h-[400px] border-[5px] border-zinc-900 dark:border-zinc-800 rounded-[32px] bg-zinc-900 shadow-xl relative overflow-hidden flex flex-col justify-between p-3">
                  <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-zinc-900 rounded-full z-10"></div>
                  
                  {/* Mock Phone Status Bar */}
                  <div className="flex justify-between items-center text-[7px] text-white/75 px-1 pt-0.5 z-10">
                    <span>12:00</span>
                    <span>4G</span>
                  </div>

                  {/* Dynamic Banner Preview card */}
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-2 relative overflow-hidden rounded-xl border border-zinc-800/10">
                    {imagePreview ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 z-10"></div>
                        <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Cover Preview" />
                        
                        <div className="relative z-20 text-white space-y-1.5 p-2 mt-auto text-left w-full">
                          <span className="inline-block px-1.5 py-0.5 bg-[var(--primary)] text-[7px] font-black uppercase rounded shadow-sm">
                            {bannerType.replace(' Banner', '')}
                          </span>
                          <h3 className="text-sm font-black leading-tight text-white line-clamp-2">{title || 'Monsoon BOGO Blast'}</h3>
                          <p className="text-[8px] text-zinc-300 font-medium">Priority displayed: {priority} weight</p>
                          <div className="text-[7.5px] text-zinc-300 font-bold flex items-center gap-1.5 pt-1">
                            <LinkIcon size={8} className="text-[var(--primary)]" />
                            <span className="truncate">Target: {redirectType} ({redirectId || 'No target configured'})</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-zinc-550 dark:text-zinc-500 flex flex-col items-center gap-2">
                        <Upload size={20} className="stroke-[1.5]" />
                        <span className="text-[9.5px] font-bold">No cover image uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="w-16 h-1 bg-white/35 rounded-full mx-auto mb-0.5"></div>
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <footer className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between gap-3 shrink-0 select-none">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button 
                    onClick={handleBack}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={handleCancelAttempt}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>

              <div>
                {currentStep < 5 ? (
                  <button 
                    onClick={handleNext}
                    className="px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white font-bold rounded-xl text-xs hover:opacity-90 shadow-md transition-all active:scale-95 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      bannerId ? 'Modify Banner' : 'Publish Banner'
                    )}
                  </button>
                )}
              </div>
            </footer>
          </>
        )}

      </div>

      {/* Dirty Warning Alert Dialog */}
      {showExitWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center lg:pl-[280px] p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="p-3 bg-amber-100 text-amber-500 rounded-full mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 dark:text-zinc-150">Discard Unsaved Modifications?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
              You have unsaved form settings. Closing this screen will discard all modifications permanently.
            </p>
            <div className="flex gap-3 mt-6 w-full text-xs font-bold">
              <button 
                onClick={() => setShowExitWarning(false)}
                className="flex-1 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 rounded-xl transition-all"
              >
                Continue Editing
              </button>
              <button 
                onClick={() => {
                  setShowExitWarning(false);
                  onClose();
                }}
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl transition-all shadow-md"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
