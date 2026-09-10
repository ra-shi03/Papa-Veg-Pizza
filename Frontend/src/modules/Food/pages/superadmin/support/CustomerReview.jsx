import React, { useState } from 'react';
import { 
    Download, Trash2, CheckCircle2, X, ChevronDown, 
    Star, StarHalf, Edit2, MoreVertical, AlertTriangle, 
    Reply, ChevronLeft, ChevronRight, Filter 
} from 'lucide-react';

const CustomerReview = ({ onRowClick }) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const reviews = [
        {
            id: '#REV-4921',
            name: 'Alex Martinez',
            rating: 4.5,
            status: 'Published',
            sentiment: 'Positive',
            statusColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            sentimentColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            actionIcon: <Edit2 className="w-5 h-5" />
        },
        {
            id: '#REV-4920',
            name: 'Sarah Chen',
            rating: 2.0,
            status: 'Flagged',
            sentiment: 'Critical',
            statusColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            sentimentColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            actionIcon: <AlertTriangle className="w-5 h-5 text-orange-500" />
        },
        {
            id: '#REV-4919',
            name: 'James Wilson',
            rating: 5.0,
            status: 'Pending',
            sentiment: 'Neutral',
            statusColor: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
            sentimentColor: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
            actionIcon: <Reply className="w-5 h-5" />
        },
        {
            id: '#REV-4918',
            name: 'Emma Thompson',
            rating: 4.0,
            status: 'Published',
            sentiment: 'Positive',
            statusColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            sentimentColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            actionIcon: <Edit2 className="w-5 h-5" />
        }
    ];

    const toggleAllRows = () => {
        if (selectedRows.length === reviews.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(reviews.map(r => r.id));
        }
    };

    const toggleRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const clearSelection = () => {
        setSelectedRows([]);
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                stars.push(<Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />);
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                stars.push(<StarHalf key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />);
            } else {
                stars.push(<Star key={i} className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />);
            }
        }
        return stars;
    };

    return (
        <div className="w-full relative pb-12">
            {/* Header section */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Customer Reviews</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold mt-0.5">Manage and respond to recent feedback</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button className="bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-300 p-1.5 rounded transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <Download className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedRows.length > 0 && (
                <div className="flex items-center justify-between bg-[var(--primary)] text-white px-3 py-2 rounded-lg mb-2 animate-in slide-in-from-top-4 duration-300 shadow-md">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-xs">{selectedRows.length} selected</span>
                        <div className="h-3.5 w-[1px] bg-white/30"></div>
                        <button className="flex items-center gap-1.5 text-xs font-bold hover:text-white/80 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-bold hover:text-white/80 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                    </div>
                    <button onClick={clearSelection} className="hover:bg-white/20 p-1 rounded transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="w-full">
                    {/* Sticky Header */}
                    <div className="bg-zinc-50 dark:bg-zinc-955 flex items-center px-3.5 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3 w-full">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer" 
                                checked={selectedRows.length === reviews.length && reviews.length > 0}
                                onChange={toggleAllRows}
                            />
                            <div className="grid grid-cols-12 gap-3 w-full text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                <span className="col-span-5 md:col-span-4 flex items-center gap-0.5">
                                    Review ID <ChevronDown className="w-3.5 h-3.5" />
                                </span>
                                <span className="col-span-4 md:col-span-5 hidden sm:block">Rating & Status</span>
                                <span className="col-span-7 sm:col-span-3 text-right">Actions</span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {reviews.map((review) => (
                            <div 
                                key={review.id} 
                                className="flex items-center px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850/30 transition-colors group cursor-pointer"
                                onClick={() => onRowClick && onRowClick(review.id)}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer" 
                                        checked={selectedRows.includes(review.id)}
                                        onChange={() => toggleRow(review.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="grid grid-cols-12 gap-3 w-full items-center">
                                        <div className="col-span-7 sm:col-span-5 md:col-span-4">
                                            <p className="font-mono font-black text-xs text-zinc-900 dark:text-zinc-550">{review.id}</p>
                                            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 truncate">{review.name}</p>
                                        </div>
                                        <div className="col-span-5 hidden md:block">
                                            <div className="flex items-center gap-0.5 mb-1">
                                                {renderStars(review.rating)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${review.statusColor}`}>
                                                    {review.status}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${review.sentimentColor}`}>
                                                    {review.sentiment}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-5 sm:col-span-7 md:col-span-3 text-right flex justify-end gap-0.5">
                                            <button 
                                                className="p-1 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded transition-colors text-zinc-450 dark:text-zinc-500"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {React.cloneElement(review.actionIcon, { className: 'w-3.5 h-3.5' })}
                                            </button>
                                            <button 
                                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-450 dark:text-zinc-550"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Footer */}
                    <div className="bg-zinc-50 dark:bg-zinc-950/70 p-2 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200 dark:border-zinc-800 gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">Showing 1-4 of 128</span>
                        <div className="flex items-center gap-1.5">
                            <button className="p-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 transition-colors" disabled>
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-1">
                                <span className="w-6 h-6 flex items-center justify-center rounded bg-[var(--primary)] text-white text-[10px] font-bold">1</span>
                                <span className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-450 text-[10px] font-bold cursor-pointer transition-colors">2</span>
                                <span className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-450 text-[10px] font-bold cursor-pointer transition-colors">3</span>
                            </div>
                            <button className="p-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button: Quick Filter */}
            <button 
                onClick={() => setIsFilterOpen(true)}
                className="fixed bottom-6 right-6 w-10 h-10 bg-[var(--primary)] text-white rounded-xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 z-50 lg:hidden"
            >
                <Filter className="w-4 h-4" />
            </button>

            {/* Quick Filter Overlay */}
            {isFilterOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center transition-opacity duration-300">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-3xl p-4 transform transition-transform duration-300 animate-in slide-in-from-bottom-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-555">Quick Filters</h3>
                            <button 
                                onClick={() => setIsFilterOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Sentiment</label>
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-[10px] border border-blue-200 dark:border-blue-800 cursor-pointer">Positive</span>
                                    <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700 cursor-pointer">Neutral</span>
                                    <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700 cursor-pointer">Critical</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Status</label>
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700 cursor-pointer">Published</span>
                                    <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700 cursor-pointer">Pending</span>
                                    <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700 cursor-pointer">Flagged</span>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button 
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full bg-[var(--primary)] hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs shadow-lg transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerReview;
