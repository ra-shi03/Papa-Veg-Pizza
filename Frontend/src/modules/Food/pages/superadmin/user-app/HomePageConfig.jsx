import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Trash2, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';
import apiClient from '../../../../../services/api/axios';

export default function HomePageConfig() {
  const [deliveryMinutes, setDeliveryMinutes] = useState(30);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await adminClient.get('/settings/home-page');
      } catch {
        response = await apiClient.get('/settings/home-page');
      }

      const data = response?.data?.data;
      if (data) {
        if (typeof data.deliveryTimeMinutes === 'number') {
          setDeliveryMinutes(data.deliveryTimeMinutes);
        }
        if (Array.isArray(data.banners)) {
          setBanners(data.banners);
        }
      }
    } catch (err) {
      console.error('Failed to load home page configuration:', err);
      toast.error('Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDeliveryTime = async () => {
    const minutes = Number(deliveryMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      toast.error('Please enter a valid delivery time between 1 and 180 minutes.');
      return;
    }

    setIsSaving(true);
    const payload = {
      deliveryTimeMinutes: minutes,
      deliveryTimeLabel: 'mins'
    };

    try {
      let res;
      try {
        res = await adminClient.post('/settings/home-page', payload);
      } catch (postErr) {
        res = await adminClient.put('/settings/home-page', payload);
      }

      const updated = res?.data?.data || payload;
      
      try {
        localStorage.setItem('pvp_home_config', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('homePageConfigUpdated', { detail: updated }));
      } catch (_) {}

      toast.success(`Delivery time updated to ${minutes} mins!`);
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save delivery time');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only image and video files are supported.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await adminClient.post('/settings/home-page/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedConfig = res?.data?.data;
      const newBanners = updatedConfig?.banners || [];
      setBanners(newBanners);
      
      try {
        localStorage.setItem('pvp_home_config', JSON.stringify(updatedConfig));
        window.dispatchEvent(new CustomEvent('homePageConfigUpdated', { detail: updatedConfig }));
      } catch (_) {}

      toast.success('Banner uploaded successfully!');
    } catch (err) {
      console.error('Banner upload failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to upload banner');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBannerDelete = async (publicId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      const res = await adminClient.delete(`/settings/home-page/banner/${encodeURIComponent(publicId)}`);
      const updatedConfig = res?.data?.data;
      const newBanners = updatedConfig?.banners || [];
      setBanners(newBanners);

      try {
        localStorage.setItem('pvp_home_config', JSON.stringify(updatedConfig));
        window.dispatchEvent(new CustomEvent('homePageConfigUpdated', { detail: updatedConfig }));
      } catch (_) {}

      toast.success('Banner deleted successfully!');
    } catch (err) {
      console.error('Banner deletion failed:', err);
      toast.error('Failed to delete banner');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Delivery Time Section */}
      <section className="space-y-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Home Page Configuration
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Set the estimated delivery time (in minutes) for the user app home page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="180"
            value={deliveryMinutes}
            onChange={(e) => setDeliveryMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-24 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Mins"
            disabled={isLoading}
          />
          <button
            onClick={handleSaveDeliveryTime}
            disabled={isSaving || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>

      {/* Dynamic Banners Section */}
      <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Dynamic Banners
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Upload images/videos for the main carousel.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBannerUpload}
              accept="image/*,video/*,.mp4,.mov,.avi,.mkv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {banners.map((banner) => (
            <div
              key={banner.publicId}
              className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm"
            >
              <div className="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {banner.resourceType === 'video' ? (
                  <video
                    src={banner.url}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={banner.url}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Overlay with details and actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <div className="text-white text-[10px] mb-2 flex items-center gap-1 font-medium">
                  {banner.resourceType === 'video' ? (
                    <><Video className="w-3 h-3" /> Video</>
                  ) : (
                    <><ImageIcon className="w-3 h-3" /> Image</>
                  )}
                </div>
                <button
                  onClick={() => handleBannerDelete(banner.publicId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {banners.length === 0 && !isLoading && (
            <div className="col-span-full py-8 text-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
              <ImageIcon className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">No banners uploaded yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
