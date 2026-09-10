import React, { useState, useEffect } from "react";
import { X, User, Mail, Shield, Camera, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, setAuthData, getModuleToken, getModuleRefreshToken } from "@food/utils/auth";
import { toast } from "sonner";
// Import your API if there's an update profile endpoint, for now we will simulate or use adminAPI if available.

export default function Profile({ onClose }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    // Fetch user from auth utils
    const currentUser = getCurrentUser("admin");
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name || "Global Manager",
        email: currentUser.email || "manager@papaveg.com",
        phone: currentUser.phone || "+91 9876543210",
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call for now. If you have an endpoint, call it here.
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = { ...user, ...formData };
      const token = getModuleToken("admin");
      const refreshToken = getModuleRefreshToken("admin");
      
      // Update local storage
      setAuthData("admin", token, updatedUser, refreshToken);
      setUser(updatedUser);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      
      // Force reload to update Navbar avatar/name if needed (or use event dispatcher)
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">My Profile</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative group mb-3">
                <div className="w-24 h-24 rounded-full border-4 border-zinc-50 dark:border-zinc-800 overflow-hidden shadow-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <User size={40} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-[var(--primary)] text-white rounded-full shadow-md hover:bg-[var(--primary)]/90 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200">
                  <Camera size={14} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{user?.name || "Global Manager"}</h3>
              <p className="text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full mt-1.5">
                {user?.role?.toUpperCase() || "SUPERADMIN"}
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all disabled:opacity-70"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all disabled:opacity-70"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Role / Access Level</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={user?.role || "superadmin"}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 pl-1">Role cannot be changed manually.</p>
              </div>

              <div className="pt-4 flex gap-3">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--primary)]/20 hover:bg-[var(--primary)]/90 transition-all active:scale-[0.98]"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                      className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--primary)]/20 hover:bg-[var(--primary)]/90 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
