import React from 'react';
import { X, MoreVertical, Clock, Star, Reply, CheckCircle2, Ban } from 'lucide-react';

const ReviewDetails = ({ isOpen, onClose, reviewId, onReject, onReply }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Review Detail Drawer (Right Aligned) */}
            <main className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-zinc-900 shadow-2xl z-[70] flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <header className="h-12 flex justify-between items-center px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-zinc-500 dark:text-zinc-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <h1 className="text-base font-bold text-[var(--primary)] dark:text-blue-400">Review Details</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto pb-36 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
                    {/* Review Info Section (Bento Style) */}
                    <section className="p-3.5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                                <div className="flex justify-between items-start mb-1.5">
                                    <div>
                                        <p className="text-[9px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 mb-0.5 uppercase">Review ID</p>
                                        <p className="text-xs font-bold text-[var(--primary)] dark:text-blue-400">{reviewId || '#PHQ-7729-1'}</p>
                                    </div>
                                    <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide">
                                        <Clock className="w-3 h-3" /> Pending
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="flex text-orange-400 gap-0.5">
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4" />
                                    </div>
                                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 ml-1.5">4.0</span>
                                </div>
                            </div>

                            {/* Customer Small Card */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700/50 flex flex-col gap-1.5">
                                <p className="text-[9px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Customer</p>
                                <div className="flex items-center gap-2">
                                    <img 
                                        alt="Customer Avatar" 
                                        className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-white dark:border-zinc-700" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB7xh83QePx80awFQ19f3clKRlMaYACVv8Rn7OJSN8W2lJkI3_PW_3xjEa3ldIsHgCkjC-DQ5oIuMBIcjhuXiSjgeLQ0yJ8itEnYPr5NRNPfdCQlrPsUCEhC0TLxnKRpZDBL2zQgS1LOZUBuXoNdMfbzvJsNs6YX57HESyNy7u7PxT-IrDVG9W1Kp0Iwe3Bj0_XCnr-W1zdVfUkN7XGYLcXdD-Khj0Yb4cTmL6Bbp4Hyyg4Xk8tSTmOSYslLOWEKZKBg1ZkklvcZQ"
                                    />
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-50">Elena Rossi</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">elena.r@email.com</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Small Card */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700/50 flex flex-col gap-1.5">
                                <p className="text-[9px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Order Details</p>
                                <div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">#ORD-5521</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">PizzaHQ Downtown • $42.50</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Review Content Section */}
                    <section className="px-3.5 pb-3.5">
                        <div className="bg-zinc-100 dark:bg-zinc-800/80 p-3 border border-zinc-200 dark:border-zinc-700/50 rounded-lg shadow-sm">
                            <h3 className="text-xs font-bold mb-1.5 text-zinc-900 dark:text-zinc-50">"The Truffle Mushroom was incredible!"</h3>
                            <p className="text-zinc-600 dark:text-zinc-300 leading-normal text-xs mb-3">
                                We ordered the Truffle Mushroom specialty pizza and it arrived piping hot. The crust was perfectly crispy on the outside and airy inside. Only deducting one star because the delivery took about 10 minutes longer than estimated, but the food quality made up for it! Will definitely order again.
                            </p>
                            
                            {/* Image Gallery */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg">
                                    <img 
                                        alt="Pizza Detail" 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXD_uabUC-l_gqWy4ar4GabQlpYvvpbWUDo7M7O1ISb-g1WxkMu7uKXOXwbWPAljCsfPk_VY83yN3ql0MO_WRpPIbkMMaOSU8GE_zVlWC3zFdW9GfRdjvYo2Dhv4vG8h89-fPQNiduQueZdivI_Mxw4npPtRHlqHYiYS93wDlR76sv9CBbX3NcZ3Ttcuzt1oIcFdl_Lyt0oeiRHU8tgBQpTmwP5_x1BHyP3iLXe31bsBuBQegj7l2tDqCxpdzTe41zzkd4M3u3j-M"
                                    />
                                </div>
                                <div className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg">
                                    <img 
                                        alt="Pizza Box" 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7xM8dQs7BPH_7_NohDsoTAT_Lq8t620p6BTNHPjDB10RVCihowO9kfxnPH02-LiSabvZCcRLHBjtFv2D-P3qgEuZk7roGz-K-Wzb-cSRKrqbSrQihnocfilT1RdkP492XpxSq1eZ24QErcN-LkAJ5zS5l1KedBgm__Iq5onfAXSic56PNzVoy3F4AAhTVUSmttKlDHW3tkFSPgBKKOhySby_LjI2hZYFngxLM0Pwb7tdemvcr2cLGWsQqe0DRTj3xyQBZuGizuP8"
                                    />
                                </div>
                                <div className="relative aspect-square bg-white dark:bg-zinc-800 flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">+1 More</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Threaded Replies Section */}
                    <section className="px-3.5 pt-1.5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Responses</span>
                            <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Reply 1 */}
                            <div className="flex gap-2.5">
                                <div className="flex flex-col items-center">
                                    <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-[10px] shadow-sm">HQ</div>
                                    <div className="w-[2px] h-full bg-zinc-200 dark:bg-zinc-800 my-2"></div>
                                </div>
                                <div className="flex-1 pt-0.5 pb-3">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                            PizzaHQ Admin <span className="text-zinc-500 font-normal text-[9px] ml-2">2 hours ago</span>
                                        </p>
                                        <Reply className="w-3.5 h-3.5 text-zinc-400" />
                                    </div>
                                    <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-normal">
                                        Thank you for your review, Elena! We're thrilled you loved the Truffle Mushroom. Sorry about the slight delay – we're working on optimizing our Downtown delivery routes!
                                    </p>
                                </div>
                            </div>

                            {/* Threaded Reply 2 */}
                            <div className="flex gap-2.5 ml-8">
                                <div className="flex flex-col items-center">
                                    <img 
                                        alt="Customer Small Avatar" 
                                        className="w-5 h-5 rounded-full object-cover shadow-sm border border-zinc-200 dark:border-zinc-700" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuGlAoxzYMG_u-HxnDeRPwiTZ73A4qAG_EIbJg19QyKJtJF8RRAlhml85tkAxvptg5HSAMhfODkxHGTwDUyQ2Bxp8LtEN8yVm31nZsWmQjNInYXbUtXsgqr7okOWX_2XjTy2sHEJ5o1e4loYtCVUZuyNJ1kR6kbEhFICMC1k3-KPung1Rwas2Dvk1KDBBfGrVNq0uAnd-ONjpfk3gWp8uLvQSZcFofwGLJTjm76Kyhtd1dn6jCTW2D6RJPPBXlICY_Bw6_Vq4CZDdI"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                            Elena Rossi <span className="text-zinc-500 font-normal text-[9px] ml-2">45 mins ago</span>
                                        </p>
                                    </div>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-normal italic">
                                        Appreciate the quick response! The quality definitely makes up for it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Actions */}
                <footer className="h-auto p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] flex flex-col gap-2.5 flex-shrink-0 z-10">
                    {/* Feature Toggle */}
                    <div className="flex justify-between items-center px-0.5">
                        <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-[var(--primary)] fill-[var(--primary)]" />
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Feature on homepage</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                        </label>
                    </div>

                    {/* Primary Actions Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={onReply}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 h-8.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors text-xs"
                        >
                            <Reply className="w-4 h-4" /> Reply
                        </button>
                        <button className="bg-[var(--primary)] text-white hover:bg-blue-700 h-8.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors text-xs shadow-sm">
                            <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                    </div>
                    
                    <button 
                        onClick={onReject}
                        className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 h-8.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors text-xs"
                    >
                        <Ban className="w-4 h-4" /> Reject Review
                    </button>
                </footer>
            </main>
        </>
    );
};

export default ReviewDetails;
