import React, { useState } from 'react';
import { Upload, FolderPlus, Search, ChevronDown, CheckCircle2, PlayCircle, FileText, Trash2, FolderInput, Link } from 'lucide-react';

export default function MediaLibrary() {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [previewAsset, setPreviewAsset] = useState(null);

  const assets = [
    {
      id: 'asset1',
      name: 'pepperoni_deluxe_promo.jpg',
      size: '1.2 MB',
      type: 'IMAGE',
      src: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1000&auto=format&fit=crop&fm=webp',
      uploader: 'Admin (Marco Rossi)',
      date: 'Oct 24, 2023, 11:20 AM',
      dimensions: '1920 x 1080 px',
      isVideo: false
    },
    {
      id: 'asset2',
      name: 'mediterranean_special.jpg',
      size: '842 KB',
      type: 'IMAGE',
      src: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1000&auto=format&fit=crop&fm=webp',
      uploader: 'Admin (Marco Rossi)',
      date: 'Oct 23, 2023, 09:15 AM',
      dimensions: '1080 x 1080 px',
      isVideo: false
    },
    {
      id: 'asset3',
      name: 'store_reveal_clip.mp4',
      size: '14.5 MB',
      type: 'VIDEO',
      src: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1000&auto=format&fit=crop&fm=webp',
      uploader: 'Marketing Team',
      date: 'Oct 22, 2023, 02:45 PM',
      dimensions: '1920 x 1080 px',
      isVideo: true,
      duration: '0:15'
    },
    {
      id: 'asset4',
      name: 'margherita_raw.png',
      size: '2.1 MB',
      type: 'IMAGE',
      src: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?q=80&w=1000&auto=format&fit=crop&fm=webp',
      uploader: 'Admin (Marco Rossi)',
      date: 'Oct 20, 2023, 04:30 PM',
      dimensions: '2400 x 1600 px',
      isVideo: false
    },
    {
      id: 'asset5',
      name: 'franchise_brand_guide.pdf',
      size: '4.8 MB',
      type: 'DOCUMENT',
      src: null,
      uploader: 'Legal Team',
      date: 'Oct 15, 2023, 10:00 AM',
      dimensions: 'A4',
      isVideo: false
    },
    {
      id: 'asset6',
      name: 'app_icon_v2.png',
      size: '124 KB',
      type: 'IMAGE',
      src: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1000&auto=format&fit=crop&fm=webp',
      uploader: 'Design Team',
      date: 'Oct 10, 2023, 11:11 AM',
      dimensions: '512 x 512 px',
      isVideo: false
    }
  ];

  const handleAssetClick = (asset) => {
    if (selectedItems.size > 0) {
      toggleSelection(asset.id);
    } else {
      setPreviewAsset(asset);
    }
  };

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const closePreview = () => {
    setPreviewAsset(null);
  };

  const copyUrl = () => {
    alert('CDN URL copied to clipboard!');
  };

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-300 relative">
      {/* Page Header Section */}
      <section className="pb-2.5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#271815]">Media Library</h2>
            <p className="text-xs text-[#5b403c]">Manage digital assets</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 bg-[#b41e15] text-white py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1 active:scale-95 transition-transform">
            <Upload size={15} />
            Upload File
          </button>
          <button className="flex-1 bg-[#dae1e3] text-[#5d6466] py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1 border border-[#e4beb8] active:scale-95 transition-transform">
            <FolderPlus size={15} />
            New Folder
          </button>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="mb-3 sticky top-0 bg-[#fff8f7]/95 backdrop-blur-sm py-1 z-30">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b403c] group-focus-within:text-[#b41e15] transition-colors" size={16} />
          <input className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#e4beb8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#b41e15]/20 focus:border-[#b41e15]" placeholder="Search assets..." type="text" />
        </div>
        <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button className="whitespace-nowrap px-3 py-1 bg-[#b41e15] text-white rounded-full text-xs font-semibold tracking-wide">All Files</button>
          <button className="whitespace-nowrap px-3 py-1 bg-[#ffe2dd] text-[#5b403c] rounded-full text-xs font-semibold tracking-wide border border-[#e4beb8]">Images</button>
          <button className="whitespace-nowrap px-3 py-1 bg-[#ffe2dd] text-[#5b403c] rounded-full text-xs font-semibold tracking-wide border border-[#e4beb8]">Videos</button>
          <button className="whitespace-nowrap px-3 py-1 bg-[#ffe2dd] text-[#5b403c] rounded-full text-xs font-semibold tracking-wide border border-[#e4beb8]">Documents</button>
          <button className="whitespace-nowrap px-3 py-1 bg-[#ffe2dd] text-[#5b403c] rounded-full text-xs font-semibold tracking-wide border border-[#e4beb8] flex items-center gap-1">
            Date
            <ChevronDown size={14} />
          </button>
        </div>
      </section>

      {/* Media Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-16">
        {assets.map((asset) => {
          const isSelected = selectedItems.has(asset.id);
          return (
            <div 
              key={asset.id}
              className={`bg-white border rounded-xl overflow-hidden relative group cursor-pointer transition-colors ${isSelected ? 'border-[#b41e15] bg-[#b41e15]/5' : 'border-[#e4beb8] hover:border-[#b41e15]'}`}
              onClick={() => handleAssetClick(asset)}
              onContextMenu={(e) => { e.preventDefault(); toggleSelection(asset.id); }}
            >
              <div className="aspect-square bg-[#ffe9e6] relative flex items-center justify-center">
                {asset.src ? (
                  <>
                    <img className="w-full h-full object-cover" alt={asset.name} src={asset.src} />
                    {asset.isVideo && (
                      <>
                        <div className="absolute inset-0 bg-black/20 z-10"></div>
                        <PlayCircle className="absolute text-white z-20" size={32} />
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded font-bold z-20">{asset.duration}</div>
                      </>
                    )}
                  </>
                ) : (
                  <FileText className="text-[#b41e15]" size={44} />
                )}
                
                <div className={`absolute top-2 right-2 transition-opacity z-20 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleSelection(asset.id); }}
                    className={`rounded-full bg-white ${isSelected ? 'text-[#b41e15]' : 'text-[#e4beb8] hover:text-[#b41e15]'}`}
                  >
                    <CheckCircle2 size={18} className={isSelected ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold tracking-wide text-[#271815] truncate">{asset.name}</p>
                <p className="text-[10px] text-[#5b403c]">{asset.size}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-[#271815]/40 backdrop-blur-sm transition-opacity duration-300" onClick={closePreview}></div>
          <div className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl md:mb-8 p-4 z-10 shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-[#e4beb8] rounded-full mx-auto mb-4 md:hidden"></div>
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#ffe9e6] shrink-0 flex items-center justify-center">
                {previewAsset.src ? (
                  <img className="w-full h-full object-cover" src={previewAsset.src} alt={previewAsset.name} />
                ) : (
                  <FileText className="text-[#b41e15]" size={32} />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-sm font-semibold text-[#271815] mb-1 truncate">{previewAsset.name}</h3>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-[#dae1e3] text-[#5d6466] px-1.5 py-0.5 rounded text-[10px] font-medium">{previewAsset.type}</span>
                  <span className="bg-[#ffe2dd] text-[#5b403c] px-1.5 py-0.5 rounded text-[10px] font-medium">{previewAsset.size}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2.5 border-t border-[#e4beb8] pt-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#5b403c]">Uploaded by</span>
                <span className="text-xs font-semibold tracking-wide text-[#271815]">{previewAsset.uploader}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#5b403c]">Date Created</span>
                <span className="text-xs font-semibold tracking-wide text-[#271815]">{previewAsset.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#5b403c]">Dimensions</span>
                <span className="text-xs font-semibold tracking-wide text-[#271815]">{previewAsset.dimensions}</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="bg-[#b41e15] text-white py-2 rounded-xl text-xs font-semibold tracking-wide active:opacity-80 transition-opacity">Download</button>
              <button className="border border-[#8f706b] text-[#5b403c] py-2 rounded-xl text-xs font-semibold tracking-wide hover:bg-[#ffe9e6] transition-colors" onClick={closePreview}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      <div className={`fixed bottom-8 left-4 right-4 z-40 pointer-events-none transition-transform duration-300 ${selectedItems.size > 0 ? 'translate-y-0' : 'translate-y-32'}`}>
        <div className="bg-[#f9dcd8]/95 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between shadow-xl border border-[#e4beb8] pointer-events-auto max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-[#b41e15] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
              {selectedItems.size}
            </div>
            <span className="text-xs font-semibold tracking-wide text-[#271815]">Selected</span>
          </div>
          <div className="flex gap-3">
            <button className="flex flex-col items-center gap-0.5 text-[#5b403c] hover:text-[#b41e15] transition-colors" onClick={() => { alert('Deleted!'); setSelectedItems(new Set()); }}>
              <Trash2 size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Delete</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-[#5b403c] hover:text-[#b41e15] transition-colors">
              <FolderInput size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Move</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-[#b41e15] hover:opacity-80 transition-opacity" onClick={copyUrl}>
              <Link size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Copy URL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
