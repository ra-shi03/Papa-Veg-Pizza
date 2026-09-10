import React, { useState } from 'react';
import { Gavel, X, ChevronDown, Trash2, CheckCircle2 } from 'lucide-react';

const RejectReviewModal = ({ isOpen, onClose, reviewId }) => {
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [error, setError] = useState(false);

    if (!isOpen && !showToast) return null;

    const handleConfirm = () => {
        if (!reason) {
            setError(true);
            return;
        }
        
        setIsProcessing(true);
        setError(false);
        
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            setShowToast(true);
            onClose(); // Close modal visually
            
            // Hide toast after 3 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        }, 1000);
    };

    const handleReasonChange = (e) => {
        setReason(e.target.value);
        if (e.target.value) {
            setError(false);
        }
    };

    return (
        <>
            {/* Modal Backdrop and Content */}
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-[80] bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                        onClick={onClose}
                    ></div>

                    {/* Mobile Modal Container */}
                    <div className="fixed bottom-0 left-0 right-0 z-[90] transform transition-transform duration-300 ease-out sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95">
                        <div className="bg-white dark:bg-zinc-900 rounded-t-xl sm:rounded-xl shadow-xl overflow-hidden border-t sm:border border-zinc-200 dark:border-zinc-800">
                            {/* Handle for mobile "sheet" feel */}
                            <div className="flex justify-center py-1.5 sm:hidden">
                                <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                            </div>

                            {/* Modal Header */}
                            <div className="px-4 pb-2.5 pt-1.5 sm:pt-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Gavel className="w-5 h-5 text-red-500" />
                                    <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reject Review</h2>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-4 py-3 flex flex-col gap-4">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Rejecting this review will move it to the Moderation folder. This action cannot be undone from the public feed.
                                    {reviewId && <span className="block mt-0.5 font-semibold text-[10px]">Review ID: {reviewId}</span>}
                                </p>

                                {/* Form Fields */}
                                <div className="flex flex-col gap-3">
                                    {/* Dropdown Field */}
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="rejection-reason" className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">
                                            Rejection Reason
                                        </label>
                                        <div className="relative">
                                            <select 
                                                id="rejection-reason" 
                                                value={reason}
                                                onChange={handleReasonChange}
                                                className={`w-full bg-zinc-50 dark:bg-zinc-800/50 border ${error ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-lg px-3 py-1.5 appearance-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-50 transition-all text-xs font-medium`}
                                            >
                                                <option disabled value="">Select a reason...</option>
                                                <option value="spam">Spam or Misleading</option>
                                                <option value="profanity">Inappropriate Language</option>
                                                <option value="personal">Personal Information</option>
                                                <option value="irrelevant">Off-topic/Irrelevant</option>
                                                <option value="other">Other Reason</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                                        </div>
                                    </div>

                                    {/* Textarea Field */}
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="internal-note" className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">
                                            Internal Note (Optional)
                                        </label>
                                        <textarea 
                                            id="internal-note" 
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Describe why this review was rejected..." 
                                            rows="3"
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-50 transition-all resize-none text-xs placeholder:text-zinc-400"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                                <button 
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    disabled={isProcessing}
                                    className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Reject Review
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Notification Toast */}
            {showToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
                    <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 dark:text-green-500" />
                        <span className="text-xs font-medium">Review {reviewId} has been rejected</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default RejectReviewModal;
