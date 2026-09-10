import React, { useState } from "react";
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";

export default function ImagePreviewModal({ isOpen, onClose, images = [], initialIndex = 0 }) {
  if (!isOpen || !images || images.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoomLevel(1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const url = images[currentIndex];
    const link = document.createElement("a");
    link.href = url;
    link.download = `attachment-${currentIndex + 1}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      {/* Top Bar controls */}
      <div className="absolute top-0 inset-x-0 h-16 bg-black/40 flex items-center justify-between px-6 text-white z-10">
        <span className="font-bold text-xs uppercase tracking-wider">
          Attachment {currentIndex + 1} of {images.length}
        </span>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-bold w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Download"
          >
            <Download size={18} />
          </button>
          <div className="h-6 w-[1px] bg-white/20 mx-1" />
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Prev Navigation Button */}
      {images.length > 1 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 cursor-pointer z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Main Image Container */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden p-6 cursor-zoom-out"
        onClick={onClose}
      >
        <img
          src={images[currentIndex]}
          alt={`Attachment ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200 select-none"
          style={{
            transform: `scale(${zoomLevel})`,
            maxHeight: isFullscreen ? "100vh" : "85vh",
            maxWidth: isFullscreen ? "100vw" : "85vw",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Next Navigation Button */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 cursor-pointer z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}
