import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, Save, Eye, Plus, Trash2, HelpCircle, FileText, CheckCircle2, Award } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '@/services/api/axios';
import { uploadAPI } from '@/services/api';

export default function RewardsManagement() {
  const [config, setConfig] = useState({
    isEnabled: true,
    programName: 'Cheesy Rewards',
    logoUrl: '',
    title: 'Earn Points to Unlock Free Treats!',
    subtitle1: '1 Order = 100 Points',
    subtitle2: 'Relish freebies at 600 points',
    orderPointsTitle: '1 Order = 100 Points',
    orderPointsSubtitle: 'On every order above ₹349',
    freeItemsTitle: 'Unlock Free Items',
    freeItemsSubtitle: 'Starting at 600 Points',
    minOrderAmount: 349,
    pointsPerOrder: 100,
    defaultPointsRequired: 600,
    buttonText: 'Enroll Now',
    termsText: 'By enrolling you agree to our',
    termsLinkText: 'Terms and Conditions',
    termsLink: '#',
    faqs: [
      {
        question: 'How do I earn points in the Rewards program?',
        answer: 'You earn 100 points on every delivered order above ₹349 placed via the Papa Veg Pizza app or website.'
      },
      {
        question: 'How do I unlock and redeem free items?',
        answer: 'Once you accumulate 600 points, all eligible reward items unlock automatically. You can add any unlocked reward product to your cart during checkout for ₹0.'
      },
      {
        question: 'Do my points expire?',
        answer: 'Points remain valid for 12 months from the date they are credited to your account.'
      },
      {
        question: 'Can I combine free reward items with discount coupons?',
        answer: 'Yes! You can apply active promo codes along with your redeemed reward treats on eligible orders.'
      }
    ],
    terms: [
      'Enrollment in the Rewards Program is free for all registered customers.',
      'Points are credited within 24 hours of successful order delivery.',
      'Orders below the minimum threshold (₹349) do not qualify for point accrual.',
      'Reward products are subject to daily kitchen availability and stock.',
      'Papa Veg Pizza reserves the right to modify point rules and redemption criteria at any time.'
    ]
  });

  const [activeTab, setActiveTab] = useState('general'); // 'general', 'rules', 'faqs', 'terms'
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
        setConfig(prev => ({
          ...prev,
          ...res.data.data,
          faqs: Array.isArray(res.data.data.faqs) && res.data.data.faqs.length > 0 ? res.data.data.faqs : prev.faqs,
          terms: Array.isArray(res.data.data.terms) && res.data.data.terms.length > 0 ? res.data.data.terms : prev.terms
        }));
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

  const handleAddFaq = () => {
    setConfig(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: 'New Question', answer: 'Answer goes here...' }]
    }));
  };

  const handleUpdateFaq = (index, field, value) => {
    setConfig(prev => {
      const nextFaqs = [...prev.faqs];
      nextFaqs[index] = { ...nextFaqs[index], [field]: value };
      return { ...prev, faqs: nextFaqs };
    });
  };

  const handleDeleteFaq = (index) => {
    setConfig(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const handleAddTerm = () => {
    setConfig(prev => ({
      ...prev,
      terms: [...prev.terms, 'New policy or rule statement...']
    }));
  };

  const handleUpdateTerm = (index, value) => {
    setConfig(prev => {
      const nextTerms = [...prev.terms];
      nextTerms[index] = value;
      return { ...prev, terms: nextTerms };
    });
  };

  const handleDeleteTerm = (index) => {
    setConfig(prev => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto min-h-screen">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-[var(--primary)]" />
            Rewards & Loyalty Program
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configure Cheesy Rewards rules, points calculation, catalogue benefits, FAQs and terms.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary)]/90 transition-colors shadow-sm disabled:opacity-70 cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-2">
        {[
          { id: 'general', label: 'General & Header' },
          { id: 'rules', label: 'Points & Order Rules' },
          { id: 'faqs', label: 'FAQs' },
          { id: 'terms', label: 'Terms & Conditions' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div>
                    <p className="font-semibold text-sm">Enable Rewards Program</p>
                    <p className="text-xs text-zinc-500">Show Rewards card on home page and allow user enrollment</p>
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                    Program Tab Name
                  </label>
                  <input
                    type="text"
                    value={config.programName || ''}
                    onChange={e => setConfig({ ...config, programName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    placeholder="e.g. Cheesy Rewards"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Label shown on the top switcher tab next to Wallet.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                    Logo Image
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={config.logoUrl || ''}
                      onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="https://..."
                    />
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-zinc-200 cursor-pointer"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={config.buttonText || ''}
                    onChange={e => setConfig({ ...config, buttonText: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    placeholder="Enroll Now"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-bold text-base border-b pb-2 dark:border-zinc-800">
                  Rule 1: Point Accrual
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                      Rule 1 Title
                    </label>
                    <input
                      type="text"
                      value={config.orderPointsTitle || ''}
                      onChange={e => setConfig({ ...config, orderPointsTitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="1 Order = 100 Points"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                      Rule 1 Subtitle
                    </label>
                    <input
                      type="text"
                      value={config.orderPointsSubtitle || ''}
                      onChange={e => setConfig({ ...config, orderPointsSubtitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="On every order above ₹349"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                      Minimum Order Value (₹)
                    </label>
                    <input
                      type="number"
                      value={config.minOrderAmount ?? 349}
                      onChange={e => setConfig({ ...config, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                      Points Awarded Per Order
                    </label>
                    <input
                      type="number"
                      value={config.pointsPerOrder ?? 100}
                      onChange={e => setConfig({ ...config, pointsPerOrder: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-bold text-base border-b pb-2 dark:border-zinc-800">
                  Rule 2: Free Item Unlock Threshold
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                      Rule 2 Title
                    </label>
                    <input
                      type="text"
                      value={config.freeItemsTitle || ''}
                      onChange={e => setConfig({ ...config, freeItemsTitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="Unlock Free Items"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                      Rule 2 Subtitle
                    </label>
                    <input
                      type="text"
                      value={config.freeItemsSubtitle || ''}
                      onChange={e => setConfig({ ...config, freeItemsSubtitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="Starting at 600 Points"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase">
                    Default Points Required For Free Items
                  </label>
                  <input
                    type="number"
                    value={config.defaultPointsRequired ?? 600}
                    onChange={e => setConfig({ ...config, defaultPointsRequired: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Points badge displayed alongside each reward product card (e.g. 600 Points).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAQs */}
          {activeTab === 'faqs' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-sky-500" />
                    Frequently Asked Questions
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Displayed in the user app when users click the FAQs link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add FAQ
                </button>
              </div>

              <div className="space-y-4 pt-2">
                {config.faqs?.map((faq, index) => (
                  <div key={index} className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-750 bg-zinc-50/60 dark:bg-zinc-850/60 space-y-2 relative group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-400">#{index + 1} Question</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(index)}
                        className="text-zinc-400 hover:text-red-600 p-1 rounded"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={e => handleUpdateFaq(index, 'question', e.target.value)}
                      placeholder="Question..."
                      className="w-full px-3 py-1.5 border rounded-md text-xs font-semibold dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={e => handleUpdateFaq(index, 'answer', e.target.value)}
                      placeholder="Answer..."
                      rows={2}
                      className="w-full px-3 py-1.5 border rounded-md text-xs dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Terms */}
          {activeTab === 'terms' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-500" />
                    Terms & Conditions
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Displayed in the user app when clicking the Terms & Conditions link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Condition
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {config.terms?.map((term, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={term}
                      onChange={e => handleUpdateTerm(index, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-xs dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteTerm(index)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Live Preview Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 sticky top-4">
            <h3 className="font-bold text-sm border-b pb-3 mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Eye className="w-4 h-4 text-zinc-400" />
              Live Preview (Mobile View)
            </h3>

            {/* Mobile screen frame */}
            <div className="max-w-[340px] mx-auto bg-white rounded-2xl shadow-md border border-zinc-200 overflow-hidden text-zinc-900">
              {/* Mock Mobile Top Bar */}
              <div className="h-12 px-3 flex items-center gap-2 border-b border-zinc-100 bg-white">
                <span className="text-xs">←</span>
                <span className="text-xs font-bold">Rewards & Wallet</span>
              </div>

              {/* Mock Switcher */}
              <div className="p-3 space-y-3 bg-zinc-50/50">
                <div className="bg-zinc-200/60 p-1 rounded-xl flex text-[11px] font-bold">
                  <span className="flex-1 text-center py-1 bg-white rounded-lg shadow-2xs">
                    {config.programName || 'Cheesy Rewards'}
                  </span>
                  <span className="flex-1 text-center py-1 text-zinc-400">
                    Wallet
                  </span>
                </div>

                {/* Benefits Card */}
                <div className="bg-white rounded-xl p-3 border border-zinc-150 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      <span className="text-sky-500 text-[10px]">🍕</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">
                        {config.orderPointsTitle || '1 Order = 100 Points'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {config.orderPointsSubtitle || 'On every order above ₹349'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      <span className="text-sky-500 text-[10px]">🍕</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">
                        {config.freeItemsTitle || 'Unlock Free Items'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {config.freeItemsSubtitle || 'Starting at 600 Points'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2 bg-[var(--primary)] text-white font-bold text-xs rounded-lg"
                  >
                    {config.buttonText || 'Enroll Now'}
                  </button>
                  <p className="text-center text-[9px] text-zinc-400">
                    By enrolling you agree to our <span className="text-[var(--primary)] underline">Terms and Conditions</span>
                  </p>
                </div>

                {/* Filter chips mock */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 border rounded bg-white text-zinc-700">🟩 Veg Only</span>
                    <span className="px-2 py-0.5 border rounded bg-white text-zinc-700">🔺 Non Veg</span>
                  </div>
                  <span className="px-2 py-0.5 border rounded bg-white text-zinc-700">Sort by ⇅</span>
                </div>

                {/* Mock product card */}
                <div className="bg-white rounded-xl p-2 border border-zinc-150 flex items-center gap-2">
                  <div className="w-14 h-14 rounded-lg bg-zinc-100 shrink-0 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=100&auto=format&fit=crop&q=60" 
                      alt="Pizza" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate">Margherita</p>
                    <p className="text-[9px] text-zinc-400">Regular | New Hand Tossed</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold">{config.defaultPointsRequired || 600} Points</span>
                      <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border">Locked</span>
                    </div>
                  </div>
                </div>

                {/* Mock Footer Links */}
                <div className="text-center text-[10px] py-1 text-sky-600 font-bold">
                  FAQs | Terms & Conditions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
