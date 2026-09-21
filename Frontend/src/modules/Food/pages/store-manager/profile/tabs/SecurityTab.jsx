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
        confirmPassword: passwordState.confirmPassword,
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

      {/* Active sessions and confirm modal removed */}
    </div>
  );
}
