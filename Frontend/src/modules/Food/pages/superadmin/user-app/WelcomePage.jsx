import React, { useState, useEffect } from 'react';
import { Camera, Video, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { adminClient } from '../../../../../services/api/axios';

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    logoUrl: '',
    heroMediaUrl: '',
    heroMediaType: 'image',
    heading: 'WELCOME TO',
    subheading: 'Papa Veg Pizza',
    description: 'Indulge in a symphony of flavors! Experience the magic of our artisanal pizzas, handcrafted with passion and the freshest ingredients.',
    primaryButtonText: 'SIGN IN TO UNLOCK OFFERS',
    secondaryButtonText: 'Continue as Guest'
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await adminClient.get('/settings/welcome');
      if (data?.data) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch config', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setConfig(prev => ({
        ...prev,
        heroMediaType: file.type.startsWith('video/') ? 'video' : 'image'
      }));
    }
  };

  const uploadFile = async (file, type = 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `welcome/${type}s`);
    
    try {
      const endpoint = type === 'video' ? '/uploads/video' : '/uploads/image';
      const { data } = await adminClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data?.data?.url;
    } catch (error) {
      console.error(`Failed to upload ${type}`, error);
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalLogoUrl = config.logoUrl;
      let finalMediaUrl = config.heroMediaUrl;

      if (logoFile) {
        finalLogoUrl = await uploadFile(logoFile, 'image');
      }
      
      if (mediaFile) {
        finalMediaUrl = await uploadFile(mediaFile, config.heroMediaType);
      }

      const payload = {
        ...config,
        logoUrl: finalLogoUrl,
        heroMediaUrl: finalMediaUrl
      };

      await adminClient.put('/settings/welcome', payload);
      alert('Welcome configuration saved successfully!');
      setConfig(payload);
      
      // Cleanup Object URLs to avoid memory leaks
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setLogoFile(null);
      setLogoPreview(null);
      setMediaFile(null);
      setMediaPreview(null);

    } catch (error) {
      alert('Failed to save configuration.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome Screen Configuration</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure the dynamic content for the user app welcome screen.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Media Settings */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Media Assets</h2>
          
          {/* Logo Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">App Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50">
                {(logoPreview || config.logoUrl) ? (
                  <img src={logoPreview || config.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  Choose Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="text-xs text-zinc-500 mt-2">Recommended: Transparent PNG, 512x512px</p>
              </div>
            </div>
          </div>

          {/* Hero Media Upload */}
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hero Media (Image or Video)</label>
            <div className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 relative group">
              {(mediaPreview || config.heroMediaUrl) ? (
                config.heroMediaType === 'video' ? (
                  <video src={mediaPreview || config.heroMediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={mediaPreview || config.heroMediaUrl} alt="Hero" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <div className="flex gap-2">
                    <ImageIcon className="w-8 h-8" />
                    <Video className="w-8 h-8" />
                  </div>
                  <span className="text-sm">No media uploaded</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-100 transition-colors">
                  Change Media
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Text Settings */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Text Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Heading</label>
              <input 
                type="text" 
                name="heading"
                value={config.heading}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subheading / Brand Name</label>
              <input 
                type="text" 
                name="subheading"
                value={config.subheading}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description Paragraph</label>
              <textarea 
                name="description"
                value={config.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Primary Button</label>
                <input 
                  type="text" 
                  name="primaryButtonText"
                  value={config.primaryButtonText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Secondary Button</label>
                <input 
                  type="text" 
                  name="secondaryButtonText"
                  value={config.secondaryButtonText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
