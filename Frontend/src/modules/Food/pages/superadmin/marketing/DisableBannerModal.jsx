import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { apiGetBannerById, apiUpdateBanner } from './BannersData';

export default function DisableBannerModal({ bannerId, isOpen, onClose, onDisabled }) {
  const [loading, setLoading] = useState(false);
  const [bannerName, setBannerName] = useState('');

  useEffect(() => {
    if (isOpen && bannerId) {
      apiGetBannerById(bannerId)
        .then(data => setBannerName(data.title))
        .catch(() => setBannerName(''));
    }
  }, [isOpen, bannerId]);

  if (!isOpen) return null;

  const handleDisable = async () => {
    setLoading(true);
    try {
      await apiUpdateBanner(bannerId, { isActive: false });
      setLoading(false);
      onDisabled && onDisabled();
      onClose();
    } catch (err) {
      setLoading(false);
      alert('Failed to disable: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="p-3 bg-amber-100 dark:bg-amber-950/20 text-amber-500 rounded-full mb-4">
          <AlertCircle size={24} />
        </div>
        
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Disable Banner</h3>
        
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
          Are you sure you want to disable "{bannerName || 'this banner'}"? It will be taken offline immediately from all target stores.
        </p>

        <div className="flex gap-3 mt-6 w-full text-xs font-bold">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDisable}
            disabled={loading}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Disabling...
              </>
            ) : (
              'Confirm Disable'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
