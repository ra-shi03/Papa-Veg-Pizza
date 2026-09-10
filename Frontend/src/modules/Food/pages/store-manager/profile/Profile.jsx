import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { User, Briefcase, Shield, Award, Calendar, Bell, Activity, Key, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "@food/api";

// Component imports
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";
import PersonalInfoTab from "./tabs/PersonalInfoTab";
import WorkInfoTab from "./tabs/WorkInfoTab";
import PermissionsTab from "./tabs/PermissionsTab";
import PerformanceTab from "./tabs/PerformanceTab";
import AttendanceTab from "./tabs/AttendanceTab";
import NotificationsTab from "./tabs/NotificationsTab";
import ActivityLogsTab from "./tabs/ActivityLogsTab";
import SecurityTab from "./tabs/SecurityTab";

export default function Profile({ forcedRole }) {
  const { role: contextRole, onRoleChange } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  
  // Trigger editing inside PersonalInfoTab from Header button
  const [triggerPersonalEdit, setTriggerPersonalEdit] = useState(false);

  // Demo state for role testing (Stored in localStorage to sync with mock service)
  const [currentRole, setCurrentRole] = useState(() => {
    if (forcedRole) return forcedRole;
    return contextRole || localStorage.getItem("store_role") || "store_manager";
  });

  // Keep in sync with contextRole if not forced
  useEffect(() => {
    if (!forcedRole && contextRole) {
      setCurrentRole(contextRole);
    }
  }, [contextRole, forcedRole]);

  // Sync forcedRole to parent layout when test routes are loaded
  useEffect(() => {
    if (forcedRole && onRoleChange && contextRole !== forcedRole) {
      onRoleChange(forcedRole);
    }
  }, [forcedRole, contextRole, onRoleChange]);

  // Sync back to local storage so profileApi mock can read the correct role
  useEffect(() => {
    localStorage.setItem("demo_user_role", currentRole);
  }, [currentRole]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileApi.getProfile();
      if (res.success) {
        setProfileData(res.data);
      } else {
        toast.error("Failed to load profile details.");
      }
    } catch (err) {
      toast.error("An error occurred while loading profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentRole]); // Re-fetch/re-render when demo role changes

  const handleRoleChange = (role) => {
    localStorage.setItem("demo_user_role", role);
    setCurrentRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
    toast.info(`Switched view to: ${role === "store_manager" ? "Store Manager" : role === "kitchen_supervisor" ? "Kitchen Supervisor" : "Kitchen Staff"}`);
    
    // Safety check: if active tab gets hidden for kitchen staff, reset to personal info
    if (role === "kitchen_staff" && (activeTab === "permissions" || activeTab === "activity")) {
      setActiveTab("personal");
    }
  };

  const handlePhotoUpload = async (file) => {
    try {
      toast.loading("Uploading profile image...", { id: "photo-upload" });
      
      // Simulate API file upload
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        // Update local state and mock storage
        localStorage.setItem("pvp_profile_photo", base64String);
        
        setProfileData((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            user: { ...prev.user, profileImage: base64String },
          };
          // Persist in localStorage mock data too
          const storeData = JSON.parse(localStorage.getItem("pvp_store_profile_data") || "{}");
          if (storeData.user) {
            storeData.user.profileImage = base64String;
            localStorage.setItem("pvp_store_profile_data", JSON.stringify(storeData));
          }
          return updated;
        });

        toast.success("Profile photo uploaded successfully.", { id: "photo-upload" });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to upload photo.", { id: "photo-upload" });
    }
  };

  const handlePersonalSaveSuccess = (updatedUser) => {
    setProfileData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        user: { ...prev.user, ...updatedUser },
      };
    });
  };

  // RBAC Tab visibility configurations
  const getTabConfig = () => {
    const isKitchenStaff = currentRole === "kitchen_staff";

    return [
      { id: "personal", label: "Personal Information", icon: User, show: true },
      { id: "work", label: "Work Information", icon: Briefcase, show: true },
      { id: "permissions", label: "Permissions", icon: Shield, show: !isKitchenStaff },
      { id: "performance", label: isKitchenStaff ? "My Performance" : "Performance", icon: Award, show: true },
      { id: "attendance", label: "Attendance", icon: Calendar, show: true },
      { id: "notifications", label: "Notifications", icon: Bell, show: true },
      { id: "activity", label: "Activity Logs", icon: Activity, show: !isKitchenStaff },
      { id: "security", label: "Security", icon: Key, show: true },
    ].filter((tab) => tab.show);
  };

  const visibleTabs = getTabConfig();

  // Render correct tab component
  const renderTabContent = () => {
    const commonProps = {
      user: profileData?.user,
      role: currentRole,
    };

    switch (activeTab) {
      case "personal":
        return (
          <PersonalInfoTab
            user={profileData?.user}
            onSaveSuccess={handlePersonalSaveSuccess}
            isEditingDirect={triggerPersonalEdit}
            clearDirectEdit={() => setTriggerPersonalEdit(false)}
          />
        );
      case "work":
        return <WorkInfoTab />;
      case "permissions":
        return <PermissionsTab />;
      case "performance":
        return <PerformanceTab userRole={currentRole} />;
      case "attendance":
        return <AttendanceTab />;
      case "notifications":
        return <NotificationsTab />;
      case "activity":
        return <ActivityLogsTab />;
      case "security":
        return <SecurityTab />;
      default:
        return <PersonalInfoTab user={profileData?.user} />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* 1. DEMO ROLE SWITCH PANEL */}
      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <AlertCircle size={15} className="text-[var(--primary)] shrink-0 animate-bounce" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
              RBAC Tester (Demo Console)
            </span>
            <p className="text-[9px] font-medium text-slate-450 dark:text-zinc-500">
              Toggle roles below to dynamically test tabs visibility and profile metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { id: "store_manager", label: "Store Manager" },
            { id: "kitchen_supervisor", label: "Supervisor" },
            { id: "kitchen_staff", label: "Kitchen Staff" },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleChange(role.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider transition-all border active:scale-[0.98] ${
                currentRole === role.id
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-350 border-zinc-250 dark:border-zinc-750 hover:bg-zinc-50"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PROFILE HEADER (Avatar & Basic Meta details) */}
      <ProfileHeader
        user={profileData?.user}
        onPhotoUpload={handlePhotoUpload}
        onEditProfile={() => {
          setActiveTab("personal");
          setTriggerPersonalEdit(true);
        }}
        onChangePassword={() => {
          setActiveTab("security");
        }}
        loading={loading}
      />

      {/* 3. PROFILE DASHBOARD KPI CARDS */}
      <ProfileStats
        attendanceSummary={profileData?.attendanceSummary}
        performanceSummary={profileData?.performanceSummary}
        loading={loading}
      />

      {/* 4. TABS AND DETAILS SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT NAVIGATION TABS LIST */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-2xl shadow-sm space-y-1">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2 px-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Profile Sections
            </span>
          </div>

          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-1 scrollbar-thin">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold text-left transition-all shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal active:scale-[0.98] ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950/40 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon size={12} className={isActive ? "text-white" : "text-slate-400"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT ACTIVE TAB CONTENT */}
        <div className="lg:col-span-3 min-h-[400px]">
          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="text-[var(--primary)] animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Loading operations console...</span>
              </div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
}
