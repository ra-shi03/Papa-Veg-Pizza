import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function UpdateCompanyModal({ isOpen, onClose, initialData, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    supportEmail: '',
    supportPhone: '',
    website: '',
    cateringPhone: '',
    cateringEmail: '',
    whatsappNumber: '',
    address: '',
    gstin: '',
    faqContactText: '',
    logo: '',
    favicon: ''
  });
  const [files, setFiles] = useState({});
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        companyName: initialData.companyName || '',
        supportEmail: initialData.supportEmail || '',
        supportPhone: initialData.supportPhone || '',
        website: initialData.website || '',
        cateringPhone: initialData.cateringPhone || '',
        cateringEmail: initialData.cateringEmail || '',
        whatsappNumber: initialData.whatsappNumber || '',
        address: initialData.address || '',
        gstin: initialData.gstin || '',
        faqContactText: initialData.faqContactText || '',
        logo: initialData.logo || '',
        favicon: initialData.favicon || ''
      });
      setLogoPreview(initialData.logo || '');
      setFaviconPreview(initialData.favicon || '');
      setFiles({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size and WebP type
      if (!file.type.includes('image')) {
        setError('Please select an image file.');
        return;
      }
      
      setFiles(prev => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setFormData(prev => ({ ...prev, logo: reader.result }));
          setLogoPreview(reader.result);
        } else {
          setFormData(prev => ({ ...prev, favicon: reader.result }));
          setFaviconPreview(reader.result);
        }
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError('Company Name is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(formData, files);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Could not save the settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-all duration-350 p-0 md:p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50">Update Company Settings</h3>
            <p className="text-[10px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Edit company details, branding, logos, and support details</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-black dark:text-zinc-100 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-[11px] font-semibold text-red-600 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="updateCompanyForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g. Papa Veg Pizza"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>

              {/* Website */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Website URL
                </label>
                <input 
                  type="url" 
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>

              {/* Support Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Support Email
                </label>
                <input 
                  type="email" 
                  value={formData.supportEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, supportEmail: e.target.value }))}
                  placeholder="Support email address"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Catering / Bulk-Order Phone
                </label>
                <input
                  type="tel"
                  value={formData.cateringPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, cateringPhone: e.target.value }))}
                  placeholder="Shown on the catering and bulk-order screens"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Catering / Bulk-Order Email
                </label>
                <input
                  type="email"
                  value={formData.cateringEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, cateringEmail: e.target.value }))}
                  placeholder="Shown on the bulk-order screen"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="Number for the WhatsApp button"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value }))}
                  placeholder="15-character GSTIN"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Registered or head office address"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  FAQ Contact Text
                </label>
                <input
                  type="text"
                  value={formData.faqContactText}
                  onChange={(e) => setFormData(prev => ({ ...prev, faqContactText: e.target.value }))}
                  placeholder="Shown above the contact details on Help"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Support Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Support Phone
                </label>
                <input 
                  type="tel" 
                  value={formData.supportPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, supportPhone: e.target.value }))}
                  placeholder="Support phone number"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Company Logo (.webp recommended)
                </label>
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="text-black dark:text-zinc-100" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-lg cursor-pointer text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all">
                      <Upload size={12} />
                      <span>Upload Logo</span>
                      <input 
                        type="file" 
                        accept="image/webp,image/png,image/jpeg"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-1">Recommended size: 512x512px. Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Favicon Icon (.ico or .webp)
                </label>
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="Favicon preview" className="w-10 h-10 object-contain" />
                    ) : (
                      <ImageIcon className="text-black dark:text-zinc-100" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-lg cursor-pointer text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all">
                      <Upload size={12} />
                      <span>Upload Favicon</span>
                      <input 
                        type="file" 
                        accept="image/x-icon,image/png,image/webp"
                        onChange={(e) => handleFileChange(e, 'favicon')}
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-1">Recommended size: 64x64px. Max 500KB.</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="updateCompanyForm"
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}
