import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { adminClient } from '../../../../../services/api/axios';

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  
  const [config, setConfig] = useState({
    posters: [],
    posterDurationSeconds: 10,
    enableSkipButton: true,
    loginHeading: 'Log in',
    loginDescription: 'Log in or Sign up to explore exclusive deals and order your favorite pizzas instantly.',
    loginImage: '',
    enableTruecaller: true
  });

  const [loginImageFile, setLoginImageFile] = useState(null);
  const [loginImagePreview, setLoginImagePreview] = useState(null);

  // Map to hold pending poster image files (keyed by their local unique ID)
  const [pendingPosterFiles, setPendingPosterFiles] = useState({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await adminClient.get('/settings/welcome');
      if (data?.data) {
        setConfig(prev => ({
          ...prev, 
          ...data.data,
          posters: data.data.posters || []
        }));
      }
    } catch (error) {
      console.error('Failed to fetch config', error);
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

  const handleLoginImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoginImageFile(file);
      setLoginImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddPoster = () => {
    setConfig(prev => ({
      ...prev,
      posters: [
        ...prev.posters,
        {
          id: `new_${Date.now()}`,
          imageUrl: '',
          order: prev.posters.length,
          isActive: true,
          startDate: '',
          endDate: '',
          deepLink: ''
        }
      ]
    }));
  };

  const handleRemovePoster = (indexToRemove) => {
    setConfig(prev => ({
      ...prev,
      posters: prev.posters.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleMovePoster = (index, direction) => {
    setConfig(prev => {
      const newPosters = [...prev.posters];
      if (direction === 'up' && index > 0) {
        [newPosters[index - 1], newPosters[index]] = [newPosters[index], newPosters[index - 1]];
      } else if (direction === 'down' && index < newPosters.length - 1) {
        [newPosters[index + 1], newPosters[index]] = [newPosters[index], newPosters[index + 1]];
      }
      
      // Fix ordering explicitly
      newPosters.forEach((p, idx) => p.order = idx);
      
      return { ...prev, posters: newPosters };
    });
  };

  const handlePosterFieldChange = (index, field, value) => {
    setConfig(prev => {
      const newPosters = [...prev.posters];
      newPosters[index] = { ...newPosters[index], [field]: value };
      return { ...prev, posters: newPosters };
    });
  };

  const handlePosterImageChange = (index, e, posterId) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingPosterFiles(prev => ({ ...prev, [posterId]: file }));
      const previewUrl = URL.createObjectURL(file);
      handlePosterFieldChange(index, 'localPreview', previewUrl);
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
      let finalLoginImageUrl = config.loginImage;
      if (loginImageFile) {
        finalLoginImageUrl = await uploadFile(loginImageFile, 'image');
      }

      // Process poster uploads
      const processedPosters = await Promise.all(
        config.posters.map(async (poster) => {
          let finalImageUrl = poster.imageUrl;
          if (pendingPosterFiles[poster.id]) {
            finalImageUrl = await uploadFile(pendingPosterFiles[poster.id], 'image');
          }
          
          return {
            id: poster.id.startsWith('new_') ? Date.now().toString() + Math.random().toString(36).substr(2, 9) : poster.id,
            imageUrl: finalImageUrl,
            order: poster.order,
            isActive: poster.isActive,
            startDate: poster.startDate ? new Date(poster.startDate) : null,
            endDate: poster.endDate ? new Date(poster.endDate) : null,
            deepLink: poster.deepLink
          };
        })
      );

      const payload = {
        ...config,
        loginImage: finalLoginImageUrl,
        posters: processedPosters
      };

      await adminClient.put('/settings/welcome', payload);
      alert('Configuration saved successfully!');
      setConfig({ ...payload, posters: processedPosters });
      
      // Cleanup Object URLs
      if (loginImagePreview) URL.revokeObjectURL(loginImagePreview);
      Object.values(config.posters).forEach(p => p.localPreview && URL.revokeObjectURL(p.localPreview));
      
      setLoginImageFile(null);
      setLoginImagePreview(null);
      setPendingPosterFiles({});
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">App Screens Configuration</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure the dynamic posters and login screen.</p>
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

      <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('welcome')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'welcome' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Welcome Posters
        </button>
        <button 
          onClick={() => setActiveTab('login')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Login Screen
        </button>
      </div>
      
      {activeTab === 'welcome' && (
      <div className="space-y-6">
        {/* Global Poster Settings */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex items-center justify-between gap-6">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Poster Duration (seconds)</label>
            <input 
              type="number" 
              name="posterDurationSeconds"
              value={config.posterDurationSeconds}
              onChange={handleChange}
              min="1"
              max="60"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none"
            />
          </div>
          <div className="flex items-center mt-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input 
                type="checkbox"
                name="enableSkipButton"
                checked={config.enableSkipButton}
                onChange={handleChange}
                className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
              />
              Enable 'Skip' Button
            </label>
          </div>
        </div>

        {/* Posters List */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Active Posters ({config.posters.length})</h2>
          <button 
            onClick={handleAddPoster}
            className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--primary)]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Poster
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {config.posters.length === 0 ? (
            <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-500">No posters added yet. Click "Add Poster" to start.</p>
            </div>
          ) : (
            config.posters.map((poster, index) => (
              <div key={poster.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex gap-6">
                
                {/* Poster Image */}
                <div className="w-40 shrink-0 space-y-3">
                  <div className="w-full aspect-[9/16] rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 relative group">
                    {(poster.localPreview || poster.imageUrl) ? (
                      <img src={poster.localPreview || poster.imageUrl} alt={`Poster ${index+1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-3 py-1.5 bg-white text-zinc-900 rounded-md text-xs font-medium hover:bg-zinc-100 transition-colors">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePosterImageChange(index, e, poster.id)} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Poster Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Poster #{index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleMovePoster(index, 'up')} disabled={index === 0} className="p-1.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:text-zinc-400 bg-zinc-100 rounded-md">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleMovePoster(index, 'down')} disabled={index === config.posters.length - 1} className="p-1.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:text-zinc-400 bg-zinc-100 rounded-md">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemovePoster(index)} className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-md ml-2 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Deep Link (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="/menu, /offers, https://..."
                        value={poster.deepLink || ''}
                        onChange={(e) => handlePosterFieldChange(index, 'deepLink', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm"
                      />
                    </div>
                    
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <input 
                          type="checkbox"
                          checked={poster.isActive}
                          onChange={(e) => handlePosterFieldChange(index, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                        />
                        Status Active
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={(() => {
                          if (!poster.startDate) return '';
                          const d = new Date(poster.startDate);
                          if (isNaN(d)) return '';
                          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        })()}
                        onChange={(e) => handlePosterFieldChange(index, 'startDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Date (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={(() => {
                          if (!poster.endDate) return '';
                          const d = new Date(poster.endDate);
                          if (isNaN(d)) return '';
                          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        })()}
                        onChange={(e) => handlePosterFieldChange(index, 'endDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {activeTab === 'login' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Media Settings */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Media Assets</h2>
          
          {/* Login Image Upload */}
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Login Cover Image</label>
            <div className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 relative group">
              {(loginImagePreview || config.loginImage) ? (
                  <img src={loginImagePreview || config.loginImage} alt="Login" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">No media uploaded</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-100 transition-colors">
                  Change Media
                  <input type="file" accept="image/*" className="hidden" onChange={handleLoginImageChange} />
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
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Login Heading</label>
              <input 
                type="text" 
                name="loginHeading"
                value={config.loginHeading}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Login Description</label>
              <textarea 
                name="loginDescription"
                value={config.loginDescription}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 mt-6 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Enable Truecaller Login</h4>
                <p className="text-xs text-zinc-500 mt-1">Allow customers to quickly log in using the Truecaller app.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="enableTruecaller"
                  checked={config.enableTruecaller !== false} 
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      )}

    </div>
  );
}
