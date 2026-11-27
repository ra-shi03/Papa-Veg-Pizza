import { useState, useEffect, useMemo } from "react";
import { adminAPI } from "@food/api";
import { toast } from "sonner";
import { Save, AlertCircle, RefreshCw, Lock, CheckCircle2, XCircle } from "lucide-react";

// Developer > Env Managements (safe version of the Jharkhand Rasoi page). Low-risk settings can be changed here and
// override the server's .env (stored encrypted). Secrets are write-only: the page never receives their values. The
// database URL, JWT secrets and payment / storage / push credentials can only be changed in the .env.

export default function EnvManagements() {
  const [data, setData] = useState(null);
  const [edits, setEdits] = useState({}); // key -> new value (string) or null (reset to .env)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getEnvSettings();
      setData(response?.data?.data || null);
      setEdits({});
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load environment settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const groups = useMemo(() => {
    const out = {};
    (data?.editable || []).forEach((item) => {
      (out[item.group] = out[item.group] || []).push(item);
    });
    return out;
  }, [data]);

  const valueOf = (item) => (item.key in edits ? (edits[item.key] ?? "") : item.value);

  const handleSave = async (e) => {
    e?.preventDefault();
    // Only what changed; a blank secret means "keep the current one" and is not sent
    const payload = {};
    for (const [key, value] of Object.entries(edits)) {
      const item = data.editable.find((i) => i.key === key);
      if (value === null) payload[key] = null;
      else if (item?.type === "secret" && String(value).trim() === "") continue;
      else if (String(value) !== String(item?.value ?? "")) payload[key] = value;
    }
    if (!Object.keys(payload).length) return toast.info("Nothing to save");
    try {
      setSaving(true);
      const response = await adminAPI.updateEnvSettings(payload);
      setData(response?.data?.data || data);
      setEdits({});
      toast.success("Settings saved. Restart the backend to apply them to every server process.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Environment Managements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Change low-risk server settings safely. Values set here override the <code>.env</code> file and are encrypted in the database.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !data?.canEncrypt}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all shadow-sm shrink-0"
        >
          {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {!data?.canEncrypt && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          The server has no encryption key, so settings cannot be stored. Set <code>ENV_ENCRYPTION_KEY</code> in the backend&apos;s .env and restart it.
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">How it works:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Values changed here are encrypted in the database and take priority over the <code>.env</code> file.</li>
            <li>Secret values (API keys, passwords) are never shown: you see only whether one is set. Leave the field blank to keep it.</li>
            <li>Click the reset icon to remove an override and go back to the <code>.env</code> value.</li>
            <li>Changes apply at once on the server that saved them; restart the backend to apply them to every server process.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gray-50/80 dark:bg-slate-800/80 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{groupName}</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const isSecret = item.type === "secret";
                const willReset = edits[item.key] === null;
                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={item.key}>{item.label}</label>
                      {item.isOverridden && !willReset && (
                        <span className="text-[10px] font-semibold tracking-wide bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full shrink-0">DB Override</span>
                      )}
                      {willReset && <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">Reset on save</span>}
                    </div>
                    <div className="relative">
                      <input
                        type={isSecret ? "password" : item.type === "number" ? "number" : "text"}
                        min={item.min}
                        max={item.max}
                        value={valueOf(item)}
                        autoComplete="off"
                        onChange={(e) => setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))}
                        placeholder={isSecret ? (item.isSet ? `Set (${item.preview}): type to replace` : "Not set") : "Uses the .env value"}
                        className={`w-full px-3 py-2 pr-9 border rounded-lg outline-none transition-all text-sm ${
                          item.isOverridden ? "bg-orange-50/50 border-orange-200" : "bg-gray-50 border-gray-200"
                        } focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]`}
                      />
                      {item.isOverridden && (
                        <button
                          type="button"
                          onClick={() => setEdits((prev) => ({ ...prev, [item.key]: null }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove the override and use the .env value"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono truncate">{item.key}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Critical keys: status only */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gray-50/80 dark:bg-slate-800/80 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Managed in the server&apos;s .env only</h2>
          </div>
          <p className="px-6 pt-4 text-sm text-gray-500">
            These control the database, sign-in security, payments, storage and push. Changing them from a web page is too risky, so they are only shown as configured or not.
          </p>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(data?.readOnly || []).map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{item.label}</p>
                  <p className="text-[11px] text-gray-400 font-mono truncate">{item.key}</p>
                </div>
                {item.configured ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0"><CheckCircle2 className="w-4 h-4" />Configured</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 shrink-0"><XCircle className="w-4 h-4" />Not set</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="h-10" />
      </form>
    </div>
  );
}
