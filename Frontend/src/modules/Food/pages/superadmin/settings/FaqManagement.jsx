import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, GripVertical, Check, X, HelpCircle, Loader2, Phone, Mail, Clock, PhoneCall } from 'lucide-react';
import api, { faqAPI } from '@/services/api';
import { toast } from 'sonner';

const DEFAULT_CATEGORIES = [
  'All Categories',
  'Ordering',
  'Payments',
  'Delivery',
  'Account & Profile',
  'Refunds & Returns',
  'General'
];

const DEFAULT_SUPPORT_SETTINGS = {
  title: 'Customer Support',
  description: 'Have an issue with your order or questions about our menu? Get in touch directly:',
  phone: '+91 9300990940',
  email: 'papafoodcorporation@gmail.com',
  hours: 'Support Hours: 10:00 AM – 11:30 PM Everyday'
};

export default function FaqManagement() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customer Support card state
  const [supportData, setSupportData] = useState(DEFAULT_SUPPORT_SETTINGS);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportFormData, setSupportFormData] = useState(DEFAULT_SUPPORT_SETTINGS);
  const [savingSupport, setSavingSupport] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Ordering',
    order: 1,
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFaqs();
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const res = await api.get('/food/admin/pages-social-media/support', { contextModule: 'admin' });
      const data = res?.data?.data || res?.data;
      if (data) {
        const phone = data.contactInfo?.phone || data.phone || DEFAULT_SUPPORT_SETTINGS.phone;
        const email = data.contactInfo?.email || data.email || DEFAULT_SUPPORT_SETTINGS.email;
        const hours = data.contactInfo?.hours || data.hours || DEFAULT_SUPPORT_SETTINGS.hours;
        const title = data.title || DEFAULT_SUPPORT_SETTINGS.title;
        const description = data.description || DEFAULT_SUPPORT_SETTINGS.description;
        const mapped = { title, description, phone, email, hours };
        setSupportData(mapped);
        setSupportFormData(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch support data:', err);
    }
  };

  const handleSaveSupport = async (e) => {
    e.preventDefault();
    if (!supportFormData.phone.trim()) {
      toast.error('Please enter a support phone number');
      return;
    }
    if (!supportFormData.email.trim()) {
      toast.error('Please enter a support email');
      return;
    }
    setSavingSupport(true);
    try {
      const payload = {
        title: supportFormData.title.trim() || DEFAULT_SUPPORT_SETTINGS.title,
        description: supportFormData.description.trim() || DEFAULT_SUPPORT_SETTINGS.description,
        contactInfo: {
          phone: supportFormData.phone.trim(),
          email: supportFormData.email.trim(),
          hours: supportFormData.hours.trim() || DEFAULT_SUPPORT_SETTINGS.hours
        },
        phone: supportFormData.phone.trim(),
        email: supportFormData.email.trim(),
        hours: supportFormData.hours.trim() || DEFAULT_SUPPORT_SETTINGS.hours
      };
      const res = await api.put('/food/admin/pages-social-media/support', payload, { contextModule: 'admin' });
      if (res?.data?.success || res?.status === 200) {
        setSupportData({ ...supportFormData });
        toast.success('Customer Support details updated successfully');
        setSupportModalOpen(false);
      } else {
        toast.error(res?.data?.message || 'Failed to update support details');
      }
    } catch (err) {
      console.error('Failed to update support details:', err);
      toast.error(err?.response?.data?.message || 'Failed to update support details');
    } finally {
      setSavingSupport(false);
    }
  };

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await faqAPI.getAdminFaqs();
      const list = res?.data?.data || [];
      setFaqs(list);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormData({
      title: '',
      content: '',
      category: activeTab !== 'All Categories' ? activeTab : 'Ordering',
      order: faqs.length + 1,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      title: faq.title || '',
      content: faq.content || '',
      category: faq.category || 'General',
      order: faq.order || 1,
      isActive: faq.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (faq) => {
    const id = faq._id || faq.id;
    try {
      const res = await faqAPI.toggleFaq(id);
      const updated = res?.data?.data;
      setFaqs(prev => prev.map(f => (f._id === id || f.id === id) ? { ...f, isActive: updated?.isActive ?? !f.isActive } : f));
      toast.success(updated?.isActive ? 'FAQ activated' : 'FAQ deactivated');
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update FAQ status');
    }
  };

  const handleDelete = async (faq) => {
    const id = faq._id || faq.id;
    if (!window.confirm(`Are you sure you want to delete "${faq.title}"?`)) return;
    try {
      await faqAPI.deleteFaq(id);
      setFaqs(prev => prev.filter(f => (f._id !== id && f.id !== id)));
      toast.success('FAQ deleted successfully');
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      toast.error('Failed to delete FAQ');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a question/title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter an answer/content');
      return;
    }

    setSubmitting(true);
    try {
      if (editingFaq) {
        const id = editingFaq._id || editingFaq.id;
        const res = await faqAPI.updateFaq(id, formData);
        const updated = res?.data?.data;
        setFaqs(prev => prev.map(f => (f._id === id || f.id === id) ? (updated || { ...f, ...formData }) : f));
        toast.success('FAQ updated successfully');
      } else {
        const res = await faqAPI.createFaq(formData);
        const created = res?.data?.data;
        if (created) {
          setFaqs(prev => [created, ...prev]);
        } else {
          await fetchFaqs();
        }
        toast.success('FAQ created successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      toast.error(err?.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setSubmitting(false);
    }
  };

  // Derive all category tabs dynamically from existing categories + presets
  const categoriesInFaqs = Array.from(new Set(faqs.map(f => f.category).filter(Boolean)));
  const allTabs = Array.from(new Set([...DEFAULT_CATEGORIES, ...categoriesInFaqs]));

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeTab === 'All Categories' || faq.category === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (faq.title && faq.title.toLowerCase().includes(q)) || 
      (faq.content && faq.content.toLowerCase().includes(q)) ||
      (faq.category && faq.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#E53935]" />
            FAQ Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Create, organize and manage dynamic Help Center FAQs shown to users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              setSupportFormData({ ...supportData });
              setSupportModalOpen(true);
            }}
            className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <PhoneCall size={14} className="text-[#E53935]" />
            <span>Support Contacts</span>
          </button>
          <button 
            type="button"
            onClick={handleOpenAddModal}
            className="bg-[#E53935] hover:bg-[#d92d36] text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-red-500/20 cursor-pointer border-0"
          >
            <Plus size={16} />
            <span>Add FAQ</span>
          </button>
        </div>
      </section>

      {/* Customer Support Card Live Overview (Editable) */}
      <section className="mb-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-2xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#E53935] flex items-center justify-center shrink-0">
              <PhoneCall size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white m-0">
                  {supportData.title || "Customer Support"}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  Live on User App
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 m-0">
                {supportData.description || "Have an issue with your order or questions about our menu? Get in touch directly:"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSupportFormData({ ...supportData });
              setSupportModalOpen(true);
            }}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-red-50 dark:bg-red-950/40 text-[#E53935] hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200/60 dark:border-red-900/50"
          >
            <Edit2 size={13} />
            Edit Support Info
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3.5">
          {/* Phone Support */}
          <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center shrink-0">
              <Phone size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider m-0">Phone Support</p>
              <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 m-0 truncate">
                {supportData.phone}
              </p>
            </div>
          </div>

          {/* Email Support */}
          <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
              <Mail size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider m-0">Email Support</p>
              <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 m-0 truncate">
                {supportData.email}
              </p>
            </div>
          </div>

          {/* Operational Hours */}
          <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider m-0">Operational Hours</p>
              <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 m-0 truncate">
                {supportData.hours}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          placeholder="Search FAQs by question, answer or category..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-red-500 text-zinc-800 dark:text-zinc-200"
        />
      </div>

      {/* Category Tabs */}
      <section className="mb-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {allTabs.map((tab) => {
          const count = tab === 'All Categories' ? faqs.length : faqs.filter(f => f.category === tab).length;
          return (
            <button 
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer border-0 ${
                activeTab === tab 
                  ? 'bg-red-50 dark:bg-red-950/40 text-[#E53935] font-bold border-b-2 border-[#E53935]' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 bg-transparent'
              }`}
            >
              {tab} <span className="opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </section>

      {/* FAQ List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-[#E53935] animate-spin" />
          <p className="text-xs text-zinc-400">Loading FAQs...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">No FAQs found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            {searchQuery ? 'Try matching different keywords or category' : 'Start by adding your first FAQ question.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#E53935] text-white rounded-xl text-xs font-bold cursor-pointer border-0"
          >
            Add New FAQ
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-8">
          {filteredFaqs.map((faq) => {
            const id = faq._id || faq.id;
            return (
              <div 
                key={id} 
                className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 transition-all shadow-2xs hover:shadow-xs ${
                  faq.isActive === false ? 'opacity-65 bg-zinc-50 dark:bg-zinc-900/60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-[#E53935] dark:bg-red-950/60 dark:text-red-300">
                        {faq.category || 'General'}
                      </span>
                      {typeof faq.order === 'number' && (
                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                          Order #{faq.order}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${faq.isActive !== false ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'}`}>
                        {faq.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <h3 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug">
                      {faq.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed m-0">
                      {faq.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {/* Toggle Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(faq)}
                      title={faq.isActive !== false ? 'Deactivate FAQ' : 'Activate FAQ'}
                      className={`w-10 h-5.5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer border-0 ${
                        faq.isActive !== false ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform ${
                        faq.isActive !== false ? 'translate-x-4.5' : 'translate-x-0'
                      }`} />
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(faq)}
                      className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
                      aria-label="Edit FAQ"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(faq)}
                      className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
                      aria-label="Delete FAQ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white m-0">
                {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg bg-transparent border-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Question / Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. How do I track my pizza order?"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100 cursor-pointer"
                  >
                    {DEFAULT_CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Display Order
                  </label>
                  <input 
                    type="number"
                    min={0}
                    value={formData.order}
                    onChange={e => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Answer / Content <span className="text-red-500">*</span>
                </label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Enter detailed, helpful response..."
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Active (Visible in Help Center)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5.5 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer bg-transparent border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E53935] hover:bg-[#d92d36] rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer border-0 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editingFaq ? 'Save Changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Customer Support Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall size={18} className="text-[#E53935]" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white m-0">
                  Customer Support Contact Settings
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg bg-transparent border-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSupport} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Card Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Customer Support"
                  value={supportFormData.title}
                  onChange={e => setSupportFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description / Subtitle <span className="text-red-500">*</span>
                </label>
                <textarea 
                  rows={2}
                  required
                  placeholder="e.g. Have an issue with your order or questions about our menu? Get in touch directly:"
                  value={supportFormData.description}
                  onChange={e => setSupportFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#E53935]" />
                    Support Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. +91 9300990940"
                    value={supportFormData.phone}
                    onChange={e => setSupportFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Mail size={13} className="text-amber-600" />
                    Support Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="e.g. papafoodcorporation@gmail.com"
                    value={supportFormData.email}
                    onChange={e => setSupportFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-blue-600" />
                  Operational Support Hours <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Support Hours: 10:00 AM – 11:30 PM Everyday"
                  value={supportFormData.hours}
                  onChange={e => setSupportFormData(prev => ({ ...prev, hours: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-red-500 font-medium text-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer bg-transparent border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSupport}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E53935] hover:bg-[#d92d36] rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer border-0 disabled:opacity-50"
                >
                  {savingSupport && <Loader2 size={13} className="animate-spin" />}
                  Save Support Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
