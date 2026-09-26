import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Trash2, Image as ImageIcon, Video, Loader2, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';
import apiClient from '../../../../../services/api/axios';
import { uploadAPI } from '../../../../../services/api';

export default function HomePageConfig() {
  const [deliveryMinutes, setDeliveryMinutes] = useState(30);
  const [banners, setBanners] = useState([]);
  const [deals, setDeals] = useState([]);
  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealForm, setDealForm] = useState({ id: '', title: '', description: '', badge: '', image: '', size: 'Medium' });

  
  const [activeTab, setActiveTab] = useState('deals');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDealImage, setIsUploadingDealImage] = useState(false);
  const defaultMethods = [
    { id: "delivery", label: "Delivery", icon: "moped", enabled: false },
    { id: "dinein", label: "Dine-In", icon: "restaurant", enabled: false },
    { id: "takeaway", label: "Takeaway", icon: "store", enabled: false },
    { id: "incar", label: "In-Car", icon: "directions_car", enabled: false },
    { id: "train", label: "Delivery on Train", icon: "train", enabled: false }
  ];

  const [orderMethods, setOrderMethods] = useState(defaultMethods);
  const fileInputRef = useRef(null);
  const dealImageInputRef = useRef(null);


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
        if (Array.isArray(data.banners)) {
          setBanners(data.banners);
        }
        if (Array.isArray(data.deals)) {
          setDeals(data.deals);
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

  const handleOpenDealModal = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      setDealForm(deal);
    } else {
      setEditingDeal(null);
      setDealForm({ id: `deal-${Date.now()}`, title: '', description: '', badge: '', image: '', size: 'Medium' });
    }
    setIsDealsModalOpen(true);
  };

  const handleDealImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only image and video files are supported.');
      return;
    }
    setIsUploadingDealImage(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setDealForm(prev => ({ ...prev, image: url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingDealImage(false);
      if (dealImageInputRef.current) dealImageInputRef.current.value = '';
    }
  };



  const handleSaveDeal = async () => {
    if (!dealForm.title || !dealForm.description) {
      toast.error("Title and description are required.");
      return;
    }
    
    let updatedDeals;
    if (editingDeal) {
      updatedDeals = deals.map(d => d.id === dealForm.id ? dealForm : d);
    } else {
      updatedDeals = [...deals, dealForm];
    }
    
    setDeals(updatedDeals);
    setIsDealsModalOpen(false);
    
    try {
      const payload = { deals: updatedDeals };
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
      toast.success('Deals updated successfully!');
    } catch(err) {
      toast.error('Failed to save deals');
    }
  };

  const handleDeleteDeal = async (id) => {
    if (!confirm('Delete this deal?')) return;
    const updatedDeals = deals.filter(d => d.id !== id);
    setDeals(updatedDeals);
    
    try {
      const payload = { deals: updatedDeals };
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
      toast.success('Deal deleted!');
    } catch(err) {
      toast.error('Failed to delete deal');
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
          onClick={() => setActiveTab('deals')}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'deals' ? 'border-b-2 border-primary text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
        >
          Hot Deals
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
      {/* Deals / Combos Section */}
              </div>
      )}

      {activeTab === 'deals' && (
        <div className="space-y-6">
<section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Hot Deals / Combos
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage the dynamic deal cards shown on the user home page.
            </p>
          </div>
          <button
            onClick={() => handleOpenDealModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            <Plus className="w-4 h-4" /> Add Deal
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.length === 0 ? (
            <div className="col-span-full py-8 text-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">No deals added yet.</p>
            </div>
          ) : (
            deals.map((deal) => (
              <div key={deal.id} className="relative group border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
                <div className="h-32 bg-zinc-100 dark:bg-zinc-800 relative">
                  {deal.image && (
                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                  )}
                  {deal.badge && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                      {deal.badge}
                    </span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">{deal.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 flex-1">{deal.description}</p>
                </div>
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => handleOpenDealModal(deal)} className="p-2 bg-white text-zinc-900 rounded-full hover:bg-zinc-200">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteDeal(deal.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>


              </div>
      )}



      {/* Deal Modal */}
      {isDealsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              {editingDeal ? 'Edit Deal' : 'Add Deal'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={dealForm.title}
                  onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                  placeholder="e.g. BOGO: Any Medium Pizza"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  value={dealForm.description}
                  onChange={e => setDealForm({ ...dealForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                  rows="2"
                  placeholder="e.g. Buy 1 Get 1 Free on all medium signature pizzas."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={dealForm.badge}
                    onChange={e => setDealForm({ ...dealForm, badge: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                    placeholder="e.g. Bestseller"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Size</label>
                  <input
                    type="text"
                    value={dealForm.size || ''}
                    onChange={e => setDealForm({ ...dealForm, size: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                    placeholder="e.g. Medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dealForm.image}
                      onChange={e => setDealForm({ ...dealForm, image: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                      placeholder="https://..."
                    />
                    <input
                      type="file"
                      ref={dealImageInputRef}
                      onChange={handleDealImageUpload}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => dealImageInputRef.current?.click()}
                      disabled={isUploadingDealImage}
                      className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      {isUploadingDealImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsDealsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeal}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:opacity-90"
              >
                Save Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
