import React, { useState, useEffect } from "react";
import { Modal, Steps, Checkbox, Select } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Sparkles, Info, Bell, CheckSquare, Layers, 
  Clock, AlertCircle, Smartphone, Mail, Eye, Monitor, User
} from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";

// Zod validation schema
const notificationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  message: z.string().min(5, "Message must be at least 5 characters").max(500, "Message cannot exceed 500 characters"),
  notificationType: z.array(z.string()).min(1, "Select at least one notification channel"),
  targetAudience: z.enum(["all", "loyalty", "new", "inactive"], {
    errorMap: () => ({ message: "Please select a target audience" }),
  }),
  stores: z.array(z.string()).min(1, "Select at least one store outlet"),
  sendOption: z.enum(["now", "later"]),
  scheduleTime: z.string().optional()
}).refine((data) => {
  if (data.sendOption === "later") {
    if (!data.scheduleTime) return false;
    return new Date(data.scheduleTime) > new Date();
  }
  return true;
}, {
  message: "Schedule time must be in the future",
  path: ["scheduleTime"],
});

export default function EditNotificationModal({ visible, onClose, onSubmit, notification, stores = [] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [previewTab, setPreviewTab] = useState("push"); // push | sms | email

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(notificationSchema),
  });

  // Pre-fill notification details
  useEffect(() => {
    if (notification && visible) {
      const isScheduled = notification.status === "scheduled";
      let localTime = "";
      if (isScheduled && notification.scheduleTime) {
        localTime = dayjs(notification.scheduleTime).format("YYYY-MM-DDTHH:mm");
      }

      reset({
        title: notification.title || "",
        message: notification.message || "",
        notificationType: notification.notificationType || ["push"],
        targetAudience: notification.targetAudience || "all",
        stores: notification.stores || [],
        sendOption: isScheduled ? "later" : "now",
        scheduleTime: localTime
      });
      setCurrentStep(0);
    }
  }, [notification, visible, reset]);

  const watchTitle = watch("title") || "";
  const watchMessage = watch("message") || "";
  const watchChannels = watch("notificationType") || [];
  const watchAudience = watch("targetAudience") || "all";
  const watchStores = watch("stores") || [];
  const watchSendOption = watch("sendOption") || "now";
  const watchScheduleTime = watch("scheduleTime") || "";

  const steps = [
    { title: "Message Content", icon: <Bell size={13} /> },
    { title: "Channels", icon: <CheckSquare size={13} /> },
    { title: "Audience", icon: <User size={13} /> },
    { title: "Store Outlets", icon: <Layers size={13} /> },
    { title: "Scheduling", icon: <Clock size={13} /> },
    { title: "Preview & Save", icon: <Eye size={13} /> },
  ];

  const handleNext = async () => {
    let fields = [];
    if (currentStep === 0) {
      fields = ["title", "message"];
    } else if (currentStep === 1) {
      fields = ["notificationType"];
    } else if (currentStep === 2) {
      fields = ["targetAudience"];
    } else if (currentStep === 3) {
      fields = ["stores"];
    } else if (currentStep === 4) {
      fields = ["sendOption", "scheduleTime"];
    }

    const isValid = await trigger(fields);
    if (isValid) {
      if (currentStep === 4) {
        if (watchChannels.includes("push")) setPreviewTab("push");
        else if (watchChannels.includes("sms")) setPreviewTab("sms");
        else if (watchChannels.includes("email")) setPreviewTab("email");
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

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

  const onFormSubmit = async (data) => {
    const status = data.sendOption === "now" ? "sent" : "scheduled";
    const payload = {
      title: data.title,
      message: data.message,
      notificationType: data.notificationType,
      targetAudience: data.targetAudience,
      stores: data.stores,
      scheduleTime: data.sendOption === "now" ? new Date().toISOString() : new Date(data.scheduleTime).toISOString(),
      status
    };

    const success = await onSubmit(notification._id, payload);
    if (success !== false) {
      reset();
      setCurrentStep(0);
      onClose();
    }
  };

  const getRecipientEstimate = () => {
    let base = 0;
    switch (watchAudience) {
      case "all": base = 12500; break;
      case "loyalty": base = 3500; break;
      case "new": base = 1800; break;
      case "inactive": base = 7200; break;
      default: base = 10000;
    }
    const storeCount = watchStores.length;
    const storeRatio = stores.length > 0 ? storeCount / stores.length : 1;
    return Math.round(base * (storeRatio || 1));
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
            <Sparkles className="text-[var(--primary)]" size={18} />
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-['Poppins']">
              Edit Notification Configuration
            </span>
          </div>
        }
        open={visible}
        onCancel={handleCancelRequest}
        footer={null}
        width={1200}
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
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-md"
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[380px]">
            
            {/* LEFT DETAILS FORM */}
            <div className={`${currentStep === 0 || currentStep === 5 ? "lg:col-span-7" : "lg:col-span-12"} space-y-6`}>
              
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                
                {/* STEP 1: CONTENT */}
                {currentStep === 0 && (
                  <div className="space-y-4 animate-fade-down">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Notification Title *</label>
                      <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            maxLength={100}
                            className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold transition-all ${
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
                        <label className="text-[10px] font-black uppercase text-zinc-400">Message Body *</label>
                        <span className="text-[9px] font-bold text-zinc-400">{watchMessage.length}/500</span>
                      </div>
                      <Controller
                        name="message"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={6}
                            maxLength={550}
                            className={`w-full p-3 text-xs rounded-lg border bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold resize-none transition-all ${
                              errors.message ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                            }`}
                          />
                        )}
                      />
                      {errors.message && (
                        <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={10} /> {errors.message.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: CHANNELS */}
                {currentStep === 1 && (
                  <div className="max-w-xl mx-auto space-y-5 animate-fade-down">
                    <div className="text-center mb-6">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase">Choose Dispatch Channels</h3>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">Select one or more marketing outlets to push your notice.</p>
                    </div>
                    
                    <Controller
                      name="notificationType"
                      control={control}
                      render={({ field }) => (
                        <Checkbox.Group
                          {...field}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
                        >
                          <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-[var(--primary)] transition-all ${
                            field.value.includes("push") ? "border-[var(--primary)] bg-orange-50/10" : "border-zinc-200 dark:border-zinc-800"
                          }`}>
                            <Checkbox value="push" />
                            <div className="text-left font-['Poppins']">
                              <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1"><Smartphone size={13} className="text-blue-500" /> Push App</h4>
                              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Mobile notification bar</p>
                            </div>
                          </label>

                          <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-[var(--primary)] transition-all ${
                            field.value.includes("sms") ? "border-[var(--primary)] bg-orange-50/10" : "border-zinc-200 dark:border-zinc-800"
                          }`}>
                            <Checkbox value="sms" />
                            <div className="text-left font-['Poppins']">
                              <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1"><Info size={13} className="text-emerald-500" /> SMS Text</h4>
                              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Direct SMS to phone numbers</p>
                            </div>
                          </label>

                          <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-[var(--primary)] transition-all ${
                            field.value.includes("email") ? "border-[var(--primary)] bg-orange-50/10" : "border-zinc-200 dark:border-zinc-800"
                          }`}>
                            <Checkbox value="email" />
                            <div className="text-left font-['Poppins']">
                              <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1"><Mail size={13} className="text-purple-500" /> E-mail</h4>
                              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Rich HTML layout letters</p>
                            </div>
                          </label>
                        </Checkbox.Group>
                      )}
                    />
                    {errors.notificationType && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 justify-center mt-2">
                        <AlertCircle size={10} /> {errors.notificationType.message}
                      </span>
                    )}
                  </div>
                )}

                {/* STEP 3: AUDIENCE */}
                {currentStep === 2 && (
                  <div className="max-w-3xl mx-auto space-y-6 animate-fade-down">
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase">Define Target Audience Segment</h3>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">Restrict message dispatch to specific consumer categories.</p>
                    </div>

                    <Controller
                      name="targetAudience"
                      control={control}
                      render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <div
                          onClick={() => field.onChange("all")}
                          className={`cursor-pointer border rounded-xl p-4 transition-all text-left flex flex-col items-start gap-1 justify-center ${
                            field.value === "all" 
                              ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)]" 
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-350 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-xs font-black text-slate-800 dark:text-white">📢 All Customers</span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed mt-1">Broadcast notice globally to all app clients.</span>
                        </div>

                        <div
                          onClick={() => field.onChange("loyalty")}
                          className={`cursor-pointer border rounded-xl p-4 transition-all text-left flex flex-col items-start gap-1 justify-center ${
                            field.value === "loyalty" 
                              ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)]" 
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-350 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-xs font-black text-amber-500">🏆 Loyalty Members</span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed mt-1">Send to members enrolled in active loyalty point tiers.</span>
                        </div>

                        <div
                          onClick={() => field.onChange("new")}
                          className={`cursor-pointer border rounded-xl p-4 transition-all text-left flex flex-col items-start gap-1 justify-center ${
                            field.value === "new" 
                              ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)]" 
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-350 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-xs font-black text-blue-500">✨ New Customers</span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed mt-1">Target users registered within the last 30 calendar days.</span>
                        </div>

                        <div
                          onClick={() => field.onChange("inactive")}
                          className={`cursor-pointer border rounded-xl p-4 transition-all text-left flex flex-col items-start gap-1 justify-center ${
                            field.value === "inactive" 
                              ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)]" 
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-350 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-xs font-black text-rose-500">⏳ Inactive Customers</span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed mt-1">Engage users who haven't ordered in the past 60 days.</span>
                        </div>
                      </div>
                    )}
                    />
                  </div>
                )}

                {/* STEP 4: STORES */}
                {currentStep === 3 && (
                  <div className="max-w-2xl mx-auto space-y-5 animate-fade-down">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Target Store Assignment *</label>
                      <button
                        type="button"
                        onClick={() => setValue("stores", stores.map(s => s._id), { shouldValidate: true, shouldDirty: true })}
                        className="text-[9px] font-black uppercase text-[var(--primary)] hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Select All Stores
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
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={stores.map((s) => ({
                            value: s._id,
                            label: s.name || s.storeName,
                          }))}
                          className="w-full text-xs font-semibold min-h-[38px] rounded-lg"
                        />
                      )}
                    />
                    {errors.stores && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.stores.message}
                      </span>
                    )}
                  </div>
                )}

                {/* STEP 5: SCHEDULING */}
                {currentStep === 4 && (
                  <div className="max-w-xl mx-auto space-y-6 animate-fade-down">
                    <div className="text-center">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Notification Release Timing</h3>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">Decide whether to dispatch this notice immediately or schedule it for a future date.</p>
                    </div>

                    <Controller
                      name="sendOption"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-4 w-full">
                          <div
                            onClick={() => field.onChange("now")}
                            className={`cursor-pointer h-16 border rounded-xl flex flex-col items-center justify-center font-black text-xs uppercase transition-all ${
                              field.value === "now" 
                                ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)] text-[var(--primary)]" 
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 hover:border-zinc-350 dark:hover:border-zinc-700"
                            }`}
                          >
                            ⚡ Dispatch Immediately
                          </div>
                          <div
                            onClick={() => field.onChange("later")}
                            className={`cursor-pointer h-16 border rounded-xl flex flex-col items-center justify-center font-black text-xs uppercase transition-all ${
                              field.value === "later" 
                                ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)] text-[var(--primary)]" 
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 hover:border-zinc-350 dark:hover:border-zinc-700"
                            }`}
                          >
                            📅 Schedule for Later
                          </div>
                        </div>
                      )}
                    />

                    {watchSendOption === "later" && (
                      <div className="flex flex-col gap-1.5 animate-fade-down">
                        <label className="text-[10px] font-black uppercase text-zinc-400">Target Date & Time *</label>
                        <Controller
                          name="scheduleTime"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="datetime-local"
                              className={`px-3 py-2 text-xs rounded-lg border bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold h-[34px] cursor-pointer ${
                                errors.scheduleTime ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                              }`}
                            />
                          )}
                        />
                        {errors.scheduleTime && (
                          <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                            <AlertCircle size={10} /> {errors.scheduleTime.message}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 6: PREVIEW AND DISPATCH */}
                {currentStep === 5 && (
                  <div className="space-y-5 animate-fade-down">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5"><Eye size={14} className="text-[var(--primary)]" /> Configuration Summary</h3>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-[10px] font-semibold text-zinc-500">
                        <div>
                          <span className="block text-[8px] font-black text-zinc-400 uppercase">Target Segment:</span>
                          <span className="text-slate-800 dark:text-zinc-250 capitalize">{watchAudience} customers</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-zinc-400 uppercase">Visible Outlets:</span>
                          <span className="text-slate-800 dark:text-zinc-250">
                            {watchStores.length === stores.length ? "All stores (Nationwide)" : `${watchStores.length} franchise outlets`}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-zinc-400 uppercase">Release Schedule:</span>
                          <span className="text-slate-800 dark:text-zinc-250">
                            {watchSendOption === "now" ? "Immediate dispatch" : dayjs(watchScheduleTime).format("DD MMM YYYY, hh:mm A")}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-zinc-400 uppercase">Estimated Reach:</span>
                          <span className="text-emerald-600 font-bold">{getRecipientEstimate().toLocaleString("en-IN")} Recipients</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-1">
                      {watchChannels.includes("push") && (
                        <button
                          type="button"
                          onClick={() => setPreviewTab("push")}
                          className={`py-1.5 px-3 border-0 bg-transparent text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            previewTab === "push" ? "text-blue-500 border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-650"
                          }`}
                        >
                          Push Notification
                        </button>
                      )}
                      {watchChannels.includes("sms") && (
                        <button
                          type="button"
                          onClick={() => setPreviewTab("sms")}
                          className={`py-1.5 px-3 border-0 bg-transparent text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            previewTab === "sms" ? "text-emerald-500 border-b-2 border-emerald-500" : "text-zinc-400 hover:text-zinc-650"
                          }`}
                        >
                          SMS Text
                        </button>
                      )}
                      {watchChannels.includes("email") && (
                        <button
                          type="button"
                          onClick={() => setPreviewTab("email")}
                          className={`py-1.5 px-3 border-0 bg-transparent text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            previewTab === "email" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400 hover:text-zinc-650"
                          }`}
                        >
                          HTML E-mail
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="flex justify-between items-center pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-8">
                  <button
                    type="button"
                    disabled={currentStep === 0}
                    onClick={handlePrev}
                    className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                        className="px-5 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg bg-[var(--primary)] hover:opacity-90 text-white border-0 cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-205 flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          "Save Configurations"
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* RIGHT SIDE PREVIEW PANEL */}
            {(currentStep === 0 || currentStep === 5) && (
              <div className="lg:col-span-5 border-l border-zinc-150 dark:border-zinc-805 lg:pl-8 flex flex-col justify-center items-center">
                <span className="text-[9px] font-black uppercase text-zinc-400 mb-3 flex items-center gap-1"><Monitor size={12} /> Live preview mockups</span>
                
                {/* Phone Frame */}
                <div className="w-[280px] h-[480px] border-[8px] border-zinc-900 dark:border-zinc-800 rounded-[32px] bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden flex flex-col shadow-lg">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-900 rounded-b-xl z-20 flex items-center justify-center">
                    <span className="w-10 h-1 bg-zinc-700 rounded-full"></span>
                  </div>

                  {(currentStep === 0 || (currentStep === 5 && previewTab === "push")) && (
                    <div className="w-full h-full pt-16 px-4 flex flex-col justify-between pb-8 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=600&fit=crop')] bg-cover relative text-white font-['Poppins']">
                      <div className="text-center space-y-0.5">
                        <span className="text-3xl font-light">12:30</span>
                        <span className="block text-[8px] font-extrabold uppercase tracking-wide opacity-80">Tuesday, 23 June</span>
                      </div>

                      <div className="bg-black/45 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-lg mt-2 text-[10px] space-y-1 transform scale-100 animate-fade-down duration-300">
                        <div className="flex justify-between items-center border-b border-white/10 pb-1 text-[8.5px]">
                          <span className="font-black text-[var(--primary)] uppercase flex items-center gap-1">🍕 Papa Veg Pizza</span>
                          <span className="opacity-60 font-semibold">now</span>
                        </div>
                        <h4 className="font-extrabold text-[10px] leading-tight text-white">{watchTitle || "No Title entered yet"}</h4>
                        <p className="text-[9px] opacity-90 leading-snug line-clamp-3 text-zinc-100">{watchMessage || "Type message body in step 1 to preview..."}</p>
                      </div>

                      <span className="text-center text-[7.5px] font-extrabold tracking-wider opacity-60 uppercase mt-auto">Swipe Up to Open</span>
                    </div>
                  )}

                  {currentStep === 5 && previewTab === "sms" && (
                    <div className="w-full h-full pt-6 flex flex-col bg-zinc-100 dark:bg-zinc-950 font-['Poppins'] text-[10px] text-zinc-700 dark:text-zinc-350">
                      <div className="bg-white dark:bg-zinc-900 py-2.5 px-3 border-b border-zinc-200 dark:border-zinc-800 text-center font-bold text-[9px] shrink-0">
                        <span className="block text-zinc-400 uppercase text-[7px] font-black">Conversation with:</span>
                        <span className="text-slate-900 dark:text-white uppercase font-black tracking-wider">VP-PVPZZA</span>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-end">
                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl rounded-bl-xs border border-zinc-200 dark:border-zinc-805 max-w-[85%] shadow-xs space-y-1.5 self-start text-[9.5px]">
                          <p className="leading-relaxed whitespace-pre-line text-slate-800 dark:text-zinc-200">
                            {watchMessage ? `ALERT: ${watchTitle}\n\n${watchMessage}` : "No message."}
                          </p>
                          <span className="block text-[7px] text-zinc-400 font-extrabold text-right uppercase">delivered</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && previewTab === "email" && (
                    <div className="w-full h-full pt-6 flex flex-col bg-white dark:bg-zinc-900 text-zinc-800 font-['Poppins'] overflow-y-auto scrollbar-none text-[9px]">
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-805 space-y-1 shrink-0 text-[8px] bg-zinc-50 dark:bg-zinc-950 font-semibold text-zinc-500">
                        <div><span className="text-zinc-400">From:</span> Papa Veg Pizza &lt;promotions@papaveg.com&gt;</div>
                        <div><span className="text-zinc-400">Subject:</span> <span className="font-extrabold text-slate-805 dark:text-zinc-200">{watchTitle || "Enter subject"}</span></div>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="text-center border-b border-zinc-100 dark:border-zinc-805 pb-3">
                          <span className="text-xs font-black tracking-wider text-[var(--primary)] uppercase">Papa Veg Pizza</span>
                        </div>

                        <div className="h-20 rounded-lg overflow-hidden bg-zinc-150 relative">
                          <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=200&fit=crop" alt="Pizza" className="w-full h-full object-cover" />
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-[10px] font-black text-slate-900 dark:text-white leading-tight">{watchTitle}</h2>
                          <p className="text-[9px] text-zinc-550 dark:text-zinc-450 leading-relaxed font-semibold">{watchMessage}</p>
                        </div>

                        <div className="text-center py-2">
                          <button type="button" className="bg-[var(--primary)] border-0 text-white text-[8px] font-black uppercase py-1.5 px-4 rounded-lg cursor-pointer hover:opacity-90 shadow-sm">
                            Order Online Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>
      </Modal>

      {/* Discard changes alert warning */}
      <Modal
        title={
          <span className="text-xs font-black uppercase text-zinc-850 dark:text-zinc-100 font-['Poppins']">
            ⚠️ Discard Unsaved Edits?
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
        <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed font-['Poppins']">
          You have modified notifications settings. Closing this dialog will discard all your edits. Are you sure you want to discard changes?
        </p>
      </Modal>
    </>
  );
}
