import React, { useState, useEffect, useRef } from 'react';
import CampaignsList from './campaigns/CampaignsList';
import { Save, Upload, Trash2, Image as ImageIcon, Video, Loader2, Plus, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';
import apiClient from '../../../../../services/api/axios';
import { uploadAPI } from '../../../../../services/api';

export default function HomePageConfig() {
  const [deliveryMinutes, setDeliveryMinutes] = useState(30);
  const [promoText, setPromoText] = useState('LOWEST PRICES ONLY ON APP | FREE DELIVERY ABOVE ₹99');
  const [cravingHeading, setCravingHeading] = useState('What are you craving for?');
  const [banners, setBanners] = useState([]);
  const [isTrainConfigOpen, setIsTrainConfigOpen] = useState(false);
  const [adPopup, setAdPopup] = useState({
    enabled: false,
    imageUrl: '',
    link: '',
    frequencyRule: 'once_per_session',
    startDate: '',
    endDate: ''
  });

  const [menuFilters, setMenuFilters] = useState({
    vegOnly: { enabled: true, label: 'Veg Only', defaultActive: true },
    sortBy: { enabled: true, label: 'Sort by', defaultOption: 'default' }
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAdImage, setIsUploadingDealImage] = useState(false);
  const defaultMethods = [
    { id: "delivery", label: "Delivery", icon: "moped", enabled: false },
    { id: "dinein", label: "Dine-In", icon: "restaurant", enabled: false },
    { id: "takeaway", label: "Takeaway", icon: "store", enabled: false },
    { id: "incar", label: "In-Car", icon: "directions_car", enabled: false },
    { id: "train", label: "Delivery on Train", icon: "train", enabled: false }
  ];

  const [orderMethods, setOrderMethods] = useState(defaultMethods);
  
  const [trainConfig, setTrainConfig] = useState({
    bannerTitle: 'Pizza On Your Seat',
    bannerSubtitle: 'We will deliver your favourite Pizza right on your train seat while you travel.',
    formTitle: 'Enter PNR to get started',
    terms: [
      'Ordering is only allowed for stations which are catered by us and are ahead by 2 hours or more.',
      'Delivery is available only between 12:00 and 23:00 hours. The order would get cancelled if train reaches selected station outside of these operational hours.',
      'Cancellation is only permitted within 2 hours of actual arrival at station.'
    ]
  });

  const fileInputRef = useRef(null);


  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const storedMethods = localStorage.getItem("pvp_order_methods");
      if (storedMethods) {
        try {
          const parsed = JSON.parse(storedMethods);
          // Merge to ensure new options like Dine-In are added even if old localStorage exists
          const merged = defaultMethods.map(def => {
            const found = parsed.find(p => p.id === def.id);
            return found ? found : def;
          });
          setOrderMethods(merged);
        } catch(e) {}
      }

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
        if (data.promoText) {
          setPromoText(data.promoText);
        }
        if (data.cravingHeading) {
          setCravingHeading(data.cravingHeading);
        }
        if (Array.isArray(data.banners)) {
          setBanners(data.banners);
        }
        if (data.trainConfig) {
          setTrainConfig({
            bannerTitle: data.trainConfig.bannerTitle || 'Pizza On Your Seat',
            bannerSubtitle: data.trainConfig.bannerSubtitle || 'We will deliver your favourite Pizza right on your train seat while you travel.',
            formTitle: data.trainConfig.formTitle || 'Enter PNR to get started',
            terms: Array.isArray(data.trainConfig.terms) && data.trainConfig.terms.length > 0 
                    ? data.trainConfig.terms 
                    : [
                        'Ordering is only allowed for stations which are catered by us and are ahead by 2 hours or more.',
                        'Delivery is available only between 12:00 and 23:00 hours. The order would get cancelled if train reaches selected station outside of these operational hours.',
                        'Cancellation is only permitted within 2 hours of actual arrival at station.'
                      ],
            faqs: Array.isArray(data.trainConfig.faqs) ? data.trainConfig.faqs : []
          });
        }
        if (data.adPopup) {
          setAdPopup({
            enabled: data.adPopup.enabled || false,
            imageUrl: data.adPopup.imageUrl || '',
            link: data.adPopup.link || '',
            frequencyRule: data.adPopup.frequencyRule || 'once_per_session',
            startDate: data.adPopup.startDate ? new Date(data.adPopup.startDate).toISOString().slice(0, 16) : '',
            endDate: data.adPopup.endDate ? new Date(data.adPopup.endDate).toISOString().slice(0, 16) : ''
          });
        }

        if (data.menuFilters) {
          const mf = {
            vegOnly: {
              enabled: data.menuFilters.vegOnly?.enabled ?? true,
              label: data.menuFilters.vegOnly?.label || 'Veg Only',
              defaultActive: data.menuFilters.vegOnly?.defaultActive ?? true
            },
            sortBy: {
              enabled: data.menuFilters.sortBy?.enabled ?? true,
              label: data.menuFilters.sortBy?.label || 'Sort by',
              defaultOption: data.menuFilters.sortBy?.defaultOption || 'default'
            }
          };
          setMenuFilters(mf);
          localStorage.setItem('pvp_menu_filters', JSON.stringify(mf));
        } else {
          const storedFilters = localStorage.getItem('pvp_menu_filters');
          if (storedFilters) {
            try {
              setMenuFilters(JSON.parse(storedFilters));
            } catch (_) {}
          }
        }

        if (Array.isArray(data.orderMethods) && data.orderMethods.length > 0) {
           const merged = defaultMethods.map(def => {
             const found = data.orderMethods.find(p => p.id === def.id);
             return found ? found : def;
           });
           setOrderMethods(merged);
           localStorage.setItem("pvp_order_methods", JSON.stringify(merged));
        } else if (!storedMethods) {
           setOrderMethods(defaultMethods);
           localStorage.setItem("pvp_order_methods", JSON.stringify(defaultMethods));
           // Sync defaults to backend if it was empty
           adminClient.put('/settings/home-page', { orderMethods: defaultMethods }).catch(() => {});
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
      deliveryTimeLabel: 'mins',
      promoText: promoText,
      cravingHeading: cravingHeading
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

      toast.success(`Settings updated successfully!`);
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

  const handleToggleOrderMethod = (id) => {
    const updatedMethods = orderMethods.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    setOrderMethods(updatedMethods);
    
    // Save to localStorage and dispatch event for real-time user app update
    try {
      localStorage.setItem('pvp_order_methods', JSON.stringify(updatedMethods));
      window.dispatchEvent(new CustomEvent('pvp_order_methods_changed', { detail: updatedMethods }));
      toast.success('Order method updated successfully!');
      
      // Optionally sync to backend if supported by your home-page settings schema
      adminClient.put('/settings/home-page', { orderMethods: updatedMethods }).catch(e => console.warn('Failed to sync order methods to backend', e));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order method');
    }
  };

  const handleSaveTrainConfig = async () => {
    try {
      const payload = { trainConfig };
      let res;
      try {
        res = await adminClient.post('/settings/home-page', payload);
      } catch {
        res = await adminClient.put('/settings/home-page', payload);
      }
      const updated = res?.data?.data || payload;
      try {
        localStorage.setItem('pvp_home_config', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('homePageConfigUpdated', { detail: updated }));
      } catch (_) {}
      toast.success('Train delivery content updated successfully!');
    } catch(err) {
      toast.error('Failed to update train delivery content');
    }
  };

  const handleSaveAdPopup = async () => {
    setIsSaving(true);
    try {
      const payload = { adPopup };
      let res;
      try {
        res = await adminClient.post('/settings/home-page', payload);
      } catch {
        res = await adminClient.put('/settings/home-page', payload);
      }
      const updated = res?.data?.data || payload;
      try {
        localStorage.setItem('pvp_home_config', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('homePageConfigUpdated', { detail: updated }));
      } catch (_) {}
      toast.success('Ad Popup settings saved!');
    } catch(err) {
      toast.error('Failed to save Ad Popup settings');
    } finally {
      setIsSaving(false);
    }
  };

  const adPopupImageInputRef = useRef(null);
  const handleAdPopupImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported for Ad Popup.');
      return;
    }
    setIsUploadingDealImage(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setAdPopup(prev => ({ ...prev, imageUrl: url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingDealImage(false);
      if (adPopupImageInputRef.current) adPopupImageInputRef.current.value = '';
    }
  };

  const handleSaveMenuFilters = async () => {
    setIsSaving(true);
    try {
      const payload = { menuFilters };
      let res;
      try {
        res = await adminClient.post('/settings/home-page', payload);
      } catch {
        res = await adminClient.put('/settings/home-page', payload);
      }
      const updated = res?.data?.data || payload;
      try {
        localStorage.setItem('pvp_menu_filters', JSON.stringify(menuFilters));
        window.dispatchEvent(new CustomEvent('pvp_menu_filters_changed', { detail: menuFilters }));
      } catch (_) {}
      toast.success('Menu filters updated successfully!');
    } catch (err) {
      console.error('Failed to save menu filters:', err);
      toast.error('Failed to save menu filters');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">

      {/* Tabs Navigation */}
      <div className="flex space-x-6 border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
        >
          General Settings
        </button>
        
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'campaigns' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
        >
          Campaigns
        </button>

        <button
          onClick={() => setActiveTab('adpopup')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'adpopup' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
        >
          Ad Popup
        </button>
        <button
          onClick={() => setActiveTab('orderMethods')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'orderMethods' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
        >
          Order Methods
        </button>
        <button
          onClick={() => setActiveTab('menuFilters')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'menuFilters' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
        >
          Menu Filters
        </button>

      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
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

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Delivery Time:</span>
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
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Promo Text:</span>
            <input
              type="text"
              value={promoText}
              onChange={(e) => setPromoText(e.target.value.replace(/\$/g, '₹').replace(/\b[rR][sS]\b\.?\s?/g, '₹').replace(/\b[rR]upees?\b\s?/gi, '₹'))}
              className="flex-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. LOWEST PRICES ONLY ON APP | FREE DELIVERY ABOVE ₹99"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Craving Heading:</span>
            <input
              type="text"
              value={cravingHeading}
              onChange={(e) => setCravingHeading(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. What are you craving for?"
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveDeliveryTime}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
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
      )}

      {activeTab === 'orderMethods' && (
        <div className="space-y-6">
      {/* Order Methods Section */}
      <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Order Methods
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Enable or disable specific order methods in the user app. Disabled methods will be hidden.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {orderMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-sm">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{method.label}</span>
              <button
                onClick={() => handleToggleOrderMethod(method.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  method.enabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    method.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Deliver on Train Section */}
      <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div 
          className="flex items-center justify-between cursor-pointer group"
          onClick={() => setIsTrainConfigOpen(!isTrainConfigOpen)}
        >
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
              Deliver on Train Content
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage the content for the train delivery order method page.
            </p>
          </div>
          <button className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            {isTrainConfigOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {isTrainConfigOpen && (
          <div className="space-y-4 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Banner Title</label>
              <input
                type="text"
                value={trainConfig.bannerTitle}
                onChange={e => setTrainConfig({ ...trainConfig, bannerTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Banner Subtitle</label>
              <textarea
                value={trainConfig.bannerSubtitle}
                onChange={e => setTrainConfig({ ...trainConfig, bannerSubtitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                rows="2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Form Title</label>
              <input
                type="text"
                value={trainConfig.formTitle}
                onChange={e => setTrainConfig({ ...trainConfig, formTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex justify-between items-center">
                <span>Terms & Conditions (Bullet point wise)</span>
                <button
                  type="button"
                  onClick={() => setTrainConfig(prev => ({ ...prev, terms: [...(prev.terms || []), ''] }))}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Point
                </button>
              </label>
              <div className="space-y-2">
                {(trainConfig.terms || []).map((term, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="mt-2.5 text-zinc-400 text-[16px] leading-none">•</span>
                    <input
                      type="text"
                      value={term}
                      onChange={e => {
                        const newTerms = [...trainConfig.terms];
                        newTerms[index] = e.target.value;
                        setTrainConfig(prev => ({ ...prev, terms: newTerms }));
                      }}
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                      placeholder="Enter term..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newTerms = trainConfig.terms.filter((_, i) => i !== index);
                        setTrainConfig(prev => ({ ...prev, terms: newTerms }));
                      }}
                      className="mt-1.5 p-1 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-50 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!trainConfig.terms || trainConfig.terms.length === 0) && (
                  <p className="text-sm text-zinc-500 italic py-2">No terms added. Click "Add Point" to add one.</p>
                )}
              </div>
            </div>

            {/* FAQs Section */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex justify-between items-center">
                <span>FAQs / T&Cs for Disclaimer Page</span>
                <button
                  type="button"
                  onClick={() => setTrainConfig(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }))}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add FAQ
                </button>
              </label>
              <div className="space-y-4">
                {(trainConfig.faqs || []).map((faq, index) => (
                  <div key={index} className="flex gap-2 items-start bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={e => {
                          const newFaqs = [...(trainConfig.faqs || [])];
                          newFaqs[index] = { ...newFaqs[index], question: e.target.value };
                          setTrainConfig(prev => ({ ...prev, faqs: newFaqs }));
                        }}
                        className="w-full px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                        placeholder="Heading (e.g. Order Delivery)"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={e => {
                          const newFaqs = [...(trainConfig.faqs || [])];
                          newFaqs[index] = { ...newFaqs[index], answer: e.target.value };
                          setTrainConfig(prev => ({ ...prev, faqs: newFaqs }));
                        }}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                        placeholder="Details..."
                        rows="3"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newFaqs = (trainConfig.faqs || []).filter((_, i) => i !== index);
                        setTrainConfig(prev => ({ ...prev, faqs: newFaqs }));
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 rounded-md shadow-sm border border-zinc-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!trainConfig.faqs || trainConfig.faqs.length === 0) && (
                  <p className="text-sm text-zinc-500 italic py-2">No FAQs added. Click "Add FAQ" to add one.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveTrainConfig}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" /> Save Content
              </button>
            </div>
          </div>
        )}
      </section>
      
        </div>
      )}

      
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <CampaignsList />
        </div>
      )}



      {activeTab === 'adpopup' && (
        <div className="space-y-6">
          <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Ad Popup Settings</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure the promotional popup that appears when the user app home page finishes loading.
              </p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Enable Popup:</span>
                <button
                  onClick={() => setAdPopup(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    adPopup.enabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adPopup.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Image URL:</span>
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={adPopup.imageUrl}
                    onChange={e => setAdPopup(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                    placeholder="https://..."
                  />
                  <input type="file" ref={adPopupImageInputRef} onChange={handleAdPopupImageUpload} accept="image/*" className="hidden" />
                  <button onClick={() => adPopupImageInputRef.current?.click()} disabled={isUploadingAdImage} className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium flex items-center gap-1">
                    {isUploadingAdImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Deep Link:</span>
                <input
                  type="text"
                  value={adPopup.link}
                  onChange={e => setAdPopup(prev => ({ ...prev, link: e.target.value }))}
                  className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                  placeholder="/food/user/product/..."
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Frequency Rule:</span>
                <select
                  value={adPopup.frequencyRule}
                  onChange={e => setAdPopup(prev => ({ ...prev, frequencyRule: e.target.value }))}
                  className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <option value="once_per_session">Once per session</option>
                  <option value="once_per_day">Once per day</option>
                  <option value="every_launch">Every launch</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-32">Start Date:</span>
                  <input
                    type="datetime-local"
                    value={adPopup.startDate}
                    onChange={e => setAdPopup(prev => ({ ...prev, startDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-24">End Date:</span>
                  <input
                    type="datetime-local"
                    value={adPopup.endDate}
                    onChange={e => setAdPopup(prev => ({ ...prev, endDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveAdPopup}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" /> Save Popup Settings
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'menuFilters' && (
        <div className="space-y-6">
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Menu Header Filters & Sorting</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure the dynamic filter pill buttons (Veg Only and Sort By) displayed on the user menu screen (<code className="text-primary font-mono text-[11px]">/user/menu</code>).
              </p>
            </div>

            {/* Veg Only Filter Configuration */}
            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border border-green-600 p-[1.5px] rounded-[3px] flex items-center justify-center bg-transparent">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 block" />
                    </span>
                    Veg Only Filter Button
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Controls whether users see the "Veg Only" toggle pill on the menu screen.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuFilters.vegOnly?.enabled ?? true}
                    onChange={(e) =>
                      setMenuFilters(prev => ({
                        ...prev,
                        vegOnly: { ...prev.vegOnly, enabled: e.target.checked }
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Button Display Label
                  </label>
                  <input
                    type="text"
                    value={menuFilters.vegOnly?.label || 'Veg Only'}
                    onChange={(e) =>
                      setMenuFilters(prev => ({
                        ...prev,
                        vegOnly: { ...prev.vegOnly, label: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-750"
                    placeholder="e.g. Veg Only"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={menuFilters.vegOnly?.defaultActive ?? true}
                      onChange={(e) =>
                        setMenuFilters(prev => ({
                          ...prev,
                          vegOnly: { ...prev.vegOnly, defaultActive: e.target.checked }
                        }))
                      }
                      className="w-4 h-4 rounded text-primary focus:ring-primary dark:bg-zinc-800"
                    />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Default Active by Default (Checked on page load)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sort By Filter Configuration */}
            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono">↕</span>
                    Sort By Button & Dropdown
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Controls the sort dropdown button (Price: Low to High, Price: High to Low, Rating, Recommended).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuFilters.sortBy?.enabled ?? true}
                    onChange={(e) =>
                      setMenuFilters(prev => ({
                        ...prev,
                        sortBy: { ...prev.sortBy, enabled: e.target.checked }
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Button Display Label
                  </label>
                  <input
                    type="text"
                    value={menuFilters.sortBy?.label || 'Sort by'}
                    onChange={(e) =>
                      setMenuFilters(prev => ({
                        ...prev,
                        sortBy: { ...prev.sortBy, label: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-750"
                    placeholder="e.g. Sort by"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Default Sort Ordering
                  </label>
                  <select
                    value={menuFilters.sortBy?.defaultOption || 'default'}
                    onChange={(e) =>
                      setMenuFilters(prev => ({
                        ...prev,
                        sortBy: { ...prev.sortBy, defaultOption: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-750"
                  >
                    <option value="default">Recommended (Default)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Rating: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveMenuFilters}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Menu Filter Settings'}
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
