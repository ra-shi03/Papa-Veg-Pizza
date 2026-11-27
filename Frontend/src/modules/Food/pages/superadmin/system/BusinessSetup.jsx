import { useState, useRef, useEffect } from "react";
import { Info, Phone, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@food/api";
import { setCachedSettings, updateFavicon, updateTitle } from "@food/utils/businessSettings";

// System Settings > Business Setup (Jharkhand Rasoi admin page, with Papa Veg's business fields): company details,
// support / catering / WhatsApp contacts, and the brand logo and favicon. All of it is the one business settings
// record the apps read their name, contacts and logo from.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (value) => String(value || "").replace(/\D/g, "");
const validPhone = (value) => !value || (digits(value).length >= 7 && digits(value).length <= 15);

const INPUT = "w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]";

const EMPTY = {
  companyName: "",
  email: "",
  phoneCountryCode: "+91",
  phoneNumber: "",
  website: "",
  address: "",
  state: "",
  pincode: "",
  region: "India",
  fssai: "",
  gstin: "",
  supportEmail: "",
  supportPhone: "",
  supportHours: "",
  faqContactText: "",
  cateringPhone: "",
  cateringEmail: "",
  whatsappNumber: "",
};

function Field({ label, required, hint, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function ImagePicker({ label, hint, preview, inputRef, onPick, onClear }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden relative">
          {preview ? (
            <>
              <img src={preview} alt={label} className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={onClear}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500"
                aria-label={`Remove ${label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <Upload className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Choose image
          </button>
          <p className="text-[11px] text-slate-500 mt-1">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
              toast.error("Image must be 2 MB or smaller");
              e.target.value = "";
              return;
            }
            onPick(file);
          }}
        />
      </div>
    </div>
  );
}

export default function BusinessSetup() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const fromSettings = (s) => ({
    companyName: s?.companyName || "",
    email: s?.email || "",
    phoneCountryCode: s?.phone?.countryCode || "+91",
    phoneNumber: s?.phone?.number || "",
    website: s?.website || "",
    address: s?.address || "",
    state: s?.state || "",
    pincode: s?.pincode || "",
    region: s?.region || "India",
    fssai: s?.fssai || "",
    gstin: s?.gstin || "",
    supportEmail: s?.supportEmail || "",
    supportPhone: s?.supportPhone || "",
    supportHours: s?.supportHours || "",
    faqContactText: s?.faqContactText || "",
    cateringPhone: s?.cateringPhone || "",
    cateringEmail: s?.cateringEmail || "",
    whatsappNumber: s?.whatsappNumber || "",
  });

  const fetchBusinessSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBusinessSettings();
      const settings = response?.data?.data || response?.data;
      if (settings) {
        setFormData(fromSettings(settings));
        setLogoPreview(settings.logo?.url || null);
        setFaviconPreview(settings.favicon?.url || null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load business settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const handleInputChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const pickImage = (setFile, setPreview) => (file) => {
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const f = formData;
    if (f.companyName.trim().length < 2) return toast.error("Company name must be at least 2 characters long");
    if (!EMAIL.test(f.email.trim())) return toast.error("Please enter a valid email address");
    if (!/^\d{10}$/.test(f.phoneNumber.trim())) return toast.error("Phone number must be exactly 10 digits");
    if (!f.state.trim()) return toast.error("State is required");
    if (!/^\d{4,10}$/.test(f.pincode.trim())) return toast.error("Please enter a valid pincode (4-10 digits)");
    if (f.website.trim() && !/^https?:\/\/\S+$/i.test(f.website.trim())) return toast.error("Website must start with http:// or https://");
    if (f.fssai.trim() && !/^\d{14}$/.test(f.fssai.trim())) return toast.error("FSSAI number must be 14 digits");
    for (const [field, label] of [["supportEmail", "Support email"], ["cateringEmail", "Catering email"]]) {
      if (f[field].trim() && !EMAIL.test(f[field].trim())) return toast.error(`${label} is not a valid email address`);
    }
    for (const [field, label] of [["supportPhone", "Support phone"], ["cateringPhone", "Catering phone"], ["whatsappNumber", "WhatsApp number"]]) {
      if (!validPhone(f[field].trim())) return toast.error(`${label} is not a valid phone number`);
    }
    if (!logoPreview && !logoFile) return toast.error("Company logo is required. Please upload a logo.");

    try {
      setSaving(true);
      const dataToSend = Object.fromEntries(Object.entries(f).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
      const files = {};
      if (logoFile) files.logo = logoFile;
      if (faviconFile) files.favicon = faviconFile;

      const response = await adminAPI.updateBusinessSettings(dataToSend, files);
      const saved = response?.data?.data || response?.data;
      if (saved) {
        setCachedSettings(saved);
        setFormData(fromSettings(saved));
        setLogoPreview(saved.logo?.url || null);
        setFaviconPreview(saved.favicon?.url || null);
        setLogoFile(null);
        setFaviconFile(null);
        // The admin panels read the brand name / logo / favicon from these (sidebar, header, browser tab)
        if (saved.logo?.url) localStorage.setItem("sa_logo", saved.logo.url);
        if (saved.favicon?.url) {
          localStorage.setItem("sa_favicon", saved.favicon.url);
          updateFavicon(saved.favicon.url);
        }
        if (saved.companyName) {
          localStorage.setItem("sa_companyName", saved.companyName);
          updateTitle(saved.companyName);
        }
        (saved.warnings || []).forEach((w) => toast.warning(w));
      }
      toast.success("Business settings saved successfully");
      window.dispatchEvent(new CustomEvent("businessSettingsUpdated"));
      window.dispatchEvent(new Event("systemThemeChanged"));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save business settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLogoFile(null);
    setFaviconFile(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (faviconInputRef.current) faviconInputRef.current.value = "";
    fetchBusinessSettings();
    toast.info("Form reset to saved values");
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Business setup</h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">Manage your company information, contacts and brand images.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3 max-w-md">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs lg:text-sm text-slate-700">
            <p className="font-semibold text-amber-700 mb-0.5">Note</p>
            <p>Don&apos;t forget to click the &quot;Save Information&quot; button below to save changes.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Company information */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company name" required>
              <input type="text" placeholder="Enter Your Company Name" value={formData.companyName} maxLength={80} onChange={(e) => handleInputChange("companyName", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Email" required>
              <input type="email" placeholder="Enter Your Email" value={formData.email} maxLength={100} onChange={(e) => handleInputChange("email", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Region" required>
              <select value={formData.region} onChange={(e) => handleInputChange("region", e.target.value)} className={INPUT}>
                <option value="India">India</option>
              </select>
            </Field>
            <Field label="Phone" required>
              <div className="flex gap-2">
                <div className="relative w-32">
                  <select value={formData.phoneCountryCode} onChange={(e) => handleInputChange("phoneCountryCode", e.target.value)} className={`${INPUT} pl-8 appearance-none`}>
                    <option value="+91">+91 (IN)</option>
                  </select>
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <input type="text" placeholder="Enter Your Phone Number" value={formData.phoneNumber} maxLength={10} onChange={(e) => handleInputChange("phoneNumber", digits(e.target.value))} className={`${INPUT} flex-1`} />
              </div>
            </Field>
            <Field label="Address" className="md:col-span-2">
              <textarea rows={2} placeholder="Enter Your Address" value={formData.address} maxLength={250} onChange={(e) => handleInputChange("address", e.target.value)} className={`${INPUT} resize-none`} />
            </Field>
            <Field label="State" required>
              <input type="text" placeholder="Enter Your State" value={formData.state} maxLength={50} onChange={(e) => handleInputChange("state", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Pincode" required>
              <input type="text" placeholder="Enter Your Pincode" value={formData.pincode} maxLength={10} onChange={(e) => handleInputChange("pincode", digits(e.target.value))} className={INPUT} />
            </Field>
            <Field label="FSSAI License">
              <input type="text" placeholder="Enter FSSAI License Number" value={formData.fssai} maxLength={14} onChange={(e) => handleInputChange("fssai", digits(e.target.value))} className={INPUT} />
            </Field>
            <Field label="GSTIN">
              <input type="text" placeholder="Enter GSTIN Number" value={formData.gstin} maxLength={15} onChange={(e) => handleInputChange("gstin", e.target.value.toUpperCase())} className={INPUT} />
            </Field>
            <Field label="Website" className="md:col-span-2">
              <input type="url" placeholder="https://www.example.com" value={formData.website} maxLength={200} onChange={(e) => handleInputChange("website", e.target.value)} className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Support information */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Support Information</h3>
          <p className="text-xs text-slate-500 mb-4">Shown on the customer app&apos;s Help &amp; Support page and in the FAQ.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Support Email">
              <input type="email" placeholder="support@example.com" value={formData.supportEmail} maxLength={100} onChange={(e) => handleInputChange("supportEmail", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Support Phone">
              <input type="text" placeholder="+91 98765 43210" value={formData.supportPhone} maxLength={25} onChange={(e) => handleInputChange("supportPhone", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Support Hours">
              <input type="text" placeholder="10:00 AM – 11:30 PM, every day" value={formData.supportHours} maxLength={100} onChange={(e) => handleInputChange("supportHours", e.target.value)} className={INPUT} />
            </Field>
            <Field label="FAQ contact text">
              <input type="text" placeholder="Still need help? Contact us." value={formData.faqContactText} maxLength={500} onChange={(e) => handleInputChange("faqContactText", e.target.value)} className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Catering & WhatsApp */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Catering &amp; WhatsApp</h3>
          <p className="text-xs text-slate-500 mb-4">Used by bulk / catering orders and the WhatsApp chat button.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Catering Phone">
              <input type="text" placeholder="+91 98765 43210" value={formData.cateringPhone} maxLength={25} onChange={(e) => handleInputChange("cateringPhone", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Catering Email">
              <input type="email" placeholder="catering@example.com" value={formData.cateringEmail} maxLength={100} onChange={(e) => handleInputChange("cateringEmail", e.target.value)} className={INPUT} />
            </Field>
            <Field label="WhatsApp Number">
              <input type="text" placeholder="+91 98765 43210" value={formData.whatsappNumber} maxLength={25} onChange={(e) => handleInputChange("whatsappNumber", e.target.value)} className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Brand images */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Logo &amp; Favicon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImagePicker
              label="Company logo *"
              hint="PNG, JPG, WEBP or SVG, up to 2 MB"
              preview={logoPreview}
              inputRef={logoInputRef}
              onPick={pickImage(setLogoFile, setLogoPreview)}
              onClear={() => { setLogoFile(null); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = ""; }}
            />
            <ImagePicker
              label="Favicon"
              hint="Square image (32×32 or larger), up to 2 MB"
              preview={faviconPreview}
              inputRef={faviconInputRef}
              onPick={pickImage(setFaviconFile, setFaviconPreview)}
              onClear={() => { setFaviconFile(null); setFaviconPreview(null); if (faviconInputRef.current) faviconInputRef.current.value = ""; }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={handleReset} disabled={saving} className="px-6 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Reset
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Information
          </button>
        </div>
      </div>
    </div>
  );
}
