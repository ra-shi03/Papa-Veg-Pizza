import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, Select, Switch } from "antd";
import { 
  X, Info, BadgePercent, ShieldAlert, Award, Calendar, 
  Store, Pizza, FolderOpen, ChevronRight, Copy 
} from "lucide-react";
import { mockStores, mockProducts, mockCategories } from "../mockData";

// Zod validation schema
const couponSchema = z.object({
  couponCode: z.string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(15, "Coupon code cannot exceed 15 characters")
    .regex(/^[A-Z0-9_]+$/, "Only uppercase letters, numbers, and underscores allowed"),
  title: z.string().min(3, "Title must be at least 3 characters").max(60, "Title cannot exceed 60 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(250, "Description cannot exceed 250 characters"),
  status: z.enum(["active", "inactive"]),
  discountType: z.enum(["percentage", "fixed", "free-delivery"]),
  discountValue: z.number().min(0, "Discount value cannot be negative"),
  maximumDiscount: z.number().min(0, "Maximum discount cannot be negative").optional().nullable(),
  minimumOrderAmount: z.number().min(0, "Minimum order amount cannot be negative").optional().nullable(),
  usageLimit: z.number().int().positive("Usage limit must be a positive integer").optional().nullable(),
  usagePerCustomer: z.number().int().positive("Usage per customer must be a positive integer").optional().nullable(),
  storeIds: z.array(z.string()).default([]),
  applicableProducts: z.array(z.string()).default([]),
  applicableCategories: z.array(z.string()).default([]),
  customerType: z.enum(["all", "new", "loyalty"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required")
}).superRefine((data, ctx) => {
  if (data.usagePerCustomer && data.usageLimit && data.usagePerCustomer > data.usageLimit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Usage per customer cannot exceed total usage limit",
      path: ["usagePerCustomer"]
    });
  }
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be strictly after start date",
        path: ["endDate"]
      });
    }
  }
  if (data.discountType === "percentage" && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"]
    });
  }
});

