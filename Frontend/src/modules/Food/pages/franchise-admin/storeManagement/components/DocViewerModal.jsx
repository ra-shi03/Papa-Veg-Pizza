import React, { useState } from "react"
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2, RefreshCw } from "lucide-react"

export default function DocViewerModal({ isOpen, onClose, document }) {
  if (!isOpen || !document) return null

  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isPDF = document.name?.toLowerCase().endsWith(".pdf") || document.type?.toLowerCase().includes("pdf")

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = () => {
    // Simple download trigger
    const link = document.createElement ? document.createElement("a") : window.document.createElement("a")
    link.href = document.url
    link.download = document.name || "document"
    link.target = "_blank"
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-200`}>
      <div className={`relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all select-none ${
        isFullscreen ? "w-screen h-screen rounded-none" : "w-full max-w-4xl h-[85vh]"
      }`}>
        
        {/* Controls Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px] md:max-w-[400px]">
              {document.type || "Document Preview"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-450 truncate">
              {document.name || "uploaded_file"}
            </span>
          </div>

          {/* Interactive Toolbar */}
          <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
            {!isPDF && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50 transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50 transition-colors"
                  title="Reset Orientation"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-primary text-white hover:bg-primary/95 transition-colors"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Render Area */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6 relative">
          {isPDF ? (
            <div className="w-full h-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white">
              <iframe
                src={`${document.url}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title={document.type}
              />
            </div>
          ) : (
            <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
              <img
                src={document.url}
                alt={document.type}
                className="max-w-full max-h-[70vh] rounded-lg shadow-md border transition-all duration-300 ease-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
