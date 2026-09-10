import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Search, Filter, Plus, AlertTriangle, 
  ArrowLeft, Calendar, Info, TrendingUp, DollarSign, Users, Target
} from 'lucide-react';
import CreateEditBannerModal from './CreateEditBannerModal';

export default function BannersCalendar({ onBack }) {
  const [activeView, setActiveView] = useState('Month');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState('June 2026');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [showConflictInfo, setShowConflictInfo] = useState(false);

  // Mock schedule conflicts
  const conflictsList = [
    { title: '🍕 Weekend Feast: Buy 1 Get 1 Free', container: 'Homepage Slider', priority: 85 },
    { title: '✨ Flat 50% Off on First Order!', container: 'Popup Overlay', priority: 95 },
    { title: '🌶️ Spicy Paneer Delight Combo Deal', container: 'Offers Feed', priority: 60 }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-12">
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full transition-colors text-black/50 dark:text-white/50 cursor-pointer"
            title="Back to Banners List"
          >
            <ArrowLeft size={18} className="text-[var(--primary)]" />
          </button>
          <div>
            <h3 className="text-lg font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
              <Calendar size={18} className="text-[var(--primary)]" />
              Campaign Schedule Calendar
            </h3>
            <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">Visualize marketing campaigns, active timelines, and manage banner scheduling conflicts.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 select-none">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-bold hover:bg-[var(--primary)]/90 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Banner</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 select-none">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {['Month', 'Week', 'Timeline'].map((view) => (
              <button 
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                  activeView === view 
                    ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-855 dark:hover:text-zinc-200'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentMonth(currentMonth === 'June 2026' ? 'May 2026' : 'June 2026')}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-[var(--primary)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-extrabold text-xs w-28 text-center text-zinc-800 dark:text-zinc-100">{currentMonth}</span>
            <button 
              onClick={() => setCurrentMonth(currentMonth === 'June 2026' ? 'July 2026' : 'June 2026')}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-[var(--primary)] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
              <Search size={14} />
            </span>
            <input 
              type="text"
              placeholder="Search banner title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[var(--primary)] dark:text-zinc-100 placeholder:text-zinc-400 font-semibold"
            />
          </div>
          <button className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <Filter size={14} />
            <span>Filters</span>
          </button>
        </div>
      </section>

      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider py-2 text-center border-b border-zinc-200 dark:border-zinc-800 select-none">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 border-l border-zinc-200 dark:border-zinc-800 font-bold select-none text-[10.5px]">
          {/* Row 1 (May 24-30, inactive) */}
          {[24, 25, 26, 27, 28, 29, 30].map(day => (
            <div key={`prev-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-400 dark:text-zinc-650 bg-zinc-50/50 dark:bg-zinc-950/20 opacity-60">{day}</div>
          ))}
          
          {/* Row 2 (May 31 & June 1-6) */}
          <div className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-400 dark:text-zinc-650 bg-zinc-50/50 dark:bg-zinc-950/20 opacity-60">31</div>
          {[1, 2, 3, 4, 5, 6].map(day => (
            <div key={`june-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-400">{day}</div>
          ))}
          
          {/* Row 3 (June 7-13) */}
          {[7, 8, 9, 10, 11, 12, 13].map(day => (
            <div key={`june-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-400">{day}</div>
          ))}

          {/* Row 4 (June 14-20) */}
          {[14, 15, 16, 17].map(day => (
            <div key={`june-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-400">{day}</div>
          ))}
          {/* June 18 spans 3 cells to the right */}
          <div className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-750 dark:text-zinc-350 relative bg-[var(--primary)]/5">
            <span className="bg-[var(--primary)] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">18</span>
            <div 
              onClick={() => setSelectedBanner({ name: "🍕 Weekend Feast: Buy 1 Get 1 Free", type: "Homepage Banner", date: "June 18 - June 25", reach: "2,84,000", revenue: "₹1,84,500" })}
              className="absolute inset-x-2 top-8 w-[calc(300%+16px)] z-10 h-6 px-2.5 rounded bg-[var(--primary)] text-white text-[9.5px] font-black flex items-center cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md truncate"
              title="Weekend Feast"
            >
              🍕 Weekend Feast: Buy 1 Get 1 Free
            </div>
          </div>
          {[19, 20].map(day => (
            <div key={`june-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-400">{day}</div>
          ))}

          {/* Row 5 (June 21-27 with overlapping conflict) */}
          {[21, 22, 23].map(day => (
            <div key={`june-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-400">{day}</div>
          ))}
          {/* June 24 has flat 50% popup overlay and conflict warnings */}
          <div className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-750 dark:text-zinc-350 relative">
            24
            {/* Flat 50% popup spanning 3 cells */}
            <div 
              onClick={() => setSelectedBanner({ name: "✨ Flat 50% Off on First Order!", type: "Popup Banner", date: "June 20 - June 30", reach: "1,20,000", revenue: "₹84,200" })}
              className="absolute inset-x-2 top-[58px] w-[calc(300%+16px)] z-20 h-6 px-2.5 rounded bg-blue-600 text-white text-[9.5px] font-black flex items-center cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md truncate"
              title="Flat 50% Off"
            >
              ✨ Flat 50% Off First Order
            </div>
            {/* Warning indicator for Scheduling Conflict */}
            <div 
              className="absolute top-2 right-2 flex items-center justify-center cursor-pointer" 
              onClick={() => setShowConflictInfo(true)}
              title="Conflict Warning"
            >
              <AlertTriangle size={15} className="text-red-500 fill-red-500/10 animate-bounce" />
              <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">3</div>
            </div>
          </div>
          {[25, 26, 27].map(day => (
            <div key={`june-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-400">{day}</div>
          ))}

          {/* Row 6 (June 28-30 & July 1-4) */}
          {[28, 29, 30].map(day => (
            <div key={`june-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-400">{day}</div>
          ))}
          {[1, 2, 3, 4].map(day => (
            <div key={`next-${day}`} className="min-h-[100px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 text-zinc-400 dark:text-zinc-650 bg-zinc-50/50 dark:bg-zinc-950/20 opacity-60">{day}</div>
          ))}
        </div>
      </div>

      {/* Conflict Modal */}
      {showConflictInfo && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-md w-full rounded-2xl p-5 shadow-2xl relative text-xs">
            <h4 className="font-extrabold text-sm text-red-650 flex items-center gap-1.5 mb-2.5">
              <AlertTriangle size={17} className="text-red-500" /> Display Container Overlaps (3 Banners)
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4 leading-normal font-semibold">
              Multiple high-priority banner assets are scheduled to display concurrently on the main homepage container on June 24. This may cause layout congestion.
            </p>
            <div className="space-y-2.5 border-t border-zinc-150 dark:border-zinc-800 pt-3 select-none">
              {conflictsList.map((c, i) => (
                <div key={i} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-xl border border-zinc-150 dark:border-zinc-805">
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate pr-2">{c.title}</div>
                  <div className="flex gap-2 items-center shrink-0">
                    <span className="text-[8.5px] font-black px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-650 rounded-md uppercase">{c.container}</span>
                    <span className="text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">W: {c.priority}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button 
                onClick={() => setShowConflictInfo(false)}
                className="px-4.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all font-bold cursor-pointer"
              >
                Dismiss Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Info Modal */}
      {selectedBanner && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-sm w-full rounded-2xl p-5 shadow-2xl relative text-xs">
            <h4 className="font-black text-sm text-[var(--primary)] mb-3 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <Target size={15} /> Campaign Parameters
            </h4>
            <div className="space-y-3.5 pt-1.5 text-zinc-700 dark:text-zinc-350">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-bold uppercase text-[9px]">Banner Name</span>
                <span className="font-extrabold text-zinc-900 dark:text-white text-right truncate max-w-[180px]">{selectedBanner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-bold uppercase text-[9px]">Display Zone</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedBanner.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-bold uppercase text-[9px]">Date range</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedBanner.date}</span>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                <span className="text-zinc-400 font-bold uppercase text-[9px] flex items-center gap-1">
                  <Users size={11} /> Impressions
                </span>
                <span className="font-extrabold text-zinc-900 dark:text-white">{selectedBanner.reach} users</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-bold uppercase text-[9px] flex items-center gap-1">
                  <DollarSign size={11} className="text-emerald-500" /> Sales Impact
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{selectedBanner.revenue}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button 
                onClick={() => setSelectedBanner(null)}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all font-bold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stepper modal binding */}
      <CreateEditBannerModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

    </div>
  );
}
