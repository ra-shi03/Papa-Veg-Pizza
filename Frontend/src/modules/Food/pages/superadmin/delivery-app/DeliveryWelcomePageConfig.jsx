import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Smartphone, 
  Eye, 
  RefreshCw,
  Palette,
  Type,
  FileText,
  ArrowRight,
  Bike
} from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';
import logoNew from '@/assets/logo1.png';
import heroPizza from '@/assets/hero-pizza.png';

export default function DeliveryWelcomePageConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessModal, setSaveSuccessModal] = useState(false);

  const [config, setConfig] = useState({
    companyName: 'Papa Veg Pizza',
    partnerBadgeText: 'DELIVERY PARTNER',
    logoUrl: '/logo1.png',
    titlePrimary: 'WELCOME TO',
    titleHighlight: 'FOOD DELIVERY',
    subtitle: 'Deliver delicious meals, earn great incentives, and enjoy flexible working hours.',
    heroMediaUrl: '/delivery_welcome_rider.png',
    plateMediaUrl: '/hero-pizza.png',
    buttonText: 'Get Started',
    loginLinkText: 'Already a partner? Sign In',
    primaryColor: '#EE3A43',
    secondaryColor: '#FF5722',
    isActive: true
  });

  const [logoImageFile, setLogoImageFile] = useState(null);
  const [logoImagePreview, setLogoImagePreview] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [plateImageFile, setPlateImageFile] = useState(null);
  const [plateImagePreview, setPlateImagePreview] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await adminClient.get('/settings/delivery-welcome');
      if (data?.data) {
        setConfig(prev => ({
          ...prev,
          ...data.data,
          companyName: data.data.companyName || prev.companyName,
          titlePrimary: data.data.titlePrimary || prev.titlePrimary,
          titleHighlight: data.data.titleHighlight || prev.titleHighlight,
          subtitle: data.data.subtitle || prev.subtitle,
          heroMediaUrl: data.data.heroMediaUrl || prev.heroMediaUrl,
          plateMediaUrl: data.data.plateMediaUrl || prev.plateMediaUrl,
          buttonText: data.data.buttonText || prev.buttonText,
          primaryColor: data.data.primaryColor || prev.primaryColor,
          secondaryColor: data.data.secondaryColor || prev.secondaryColor,
          isActive: data.data.isActive !== false
        }));
      }
    } catch (error) {
      console.error('Failed to fetch delivery welcome config', error);
      toast.error('Could not load current delivery welcome settings. Using defaults.');
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

  const handleLogoImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImageFile(file);
      setLogoImagePreview(URL.createObjectURL(file));
    }
  };

  const handleHeroImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImageFile(file);
      setHeroImagePreview(URL.createObjectURL(file));
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
      let finalLogoUrl = config.logoUrl;
      let finalHeroUrl = config.heroMediaUrl;
      let finalPlateUrl = config.plateMediaUrl;

      if (logoImageFile) {
        finalLogoUrl = await uploadFile(logoImageFile);
      }
      if (heroImageFile) {
        finalHeroUrl = await uploadFile(heroImageFile);
      }
      if (plateImageFile) {
        finalPlateUrl = await uploadFile(plateImageFile);
      }

      const payload = {
        ...config,
        logoUrl: finalLogoUrl,
        heroMediaUrl: finalHeroUrl,
        plateMediaUrl: finalPlateUrl,
        isActive: Boolean(config.isActive)
      };

      await adminClient.put('/settings/delivery-welcome', payload);
      toast.success('Delivery Welcome Screen updated successfully!');
      setSaveSuccessModal(true);
      setConfig(payload);

      if (logoImagePreview) URL.revokeObjectURL(logoImagePreview);
      if (heroImagePreview) URL.revokeObjectURL(heroImagePreview);
      if (plateImagePreview) URL.revokeObjectURL(plateImagePreview);
      setLogoImageFile(null);
      setLogoImagePreview(null);
      setHeroImageFile(null);
      setHeroImagePreview(null);
      setPlateImageFile(null);
      setPlateImagePreview(null);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to save delivery welcome configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      companyName: 'Papa Veg Pizza',
      partnerBadgeText: 'DELIVERY PARTNER',
      logoUrl: '/logo1.png',
      titlePrimary: 'WELCOME TO',
      titleHighlight: 'FOOD DELIVERY',
      subtitle: 'Deliver delicious meals, earn great incentives, and enjoy flexible working hours.',
      heroMediaUrl: '/delivery_welcome_rider.png',
      plateMediaUrl: '/hero-pizza.png',
      buttonText: 'Get Started',
      loginLinkText: 'Already a partner? Sign In',
      primaryColor: '#EE3A43',
      secondaryColor: '#FF5722',
      isActive: true
    });
    setLogoImageFile(null);
    setLogoImagePreview(null);
    setHeroImageFile(null);
    setHeroImagePreview(null);
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

  const effectiveLogo = logoImagePreview || config.logoUrl || '/logo1.png';
  const effectiveHero = heroImagePreview || config.heroMediaUrl || '/delivery_welcome_rider.png';
  const effectivePlate = plateImagePreview || config.plateMediaUrl || '/hero-pizza.png';
  const effectivePrimary = config.primaryColor || '#EE3A43';
  const effectiveSecondary = config.secondaryColor || '#FF5722';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${effectivePrimary}, ${effectiveSecondary})` }}
          >
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Delivery Welcome Screen
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                config.isActive 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {config.isActive ? 'Active' : 'Inactive'}
              </span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configure the screen shown at <span className="font-mono text-zinc-700 dark:text-zinc-300">/food/delivery/welcome</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
          
          {/* Section 1: Header Badge Logo */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Sparkles className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                1. Header Badge Logo
              </h2>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Badge Logo Image</span>
                  <p className="text-[11px] text-zinc-500">Displayed in the center circular badge of the top curve</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-white border-2 border-zinc-200 p-1.5 flex items-center justify-center overflow-hidden shadow-sm">
                  <img 
                    src={effectiveLogo} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.src = logoNew; }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="logoUrl"
                  value={config.logoUrl}
                  onChange={handleChange}
                  placeholder="/logo1.png"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <label className="cursor-pointer px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleLogoImageChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Hero Titles & Copy */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Type className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                2. Hero Titles & Messaging
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Title (Top Line)
                </label>
                <input
                  type="text"
                  name="titlePrimary"
                  value={config.titlePrimary}
                  onChange={handleChange}
                  placeholder="WELCOME TO"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Highlight Title (Colored Line)
                </label>
                <input
                  type="text"
                  name="titleHighlight"
                  value={config.titleHighlight}
                  onChange={handleChange}
                  placeholder="FOOD DELIVERY"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Subtitle Description
              </label>
              <textarea
                name="subtitle"
                rows={3}
                value={config.subtitle}
                onChange={handleChange}
                placeholder="Deliver delicious meals, earn great incentives, and enjoy flexible working hours."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 3: Hero Illustration & Plate Image */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <ImageIcon className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                3. Artwork & Media Assets
              </h2>
            </div>

            {/* Scooter Rider Image */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Center Hero Rider Image</span>
                  <p className="text-[11px] text-zinc-500">Currently using the red scooter illustration</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-white border border-zinc-200 p-1 flex items-center justify-center overflow-hidden">
                  <img src={effectiveHero} alt="Preview" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="heroMediaUrl"
                  value={config.heroMediaUrl}
                  onChange={handleChange}
                  placeholder="/delivery_welcome_rider.png"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <label className="cursor-pointer px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleHeroImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Bottom Left Food/Pizza Plate */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Bottom-Left Plate Image</span>
                  <p className="text-[11px] text-zinc-500">Artisanal pizza dish accent</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-white border border-zinc-200 p-1 flex items-center justify-center overflow-hidden">
                  <img src={effectivePlate} alt="Preview" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="plateMediaUrl"
                  value={config.plateMediaUrl}
                  onChange={handleChange}
                  placeholder="/hero-pizza.png"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <label className="cursor-pointer px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handlePlateImageChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Button, Actions & Colors */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <Palette className="w-4 h-4 text-primary" style={{ color: effectivePrimary }} />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                4. CTA Buttons & Theme Colors
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={config.buttonText}
                  onChange={handleChange}
                  placeholder="Get Started"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Login Sub-link Text
                </label>
                <input
                  type="text"
                  name="loginLinkText"
                  value={config.loginLinkText}
                  onChange={handleChange}
                  placeholder="Already a partner? Sign In"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={config.primaryColor}
                    onChange={handleChange}
                    className="w-9 h-9 rounded-lg border border-zinc-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={config.primaryColor}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Secondary Gradient Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={config.secondaryColor}
                    onChange={handleChange}
                    className="w-9 h-9 rounded-lg border border-zinc-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={config.secondaryColor}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Enable Welcome Screen</span>
                <p className="text-[11px] text-zinc-500">When disabled, riders are directed straight to login</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={config.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EE3A43]"></div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: 5 Columns - Interactive Smartphone Live Preview */}
        <div className="lg:col-span-5 sticky top-20 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            Live App Preview (Samsung / iPhone)
          </div>

          {/* Smartphone Frame */}
          <div className="w-[310px] sm:w-[330px] h-[650px] bg-zinc-950 rounded-[48px] p-3 shadow-2xl border-4 border-zinc-800 relative flex flex-col">
            {/* Phone Notch/Speaker */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-zinc-950/80 mr-2" />
              <div className="w-8 h-1 rounded-full bg-zinc-800" />
            </div>

            {/* Screen Contents: Live Render of Delivery Welcome Page */}
            <div className="w-full h-full bg-white rounded-[38px] overflow-hidden flex flex-col justify-between relative font-['Poppins',sans-serif] select-none">
              
              {/* Top Curved Wave Header matching Image 1 */}
              <div className="relative w-full overflow-visible">
                <svg
                  viewBox="0 0 375 180"
                  fill="none"
                  preserveAspectRatio="none"
                  className="w-full h-[150px] block drop-shadow-sm"
                >
                  <defs>
                    <linearGradient id="previewWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={effectivePrimary} />
                      <stop offset="100%" stopColor={effectiveSecondary} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,0 L 375,0 L 375,120 Q 187.5,240 0,120 Z"
                    fill="url(#previewWaveGrad)"
                  />
                </svg>

                {/* Soft ambient blurs */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15 blur-md pointer-events-none" />

                {/* Circular Badge Centered Exactly on Curve Apex */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-20">
                  <div 
                    className="w-18 h-18 rounded-full bg-white flex items-center justify-center p-2.5 border-[3px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] ring-3 ring-white"
                    style={{ borderColor: effectivePrimary }}
                  >
                    <img 
                      src={effectiveLogo} 
                      alt="Brand Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.src = logoNew; }}
                    />
                  </div>
                </div>
              </div>

              {/* Center Hero: Scooter Rider & Text */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 pt-14 pb-2 relative z-10 text-center">
                <div className="relative flex items-center justify-center mb-3">
                  <div 
                    className="w-36 h-36 rounded-full absolute pointer-events-none opacity-10 blur-md"
                    style={{ backgroundColor: effectivePrimary }}
                  />
                  <img 
                    src={effectiveHero} 
                    alt="Delivery Partner Rider" 
                    className="w-36 h-36 object-contain relative z-10 drop-shadow-md"
                    onError={(e) => { e.currentTarget.src = '/delivery_welcome_rider.png'; }}
                  />
                </div>

                <h1 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-snug">
                  {config.titlePrimary || 'WELCOME TO'} <br />
                  <span style={{ color: effectivePrimary }}>
                    {config.titleHighlight || 'FOOD DELIVERY'}
                  </span>
                </h1>

                <p className="text-[10px] text-gray-500 mt-1.5 max-w-[220px] mx-auto font-medium leading-relaxed">
                  {config.subtitle}
                </p>
              </div>

              {/* Bottom Section: Pizza Dish & CTA Pill Button */}
              <div className="relative w-full pb-6 pt-1 px-4 flex items-end justify-between min-h-[90px]">
                {/* Decorative Pizza Plate */}
                <img 
                  src={effectivePlate} 
                  alt="Delicious Pizza"
                  className="absolute -bottom-5 -left-5 w-24 h-24 object-contain pointer-events-none drop-shadow-md rotate-[12deg] z-10" 
                  onError={(e) => { e.currentTarget.src = heroPizza; }}
                />

                <div className="w-16 pointer-events-none" />

                <div className="relative z-20 flex flex-col items-end">
                  <div 
                    className="px-5 py-2.5 rounded-full font-bold text-xs text-white shadow-lg flex items-center gap-1.5"
                    style={{
                      backgroundColor: effectivePrimary,
                      boxShadow: `0 6px 18px ${effectivePrimary}45`
                    }}
                  >
                    <span>{config.buttonText || 'Get Started'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>

                  <span className="text-[9px] font-semibold text-gray-500 mt-1.5 mr-1">
                    Already a partner? <span className="underline font-bold" style={{ color: effectivePrimary }}>Sign In</span>
                  </span>
                </div>
              </div>

              {/* Virtual Home Bar */}
              <div className="w-24 h-1 bg-zinc-300 rounded-full mx-auto mb-1.5" />
            </div>
          </div>
        </div>

      </div>

      {/* Save Success Modal */}
      {saveSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full text-center shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Settings Saved!</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              The delivery partner welcome screen has been updated and is live at /food/delivery/welcome.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setSaveSuccessModal(false)}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200"
              >
                Close
              </button>
              <a
                href="/food/delivery/welcome"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
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

