import React, { useRef } from "react";
import { Camera, Edit3, Key, Shield, Calendar, Store, Clock } from "lucide-react";

export default function ProfileHeader({
  user = {},
  onEditProfile = () => {},
  onChangePassword = () => {},
  onPhotoUpload = () => {},
  loading = false,
}) {
  const fileInputRef = useRef(null);

  const handlePhotoClick = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoUpload(file);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "store_manager":
        return "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30";
      case "kitchen_supervisor":
        return "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
      case "kitchen_staff":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "store_manager":
        return "Store Manager";
      case "kitchen_supervisor":
        return "Kitchen Supervisor";
      case "kitchen_staff":
      default:
        return "Kitchen Staff";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 animate-pulse flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Left Side Skeleton */}
        <div className="flex flex-col items-center gap-3 w-full md:w-auto shrink-0">
          <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
        {/* Center Skeleton */}
        <div className="flex-1 space-y-3 w-full">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="grid grid-cols-2 gap-2 max-w-md pt-2">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm">
      
      {/* LEFT SIDE: Profile Photo & Direct Tab Action Buttons */}
      <div className="flex flex-col items-center gap-3 w-full md:w-auto shrink-0 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 pb-5 md:pb-0 md:pr-6">
        <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
          <img
            src={user?.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"}
            alt={user?.fullName || "User Avatar"}
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-50 dark:border-zinc-800 shadow-md group-hover:opacity-85 transition-all"
          />
          <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--primary)] text-white shadow-md hover:scale-105 transition-all">
            <Camera size={14} className="stroke-[2.5]" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-1.5 w-full max-w-[160px] mt-1">
          <button
            onClick={onEditProfile}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold border border-zinc-250 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <Edit3 size={11} className="text-[var(--primary)]" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={onChangePassword}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold border border-zinc-250 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <Key size={11} className="text-[var(--secondary)]" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* CENTER: User Profile details */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            {user?.fullName || "Not Specified"}
          </h1>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
              user?.role
            )}`}
          >
            {getRoleLabel(user?.role)}
          </span>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              user?.status === "Active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30"
            }`}
          >
            {user?.status || "Inactive"}
          </span>
        </div>

        <p className="text-xs font-semibold text-[var(--primary)]">
          {user?.designation || "Store Staff"} &bull; ID: <span className="font-mono">{user?.employeeId || "N/A"}</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 pt-2 border-t border-zinc-50 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            <Store size={12} className="text-slate-450" />
            <span>Store: <strong className="text-slate-800 dark:text-zinc-200">{user?.storeName || "N/A"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-450" />
            <span>Joining Date: <strong className="text-slate-800 dark:text-zinc-200">{user?.joiningDate || "N/A"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-slate-450" />
            <span>Reporting To: <strong className="text-slate-800 dark:text-zinc-200">{user?.reportingManager || "N/A"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-slate-450" />
            <span>Last Login: <strong className="text-slate-800 dark:text-zinc-200">{user?.lastLogin || "N/A"}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
