import React, { useState, useEffect } from "react";
import { Modal, Checkbox, Radio, Input } from "antd";
import { MessageSquare, Bell, Mail, Smartphone } from "lucide-react";

const { TextArea } = Input;

export default function CustomerNotificationModal({ visible, onClose, order, onConfirm }) {
  const [channels, setChannels] = useState(["sms", "whatsapp"]);
  const [selectedTemplate, setSelectedTemplate] = useState("delay");
  const [customMessage, setCustomMessage] = useState("");

  const templates = {
    delay: "Your order is taking slightly longer than expected.",
    volume: "We are experiencing high order volume.",
    fresh: "Your pizza is being freshly prepared.",
    apology: "We apologize for the inconvenience."
  };

  useEffect(() => {
    if (order) {
      setChannels(["sms", "whatsapp"]);
      setSelectedTemplate("delay");
      setCustomMessage("");
    }
  }, [order, visible]);

  if (!order) return null;

  const getFinalMessage = () => {
    if (selectedTemplate === "custom") {
      return customMessage || "...Type your custom message below...";
    }
    return templates[selectedTemplate] || "";
  };

  const handleConfirm = () => {
    if (channels.length === 0) return;
    const finalMsg = getFinalMessage();
    onConfirm({
      orderId: order._id,
      channels,
      message: finalMsg
    });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <MessageSquare size={18} className="text-[var(--primary)]" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Notify Customer</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Send status alerts regarding order delays
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={440}
      centered
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={channels.length === 0 || (selectedTemplate === "custom" && !customMessage.trim())}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              channels.length > 0 && (selectedTemplate !== "custom" || customMessage.trim())
                ? "bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)]"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            Notify Customer
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Customer Details info */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">{order.customer.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{order.customer.phone}</p>
          </div>
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-555 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
            Order #{order.orderNumber}
          </span>
        </div>

        {/* Channels Checkbox Group */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">
            Notification Channels
          </label>
          <Checkbox.Group
            value={channels}
            onChange={(checkedValues) => setChannels(checkedValues)}
            className="flex flex-wrap gap-3 font-bold"
          >
            <Checkbox value="sms">
              <span className="flex items-center gap-1.5 text-xs">
                <Smartphone size={12} className="text-slate-400" /> SMS
              </span>
            </Checkbox>
            <Checkbox value="whatsapp">
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <MessageSquare size={12} /> WhatsApp
              </span>
            </Checkbox>
            <Checkbox value="push">
              <span className="flex items-center gap-1.5 text-xs">
                <Bell size={12} className="text-slate-400" /> Push Notification
              </span>
            </Checkbox>
            <Checkbox value="email">
              <span className="flex items-center gap-1.5 text-xs">
                <Mail size={12} className="text-slate-400" /> Email
              </span>
            </Checkbox>
          </Checkbox.Group>
        </div>

        {/* Template selections */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">
            Select Template Message
          </label>
          <Radio.Group
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full flex flex-col gap-2 font-bold"
          >
            <Radio value="delay">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-300">
                {templates.delay}
              </span>
            </Radio>
            <Radio value="volume">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-300">
                {templates.volume}
              </span>
            </Radio>
            <Radio value="fresh">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-300">
                {templates.fresh}
              </span>
            </Radio>
            <Radio value="apology">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-300">
                {templates.apology}
              </span>
            </Radio>
            <Radio value="custom">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-300">Custom Message...</span>
            </Radio>
          </Radio.Group>
        </div>

        {/* Custom Message Textbox */}
        {selectedTemplate === "custom" && (
          <div className="space-y-1 animate-fadeIn duration-200">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">
              Custom Message
            </label>
            <TextArea
              placeholder="Write your custom alert message here..."
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="text-xs"
            />
          </div>
        )}

        {/* Live Preview Panel */}
        <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-555 block uppercase tracking-wider">
            Live Preview
          </span>
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 p-2.5 rounded-xl text-slate-700 dark:text-zinc-300 italic min-h-[50px] leading-relaxed break-words font-medium text-[11px]">
            {getFinalMessage()}
          </div>
        </div>
      </div>
    </Modal>
  );
}
