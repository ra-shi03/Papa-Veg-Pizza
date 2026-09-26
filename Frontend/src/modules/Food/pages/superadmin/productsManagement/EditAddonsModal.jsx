import React, { useState, useEffect } from "react";
import { X, CloudUpload, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadAPI } from "@/services/api";

export default function EditAddonsModal({ isOpen, onClose, addonData, onSave }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [prices, setPrices] = useState([{ size: "Default", price: "" }]);
  const [image, setImage] = useState("");
  const [status, setStatus] = useState("Active");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen && addonData) {
      setName(addonData.name || "");
      setType(addonData.type || "");
      if (addonData.prices && addonData.prices.length > 0) {
        setPrices(addonData.prices.map(p => ({ size: p.size, price: p.price })));
      } else {
        setPrices([{ size: addonData.size || "Default", price: addonData.price || "" }]);
      }
      setImage(addonData.image || "");
      setStatus(addonData.status || "Active");
      setLoading(false);
    }
  }, [isOpen, addonData]);

  if (!isOpen) return null;

  const processFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }
    setIsUploading(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setImage(url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    const validPrices = prices.filter(p => p.size && p.price !== "");
    if (!name || !type || validPrices.length === 0) {
      alert("Name, Type, and at least one Price are required.");
      return;
    }
    setLoading(true);
    const payload = {
      ...addonData,
      name,
      type,
      prices: validPrices.map(p => ({ size: p.size, price: Number(p.price) })),
      image,
      status
    };
    await onSave(payload);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Edit Add-on</h2>
            <p className="text-sm text-zinc-500 mt-1">Update the details of your add-on.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Add-on Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Extra Cheese Burst"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Type *</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Topping, Crust, Dip"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-span-2 space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Sizes & Prices *</label>
              {prices.map((p, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select
                      value={p.size}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].size = e.target.value;
                        setPrices(newPrices);
                      }}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors outline-none"
                    >
                      <option value="Default">Default / No Size</option>
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                      <option value="Regular">Regular</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={p.price}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].price = e.target.value;
                        setPrices(newPrices);
                      }}
                      placeholder="Price (₹)"
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-colors outline-none"
                    />
                  </div>
                  {prices.length > 1 && (
                    <button
                      onClick={() => setPrices(prices.filter((_, i) => i !== index))}
                      className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPrices([...prices, { size: "Small", price: "" }])}
                className="text-[var(--primary)] text-sm font-semibold hover:underline flex items-center gap-1"
              >
                + Add another size
              </button>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Image</label>
              {!image ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    dragOver ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                  } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {isUploading ? (
                    <Loader2 className="mx-auto text-zinc-400 mb-3 animate-spin" size={32} />
                  ) : (
                    <CloudUpload className="mx-auto text-zinc-400 mb-3" size={32} />
                  )}
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {isUploading ? "Uploading image..." : "Drag and drop your image here"}
                  </p>
                  <p className="text-xs text-zinc-500 mb-4">PNG, JPG or WebP up to 5MB</p>
                  
                  <input type="file" id="edit-image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  <label htmlFor="edit-image-upload" className="inline-block px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                    Browse Files
                  </label>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 group h-40 flex items-center justify-center">
                  <img src={image} alt="Preview" className="h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setImage("")}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? "Saving..." : <><CheckCircle size={18} /> Update Add-on</>}
          </button>
        </div>
      </div>
    </div>
  );
}
