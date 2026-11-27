import { useState, useEffect } from "react";
import { Info, Upload, Save, Loader2, MonitorSmartphone, Truck, LayoutDashboard, Palette, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@food/api";
import { adminClient } from "@food/api/axios";
import { setCachedSettings } from "@food/utils/businessSettings";

// System Settings > Theme Settings (Jharkhand Rasoi "App Customization" for Papa Veg). "Brand" holds the colours and
// default light / dark mode every app uses; each app can override the colours, font and logo. An empty override means
// "use the brand". Everything is stored on the business settings record and applied by shared/utils/themeSync.js.

const BRAND = "brand";
const apps = [
  { id: BRAND, label: "Brand (all apps)", icon: Palette },
  { id: "user_app", label: "Customer App", icon: MonitorSmartphone },
  { id: "delivery_app", label: "Delivery App", icon: Truck },
  { id: "admin_app", label: "Admin Panels", icon: LayoutDashboard },
];

// Only fonts the apps load (index.html); the server accepts only these
const fontOptions = [
  { label: "Poppins (default)", value: "" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "System font", value: "system-ui, sans-serif" },
];

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const EMPTY_APP = { primaryColor: "", secondaryColor: "", fontFamily: "", logoUrl: "" };

/** A colour swatch plus its hex text box. (Top level, so typing in it does not remount it and lose focus.) */
function ColorInput({ label, value, fallback, placeholder, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <input type="color" value={HEX.test(value) ? value : fallback} onChange={(e) => onChange(e.target.value)} className="w-14 h-14 rounded cursor-pointer border-0 p-0" />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.trim())}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/40 outline-none uppercase"
        />
      </div>
    </div>
  );
}

