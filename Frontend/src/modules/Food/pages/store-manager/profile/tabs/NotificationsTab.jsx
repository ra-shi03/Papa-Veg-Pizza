import React, { useState, useEffect } from "react";
import { Bell, ShieldCheck, Mail, Smartphone, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "@food/api";

// Premium Custom Switch Component (ShadCN design)
const Switch = ({ id, checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-[var(--primary)]" : "bg-zinc-200 dark:bg-zinc-800"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default function NotificationsTab({ initialNotifications = {} }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    orderAlerts: true,
    inventoryAlerts: true,
    shiftAlerts: false,
    complaintAlerts: true,
    dailyReports: true,
    smsAlerts: false,
    pushNotifications: true,
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setFetching(true);
        const res = await profileApi.getProfile();
        if (res.success && res.data?.notifications) {
          setSettings(res.data.notifications);
        }
      } catch (err) {
        console.error("Failed to load notifications preferences", err);
      } finally {
        setFetching(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await profileApi.updateNotifications(settings);
      if (res.success) {
        toast.success("Notification preferences saved successfully.");
      } else {
        toast.error("Failed to update preferences.");
      }
    } catch (err) {
      toast.error("An error occurred while saving preferences.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center h-12 bg-zinc-50 dark:bg-zinc-950 rounded-lg p-3" />
        ))}
      </div>
    );
  }

  const notificationSections = [
    {
      title: "Store & Order Alerts",
      description: "Receive immediate triggers when critical store events occur.",
      items: [
        { key: "orderAlerts", label: "New Incoming Orders", sub: "Trigger notifications for online and POS order inflows" },
        { key: "inventoryAlerts", label: "Low Inventory Stock Alerts", sub: "Notify when dough, cheese, or toppings hit low levels" },
        { key: "shiftAlerts", label: "Shift Roster Dispatches", sub: "Alert when weekly kitchen schedules are updated" },
        { key: "complaintAlerts", label: "Customer Complaints & Reviews", sub: "Immediate notification for review scores below 3 stars" },
      ],
    },
    {
      title: "Operational Summaries",
      description: "Scheduled reports and status notifications.",
      items: [
        { key: "dailyReports", label: "Daily Store Sales Reports", sub: "Email summary of revenues, waste volumes, and staff clock-ins" },
      ],
    },
    {
      title: "Notification Channels",
      description: "Preferred delivery methods for critical alerts.",
      items: [
        { key: "smsAlerts", label: "Direct SMS Alerts", sub: "Send text alerts to +91 98765 43210 for emergency incidents" },
        { key: "pushNotifications", label: "In-Browser Push Notifications", sub: "Popup warnings in the admin operations dashboard" },
      ],
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <Bell size={16} className="text-[var(--primary)]" />
        <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
          Notification Preferences
        </h2>
      </div>

      {/* INFORMATION BANNER */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 flex items-start gap-2.5">
        <Info size={14} className="text-[var(--secondary)] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
            Real-Time Push Alerts
          </p>
          <p className="text-[9px] font-medium text-slate-450 dark:text-zinc-500 leading-normal">
            For critical alerts (such as system failures or low critical stock), push notifications will bypass these toggles to ensure store operational integrity.
          </p>
        </div>
      </div>

      {/* SECTIONS & TOGGLES */}
      <div className="space-y-6">
        {notificationSections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-3">
            <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-1">
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                {section.title}
              </h3>
              <p className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
                {section.description}
              </p>
            </div>

            <div className="space-y-2">
              {section.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850/80 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-950/40"
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <label htmlFor={item.key} className="text-xs font-bold text-slate-850 dark:text-zinc-200 cursor-pointer">
                      {item.label}
                    </label>
                    <p className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 leading-normal">
                      {item.sub}
                    </p>
                  </div>
                  <Switch
                    id={item.key}
                    checked={settings[item.key]}
                    onChange={() => handleToggle(item.key)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SAVE BUTTON */}
      <div className="flex items-center justify-end pt-3 border-t border-zinc-50 dark:border-zinc-800/60">
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
}
