import React, { useState } from "react";
import { Image as ImageIcon, ZoomIn, X, Download } from "lucide-react";

export default function ComplaintImagesGallery({ images = [] }) {
  const [activeImg, setActiveImg] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-center font-semibold text-xs text-zinc-400 py-8 flex flex-col items-center justify-center gap-1.5">
        <ImageIcon size={20} className="text-zinc-300 dark:text-zinc-800" />
        <span>No evidence photos uploaded by customer.</span>
      </div>
    );
  }

  const handleDownload = (e, url) => {
    e.stopPropagation();
    // Simulate download
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `complaint_evidence_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <ImageIcon size={15} className="text-[var(--primary)]" />
        Evidence Gallery ({images.length})
      </h4>

      <div className="grid grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setActiveImg(img)}
            className="group relative aspect-video bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden cursor-zoom-in"
          >
            <img
              src={img}
              alt={`Evidence ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors">
                <ZoomIn size={12} />
              </span>
              <button
                onClick={(e) => handleDownload(e, img)}
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
                title="Download Evidence"
              >
                <Download size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Overlay */}
      {activeImg && (
        <div className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setActiveImg(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          
          <div className="max-w-4xl max-h-[85vh] relative flex flex-col items-center justify-center gap-4">
            <img
              src={activeImg}
              alt="Evidence Fullscreen"
              className="max-w-full max-h-[80vh] rounded-3xl object-contain border border-zinc-800 shadow-2xl"
            />
            <button
              onClick={(e) => handleDownload(e, activeImg)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-zinc-900 font-extrabold text-xs rounded-2xl hover:bg-neutral-100 shadow transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>Download Image</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
