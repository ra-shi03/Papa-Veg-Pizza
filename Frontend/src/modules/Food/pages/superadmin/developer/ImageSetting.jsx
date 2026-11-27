import { useState, useEffect } from "react";
import { AlertTriangle, Cloud, CloudUpload, CheckCircle2, HardDrive, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@food/api";

// Developer > Image Setting: where newly uploaded images are stored (Cloudinary or this server's upload folder).
export default function ImageSetting() {
  const [uploadProvider, setUploadProvider] = useState("cloudinary");
  const [info, setInfo] = useState({ configured: false, localAvailable: false, publicApiUrl: "", nodeEnv: "", localUploadDir: "" });
  const [providerBusy, setProviderBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUploadProvider = async () => {
    try {
      const res = await adminAPI.getUploadSettings();
      const data = res?.data?.data || {};
      setUploadProvider(data.imageUploadProvider || "cloudinary");
      setInfo({
        configured: Boolean(data.cloudinaryConfigured),
        localAvailable: Boolean(data.localAvailable),
        publicApiUrl: data.publicApiUrl || "",
        nodeEnv: data.nodeEnv || "",
        localUploadDir: data.localUploadDir || "",
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load image settings");
    }
  };

  useEffect(() => {
    loadUploadProvider().finally(() => setLoading(false));
  }, []);

  const handleProviderToggle = async (useCloudinary) => {
    if (providerBusy) return;
    if (useCloudinary && !info.configured) {
      toast.error("Cloudinary is not configured on the server (missing CLOUDINARY_* env vars)");
      return;
    }
    if (!useCloudinary && !info.localAvailable) {
      toast.error("Set the Public API URL in Env Managements first");
      return;
    }
    try {
      setProviderBusy(true);
      const res = await adminAPI.updateUploadSettings({ imageUploadProvider: useCloudinary ? "cloudinary" : "local" });
      setUploadProvider(res?.data?.data?.imageUploadProvider || (useCloudinary ? "cloudinary" : "local"));
      toast.success(useCloudinary ? "New images will go to Cloudinary" : "New images will be saved on this server");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update upload provider");
    } finally {
      setProviderBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Image Setting</h1>
        <p className="text-xs lg:text-sm text-slate-500 mt-1">Control where uploaded images are stored.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <CloudUpload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Image Upload Storage</h3>
              <p className="text-xs text-slate-500 mt-0.5">Choose where newly uploaded images are stored. Videos and PDFs always go to Cloudinary.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            <span className={`h-1.5 w-1.5 rounded-full ${info.nodeEnv === "production" ? "bg-emerald-500" : "bg-amber-500"}`} />
            Server mode: {info.nodeEnv || "development"}
          </span>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "local", label: "Local Storage", Icon: HardDrive, desc: "Saved on this server's disk" },
              { key: "cloudinary", label: "Cloudinary", Icon: Cloud, desc: "Saved on Cloudinary (CDN-hosted)" },
            ].map(({ key, label, Icon, desc }) => {
              const active = uploadProvider === key;
              const disabled = (key === "cloudinary" && !info.configured) || (key === "local" && !info.localAvailable);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={providerBusy || (disabled && !active)}
                  onClick={() => !active && handleProviderToggle(key === "cloudinary")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed ${
                    active ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  } ${disabled && !active ? "opacity-50" : ""}`}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${active ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    {disabled && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        {key === "cloudinary" ? "CLOUDINARY_* keys not set on server" : "Set the Public API URL in Env Managements first"}
                      </p>
                    )}
                  </div>
                  {providerBusy && !active ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                  ) : (
                    active && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[var(--primary)]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">How uploads are stored</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="rounded-lg border border-amber-100 bg-white p-3">
                <p className="font-semibold text-slate-900 mb-1">If Cloudinary is selected</p>
                <p>Images are stored on Cloudinary and served from its CDN. The server needs the <code className="rounded bg-slate-100 px-1">CLOUDINARY_*</code> keys. Recommended for live servers.</p>
              </div>

              <div className="rounded-lg border border-amber-100 bg-white p-3">
                <p className="font-semibold text-slate-900 mb-1">If Local is selected</p>
                <p className="mb-2">
                  PNG, JPEG, WebP and GIF images are saved in the server&apos;s upload folder and served at{" "}
                  <code className="rounded bg-slate-100 px-1 break-all">{info.publicApiUrl || "<Public API URL>"}/uploads/…</code>. Other images still go to Cloudinary.
                </p>
                <p className="text-amber-800">
                  The files live on this one server: with several servers, or a host that replaces its disk on deploy, they can go missing. Your web server must also send{" "}
                  <code className="rounded bg-slate-100 px-1">/uploads</code> to the backend.
                </p>
              </div>
            </div>

            <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
              <li>• Switching only affects new uploads; existing files stay where they are.</li>
              {info.localUploadDir && (
                <li className="break-all">• Local folder in use right now: <code className="rounded bg-white px-1">{info.localUploadDir}</code></li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
