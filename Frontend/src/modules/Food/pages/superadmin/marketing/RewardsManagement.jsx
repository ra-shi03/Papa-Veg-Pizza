import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '@/services/api/axios';
import { uploadAPI } from '@/services/api';

export default function RewardsManagement() {
  const [config, setConfig] = useState({
    isEnabled: false,
    logoUrl: '',
    title: 'Earn Points to Unlock Free Treats!',
    subtitle1: '1 Order = 100 Points',
    subtitle2: 'Relish freebies at 600 points',
    buttonText: 'Enroll Now',
    termsText: 'By enrolling you agree to our',
    termsLinkText: 'Terms and Conditions',
    termsLink: '#'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await adminClient.get('/food/admin/rewards/config');
      if (res?.data?.data) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rewards config');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await adminClient.put('/food/admin/rewards/config', config);
      if (res?.data?.success) {
        setConfig(res.data.data);
        toast.success('Rewards configuration saved successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setConfig(prev => ({ ...prev, logoUrl: url }));
        toast.success('Logo uploaded!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Rewards Program Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configure the loyalty and rewards section displayed on the user app home page.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary)]/90 transition-colors shadow-sm disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg border-b pb-2 mb-4 dark:border-zinc-800">General</h3>
            
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div>
                <p className="font-semibold text-sm">Enable Rewards Section</p>
                <p className="text-xs text-zinc-500">Show this section on the user app</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Logo Image</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={config.logoUrl}
                  onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                  placeholder="https://..."
                />
                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg border-b pb-2 mb-4 dark:border-zinc-800">Content</h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Title</label>
              <input
                type="text"
                value={config.title}
                onChange={e => setConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Subtitle 1</label>
                <input
                  type="text"
                  value={config.subtitle1}
                  onChange={e => setConfig({ ...config, subtitle1: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Subtitle 2</label>
                <input
                  type="text"
                  value={config.subtitle2}
                  onChange={e => setConfig({ ...config, subtitle2: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Button Text</label>
              <input
                type="text"
                value={config.buttonText}
                onChange={e => setConfig({ ...config, buttonText: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg border-b pb-2 mb-4 dark:border-zinc-800">Terms & Conditions</h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Terms Text</label>
              <input
                type="text"
                value={config.termsText}
                onChange={e => setConfig({ ...config, termsText: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Terms Link Text</label>
                <input
                  type="text"
                  value={config.termsLinkText}
                  onChange={e => setConfig({ ...config, termsLinkText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">Terms URL</label>
                <input
                  type="text"
                  value={config.termsLink}
                  onChange={e => setConfig({ ...config, termsLink: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-lg border-b pb-2 mb-4 flex items-center gap-2 dark:border-zinc-800">
              <Eye className="w-5 h-5 text-zinc-500" /> Live Preview
            </h3>
            
            {/* The exact layout of the user app rewards card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 max-w-md mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <div className="flex gap-4 items-center">
                <div className="w-[100px] h-[100px] shrink-0 flex items-center justify-center p-2 bg-gray-50 rounded-lg">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Rewards Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-xs text-gray-400 text-center">No Logo</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[#3b4148] font-bold text-sm sm:text-base leading-tight mb-2">
                    {config.title || 'Title Here'}
                  </h3>
                  <div className="text-[#757d85] text-xs space-y-1">
                    <p>{config.subtitle1}</p>
                    <p>{config.subtitle2}</p>
                  </div>
                </div>
              </div>
              <button 
                className="w-full mt-4 py-2.5 rounded-lg border-2 text-sm font-bold bg-white transition-colors"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                {config.buttonText}
              </button>
              <div className="text-center text-[10px] text-[#757d85] mt-3">
                {config.termsText} <a href={config.termsLink} className="text-[#0052cc] font-medium">{config.termsLinkText}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

