import React, { useState, useEffect } from "react";
import { XCircle, ArrowRight, CheckCircle, UserCheck } from "lucide-react";

export default function AppFranchiseModal({ isOpen, onClose, selectedApp, onSubmit }) {
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    franchiseName: "",
    commissionRate: "8",
    region: "",
    zone: "",
    territory: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    autoPass: true,
    dbCreate: true,
    sendEmail: true,
    sendPush: true,
  });

  useEffect(() => {
    if (selectedApp && isOpen) {
      setWizardStep(1);
      setWizardData({
        franchiseName: `${selectedApp.companyName || selectedApp.applicantName} Franchise`,
        commissionRate: "8",
        region: selectedApp.region || "",
        zone: selectedApp.zone || "",
        territory: selectedApp.territory || "",
        adminName: selectedApp.applicantName || "",
        adminEmail: selectedApp.email || "",
        adminPhone: selectedApp.phone || "",
        autoPass: true,
        dbCreate: true,
        sendEmail: true,
        sendPush: true,
      });
    }
  }, [selectedApp, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60] flex items-center justify-center p-4 lg:pl-[280px]" id="approve-wizard-modal">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Approve Franchise</h3>
            <p className="text-[10px] font-bold text-[var(--primary)] mt-0.5">{selectedApp?.id} - {selectedApp?.applicantName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
          >
            <XCircle size={18} />
          </button>
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="p-4 flex items-center justify-center gap-2 border-b border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-955/20 select-none">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              wizardStep >= 1 ? "bg-[var(--primary)] text-white" : "bg-zinc-200 text-black"
            }`}>
              1
            </span>
            <span className="text-[10px] font-bold text-black dark:text-zinc-200">Config</span>
          </div>
          <div className="w-10 h-0.5 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              wizardStep >= 2 ? "bg-[var(--primary)] text-white" : "bg-zinc-250 text-black dark:text-zinc-350"
            }`}>
              2
            </span>
            <span className="text-[10px] font-bold text-black dark:text-zinc-200">Admin credentials</span>
          </div>
          <div className="w-10 h-0.5 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              wizardStep >= 3 ? "bg-[var(--primary)] text-white" : "bg-zinc-250 text-black dark:text-zinc-355"
            }`}>
              3
            </span>
            <span className="text-[10px] font-bold text-black dark:text-zinc-200">Final Confirmation</span>
          </div>
        </div>

        {/* Wizard Body content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          
          {/* Step 1: Configuration Validation */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-black dark:text-zinc-100 uppercase tracking-wide">
                Hierarchy & Commission Configuration
              </h4>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Franchise Name</label>
                <input
                  type="text"
                  value={wizardData.franchiseName}
                  onChange={(e) => setWizardData({ ...wizardData, franchiseName: e.target.value })}
                  className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Commission Split (%)</label>
                  <input
                    type="number"
                    value={wizardData.commissionRate}
                    onChange={(e) => setWizardData({ ...wizardData, commissionRate: e.target.value })}
                    className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Requested Region</label>
                  <input
                    type="text"
                    disabled
                    value={wizardData.region}
                    className="mt-1 w-full p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-black dark:text-zinc-300 opacity-80"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Requested Zone</label>
                  <input
                    type="text"
                    disabled
                    value={wizardData.zone}
                    className="mt-1 w-full p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-black dark:text-zinc-300 opacity-80"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Requested Territory</label>
                  <input
                    type="text"
                    disabled
                    value={wizardData.territory}
                    className="mt-1 w-full p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-black dark:text-zinc-300 opacity-80"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Admin Account Credentials */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-black dark:text-zinc-100 uppercase tracking-wide">
                Configure Owner Portal Admin Login
              </h4>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Admin User Full Name</label>
                <input
                  type="text"
                  value={wizardData.adminName}
                  onChange={(e) => setWizardData({ ...wizardData, adminName: e.target.value })}
                  className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Admin Username / Email</label>
                <input
                  type="email"
                  value={wizardData.adminEmail}
                  onChange={(e) => setWizardData({ ...wizardData, adminEmail: e.target.value })}
                  className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Admin Contact Phone</label>
                <input
                  type="text"
                  value={wizardData.adminPhone}
                  onChange={(e) => setWizardData({ ...wizardData, adminPhone: e.target.value })}
                  className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div className="flex items-center gap-2 pt-2 select-none">
                <input
                  type="checkbox"
                  id="auto-pass"
                  checked={wizardData.autoPass}
                  onChange={(e) => setWizardData({ ...wizardData, autoPass: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="auto-pass" className="text-xs font-bold text-black dark:text-zinc-200 cursor-pointer">
                  Auto-generate temporary portal password & send invite
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Final Provisioning Confirmations */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-black dark:text-zinc-100 uppercase tracking-wide">
                Automatic Provisioning Checklists
              </h4>
              <p className="text-[10px] font-bold text-black/70 dark:text-zinc-300">
                Review and toggle initial system trigger configurations before approving:
              </p>

              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/35 p-4 rounded-xl border border-zinc-200 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-black dark:text-zinc-100">Create Franchise Database Record</span>
                    <span className="text-[9px] text-black/60 dark:text-zinc-400 font-semibold">Stores parameters & sets active territory status</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wizardData.dbCreate}
                    onChange={(e) => setWizardData({ ...wizardData, dbCreate: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-black dark:text-zinc-100">Send Welcome Email Invite</span>
                    <span className="text-[9px] text-black/60 dark:text-zinc-400 font-semibold">Dispatches onboarding guides & panel credentials</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wizardData.sendEmail}
                    onChange={(e) => setWizardData({ ...wizardData, sendEmail: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-black dark:text-zinc-100">Enable Push Notifications</span>
                    <span className="text-[9px] text-black/60 dark:text-zinc-400 font-semibold">Toggles system broadcasts for operations updates</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wizardData.sendPush}
                    onChange={(e) => setWizardData({ ...wizardData, sendPush: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3.5 rounded-xl flex gap-3.5">
                <UserCheck className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
                <div className="text-emerald-955 dark:text-emerald-300">
                  <h5 className="text-xs font-bold">Onboarding Verification Summary</h5>
                  <p className="text-[10px] font-semibold text-black dark:text-zinc-200 mt-1">
                    All checks have passed. Submitting this will provision the business name <span className="font-bold">"{wizardData.franchiseName}"</span> inside territory <span className="font-bold">"{wizardData.territory}"</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer buttons */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between">
          {wizardStep > 1 ? (
            <button
              onClick={() => setWizardStep(wizardStep - 1)}
              className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer font-semibold"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {wizardStep < 3 ? (
            <button
              onClick={() => setWizardStep(wizardStep + 1)}
              className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={12} />
            </button>
          ) : (
            <button
              onClick={() => onSubmit(wizardData)}
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle size={12} />
              <span>Confirm Approval</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
