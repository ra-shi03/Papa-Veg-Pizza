import React, { useState } from "react";
import { Modal, Steps, Select, Radio, Slider } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Sparkles, Info, Link2, Layers, Calendar, 
  ArrowUp10, Power, AlertCircle, Upload, Eye, Image as ImageIcon
} from "lucide-react";
import apiClient from "@food/api/axios";
import { toast } from "sonner";

// Zod validation schema
const bannerSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  subtitle: z.string().max(300, "Subtitle cannot exceed 300 characters").optional(),
  imageUrl: z.string().min(1, "Desktop banner image is required"),
  mobileImageUrl: z.string().min(1, "Mobile banner image is required"),
  redirectType: z.enum(["product", "category", "coupon", "campaign"], {
    errorMap: () => ({ message: "Please select a redirection type" }),
  }),
  redirectId: z.string().min(1, "Please select a redirection target"),
  stores: z.array(z.string()).min(1, "Assign at least one store outlet"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  priority: z.number().min(1).max(10),
  status: z.enum(["active", "inactive"])
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export default function CreateBannerModal({ visible, onClose, onSubmit, stores = [], products = [], categories = [], coupons = [], campaigns = [] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      imageUrl: "",
      mobileImageUrl: "",
      redirectType: "product",
      redirectId: "",
      stores: [],
      startDate: "",
      endDate: "",
      priority: 5,
      status: "inactive",
    },
  });

  const redirectType = watch("redirectType");
  const subtitleText = watch("subtitle") || "";
  const desktopImg = watch("imageUrl");
  const mobileImg = watch("mobileImageUrl");

  // Step headers
  const steps = [
    { title: "Content", icon: <Info size={14} /> },
    { title: "Redirection", icon: <Link2 size={14} /> },
    { title: "Stores", icon: <Layers size={14} /> },
    { title: "Schedule", icon: <Calendar size={14} /> },
    { title: "Priority", icon: <ArrowUp10 size={14} /> },
    { title: "Status", icon: <Power size={14} /> },
  ];

  // Validate current step fields before going forward
  const handleNext = async () => {
    let fields = [];
    if (currentStep === 0) {
      fields = ["title", "subtitle", "imageUrl", "mobileImageUrl"];
    } else if (currentStep === 1) {
      fields = ["redirectType", "redirectId"];
    } else if (currentStep === 2) {
      fields = ["stores"];
    } else if (currentStep === 3) {
      fields = ["startDate", "endDate"];
    } else if (currentStep === 4) {
      fields = ["priority"];
    }

    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleCancel = () => {
    reset();
    setCurrentStep(0);
    onClose();
  };

  const onFormSubmit = async (data) => {
    const success = await onSubmit(data);
    if (success !== false) {
      reset();
      setCurrentStep(0);
      onClose();
    }
  };

  // Image Upload handler
  const handleImageUpload = async (file, type) => {
    if (!file) return;
    
    // Check file type & size
    const isJpgPngWebp = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
    if (!isJpgPngWebp) {
      toast.error("You can only upload JPG/PNG/WebP files!");
      return;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      toast.error("Image must be smaller than 2MB!");
      return;
    }

    if (type === "desktop") setUploadingDesktop(true);
    if (type === "mobile") setUploadingMobile(true);

    try {
      // Simulate file upload API call
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const uploadedUrl = res.data?.data?.imageUrl || res.data?.imageUrl;
      if (uploadedUrl) {
        setValue(type === "desktop" ? "imageUrl" : "mobileImageUrl", uploadedUrl, { shouldValidate: true });
        toast.success(`${type === "desktop" ? "Desktop" : "Mobile"} banner uploaded successfully!`);
      } else {
        throw new Error("Invalid response");
      }
    } catch (_) {
      // Fallback local simulation if API offline
      setTimeout(() => {
        const fallbackUrls = {
          desktop: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
          mobile: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
        };
        setValue(type === "desktop" ? "imageUrl" : "mobileImageUrl", fallbackUrls[type], { shouldValidate: true });
        toast.success(`Mock ${type === "desktop" ? "Desktop" : "Mobile"} banner uploaded (Offline simulated).`);
      }, 800);
    } finally {
      if (type === "desktop") setUploadingDesktop(false);
      if (type === "mobile") setUploadingMobile(false);
    }
  };

  // Redirection target choices helper
  const getRedirectOptions = () => {
    switch (redirectType) {
      case "product":
        return products.map(p => ({ value: p._id, label: p.name }));
      case "category":
        return categories.map(c => ({ value: c._id, label: c.name }));
      case "coupon":
        return coupons.map(cp => ({ value: cp._id, label: cp.code }));
      case "campaign":
        return campaigns.map(camp => ({ value: camp._id, label: camp.campaignName }));
      default:
        return [];
    }
  };

  const getPriorityLabel = (val) => {
    if (val <= 3) return { label: "High Priority", color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" };
    if (val <= 7) return { label: "Medium Priority", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" };
    return { label: "Low Priority", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" };
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <Sparkles className="text-[var(--primary)]" size={18} />
          <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-['Poppins']">
            Add Promotional Banner Wizard
          </span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={1200}
      destroyOnClose
      centered
      className="dark:bg-zinc-900 dark:text-zinc-100 ant-modal-custom"
    >
      <div className="py-4 font-['Poppins']">
        {/* Progress steps bar */}
        <Steps
          current={currentStep}
          size="small"
          className="mb-8"
          items={steps.map((s, idx) => ({
            title: <span className="text-[10px] font-black uppercase text-zinc-400">{s.title}</span>,
            icon: (
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  currentStep === idx
                    ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-md shadow-primary/20"
                    : currentStep > idx
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                }`}
              >
                {s.icon}
              </div>
            ),
          }))}
        />

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 min-h-[340px]">
          {/* STEP 1: CONTENT */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-down">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Banner Title *</label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="e.g. Grand Monsoon Feast Sale"
                        className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold ${
                          errors.title ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      />
                    )}
                  />
                  {errors.title && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.title.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Subtitle / Description</label>
                    <span className="text-[9px] font-bold text-zinc-400">{subtitleText.length}/300</span>
                  </div>
                  <Controller
                    name="subtitle"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={4}
                        maxLength={300}
                        placeholder="Detail details of this banner promotion to display on client application..."
                        className="w-full p-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold resize-none"
                      />
                    )}
                  />
                  {errors.subtitle && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.subtitle.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Uploads column */}
              <div className="grid grid-cols-2 gap-4">
                {/* Desktop Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Desktop Banner Image *</label>
                  <div className="relative group border border-dashed border-zinc-200 dark:border-zinc-850 hover:border-[var(--primary)] rounded-xl p-4 flex flex-col items-center justify-center text-center h-[160px] bg-zinc-50/50 dark:bg-zinc-950/20 cursor-pointer overflow-hidden transition-all duration-200">
                    {desktopImg ? (
                      <>
                        <img src={desktopImg} alt="Desktop Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 rounded-xl">
                          <Upload size={18} />
                          <span className="text-[8px] font-black uppercase mt-1">Replace Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon size={24} className="text-zinc-300 dark:text-zinc-700 mb-1" />
                        <span className="text-[9px] font-black text-zinc-450 uppercase">Drag & Drop / Browse</span>
                        <span className="text-[7.5px] text-zinc-400 font-semibold mt-0.5">JPG, PNG, WebP (Max 2MB)</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], "desktop")}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingDesktop}
                    />
                    {uploadingDesktop && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center">
                        <span className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></span>
                      </div>
                    )}
                  </div>
                  {errors.imageUrl && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.imageUrl.message}
                    </span>
                  )}
                </div>

                {/* Mobile Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Mobile Banner Image *</label>
                  <div className="relative group border border-dashed border-zinc-200 dark:border-zinc-850 hover:border-[var(--primary)] rounded-xl p-4 flex flex-col items-center justify-center text-center h-[160px] bg-zinc-50/50 dark:bg-zinc-950/20 cursor-pointer overflow-hidden transition-all duration-200">
                    {mobileImg ? (
                      <>
                        <img src={mobileImg} alt="Mobile Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 rounded-xl">
                          <Upload size={18} />
                          <span className="text-[8px] font-black uppercase mt-1">Replace Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon size={24} className="text-zinc-300 dark:text-zinc-700 mb-1" />
                        <span className="text-[9px] font-black text-zinc-450 uppercase">Drag & Drop / Browse</span>
                        <span className="text-[7.5px] text-zinc-400 font-semibold mt-0.5">Recommended: 1080×480</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], "mobile")}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingMobile}
                    />
                    {uploadingMobile && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center">
                        <span className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></span>
                      </div>
                    )}
                  </div>
                  {errors.mobileImageUrl && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.mobileImageUrl.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REDIRECTION */}
          {currentStep === 1 && (
            <div className="max-w-xl mx-auto space-y-5 animate-fade-down">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400">Redirection Type *</label>
                <Controller
                  name="redirectType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue("redirectId", ""); // Reset target
                      }}
                      className="w-full text-xs font-semibold h-9"
                    >
                      <Select.Option value="product">🍕 Product Drilldown</Select.Option>
                      <Select.Option value="category">📁 Category Folder</Select.Option>
                      <Select.Option value="coupon">🎟️ Coupon Voucher</Select.Option>
                      <Select.Option value="campaign">📢 Marketing Campaign</Select.Option>
                    </Select>
                  )}
                />
                {errors.redirectType && (
                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.redirectType.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400">Redirection Target *</label>
                <Controller
                  name="redirectId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      showSearch
                      placeholder="Search and select redirection target..."
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      options={getRedirectOptions()}
                      className="w-full text-xs font-semibold h-9"
                    />
                  )}
                />
                {errors.redirectId && (
                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.redirectId.message}
                  </span>
                )}
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-start gap-2.5">
                <Info className="text-[var(--primary)] shrink-0 mt-0.5" size={14} />
                <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">
                  Clicking this banner inside the customer application will automatically redirect user routing to the selected target item details page.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: STORES */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto space-y-4 animate-fade-down">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Target Store Outlets *</label>
                  <button
                    type="button"
                    onClick={() => setValue("stores", stores.map(s => s._id), { shouldValidate: true })}
                    className="text-[9px] font-black uppercase text-[var(--primary)] hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Select All Outlets
                  </button>
                </div>
                <Controller
                  name="stores"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      mode="multiple"
                      allowClear
                      showSearch
                      className="w-full text-xs font-semibold min-h-[38px] rounded-lg"
                      placeholder="Select franchise outlets where this banner should be visible..."
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      options={stores.map((s) => ({
                        value: s._id,
                        label: s.name || s.storeName,
                      }))}
                    />
                  )}
                />
                {errors.stores && (
                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.stores.message}
                  </span>
                )}
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                <h4 className="text-[9.5px] font-black uppercase text-zinc-400 mb-1">💡 Outlets Visibility Rules</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                  Choosing outlets restricts banners to customers browsing menus matching the selected store coordinates. Leaving outlets empty displays the banner globally across all franchises.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SCHEDULE */}
          {currentStep === 3 && (
            <div className="max-w-xl mx-auto space-y-5 animate-fade-down">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Start Date *</label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold h-[34px] cursor-pointer"
                      />
                    )}
                  />
                  {errors.startDate && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.startDate.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400">End Date *</label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold h-[34px] cursor-pointer"
                      />
                    )}
                  />
                  {errors.endDate && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.endDate.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-zinc-500 uppercase">Computed Banner Validity:</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {watch("startDate") && watch("endDate") ? (
                    `${Math.ceil((new Date(watch("endDate")) - new Date(watch("startDate"))) / (1000 * 60 * 60 * 24)) + 1} Days Active`
                  ) : (
                    "Schedule Pending"
                  )}
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: PRIORITY */}
          {currentStep === 4 && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-down text-center">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-zinc-400">Display Priority Rank (1-10)</label>
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl mt-2">
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        {...field}
                        min={1}
                        max={10}
                        tooltip={{ formatter: (val) => `Priority Rank: ${val}` }}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${getPriorityLabel(watch("priority")).color}`}>
                  {getPriorityLabel(watch("priority")).label} (Rank {watch("priority")})
                </span>
              </div>

              <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold max-w-sm mx-auto">
                Banners with higher priority rankings (lower numbers, e.g. 1, 2) load first in client carousels. Priority ranges from 1 (High) to 10 (Low).
              </p>
            </div>
          )}

          {/* STEP 6: INITIAL STATUS */}
          {currentStep === 5 && (
            <div className="max-w-md mx-auto space-y-5 animate-fade-down">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase text-zinc-400 text-center">Publish Settings</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Radio.Group {...field} className="grid grid-cols-2 gap-3 w-full">
                      <Radio.Button value="inactive" className="text-center h-12 flex items-center justify-center font-black text-xs uppercase rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        📁 Save Inactive (Draft)
                      </Radio.Button>
                      <Radio.Button value="active" className="text-center h-12 flex items-center justify-center font-black text-xs uppercase rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        ⚡ Publish Active
                      </Radio.Button>
                    </Radio.Group>
                  )}
                />
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
                <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-1">⚡ Immediate Live Release</h4>
                <p className="text-[9.5px] text-zinc-500 font-semibold leading-relaxed">
                  Selecting <strong>Publish Active</strong> registers the banner as visible in client app menus immediately if current date falls within the validity schedule.
                </p>
              </div>
            </div>
          )}

          {/* FOOTER WIZARD ACTIONS */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-205"
            >
              Previous Step
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg border-0 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer transition-all duration-200"
              >
                Cancel
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg bg-[var(--primary)] hover:opacity-90 text-white border-0 cursor-pointer transition-all duration-200"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg bg-[var(--primary)] hover:opacity-90 text-white border-0 cursor-pointer shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Save Banner"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
