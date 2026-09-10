import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Users, Lock } from 'lucide-react';

export default function SavedFilterModal({ isOpen, onClose, onSave }) {
  const [presetName, setPresetName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private'); // 'private' | 'shared'

  useEffect(() => {
    if (!isOpen) {
      setPresetName('');
      setDescription('');
      setVisibility('private');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!presetName.trim()) return;

    onSave({
      name: presetName,
      description,
      visibility,
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-55 flex items-center gap-1.5">
              <Save className="text-[var(--primary)] shrink-0" size={18} />
              Save Filter Preset
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
              Save current filters as a reusable configuration preset
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="p-4 space-y-4">
          <form id="savePresetForm" onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            
            {/* Preset Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                Preset Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., Critical Payment Failures"
                className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                Description
              </label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this filter configuration tracks..."
                className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium resize-none leading-relaxed"
              />
            </div>

            {/* Visibility Settings */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                Visibility Scope
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                    visibility === 'private'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300'
                  }`}
                >
                  <Lock size={16} />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Private</span>
                    <span className="text-[8.5px] opacity-75 font-medium leading-tight block">Only visible to you</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('shared')}
                  className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                    visibility === 'shared'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300'
                  }`}
                >
                  <Users size={16} />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Team Shared</span>
                    <span className="text-[8.5px] opacity-75 font-medium leading-tight block">Available to all admins</span>
                  </div>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-350 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="savePresetForm"
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Save Preset
          </button>
        </footer>
      </div>
    </div>
  );
}
