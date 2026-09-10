import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Eye, ExternalLink, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function AttachmentGalleryModal({ isOpen, onClose, attachments }) {
  const [activeAttachment, setActiveAttachment] = useState(null);

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      // Map names to mock structures if it's just an array of strings
      const normalized = attachments.map((att, idx) => {
        if (typeof att === 'string') {
          const extension = att.split('.').pop().toLowerCase();
          const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension);
          const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(extension);
          return {
            id: `att_${idx}`,
            name: att,
            size: `${Math.floor(100 + Math.random() * 800)} KB`,
            type: isImg ? `image/${extension}` : (isSpreadsheet ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'),
            url: isImg ? `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80` : null
          };
        }
        return att;
      });
      setActiveAttachment(normalized[0]);
    } else {
      setActiveAttachment(null);
    }
  }, [attachments, isOpen]);

  if (!isOpen || !attachments) return null;

  // Normalize attachments for internal consumption
  const normalizedAttachments = attachments.map((att, idx) => {
    if (typeof att === 'string') {
      const extension = att.split('.').pop().toLowerCase();
      const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension);
      const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(extension);
      return {
        id: `att_${idx}`,
        name: att,
        size: `${Math.floor(100 + Math.random() * 800)} KB`,
        type: isImg ? `image/${extension}` : (isSpreadsheet ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'),
        url: isImg ? `https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80` : null
      };
    }
    return att;
  });

  const activeNormalized = normalizedAttachments.find(a => a.name === activeAttachment?.name) || normalizedAttachments[0];

  const handleDownload = (name) => {
    toast.success(`Downloaded ${name} successfully`);
  };

  return (
    <div 
      className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-4xl h-[580px] rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Attachment & Log Files Gallery</h2>
              <p className="text-[10px] text-zinc-500 font-semibold">View and verify uploaded logs, screenshots, and spreadsheets ({attachments.length} items)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body: Split view */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          
          {/* Left Panel: Attachments list */}
          <div className="w-full md:w-[350px] border-r border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-900/20 scrollbar-thin">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">All Attachments</p>
            
            <div className="space-y-2">
              {normalizedAttachments.map((att) => {
                const isSelected = activeNormalized?.id === att.id;
                const isImg = att.type.startsWith('image/');
                const isSpreadsheet = att.type.includes('sheet') || att.type.includes('csv') || att.type.includes('spreadsheet');

                return (
                  <div
                    key={att.id}
                    onClick={() => setActiveAttachment(att)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected 
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isImg ? (
                        <div className="w-9 h-9 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      ) : isSpreadsheet ? (
                        <div className="w-9 h-9 rounded bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded bg-red-500/10 dark:bg-red-500/20 text-red-650 dark:text-red-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold truncate w-[160px] ${
                          isSelected ? 'text-[var(--primary)]' : 'text-zinc-800 dark:text-zinc-200'
                        }`}>{att.name}</p>
                        <p className="text-[9px] text-zinc-400 font-semibold">{att.size} • {att.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(att.name);
                      }}
                      className="p-1.5 rounded-lg text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              
              {normalizedAttachments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-semibold">No attachments logged</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Selected active attachment preview */}
          <div className="flex-1 flex flex-col bg-zinc-100/50 dark:bg-zinc-900/40 p-4 overflow-hidden">
            {activeNormalized ? (
              <div className="h-full flex flex-col">
                {/* Meta details */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3 shrink-0">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-55 truncate max-w-sm" title={activeNormalized.name}>
                      {activeNormalized.name}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-semibold">Size: {activeNormalized.size} | Content-Type: {activeNormalized.type}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(activeNormalized.name)}
                      className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>

                {/* Main Preview Frame */}
                <div className="flex-1 min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center p-4 relative">
                  {activeNormalized.type.startsWith('image/') ? (
                    <div className="relative group max-h-full max-w-full flex items-center justify-center">
                      <img 
                        src={activeNormalized.url || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80'} 
                        alt={activeNormalized.name} 
                        className="max-h-[350px] max-w-full rounded object-contain shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                        <a 
                          href={activeNormalized.url || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white rounded-full text-zinc-900 shadow-lg hover:scale-105 transition-transform"
                          title="Open image in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : activeNormalized.type.includes('sheet') || activeNormalized.type.includes('csv') ? (
                    <div className="w-full h-full flex flex-col p-2 overflow-y-auto scrollbar-thin">
                      <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Spreadsheet Simulated View</span>
                      </div>
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex-1 overflow-x-auto text-[10px] font-semibold">
                        <table className="w-full text-left">
                          <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 uppercase">
                            <tr>
                              <th className="px-3 py-2 border-b border-r border-zinc-200 dark:border-zinc-800">A</th>
                              <th className="px-3 py-2 border-b border-r border-zinc-200 dark:border-zinc-800">B</th>
                              <th className="px-3 py-2 border-b border-r border-zinc-200 dark:border-zinc-800">C</th>
                              <th className="px-3 py-2 border-b">D</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900">
                            <tr>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800 font-mono">Row 1</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">Indore Nodes</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">₹45,200.00</td>
                              <td className="px-3 py-1.5">Processed</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800 font-mono">Row 2</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">POS-Offline-Error</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">Code-403</td>
                              <td className="px-3 py-1.5">Retry-Failed</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800 font-mono">Row 3</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">Rider ID 442</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">₹3,400.00</td>
                              <td className="px-3 py-1.5">Sync Pending</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800 font-mono">Row 4</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">Printer-Queue</td>
                              <td className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800">Stuck Job</td>
                              <td className="px-3 py-1.5">Cleared</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col p-2 overflow-y-auto scrollbar-thin">
                      <div className="flex items-center gap-2 mb-3 text-red-500 shrink-0">
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">PDF Document Simulated View</span>
                      </div>
                      <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 font-serif text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed shadow-inner">
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="border-b border-zinc-300 dark:border-zinc-700 pb-3 text-center">
                            <h5 className="font-sans font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase">Papa Veg Pizza Helpdesk Report</h5>
                            <p className="font-sans text-[8px] text-zinc-400 mt-1">LOG IDENTIFIER: {activeNormalized.name}</p>
                          </div>
                          <p>This document details the log dump associated with the customer support request. It contains error stacktraces, API gateway timings, database connection configurations, and system transaction details recorded at the time of the operational or technical incident.</p>
                          <div className="bg-zinc-200/50 dark:bg-zinc-950 p-2 rounded font-mono text-[9px] text-zinc-750 dark:text-zinc-450 border border-zinc-300 dark:border-zinc-800">
                            [ERROR] Socket exception at Cloud Gateway: Gateway Timeout (504)<br />
                            &nbsp;&nbsp;&nbsp;at org.papaveg.gateway.SocketManager.connect(SocketManager.java:104)<br />
                            &nbsp;&nbsp;&nbsp;at org.papaveg.gateway.Controller.dispatch(Controller.java:54)
                          </div>
                          <p className="text-[9px] italic text-zinc-500">System operator notes: Verified database pools and restarted POS cloud listener.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <FileText className="w-12 h-12 opacity-30 mb-2" />
                <p className="text-sm font-semibold">Select an attachment to preview</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
