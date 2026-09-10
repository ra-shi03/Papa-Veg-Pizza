import React, { useState } from "react";
import { Image, Maximize2, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ReviewImagesGallery({ images = [] }) {
  const [activeIdx, setActiveIdx] = useState(null);

  if (!images || images.length === 0) return null;

  const handleDownload = (e, imgUrl) => {
    e.stopPropagation();
    toast.success("Downloading Evidence Photo...", {
      description: "Saving review image attachment locally."
    });
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-3 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <Image size={15} className="text-[var(--primary)]" />
        Customer Uploaded Evidence ({images.length})
      </h4>

      {/* Thumbnails list */}
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div 
            key={idx}
            className="group relative w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-zinc-100 dark:bg-zinc-900 transition-all hover:scale-[1.03] hover:shadow-md"
            onClick={() => setActiveIdx(idx)}
          >
            <img 
              src={img} 
              alt={`Review Evidence ${idx + 1}`} 
              className="w-full h-full object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 size={14} className="text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox zoom modal */}
      {activeIdx !== null && (
        <div 
          className="fixed inset-0 z-70 bg-black/85 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveIdx(null)}
        >
          {/* Action Header */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <span className="text-white text-xs font-black uppercase tracking-wider">
              Photo {activeIdx + 1} of {images.length}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDownload(e, images[activeIdx])}
                className="p-2 bg-zinc-900/80 hover:bg-zinc-850 text-white rounded-xl transition-colors cursor-pointer border border-zinc-800"
                title="Download image"
              >
                <Download size={14} />
              </button>
              
              <button
                onClick={() => setActiveIdx(null)}
                className="p-2 bg-zinc-900/80 hover:bg-zinc-850 text-white rounded-xl transition-colors cursor-pointer border border-zinc-800"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-2xl transition-colors cursor-pointer border border-zinc-805"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Image */}
          <div 
            className="max-w-4xl max-h-[80vh] overflow-hidden rounded-3xl border border-zinc-850 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={images[activeIdx]} 
              alt="Zoomed Review Evidence"
              className="max-w-full max-h-[80vh] object-contain animate-in zoom-in-95 duration-200"
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-2xl transition-colors cursor-pointer border border-zinc-805"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
