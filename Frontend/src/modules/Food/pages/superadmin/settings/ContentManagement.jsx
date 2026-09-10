import React, { useState } from 'react';
import { Upload, Plus, FileText, ArrowRight, Edit2, LayoutDashboard, MessageCircleQuestion, Image as ImageIcon } from 'lucide-react';
import ContentData from './ContentData';
import CreateCms from './CreateCms';
import FaqManagement from './FaqManagement';
import MediaLibrary from './MediaLibrary';
import PolicyManagement from './PolicyManagement';

export default function ContentManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto space-y-4 min-h-screen bg-zinc-50 dark:bg-zinc-955 text-black dark:text-white font-sans">
      
      {/* Top Level Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
        <button 
          onClick={() => setActiveMainTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeMainTab === 'dashboard' ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <LayoutDashboard size={12} />
          Dashboard
        </button>
        <button 
          onClick={() => setActiveMainTab('faqs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeMainTab === 'faqs' ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <MessageCircleQuestion size={12} />
          FAQs
        </button>
        <button 
          onClick={() => setActiveMainTab('media')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeMainTab === 'media' ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <ImageIcon size={12} />
          Media
        </button>
        <button 
          onClick={() => setActiveMainTab('policies')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeMainTab === 'policies' ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <FileText size={12} />
          Policies
        </button>
      </div>

      {activeMainTab === 'dashboard' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-white">Content Management</h1>
          <p className="text-[10px] font-semibold text-black/70 dark:text-white/70 mt-0.5">Manage your multi-unit franchise digital assets and page configurations from a central node.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0">
          <button className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 px-3 py-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
            <Upload size={12} className="text-black dark:text-white" />
            <span className="text-[11px] font-bold text-black dark:text-white">Upload Media</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-red-650 text-white px-3 py-1.5 rounded transition-all active:scale-95"
          >
            <Plus size={12} />
            <span className="text-[11px] font-bold">Create New Page</span>
          </button>
        </div>
      </section>

      {/* KPI Grid (Bento Style) */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="col-span-2 lg:col-span-2 p-3 bg-red-600 dark:bg-red-700 text-white rounded-xl flex items-center justify-between h-[70px] shadow-sm border border-red-500/20 relative overflow-hidden group">
          <div className="z-10 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Total Pages</p>
            <h2 className="text-xl font-black">248</h2>
          </div>
          <FileText className="w-8 h-8 opacity-25" />
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between h-[70px] shadow-sm hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors">
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Published</p>
            <h2 className="text-xl font-black text-black dark:text-white">210</h2>
          </div>
          <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-550"></span>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between h-[70px] shadow-sm hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors">
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Drafts</p>
            <h2 className="text-xl font-black text-black dark:text-white">38</h2>
          </div>
          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-450 dark:bg-zinc-550"></span>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between h-[70px] shadow-sm hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors">
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Pending</p>
            <h2 className="text-xl font-black text-red-650 dark:text-red-400">12</h2>
          </div>
          <div className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-red-550"></span>
          </div>
        </div>
        <div className="col-span-2 lg:col-span-1 p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between h-[70px] shadow-sm hover:border-zinc-300 dark:hover:border-zinc-650 transition-colors">
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-450">Media Files</p>
            <h2 className="text-xl font-black text-black dark:text-white">1,540</h2>
          </div>
          <ImageIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* CMS Pages Table Container */}
        <ContentData />

        {/* Recent Activity Timeline */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-black dark:text-white">Activity Feed</h3>
          <div className="space-y-3 relative before:absolute before:left-[9px] before:top-1.5 before:bottom-1.5 before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-800">
            <div className="relative pl-6 flex gap-3 group">
              <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-red-600 dark:bg-red-700 border-2 border-white dark:border-zinc-900 z-10"></div>
              <div className="flex-1">
                <p className="text-xs text-black dark:text-white/90">
                  <span className="font-bold">Sofia Conti</span> updated <span className="text-red-650 dark:text-red-400 font-bold">About Us</span>
                </p>
                <span className="text-[10px] font-semibold text-black/50 dark:text-white/50">2 hours ago • Franchise Global</span>
                <div className="mt-1.5 p-1.5 bg-red-50 dark:bg-red-950/20 rounded border border-red-150/30 dark:border-red-900/30 text-[10px] font-medium italic text-black dark:text-white">
                  "Modified headquarters address and team bios."
                </div>
              </div>
            </div>
            <div className="relative pl-6 flex gap-3 group">
              <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-zinc-500 dark:bg-zinc-650 border-2 border-white dark:border-zinc-900 z-10"></div>
              <div className="flex-1">
                <p className="text-xs text-black dark:text-white/90">
                  <span className="font-bold">Chef Alessandro</span> created a draft for <span className="text-red-650 dark:text-red-400 font-bold">Winter Special Menu</span>
                </p>
                <span className="text-[10px] font-semibold text-black/50 dark:text-white/50">Yesterday</span>
              </div>
            </div>
            <div className="relative pl-6 flex gap-3 group">
              <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900 z-10"></div>
              <div className="flex-1">
                <p className="text-xs text-black dark:text-white/90">
                  <span className="font-bold">System</span> automatically published <span className="text-red-650 dark:text-red-400 font-bold">Flash Sale Pop-up</span>
                </p>
                <span className="text-[10px] font-semibold text-black/50 dark:text-white/50">2 days ago</span>
              </div>
            </div>
            <div className="relative pl-6 flex gap-3 group">
              <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-red-600 dark:bg-red-700 border-2 border-white dark:border-zinc-900 z-10"></div>
              <div className="flex-1">
                <p className="text-xs text-black dark:text-white/90">
                  <span className="font-bold">Marco Rossi</span> uploaded 12 new <span className="text-red-650 dark:text-red-400 font-bold">Food Photography</span> assets
                </p>
                <span className="text-[10px] font-semibold text-black/50 dark:text-white/50">3 days ago</span>
              </div>
            </div>
          </div>
          <button className="w-full py-1.5 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-500 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">Show More History</button>
        </section>
      </div>

      {/* Featured Media Highlight */}
      <section className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3.5 flex flex-col md:flex-row gap-4 items-center relative overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex-1 space-y-2.5 z-10">
          <div className="inline-flex px-1.5 py-0.5 bg-red-600 dark:bg-red-700 text-white text-[9px] font-bold rounded uppercase">Media Library Update</div>
          <h3 className="text-sm font-bold text-black dark:text-white">High-Resolution Asset Sync</h3>
          <p className="text-[10px] font-semibold text-black/70 dark:text-white/70 max-w-md">Your 2024 Seasonal Photography pack is now synced across all 12 franchise websites. Ensure all menu items are updated before the weekend rush.</p>
          <button className="bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors w-max">
            Go to Assets <ArrowRight size={12} />
          </button>
        </div>
        <div className="w-full md:w-60 h-32 rounded-lg overflow-hidden shadow border-2 border-white dark:border-zinc-850 z-10 shrink-0">
          <img 
            className="w-full h-full object-cover" 
            alt="Pizza Photography" 
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop&fm=webp" 
          />
        </div>
      </section>
      </div>
      ) : activeMainTab === 'faqs' ? (
        <FaqManagement />
      ) : activeMainTab === 'policies' ? (
        <PolicyManagement />
      ) : (
        <MediaLibrary />
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-8 right-6 w-14 h-14 bg-red-650 text-white rounded-full shadow-2xl flex items-center justify-center z-[50] active:scale-90 transition-transform"
      >
        <Edit2 size={24} />
      </button>

      <CreateCms isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
