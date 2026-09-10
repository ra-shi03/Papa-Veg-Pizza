import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import { apiGetNotificationById, apiUpdateNotification } from './NotificationData';

export default function RescheduleNotification({ notificationId, isOpen, onClose, onRescheduled }) {
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen && notificationId) {
      setFetching(true);
      apiGetNotificationById(notificationId)
        .then(data => {
          if (data.scheduleAt) {
            const dt = new Date(data.scheduleAt);
            const dateStr = dt.toISOString().slice(0, 10);
            const timeStr = dt.toTimeString().slice(0, 5);
            setScheduleDate(dateStr);
            setScheduleTime(timeStr);
          }
          setFetching(false);
        })
        .catch(() => {
          setFetching(false);
          onClose();
        });
    }
  }, [isOpen, notificationId]);

  if (!isOpen) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTime) return;

    setLoading(true);
    const combinedIso = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

    try {
      await apiUpdateNotification(notificationId, { 
        scheduleAt: combinedIso, 
        status: 'Scheduled' 
      });
      setLoading(false);
      onRescheduled && onRescheduled();
      onClose();
    } catch (err) {
      setLoading(false);
      alert('Failed to reschedule: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar size={16} className="text-[var(--primary)]" />
              Reschedule Notification
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Select a new date and time for distribution</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full"
          >
            <X size={16} />
          </button>
        </div>

        {fetching ? (
          <div className="p-10 flex flex-col justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-semibold text-zinc-500">Fetching scheduled time...</span>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">New Date</label>
                  <div className="relative">
                    <input 
                      type="date"
                      required
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-100 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">New Time</label>
                  <div className="relative">
                    <input 
                      type="time"
                      required
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-100 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl flex gap-2">
                <Clock size={14} className="text-zinc-450 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                  Scheduled notifications will be sent automatically at the selected date and time (IST timezone).
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-2.5">
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </>
                ) : (
                  'Update Schedule'
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
