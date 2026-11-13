import React, { useState, useRef } from "react";
import { CheckCircle2, X, Camera, Image, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { myTasksService } from "@/services/api/myTasksService";

// Phone photos are 3-10 MB: scale to at most 1280px on the long side and re-encode as JPEG so the upload stays small.
const MAX_SIDE = 1280;
const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("compress failed"))), "image/jpeg", 0.72);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image"));
    };
    img.src = url;
  });

export default function CompleteTaskModal({
  isOpen = false,
  task = {},
  onClose = () => {},
  onConfirm = () => {},
  loading = false,
}) {
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [proofBlob, setProofBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const blob = await compressImage(file);
      setProofBlob(blob);
      setImagePreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch {
      toast.error("Could not use that photo. Try another one.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let image;
    if (proofBlob) {
      setUploading(true);
      try {
        image = await myTasksService.uploadProof(proofBlob);
      } catch {
        toast.error("Photo upload failed. Please try again.");
        return;
      } finally {
        setUploading(false);
      }
    }
    onConfirm(task._id, image ? { notes, image } : { notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/45 dark:bg-zinc-955/65 backdrop-blur-xs animate-fade">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl max-w-sm w-full space-y-4 animate-scale">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-wider">Complete Task Details</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-850"
          >
            <X size={14} />
          </button>
        </div>

        {/* Task Name */}
        <div className="space-y-1">
          <h3 className="text-xs font-black text-slate-805 dark:text-zinc-200">
            {task?.title}
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
            Order ID: <strong className="text-[var(--primary)]">{task?.orderId}</strong> &bull; Station: {task?.station}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Completion Comments
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Perfect golden crust, packed and ready..."
              rows={2}
              required
              disabled={loading || uploading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all disabled:opacity-50"
            />
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Quality Assurance Photo (Required)
            </label>
            
            <div
              onClick={handleImageClick}
              className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-950/40 transition-colors h-[120px]"
            >
              {imagePreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="QA Proof Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                    <RefreshCw size={18} className="text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-full border border-zinc-150 dark:border-zinc-800/80 text-[var(--primary)] flex items-center justify-center">
                    <Camera size={16} />
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[9px] font-extrabold text-slate-700 dark:text-zinc-350">
                      Snap or Upload QA Proof
                    </span>
                    <span className="text-[8px] font-semibold text-slate-450 dark:text-zinc-500 block">
                      PNG, JPG or WebP formats accepted
                    </span>
                  </div>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {(loading || uploading) && <Loader2 size={12} className="animate-spin" />}
              <span>Verify & Complete</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