export default function ThemeSettings() {
  const [selectedApp, setSelectedApp] = useState(BRAND);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState({ primaryColor: "#a43c12", secondaryColor: "#ff7f50", themeMode: "light" });
  const [configs, setConfigs] = useState({ user_app: EMPTY_APP, delivery_app: EMPTY_APP, admin_app: EMPTY_APP });

  const applySaved = (saved) => {
    if (!saved) return;
    setBrand({
      primaryColor: saved.primaryColor || "#a43c12",
      secondaryColor: saved.secondaryColor || "#ff7f50",
      themeMode: saved.themeMode || "light",
    });
    const themes = saved.appThemes || {};
    setConfigs({
      user_app: { ...EMPTY_APP, ...(themes.user_app || {}) },
      delivery_app: { ...EMPTY_APP, ...(themes.delivery_app || {}) },
      admin_app: { ...EMPTY_APP, ...(themes.admin_app || {}) },
    });
  };

  useEffect(() => {
    adminAPI.getBusinessSettings()
      .then((res) => applySaved(res?.data?.data))
      .catch(() => toast.error("Failed to load theme settings"))
      .finally(() => setLoading(false));
  }, []);

  const isBrand = selectedApp === BRAND;
  const current = isBrand ? brand : configs[selectedApp];
  // What the app will really use: its own value, else the brand's
  const effective = isBrand
    ? brand
    : {
        primaryColor: current.primaryColor || brand.primaryColor,
        secondaryColor: current.secondaryColor || brand.secondaryColor,
        fontFamily: current.fontFamily || "'Poppins', sans-serif",
        logoUrl: current.logoUrl,
      };

  const setField = (field, value) => {
    if (isBrand) setBrand((prev) => ({ ...prev, [field]: value }));
    else setConfigs((prev) => ({ ...prev, [selectedApp]: { ...prev[selectedApp], [field]: value } }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be 2 MB or smaller");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "app-logos");
    const loadingToast = toast.loading("Uploading logo...");
    try {
      const response = await adminClient.post("/uploads/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const url = response.data?.data?.url;
      if (!url) throw new Error("No URL returned");
      setField("logoUrl", url);
      toast.success("Logo uploaded. Save to apply it.", { id: loadingToast });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload logo", { id: loadingToast });
    }
  };

  const handleSave = async () => {
    const colors = isBrand ? [brand.primaryColor, brand.secondaryColor] : [current.primaryColor, current.secondaryColor].filter(Boolean);
    if (colors.some((c) => !HEX.test(c))) return toast.error("Colours must be hex values like #a43c12");
    setSaving(true);
    try {
      const payload = isBrand
        ? { primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor, themeMode: brand.themeMode }
        : { appThemes: { [selectedApp]: current } };
      const res = await adminAPI.updateBusinessSettings(payload);
      const saved = res?.data?.data;
      applySaved(saved);
      // Apply straight away in this tab (other tabs and apps pick it up when they load the settings)
      if (saved) setCachedSettings(saved);
      if (isBrand) {
        localStorage.setItem("sa_primary", brand.primaryColor);
        localStorage.setItem("sa_secondary", brand.secondaryColor);
        localStorage.setItem("sa_themeMode", brand.themeMode);
      }
      window.dispatchEvent(new Event("systemThemeChanged"));
      toast.success(`${apps.find((a) => a.id === selectedApp).label} theme saved`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const appLabel = apps.find((a) => a.id === selectedApp).label;

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            App Customization
            <Info className="w-6 h-6 text-slate-400" />
          </h1>
          <p className="text-slate-500 mt-2">Manage the brand colours, and each app&apos;s own colours, font and logo.</p>
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedApp === app.id ? "bg-[var(--primary)] text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon className="w-5 h-5" />
                {app.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between gap-4 mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-800">{appLabel} Settings</h2>
              {!isBrand && (
                <button
                  type="button"
                  onClick={() => setConfigs((prev) => ({ ...prev, [selectedApp]: { ...EMPTY_APP } }))}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Use brand theme
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-700">Theme Colors</h3>
                <ColorInput label="Primary Color" value={current.primaryColor} fallback={effective.primaryColor} placeholder={isBrand ? "" : `Brand: ${brand.primaryColor}`} onChange={(v) => setField("primaryColor", v)} />
                <ColorInput label="Secondary Color" value={current.secondaryColor} fallback={effective.secondaryColor} placeholder={isBrand ? "" : `Brand: ${brand.secondaryColor}`} onChange={(v) => setField("secondaryColor", v)} />

                {isBrand ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Default appearance</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["light", "dark"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setField("themeMode", mode)}
                          className={`px-4 py-2.5 rounded-lg border text-sm font-medium capitalize ${
                            brand.themeMode === mode ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {mode} mode
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Typography (Font Family)</label>
                    <select
                      value={current.fontFamily}
                      onChange={(e) => setField("fontFamily", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/40 outline-none"
                      style={{ fontFamily: effective.fontFamily }}
                    >
                      {fontOptions.map((font) => (
                        <option key={font.label} value={font.value} style={{ fontFamily: font.value || "'Poppins', sans-serif" }}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!isBrand ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-700">App Logo</h3>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {current.logoUrl ? (
                      <div className="flex flex-col items-center">
                        <img src={current.logoUrl} alt="App Logo" className="h-24 object-contain mb-4" />
                        <p className="text-sm text-slate-500">Click to change logo</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="font-medium text-slate-700">Drop your logo here, or click to browse</p>
                        <p className="text-sm text-slate-500 mt-1">PNG, JPG or SVG (max 2MB). Empty = the company logo.</p>
                      </div>
                    )}
                  </div>
                  {current.logoUrl && (
                    <button type="button" onClick={() => setField("logoUrl", "")} className="text-sm text-red-600 hover:underline">
                      Remove app logo
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-sm text-slate-600">
                  <h3 className="text-lg font-semibold text-slate-700">Where these apply</h3>
                  <p>The brand colours are used by every app that has no colours of its own: the customer app, the delivery app, and the Super Admin, Franchise and Store panels.</p>
                  <p>The appearance sets the default; each person can still switch light / dark for themselves.</p>
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-semibold text-slate-700 mb-6">Live Preview</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm" style={{ backgroundColor: effective.primaryColor, fontFamily: effective.fontFamily || "'Poppins', sans-serif" }}>
                <div className="p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {effective.logoUrl ? (
                      <img src={effective.logoUrl} alt="Logo" className="h-10 bg-white/20 p-1 rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center text-xs">Logo</div>
                    )}
                    <span className="font-semibold text-lg">{appLabel}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                </div>
                <div className="bg-white p-6 min-h-[150px] rounded-t-2xl mt-4 mx-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                  <div className="h-4 w-1/3 rounded mb-4" style={{ backgroundColor: effective.secondaryColor }} />
                  <div className="h-4 w-2/3 bg-slate-100 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-slate-100 rounded" />
                  <div className="mt-6 mb-2">
                    <h4 className="text-lg font-bold text-slate-800">Typography Preview</h4>
                    <p className="text-sm text-slate-500">The quick brown fox jumps over the lazy dog.</p>
                  </div>
                  <button className="mt-4 px-6 py-2 rounded-lg text-white font-medium w-full" style={{ backgroundColor: effective.primaryColor }}>
                    Action Button
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-colors font-medium shadow-sm disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