export default function CloneCouponModal({ visible, onClose, onSubmit, coupon }) {
  const [activeTab, setActiveTab] = useState("basic");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(couponSchema)
  });

  // Populate data when source coupon loaded
  useEffect(() => {
    if (coupon) {
      // Suggest code
      let baseCode = coupon.couponCode || "";
      if (baseCode.includes("_CLONE")) {
        baseCode = baseCode.split("_CLONE")[0];
      }
      const randomSuffix = Math.floor(Math.random() * 900) + 100;
      const suggestedCode = `${baseCode}_CLONE${randomSuffix}`;

      reset({
        couponCode: suggestedCode,
        title: `Clone of ${coupon.title || ""}`,
        description: coupon.description || "",
        status: "active", // default active for clones
        discountType: coupon.discountType || "percentage",
        discountValue: coupon.discountValue || 0,
        maximumDiscount: coupon.maximumDiscount || null,
        minimumOrderAmount: coupon.minimumOrderAmount || null,
        usageLimit: coupon.usageLimit || null,
        usagePerCustomer: coupon.usagePerCustomer || null,
        storeIds: coupon.storeIds || [],
        applicableProducts: coupon.applicableProducts || [],
        applicableCategories: coupon.applicableCategories || [],
        customerType: coupon.customerType || "all",
        startDate: coupon.startDate || "",
        endDate: coupon.endDate || ""
      });
      setActiveTab("basic");
    }
  }, [coupon, reset]);

  const watchedCode = watch("couponCode") || "";
  const watchedDesc = watch("description") || "";
  const watchedDiscountType = watch("discountType");
  const watchedCustomerType = watch("customerType");

  const handleNameChange = (e) => {
    const code = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
    setValue("couponCode", code);
    trigger("couponCode");
  };

  const handleDiscountTypeChange = (type) => {
    setValue("discountType", type);
    if (type === "free-delivery") {
      setValue("discountValue", 0);
      setValue("maximumDiscount", null);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: Info },
    { id: "discount", label: "Discount", icon: BadgePercent },
    { id: "rules", label: "Rules", icon: ShieldAlert },
    { id: "applicability", label: "Applicability", icon: Store },
    { id: "eligibility", label: "Eligibility", icon: Award },
    { id: "validity", label: "Validity", icon: Calendar }
  ];

  const onFormSubmit = (data) => {
    const normalizedData = {
      ...data,
      maximumDiscount: data.maximumDiscount || 0,
      minimumOrderAmount: data.minimumOrderAmount || 0,
      usageLimit: data.usageLimit || 0,
      usagePerCustomer: data.usagePerCustomer || 0
    };
    onSubmit(normalizedData);
  };

  const handleClose = () => {
    setActiveTab("basic");
    onClose();
  };

  const getTabStatus = (tabId) => {
    const fields = {
      basic: ["couponCode", "title", "description"],
      discount: ["discountValue", "maximumDiscount"],
      rules: ["minimumOrderAmount", "usageLimit", "usagePerCustomer"],
      applicability: ["storeIds", "applicableProducts", "applicableCategories"],
      eligibility: ["customerType"],
      validity: ["startDate", "endDate"]
    };
    
    const fieldsInTab = fields[tabId] || [];
    const hasError = fieldsInTab.some(f => !!errors[f]);
    return hasError ? "border-rose-500 text-rose-500 bg-rose-50/50" : "";
  };

  if (!coupon) return null;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={1100}
      centered
      styles={{ body: { padding: 0 } }}
      className="font-['Poppins'] select-none overflow-hidden"
    >
      <div className="flex h-[600px] overflow-hidden text-xs bg-slate-50 dark:bg-zinc-950">
        
        {/* Left Tabs Sidebar */}
        <aside className="w-[240px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shrink-0">
          <div>
            <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg inline-block mb-1.5 font-bold">
                <BadgePercent size={14} />
              </span>
              <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                Clone Coupon
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5 leading-none">
                Pre-filled configuration copy
              </p>
            </div>

            <nav className="p-2 space-y-1">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const errorClass = getTabStatus(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-extrabold uppercase transition-all duration-150 text-left cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] border-l-4 border-[var(--primary)]"
                        : errorClass || "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-850 dark:hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TabIcon size={14} className="shrink-0" />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight size={12} className="opacity-40" />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 text-[9px] text-zinc-400 font-bold leading-normal">
            * Submitting this form creates a duplicate instance of this coupon.
          </div>
        </aside>

        {/* Right Form Area */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <h4 className="font-black text-xs text-zinc-900 dark:text-white uppercase tracking-wide">
              {tabs.find(t => t.id === activeTab)?.label} Settings
            </h4>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Form Content Scroll Box */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            
            {/* Tab 1: Basic Info */}
            {activeTab === "basic" && (
              <div className="space-y-4 max-w-2xl animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">Suggested Coupon Code *</label>
                    <input
                      type="text"
                      value={watchedCode}
                      onChange={handleNameChange}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold font-mono tracking-widest text-[11px]"
                      placeholder="E.G. PAPA50"
                    />
                    {errors.couponCode && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.couponCode.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">Status *</label>
                    <div className="flex items-center h-[38px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 justify-between font-bold">
                      <span className="text-zinc-600 dark:text-zinc-350">Active Status</span>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value === "active"}
                            onChange={(checked) => field.onChange(checked ? "active" : "inactive")}
                            size="small"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold uppercase text-[9px]">Campaign Title *</label>
                  <input
                    type="text"
                    {...register("title")}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold"
                    placeholder="e.g. Weekend Pizza Special"
                  />
                  {errors.title && (
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">Description *</label>
                    <span className="text-[9px] text-zinc-400 font-bold">{watchedDesc.length}/250 Characters</span>
                  </div>
                  <textarea
                    rows={4}
                    {...register("description")}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 resize-none font-sans font-semibold leading-relaxed"
                    placeholder="Describe coupon details, limits, terms..."
                  />
                  {errors.description && (
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Discount */}
            {activeTab === "discount" && (
              <div className="space-y-5 max-w-2xl animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold uppercase text-[9px] mb-1">Discount Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "percentage", label: "Percentage %", desc: "Deduce percentage fraction" },
                      { id: "fixed", label: "Fixed Amount (₹)", desc: "Deduce flat rupee amount" },
                      { id: "free-delivery", label: "Free Delivery", desc: "Waive delivery charge" }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleDiscountTypeChange(type.id)}
                        className={`p-3.5 border rounded-xl flex flex-col text-left justify-between cursor-pointer transition-all duration-150 ${
                          watchedDiscountType === type.id
                            ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="font-extrabold uppercase text-[10px]">{type.label}</span>
                        <span className="text-[8.5px] text-zinc-400 mt-1 font-medium">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {watchedDiscountType !== "free-delivery" && (
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold uppercase text-[9px]">
                        {watchedDiscountType === "percentage" ? "Discount Percentage (%) *" : "Flat Discount Value (₹) *"}
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register("discountValue", { valueAsNumber: true })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold"
                        placeholder={watchedDiscountType === "percentage" ? "e.g. 50" : "e.g. 100"}
                      />
                      {errors.discountValue && (
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.discountValue.message}</p>
                      )}
                    </div>
                  )}

                  {watchedDiscountType === "percentage" && (
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold uppercase text-[9px]">Maximum Discount Capping (₹)</label>
                      <input
                        type="number"
                        {...register("maximumDiscount", { valueAsNumber: true })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold"
                        placeholder="e.g. 150"
                      />
                      {errors.maximumDiscount && (
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.maximumDiscount.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Rules */}
            {activeTab === "rules" && (
              <div className="space-y-4 max-w-2xl animate-fade-in">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">Minimum Order Value (₹)</label>
                    <input
                      type="number"
                      {...register("minimumOrderAmount", { valueAsNumber: true })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold"
                      placeholder="e.g. 399"
                    />
                    {errors.minimumOrderAmount && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.minimumOrderAmount.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">Global Usage Limit</label>
                    <input
                      type="number"
                      {...register("usageLimit", { valueAsNumber: true })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold"
                      placeholder="e.g. 1000"
                    />
                    {errors.usageLimit && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.usageLimit.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">Usage Per Customer</label>
                    <input
                      type="number"
                      {...register("usagePerCustomer", { valueAsNumber: true })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold"
                      placeholder="e.g. 1"
                    />
                    {errors.usagePerCustomer && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.usagePerCustomer.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Applicability */}
            {activeTab === "applicability" && (
              <div className="space-y-4 max-w-2xl animate-fade-in font-semibold text-zinc-750 dark:text-zinc-350">
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold uppercase text-[9px] flex items-center gap-1">
                    <Store size={12} />
                    Franchise Outlets / Stores (Select multi, leave empty for all)
                  </label>
                  <Controller
                    name="storeIds"
                    control={control}
                    render={({ field }) => (
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Choose outlets..."
                        className="w-full font-semibold"
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        options={mockStores.map(s => ({ value: s._id, label: s.name }))}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    )}
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <label className="block text-zinc-500 font-bold uppercase text-[9px] flex items-center gap-1">
                    <Pizza size={12} />
                    Applicable Products (Select multi, leave empty for all)
                  </label>
                  <Controller
                    name="applicableProducts"
                    control={control}
                    render={({ field }) => (
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Choose dishes..."
                        className="w-full font-semibold"
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        options={mockProducts.map(p => ({ value: p._id, label: `${p.name} (₹${p.price})` }))}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    )}
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <label className="block text-zinc-500 font-bold uppercase text-[9px] flex items-center gap-1">
                    <FolderOpen size={12} />
                    Applicable Categories (Select multi, leave empty for all)
                  </label>
                  <Controller
                    name="applicableCategories"
                    control={control}
                    render={({ field }) => (
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Choose categories..."
                        className="w-full font-semibold"
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        options={mockCategories.map(c => ({ value: c._id, label: c.name }))}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* Tab 5: Customer Eligibility */}
            {activeTab === "eligibility" && (
              <div className="space-y-4 max-w-2xl animate-fade-in">
                <label className="block text-zinc-500 font-bold uppercase text-[9px] mb-1">Target Customer Segment *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "all", label: "All Customers", desc: "Available for everyone at checkout" },
                    { id: "new", label: "New Customers", desc: "First order users validation check" },
                    { id: "loyalty", label: "Loyalty Members", desc: "Registered program members only" }
                  ].map(target => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setValue("customerType", target.id)}
                      className={`p-3.5 border rounded-xl flex flex-col text-left justify-between cursor-pointer transition-all duration-150 ${
                        watchedCustomerType === target.id
                          ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="font-extrabold uppercase text-[10px]">{target.label}</span>
                      <span className="text-[8.5px] text-zinc-400 mt-1 font-medium">{target.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 6: Validity */}
            {activeTab === "validity" && (
              <div className="space-y-4 max-w-2xl animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">Start Date *</label>
                    <input
                      type="date"
                      {...register("startDate")}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold cursor-pointer"
                    />
                    {errors.startDate && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold uppercase text-[9px]">End / Expiration Date *</label>
                    <input
                      type="date"
                      {...register("endDate")}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 font-bold cursor-pointer"
                    />
                    {errors.endDate && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Controls */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1"
            >
              <Copy size={14} />
              <span>Clone Coupon</span>
            </button>
          </footer>

        </form>

      </div>
    </Modal>
  );
}
