import React, { useState, useEffect } from "react";
import { Key, ShieldAlert, Eye, EyeOff, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "@food/api";
import SessionCard from "../components/SessionCard";

export default function SecurityTab() {
  // Password Form States
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Active Sessions States
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Modals States
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: "", // 'other' or 'all'
    title: "",
    message: "",
  });

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await profileApi.getProfile();
      if (res) {
        const rootData = res.data || res;
        const sessionsList = rootData?.activeSessions || rootData?.data?.activeSessions || [];
        setSessions(Array.isArray(sessionsList) ? sessionsList : []);
      }
    } catch (err) {
      console.error("Failed to load active sessions", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordState((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordState.currentPassword) errors.currentPassword = "Current password is required";
    
    if (!passwordState.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordState.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters long";
    }

    if (!passwordState.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordState.confirmPassword !== passwordState.newPassword) {
      errors.confirmPassword = "New passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) {
      toast.error("Please resolve password errors.");
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await profileApi.changePassword({
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      });

      if (res.success) {
        toast.success("Password changed successfully.");
        setPasswordState({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(res.message || "Failed to change password.");
      }
    } catch (err) {
      toast.error("An error occurred during password updates.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Terminate individual session
  const handleTerminateSession = async (id) => {
    try {
      setTerminatingId(id);
      const res = await profileApi.deleteSession(id);
      if (res.success) {
        toast.success("Session terminated.");
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } else {
        toast.error("Failed to terminate session.");
      }
    } catch (err) {
      toast.error("Error terminating session.");
    } finally {
      setTerminatingId(null);
    }
  };

  // Global Session Terminations
  const triggerGlobalLogout = (type) => {
    if (type === "other") {
      setConfirmModal({
        show: true,
        type: "other",
        title: "Terminate Other Sessions?",
        message: "This will log out your account from all other browsers, mobile devices, and active locations except this device. Do you wish to continue?",
      });
    } else if (type === "all") {
      setConfirmModal({
        show: true,
        type: "all",
        title: "Terminate All Sessions?",
        message: "This will log you out of all devices including this current active browser dashboard. You will need to log back in. Do you wish to continue?",
      });
    }
  };

  const handleConfirmGlobalLogout = async () => {
    const logoutType = confirmModal.type;
    setConfirmModal((prev) => ({ ...prev, show: false }));
    
    try {
      setGlobalLoading(true);
      if (logoutType === "other") {
        const res = await profileApi.logoutOtherSessions();
        if (res.success) {
          toast.success("Other sessions terminated successfully.");
          setSessions((prev) => prev.filter((s) => s.current));
        } else {
          toast.error("Action failed.");
        }
      } else if (logoutType === "all") {
        const res = await profileApi.logoutAllSessions();
        if (res.success) {
          toast.success("All sessions terminated. Logging out...");
          setTimeout(() => {
            // Trigger login redirect
            window.location.reload();
          }, 1500);
        } else {
          toast.error("Action failed.");
        }
      }
    } catch (err) {
      toast.error("An error occurred during global logout.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const inputClass = (fieldName) => `
    w-full text-xs font-semibold pl-3 pr-10 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all
    ${passwordErrors[fieldName] ? "border-red-500 focus:ring-red-500 bg-red-50/20" : "border-zinc-200 dark:border-zinc-800"}
  `;

  return (
    <div className="space-y-4">
      
      {/* SECTION 1: CHANGE PASSWORD FORM */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
          <Key size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Change Account Password
          </h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          {/* Current Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Current Password</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                value={passwordState.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                className={inputClass("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-slate-400 dark:text-zinc-550 hover:text-slate-650 transition-colors"
              >
                {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-[9px] text-red-500 font-bold mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>New Password</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={passwordState.newPassword}
                onChange={handlePasswordChange}
                placeholder="Minimum 8 characters"
                className={inputClass("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 dark:text-zinc-550 hover:text-slate-650 transition-colors"
              >
                {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="text-[9px] text-red-500 font-bold mt-1">{passwordErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Confirm New Password</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={passwordState.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Re-enter new password"
                className={inputClass("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-slate-400 dark:text-zinc-550 hover:text-slate-650 transition-colors"
              >
                {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-[9px] text-red-500 font-bold mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
              {passwordLoading && <Loader2 size={12} className="animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: ACTIVE SESSIONS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--secondary)]" />
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Active Security Sessions
            </h2>
          </div>
          
          {/* Global logs terminations */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerGlobalLogout("other")}
              disabled={sessionsLoading || globalLoading || sessions.length <= 1}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              Logout Other Devices
            </button>
            <button
              onClick={() => triggerGlobalLogout("all")}
              disabled={sessionsLoading || globalLoading || sessions.length === 0}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-650 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center gap-1"
            >
              <Trash2 size={11} />
              <span>Logout All Devices</span>
            </button>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessions.map((sess) => (
              <SessionCard
                key={sess.id}
                session={sess}
                onTerminate={handleTerminateSession}
                terminatingId={terminatingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* CONFIRMATION OVERLAY MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-zinc-950/60 backdrop-blur-sm animate-fade">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-6 shadow-xl max-w-sm w-full space-y-4 animate-scale">
            <div className="flex gap-3 items-start">
              <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} className="stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 leading-normal">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="text-[10px] font-bold px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGlobalLogout}
                className="text-[10px] font-bold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-750 text-white shadow-sm transition-all"
              >
                Confirm Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
