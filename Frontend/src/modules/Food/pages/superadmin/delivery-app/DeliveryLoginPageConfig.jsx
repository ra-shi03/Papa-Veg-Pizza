import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  Palette,
  Type,
  FileText,
  ArrowRight,
  ArrowLeft,
  ShieldQuestion,
  ShieldCheck,
  Heart,
  LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';
import heroPizza from '@/assets/hero-pizza.png';

export default function DeliveryLoginPageConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessModal, setSaveSuccessModal] = useState(false);

  const [config, setConfig] = useState({
    companyName: 'Papa Veg Pizza',
    partnerBadgeText: 'DELIVERY PARTNER',
    loginTitle: 'PARTNER SIGN IN',
    loginSubtitle: 'Enter your mobile number to log in or register',
    phoneLabel: 'Mobile Number',
    phonePlaceholder: '00000 00000',
    buttonText: 'Continue Delivery',
    riderBadgeImageUrl: '/MapRider.png',
    cornerPlateImageUrl: '/hero-pizza.png',
    termsText: 'By continuing, you agree to',
    termsLinkText: 'Terms of Service',
    privacyLinkText: 'Privacy Policy',
    badge1Text: 'Safe & Secure',
    badge2Text: 'Earning Opportunities',
    supportButtonText: 'Support',
    backButtonText: 'Welcome',
    primaryColor: '#EE3A43',
    secondaryColor: '#FF5722',
    isActive: true
  });

  const [riderImageFile, setRiderImageFile] = useState(null);
  const [riderImagePreview, setRiderImagePreview] = useState(null);
  const [plateImageFile, setPlateImageFile] = useState(null);
  const [plateImagePreview, setPlateImagePreview] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await adminClient.get('/settings/delivery-login');
      if (data?.data) {
        setConfig(prev => ({
          ...prev,
          ...data.data,
          isActive: data.data.isActive !== false
        }));
      }
    } catch (error) {
      console.warn('Could not load current delivery login settings. Using defaults.', error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRiderImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRiderImageFile(file);
      setRiderImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePlateImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPlateImageFile(file);
      setPlateImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'uploads');
    
    try {
      const { data } = await adminClient.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data?.data?.url;
    } catch (error) {
      console.error('Failed to upload image', error);
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalRiderUrl = config.riderBadgeImageUrl;
      let finalPlateUrl = config.cornerPlateImageUrl;

      if (riderImageFile) {
        finalRiderUrl = await uploadFile(riderImageFile);
      }
      if (plateImageFile) {
        finalPlateUrl = await uploadFile(plateImageFile);
      }

      const payload = {
        ...config,
        riderBadgeImageUrl: finalRiderUrl,
        cornerPlateImageUrl: finalPlateUrl,
        isActive: Boolean(config.isActive)
      };

      await adminClient.put('/settings/delivery-login', payload);
      toast.success('Delivery Login Screen configuration updated successfully!');
      setSaveSuccessModal(true);
      setConfig(payload);

      if (riderImagePreview) URL.revokeObjectURL(riderImagePreview);
      if (plateImagePreview) URL.revokeObjectURL(plateImagePreview);
      setRiderImageFile(null);
      setRiderImagePreview(null);
      setPlateImageFile(null);
      setPlateImagePreview(null);
    } catch (error) {
      console.error('Failed to save delivery login configuration', error);
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      companyName: 'Papa Veg Pizza',
      partnerBadgeText: 'DELIVERY PARTNER',
      loginTitle: 'PARTNER SIGN IN',
      loginSubtitle: 'Enter your mobile number to log in or register',
      phoneLabel: 'Mobile Number',
      phonePlaceholder: '00000 00000',
      buttonText: 'Continue Delivery',
      riderBadgeImageUrl: '/MapRider.png',
      cornerPlateImageUrl: '/hero-pizza.png',
      termsText: 'By continuing, you agree to',
      termsLinkText: 'Terms of Service',
      privacyLinkText: 'Privacy Policy',
      badge1Text: 'Safe & Secure',
      badge2Text: 'Earning Opportunities',
      supportButtonText: 'Support',
      backButtonText: 'Welcome',
      primaryColor: '#EE3A43',
      secondaryColor: '#FF5722',
      isActive: true
    });
    setRiderImageFile(null);
    setRiderImagePreview(null);
    setPlateImageFile(null);
    setPlateImagePreview(null);
    toast.info('Form reset to default values.');
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#EE3A43]" />
      </div>
    );
  }

  const effectiveRider = riderImagePreview || config.riderBadgeImageUrl || '/MapRider.png';
  const effectivePlate = plateImagePreview || config.cornerPlateImageUrl || '/hero-pizza.png';
  const effectivePrimary = config.primaryColor || '#EE3A43';
  const effectiveSecondary = config.secondaryColor || '#FF5722';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${effectivePrimary}, ${effectiveSecondary})` }}
          >
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Delivery Login Screen
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                config.isActive 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {config.isActive ? 'Active' : 'Inactive'}
              </span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configure the screen shown at <span className="font-mono text-zinc-700 dark:text-zinc-300">/food/delivery/login</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: effectivePrimary,
              boxShadow: `0 4px 14px ${effectivePrimary}40`
            }}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Grid: Editor Left, Live Phone Mockup Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Top Banner & Branding */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Sparkles className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                1. Top Banner &amp; Header
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={config.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Partner Badge Subtitle
                </label>
                <input
                  type="text"
                  name="partnerBadgeText"
                  value={config.partnerBadgeText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Back Button Label
                </label>
                <input
                  type="text"
                  name="backButtonText"
                  value={config.backButtonText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Support Button Label
                </label>
                <input
                  type="text"
                  name="supportButtonText"
                  value={config.supportButtonText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Media Assets & Badges */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <FileText className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                2. Artwork &amp; Media Assets
              </h2>
            </div>

            {/* Rider Avatar Badge */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Center Circular Rider Avatar</span>
                  <p className="text-[11px] text-zinc-500">Avatar displayed in the floating circular badge</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-white border-2 border-zinc-200 p-1 flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={effectiveRider} alt="Rider Preview" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="riderBadgeImageUrl"
                  value={config.riderBadgeImageUrl}
                  onChange={handleChange}
                  placeholder="/MapRider.png"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <label className="cursor-pointer px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleRiderImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Corner Decorative Dish */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Bottom-Right Corner Plate Dish</span>
                  <p className="text-[11px] text-zinc-500">Decorative food platter illustration in the corner</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-white border border-zinc-200 p-1 flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={effectivePlate} alt="Plate Preview" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="cornerPlateImageUrl"
                  value={config.cornerPlateImageUrl}
                  onChange={handleChange}
                  placeholder="/hero-pizza.png"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <label className="cursor-pointer px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handlePlateImageChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Login Card Titles & Buttons */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Type className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                3. Card Headings &amp; Form Fields
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Card Main Title
                </label>
                <input
                  type="text"
                  name="loginTitle"
                  value={config.loginTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Card Subtitle Description
                </label>
                <input
                  type="text"
                  name="loginSubtitle"
                  value={config.loginSubtitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile Input Label
                  </label>
                  <input
                    type="text"
                    name="phoneLabel"
                    value={config.phoneLabel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Phone Placeholder
                  </label>
                  <input
                    type="text"
                    name="phonePlaceholder"
                    value={config.phonePlaceholder}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Submit Action Button Text
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={config.buttonText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Legal & Trust Badges */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                4. Legal Terms &amp; Trust Badges
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Terms Prefix Text
                </label>
                <input
                  type="text"
                  name="termsText"
                  value={config.termsText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Terms Link Title
                </label>
                <input
                  type="text"
                  name="termsLinkText"
                  value={config.termsLinkText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Privacy Link Title
                </label>
                <input
                  type="text"
                  name="privacyLinkText"
                  value={config.privacyLinkText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Trust Badge 1
                </label>
                <input
                  type="text"
                  name="badge1Text"
                  value={config.badge1Text}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Trust Badge 2
                </label>
                <input
                  type="text"
                  name="badge2Text"
                  value={config.badge2Text}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Brand Colors & Active Status */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Palette className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                5. Theme Colors &amp; Status
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={config.primaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={config.primaryColor}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={config.secondaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={config.secondaryColor}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Enable Custom Login Screen</span>
                <p className="text-[11px] text-zinc-500">When disabled, default system styling will be used</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={config.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup: 5 Columns Sticky Preview */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 block mb-3">
              📱 Live App Preview (Samsung / iPhone)
            </span>

            {/* Smartphone Outer Shell */}
            <div className="relative mx-auto w-[310px] sm:w-[320px] rounded-[48px] bg-zinc-950 p-3 shadow-2xl border-4 border-zinc-800">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-40" />

              {/* Screen Inner Viewport */}
              <div className="relative w-full h-[580px] bg-white rounded-[38px] overflow-hidden flex flex-col justify-between font-['Poppins',sans-serif] text-gray-900 select-none">
                {/* Top Section */}
                <div>
                  {/* Wave Header */}
                  <div
                    className="relative w-full pt-8 pb-16 px-4 overflow-hidden rounded-b-[36px]"
                    style={{
                      background: `linear-gradient(145deg, ${effectivePrimary} 0%, ${effectiveSecondary} 100%)`
                    }}
                  >
                    {/* Top Bar */}
                    <div className="relative z-10 flex items-center justify-between text-white text-[10px] font-semibold">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20">
                        <ArrowLeft className="w-3 h-3" />
                        <span>{config.backButtonText}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20">
                        <ShieldQuestion className="w-3 h-3" />
                        <span>{config.supportButtonText}</span>
                      </div>
                    </div>

                    {/* Brand Titles */}
                    <div className="text-center mt-3 text-white">
                      <p className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-90">
                        {config.companyName}
                      </p>
                      <h3 className="text-sm font-black tracking-wider uppercase mt-0.5">
                        {config.partnerBadgeText}
                      </h3>
                    </div>
                  </div>

                  {/* Floating Circular Rider Avatar */}
                  <div className="relative -mt-10 mb-2 flex justify-center z-20">
                    <div className="w-20 h-20 rounded-full bg-white p-2 shadow-lg border-2 border-white flex items-center justify-center overflow-hidden">
                      <img src={effectiveRider} alt="Rider Preview" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Floating Login Card */}
                  <div className="px-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                      <h4 className="text-sm font-extrabold text-gray-900 uppercase">
                        {config.loginTitle}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {config.loginSubtitle}
                      </p>

                      <div className="mt-3 text-left">
                        <span className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">
                          {config.phoneLabel}
                        </span>
                        <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                          <span className="text-xs font-bold pr-2 border-r border-gray-300" style={{ color: effectivePrimary }}>
                            +91
                          </span>
                          <span className="pl-2 text-xs font-mono text-gray-400">
                            {config.phonePlaceholder}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full mt-3.5 py-2.5 rounded-full text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: effectivePrimary,
                          boxShadow: `0 6px 16px -2px ${effectivePrimary}55`
                        }}
                      >
                        <span>{config.buttonText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Terms & Badges */}
                <div className="px-4 pb-12 pt-1 text-center relative z-20">
                  <p className="text-[9px] text-gray-500 font-medium leading-tight">
                    {config.termsText} {config.companyName}'s <br />
                    <span className="font-bold underline text-gray-800">{config.termsLinkText}</span> &amp;{" "}
                    <span className="font-bold underline text-gray-800">{config.privacyLinkText}</span>
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-2 text-[8px] font-bold text-gray-600 uppercase">
                    <div className="flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-full border border-gray-200/80 shadow-2xs">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                      <span>{config.badge1Text}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-full border border-gray-200/80 shadow-2xs">
                      <Heart className="w-2.5 h-2.5 shrink-0" style={{ color: effectivePrimary }} />
                      <span>{config.badge2Text}</span>
                    </div>
                  </div>
                </div>

                {/* Corner Dish */}
                <img
                  src={effectivePlate}
                  alt="Corner Pizza"
                  className="absolute -bottom-5 -right-5 w-20 h-20 object-contain pointer-events-none drop-shadow-md rotate-[-12deg] z-0 opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Modal */}
      {saveSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Settings Saved!</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                The delivery partner login screen has been updated and is live at /food/delivery/login.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSaveSuccessModal(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
              <a
                href="/food/delivery/login"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                style={{ backgroundColor: effectivePrimary }}
              >
                <span>View Live</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

