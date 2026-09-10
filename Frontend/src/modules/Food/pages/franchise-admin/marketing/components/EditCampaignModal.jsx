import React, { useState, useEffect } from "react";
import { Modal, Steps, Select, Radio, InputNumber } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Info, Layers, Users, IndianRupee, AlertCircle, Sparkles } from "lucide-react";

// Form validation schema with Zod
const campaignSchema = z.object({
  campaignName: z.string().min(3, "Campaign name must be at least 3 characters").max(100, "Campaign name cannot exceed 100 characters"),
  campaignType: z.enum(["festival", "weekend_offer", "combo_offer", "flash_sale"], {
    errorMap: () => ({ message: "Please select a campaign type" }),
  }),
  description: z.string().max(300, "Description cannot exceed 300 characters").optional(),
  expectedReach: z.number({ invalid_type_error: "Must be a number" }).min(1, "Expected reach must be greater than 0"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["draft", "active"]),
  stores: z.array(z.string()).min(1, "Select at least one store"),
  targetAudience: z.enum(["all", "loyalty", "new"]),
  budget: z.number({ invalid_type_error: "Must be a number" }).min(0, "Budget cannot be negative"),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export default function EditCampaignModal({ visible, onClose, onSubmit, campaign, stores = [] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(campaignSchema),
  });

  // Pre-fill campaign details when selected
  useEffect(() => {
    if (campaign && visible) {
      reset({
        campaignName: campaign.campaignName || "",
        campaignType: campaign.campaignType || "festival",
        description: campaign.description || "",
        expectedReach: campaign.expectedReach || 0,
        startDate: campaign.startDate || "",
        endDate: campaign.endDate || "",
        status: campaign.status || "draft",
        stores: campaign.stores || [],
        targetAudience: campaign.targetAudience || "all",
        budget: campaign.budget || 0,
      });
      setCurrentStep(0);
    }
  }, [campaign, visible, reset]);

  const campaignType = watch("campaignType");
  const descriptionText = watch("description") || "";

  // Step names
  const steps = [
    { title: "General Info", icon: <Info size={14} /> },
    { title: "Schedule", icon: <Calendar size={14} /> },
    { title: "Stores", icon: <Layers size={14} /> },
    { title: "Audience", icon: <Users size={14} /> },
    { title: "Budget", icon: <IndianRupee size={14} /> },
  ];

  // Validate fields for current step before proceeding
  const handleNext = async () => {
    let fieldsToValidate = [];
    if (currentStep === 0) {
      fieldsToValidate = ["campaignName", "campaignType", "description", "expectedReach"];
    } else if (currentStep === 1) {
      fieldsToValidate = ["startDate", "endDate", "status"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["stores"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["targetAudience"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onFormSubmit = async (data) => {
    const success = await onSubmit(campaign._id, data);
    if (success !== false) {
      reset();
      setCurrentStep(0);
      onClose();
    }
  };

  // Close request (Checks for dirty state)
  const handleCancelRequest = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      handleCancelForce();
    }
  };

  const handleCancelForce = () => {
    setShowDiscardConfirm(false);
    reset();
    setCurrentStep(0);
    onClose();
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Sparkles className="text-[var(--primary)]" size={18} />
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Edit Campaign configurations
            </span>
          </div>
        }
        open={visible}
        onCancel={handleCancelRequest}
        footer={null}
        width={1100}
        destroyOnClose
        centered
        className="dark:bg-zinc-900 dark:text-zinc-100 ant-modal-custom"
      >
        <div className="py-4 font-['Poppins']">
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

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 min-h-[300px]">
            {/* STEP 1: GENERAL INFORMATION */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-down">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Campaign Name *</label>
                    <Controller
                      name="campaignName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold ${
                            errors.campaignName ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      )}
                    />
                    {errors.campaignName && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.campaignName.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Campaign Type *</label>
                    <Controller
                      name="campaignType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full text-xs font-semibold h-9"
                        >
                          <Select.Option value="festival">Festival Campaign</Select.Option>
                          <Select.Option value="weekend_offer">Weekend Offer</Select.Option>
                          <Select.Option value="combo_offer">Combo Offer</Select.Option>
                          <Select.Option value="flash_sale">Flash Sale</Select.Option>
                        </Select>
                      )}
                    />
                    {errors.campaignType && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.campaignType.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Expected Reach *</label>
                    <Controller
                      name="expectedReach"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          min={1}
                          className="w-full text-xs font-semibold h-9 rounded-lg"
                        />
                      )}
                    />
                    {errors.expectedReach && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.expectedReach.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 h-full">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Description</label>
                      <span className="text-[9px] font-bold text-zinc-400">{descriptionText.length}/300</span>
                    </div>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={6}
                          maxLength={300}
                          className="w-full flex-1 p-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold resize-none"
                        />
                      )}
                    />
                    {errors.description && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.description.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SCHEDULE */}
            {currentStep === 1 && (
              <div className="max-w-xl mx-auto space-y-4 animate-fade-down">
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

                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Campaign Status</label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Radio.Group {...field} className="grid grid-cols-2 gap-3 w-full">
                        <Radio.Button value="draft" className="text-center h-10 flex items-center justify-center font-bold text-xs uppercase rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                          📁 Save as Draft
                        </Radio.Button>
                        <Radio.Button value="active" className="text-center h-10 flex items-center justify-center font-bold text-xs uppercase rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                          ⚡ Publish Active
                        </Radio.Button>
                      </Radio.Group>
                    )}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: TARGET STORES */}
            {currentStep === 2 && (
              <div className="max-w-2xl mx-auto space-y-4 animate-fade-down">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Select Outlets *</label>
                    <span className="text-[9px] text-zinc-450 font-bold">Fetch active stores from database</span>
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
                        placeholder="Select outlets applicable for this campaign..."
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

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <h4 className="text-[9px] font-black uppercase text-zinc-400 mb-2 flex items-center gap-1">
                    💡 Store-Specific Campaigning
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                    Choosing outlets restricts promotions to checkouts belonging to selected stores. Leaving outlets empty registers the campaign globally across all franchises.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: AUDIENCE SCOPE */}
            {currentStep === 3 && (
              <div className="max-w-2xl mx-auto space-y-4 animate-fade-down">
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-2">Target Customer Scope</label>
                
                <Controller
                  name="targetAudience"
                  control={control}
                  render={({ field }) => (
                    <Radio.Group {...field} className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                      {/* All Customers */}
                      <div
                        onClick={() => field.onChange("all")}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-[var(--primary)] flex flex-col justify-between h-32 ${
                          field.value === "all"
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-lg">📢</span>
                          <Radio value="all" checked={field.value === "all"} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-805 dark:text-zinc-200 uppercase tracking-tight">All Customers</h4>
                          <p className="text-[9px] text-zinc-450 mt-1 font-semibold">Promote campaign to all logged-in guest users.</p>
                        </div>
                      </div>

                      {/* Loyalty Members */}
                      <div
                        onClick={() => field.onChange("loyalty")}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-[var(--primary)] flex flex-col justify-between h-32 ${
                          field.value === "loyalty"
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-lg">👑</span>
                          <Radio value="loyalty" checked={field.value === "loyalty"} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-805 dark:text-zinc-200 uppercase tracking-tight">Loyalty Members</h4>
                          <p className="text-[9px] text-zinc-455 mt-1 font-semibold">Restrict campaigns to Gold & Platinum tier members.</p>
                        </div>
                      </div>

                      {/* New Customers */}
                      <div
                        onClick={() => field.onChange("new")}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-[var(--primary)] flex flex-col justify-between h-32 ${
                          field.value === "new"
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-lg">✨</span>
                          <Radio value="new" checked={field.value === "new"} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-805 dark:text-zinc-200 uppercase tracking-tight">New App Users</h4>
                          <p className="text-[9px] text-zinc-450 mt-1 font-semibold">Targets users registering within the last 15 days.</p>
                        </div>
                      </div>
                    </Radio.Group>
                  )}
                />
              </div>
            )}

            {/* STEP 5: BUDGET */}
            {currentStep === 4 && (
              <div className="max-w-md mx-auto space-y-4 animate-fade-down text-center">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Marketing Budget Allocations</label>
                  <div className="relative max-w-xs mx-auto">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-450">₹</span>
                    <Controller
                      name="budget"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          min={0}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                          className="w-full pl-8 text-sm font-black h-10 rounded-lg text-left"
                        />
                      )}
                    />
                  </div>
                  {errors.budget && (
                    <span className="text-[10px] font-bold text-rose-500 block">
                      <AlertCircle size={10} className="inline mr-1" /> {errors.budget.message}
                    </span>
                  )}
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl text-left mt-6">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 mb-1">Financial Check</h4>
                  <p className="text-[9px] text-zinc-450 font-semibold leading-relaxed">
                    Budget figures help configure ROI tracking. The Campaign Performance database calculates ROI as: <br />
                    <code className="text-blue-500 font-mono text-[9.5px]">((Revenue Generated - Budget) / Budget) * 100</code>
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
                className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-805 text-zinc-650 dark:text-zinc-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous Step
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelRequest}
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Discard Confirmation Modal */}
      <Modal
        title={
          <span className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-100">
            ⚠️ Discard Unsaved Changes?
          </span>
        }
        open={showDiscardConfirm}
        onCancel={() => setShowDiscardConfirm(false)}
        onOk={handleCancelForce}
        okText="Yes, Discard"
        cancelText="Keep Editing"
        centered
        width={400}
      >
        <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed">
          You have modified campaign settings. Closing this wizard will discard all unsaved edits. Are you sure you want to exit?
        </p>
      </Modal>
    </>
  );
}
