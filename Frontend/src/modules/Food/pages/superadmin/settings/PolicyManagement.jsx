import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@food/api';
import { API_ENDPOINTS } from '@food/api/config';
import { legalHtmlToPlainText, plainTextToLegalHtml } from '@food/utils/legalContentFormat';
import { 
  Info, 
  Scale, 
  Lock, 
  RefreshCw, 
  Truck, 
  Ban, 
  ChevronRight, 
  Heart, 
  Users, 
  Shield, 
  Clock, 
  Star, 
  Award, 
  Plus, 
  X, 
  Loader2 
} from 'lucide-react';

const iconMap = {
  Heart,
  Users,
  Shield,
  Clock,
  Star,
  Award
};

const iconOptions = [
  { value: 'Heart', label: 'Heart' },
  { value: 'Users', label: 'Users' },
  { value: 'Shield', label: 'Shield' },
  { value: 'Clock', label: 'Clock' },
  { value: 'Star', label: 'Star' },
  { value: 'Award', label: 'Award' }
];

const colorOptions = [
  { value: 'text-pink-600 dark:text-pink-400', label: 'Pink', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  { value: 'text-blue-600 dark:text-blue-400', label: 'Blue', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'text-green-600 dark:text-green-400', label: 'Green', bg: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'text-orange-600 dark:text-orange-400', label: 'Orange', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'text-purple-600 dark:text-purple-400', label: 'Purple', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { value: 'text-red-600 dark:text-red-400', label: 'Red', bg: 'bg-red-100 dark:bg-red-900/30' }
];

const policiesList = [
  { id: 'about', name: 'About Us', desc: 'Company description, versioning, and core features.', icon: Info },
  { id: 'terms', name: 'Terms & Conditions', desc: 'Platform rules and legal guidelines for all roles.', icon: Scale },
  { id: 'privacy', name: 'Privacy Policy', desc: 'Data security, information collection, and privacy rights.', icon: Lock },
  { id: 'refund', name: 'Refund Policy', desc: 'Rules for order returns, reimbursement guidelines.', icon: RefreshCw },
  { id: 'shipping', name: 'Shipping Policy', desc: 'Delivery terms, dispatch times, and zone schedules.', icon: Truck },
  { id: 'cancellation', name: 'Cancellation Policy', desc: 'Order cancellation terms and fee rules.', icon: Ban },
];

export default function PolicyManagement() {
  const [selectedPolicy, setSelectedPolicy] = useState('about');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'
  const [activeRole, setActiveRole] = useState('user'); // 'user' | 'restaurant' | 'delivery'

  // About Us State
  const [aboutData, setAboutData] = useState({
    appName: '',
    version: '1.0.0',
    description: '',
    logo: '',
    features: []
  });

  // Generic Policy State
  const [policyData, setPolicyData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchPolicyContent();
  }, [selectedPolicy, activeRole]);

  const getEndpoint = () => {
    switch (selectedPolicy) {
      case 'about':
        return API_ENDPOINTS.ADMIN.ABOUT;
      case 'terms':
        const termsKey = activeRole === 'user' ? 'terms' : `terms_${activeRole}`;
        return `/food/admin/pages-social-media/${termsKey}`;
      case 'privacy':
        const privacyKey = activeRole === 'user' ? 'privacy' : `privacy_${activeRole}`;
        return `/food/admin/pages-social-media/${privacyKey}`;
      case 'refund':
        return API_ENDPOINTS.ADMIN.REFUND;
      case 'shipping':
        return API_ENDPOINTS.ADMIN.SHIPPING;
      case 'cancellation':
        return API_ENDPOINTS.ADMIN.CANCELLATION;
      default:
        return '';
    }
  };

  const fetchPolicyContent = async () => {
    setLoading(true);
    const endpoint = getEndpoint();
    if (!endpoint) return;

    try {
      const response = await api.get(endpoint, { contextModule: 'admin' });
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        if (selectedPolicy === 'about') {
          setAboutData({
            appName: data.appName || 'Papa Veg Pizza',
            version: data.version || '1.0.0',
            description: data.description || '',
            logo: data.logo || '',
            features: Array.isArray(data.features) ? data.features : []
          });
        } else {
          const content = data.content || '';
          const textContent = legalHtmlToPlainText(content);
          setPolicyData({
            title: data.title || getDefaultTitle(),
            content: textContent
          });
        }
      } else {
        resetToDefaultState();
      }
    } catch (error) {
      console.error(`Error loading ${selectedPolicy} policy:`, error);
      resetToDefaultState();
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaultState = () => {
    if (selectedPolicy === 'about') {
      setAboutData({
        appName: 'Papa Veg Pizza',
        version: '1.0.0',
        description: '',
        logo: '',
        features: []
      });
    } else {
      setPolicyData({
        title: getDefaultTitle(),
        content: ''
      });
    }
  };

  const getDefaultTitle = () => {
    switch (selectedPolicy) {
      case 'terms':
        return `Terms and Conditions - ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}`;
      case 'privacy':
        return `Privacy Policy - ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}`;
      case 'refund':
        return 'Refund Policy';
      case 'shipping':
        return 'Shipping Policy';
      case 'cancellation':
        return 'Cancellation Policy';
      default:
        return '';
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    const endpoint = getEndpoint();

    try {
      let payload;
      if (selectedPolicy === 'about') {
        payload = aboutData;
      } else {
        const htmlContent = plainTextToLegalHtml(policyData.content);
        payload = {
          title: policyData.title,
          content: htmlContent
        };
      }

      const response = await api.put(endpoint, payload, { contextModule: 'admin' });
      if (response.data.success) {
        toast.success(`${policiesList.find(p => p.id === selectedPolicy)?.name} saved successfully`);
        if (selectedPolicy === 'about') {
          const data = response.data.data;
          setAboutData({
            appName: data.appName || 'Papa Veg Pizza',
            version: data.version || '1.0.0',
            description: data.description || '',
            logo: data.logo || '',
            features: Array.isArray(data.features) ? data.features : []
          });
        } else {
          const content = response.data.data.content || '';
          const textContent = legalHtmlToPlainText(content);
          setPolicyData({
            title: response.data.data.title || getDefaultTitle(),
            content: textContent
          });
        }
      }
    } catch (error) {
      console.error(`Error saving ${selectedPolicy} policy:`, error);
      toast.error(error.response?.data?.message || 'Failed to save policy changes');
    } finally {
      setSaving(false);
    }
  };

  // About Feature Management
  const addFeature = () => {
    setAboutData(prev => ({
      ...prev,
      features: [
        ...prev.features,
        {
          icon: 'Heart',
          title: '',
          description: '',
          color: 'text-pink-600 dark:text-pink-400',
          bgColor: 'bg-pink-100 dark:bg-pink-900/30',
          order: prev.features.length
        }
      ]
    }));
  };

  const removeFeature = (index) => {
    setAboutData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index, field, value) => {
    setAboutData(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index] = { ...newFeatures[index], [field]: value };

      if (field === 'color') {
        const colorOption = colorOptions.find(opt => opt.value === value);
        if (colorOption) {
          newFeatures[index].bgColor = colorOption.bg;
        }
      }

      return { ...prev, features: newFeatures };
    });
  };

  return (
    <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <section className="mb-4">
        <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100">Policies &amp; Legal Content</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage customer terms, guidelines, and company information.</p>
      </section>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-180px)] items-start">
        
        {/* Left Side: Policies selector */}
        <aside className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-955/50">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Select Policy</span>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-240px)]">
            {policiesList.map((policy) => {
              const PolicyIcon = policy.icon;
              return (
                <button
                  key={policy.id}
                  onClick={() => {
                    setSelectedPolicy(policy.id);
                    setViewMode('edit');
                  }}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between border transition-all duration-200 group ${
                    selectedPolicy === policy.id
                      ? 'bg-red-50/50 dark:bg-red-955/10 border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 font-semibold'
                      : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                      selectedPolicy === policy.id
                        ? 'bg-red-100/70 dark:bg-red-900/30 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400'
                    }`}>
                      <PolicyIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-red-650 dark:group-hover:text-red-400 font-bold truncate transition-colors">{policy.name}</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{policy.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={`text-zinc-400 shrink-0 transition-transform ${selectedPolicy === policy.id ? 'translate-x-0.5 text-red-500' : 'group-hover:translate-x-0.5'}`} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Side: Main Editor Form */}
        <main className="lg:col-span-8 h-full flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          
          {/* Header Action Bar */}
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-955/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-650 animate-pulse"></span>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Editing: {policiesList.find(p => p.id === selectedPolicy)?.name}
              </h3>
            </div>

            {selectedPolicy !== 'about' && (
              <div className="inline-flex rounded-lg border border-zinc-250 dark:border-zinc-750 bg-white dark:bg-zinc-900 p-0.5 shadow-sm text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1 rounded transition-all ${
                    viewMode === 'edit' 
                      ? 'bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 rounded transition-all ${
                    viewMode === 'preview' 
                      ? 'bg-zinc-900 dark:bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  Preview
                </button>
              </div>
            )}
          </div>

          {/* Role selector for Terms & Privacy */}
          {(selectedPolicy === 'terms' || selectedPolicy === 'privacy') && (
            <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100/30 dark:bg-zinc-900/30 shrink-0">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Target Portal Audience</span>
              <div className="inline-flex p-0.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-750 rounded-lg text-[10px] font-bold">
                {['user', 'restaurant', 'delivery'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`px-3.5 py-1 rounded-md transition-all uppercase ${
                      activeRole === role
                        ? 'bg-red-650 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700 bg-white dark:bg-zinc-900">
            {loading ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-red-650 animate-spin" />
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-455 italic">Fetching policy parameters...</p>
              </div>
            ) : selectedPolicy === 'about' ? (
              /* About Us form */
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">App Name</label>
                    <input 
                      type="text" 
                      required
                      value={aboutData.appName}
                      onChange={(e) => setAboutData({...aboutData, appName: e.target.value})}
                      placeholder="Papa Veg Pizza"
                      className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-black dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Version</label>
                    <input 
                      type="text" 
                      required
                      value={aboutData.version}
                      onChange={(e) => setAboutData({...aboutData, version: e.target.value})}
                      placeholder="1.0.0"
                      className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-black dark:text-white"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Logo URL</label>
                    <input 
                      type="text" 
                      value={aboutData.logo}
                      onChange={(e) => setAboutData({...aboutData, logo: e.target.value})}
                      placeholder="https://example.com/logo.png"
                      className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-black dark:text-white"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Description</label>
                    <textarea 
                      rows="3"
                      value={aboutData.description}
                      onChange={(e) => setAboutData({...aboutData, description: e.target.value})}
                      placeholder="Your trusted food delivery partner..."
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-black dark:text-white resize-none"
                    />
                  </div>
                </div>

                <hr className="border-zinc-200 dark:border-zinc-800 my-4" />

                {/* Features Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Company Features</span>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="flex items-center gap-1.5 px-3 py-1 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Plus size={12} />
                      Add Feature
                    </button>
                  </div>

                  <div className="space-y-3">
                    {aboutData.features.map((feature, idx) => {
                      const IconComponent = iconMap[feature.icon] || Heart;
                      return (
                        <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-start gap-3 relative group">
                          <div className={`p-2 rounded-lg shrink-0 ${feature.bgColor || 'bg-pink-100 dark:bg-pink-900/30'}`}>
                            <IconComponent className={`h-5 w-5 ${feature.color || 'text-pink-600 dark:text-pink-400'}`} />
                          </div>
                          
                          <div className="flex-1 space-y-2.5">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider block mb-1">Icon</label>
                                <select
                                  value={feature.icon}
                                  onChange={(e) => updateFeature(idx, 'icon', e.target.value)}
                                  className="w-full h-7.5 px-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-xs outline-none"
                                >
                                  {iconOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider block mb-1">Color theme</label>
                                <select
                                  value={feature.color}
                                  onChange={(e) => updateFeature(idx, 'color', e.target.value)}
                                  className="w-full h-7.5 px-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-xs outline-none"
                                >
                                  {colorOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider block mb-1">Feature Title</label>
                              <input 
                                type="text"
                                value={feature.title}
                                onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                                placeholder="Fast Delivery"
                                className="w-full h-7.5 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider block mb-1">Feature Description</label>
                              <textarea 
                                rows="2"
                                value={feature.description}
                                onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                                placeholder="Delivering hot and fresh pizza under 30 minutes..."
                                className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-xs outline-none resize-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                    {aboutData.features.length === 0 && (
                      <p className="text-center text-[11px] font-semibold text-zinc-400 py-6 italic">No custom features added. Click "Add Feature" to create one.</p>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              /* Other Policy Editors */
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Page Title</label>
                  <input
                    type="text"
                    value={policyData.title}
                    onChange={(e) => setPolicyData({...policyData, title: e.target.value})}
                    className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-black dark:text-white"
                  />
                </div>

                {viewMode === 'edit' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Policy Content</label>
                      <span className="text-[9px] font-semibold text-zinc-450 dark:text-zinc-500 italic">Formatting: # (heading), - (bullet), **text** (bold)</span>
                    </div>
                    <textarea
                      value={policyData.content}
                      onChange={(e) => setPolicyData({...policyData, content: e.target.value})}
                      placeholder={`Enter the policy contents for ${policiesList.find(p => p.id === selectedPolicy)?.name}...`}
                      className="w-full min-h-[300px] h-[calc(100vh-380px)] p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-black dark:text-white font-mono leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Content Preview</label>
                    <div className="min-h-[300px] p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
                      <div
                        className="prose prose-zinc dark:prose-invert max-w-none text-xs leading-relaxed
                          prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:my-2
                          prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:my-2
                          prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100
                          prose-ul:text-zinc-700 dark:prose-ul:text-zinc-300 prose-ul:list-disc prose-ul:pl-4
                          prose-li:my-1"
                        dangerouslySetInnerHTML={{ __html: plainTextToLegalHtml(policyData.content) }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Save Changes bar */}
          <footer className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-955/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 italic">
              * Remember to save after updating sections
            </span>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
