import React, { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { Label } from "@food/components/ui/label";
import { Input } from "@food/components/ui/input";
import { Textarea } from "@food/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@food/components/ui/select";
import { useIngredients } from "../hooks/useIngredients";
import { useReportWaste } from "../hooks/useReportWaste";
import { toast } from "sonner";
import { Trash2, PlusCircle, AlertCircle, UploadCloud, FileImage, X } from "lucide-react";

export function ReportWasteModal({ isOpen, onClose, currentUser }) {
  const { data: ingredientsData, isLoading: isLoadingIngredients } = useIngredients({ limit: 100 });
  const reportWasteMutation = useReportWaste();

  const ingredientsList = ingredientsData?.data || [];

  // Form State
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [wasteType, setWasteType] = useState("expired");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [images, setImages] = useState([]); // Array of File objects
  const [imagePreviews, setImagePreviews] = useState([]); // Array of base64 strings
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Find selected ingredient
  const selectedIngredient = ingredientsList.find(ing => ing._id === ingredientId);
  const currentStock = selectedIngredient ? selectedIngredient.currentStock : 0;
  const unit = selectedIngredient ? selectedIngredient.unit : "";
  const costPerUnit = selectedIngredient ? selectedIngredient.costPerUnit : 0;

  // Live estimated loss calculation
  const quantityNum = Number(quantity) || 0;
  const estimatedLoss = quantityNum * costPerUnit;

  // Clean form state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setIngredientId("");
      setQuantity("");
      setWasteType("expired");
      setReason("");
      setRemarks("");
      setImages([]);
      setImagePreviews([]);
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleQuantityChange = (val) => {
    setQuantity(val);
    const num = parseFloat(val);

    if (val === "") {
      setErrorMsg("");
      return;
    }

    if (isNaN(num) || num <= 0) {
      setErrorMsg("Quantity must be greater than 0");
    } else if (selectedIngredient && num > currentStock) {
      setErrorMsg(`Wastage quantity cannot exceed current stock (${currentStock} ${unit})`);
    } else {
      setErrorMsg("");
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateFiles = (fileList) => {
    const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = [];
    const validPreviews = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      if (!validFormats.includes(file.type)) {
        toast.error(`${file.name} is not a valid format. Allowed: JPG, JPEG, PNG, WEBP`);
        continue;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 5MB file limit.`);
        continue;
      }

      validFiles.push(file);

      // Create base64 preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }

    setImages(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(e.target.files);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ingredientId) {
      setErrorMsg("Please select an ingredient");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Please enter a valid wastage quantity");
      return;
    }

    if (qty > currentStock) {
      setErrorMsg(`Cannot report waste: quantity exceeds current stock (${currentStock} ${unit})`);
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Reason is required to submit a waste report");
      return;
    }

    // Build FormData payload
    const formData = new FormData();
    formData.append("ingredientId", ingredientId);
    formData.append("quantity", qty);
    formData.append("wasteType", wasteType);
    formData.append("reason", reason.trim());
    formData.append("remarks", remarks.trim());
    formData.append("reportedBy", currentUser || "Aman Verma");
    
    images.forEach(img => {
      formData.append("images[]", img);
    });

    reportWasteMutation.mutate(formData, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const formatRupee = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl lg:max-w-[calc(100vw-340px)] xl:max-w-2xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <PlusCircle className="text-[var(--primary)] w-4 h-4" />
            Report Ingredient Wastage
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Log spoiled, burnt, or spilled ingredients. Stock levels will adjust automatically upon submission.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1 select-none">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[11px] flex items-center gap-1.5 font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Ingredient Selector */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Ingredient</Label>
              <Select value={ingredientId} onValueChange={(val) => {
                setIngredientId(val);
                setQuantity("");
                setErrorMsg("");
              }}>
                <SelectTrigger className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
                  <SelectValue placeholder="Pick ingredient..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg max-h-[220px]">
                  {isLoadingIngredients ? (
                    <SelectItem value="loading" disabled className="text-xs font-semibold py-1.5">Loading ingredients...</SelectItem>
                  ) : (
                    ingredientsList.map(ing => (
                      <SelectItem key={ing._id} value={ing._id} className="text-xs font-semibold py-1.5">
                        {ing.ingredientName} ({ing.currentStock} {ing.unit})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Waste Type Select */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waste Type</Label>
              <Select value={wasteType} onValueChange={(val) => setWasteType(val)}>
                <SelectTrigger className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
                  <SelectItem value="expired" className="text-xs font-semibold py-1.5 text-red-600 dark:text-red-400">Expired Spoilage</SelectItem>
                  <SelectItem value="burnt" className="text-xs font-semibold py-1.5 text-orange-600 dark:text-orange-400">Burnt In Oven</SelectItem>
                  <SelectItem value="damaged" className="text-xs font-semibold py-1.5 text-amber-600 dark:text-amber-400">Damaged Goods</SelectItem>
                  <SelectItem value="spillage" className="text-xs font-semibold py-1.5 text-blue-600 dark:text-blue-400">Spillage / Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Stock (Read-only status) */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock Level</Label>
              <div className="w-full h-8 px-2.5 rounded-lg border border-zinc-150 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950/40 text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>{selectedIngredient ? `${currentStock} ${unit}` : "No Ingredient Selected"}</span>
                {selectedIngredient && (
                  <span className="text-[9px] font-bold uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    Cost: {formatRupee(costPerUnit)}/{unit}
                  </span>
                )}
              </div>
            </div>

            {/* Waste Quantity Input */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waste Quantity</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter wasted amount..."
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  disabled={!ingredientId}
                  className="h-8 pr-12 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] bg-white dark:bg-zinc-900 w-full"
                />
                {unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {unit}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Live Loss Preview */}
          {selectedIngredient && quantityNum > 0 && !errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/40 dark:border-rose-950/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Financial Loss Preview</span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                Estimated Loss: {formatRupee(estimatedLoss)}
              </span>
            </div>
          )}

          {/* Reason (Required) */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason / Description <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Provide a detailed explanation of what happened (e.g. Cheese caught mold in drawer #3)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[50px] rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] bg-white dark:bg-zinc-900 resize-none py-1.5"
            />
          </div>

          {/* Drag & Drop Photo Upload */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wastage Proof Photos</Label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200 ${
                isDragOver 
                  ? "border-[var(--primary)] bg-[var(--primary)]/5" 
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-850/10"
              }`}
            >
              <input 
                type="file"
                ref={fileInputRef}
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadCloud className="text-[var(--primary)] w-7 h-7" />
              <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Drag & drop files here, or click to upload</p>
              <p className="text-[9px] text-zinc-400">PNG, JPG, JPEG, WEBP up to 5MB each</p>
            </div>

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2 select-none">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 aspect-video bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                    <img 
                      src={preview} 
                      alt={`Upload preview ${index + 1}`} 
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-all shadow opacity-90"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks (Optional) */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks (Optional)</Label>
            <Textarea
              placeholder="Add auxiliary notes or preventative action items..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-[50px] rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] bg-white dark:bg-zinc-900 resize-none py-1.5"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={reportWasteMutation.isPending}
              className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reportWasteMutation.isPending || !!errorMsg || !ingredientId}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {reportWasteMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Reporting...
                </>
              ) : (
                "File Waste Report"
              )}
            </button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
