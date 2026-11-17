import React, { useEffect, useState } from 'react';
import { Save, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../services/api/axios';

// Super admin: the hero banner at the top of the customer app's Under 250 page (image, title, link).
// No banner saved, or switched off, means the customer app shows no banner image there.
const KEY = 'under-250';
const empty = { imageUrl: '', title: '', link: '', isActive: true };

export default function HeroBannersConfig() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminClient.get(`/settings/hero-banners/${KEY}`)
      .then((res) => {
        const d = res?.data?.data;
        if (!cancelled && d) setForm({ imageUrl: d.imageUrl || '', title: d.title || '', link: d.link || '', isActive: d.isActive !== false });
      })
      .catch(() => toast.error('Could not load the banner'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'hero-banners');
      const { data } = await adminClient.post('/uploads/image', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data?.data?.url;
      if (!url) throw new Error('Upload failed');
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not upload the image');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await adminClient.put(`/settings/hero-banners/${KEY}`, form);
      const d = res?.data?.data;
      if (d) setForm({ imageUrl: d.imageUrl || '', title: d.title || '', link: d.link || '', isActive: d.isActive !== false });
      toast.success('Banner saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Could not save the banner');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Hero Banners</h1>
        <p className="text-sm text-gray-500">The banner at the top of the customer app's Under 250 page.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Image</label>
          {form.imageUrl ? (
            <div className="mt-2 space-y-2">
              <img src={form.imageUrl} alt="Banner preview" className="w-full max-h-48 object-cover rounded-lg border border-gray-200" />
              <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))} className="text-xs text-red-600 flex items-center gap-1 border-0 bg-transparent cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" /> Remove image
              </button>
            </div>
          ) : (
            <label className="mt-2 flex flex-col items-center justify-center gap-1 h-32 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 cursor-pointer hover:bg-gray-50">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              <span className="text-sm">{uploading ? 'Uploading...' : 'Click to upload an image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title (optional)</label>
          <input value={form.title} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-900" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Link (optional)</label>
          <input value={form.link} maxLength={300} placeholder="/user/offers or https://..." onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-900" />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4" />
          Show this banner
        </label>

        <button type="button" onClick={save} disabled={saving || uploading} className="h-10 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 cursor-pointer border-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
    </div>
  );
}
