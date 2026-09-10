import React from 'react';
import { 
    Inbox, Clock, Brain, Sparkles, Filter, 
    CheckCircle2, Calendar, Globe, Mail, 
    Star, Ticket, Archive, ChevronRight, 
    ChevronLeft, Plus 
} from 'lucide-react';

const Feedback = ({ onAssign }) => {
    const feedbackList = [
        {
            id: '#FB-9204',
            source: 'G-Reviews',
            location: 'Times Square Location',
            text: '"Best thin crust in NYC!"',
            sentiment: 'Positive',
            sentimentColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            dotColor: 'bg-green-500',
            icon: <Globe className="w-5 h-5 text-[var(--primary)]" />
        },
        {
            id: '#FB-9198',
            source: 'Direct Email',
            location: 'Brooklyn Heights',
            text: 'Delivery was 40 mins late...',
            sentiment: 'Negative',
            sentimentColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            dotColor: 'bg-red-500',
            icon: <Mail className="w-5 h-5 text-red-500" />
        },
        {
            id: '#FB-9185',
            source: 'Yelp',
            location: 'SoHo Outlet',
            text: 'Good pizza, but place was crowded.',
            sentiment: 'Neutral',
            sentimentColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
            dotColor: 'bg-zinc-400',
            icon: <Star className="w-5 h-5 text-orange-400" />
        }
    ];

    return (
        <div className="w-full relative pb-12">
            {/* Header Section */}
            <div className="mb-4">
                <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Feedback Inbox</h2>
                <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Review and manage customer sentiment across all locations.</p>
            </div>

            {/* KPI Cards Grid (Bento Style) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                {/* Total Feedback */}
                <div className="col-span-1 bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between h-[75px]">
                    <div className="flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Feedback</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">1,482</span>
                            <span className="text-[8px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1 rounded">+12%</span>
                        </div>
                    </div>
                    <Inbox className="w-5 h-5 text-[var(--primary)] dark:text-blue-400 shrink-0" />
                </div>

                {/* Open Items */}
                <div className="col-span-1 bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between h-[75px]">
                    <div className="flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Open Items</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">42</span>
                            <span className="text-[8px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1 rounded">Urgent</span>
                        </div>
                    </div>
                    <Clock className="w-5 h-5 text-orange-550 shrink-0" />
                </div>

                {/* AI Sentiment Breakdown */}
                <div className="col-span-2 bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between h-[75px] relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-5">
                        <Brain className="w-20 h-20 text-zinc-900 dark:text-white" />
                    </div>
                    <div className="flex flex-col justify-center shrink-0">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1 z-10">
                            <Sparkles className="w-3 h-3 text-purple-500" /> Sentiment
                        </p>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-1.5 z-10">AI Automated</span>
                    </div>
                    <div className="flex items-center gap-3 w-3/5 z-10">
                        <div className="flex-grow">
                            <div className="flex justify-between text-[9px] font-bold mb-0.5">
                                <span className="text-zinc-500 dark:text-zinc-400">Pos</span>
                                <span className="text-zinc-900 dark:text-zinc-50">78%</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-1 rounded-full overflow-hidden">
                                <div className="bg-[var(--primary)] h-full w-[78%]"></div>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between text-[9px] font-bold mb-0.5">
                                <span className="text-zinc-500 dark:text-zinc-400">Neu</span>
                                <span className="text-zinc-900 dark:text-zinc-50">15%</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-855 h-1 rounded-full overflow-hidden">
                                <div className="bg-zinc-400 h-full w-[15%]"></div>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between text-[9px] font-bold mb-0.5">
                                <span className="text-red-500">Neg</span>
                                <span className="text-red-550">7%</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-855 h-1 rounded-full overflow-hidden">
                                <div className="bg-red-550 h-full w-[7%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 rounded px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 max-w-sm w-full focus-within:border-[var(--primary)] transition-colors shadow-sm">
                    <Filter className="w-3.5 h-3.5 text-zinc-400" />
                    <input 
                        type="text" 
                        className="bg-transparent border-none focus:ring-0 text-xs w-full text-zinc-900 dark:text-zinc-50 placeholder-zinc-400" 
                        placeholder="Search feedback..." 
                    />
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <button className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors">
                        <CheckCircle2 className="w-3 h-3" />
                        Status: All
                    </button>
                    <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors shadow-sm">
                        <Calendar className="w-3 h-3" />
                        Last 7 Days
                    </button>
                </div>
            </div>

            {/* Feedback Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-55 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 hidden md:table-header-group">
                        <tr>
                            <th className="px-3.5 py-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Source</th>
                            <th className="px-3.5 py-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Feedback</th>
                            <th className="px-3.5 py-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Sentiment</th>
                            <th className="px-3.5 py-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {feedbackList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/30 transition-colors block md:table-row cursor-pointer group">
                                <td className="px-3.5 py-2 md:w-32 border-b border-zinc-100 dark:border-zinc-800 md:border-none">
                                    <div className="flex items-center gap-1.5">
                                        {React.cloneElement(item.icon, { className: 'w-3.5 h-3.5' })}
                                        <span className="md:hidden text-xs font-bold text-zinc-650 dark:text-zinc-450">{item.source}</span>
                                        <span className="hidden md:inline text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.source}</span>
                                    </div>
                                </td>
                                <td className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 md:border-none">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{item.text}</span>
                                        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">{item.id} • {item.location}</span>
                                    </div>
                                </td>
                                <td className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 md:border-none">
                                    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${item.sentimentColor}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`}></div>
                                        {item.sentiment}
                                    </div>
                                </td>
                                <td className="px-3.5 py-2 text-right md:text-left align-middle">
                                    <div className="flex items-center justify-end md:justify-start gap-1">
                                        {item.sentiment === 'Negative' ? (
                                            <button 
                                                className="p-1 rounded bg-[var(--primary)] text-white shadow-sm flex items-center gap-1 hover:bg-blue-700 transition-colors" 
                                                title="Convert to Ticket"
                                                onClick={(e) => { e.stopPropagation(); onAssign && onAssign(item.id); }}
                                            >
                                                <Ticket className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">Convert</span>
                                            </button>
                                        ) : (
                                            <button 
                                                className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors text-zinc-450 dark:text-zinc-500" 
                                                title="Convert to Ticket"
                                                onClick={(e) => { e.stopPropagation(); onAssign && onAssign(item.id); }}
                                            >
                                                <Ticket className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-450 dark:text-zinc-500" title="Archive">
                                            <Archive className="w-3.5 h-3.5" />
                                        </button>
                                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 md:hidden ml-1" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Pagination Placeholder */}
                <div className="p-2 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Showing 3 of 1,482</span>
                    <div className="flex gap-1.5">
                        <button className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center opacity-50 cursor-not-allowed text-zinc-500 bg-white dark:bg-zinc-900">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 transition-colors bg-white dark:bg-zinc-900 shadow-sm">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <button className="fixed right-6 bottom-6 md:right-8 md:bottom-8 bg-[var(--primary)] text-white p-3 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 z-40">
                <Plus className="w-5 h-5 stroke-[2px]" />
                <span className="text-xs font-bold hidden md:inline tracking-wide">Log Manual Entry</span>
            </button>
        </div>
    );
};

export default Feedback;
