import React, { useState } from 'react';
import { 
    UserPlus, X, ChevronDown, Search, 
    ChevronsDown, GripHorizontal, ChevronsUp, 
    AlertCircle, Loader2, Check 
} from 'lucide-react';

const AssignFeedback = ({ isOpen, onClose, reviewId }) => {
    const [priority, setPriority] = useState('medium');
    const [team, setTeam] = useState('');
    const [assignee, setAssignee] = useState('');
    const [note, setNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAssigned, setIsAssigned] = useState(false);

    if (!isOpen) return null;

    const handleAssign = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        
        setTimeout(() => {
            setIsProcessing(false);
            setIsAssigned(true);
            setTimeout(() => {
                onClose();
                // Reset state after close animation
                setTimeout(() => {
                    setIsAssigned(false);
                    setTeam('');
                    setAssignee('');
                    setNote('');
                    setPriority('medium');
                }, 300);
            }, 1000);
        }, 1200);
    };

    return (
        <>
            {/* Backdrop & Modal Container */}
            <div 
                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            >
                {/* Modal Content */}
                <div 
                    className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle for mobile */}
                    <div className="w-full flex justify-center py-1.5 sm:hidden">
                        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                    </div>

                    {/* Modal Header */}
                    <div className="flex justify-between items-center px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                            <UserPlus className="w-5 h-5 text-[var(--primary)] dark:text-blue-400" />
                            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Assign Feedback</h2>
                        </div>
                        <button 
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500 dark:text-zinc-400" 
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form className="p-3.5 space-y-4 max-h-[70vh] sm:max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
                        {/* Feedback Summary Preview */}
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 mb-1.5">
                            <div className="flex gap-2.5">
                                <img 
                                    alt="Customer Avatar" 
                                    className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm" 
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeQ8kBSPUEpgIOmkXBp1pL1kpUsBkK9k88fa83qQSBvRiyspopukwiX-rI3HwmB5B-mySNcu1HAR0ulCiQIWBlHGlxMnjIGxdpeH4BuIys0rtnWjOj20nK7fEfMog-RvCQZBeSyRLGnSjAceKqytqe6k3NYGaLpZxf5wdvLIVdEuoeJ9jVLEK4QsiNFv7ysXjUMvDcOma1nnbJKxz9VaYa7mdKbeTNhgYUT1IdkfaooWAi-UJQ5-V8k-oL2MgfuzdX_j_hGrRA49I"
                                />
                                <div>
                                    <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">REVIEW {reviewId || '#4829'}</p>
                                    <p className="text-xs text-zinc-900 dark:text-zinc-50 mt-0.5 line-clamp-2">"The dashboard loading speed could be improved for large datasets..."</p>
                                </div>
                            </div>
                        </div>

                        {/* Team Dropdown */}
                        <div className="space-y-1 group">
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-1 transition-colors group-focus-within:text-[var(--primary)] dark:group-focus-within:text-blue-400">
                                TEAM
                            </label>
                            <div className="relative">
                                <select 
                                    value={team}
                                    onChange={(e) => setTeam(e.target.value)}
                                    className="w-full h-8.5 px-3 appearance-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                                >
                                    <option disabled value="">Select a team</option>
                                    <option value="support">Support</option>
                                    <option value="product">Product</option>
                                    <option value="marketing">Marketing</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 w-4 h-4" />
                            </div>
                        </div>

                        {/* Assignee Dropdown */}
                        <div className="space-y-1 group">
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider transition-colors group-focus-within:text-[var(--primary)] dark:group-focus-within:text-blue-400">
                                ASSIGNEE
                            </label>
                            <div className="relative">
                                <select 
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full h-8.5 px-3 appearance-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-50 font-medium"
                                >
                                    <option disabled value="">Search team members</option>
                                    <option value="alex">Alex Rivera (Lead)</option>
                                    <option value="jordan">Jordan Smith</option>
                                    <option value="casey">Casey Chen</option>
                                </select>
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 w-4 h-4" />
                            </div>
                        </div>

                        {/* Priority Selector */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
                                PRIORITY LEVEL
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {/* Low */}
                                <label className="cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="priority" 
                                        value="low" 
                                        className="sr-only peer" 
                                        checked={priority === 'low'}
                                        onChange={() => setPriority('low')}
                                    />
                                    <div className="flex flex-col items-center justify-center p-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-all peer-checked:bg-blue-100 peer-checked:border-blue-500 peer-checked:text-blue-700 dark:peer-checked:bg-blue-900/30 dark:peer-checked:text-blue-400 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                        <ChevronsDown className="w-4 h-4" />
                                        <span className="text-[9px] font-bold mt-1 tracking-wider">LOW</span>
                                    </div>
                                </label>
                                
                                {/* Medium */}
                                <label className="cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="priority" 
                                        value="medium" 
                                        className="sr-only peer" 
                                        checked={priority === 'medium'}
                                        onChange={() => setPriority('medium')}
                                    />
                                    <div className="flex flex-col items-center justify-center p-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-all peer-checked:bg-[var(--primary)]/10 peer-checked:border-[var(--primary)] peer-checked:text-[var(--primary)] dark:peer-checked:bg-blue-900/40 dark:peer-checked:text-blue-400 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                        <GripHorizontal className="w-4 h-4" />
                                        <span className="text-[9px] font-bold mt-1 tracking-wider">MEDIUM</span>
                                    </div>
                                </label>
                                
                                {/* High */}
                                <label className="cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="priority" 
                                        value="high" 
                                        className="sr-only peer" 
                                        checked={priority === 'high'}
                                        onChange={() => setPriority('high')}
                                    />
                                    <div className="flex flex-col items-center justify-center p-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-all peer-checked:bg-orange-100 peer-checked:border-orange-500 peer-checked:text-orange-600 dark:peer-checked:bg-orange-900/30 dark:peer-checked:text-orange-400 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                        <ChevronsUp className="w-4 h-4" />
                                        <span className="text-[9px] font-bold mt-1 tracking-wider">HIGH</span>
                                    </div>
                                </label>
                                
                                {/* Urgent */}
                                <label className="cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="priority" 
                                        value="urgent" 
                                        className="sr-only peer" 
                                        checked={priority === 'urgent'}
                                        onChange={() => setPriority('urgent')}
                                    />
                                    <div className="flex flex-col items-center justify-center p-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-all peer-checked:bg-red-100 peer-checked:border-red-500 peer-checked:text-red-600 dark:peer-checked:bg-red-900/30 dark:peer-checked:text-red-400 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-[9px] font-bold mt-1 tracking-wider">URGENT</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Internal Note */}
                        <div className="space-y-1 group">
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider transition-colors group-focus-within:text-[var(--primary)] dark:group-focus-within:text-blue-400">
                                INTERNAL NOTE
                            </label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none resize-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400" 
                                placeholder="Add context for the assignee..." 
                                rows="2"
                            ></textarea>
                        </div>
                    </form>

                    {/* Sticky Footer Actions */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 flex flex-col sm:flex-row gap-2 sm:justify-end border-t border-zinc-200 dark:border-zinc-800">
                        <button 
                            className="h-8.5 px-4 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors order-2 sm:order-1"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            className={`h-8.5 px-4 rounded-lg text-xs font-bold text-white shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all order-1 sm:order-2 flex items-center justify-center gap-1.5 ${
                                isAssigned 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-[var(--primary)] hover:bg-blue-700'
                            } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            onClick={handleAssign}
                            disabled={isProcessing || isAssigned}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isAssigned ? (
                                <>
                                    <Check className="w-4 h-4" /> Assigned
                                </>
                            ) : (
                                'Assign Feedback'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AssignFeedback;
