import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Settings as SettingsIcon, Package, Users, UtensilsCrossed, Store, Building2, Utensils, Grid, PlusCircle, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@food/components/ui/dialog"
import PanelNavbar from "@food/components/PanelNavbar"
import { clearModuleAuth, getModuleRefreshToken, getCurrentUser } from "@food/utils/auth"
import { adminAPI } from "@food/api"
import Profile from "../profile/Profile"

// Super admin top bar (Jharkhand Rasoi admin header): maintenance switch, universal search over orders, customers,
// stores, products, categories and add-ons, low-stock alerts, and the profile menu.

const SA = "/food/superadmin"
const RESULT_ICON = { Order: Package, User, Store: Building2, Product: Utensils, Category: Grid, Addon: PlusCircle }

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const admin = getCurrentUser("admin")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleLogout = async () => {
    try {
      const token = getModuleRefreshToken("admin")
      if (token) await adminAPI.logout(token).catch(() => null)
    } finally {
      clearModuleAuth("admin")
      navigate("/superadmin/login", { replace: true })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) return toast.error("Please fill in all fields")
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error("Passwords do not match")
    setIsChangingPassword(true)
    try {
      await adminAPI.changeAdminPassword({ ...passwordData })
      toast.success("Password updated successfully!")
      setShowSettingsModal(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <>
      <PanelNavbar
        fixed
        onToggleSidebar={onToggleSidebar}
        homePath={`${SA}/dashboard`}
        canToggleMaintenance
        recentKey="superadmin_recent_searches"
        search={async (q) => {
          const res = await adminAPI.globalSearch(q)
          return (res?.data?.data || []).map((r) => ({ ...r, icon: RESULT_ICON[r.type] }))
        }}
        quickActions={[
          { icon: Package, label: "Orders", path: `${SA}/orders` },
          { icon: Users, label: "Customers", path: `${SA}/customers` },
          { icon: UtensilsCrossed, label: "Products", path: `${SA}/products` },
          { icon: Store, label: "Stores", path: `${SA}/franchise-stores` },
        ]}
        loadAlerts={async () => {
          const res = await adminAPI.getDashboardInventoryAlerts({})
          return (res?.data?.data || []).map((a) => ({
            id: a.id,
            title: `Low stock: ${a.ingredient}`,
            detail: `${a.store}: ${a.currentStock} ${a.unit} left (reorder at ${a.reorderLevel})`,
            tag: a.severity || "alert",
            critical: a.severity === "critical",
          }))
        }}
        alertsSubtitle="Low-stock alerts from all stores"
        alertsPath={`${SA}/dashboard`}
        user={{ name: admin?.name || "Super Admin", email: admin?.email, profileImage: admin?.profileImage }}
        menuItems={[
          { icon: User, label: "Profile", onClick: () => setShowProfileModal(true) },
          { icon: SettingsIcon, label: "Settings", onClick: () => setShowSettingsModal(true) },
        ]}
        onLogout={handleLogout}
      />

      {showProfileModal && <Profile onClose={() => setShowProfileModal(false)} />}

      {/* Change password */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-sm p-0 bg-white border border-neutral-200">
          <DialogHeader className="px-6 py-4 border-b border-neutral-200">
            <DialogTitle className="text-lg font-semibold text-neutral-900">Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Change Password</h3>
            {[
              ["currentPassword", "Current Password", "Enter current password"],
              ["newPassword", "New Password", "Enter new password"],
              ["confirmPassword", "Confirm Password", "Confirm new password"],
            ].map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">{label}</label>
                <input
                  type="password"
                  value={passwordData[key]}
                  onChange={(e) => setPasswordData((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]"
                />
              </div>
            ))}
            <div className="pt-2 flex gap-3">
              <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 px-6 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isChangingPassword} className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-70">
                {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
