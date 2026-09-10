import React, { useState } from 'react';
import { Plus, Eye, Move, GripVertical } from 'lucide-react';

export default function FaqManagement() {
  const [activeTab, setActiveTab] = useState('All Categories');
  
  const faqs = [
    {
      id: 1,
      category: 'Ordering',
      pos: 'Pos #1',
      title: 'How do I track my pizza order?',
      content: 'You can track your order in real-time by visiting the "My Orders" section of the app and selecting the active delivery. We provide live GPS tracking for all driver movements once the pizza leaves the oven...',
      enabled: true
    },
    {
      id: 2,
      category: 'Payments',
      pos: 'Pos #2',
      title: 'What payment methods do you accept?',
      content: 'We accept all major credit cards including Visa, Mastercard, and American Express. We also support digital wallets like Apple Pay and Google Pay for a faster checkout experience...',
      enabled: true
    },
    {
      id: 3,
      category: 'Delivery',
      pos: 'Pos #3',
      title: 'Do you offer contactless delivery?',
      content: 'Yes, contactless delivery is available by default. Our drivers will place your order on a clean surface at your doorstep and maintain a 6-foot distance while you retrieve it...',
      enabled: false
    },
    {
      id: 4,
      category: 'Franchise',
      pos: 'Pos #4',
      title: 'How can I apply to become a franchisee?',
      content: 'Prospective partners can submit an initial inquiry via our Franchise Portal. Successful candidates will be contacted for a multi-stage review process involving financial verification and operational assessments...',
      enabled: true
    }
  ];

  const tabs = ['All Categories', 'Ordering', 'Payments', 'Delivery', 'Franchise'];

  return (
    <div className="flex-1 overflow-y-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <section className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-[#271815]">FAQ Management</h2>
          <p className="text-xs text-[#5b403c]">Organize help center content</p>
        </div>
        <button className="bg-[#b41e15] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm">
          <Plus size={15} />
          Add FAQ
        </button>
      </section>

      {/* Category Tabs */}
      <section className="mb-3.5 border-b border-[#e4beb8] flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-1.5 px-1 text-xs font-semibold tracking-wide transition-colors ${
              activeTab === tab 
                ? 'text-[#b41e15] border-b-2 border-[#b41e15]' 
                : 'text-[#5b403c] hover:text-[#b41e15]'
            }`}
          >
            {tab}
          </button>
        ))}
      </section>

      {/* Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 bg-[#ffe2dd] p-1.5 rounded-lg border border-[#e4beb8] gap-3 sm:gap-0">
        <div className="flex items-center gap-1.5 px-2">
          <input className="w-3.5 h-3.5 rounded border-[#8f706b] text-[#b41e15] focus:ring-[#b41e15]" type="checkbox" />
          <span className="text-[10px] font-semibold tracking-wide text-[#5b403c]">Select All</span>
        </div>
        <div className="flex gap-1.5">
          <button className="flex items-center gap-1 px-2.5 py-1 border border-[#8f706b] rounded text-[#5b403c] hover:bg-white transition-colors text-[10px] font-semibold tracking-wide bg-[#fff8f7]">
            <Eye size={13} />
            Enable
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 border border-[#8f706b] rounded text-[#5b403c] hover:bg-white transition-colors text-[10px] font-semibold tracking-wide bg-[#fff8f7]">
            <Move size={13} />
            Move
          </button>
        </div>
      </div>

      {/* FAQ Sortable List */}
      <div className="flex flex-col gap-1.5 mb-6">
        {faqs.filter(faq => activeTab === 'All Categories' || faq.category === activeTab).map((faq) => (
          <div key={faq.id} className={`group bg-white rounded-lg border border-[#e4beb8] hover:shadow-md transition-all ${!faq.enabled ? 'opacity-70 grayscale-[30%]' : ''}`}>
            <div className="p-3 flex items-start gap-3">
              <div className="mt-1 text-[#5b403c] cursor-grab active:cursor-grabbing">
                <GripVertical size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b41e15]">{faq.category}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[#5b403c] bg-[#ffe9e6] rounded px-1.5 py-0.5">{faq.pos}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={faq.enabled} />
                      <div className="w-8 h-4 bg-[#dae1e3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#b41e15]"></div>
                    </label>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[#271815] mb-1">{faq.title}</h3>
                <p className="text-xs text-[#5b403c] line-clamp-2">
                  {faq.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
