import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { User, Briefcase, Shield, Award, Calendar, Bell, Activity, Key, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { profileApi, adminAPI } from "@food/api";

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
      // Fetch real store manager profile data using adminAPI which queries StoreManager & Profile collections
      const res = await adminAPI.getAdminProfile();
      if (res && res.data && (res.data.admin || res.data.data?.admin)) {
        const adminData = res.data.admin || res.data.data?.admin;
        
        // Map backend admin/storeManager profile to the structure the UI expects
        const mappedProfile = {
           user: {
             fullName: adminData.name || adminData.fullName || "",
             email: adminData.email || "",
             phone: adminData.phone || adminData.mobile || "",
             gender: adminData.personalDetails?.gender || "Not Specified",
             dateOfBirth: adminData.personalDetails?.dateOfBirth || "Not Specified",
             address: adminData.personalDetails?.address || "Not Specified",
             employeeId: adminData.employeeCode || "Not Specified",
             designation: "Store Operations Manager",
             role: adminData.role || currentRole || "store_manager",
             storeName: adminData.storeName || "Assigned Store Hub",
             storeAddress: adminData.storeAddress || null,
             joiningDate: adminData.joinedDate ? new Date(adminData.joinedDate).toLocaleDateString() : "N/A",
             status: adminData.status || "Active",
             lastLogin: adminData.lastLoginAt ? new Date(adminData.lastLoginAt).toLocaleString() : "N/A",
             profileImage: adminData.profileImage || null,
             reportingManager: adminData.reportingManager || "N/A",
             emergencyContact: adminData.personalDetails?.emergencyContact ? {
                 name: adminData.personalDetails?.emergencyContactName || "N/A",
                 phone: adminData.personalDetails?.emergencyContact || "N/A",
                 relation: adminData.personalDetails?.emergencyContactRelation || "N/A",
             } : null
           },
           store: { 
             name: adminData.storeName || "Papa Veg Pizza", 
             address: adminData.storeAddress || adminData.storeDetails?.address || "N/A", 
             openingTime: adminData.storeDetails?.openingTime || "11 AM", 
             closingTime: adminData.storeDetails?.closingTime || "11 PM", 
             managerName: adminData.name 
           },
           attendanceSummary: { attendanceRate: 100, presentDays: 25, absentDays: 0, totalHours: 200, lateEntries: 0 },
           performanceSummary: { ordersManaged: 0, avgPrepTime: "N/A", delayedOrders: 0, customerComplaints: 0, performanceRating: 5, yearsOfService: 1 },
        };
        
        setProfileData(mappedProfile);
      } else {
        // Fallback to mock if structure is missing
        const fallbackRes = await profileApi.getProfile();
        if (fallbackRes.success) setProfileData(fallbackRes.data);
      }
    } catch (err) {
      // Fallback on error
      const fallbackRes = await profileApi.getProfile();
      if (fallbackRes.success) setProfileData(fallbackRes.data);
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
        return <WorkInfoTab user={profileData?.user} store={profileData?.store} />;
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

          <div className="flex flex-wrap lg:flex-col gap-2 lg:gap-1 pb-2 lg:pb-0">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-auto lg:w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all shrink-0 lg:shrink whitespace-nowrap active:scale-[0.98] ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-zinc-200"
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
