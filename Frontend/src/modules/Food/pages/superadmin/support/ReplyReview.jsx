import React, { useState, useRef } from 'react';
import { 
    Copy, X, Globe, Lock, Bold, Italic, 
    List, Link as LinkIcon, Wand2, Send 
} from 'lucide-react';

const ReplyReview = ({ isOpen, onClose, reviewId }) => {
    const [visibility, setVisibility] = useState('public');
    const [content, setContent] = useState("Hello Alex, thank you for the feedback. We're looking into the custom tags issue immediately...");
    
    // Fallback if reviewId isn't provided
    const displayId = reviewId || 'REV-89241';
    const charCount = content.trim().length;
    const isOverLimit = charCount > 1000;

    if (!isOpen) return null;

    const handleInput = (e) => {
        setContent(e.currentTarget.textContent);
    };

    return (
        <>
            {/* Modal Overlay */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] flex items-end md:items-center justify-center p-0 md:p-6 transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            >
                {/* Modal Content (Mobile Sheet Style) */}
                <div 
                    className="bg-white dark:bg-zinc-900 w-full md:max-w-xl md:rounded-xl rounded-t-3xl shadow-2xl flex flex-col h-[85vh] md:h-auto overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle for mobile visual */}
                    <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <header className="px-4 py-2.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Review ID</span>
                            <h2 className="text-base font-bold text-[var(--primary)] dark:text-blue-400 flex items-center gap-1.5">
                                {displayId}
                                <Copy className="w-3.5 h-3.5 text-zinc-400 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" />
                            </h2>
                        </div>
                        <button 
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </header>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
                        {/* Target Review Content (Read-Only Context) */}
                        <section className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border-l-4 border-blue-200 dark:border-blue-900/50">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <img 
                                    className="w-5 h-5 rounded-full object-cover" 
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8LgPk2n0pUrQjglvJfkMlD8BxQhGvUaveZhJfCcV_0W9HzwOZjYmnVuux1HJqvCOjYL6G1NXxSsqVp9zQqy2WKg3h_L1bWc_7JFCREPeANe7c1k2x1Xk2kUhsYLlGRS3NoCq1uDe9tzmmXEB2MdxRLzc6r5up8-I_j-pvHyaZXPh591pTTnQdsxPBKYXNwuBnS5NUJyCyWa0fwNhA9kRN94aJS2xDojMvozM6e54t__0oSFZkApInOu36b2j1gtvFVDRSFZnRgYw"
                                    alt="Customer"
                                />
                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Alex Rivers • Yesterday</span>
                            </div>
                            <p className="text-xs text-zinc-800 dark:text-zinc-200 italic">
                                "The dashboard integration was smooth, but I'm having trouble with the automated moderation filters on custom tags."
                            </p>
                        </section>

                        {/* Visibility Selector */}
                        <section>
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Visibility Mode</label>
                            <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                                <button 
                                    className={`flex items-center justify-center gap-1.5 py-1 rounded-md transition-all text-xs font-bold ${visibility === 'public' ? 'bg-white dark:bg-zinc-900 text-[var(--primary)] dark:text-blue-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    onClick={() => setVisibility('public')}
                                >
                                    <Globe className="w-3.5 h-3.5" /> Public Reply
                                </button>
                                <button 
                                    className={`flex items-center justify-center gap-1.5 py-1 rounded-md transition-all text-xs font-bold ${visibility === 'internal' ? 'bg-white dark:bg-zinc-900 text-[var(--primary)] dark:text-blue-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    onClick={() => setVisibility('internal')}
                                >
                                    <Lock className="w-3.5 h-3.5" /> Internal Note
                                </button>
                            </div>
                        </section>

                        {/* Rich Text Editor */}
                        <section className="flex flex-col h-48 border border-zinc-200 dark:border-zinc-700 rounded-lg focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)] transition-all overflow-hidden bg-white dark:bg-zinc-900">
                            {/* Toolbar */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/80 p-1 border-b border-zinc-200 dark:border-zinc-700 flex gap-0.5">
                                <button className="w-6.5 h-6.5 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300">
                                    <Bold className="w-3.5 h-3.5" />
                                </button>
                                <button className="w-6.5 h-6.5 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300">
                                    <Italic className="w-3.5 h-3.5" />
                                </button>
                                <button className="w-6.5 h-6.5 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300">
                                    <List className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-600 my-auto mx-1.5"></div>
                                <button className="w-6.5 h-6.5 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                </button>
                                <button className="w-6.5 h-6.5 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[var(--primary)] dark:text-blue-400">
                                    <Wand2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            
                            {/* Editable Area */}
                            <div 
                                className="flex-1 p-2.5 text-xs focus:outline-none overflow-y-auto text-zinc-900 dark:text-zinc-50"
                                contentEditable="true"
                                suppressContentEditableWarning={true}
                                onInput={handleInput}
                            >
                                {content}
                            </div>
                            
                            {/* Character Counter */}
                            <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800/80 flex justify-end border-t border-zinc-200 dark:border-zinc-700">
                                <span className={`text-[10px] font-bold ${isOverLimit ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    {charCount} / 1000
                                </span>
                            </div>
                        </section>
                    </div>

                    {/* Footer Actions */}
                    <footer className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-2">
                        <button 
                            className="w-full sm:flex-1 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98] duration-75"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            className="w-full sm:flex-[2] py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98] duration-75 flex items-center justify-center gap-1.5"
                            onClick={onClose}
                        >
                            <Send className="w-3.5 h-3.5" /> Send Reply
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default ReplyReview;
